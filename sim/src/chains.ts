import type { Content, Recipe } from '@bramo/shared';
import { PLOT_HOUR_AS_SEC } from './rules.js';

/** Récolte d'une parcelle d'Agriculture (fichier plots.yaml d'une proposition). */
export interface Crop {
  item: string;
  level: number;
  growthHours: number;
  yield: number;
  xpPerHarvest: number;
}

export interface ChainCost {
  /** Secondes d'activité (en vitesse de base) par métier. */
  labor: Record<string, number>;
  /** Parcelle·heures d'Agriculture (la culture pousse sans occuper l'activité). */
  plotHours: number;
  /** Or dépensé chez un marchand PNJ pour ce qui n'a pas de recette. */
  gold: number;
  /** XP gagnée par métier en fabriquant soi-même toute la chaîne. */
  xp: Record<string, number>;
  /** Niveau minimal requis par métier pour tout faire soi-même. */
  levels: Record<string, number>;
  /** Recettes distinctes à lancer (autant d'activités à mettre en file). */
  steps: Set<string>;
  /** Sous-produits obtenus en chemin (écorce, viande…). */
  byproducts: Record<string, number>;
}

export interface ChainOptions {
  crops?: Crop[];
  /** Multiplicateur de vitesse par métier (outils, repas). 1 par défaut. */
  speed?: (profession: string) => number;
}

const empty = (): ChainCost => ({ labor: {}, plotHours: 0, gold: 0, xp: {}, levels: {}, steps: new Set(), byproducts: {} });

function addScaled(into: ChainCost, from: ChainCost, k: number): void {
  for (const [p, s] of Object.entries(from.labor)) into.labor[p] = (into.labor[p] ?? 0) + s * k;
  for (const [p, x] of Object.entries(from.xp)) into.xp[p] = (into.xp[p] ?? 0) + x * k;
  for (const [p, l] of Object.entries(from.levels)) into.levels[p] = Math.max(into.levels[p] ?? 0, l);
  for (const [i, q] of Object.entries(from.byproducts)) into.byproducts[i] = (into.byproducts[i] ?? 0) + q * k;
  for (const s of from.steps) into.steps.add(s);
  into.plotHours += from.plotHours * k;
  into.gold += from.gold * k;
}

export function totalLabor(c: ChainCost): number {
  return Object.values(c.labor).reduce((a, b) => a + b, 0);
}

/** Temps de travail, parcelles comprises (une parcelle·heure = PLOT_HOUR_AS_SEC). */
export function workSec(c: ChainCost): number {
  return totalLabor(c) + c.plotHours * PLOT_HOUR_AS_SEC;
}

/**
 * Coût complet d'une unité d'objet pour un joueur qui fait tout lui-même.
 * Une recette à plusieurs sorties est payée entièrement par l'objet demandé (les autres sont des sous-produits) :
 * c'est ce que vit un joueur autonome qui coupe du bois pour avoir de l'écorce.
 * S'il existe plusieurs façons d'obtenir un objet, la moins coûteuse en temps est retenue.
 */
export function unitCost(itemId: string, content: Content, opts: ChainOptions = {}, stack: string[] = []): ChainCost {
  if (stack.includes(itemId)) throw new Error(`Dépendance circulaire : ${[...stack, itemId].join(' → ')}`);
  const crop = opts.crops?.find((c) => c.item === itemId);
  if (crop) {
    const c = empty();
    c.plotHours = crop.growthHours / crop.yield;
    c.xp.agriculture = crop.xpPerHarvest / crop.yield;
    c.levels.agriculture = crop.level;
    c.steps.add(`parcelle:${itemId}`);
    return c;
  }
  const producers = Object.values(content.recipes).filter((r) => !r.trial && r.outputs.some((o) => o.item === itemId));
  const item = content.items[itemId];
  const options: ChainCost[] = producers.map((r) => recipeCost(r, itemId, content, opts, [...stack, itemId]));
  // Le marchand PNJ ne sert que s'il n'existe aucune recette (ex. le poisson tant que la Pêche n'a pas de recette).
  if (item?.shopPrice && !options.length) {
    const c = empty();
    c.gold = item.shopPrice;
    options.push(c);
  }
  if (!options.length) throw new Error(`Aucune source pour ${itemId}`);
  // Le temps prime ; à temps égal (achat), l'or départage.
  return options.sort((a, b) => workSec(a) - workSec(b) || a.gold - b.gold)[0]!;
}

function recipeCost(r: Recipe, itemId: string, content: Content, opts: ChainOptions, stack: string[]): ChainCost {
  const qty = r.outputs.find((o) => o.item === itemId)!.qty;
  const c = empty();
  const speed = opts.speed?.(r.profession) ?? 1;
  c.labor[r.profession] = r.durationSec / speed / qty;
  c.xp[r.profession] = r.xp / qty;
  c.levels[r.profession] = r.level;
  c.steps.add(r.id);
  for (const o of r.outputs) if (o.item !== itemId) c.byproducts[o.item] = o.qty / qty;
  for (const i of r.inputs) addScaled(c, unitCost(i.item, content, opts, stack), i.qty / qty);
  return c;
}

/** Coût d'un ensemble d'objets (une tenue complète, un lot de flèches…). */
export function bundleCost(items: Record<string, number>, content: Content, opts: ChainOptions = {}): ChainCost {
  const c = empty();
  for (const [id, q] of Object.entries(items)) addScaled(c, unitCost(id, content, opts), q);
  return c;
}

export interface ConsumableRatio {
  item: string;
  name: string;
  bonus: number;
  durationMin: number;
  /** Secondes de fabrication de la dernière étape (Cuisine seule). */
  craftSec: number;
  /** Secondes de toute la chaîne, ingrédients compris. */
  chainSec: number;
  gold: number;
  /** Heures de bonus par heure de fabrication de la dernière étape. */
  bonusHoursPerCraftHour: number;
  /** Heures de bonus par heure de chaîne complète. */
  bonusHoursPerChainHour: number;
  /** Rendement net pour un joueur autonome : production gagnée / temps de chaîne (>1 = rentable). */
  payback: number;
}

/** Rapport bonus / coût de chaque repas. */
export function consumableRatios(content: Content, opts: ChainOptions = {}): ConsumableRatio[] {
  const out: ConsumableRatio[] = [];
  for (const item of Object.values(content.items)) {
    if (!item.meal) continue;
    const recipe = Object.values(content.recipes).find((r) => !r.trial && r.outputs.some((o) => o.item === item.id));
    if (!recipe) continue;
    const cost = unitCost(item.id, content, opts);
    const chainSec = workSec(cost);
    const durationSec = item.meal.durationMin * 60;
    out.push({
      item: item.id,
      name: item.name,
      bonus: item.meal.bonus,
      durationMin: item.meal.durationMin,
      craftSec: recipe.durationSec / (recipe.outputs.find((o) => o.item === item.id)!.qty),
      chainSec,
      gold: cost.gold,
      bonusHoursPerCraftHour: durationSec / recipe.durationSec,
      bonusHoursPerChainHour: durationSec / chainSec,
      payback: (item.meal.bonus * durationSec) / chainSec,
    });
  }
  return out;
}

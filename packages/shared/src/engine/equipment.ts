import type { Content } from '../schemas/content.js';
import type { GearInstance, GearLine, GearModel, Rarity, RolledLine } from '../schemas/gear.js';
import { GameError } from './state.js';
import { type RefineCost, honeCost, honeableLines, rankCost, rankedStats, rerollCost, rerollableLines, salvageYield } from './refine.js';
import { type StatEffect, gearEffects } from '../combat/sheet.js';

/** Tirage aléatoire uniforme dans [0, 1) (injecté : le serveur donne Math.random, les tests une suite fixe). */
export type Rng = () => number;

const round1 = (n: number) => Math.round(n * 10) / 10;

/** Palier de l'objet → coefficient des lignes aléatoires (gear_pools.yaml). */
export function tierScale(model: GearModel, content: Content): number {
  return content.gearPools.tierScale[String(model.tier)] ?? 1;
}

/** Lignes aléatoires possibles pour ce modèle, avec leur plage selon le palier. */
export function lineRange(model: GearModel, content: Content): GearLine[] {
  const k = tierScale(model, content);
  return (content.gearPools.pools[model.slot] ?? []).map((l) => ({ name: l.name, min: round1(l.min * k), max: round1(l.max * k) }));
}

/**
 * Chance qu'une fabrication soit un chef-d'œuvre : monte avec l'avance de l'artisan sur la recette, bornée.
 * `settings.gear.masterpiece` : X à fixer quand on connaîtra le nombre de fabrications par jour.
 */
export function masterpieceChance(craftLevel: number, recipeLevel: number, content: Content): number {
  const { chanceMin, chanceMax, gapForMax } = content.settings.gear.masterpiece;
  const gap = Math.max(0, craftLevel - recipeLevel);
  return chanceMin + (chanceMax - chanceMin) * Math.min(1, gap / gapForMax);
}

export interface RollOptions {
  /** Chef-d'œuvre : le nombre de lignes est le maximum du modèle, toutes au jet max, plus une ligne bonus. */
  masterpiece?: boolean;
  /** Chef-d'œuvre seulement : lignes choisies par l'artisan (noms) ; sinon tirées au hasard. */
  chosen?: string[];
}

/** Tire les lignes aléatoires d'un exemplaire. */
export function rollLines(model: GearModel, content: Content, rand: Rng, options: RollOptions = {}): RolledLine[] {
  const pool = lineRange(model, content);
  const [lo, hi] = model.rolls;
  const count = options.masterpiece ? hi : lo + Math.floor(rand() * (hi - lo + 1));
  const left = [...pool];
  const take = (name?: string): GearLine | undefined => {
    let i = name ? left.findIndex((l) => l.name === name) : -1;
    if (i < 0) i = Math.floor(rand() * left.length);
    return left.splice(i, 1)[0];
  };
  const out: RolledLine[] = [];
  const chosen = options.masterpiece ? (options.chosen ?? []) : [];
  for (let n = 0; n < count && left.length; n++) {
    const line = take(chosen[n]);
    if (!line) break;
    out.push({ name: line.name, min: line.min, max: line.max, value: options.masterpiece ? line.max : round1(line.min + rand() * (line.max - line.min)) });
  }
  if (options.masterpiece && left.length) {
    const bonus = take();
    if (bonus) out.push({ name: bonus.name, min: bonus.min, max: bonus.max, value: bonus.max, bonus: true });
  }
  return out;
}

/** Crée un exemplaire (le serveur lui donne ensuite son identifiant). */
export function newInstance(model: GearModel, content: Content, rand: Rng, options: RollOptions & { signedBy?: string | null; id?: number } = {}): GearInstance {
  return {
    id: options.id ?? 0,
    model: model.id,
    lines: rollLines(model, content, rand, options),
    masterpiece: !!options.masterpiece,
    signedBy: options.signedBy ?? null,
    gem: null,
    wear: 0,
    equipped: null,
  };
}

export const isWorn = (g: GearInstance, content: Content): boolean => g.wear >= content.settings.gear.lifeHours * 3_600_000;

/** Un exemplaire se porte avec la classe de son style ; les bijoux sont universels. */
export function canWear(model: GearModel, classId: string | null): boolean {
  return !!classId && model.classes.includes(classId);
}

function find(items: GearInstance[], id: number): GearInstance {
  const g = items.find((x) => x.id === id);
  if (!g) throw new GameError('unknown_gear', 'Objet introuvable.');
  return g;
}

/** Équipe un exemplaire. L'emplacement plein (deux anneaux au plus) rend sa place au premier porté. Renvoie la liste modifiée. */
export function equipGear(input: GearInstance[], id: number, classId: string | null, content: Content): GearInstance[] {
  const items = structuredClone(input);
  const g = find(items, id);
  const model = content.gearModels[g.model];
  if (!model) throw new GameError('unknown_model', 'Modèle inconnu.');
  if (!canWear(model, classId)) throw new GameError('wrong_class_gear', 'Cet objet n’est pas du style de votre classe.');
  if (g.equipped) return items;
  const capacity = content.gearSlots[model.slot]?.capacity ?? 1;
  const inSlot = items.filter((x) => x.equipped === model.slot);
  if (inSlot.length >= capacity) inSlot.sort((a, b) => a.id - b.id)[0]!.equipped = null;
  g.equipped = model.slot;
  return items;
}

export function unequipGear(input: GearInstance[], id: number): GearInstance[] {
  const items = structuredClone(input);
  find(items, id).equipped = null;
  return items;
}

/** Une pièce portée qui n'est plus du style de la classe (changement de classe) retourne au sac. */
export function dropMismatched(input: GearInstance[], classId: string | null, content: Content): GearInstance[] {
  // Un modèle retiré des données retourne au sac lui aussi.
  return input.map((g) => {
    const m = content.gearModels[g.model];
    return g.equipped && (!m || !canWear(m, classId)) ? { ...g, equipped: null } : g;
  });
}

export interface SetProgress {
  id: string;
  name: string;
  pieces: number;
  /** Bonus actifs : 2, 3 et/ou 4 pièces portées. */
  active: { pieces: number; text: string }[];
}

export interface GearTotals {
  /** Lignes fixes cumulées (Vitalité, Défense…), des seules pièces portées et non usées. */
  stats: Record<string, number>;
  /** Lignes aléatoires cumulées par nom, en %. */
  lines: Record<string, number>;
  sets: SetProgress[];
}

/** Ce que l'équipement porté apporte : une pièce usée ne compte plus. */
export function gearTotals(items: GearInstance[], content: Content): GearTotals {
  const stats: Record<string, number> = {};
  const lines: Record<string, number> = {};
  const setPieces: Record<string, number> = {};
  for (const g of items) {
    if (!g.equipped) continue;
    const model = content.gearModels[g.model];
    if (!model || isWorn(g, content)) continue;
    for (const s of rankedStats(model, g.rank, content)) stats[s.stat] = (stats[s.stat] ?? 0) + s.value;
    for (const l of g.lines) lines[l.name] = round1((lines[l.name] ?? 0) + l.value);
    if (model.set) setPieces[model.set] = (setPieces[model.set] ?? 0) + 1;
  }
  const sets = Object.entries(setPieces).map(([id, pieces]) => {
    const set = content.gearSets[id]!;
    const active = [2, 3, 4].filter((n) => pieces >= n).map((n) => ({ pieces: n, text: set.bonuses[n - 2]! }));
    return { id, name: set.name, pieces, active };
  });
  return { stats, lines, sets };
}

export interface GearItemView {
  id: number;
  model: string;
  name: string;
  rarity: Rarity;
  slot: string;
  tier: number;
  family: string;
  material: string;
  stats: { stat: string; value: number }[];
  lines: RolledLine[];
  socket: string;
  set: string | null;
  conditional: string | null;
  masterpiece: boolean;
  signedBy: string | null;
  worn: boolean;
  /** Part d'usure, de 0 à 1. */
  wearShare: number;
  equipped: string | null;
  /** Peut être porté par la classe actuelle. */
  wearable: boolean;
  /** Classes qui peuvent le porter (pour composer un préréglage d'une autre classe). */
  classes: string[];
  /** Liée au personnage (set de départ) : ne se vend ni ne s'échange. */
  bound: boolean;
  /** Peut recevoir une gemme (arme, torse, tête, collier, avec un chaton), et celle qui est sertie (son objet). */
  gemSlot: boolean;
  gem: string | null;
  /** En vitrine au marché à ce prix, ou null. */
  price: number | null;
  /** Fabriquée par le métier (atelier) : sa recette existe. */
  craftable: boolean;
  /** Rang d'affinage (+N) et services de l'Affineur : coût du prochain rang et du prochain affûtage (null : impossible). */
  rank: number;
  rankCost: RefineCost | null;
  honeCost: RefineCost | null;
  /** Lignes qui peuvent encore s'affûter (index dans lines). */
  honeable: number[];
  /** Objet nommé (talent propre) : gardé au démontage en lot. */
  named: boolean;
  /** Ce que ses statistiques fixes changent vraiment au combat (« ≈ +3,1 % de chance de critique »), pour ce personnage. */
  effects: StatEffect[];
  /** Poussière que donnerait son démontage (null : portée, en vitrine, de départ). */
  salvage: { item: string; qty: number } | null;
  /** Retaille : coût de la prochaine (null : impossible), lignes retaillables, propositions en attente du choix. */
  rerollCost: RefineCost | null;
  rerollable: number[];
  rerollLine: number | null;
  rerollOffer: RolledLine[] | null;
}

/** Emplacements des places de talent majeur (docs/design/coherence/build.md §2) : là où une gemme se sertit. */
export const GEM_SLOTS = ['weapon', 'torso', 'head', 'necklace'];

/**
 * Une pièce peut-elle recevoir une gemme de situation ? Toute pièce d'une des quatre places majeures, même de départ : la
 * gemme sert au premier mur (la Mère Grise). Le champ `socket` du catalogue servira aux gemmes de build.
 */
export const canHoldGem = (m: { slot: string }) => GEM_SLOTS.includes(m.slot);

/** L'objet du sac qui correspond à une gemme sertie (l'outil `gem` d'un objet). */
export const gemItemOf = (tool: string, content: Content) => Object.values(content.items).find((i) => i.gem === tool)?.id ?? null;

/**
 * Sertir une gemme du sac dans une pièce (ou la remplacer : l'ancienne revient au sac). Pur : renvoie les exemplaires
 * modifiés et les objets à retirer et à rendre au sac.
 */
export function socketGem(items: GearInstance[], id: number, itemId: string, content: Content): { items: GearInstance[]; take: string; give: string | null } {
  const g = items.find((x) => x.id === id);
  if (!g) throw new GameError('unknown_gear', 'Objet introuvable.');
  const m = content.gearModels[g.model];
  if (!m || !canHoldGem(m)) throw new GameError('no_socket', 'Cette pièce n’a pas de chaton : une gemme se sertit dans l’arme, le torse, la tête ou le collier.');
  const tool = content.items[itemId]?.gem;
  if (!tool) throw new GameError('not_gem', 'Cet objet ne se sertit pas.');
  if (g.gem === tool) throw new GameError('same_gem', 'Cette gemme est déjà sertie ici.');
  return { items: items.map((x) => (x.id === id ? { ...x, gem: tool } : x)), take: itemId, give: g.gem ? gemItemOf(g.gem, content) : null };
}

/** Retirer la gemme d'une pièce : elle revient au sac. */
export function unsocketGem(items: GearInstance[], id: number, content: Content): { items: GearInstance[]; give: string } {
  const g = items.find((x) => x.id === id);
  if (!g?.gem) throw new GameError('no_gem', 'Aucune gemme sertie ici.');
  const give = gemItemOf(g.gem, content);
  if (!give) throw new GameError('unknown_gem', 'Gemme inconnue.');
  return { items: items.map((x) => (x.id === id ? { ...x, gem: null } : x)), give };
}

export interface GearView {
  items: GearItemView[];
  totals: GearTotals;
}

export function viewGear(items: GearInstance[], classId: string | null, content: Content): GearView {
  const life = content.settings.gear.lifeHours * 3_600_000;
  const effects = gearEffects(items, content);
  const views: GearItemView[] = [];
  for (const g of items) {
    const m = content.gearModels[g.model];
    if (!m) continue;
    views.push({
      id: g.id,
      model: m.id,
      name: m.name,
      rarity: m.rarity,
      slot: m.slot,
      tier: m.tier,
      family: m.family,
      material: m.material,
      stats: rankedStats(m, g.rank, content),
      lines: g.lines,
      socket: m.socket,
      set: m.set ?? null,
      conditional: m.conditional ?? null,
      masterpiece: g.masterpiece,
      signedBy: g.signedBy,
      worn: isWorn(g, content),
      wearShare: Math.min(1, g.wear / life),
      equipped: g.equipped,
      wearable: canWear(m, classId),
      classes: m.classes,
      bound: !!m.bound,
      gemSlot: canHoldGem(m),
      gem: g.gem ? gemItemOf(g.gem, content) : null,
      price: g.price ?? null,
      craftable: m.source.includes('craft') && !m.set && !m.talent && !m.starter,
      rank: g.rank ?? 0,
      rankCost: rankCost(g, content),
      honeCost: honeCost(g, content),
      honeable: honeableLines(g),
      named: !!m.named || !!m.talent,
      effects: effects[g.id] ?? [],
      salvage: salvageYield(g, content),
      rerollCost: rerollCost(g, content),
      rerollable: rerollableLines(g, content),
      rerollLine: g.rerollLine ?? null,
      rerollOffer: g.rerollOffer?.length ? g.rerollOffer : null,
    });
  }
  return { items: views, totals: gearTotals(items, content) };
}

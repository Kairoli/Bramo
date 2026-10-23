/**
 * Ce que porte un combattant, ramené au moteur : statistiques venues de l'équipement (étape 5a) et budget unique des
 * talents (gemmes majeures, nommés, ensembles, outils de situation). Fonctions pures ; le moteur ne lit que `stats`,
 * `talents` et `tools` de `CombatantSetup`.
 */
import type { CombatRules, Element, GearStatsConversion, LineEffect, Talent, TalentCatalog, TalentMods, Tool } from '../schemas/combat.js';
import type { CombatStats } from './engine.js';

/** Lignes fixes cumulées par statistique (`vitality`, `defense`…) et lignes aléatoires par libellé (en %). */
export interface GearTotalsLike {
  stats: Record<string, number>;
  lines: Record<string, number>;
}

/** K du palier du porteur : la plus haute clé de palier au plus égale à son niveau (la plus basse sinon). */
export function tierK(k: Record<string, number>, level: number): number {
  const tiers = Object.keys(k).map(Number).sort((a, b) => a - b);
  const tier = [...tiers].reverse().find((x) => x <= level) ?? tiers[0]!;
  return k[String(tier)]!;
}

/** Libellés de lignes aléatoires absents de la conversion ou marqués sans effet en combat. */
export function deadLines(conv: GearStatsConversion, lines: Record<string, number>): string[] {
  return Object.keys(lines).filter((name) => (conv.lines[name] ?? 'none') === 'none');
}

/**
 * Statistiques de combat d'un équipement porté. Sans conversion (`rules.gearStats` absent), les statistiques de référence.
 * `mods` : scores de Défense et de Cadence d'un ensemble (`defenseScore`, `hasteScore`), appliqués avant conversion.
 */
export function statsFromGear(rules: CombatRules, totals: GearTotalsLike, level: number, mods: TalentMods = {}): CombatStats {
  const conv = rules.gearStats;
  if (!conv) return { ...rules.referenceStats };
  const line: Partial<Record<LineEffect, number>> = {};
  for (const [name, value] of Object.entries(totals.lines)) {
    const effect = (conv.lines[name] ?? 'none') as LineEffect;
    line[effect] = (line[effect] ?? 0) + value / 100;
  }
  const tier = conv.tiers ? tierK(Object.fromEntries(Object.entries(conv.tiers).map(([k]) => [k, Number(k)])), level) : null;
  const curve = tier === null ? { norm: 1, factor: 1 } : conv.tiers![String(tier)]!;
  const raw = (s: string) => (totals.stats[s] ?? 0) * curve.norm;
  const ratio = (score: number, r: { cap: number; k: Record<string, number> }) => (score > 0 ? (r.cap * score) / (score + tierK(r.k, level)) : 0);
  const defense = raw('defense') * (1 + (mods.defenseScore ?? 0));
  const haste = raw('haste') * (1 + (mods.hasteScore ?? 0));
  const elementDamage: Partial<Record<Element, number>> = {};
  for (const el of ['physical', 'fire', 'frost', 'lightning'] as const) if (line[el]) elementDamage[el] = line[el];
  return {
    power: (conv.power.base + raw('power') * conv.power.perPoint) * curve.factor * (1 + (line.power ?? 0)),
    maxHp: (conv.maxHp.base + raw('vitality') * conv.maxHp.perPoint + raw('defense') * (conv.maxHp.perDefense ?? 0)) * curve.factor * (1 + (line.maxHp ?? 0)),
    damageReduction: Math.min(conv.defense.cap, ratio(defense, conv.defense) + (line.damageReduction ?? 0)),
    critChance: Math.min(rules.caps.critChance, conv.crit.base + ratio(raw('crit'), conv.crit) + (line.critChance ?? 0)),
    critMultiplier: conv.critMultiplier + (line.critMultiplier ?? 0),
    haste: conv.haste.base + Math.min(conv.haste.cap, ratio(haste, conv.haste) + (line.haste ?? 0)),
    ...(line.penetration ? { penetration: line.penetration } : {}),
    ...(Object.keys(elementDamage).length ? { elementDamage } : {}),
    ...(line.startShield ? { startShield: { share: line.startShield, duration: conv.startShieldDuration } } : {}),
  };
}

/** Clé de palier de la courbe d'équipement : la plus haute au plus égale à `tier` (la plus basse sinon) ; null sans conversion. */
export function curveTier(rules: CombatRules, tier: number): number | null {
  const tiers = rules.gearStats?.tiers;
  if (!tiers) return null;
  const keys = Object.keys(tiers).map(Number).sort((a, b) => a - b);
  return [...keys].reverse().find((k) => k <= tier) ?? keys[0]!;
}

/** Facteur de la courbe d'un palier (+12 % par palier, palier 20 = 1) ; 1 sans conversion. */
export function tierFactor(rules: CombatRules, tier: number): number {
  const key = curveTier(rules, tier);
  return key === null ? 1 : rules.gearStats!.tiers![String(key)]!.factor;
}

/**
 * Facteur à un palier quelconque (la route monte palier par palier) : entre deux paliers de la courbe, la progression
 * géométrique qui les relie ; aux paliers de la courbe, `tierFactor`.
 */
export function tierFactorAt(rules: CombatRules, tier: number): number {
  const tiers = rules.gearStats?.tiers;
  if (!tiers) return 1;
  const keys = Object.keys(tiers).map(Number).sort((a, b) => a - b);
  const lo = [...keys].reverse().find((k) => k <= tier) ?? keys[0]!;
  const hi = keys.find((k) => k > lo);
  const f = (k: number) => tiers[String(k)]!.factor;
  // Au-delà du dernier palier de la courbe (Au-delà des Lointains, niveaux 91 à 99) : la même pente que le dernier écart.
  if (hi === undefined && keys.length >= 2 && tier > lo) {
    const prev = keys[keys.length - 2]!;
    return f(lo) * (f(lo) / f(prev)) ** ((tier - lo) / (lo - prev));
  }
  if (hi === undefined || tier <= lo) return f(lo);
  return f(lo) * (f(hi) / f(lo)) ** ((tier - lo) / (hi - lo));
}

/** Indice de mur d'un équipement : (dégâts × survie)^0,4, la loi mesurée au simulateur (`budget.md`). */
export const wallIndex = (s: CombatStats) => (s.power * (1 + (s.critMultiplier - 1) * s.critChance) * (1 + s.haste) * (s.maxHp / (1 - s.damageReduction))) ** 0.4;

/** Une pièce portée : son modèle (palier, poids d'emplacement, lignes fixes, ensemble, talent nommé) et ses lignes tirées. */
export interface WornPiece {
  tier: number;
  weight: number;
  stats: { stat: string; value: number }[];
  lines: { name: string; value: number }[];
  set?: string;
  talent?: string;
  /** Gemme sertie (outil de situation de rang `gem`) : une place de talent majeur, comme un objet nommé. */
  gem?: string;
}

const EMPTY_CATALOG: TalentCatalog = { pools: [], gems: [], named: [], sets: [] } as unknown as TalentCatalog;

/**
 * L'équipement porté ramené au moteur. Chaque pièce compte à son palier : ses points sont ramenés au palier 20 (`norm`),
 * et la courbe +12 % par palier (`factor`) est la moyenne des pièces pondérée par leur poids d'emplacement. Ensembles et
 * objets nommés deviennent des talents (au plus quatre nommés, les places de talent majeur), les lignes de build des
 * modificateurs et des plafonds de réserve. `floor` : statistiques au-dessous desquelles on ne descend pas.
 */
export function wornLoadout(rules: CombatRules, catalog: TalentCatalog | null, tools: Tool[], pieces: WornPiece[], floor?: CombatStats) {
  const conv = rules.gearStats;
  const stats: Record<string, number> = {};
  const lines: Record<string, number> = {};
  const sets: Record<string, number> = {};
  const named: string[] = [];
  const gems: string[] = [];
  let weights = 0;
  let factor = 0;
  for (const p of pieces) {
    const key = curveTier(rules, p.tier);
    const curve = key === null ? { norm: 1, factor: 1 } : conv!.tiers![String(key)]!;
    for (const s of p.stats) stats[s.stat] = (stats[s.stat] ?? 0) + s.value * curve.norm;
    for (const l of p.lines) lines[l.name] = (lines[l.name] ?? 0) + l.value;
    if (p.set) sets[p.set] = (sets[p.set] ?? 0) + 1;
    if (p.talent && !named.includes(p.talent)) named.push(p.talent);
    // Une même gemme n'agit qu'une fois (deux Perles de lessive ne lavent pas deux fois).
    if (p.gem && !gems.includes(p.gem)) gems.push(p.gem);
    weights += p.weight;
    factor += p.weight * curve.factor;
  }
  // Quatre places de talent majeur : les objets nommés d'abord, puis les gemmes serties.
  const n = named.slice(0, 4);
  const r = resolveLoadout(catalog ?? EMPTY_CATALOG, tools, { named: n, gems: gems.slice(0, 4 - n.length), sets, lines: buildFromLines(rules, lines) }, { majors: 4, setPieces: 11, preps: 1 });
  const base = statsFromGear(rules, { stats, lines }, 20, r.mods);
  const f = weights > 0 ? factor / weights : 1;
  let combatStats: CombatStats = conv ? { ...base, power: base.power * f, maxHp: base.maxHp * f } : base;
  const floored = !!floor && wallIndex(floor) > wallIndex(combatStats);
  if (floored) combatStats = floor!;
  return { stats: combatStats, floored, talents: r.talents, tools: r.tools, pools: r.pools, convert: r.convert };
}

/** Lignes de build de l'équipement porté : modificateurs de talent (`mod:`) et plafonds de réserve (`pool:`). */
export function buildFromLines(rules: CombatRules, lines: Record<string, number>): { mods: TalentMods; pools: Record<string, number> } {
  const mods: TalentMods = {};
  const pools: Record<string, number> = {};
  for (const [name, value] of Object.entries(lines)) {
    const effect = rules.gearStats?.lines[name] ?? 'none';
    if (effect.startsWith('mod:')) {
      const k = effect.slice(4) as keyof TalentMods;
      mods[k] = (mods[k] ?? 0) + value / 100;
    } else if (effect.startsWith('pool:')) pools[effect.slice(5)] = (pools[effect.slice(5)] ?? 0) + value;
  }
  return { mods, pools };
}

/** Ce que le joueur a choisi de porter, par identifiants du catalogue. */
export interface LoadoutChoice {
  /** Gemmes majeures (talents de build ou de situation) et objets nommés : une place de majeure chacun. */
  gems?: string[];
  named?: string[];
  /** Pièces portées par ensemble (pièces canoniques : un anneau en double ne compte qu'une fois). */
  sets?: Record<string, number>;
  /** Préparation de situation (une place utilitaire). */
  prep?: string;
  /** Lignes de build de l'équipement (`buildFromLines`). */
  lines?: { mods: TalentMods; pools: Record<string, number> };
}

export interface LoadoutRules {
  /** Places de talent majeur (arme, torse, coiffe, collier), nommés compris. */
  majors: number;
  /** Emplacements qui peuvent porter une pièce d'ensemble. */
  setPieces: number;
  /** Préparations de situation équipées au plus. */
  preps: number;
}

export interface ResolvedLoadout {
  talents: Talent[];
  tools: Tool[];
  /** Modificateurs passifs cumulés (pour `statsFromGear` : scores de Défense et de Cadence). */
  mods: TalentMods;
  /** Réserves ouvertes (toutes celles du catalogue) et leur plafond ; conversions. */
  pools: Record<string, number>;
  convert: { from: string; to: string; share: number }[];
  /** Infractions au budget : un équipement qui les a n'est pas jouable tel quel. */
  errors: string[];
}

/**
 * Budget unique des talents : au plus `majors` gemmes et nommés (une même gemme n'agit qu'une fois), au plus `setPieces`
 * pièces d'ensemble, bonus 2/3/4 cumulés pour un ensemble de build ; pour un ensemble de situation (outil `set2/3/4` de sa
 * famille), le palier le plus haut remplace les autres et une seule variante par famille agit (moteur).
 */
export function resolveLoadout(catalog: TalentCatalog, tools: Tool[], choice: LoadoutChoice, rules: LoadoutRules): ResolvedLoadout {
  const errors: string[] = [];
  const talents: Talent[] = [];
  const out: Tool[] = [];
  const mods: TalentMods = {};
  const pools: Record<string, number> = Object.fromEntries(catalog.pools.map((p) => [p.id, p.max]));
  const convert: ResolvedLoadout['convert'] = [];
  const addMods = (m?: TalentMods) => {
    for (const [k, v] of Object.entries(m ?? {})) mods[k as keyof TalentMods] = (mods[k as keyof TalentMods] ?? 0) + (v ?? 0);
  };
  /** Ce qu'un talent ajoute en dehors de ses effets : modificateurs, plafonds de réserve, conversions, outil. */
  const extras = (t: { mods?: TalentMods; pools?: Record<string, number>; convert?: ResolvedLoadout['convert']; tool?: string }) => {
    addMods(t.mods);
    for (const [k, v] of Object.entries(t.pools ?? {})) if (k in pools) pools[k] = pools[k]! + v;
    convert.push(...(t.convert ?? []));
    if (t.tool) {
      const tool = tools.find((x) => x.id === t.tool);
      if (tool) out.push(tool);
      else errors.push(`outil inconnu « ${t.tool} »`);
    }
  };
  if (choice.lines) extras(choice.lines);
  const majors = [...(choice.gems ?? []), ...(choice.named ?? [])];
  if (majors.length > rules.majors) errors.push(`${majors.length} talents majeurs pour ${rules.majors} places`);
  const seen = new Set<string>();
  for (const id of majors) {
    if (seen.has(id)) {
      errors.push(`talent en double « ${id} » : un seul agit`);
      continue;
    }
    seen.add(id);
    const gem = catalog.gems.find((g) => g.id === id) ?? catalog.named.find((g) => g.id === id);
    const tool = tools.find((x) => x.id === id && x.rank === 'gem');
    if (gem) {
      talents.push(gem);
      extras(gem);
    } else if (tool) out.push(tool);
    else errors.push(`talent inconnu « ${id} »`);
  }
  const pieces = Object.values(choice.sets ?? {}).reduce((a, n) => a + n, 0);
  if (pieces > rules.setPieces) errors.push(`${pieces} pièces d'ensemble pour ${rules.setPieces} emplacements`);
  for (const [id, n] of Object.entries(choice.sets ?? {})) {
    const set = catalog.sets.find((s) => s.id === id);
    if (set) {
      for (const tier of ['2', '3', '4'] as const) {
        const bonus = set.pieces[tier];
        if (!bonus || n < Number(tier)) continue;
        talents.push({ id: `${set.id}_${tier}`, name: `${set.name} (${tier})`, effects: bonus.effects ?? [], ...(bonus.mods ? { mods: bonus.mods } : {}) });
        extras(bonus);
      }
      continue;
    }
    // Ensemble de situation : l'outil de son rang (set2, set3, set4) dans la famille `id`.
    const rank = n >= 4 ? 'set4' : n >= 3 ? 'set3' : n >= 2 ? 'set2' : null;
    const tool = rank && tools.find((x) => x.family === id && x.rank === rank);
    if (tool) out.push(tool);
    else if (rank) errors.push(`ensemble inconnu « ${id} »`);
  }
  if (choice.prep) {
    const tool = tools.find((x) => x.id === choice.prep && x.rank === 'prep');
    if (tool) out.push(tool);
    else errors.push(`préparation inconnue « ${choice.prep} »`);
  }
  if ((choice.prep ? 1 : 0) > rules.preps) errors.push('trop de préparations');
  return { talents, tools: out, mods, pools, convert, errors };
}

/**
 * Cache des rencontres pour le simulateur de serveur : des centaines de joueurs simulés rejouent les mêmes combats.
 * Le build est arrondi (Puissance et PV par pas de 2 %, les autres statistiques au centième) et la graine ramenée à
 * `SEEDS` valeurs : deux combattants presque identiques partagent le même résultat. Le combat lui-même reste celui
 * du moteur (`fight`), joué sur le build arrondi.
 */
import { type CombatContent, type CombatantSetup, type Encounter, type FightOptions, type FightResult, fight, setFightResolver } from '@bramo/shared';

export const SEEDS = 6;
const STEP = Math.log(1.02);

const geo = (x: number) => Math.exp(Math.round(Math.log(Math.max(1e-6, x)) / STEP) * STEP);
const cent = (x: number) => Math.round(x * 100) / 100;
/**
 * Audit du 24 octobre (sim/reports/audit/verifier.md §2) : au centième, les petites statistiques du moteur de Puissance
 * disparaissent (régénération 0,27 %/s → 0, contre-attaque 1,2 % → 1 %) et un build au mur passe de 50 % à 7-27 % de victoires.
 * `CACHE_PARTS=4` garde quatre décimales pour ces parts (par défaut deux, comme les rapports d'avant l'audit).
 */
const PARTS = Number(process.env.CACHE_PARTS ?? 2);
const SMALL = new Set(['regen', 'combo', 'counter', 'evasion']);
const part = (x: number) => Math.round(x * 10 ** PARTS) / 10 ** PARTS;

function canonical(s: CombatantSetup): CombatantSetup {
  const st = s.stats ?? {};
  const stats: Record<string, number> = {};
  for (const [k, v] of Object.entries(st)) if (typeof v === 'number') stats[k] = k === 'power' || k === 'maxHp' ? geo(v) : SMALL.has(k) ? part(v) : cent(v);
  return { ...s, id: 'p1', stats };
}

export interface FightCacheStats {
  calls: number;
  hits: number;
  ms: number;
}

export function installFightCache(): { stats: FightCacheStats; clear: () => void; uninstall: () => void } {
  const cache = new Map<string, FightResult>();
  const stats: FightCacheStats = { calls: 0, hits: 0, ms: 0 };
  const resolver = (combat: CombatContent, setups: CombatantSetup[], encounter: Encounter, options: FightOptions): FightResult => {
    stats.calls++;
    const setup = canonical(setups[0]!);
    const seed = Math.abs(options.seed) % SEEDS;
    const key = `${encounter.id}|${cent(options.enemyDamageScale ?? 1)}|${cent(options.enemyHpScale ?? 1)}|${seed}|${JSON.stringify(setup)}`;
    const hit = cache.get(key);
    if (hit) {
      stats.hits++;
      return hit;
    }
    const t0 = performance.now();
    const r = fight(combat, [setup], encounter, { ...options, seed, trace: false });
    stats.ms += performance.now() - t0;
    // Le résultat gardé est réduit à ce que `runCombat` lit.
    const slim = { win: r.win, time: r.time, cause: r.cause, killedBy: r.killedBy, enemyHpLeft: r.enemyHpLeft, team: [{ metrics: { potions: r.team[0]?.metrics.potions ?? 0 } }] } as unknown as FightResult;
    if (cache.size > 2_000_000) cache.clear();
    cache.set(key, slim);
    return slim;
  };
  setFightResolver(resolver);
  return { stats, clear: () => cache.clear(), uninstall: () => setFightResolver(null) };
}

/** Taux de victoire et durée moyenne d'un build sur une rencontre (évaluation d'équipement), avec le même cache. */
export function probe(combat: CombatContent, setup: CombatantSetup, encounter: Encounter, scale: number, seeds = SEEDS): { winRate: number; time: number; hpLeft: number } {
  let wins = 0;
  let time = 0;
  let hpLeft = 0;
  const s = canonical(setup);
  for (let i = 0; i < seeds; i++) {
    const r = probeCache(combat, s, encounter, scale, i);
    if (r.win) wins++;
    time += r.time;
    hpLeft += r.hpLeft;
  }
  return { winRate: wins / seeds, time: time / seeds, hpLeft: hpLeft / seeds };
}

const probeMemo = new Map<string, { win: boolean; time: number; hpLeft: number }>();
function probeCache(combat: CombatContent, s: CombatantSetup, e: Encounter, scale: number, seed: number) {
  const key = `${e.id}|${cent(scale)}|${seed}|${JSON.stringify(s)}`;
  const hit = probeMemo.get(key);
  if (hit) return hit;
  const r = fight(combat, [s], e, { seed, enemyDamageScale: scale, enemyHpScale: scale });
  const v = { win: r.win, time: r.time, hpLeft: r.enemyHpLeft };
  if (probeMemo.size > 1_000_000) probeMemo.clear();
  probeMemo.set(key, v);
  return v;
}

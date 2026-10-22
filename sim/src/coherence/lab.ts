/**
 * Laboratoire de la cohérence : une voie, un équipement (statistiques, talents, outils), une rencontre ; le mur se mesure
 * avec la difficulté couplée du PvE v2 (dégâts × D, PV, garde et soins ennemis × D^1,5), mêmes graines pour tous les cas.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import {
  type CombatContent,
  type CombatStats,
  type Content,
  type Encounter,
  type FightResult,
  type PlanEntry,
  type Talent,
  type TalentCatalog,
  type TargetPriority,
  type Tool,
  fight,
  gearPoolsFileSchema,
  talentCatalogSchema,
  toolsFileSchema,
} from '@bramo/shared';
import { PROPOSALS_DIR, loadVariant } from '../load.js';
import { planOf, screenPool } from '../scenarios/combat-search.js';

export interface Lab {
  content: Content;
  combat: CombatContent;
  /** Six profils du banc puis douze zones du PvE v2. */
  encounters: Encounter[];
  catalog: TalentCatalog;
  tools: Tool[];
  /** Dossier des rapports (sous sim/reports/combat/) : plans essayés par voie, résultats. */
  reports: string;
}

/**
 * Contenu d'une proposition, plus les rencontres d'autres propositions (`zones`, séparées par des virgules). Ses outils de situation viennent de son propre
 * `tools.yaml` s'il existe (sinon de `toolsFrom`) ; son `gear_pools.yaml` éventuel remplace les lignes aléatoires de data/.
 */
export function makeLab(proposal = 'coherence-v1', zones = 'zones-v2', toolsFrom = 'zones-v2'): Lab {
  const content = loadVariant(proposal);
  const combat = content.combat!;
  const zoneList = zones.split(',').flatMap((z) => Object.values(loadVariant(z).combat!.encounters));
  // Une proposition de zones peut redonner une rencontre déjà adoptée dans data/ : la proposition l'emporte.
  combat.encounters = Object.fromEntries([...Object.values(combat.encounters), ...zoneList].map((e) => [e.id, e]));
  const encounters = Object.values(combat.encounters);
  const read = (p: string, file: string) => parse(readFileSync(join(PROPOSALS_DIR, p, file), 'utf8'));
  const catalog = talentCatalogSchema.parse(read(proposal, 'talents.yaml'));
  const tools = toolsFileSchema.parse(read(existsSync(join(PROPOSALS_DIR, proposal, 'tools.yaml')) ? proposal : toolsFrom, 'tools.yaml'));
  if (existsSync(join(PROPOSALS_DIR, proposal, 'gear_pools.yaml'))) content.gearPools = gearPoolsFileSchema.parse(read(proposal, 'gear_pools.yaml'));
  return { content, combat, encounters, catalog, tools, reports: proposal === 'coherence-v1' ? 'coherence' : proposal };
}

export interface Build {
  id: string;
  stats: CombatStats;
  talents?: Talent[];
  tools?: Tool[];
  plan?: PlanEntry[];
  priority?: TargetPriority;
  pools?: Record<string, number>;
  convert?: { from: string; to: string; share: number }[];
}

/** Plan conseillé de la voie au répertoire donné (data/combat/plans.yaml, `<voie>_advised`). */
export function advisedPlan(combat: CombatContent, pathId: string, level = 80): PlanEntry[] {
  return combat.plans[`${pathId}_advised`]!.levels[String(level)]!;
}

export function play(lab: Lab, pathId: string, build: Build, enc: Encounter, danger: number, seed: number, hpExponent = 1.5): FightResult {
  const path = lab.combat.paths[pathId]!;
  return fight(
    lab.combat,
    [
      {
        id: 'p1',
        classId: path.class,
        pathId,
        plan: build.plan ?? advisedPlan(lab.combat, pathId),
        weapon: lab.combat.kits[path.class]!.weapons[0]!,
        stats: build.stats,
        ...(build.talents?.length ? { talents: build.talents } : {}),
        ...(build.tools?.length ? { tools: build.tools } : {}),
        ...(build.priority ? { targetPriority: build.priority } : {}),
        ...(build.pools ? { pools: build.pools } : {}),
        ...(build.convert?.length ? { convert: build.convert } : {}),
      },
    ],
    enc,
    { seed, opening: 'sequence', enemyDamageScale: danger, enemyHpScale: danger ** hpExponent },
  );
}

export const seedList = (start: number, count: number) => Array.from({ length: count }, (_, i) => start + i);

export interface WallResult {
  wall: number;
  /** Réussite au mur sur les graines, et causes des défaites juste au-dessus (mur × 1,03). */
  rate: number;
  above: Record<string, number>;
  /** Temps médian des victoires au danger 1, et part de victoires. */
  time: number | null;
  win1: number;
}

const median = (xs: number[]): number | null => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  return s.length % 2 ? s[s.length >> 1]! : (s[s.length / 2 - 1]! + s[s.length / 2]!) / 2;
};

/**
 * Mur : plus haut D gagné à `winRate` sur les graines. Recherche par pas de ×1,25 depuis D = 1, puis encadrement géométrique à
 * `refine` près. Succès supposé décroissant avec D (vérifié dans les rapports : la réussite juste au-dessus est publiée).
 */
export function wallOf(lab: Lab, pathId: string, build: Build, enc: Encounter, seeds: number[], winRate = 0.9, refine = 0.03): WallResult {
  const need = Math.ceil(winRate * seeds.length - 1e-9);
  const passes = (d: number) => {
    let wins = 0;
    for (let i = 0; i < seeds.length; i++) {
      if (play(lab, pathId, build, enc, d, seeds[i]!).win) wins++;
      if (wins + (seeds.length - i - 1) < need) return false;
      if (wins >= need) return true;
    }
    return wins >= need;
  };
  let lo: number;
  let hi: number;
  if (passes(1)) {
    lo = 1;
    hi = 1.25;
    while (passes(hi) && hi < 64) {
      lo = hi;
      hi *= 1.25;
    }
  } else {
    hi = 1;
    lo = 0.8;
    while (!passes(lo) && lo > 0.01) {
      hi = lo;
      lo /= 1.25;
    }
  }
  while (hi / lo > 1 + refine) {
    const mid = Math.sqrt(lo * hi);
    if (passes(mid)) lo = mid;
    else hi = mid;
  }
  const at = seeds.map((s) => play(lab, pathId, build, enc, lo, s));
  const up = seeds.map((s) => play(lab, pathId, build, enc, lo * (1 + refine), s));
  const above: Record<string, number> = {};
  for (const r of up) if (!r.win) above[r.cause === 'death' ? `mort:${r.killedBy}` : 'temps'] = (above[r.cause === 'death' ? `mort:${r.killedBy}` : 'temps'] ?? 0) + 1;
  const normal = seeds.map((s) => play(lab, pathId, build, enc, 1, s));
  return { wall: lo, rate: at.filter((r) => r.win).length / seeds.length, above, time: median(normal.filter((r) => r.win).map((r) => r.time)), win1: normal.filter((r) => r.win).length / seeds.length };
}

/** Vitesse au danger 1 : part de victoires et temps médian des victoires. */
export function speedOf(lab: Lab, pathId: string, build: Build, enc: Encounter, seeds: number[], danger = 1) {
  const rs = seeds.map((s) => play(lab, pathId, build, enc, danger, s));
  const wins = rs.filter((r) => r.win);
  return { win: wins.length / rs.length, time: median(wins.map((r) => r.time)), hp: median(rs.map((r) => r.team[0]!.hpRatio))! };
}

/** Paliers d'avance : un palier de la courbe proposée (+12 % de P et de PV) vaut ×1,096 de mur (mesuré, `budget.md`). */
export const PALIER = 1.096;
export const paliers = (ratio: number) => Math.log(ratio) / Math.log(PALIER);
/** Crans : un cran = ×1,25 de danger. */
export const crans = (ratio: number) => Math.log(ratio) / Math.log(1.25);

export interface PoolPlan {
  id: string;
  plan: PlanEntry[];
}

/**
 * Plans essayés pour chaque équipement d'une voie : le plan conseillé (vitesse), le plan de groupe s'il existe (soins et
 * protections), et le plus sûr du criblage (PV médians au danger ×1,25 sur les 18 rencontres, statistiques du témoin). Un talent
 * qui demande un soin ou un bouclier doit pouvoir trouver un plan qui le nourrit.
 */
export function planPool(lab: Lab, pathId: string, stats: CombatStats): PoolPlan[] {
  const out: PoolPlan[] = [{ id: 'advised', plan: advisedPlan(lab.combat, pathId) }];
  const group = lab.combat.plans[`${pathId}_group`]?.levels['80'];
  if (group) out.push({ id: 'group', plan: group });
  const finalists = screenPool(lab.combat, pathId, { level: 80, screenSeeds: 2, finalists: 5, opening: 'sequence' });
  let best: { plan: PlanEntry[]; hp: number } | null = null;
  for (const spells of finalists) {
    const plan = planOf(spells);
    let hp = 0;
    for (const e of lab.encounters) for (const s of [1, 2]) hp += play(lab, pathId, { id: 'safe', stats, plan }, e, 1.25, s).team[0]!.hpRatio;
    if (!best || hp > best.hp) best = { plan, hp };
  }
  const key = (p: PlanEntry[]) => p.map((x) => x.spell).sort().join(',');
  if (best && !out.some((p) => key(p.plan) === key(best.plan))) out.push({ id: 'safe', plan: best.plan });
  return out;
}

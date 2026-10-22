/**
 * Cohérence du combat et du contenu (docs/design/coherence/) : chaque mesure joue le moteur du jeu (`fight`), mêmes graines
 * pour tous les cas comparés, et garde les échecs (causes des défaites juste au-dessus du mur).
 *
 * - `kits` : statistiques brutes du catalogue par classe, palier, rareté et orientation, et leur conversion (étape 5a).
 * - `gear` : murs de chaque voie avec les kits du catalogue (palier, rareté, orientation, lignes moyennes).
 * - `sets` : ensembles du dossier « Le cœur du jeu » (4 pièces seuls, puis paires 4+4) sur le témoin palier 20 Rare.
 * - `gems` : gemmes majeures seules, puis toutes les combinaisons de quatre (vitesse), puis murs des meilleures.
 * - `tools` : outils de situation contre un vrai généraliste (meilleur ensemble et meilleures gemmes de la voie).
 * Les étapes lourdes se partagent en `--shard k/n` (par voie) puis `--merge`.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { type CombatStats, type Content, type Rarity, type Talent, rarities, resolveLoadout, statsFromGear, stream } from '@bramo/shared';
import { ROOT } from '../load.js';
import { type Orientation, buildKit } from '../coherence/kits.js';
import { type Build, type Lab, PALIER, type PoolPlan, type WallResult, crans, paliers, planPool, play, seedList, speedOf, wallOf } from '../coherence/lab.js';

const fr = (n: number | null, d = 1) => (n === null ? '—' : n.toFixed(d).replace('.', ','));
const pct = (r: number) => `${r >= 1 ? '+' : ''}${fr((r - 1) * 100, 0)} %`;
const med = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length ? (s.length % 2 ? s[s.length >> 1]! : (s[s.length / 2 - 1]! + s[s.length / 2]!) / 2) : NaN;
};
const geo = (xs: number[]) => Math.exp(xs.reduce((a, x) => a + Math.log(x), 0) / xs.length);

/** Totaux bruts et statistiques converties de chaque kit (une ligne par classe, palier, rareté, orientation). */
export function kitsReport(content: Content, level = (tier: number) => tier): string {
  const combat = content.combat!;
  const md = ['# Kits du catalogue', '', '> Généré par `pnpm --filter @bramo/sim sim combat-coherence --step kits`.', ''];
  md.push('Un modèle par emplacement (onze places), même palier et même rareté, sans ligne aléatoire. Mixte : torse, jambes, cape et ceinture protecteurs ; coiffe, gants, bottes offensifs. Conversion : `sim/proposals/coherence-v1/combat.yaml`.', '');
  md.push('| Classe | Palier | Rareté | Orientation | Puissance | Vitalité | Défense | Cadence | Critique | Ténacité | P | PV | Réduction | Critique | Cadence | Manque |', '|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|');
  for (const cls of Object.keys(combat.kits)) {
    for (const tier of [1, 10, 20]) {
      for (const rarity of rarities as readonly Rarity[]) {
        for (const orientation of ['protective', 'mixed', 'offensive'] as Orientation[]) {
          const kit = buildKit(content, { classId: cls, tier, rarity, orientation, rolls: 'none' });
          const s = kit.totals.stats;
          const c = statsFromGear(combat.rules, kit.totals, level(tier));
          md.push(
            `| ${cls} | ${tier} | ${rarity} | ${orientation} | ${s.power ?? 0} | ${s.vitality ?? 0} | ${s.defense ?? 0} | ${s.haste ?? 0} | ${s.crit ?? 0} | ${s.tenacity ?? 0} | ${fr(c.power)} | ${fr(c.maxHp, 0)} | ${fr(c.damageReduction * 100)} % | ${fr(c.critChance * 100)} % | ${fr(c.haste * 100)} % | ${kit.missing.join(' ') || '—'} |`,
          );
        }
      }
    }
  }
  return md.join('\n');
}

// --- Jobs : une ligne par (voie, équipement, rencontre) ------------------------------------------------------------

export interface Job {
  step: string;
  path: string;
  build: string;
  encounter: string;
}
export interface JobResult extends Job, WallResult {
  /** Vitesse seule (sans mur) : étapes de criblage. */
  speedOnly?: boolean;
  /** Plan retenu (le meilleur mur) parmi ceux de la voie. */
  plan?: string;
}

const WALL_SEEDS = seedList(5000, 24);
const SPEED_SEEDS = seedList(9000, 6);

/** Statistiques du témoin d'une classe : kit palier 20, Rare, mixte, avec les scores d'ensemble éventuels. */
export function referenceStats(lab: Lab, classId: string, mods: Record<string, number> = {}, spec: Partial<Parameters<typeof buildKit>[1]> = {}): CombatStats {
  const kit = buildKit(lab.content, { classId, tier: 20, rarity: 'rare', orientation: 'mixed', rolls: 'none', ...spec });
  return statsFromGear(lab.combat.rules, kit.totals, spec.tier ?? 20, mods);
}

// --- Étape `gear` : la courbe d'équipement du catalogue --------------------------------------------------------------

type GearKit = { id: string; tier: number; rarity: Rarity; orientation: Orientation; rolls: 'none' | 'mean' };
const catalogTiers = (lab: Lab) => [...new Set(Object.values(lab.content.gearModels).map((m) => m.tier))].sort((a, b) => a - b);
/**
 * Kits mesurés : avec trois paliers (catalogue actuel), toutes les raretés à chaque palier ; avec dix paliers, le Rare à chaque
 * palier et toutes les raretés aux paliers 20 et 60 ; plus l'orientation et les lignes au palier 20.
 */
function gearKits(lab: Lab): GearKit[] {
  const tiers = catalogTiers(lab);
  const kit = (tier: number, rarity: Rarity): GearKit => ({ id: `t${tier}_${rarity}`, tier, rarity, orientation: 'mixed', rolls: 'none' });
  const all = (tier: number) => (rarities as readonly Rarity[]).map((r) => kit(tier, r));
  const base = tiers.length <= 3 ? tiers.flatMap(all) : [...tiers.map((t) => kit(t, 'rare')), ...[20, 60].flatMap((t) => all(t).filter((k) => k.rarity !== 'rare'))];
  return [
    ...base,
    { id: 't20_rare_protective', tier: 20, rarity: 'rare', orientation: 'protective', rolls: 'none' },
    { id: 't20_rare_offensive', tier: 20, rarity: 'rare', orientation: 'offensive', rolls: 'none' },
    { id: 't20_rare_rolls', tier: 20, rarity: 'rare', orientation: 'mixed', rolls: 'mean' },
  ];
}

function gearBuild(lab: Lab, pathId: string, id: string): Build {
  const k = gearKits(lab).find((x) => x.id === id)!;
  const cls = lab.combat.paths[pathId]!.class;
  const kit = buildKit(lab.content, { classId: cls, tier: k.tier, rarity: k.rarity, orientation: k.orientation, rolls: k.rolls });
  return { id, stats: statsFromGear(lab.combat.rules, kit.totals, k.tier) };
}

/**
 * Budget synthétique (statistiques de référence, sans catalogue) : à budget égal, +30 % de Puissance, de PV, ou de survie par
 * la réduction (1 / (1 − réduction) × 1,3) ; et la courbe proposée d'un palier à +12 % de Puissance et de PV.
 */
export const BUDGET_BUILDS: Record<string, (s: CombatStats) => CombatStats> = {
  base: (s) => s,
  power30: (s) => ({ ...s, power: s.power * 1.3 }),
  hp30: (s) => ({ ...s, maxHp: s.maxHp * 1.3 }),
  dr30: (s) => ({ ...s, damageReduction: 1 - (1 - s.damageReduction) / 1.3 }),
  'tier-2': (s) => ({ ...s, power: s.power * 1.12 ** -2, maxHp: s.maxHp * 1.12 ** -2 }),
  'tier-1': (s) => ({ ...s, power: s.power * 1.12 ** -1, maxHp: s.maxHp * 1.12 ** -1 }),
  'tier+1': (s) => ({ ...s, power: s.power * 1.12, maxHp: s.maxHp * 1.12 }),
  'tier+2': (s) => ({ ...s, power: s.power * 1.12 ** 2, maxHp: s.maxHp * 1.12 ** 2 }),
};
export function budgetJobs(lab: Lab): Job[] {
  return Object.keys(lab.combat.paths).flatMap((path) => Object.keys(BUDGET_BUILDS).flatMap((b) => lab.encounters.map((e) => ({ step: 'budget', path, build: b, encounter: e.id }))));
}

export function budgetMarkdown(lab: Lab, results: JobResult[]): string {
  const md = ['# Budget de puissance : ce que vaut chaque statistique selon la rencontre', '', '> Généré par `pnpm --filter @bramo/sim sim combat-coherence --step budget`. Ne pas modifier à la main.', ''];
  md.push('**Méthode.** Statistiques de référence (P 100, PV 2 800, 25 % de réduction), plan conseillé du répertoire 80, sans talent. +30 % de Puissance, +30 % de PV, ou une réduction qui multiplie la survie par 1,3 (25 % → 42 %). Courbe proposée : un palier = +12 % de Puissance et de PV. Mur sur 24 graines, difficulté couplée.', '');
  const paths = Object.values(lab.combat.paths).filter((p) => results.some((r) => r.path === p.id));
  const w = (p: string, b: string, e: string) => results.find((r) => r.path === p && r.build === b && r.encounter === e)?.wall ?? NaN;
  md.push('| Rencontre | +30 % P | +30 % PV | Survie ×1,3 (réduction) | PV / P (voies où les PV gagnent) | Un palier +12 % |', '|---|---|---|---|---|---|');
  for (const e of lab.encounters) {
    const r = (b: string) => med(paths.map((p) => w(p.id, b, e.id) / w(p.id, 'base', e.id)));
    const hpWins = paths.filter((p) => w(p.id, 'hp30', e.id) > w(p.id, 'power30', e.id) * 1.03).length;
    const tier = med(paths.map((p) => Math.sqrt(w(p.id, 'tier+1', e.id) / w(p.id, 'tier-1', e.id))));
    md.push(`| ${e.name} | ${pct(r('power30'))} | ${pct(r('hp30'))} | ${pct(r('dr30'))} | ×${fr(med(paths.map((p) => w(p.id, 'hp30', e.id) / w(p.id, 'power30', e.id))), 2)} (${hpWins}/${paths.length}) | ${pct(tier)} (${fr(crans(tier), 2)} cran) |`);
  }
  const all = (b: string, a = 'base') => med(paths.flatMap((p) => lab.encounters.map((e) => w(p.id, b, e.id) / w(p.id, a, e.id))));
  md.push('', `Médianes : +30 % P ${pct(all('power30'))}, +30 % PV ${pct(all('hp30'))}, survie ×1,3 ${pct(all('dr30'))} ; un palier à +12 % : ${pct(Math.sqrt(all('tier+1', 'tier-1')))} de mur (${fr(crans(Math.sqrt(all('tier+1', 'tier-1'))), 2)} cran), deux paliers : ${pct(all('tier+2'))}.`, '');
  return md.join('\n');
}

export function gearJobs(lab: Lab): Job[] {
  return Object.keys(lab.combat.paths).flatMap((path) => gearKits(lab).flatMap((k) => lab.encounters.map((e) => ({ step: 'gear', path, build: k.id, encounter: e.id }))));
}

// --- Étape `sets` : ensembles du dossier, 4 pièces, puis paires 4+4 ---------------------------------------------------

/** Ensembles portables par une classe : les communs et les siens. */
export const setsFor = (lab: Lab, classId: string) => lab.catalog.sets.filter((s) => !s.class || s.class === classId).map((s) => s.id);
const LOADOUT_RULES = { majors: 4, setPieces: 8, preps: 1 };

export function loadoutBuild(lab: Lab, pathId: string, id: string, choice: Parameters<typeof resolveLoadout>[2], extra: Partial<Build> = {}): Build {
  const cls = lab.combat.paths[pathId]!.class;
  const r = resolveLoadout(lab.catalog, lab.tools, choice, LOADOUT_RULES);
  if (r.errors.length) throw new Error(`${id} : ${r.errors.join(' ; ')}`);
  return { id, stats: referenceStats(lab, cls, r.mods as Record<string, number>), talents: r.talents, tools: r.tools, pools: r.pools, convert: r.convert, ...extra };
}

/** Identifiant d'un assemblage d'ensembles : « a+b » (4+4), « a » (4), « none ». */
export function setsBuild(lab: Lab, pathId: string, id: string): Build {
  const sets = id === 'none' ? {} : Object.fromEntries(id.split('+').map((s) => [s, 4]));
  return loadoutBuild(lab, pathId, id, { sets });
}

export function setPairs(lab: Lab, pathId: string): string[] {
  const ids = setsFor(lab, lab.combat.paths[pathId]!.class);
  const out = ['none', ...ids];
  for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) out.push(`${ids[i]}+${ids[j]}`);
  return out;
}

/** Ensembles à 4 pièces seuls (et aucun) : murs complets. Les paires sont criblées (`comboScreen`) puis rejouées. */
export function setJobs(lab: Lab): Job[] {
  return Object.keys(lab.combat.paths).flatMap((path) => setPairs(lab, path).filter((b) => !b.includes('+')).flatMap((b) => lab.encounters.map((e) => ({ step: 'sets', path, build: b, encounter: e.id }))));
}

// --- Étape `gems` : gemmes majeures -----------------------------------------------------------------------------------

/**
 * « majeures|ensembles|préparation|priorité » : « a+b+c+d » gemmes, nommés ou gemmes de situation (une place de majeure
 * chacun) ; « s+t » ensembles à 4 pièces (un ensemble de situation se nomme par sa famille : `impact`…) ; « none » : rien.
 */
export function gemBuild(lab: Lab, pathId: string, id: string): Build {
  const [majorPart = 'none', setPart = 'none', prep = 'none', priority = 'chief'] = id.split('|');
  const ids = majorPart === 'none' ? [] : majorPart.split('+');
  const named = ids.filter((x) => lab.catalog.named.some((n) => n.id === x));
  const gems = ids.filter((x) => !named.includes(x));
  const sets = setPart === 'none' ? {} : Object.fromEntries(setPart.split('+').map((s) => [s, 4]));
  return loadoutBuild(lab, pathId, id, { gems, named, sets, ...(prep !== 'none' ? { prep } : {}) }, priority !== 'chief' ? { priority: priority as Build['priority'] } : {});
}
/** Nommés portables par la voie : ceux de sa classe et les colliers universels. */
export const namedFor = (lab: Lab, classId: string) => lab.catalog.named.filter((n) => !n.class || n.class === classId).map((n) => n.id);

export function gemJobs(lab: Lab): Job[] {
  return Object.keys(lab.combat.paths).flatMap((path) =>
    ['none', ...gemIds(lab), ...namedFor(lab, lab.combat.paths[path]!.class)].flatMap((b) => lab.encounters.map((e) => ({ step: 'gems', path, build: b, encounter: e.id }))),
  );
}

/**
 * Criblage de combinaisons (paires d'ensembles 4+4, quatre gemmes) : chacune jouée juste au-dessus du mur du témoin sans talent
 * (mur × `SCREEN_STEP`) avec le plan retenu pour lui, 8 graines. Score = victoires moyennes sur les 18 rencontres. (Un premier
 * criblage à mur × 1,25, un cran, donnait 0 victoire à toutes les paires : il ne départageait rien.)
 */
export const SCREEN_STEP = 1.06;
export interface ComboScore {
  path: string;
  combo: string;
  wins: number[];
}
export function comboScreen(lab: Lab, base: JobResult[], pathId: string, combos: string[], make: (id: string) => Build, seeds = seedList(7000, 8)): ComboScore[] {
  const plans = poolFor(lab, pathId);
  const ref = lab.encounters.map((e) => base.find((r) => r.path === pathId && r.build === 'none' && r.encounter === e.id)!);
  return combos.map((combo) => {
    const build = make(combo);
    const wins = lab.encounters.map((e, i) => {
      const plan = plans.find((p) => p.id === ref[i]!.plan)?.plan;
      let n = 0;
      for (const s of seeds) if (play(lab, pathId, { ...build, ...(plan ? { plan } : {}) }, e, ref[i]!.wall * SCREEN_STEP, s).win) n++;
      return n / seeds.length;
    });
    return { path: pathId, combo, wins };
  });
}
/**
 * Combinaisons de quatre gemmes criblées pour une voie : toutes celles des huit meilleures gemmes seules (70), plus 300 tirées
 * au hasard parmi les 3 060 (graine fixe). Le criblage complet coûte ~30 min par voie (les combats près du mur sont longs).
 */
export function quadSample(lab: Lab, gems: JobResult[], pathId: string, extra = 300): string[] {
  const idx = (b: string) => geo(lab.encounters.map((e) => gems.find((r) => r.path === pathId && r.build === b && r.encounter === e.id)?.wall ?? NaN));
  const top = [...gemIds(lab)].sort((a, b) => idx(b) - idx(a)).slice(0, 8).sort();
  const all = gemQuads(lab);
  const chosen = new Set(all.filter((q) => q.split('+').every((g) => top.includes(g))));
  const rand = stream(4242, `quads:${pathId}`);
  const rest = all.filter((q) => !chosen.has(q));
  for (let i = 0; i < extra && rest.length; i++) chosen.add(rest.splice(Math.floor(rand() * rest.length), 1)[0]!);
  return [...chosen];
}
export const quadScreen = (lab: Lab, gems: JobResult[], pathId: string) => comboScreen(lab, gems, pathId, quadSample(lab, gems, pathId), (id) => gemBuild(lab, pathId, id), seedList(7000, 6));
export const pairScreen = (lab: Lab, sets: JobResult[], pathId: string) =>
  comboScreen(lab, sets, pathId, setPairs(lab, pathId).filter((b) => b.includes('+')), (id) => setsBuild(lab, pathId, id));
export const gemIds = (lab: Lab) => lab.catalog.gems.map((g) => g.id);
export function gemQuads(lab: Lab): string[] {
  const ids = gemIds(lab);
  const out: string[] = [];
  for (let a = 0; a < ids.length; a++) for (let b = a + 1; b < ids.length; b++) for (let c = b + 1; c < ids.length; c++) for (let d = c + 1; d < ids.length; d++) out.push([ids[a], ids[b], ids[c], ids[d]].join('+'));
  return out;
}

// --- Exécution --------------------------------------------------------------------------------------------------------

export function buildFor(lab: Lab, job: Job): Build {
  if (job.step === 'gear') return gearBuild(lab, job.path, job.build);
  if (job.step === 'budget') return { id: job.build, stats: BUDGET_BUILDS[job.build]!({ ...lab.combat.rules.referenceStats }) };
  if (job.step === 'sets' || job.step === 'pairwalls') return setsBuild(lab, job.path, job.build);
  if (job.step === 'gems' || job.step === 'quadwalls' || job.step === 'tools') return gemBuild(lab, job.path, job.build);
  throw new Error(`étape inconnue ${job.step}`);
}

const pools = new Map<string, PoolPlan[]>();
/** Plans essayés pour la voie (calculés une fois sur le témoin de sa classe, gardés dans reports/combat/coherence/plans/). */
export function poolFor(lab: Lab, pathId: string): PoolPlan[] {
  if (!pools.has(pathId)) {
    const dir = join(ROOT, 'sim', 'reports', 'combat', lab.reports, 'plans');
    const file = join(dir, `${pathId}.json`);
    if (existsSync(file)) pools.set(pathId, JSON.parse(readFileSync(file, 'utf8')) as PoolPlan[]);
    else {
      const pool = planPool(lab, pathId, referenceStats(lab, lab.combat.paths[pathId]!.class));
      mkdirSync(dir, { recursive: true });
      writeFileSync(file, `${JSON.stringify(pool)}\n`);
      pools.set(pathId, pool);
    }
  }
  return pools.get(pathId)!;
}

/**
 * Une case : le mur de l'équipement. Étape `gear` : le plan conseillé seul (seul l'équipement change). Autres étapes : le
 * meilleur des plans de la voie (`poolFor`), pour qu'un talent qui demande un soin ou un bouclier trouve son plan.
 */
export function runJob(lab: Lab, job: Job, speedOnly = false): JobResult {
  const build = buildFor(lab, job);
  const enc = lab.combat.encounters[job.encounter]!;
  if (speedOnly) {
    const s = speedOf(lab, job.path, build, enc, SPEED_SEEDS);
    return { ...job, wall: NaN, rate: NaN, above: {}, time: s.time, win1: s.win, speedOnly: true };
  }
  if (job.step === 'gear' || job.step === 'budget') return { ...job, ...wallOf(lab, job.path, build, enc, WALL_SEEDS) };
  let best: JobResult | null = null;
  for (const p of poolFor(lab, job.path)) {
    const r = wallOf(lab, job.path, { ...build, plan: p.plan }, enc, WALL_SEEDS);
    if (!best || r.wall > best.wall) best = { ...job, ...r, plan: p.id };
  }
  return best!;
}

// --- Rapports ---------------------------------------------------------------------------------------------------------

const ZONE_PREFIX = /^z\d\d_/;

export function gearMarkdown(lab: Lab, results: JobResult[]): string {
  const md = ['# Courbe d’équipement du catalogue (étape 5a)', '', '> Généré par `pnpm --filter @bramo/sim sim combat-coherence --step gear`. Ne pas modifier à la main.', ''];
  md.push(
    `**Méthode.** Chaque voie joue son plan conseillé du répertoire 80 (le même pour tous les kits : seul l’équipement change), sans talent ni outil. Statistiques : kits du catalogue convertis par \`${lab.reports === 'coherence' ? 'coherence-v1' : lab.reports}\` (témoin palier 20 Rare mixte ≈ P 100, PV 2 800). Rencontres : six profils du banc et douze zones du PvE v2. Difficulté couplée (dégâts × D, PV × D^1,5) ; mur = plus haut D gagné à 90 % sur 24 graines (5000+), encadré à 3 %. Un cran = ×1,25.`,
    '',
  );
  const paths = Object.values(lab.combat.paths).filter((p) => results.some((r) => r.path === p.id));
  const w = (p: string, b: string, e: string) => results.find((r) => r.path === p && r.build === b && r.encounter === e)?.wall ?? NaN;
  const ratioMed = (a: string, b: string, filter: (e: string) => boolean = () => true) => {
    const rs: number[] = [];
    for (const p of paths) for (const e of lab.encounters) if (filter(e.id)) rs.push(w(p.id, b, e.id) / w(p.id, a, e.id));
    return { med: med(rs), min: Math.min(...rs), max: Math.max(...rs) };
  };
  md.push('## Ce que vaut un palier, une rareté, une orientation', '', '| Passage | Mur (médiane) | Crans | Plus faible | Plus fort |', '|---|---|---|---|---|');
  const tiers = catalogTiers(lab);
  const has = (id: string) => gearKits(lab).some((k) => k.id === id);
  const rarityName: Record<string, string> = { common: 'Commun', rare: 'Rare', epic: 'Épique', legendary: 'Légendaire' };
  const steps: [string, string, string][] = [
    ...(['common', 'rare'] as const).flatMap((r) => tiers.slice(1).map((t, i): [string, string, string] => [`Palier ${tiers[i]} → ${t} (${rarityName[r]})`, `t${tiers[i]}_${r}`, `t${t}_${r}`])),
    ...[20, 60].flatMap((t) => [
      [`Commun → Rare (palier ${t})`, `t${t}_common`, `t${t}_rare`],
      [`Rare → Épique (palier ${t})`, `t${t}_rare`, `t${t}_epic`],
      [`Épique → Légendaire (palier ${t})`, `t${t}_epic`, `t${t}_legendary`],
    ] as [string, string, string][]),
    ['Rare du palier 10 → Commun du palier 20', 't10_rare', 't20_common'],
    ['Mixte → protecteur (palier 20 Rare)', 't20_rare', 't20_rare_protective'],
    ['Mixte → offensif (palier 20 Rare)', 't20_rare', 't20_rare_offensive'],
    ['Lignes aléatoires moyennes (palier 20 Rare)', 't20_rare', 't20_rare_rolls'],
  ].filter(([, a, b]) => has(a!) && has(b!)) as [string, string, string][];
  for (const [label, a, b] of steps) {
    const r = ratioMed(a, b);
    md.push(`| ${label} | ×${fr(r.med, 2)} | ${fr(crans(r.med), 2)} | ×${fr(r.min, 2)} | ×${fr(r.max, 2)} |`);
  }
  md.push('');
  md.push('## Orientation : protecteur ou offensif, selon la rencontre', '', 'Ratio du mur protecteur / offensif (palier 20 Rare), médiane des neuf voies. Au-dessus de 1, l’armure protectrice franchit plus haut.', '');
  md.push('| Rencontre | Protecteur / offensif | Voies où le protecteur gagne |', '|---|---|---|');
  for (const e of lab.encounters) {
    const rs = paths.map((p) => w(p.id, 't20_rare_protective', e.id) / w(p.id, 't20_rare_offensive', e.id));
    md.push(`| ${e.name} | ×${fr(med(rs), 2)} | ${rs.filter((x) => x > 1.03).length}/9 |`);
  }
  md.push('');
  md.push('## Murs par voie (palier 20 Rare mixte) et par kit (moyenne géométrique sur les 18 rencontres)', '');
  const kits = gearKits(lab);
  md.push(`| Voie | ${kits.map((k) => k.id).join(' | ')} |`, `|---|${kits.map(() => '---').join('|')}|`);
  for (const p of paths) md.push(`| ${p.name} | ${kits.map((k) => `×${fr(geo(lab.encounters.map((e) => w(p.id, k.id, e.id))), 2)}`).join(' | ')} |`);
  md.push('');
  md.push('## Échecs juste au-dessus du mur', '');
  const causes: Record<string, number> = {};
  for (const r of results) for (const [k, v] of Object.entries(r.above)) causes[k] = (causes[k] ?? 0) + v;
  md.push(Object.entries(causes).sort((a, b) => b[1] - a[1]).map(([k, v]) => `- ${k} : ${v}`).join('\n'), '');
  void ZONE_PREFIX;
  return md.join('\n');
}

// --- Combinaisons : meilleures, médiane, dernière ---------------------------------------------------------------------

const comboMean = (q: ComboScore) => q.wins.reduce((a, x) => a + x, 0) / q.wins.length;
/** Par voie : les trois meilleures combinaisons du criblage, la médiane et la dernière. */
export function comboPicks(scores: ComboScore[], pathId: string): { role: string; combo: string }[] {
  const list = scores.filter((s) => s.path === pathId).sort((a, b) => comboMean(b) - comboMean(a) || a.combo.localeCompare(b.combo));
  if (!list.length) return [];
  return [
    { role: 'best1', combo: list[0]!.combo },
    { role: 'best2', combo: list[1]!.combo },
    { role: 'best3', combo: list[2]!.combo },
    { role: 'median', combo: list[list.length >> 1]!.combo },
    { role: 'last', combo: list[list.length - 1]!.combo },
  ];
}
export function comboWallJobs(lab: Lab, scores: ComboScore[], step: 'quadwalls' | 'pairwalls'): Job[] {
  return Object.keys(lab.combat.paths).flatMap((path) => comboPicks(scores, path).flatMap((p) => lab.encounters.map((e) => ({ step, path, build: p.combo, encounter: e.id }))));
}

/** Tableau commun aux paires d'ensembles et aux quatre gemmes : écart entre combinaisons, et éléments les plus présents. */
function comboTable(lab: Lab, base: JobResult[], scores: ComboScore[], walls: JobResult[], label: (id: string) => string, md: string[]) {
  const paths = Object.values(lab.combat.paths).filter((p) => scores.some((r) => r.path === p.id));
  const index = (rs: JobResult[], p: string, b: string) => geo(lab.encounters.map((e) => rs.find((r) => r.path === p && r.build === b && r.encounter === e.id)?.wall ?? NaN));
  md.push('| Voie | Meilleure combinaison | Score (victoires à mur × 1,06) | Combinaisons à 90 % du meilleur score | Meilleure / aucune (mur) | Médiane / aucune | Meilleure / médiane | Dernière / aucune |', '|---|---|---|---|---|---|---|---|');
  const freq: Record<string, number> = {};
  const firstPerEnc: Record<string, number> = {};
  for (const p of paths) {
    const list = scores.filter((s) => s.path === p.id).sort((a, b) => comboMean(b) - comboMean(a));
    const best = comboMean(list[0]!);
    for (const q of list.slice(0, 10)) for (const g of q.combo.split('+')) freq[g] = (freq[g] ?? 0) + 1;
    lab.encounters.forEach((_, i) => {
      const top = Math.max(...list.map((q) => q.wins[i]!));
      const winners = list.filter((q) => q.wins[i]! >= top);
      // Élément présent dans toutes les combinaisons premières de la rencontre : il « s'impose ».
      for (const g of new Set(winners[0]!.combo.split('+'))) if (winners.every((q) => q.combo.split('+').includes(g))) firstPerEnc[g] = (firstPerEnc[g] ?? 0) + 1;
    });
    const picks = comboPicks(scores, p.id);
    const w = (role: string) => index(walls, p.id, picks.find((x) => x.role === role)!.combo);
    const none = index(base, p.id, 'none');
    md.push(`| ${p.name} | ${list[0]!.combo.split('+').map(label).join(', ')} | ${fr(best * 100, 0)} % | ${list.filter((q) => comboMean(q) >= 0.9 * best).length} sur ${list.length} | ${pct(w('best1') / none)} | ${pct(w('median') / none)} | ${pct(w('best1') / w('median'))} | ${pct(w('last') / none)} |`);
  }
  md.push('', `Présence dans les dix meilleures combinaisons de chaque voie (${paths.length} voies × 10) :`, '', Object.entries(freq).sort((a, b) => b[1] - a[1]).map(([g, n]) => `- ${label(g)} : ${n}`).join('\n'), '');
  md.push(`Élément présent dans **toutes** les combinaisons premières d’une rencontre (sur ${paths.length} voies × ${lab.encounters.length} rencontres) :`, '', Object.entries(firstPerEnc).sort((a, b) => b[1] - a[1]).map(([g, n]) => `- ${label(g)} : ${n}`).join('\n') || '- aucun', '');
}

export function setsMarkdown(lab: Lab, singles: JobResult[], scores: ComboScore[], walls: JobResult[]): string {
  const md = ['# Ensembles du dossier « Le cœur du jeu » dans le moteur', '', '> Généré par `pnpm --filter @bramo/sim sim combat-coherence --step sets|pairs|pairwalls`. Ne pas modifier à la main.', ''];
  md.push(
    '**Méthode.** Témoin : kit palier 20 Rare mixte de la classe (statistiques réelles, ≈ P 100, PV 2 800), aucune gemme, meilleur des plans de la voie (conseillé, de groupe, le plus sûr). Chaque ensemble à 4 pièces porté **seul** : mur sur 24 graines (5000+), 18 rencontres. Puis les 91 **paires 4+4** (douze communs et deux de classe) criblées juste au-dessus du mur du témoin (mur × 1,06, 8 graines) ; les trois meilleures, la médiane et la dernière rejouées en murs complets. Effets et coefficients du dossier (`coherence-v1/talents.yaml`).',
    '',
  );
  const paths = Object.values(lab.combat.paths).filter((p) => singles.some((r) => r.path === p.id));
  const name = (id: string) => id.split('+').map((s) => lab.catalog.sets.find((x) => x.id === s)?.name ?? s).join(' + ');
  const index = (p: string, b: string) => geo(lab.encounters.map((e) => singles.find((r) => r.path === p && r.build === b && r.encounter === e.id)?.wall ?? NaN));
  md.push('## Un ensemble seul (4 pièces) : ce qu’il ajoute au mur (indice sur les 18 rencontres)', '');
  const ids = [...new Set(lab.catalog.sets.map((s) => s.id))];
  md.push(`| Ensemble | ${paths.map((p) => p.name).join(' | ')} | Médiane |`, `|---|${paths.map(() => '---').join('|')}|---|`);
  for (const s of ids) {
    const rs = paths.map((p) => (singles.some((r) => r.path === p.id && r.build === s) ? index(p.id, s) / index(p.id, 'none') : NaN));
    md.push(`| ${name(s)} | ${rs.map((r) => (Number.isNaN(r) ? '·' : pct(r))).join(' | ')} | ${pct(med(rs.filter((r) => !Number.isNaN(r))))} |`);
  }
  md.push('', '## Meilleur ensemble seul, rencontre par rencontre', '');
  const firsts: Record<string, number> = {};
  for (const p of paths) for (const e of lab.encounters) {
    const ws = ids.map((s) => ({ s, w: singles.find((r) => r.path === p.id && r.build === s && r.encounter === e.id)?.wall ?? 0 }));
    const top = Math.max(...ws.map((x) => x.w));
    for (const x of ws) if (x.w >= top) firsts[x.s] = (firsts[x.s] ?? 0) + 1;
  }
  md.push(Object.entries(firsts).sort((a, b) => b[1] - a[1]).map(([s, n]) => `- ${name(s)} : ${n}`).join('\n'), '');
  if (scores.length) {
    md.push('## Paires 4+4', '');
    comboTable(lab, singles, scores, walls, name, md);
  }
  return md.join('\n');
}

export function gemsMarkdown(lab: Lab, gems: JobResult[], scores: ComboScore[], quadWalls: JobResult[]): string {
  const md = ['# Gemmes majeures et nommés du dossier dans le moteur', '', '> Généré par `pnpm --filter @bramo/sim sim combat-coherence --step gems|quads|quadwalls`. Ne pas modifier à la main.', ''];
  md.push(
    '**Méthode.** Témoin : kit palier 20 Rare mixte de la classe, aucun ensemble, meilleur des plans de la voie (conseillé, de groupe, le plus sûr). Chaque gemme et chaque nommé portable est porté **seul** : mur sur 24 graines, 18 rencontres. Puis **370 combinaisons de quatre gemmes** par voie (les 70 que forment ses huit meilleures gemmes seules, et 300 tirées au hasard parmi les 3 060) sont criblées juste au-dessus du mur du témoin (mur × 1,06, plan du témoin, 6 graines) ; les trois meilleures, la médiane et la dernière sont rejouées en murs complets.',
    '',
  );
  const paths = Object.values(lab.combat.paths).filter((p) => gems.some((r) => r.path === p.id));
  const get = (rs: JobResult[], p: string, b: string, e: string) => rs.find((r) => r.path === p && r.build === b && r.encounter === e)?.wall ?? NaN;
  const index = (rs: JobResult[], p: string, b: string) => geo(lab.encounters.map((e) => get(rs, p, b, e.id)));
  const label = (id: string) => [...lab.catalog.gems, ...lab.catalog.named].find((g) => g.id === id)?.name ?? id;
  md.push('## Une gemme seule : ce qu’elle ajoute au mur (indice sur les 18 rencontres)', '');
  const ids = gemIds(lab);
  md.push(`| Gemme | ${paths.map((p) => p.name).join(' | ')} | Médiane |`, `|---|${paths.map(() => '---').join('|')}|---|`);
  for (const g of ids) {
    const rs = paths.map((p) => index(gems, p.id, g) / index(gems, p.id, 'none'));
    md.push(`| ${label(g)} | ${rs.map(pct).join(' | ')} | ${pct(med(rs))} |`);
  }
  md.push('', '## Un nommé seul (même mesure ; un nommé occupe une place de majeure)', '');
  const named = [...new Set(lab.catalog.named.map((n) => n.id))];
  md.push(`| Nommé | ${paths.map((p) => p.name).join(' | ')} |`, `|---|${paths.map(() => '---').join('|')}|`);
  for (const n of named) md.push(`| ${label(n)} | ${paths.map((p) => (gems.some((r) => r.path === p.id && r.build === n) ? pct(index(gems, p.id, n) / index(gems, p.id, 'none')) : '·')).join(' | ')} |`);
  md.push('', '## Meilleure gemme seule, rencontre par rencontre', '', 'Nombre de cases (voie × rencontre) où la gemme a le plus haut mur parmi les gemmes seules (ex æquo comptés pour chacune).', '');
  const firsts: Record<string, number> = {};
  for (const p of paths) for (const e of lab.encounters) {
    const ws = ids.map((g) => ({ g, w: get(gems, p.id, g, e.id) }));
    const top = Math.max(...ws.map((x) => x.w));
    for (const x of ws) if (x.w >= top) firsts[x.g] = (firsts[x.g] ?? 0) + 1;
  }
  md.push(Object.entries(firsts).sort((a, b) => b[1] - a[1]).map(([g, n]) => `- ${label(g)} : ${n}`).join('\n'), '');
  if (scores.length) {
    md.push('## Quatre gemmes', '');
    comboTable(lab, gems, scores, quadWalls, label, md);
  }
  return md.join('\n');
}

// --- Outils de situation contre un vrai généraliste ---------------------------------------------------------------

export const FAMILY_OF = (e: { windows?: unknown; erosion?: unknown; charge?: unknown; attack: { heavyEvery?: number }; adds?: { attack: { heavyEvery?: number } }[]; guard?: unknown; aura?: unknown }) => {
  const out: string[] = [];
  if (e.windows) out.push('interstice');
  if (e.erosion) out.push('rain');
  if (e.charge || e.attack.heavyEvery || (e.adds ?? []).some((a) => a.attack.heavyEvery)) out.push('impact');
  if (e.adds?.length) out.push('beat');
  if (e.guard) out.push('fracture');
  if (e.aura) out.push('breath');
  return out;
};

/**
 * Le généraliste de la voie : sa meilleure paire d'ensembles et sa meilleure combinaison de gemmes, rejouées en murs complets
 * (la meilleure des trois premières du criblage, indice sur les 18 rencontres).
 */
export interface Inputs {
  sets: JobResult[];
  pairs: ComboScore[];
  pairWalls: JobResult[];
  gems: JobResult[];
  quads: ComboScore[];
  quadWalls: JobResult[];
}
export function generalist(lab: Lab, pathId: string, x: Inputs) {
  const idx = (rs: JobResult[], b: string) => geo(lab.encounters.map((e) => rs.find((r) => r.path === pathId && r.build === b && r.encounter === e.id)?.wall ?? NaN));
  const top = (scores: ComboScore[], walls: JobResult[]) =>
    comboPicks(scores, pathId)
      .filter((p) => p.role.startsWith('best'))
      .map((p) => p.combo)
      .reduce((a, b) => (idx(walls, b) > idx(walls, a) ? b : a));
  const pair = top(x.pairs, x.pairWalls);
  const [s1, s2] = pair.split('+') as [string, string];
  const strong = idx(x.sets, s1) >= idx(x.sets, s2) ? s1 : s2;
  const quad = top(x.quads, x.quadWalls);
  const weakestGem = quad.split('+').reduce((a, b) => (idx(x.gems, b) < idx(x.gems, a) ? b : a));
  return { pair, strong, quad, weakestGem };
}

export function toolJobs(lab: Lab, x: Inputs): Job[] {
  const out: Job[] = [];
  for (const path of Object.keys(lab.combat.paths)) {
    const g = generalist(lab, path, x);
    for (const e of lab.encounters.filter((x) => /^z\d\d_/.test(x.id))) {
      const fams = FAMILY_OF(e);
      const prios = ['chief', ...(e.adds?.length ? ['adds_first'] : []), ...(e.guard && e.enemies > 1 ? ['unguarded_first'] : [])];
      const add = (build: string) => out.push({ step: 'tools', path, build, encounter: e.id });
      for (const pr of prios) {
        add(`${g.quad}|${g.pair}|none|${pr}`);
        add(`none|none|none|${pr}`);
        for (const f of fams) {
          const gem = lab.tools.find((t) => t.family === f && t.rank === 'gem')!.id;
          const prep = lab.tools.find((t) => t.family === f && t.rank === 'prep')!.id;
          add(`${g.quad}|${g.strong}+${f}|none|${pr}`);
          add(`${g.quad.split('+').map((x) => (x === g.weakestGem ? gem : x)).join('+')}|${g.pair}|none|${pr}`);
          add(`${g.quad}|${g.pair}|${prep}|${pr}`);
          add(`none|${f}|none|${pr}`);
        }
      }
    }
  }
  return out;
}

export function toolsMarkdown(lab: Lab, results: JobResult[], x: Inputs): string {
  const md = ['# Outils de situation contre un vrai généraliste', '', '> Généré par `pnpm --filter @bramo/sim sim combat-coherence --step tools`. Ne pas modifier à la main.', ''];
  md.push(
    '**Méthode.** Généraliste de chaque voie : sa meilleure paire d’ensembles du dossier (4+4, indice sur les 18 rencontres) et sa meilleure combinaison de quatre gemmes (criblage), statistiques réelles du témoin palier 20 Rare. Candidats dans chaque zone, pour chaque famille présente : **ensemble de situation** à la place du plus faible des deux ensembles (4 pièces contre 4) ; **gemme de situation** à la place de la gemme la moins utile ; **préparation** en plus. Pour comparer à `verification-claude.md`, le témoin nu (ni ensemble ni gemme) et l’ensemble de situation seul. Pour chaque cas, le meilleur des plans de la voie et des priorités de cible utiles ; mur sur 24 graines.',
    '',
  );
  const paths = Object.values(lab.combat.paths).filter((p) => results.some((r) => r.path === p.id));
  const zones = lab.encounters.filter((e) => /^z\d\d_/.test(e.id));
  /** Meilleur mur d'un équipement (sans la priorité) dans la zone, toutes priorités confondues. */
  const best = (p: string, e: string, prefix: string) => Math.max(...results.filter((r) => r.path === p && r.encounter === e && r.build.split('|').slice(0, 3).join('|') === prefix).map((r) => r.wall));
  md.push('## Généralistes retenus', '', '| Voie | Paire d’ensembles | Gemmes |', '|---|---|---|');
  const gens = Object.fromEntries(paths.map((p) => [p.id, generalist(lab, p.id, x)]));
  const setName = (id: string) => lab.catalog.sets.find((s) => s.id === id)?.name ?? id;
  const gemName = (id: string) => [...lab.catalog.gems, ...lab.catalog.named].find((g) => g.id === id)?.name ?? lab.tools.find((t) => t.id === id)?.name ?? id;
  for (const p of paths) md.push(`| ${p.name} | ${gens[p.id]!.pair.split('+').map(setName).join(' + ')} | ${gens[p.id]!.quad.split('+').map(gemName).join(', ')} |`);
  md.push('');
  md.push('## Ce que gagne l’outil adapté', '', 'Ratio du mur, même voie. **Réel** : contre le généraliste (on retire 4 pièces d’ensemble ou une gemme pour le porter). **Majorant** : ensemble seul contre le témoin nu (mesure de `verification-claude.md`).', '');
  md.push('Entre parenthèses : en **paliers d’avance** (un palier de la courbe proposée, +12 % de P et de PV, vaut ×1,096 de mur).', '');
  md.push('| Zone | Famille | Ensemble (réel) médiane | Pire voie | Voies ≥ ×1,25 · ≥ 1 palier | Gemme (réel) médiane | Préparation médiane | Ensemble seul / nu (majorant) |', '|---|---|---|---|---|---|---|---|');
  let c1 = 0;
  let c1p = 0;
  const firstSet: Record<string, number> = {};
  const firstGem: Record<string, number> = {};
  for (const e of zones) {
    const fams = FAMILY_OF(e);
    const rows = fams.map((f) => {
      const gem = lab.tools.find((t) => t.family === f && t.rank === 'gem')!.id;
      const prep = lab.tools.find((t) => t.family === f && t.rank === 'prep')!.id;
      const set = paths.map((p) => best(p.id, e.id, `${gens[p.id]!.quad}|${gens[p.id]!.strong}+${f}|none`) / best(p.id, e.id, `${gens[p.id]!.quad}|${gens[p.id]!.pair}|none`));
      const gm = paths.map((p) => best(p.id, e.id, `${gens[p.id]!.quad.split('+').map((x) => (x === gens[p.id]!.weakestGem ? gem : x)).join('+')}|${gens[p.id]!.pair}|none`) / best(p.id, e.id, `${gens[p.id]!.quad}|${gens[p.id]!.pair}|none`));
      const pr = paths.map((p) => best(p.id, e.id, `${gens[p.id]!.quad}|${gens[p.id]!.pair}|${prep}`) / best(p.id, e.id, `${gens[p.id]!.quad}|${gens[p.id]!.pair}|none`));
      const maj = paths.map((p) => best(p.id, e.id, `none|${f}|none`) / best(p.id, e.id, 'none|none|none'));
      return { f, set, gm, pr, maj };
    });
    const top = rows.reduce((a, b) => (med(b.set) > med(a.set) ? b : a));
    firstSet[top.f] = (firstSet[top.f] ?? 0) + 1;
    const topG = rows.reduce((a, b) => (med(b.gm) > med(a.gm) ? b : a));
    firstGem[topG.f] = (firstGem[topG.f] ?? 0) + 1;
    const perPath = paths.map((_, i) => Math.max(...rows.map((r) => r.set[i]!)));
    if (perPath.every((x) => x >= 1.25)) c1++;
    if (perPath.every((x) => x >= PALIER)) c1p++;
    for (const r of rows) {
      const worst = Math.min(...r.set);
      const pa = (x: number) => `×${fr(x, 2)} (${fr(paliers(x), 1)})`;
      md.push(`| ${e.name} | ${r.f} | ${pa(med(r.set))} | ${pa(worst)} ${paths[r.set.indexOf(worst)]!.name} | ${r.set.filter((x) => x >= 1.25).length}/${paths.length} · ${r.set.filter((x) => x >= PALIER).length}/${paths.length} | ${pa(med(r.gm))} | ${pa(med(r.pr))} | ${pa(med(r.maj))} |`);
    }
  }
  md.push('', `**Critère 1 du PvE v2 (outil adapté ≥ ×1,25 contre le généraliste, pour chaque voie) : ${c1} zones sur ${zones.length}** (cible : au moins 6). Avec la cible proposée ici (≥ 1 palier d’avance, ×1,096) : **${c1p} zones sur ${zones.length}**.`, '');
  md.push('**Critère 2 (chaque famille première dans au moins deux zones)** — ensemble : ' + Object.entries(firstSet).map(([f, n]) => `${f} ${n}`).join(', ') + ' ; gemme : ' + Object.entries(firstGem).map(([f, n]) => `${f} ${n}`).join(', ') + '.', '');
  md.push('## Échecs juste au-dessus du mur', '');
  const causes: Record<string, number> = {};
  for (const r of results) for (const [k, v] of Object.entries(r.above)) causes[k] = (causes[k] ?? 0) + v;
  md.push(Object.entries(causes).sort((a, b) => b[1] - a[1]).map(([k, v]) => `- ${k} : ${v}`).join('\n'), '');
  return md.join('\n');
}

/**
 * Déclenchements : chaque gemme, chaque nommé de la classe et chaque ensemble (4 pièces), porté seul sur le témoin, joué une
 * fois au danger 1 sur chaque rencontre. Un talent qui ne part jamais pour une voie n'a pas de raison d'exister pour elle.
 */
export function triggersReport(lab: Lab): string {
  const md = ['# Déclenchements des talents par voie', '', '> Généré par `pnpm --filter @bramo/sim sim combat-coherence --step triggers`. Ne pas modifier à la main.', ''];
  md.push('Nombre moyen de déclenchements par combat (danger 1, graine 1, 18 rencontres), talent porté seul sur le témoin palier 20 Rare. **0** : jamais déclenché pour cette voie.', '');
  const paths = Object.values(lab.combat.paths);
  const items: { id: string; name: string; kind: 'gem' | 'named' | 'set'; cls?: string }[] = [
    ...lab.catalog.gems.map((g) => ({ id: g.id, name: g.name, kind: 'gem' as const })),
    ...lab.catalog.named.map((g) => ({ id: g.id, name: g.name, kind: 'named' as const, ...(g.class ? { cls: g.class } : {}) })),
    ...lab.catalog.sets.map((s) => ({ id: s.id, name: s.name, kind: 'set' as const, ...(s.class ? { cls: s.class } : {}) })),
  ];
  md.push(`| Talent | ${paths.map((p) => p.name).join(' | ')} |`, `|---|${paths.map(() => '---').join('|')}|`);
  for (const it of items) {
    const cells = paths.map((p) => {
      if (it.cls && it.cls !== p.class) return '·';
      const build = loadoutBuild(lab, p.id, it.id, it.kind === 'set' ? { sets: { [it.id]: 4 } } : it.kind === 'gem' ? { gems: [it.id] } : { named: [it.id] });
      let n = 0;
      for (const e of lab.encounters) {
        const m = play1(lab, p.id, build, e.id);
        for (const [k, v] of Object.entries(m)) if (k.startsWith('talent:')) n += v;
      }
      const avg = n / lab.encounters.length;
      return avg === 0 ? '**0**' : fr(avg, 1);
    });
    md.push(`| ${it.name} | ${cells.join(' | ')} |`);
  }
  return md.join('\n');
}
const play1 = (lab: Lab, path: string, build: Build, enc: string) => play(lab, path, build, lab.combat.encounters[enc]!, 1, 1).team[0]!.metrics;

export type { Talent };

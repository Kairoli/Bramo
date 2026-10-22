/**
 * Le build, version 2 (docs/design/coherence/build.md) : réserves, gemmes, ensembles à deux étages, objets nommés, lignes de
 * butin. Mesures, toutes dans le moteur du jeu, mêmes graines pour tous les builds :
 * - `base` : mur du témoin sans talent (palier 20 Rare mixte), par voie et rencontre (référence des autres étapes) ;
 * - `builds` : builds d'archétype (une réserve) et builds tirés au hasard, chacun avec le meilleur plan de la voie ;
 *   vitesse au danger 1 et part des combats gagnés un palier au-dessus du mur du témoin ;
 * - `loot` : le même build avec des lignes absentes, au hasard, ou alignées sur lui (la valeur du bon butin) ;
 * - `situation` : au mur d'une zone, le meilleur build garde ses styles et prend le 4 pièces de situation.
 */
import { type CombatStats, type Encounter, type Rarity, type TargetPriority, buildFromLines, resolveLoadout, statsFromGear, stream } from '@bramo/shared';
import { buildKit } from '../coherence/kits.js';
import { type Build, type Lab, PALIER, type WallResult, paliers, play, seedList, wallOf } from '../coherence/lab.js';
import { FAMILY_OF, poolFor } from './combat-coherence.js';

const geo = (xs: number[]) => Math.exp(xs.reduce((a, x) => a + Math.log(x), 0) / xs.length);
const med = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length ? (s.length % 2 ? s[s.length >> 1]! : (s[s.length / 2 - 1]! + s[s.length / 2]!) / 2) : NaN;
};
const fr = (n: number, d = 1) => n.toFixed(d).replace('.', ',');
const pct = (r: number) => `${r >= 1 ? '+' : ''}${fr((r - 1) * 100, 0)} %`;

/** Un build : quatre majeures (gemmes, nommés), des ensembles (pièces), des lignes (aucune, au hasard, alignées). */
export interface BuildSpec {
  id: string;
  /** Archétype des lignes alignées (une réserve) ; `stats` : lignes de statistiques seulement. */
  archetype: string;
  majors: string[];
  sets: Record<string, number>;
  lines: 'none' | 'mean' | 'aligned';
  /** Origine : archétype construit à la main, ou tirage. */
  kind: 'archetype' | 'random' | 'witness';
}

/** Lignes préférées par archétype (la chasse au bon jet : celles qu'on garde quand elles tombent). */
const PREFERRED: Record<string, string[]> = {
  tisons: ['Tisons au plafond', 'Dégâts des afflictions', 'Durée des afflictions', 'Dépenses de réserve', 'Compétences', 'Puissance'],
  entailles: ['Entailles au plafond', 'Critique', 'Dégâts critiques', 'Dépenses de réserve', 'Puissance', 'Compétences'],
  frimas: ['Frimas au plafond', 'Durée des ralentissements', 'Pression', 'Dépenses de réserve', 'Puissance des boucliers', 'Puissance'],
  rancoeur: ['Rancœur au plafond', 'Puissance des boucliers', 'Dépenses de réserve', 'Vitalité', 'Défense', 'Attaques de base'],
  ferveur: ['Ferveur au plafond', 'Puissance des soins', 'Puissance des boucliers', 'Dépenses de réserve', 'Vitalité', 'Puissance'],
  mesure: ['Mesure au plafond', 'Attaques de base', 'Cadence', 'Dépenses de réserve', 'Puissance', 'Critique'],
  echos: ['Échos au plafond', 'Compétences', 'Cadence', 'Dépenses de réserve', 'Puissance', 'Critique'],
  trophees: ['Trophées au plafond', 'Puissance', 'Compétences', 'Critique', 'Dépenses de réserve', 'Cadence'],
  stats: ['Puissance', 'Critique', 'Cadence', 'Dégâts critiques', 'Compétences', 'Vitalité'],
};
export const ARCHETYPES = ['tisons', 'entailles', 'frimas', 'rancoeur', 'ferveur', 'mesure', 'echos', 'trophees'] as const;

/**
 * Lignes d'un kit Rare (1,5 ligne par pièce en moyenne) : alignées = par emplacement, la ligne préférée du groupe au jet
 * moyen, puis une demi-ligne de la suivante ; au hasard = chaque ligne du groupe au prorata ; aucune.
 */
export function kitLines(lab: Lab, archetype: string, mode: BuildSpec['lines']): Record<string, number> {
  const out: Record<string, number> = {};
  if (mode === 'none') return out;
  const k = lab.content.gearPools.tierScale['20'] ?? 1;
  for (const slot of ['head', 'torso', 'hands', 'legs', 'feet', 'cape', 'belt', 'necklace', 'ring', 'ring', 'weapon']) {
    const pool = lab.content.gearPools.pools[slot] ?? [];
    if (mode === 'mean') {
      for (const l of pool) out[l.name] = (out[l.name] ?? 0) + ((l.min + l.max) / 2) * k * (1.5 / pool.length);
      continue;
    }
    const pref = [...(PREFERRED[archetype] ?? []), ...PREFERRED.stats!];
    const ranked = pref.map((n) => pool.find((l) => l.name === n)).filter((l): l is NonNullable<typeof l> => !!l);
    const uniq = [...new Map(ranked.map((l) => [l.name, l])).values()];
    uniq.slice(0, 2).forEach((l, i) => (out[l.name] = (out[l.name] ?? 0) + ((l.min + l.max) / 2) * k * (i === 0 ? 1 : 0.5)));
  }
  return out;
}

const RULES = { majors: 4, setPieces: 10, preps: 1 };

/** Le build prêt pour le moteur : statistiques du témoin et des lignes, talents, réserves, outils. */
export function makeBuild(lab: Lab, pathId: string, spec: BuildSpec): Build {
  const cls = lab.combat.paths[pathId]!.class;
  const lines = kitLines(lab, spec.archetype, spec.lines);
  const named = spec.majors.filter((m) => lab.catalog.named.some((n) => n.id === m));
  const gems = spec.majors.filter((m) => !named.includes(m));
  const r = resolveLoadout(lab.catalog, lab.tools, { gems, named, sets: spec.sets, lines: buildFromLines(lab.combat.rules, lines) }, RULES);
  if (r.errors.length) throw new Error(`${spec.id} : ${r.errors.join(' ; ')}`);
  const kit = buildKit(lab.content, { classId: cls, tier: 20, rarity: 'rare' as Rarity, orientation: 'mixed', rolls: 'none' });
  const stats: CombatStats = statsFromGear(lab.combat.rules, { stats: kit.totals.stats, lines }, 20, r.mods);
  return { id: spec.id, stats, talents: r.talents, tools: r.tools, pools: r.pools, convert: r.convert };
}

/** Ensembles portables par une classe, et ceux qui nourrissent un archétype (leur 2 ou 3 pièces remplit sa réserve). */
const setsOf = (lab: Lab, cls: string) => lab.catalog.sets.filter((s) => !s.class || s.class === cls);
function feeds(set: Lab['catalog']['sets'][number], pool: string): boolean {
  const t = JSON.stringify([set.pieces['2'] ?? {}, set.pieces['3'] ?? {}]);
  return t.includes(`"pool":"${pool}"`) || t.includes(`"${pool}":`);
}

/** Build d'archétype : les gemmes de la réserve (complétées par un utilitaire), ses ensembles à 3 pièces, puis 2+2. */
export function archetypeSpec(lab: Lab, pathId: string, archetype: string): BuildSpec {
  const cls = lab.combat.paths[pathId]!.class;
  const gems = lab.catalog.gems.filter((g) => g.archetype === archetype).map((g) => g.id);
  while (gems.length < 4) gems.push(['oeil_du_chasseur', 'bastion_operette', 'derniere_etincelle'].find((u) => !gems.includes(u))!);
  const own = setsOf(lab, cls).filter((s) => feeds(s, archetype)).map((s) => s.id);
  const fill = setsOf(lab, cls).map((s) => s.id).filter((s) => !own.includes(s));
  const order = [...own, ...fill];
  const sets: Record<string, number> = {};
  [3, 3, 2, 2].forEach((n, i) => (sets[order[i]!] = n));
  return { id: `arch:${archetype}`, archetype, majors: gems.slice(0, 4), sets, lines: 'aligned', kind: 'archetype' };
}

/** Builds tirés au hasard (graine fixe par voie) : majeures, disposition d'ensembles, lignes alignées sur l'archétype dominant. */
export function randomSpecs(lab: Lab, pathId: string, count: number): BuildSpec[] {
  const cls = lab.combat.paths[pathId]!.class;
  const rand = stream(777, `builds:${pathId}`);
  const pick = <T,>(xs: T[]) => xs[Math.floor(rand() * xs.length)]!;
  const majorsPool = [...lab.catalog.gems.map((g) => g.id), ...lab.catalog.named.filter((n) => !n.class || n.class === cls).map((n) => n.id)];
  const layouts = [[4, 4, 2], [4, 3, 3], [3, 3, 2, 2], [4, 2, 2, 2], [2, 2, 2, 2, 2], [3, 3, 3]];
  const setIds = setsOf(lab, cls).map((s) => s.id);
  const out: BuildSpec[] = [];
  for (let i = 0; i < count; i++) {
    const majors = new Set<string>();
    while (majors.size < 4) majors.add(pick(majorsPool));
    const layout = pick(layouts);
    const chosen = new Set<string>();
    while (chosen.size < layout.length) chosen.add(pick(setIds));
    const sets = Object.fromEntries([...chosen].map((s, j) => [s, layout[j]!]));
    const arch: Record<string, number> = {};
    for (const m of majors) {
      const a = lab.catalog.gems.find((g) => g.id === m)?.archetype;
      if (a) arch[a] = (arch[a] ?? 0) + 1;
    }
    const top = Object.entries(arch).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'stats';
    out.push({ id: `rand:${pathId}:${i}`, archetype: top, majors: [...majors], sets, lines: rand() < 0.7 ? 'aligned' : 'mean', kind: 'random' });
  }
  return out;
}

export const witnessSpec = (lines: BuildSpec['lines'] = 'none'): BuildSpec => ({ id: `witness:${lines}`, archetype: 'stats', majors: [], sets: {}, lines, kind: 'witness' });

/** Tous les builds d'une voie : témoins, archétypes (et leurs variantes de lignes), tirages. */
export function allSpecs(lab: Lab, pathId: string, random = 200): BuildSpec[] {
  const arch = ARCHETYPES.map((a) => archetypeSpec(lab, pathId, a));
  const loot = arch.flatMap((s) => (['none', 'mean'] as const).map((l) => ({ ...s, id: `loot:${s.archetype}:${l}`, lines: l, kind: 'archetype' as const })));
  return [witnessSpec('none'), witnessSpec('aligned'), ...arch, ...loot, ...randomSpecs(lab, pathId, random)];
}

/** Builds rejoués en murs complets : témoin, meilleur et médian (tous builds), meilleur et moins bon archétype. */
export function wallPicks(scores: BuildScore[], pathId: string): { role: string; spec: BuildSpec }[] {
  const all = scores.filter((s) => s.path === pathId);
  const w = all.find((s) => s.spec.id === 'witness:none')!;
  const ranked = all.filter((s) => s.spec.kind !== 'witness' && !s.spec.id.startsWith('loot:')).sort((a, b) => speedIndex(b, w) - speedIndex(a, w));
  const arch = ranked.filter((s) => s.spec.kind === 'archetype');
  return [
    { role: 'witness', spec: w.spec },
    { role: 'stats', spec: witnessSpec('aligned') },
    { role: 'best', spec: ranked[0]!.spec },
    { role: 'median', spec: ranked[ranked.length >> 1]!.spec },
    { role: 'arch-best', spec: arch[0]!.spec },
    { role: 'arch-worst', spec: arch[arch.length - 1]!.spec },
  ];
}

// --- Mesures ------------------------------------------------------------------------------------------------------

export interface BaseWall extends WallResult {
  path: string;
  encounter: string;
  plan: string;
}

/**
 * Priorités de cible utiles dans une rencontre (comme l'étape `tools` de combat-coherence) : chaque mesure garde la meilleure,
 * comme un joueur qui règle sa cible prioritaire.
 */
export const priorities = (enc: Encounter): TargetPriority[] => ['chief', ...(enc.adds?.length ? (['adds_first'] as const) : []), ...(enc.guard && enc.enemies > 1 ? (['unguarded_first'] as const) : [])];

/** Plans de la voie × priorités utiles : toutes les façons de jouer un même équipement. */
export const playWays = (lab: Lab, pathId: string, enc: Encounter) => poolFor(lab, pathId).flatMap((p) => priorities(enc).map((priority) => ({ id: priority === 'chief' ? p.id : `${p.id}+${priority}`, plan: p.plan, priority })));

/** Mur du témoin sans talent, meilleure façon de jouer. */
export function baseWall(lab: Lab, pathId: string, enc: Encounter): BaseWall {
  let best: BaseWall | null = null;
  for (const w of playWays(lab, pathId, enc)) {
    const r = wallOf(lab, pathId, { ...makeBuild(lab, pathId, witnessSpec()), plan: w.plan, priority: w.priority }, enc, seedList(5000, 24));
    if (!best || r.wall > best.wall) best = { path: pathId, encounter: enc.id, plan: w.id, ...r };
  }
  return best!;
}

export interface BuildScore {
  path: string;
  spec: BuildSpec;
  /** Par rencontre : temps médian des victoires au danger 1 (240 si aucune), victoires un palier au-dessus du mur du témoin, plan retenu. */
  time: number[];
  step: number[];
  plan: string[];
}

const SPEED_SEEDS = seedList(9100, 3);
const STEP_SEEDS = seedList(9200, 4);

/** Seuil du critère « mur » : deux paliers au-dessus du mur du témoin (un seul était franchi par presque tous les builds). */
export const STEP = PALIER ** 2;

/**
 * Score d'un build, rencontre par rencontre : **vitesse** = temps médian des victoires au danger 1 du plan le plus rapide de la
 * voie (on farme avec son plan rapide) ; **mur** = part des victoires deux paliers au-dessus du mur du témoin, avec le plan qui
 * en gagne le plus (on passe le mur avec son plan sûr).
 */
export function scoreBuild(lab: Lab, pathId: string, spec: BuildSpec, base: BaseWall[]): BuildScore {
  const build = makeBuild(lab, pathId, spec);
  const time: number[] = [];
  const step: number[] = [];
  const plan: string[] = [];
  for (const enc of lab.encounters) {
    const ref = base.find((b) => b.path === pathId && b.encounter === enc.id)!;
    let t = 240;
    let s = 0;
    let p = '';
    for (const pl of playWays(lab, pathId, enc)) {
      const b = { ...build, plan: pl.plan, priority: pl.priority };
      const rs = SPEED_SEEDS.map((seed) => play(lab, pathId, b, enc, 1, seed));
      const wins = rs.filter((r) => r.win).map((r) => r.time);
      if (wins.length >= 2) t = Math.min(t, med(wins));
      const st = STEP_SEEDS.filter((seed) => play(lab, pathId, b, enc, ref.wall * STEP, seed).win).length / STEP_SEEDS.length;
      if (st > s || !p) {
        s = Math.max(s, st);
        p = pl.id;
      }
    }
    time.push(t);
    step.push(s);
    plan.push(p);
  }
  return { path: pathId, spec, time, step, plan };
}

/** Indice de vitesse d'un build : temps du témoin / temps du build, moyenne géométrique sur les rencontres. */
export const speedIndex = (s: BuildScore, witness: BuildScore) => geo(s.time.map((t, i) => witness.time[i]! / t));
export const stepIndex = (s: BuildScore) => s.step.reduce((a, x) => a + x, 0) / s.step.length;

// --- Situation : au mur, le meilleur build prend une réponse ------------------------------------------------------------

/** Meilleur archétype de la voie en vitesse (le build de farm qu'on emmène au mur). */
export function farmSpec(scores: BuildScore[], pathId: string): BuildSpec {
  const all = scores.filter((s) => s.path === pathId);
  const w = all.find((s) => s.spec.id === 'witness:none')!;
  return all.filter((s) => s.spec.kind === 'archetype' && s.spec.id.startsWith('arch:')).sort((a, b) => speedIndex(b, w) - speedIndex(a, w))[0]!.spec;
}

/**
 * Les réponses d'une famille, à partir du build de farm : **ensemble** (le 4 pièces de la famille qui nourrit le mieux son
 * archétype ; on retire les plus petits ensembles jusqu'à 10 pièces), **gemme** (à la place de la dernière majeure),
 * **préparation** (en plus).
 */
export function situationSpecs(lab: Lab, pathId: string, farm: BuildSpec, family: string): { kind: string; spec: BuildSpec }[] {
  const cls = lab.combat.paths[pathId]!.class;
  const fam = setsOf(lab, cls).filter((s) => s.family === family);
  const set = (fam.find((s) => feeds(s, farm.archetype)) ?? fam[0])!;
  const sets: Record<string, number> = { ...farm.sets, [set.id]: 4 };
  const total = () => Object.values(sets).reduce((a, n) => a + n, 0);
  while (total() > RULES.setPieces) {
    const [smallest] = Object.entries(sets).filter(([id]) => id !== set.id).sort((a, b) => a[1] - b[1])[0]!;
    delete sets[smallest];
  }
  const gem = lab.tools.find((t) => t.family === family && t.rank === 'gem')!.id;
  const prep = lab.tools.find((t) => t.family === family && t.rank === 'prep')!.id;
  return [
    { kind: `set:${family}`, spec: { ...farm, id: `${farm.id}|set:${set.id}`, sets } },
    { kind: `gem:${family}`, spec: { ...farm, id: `${farm.id}|gem:${gem}`, majors: [...farm.majors.slice(0, 3), gem] } },
    { kind: `prep:${family}`, spec: { ...farm, id: `${farm.id}|prep:${prep}` } },
  ];
}

export interface SituationWall {
  path: string;
  encounter: string;
  /** witness | stats | farm | set:<famille> | gem:<famille> | prep:<famille> */
  kind: string;
  wall: number;
}

/** Murs d'une rencontre de zone ou de gardien : témoin, témoin + lignes, build de farm, et ses trois réponses par famille. */
export function situationWalls(lab: Lab, pathId: string, farm: BuildSpec, enc: Encounter): SituationWall[] {
  const cases: { kind: string; build: Build }[] = [
    { kind: 'witness', build: makeBuild(lab, pathId, witnessSpec('none')) },
    { kind: 'stats', build: makeBuild(lab, pathId, witnessSpec('aligned')) },
    { kind: 'farm', build: makeBuild(lab, pathId, farm) },
  ];
  const fams = FAMILY_OF(enc);
  if (fams.length >= 2) {
    // Deux réponses à la fois (4 + 4 + 2) : on garde le premier ensemble du build à 2 pièces.
    const [a, b] = fams.map((f) => situationSpecs(lab, pathId, farm, f)[0]!.spec.id.split('|set:')[1]!);
    const keep = Object.keys(farm.sets).find((s) => s !== a && s !== b)!;
    cases.push({ kind: 'sets:both', build: makeBuild(lab, pathId, { ...farm, id: `${farm.id}|both`, sets: { [a!]: 4, [b!]: 4, [keep]: 2 } }) });
  }
  for (const f of fams) {
    for (const s of situationSpecs(lab, pathId, farm, f)) {
      const b = makeBuild(lab, pathId, s.spec);
      if (s.kind.startsWith('prep:')) {
        const prep = lab.tools.find((t) => t.family === f && t.rank === 'prep')!;
        b.tools = [...(b.tools ?? []), prep];
      }
      cases.push({ kind: s.kind, build: b });
    }
  }
  return cases.map(({ kind, build }) => {
    let wall = 0;
    for (const w of playWays(lab, pathId, enc)) wall = Math.max(wall, wallOf(lab, pathId, { ...build, plan: w.plan, priority: w.priority }, enc, seedList(5000, 24)).wall);
    return { path: pathId, encounter: enc.id, kind, wall };
  });
}

export function situationMarkdown(lab: Lab, rows: SituationWall[]): string {
  const md = ['# Au mur : le build de farm et ses réponses', '', '> Généré par `pnpm --filter @bramo/sim sim combat-build --step situation`. Ne pas modifier à la main.', ''];
  md.push(
    '**Méthode.** Pour chaque voie, le **build de farm** = son meilleur archétype en vitesse (`build.md`). Dans chaque zone et chez chaque gardien, pour chaque famille de mécanique présente, trois réponses : **ensemble** (le 4 pièces de la famille, en retirant les plus petits ensembles du build pour rester à 10 pièces : on perd une partie de son style), **gemme** de situation (à la place de la quatrième majeure), **préparation** (en plus). Murs complets (24 graines, 90 %), meilleur des plans de la voie et des priorités de cible utiles (chef, renforts d’abord, non gardé d’abord). Tout est en **paliers d’avance** (×1,096 de mur chacun).',
    '',
  );
  const paths = Object.values(lab.combat.paths).filter((p) => rows.some((r) => r.path === p.id));
  const encs = lab.encounters.filter((e) => rows.some((r) => r.encounter === e.id));
  const get = (p: string, e: string, k: string) => rows.find((r) => r.path === p && r.encounter === e && r.kind === k)?.wall ?? NaN;
  const FAM: Record<string, string> = { interstice: 'fenêtres', rain: 'érosion', impact: 'coups lourds', beat: 'renforts', fracture: 'gardes', breath: 'aura' };
  const pa = (x: number) => (Number.isFinite(x) ? fr(paliers(x), 1) : '—');
  md.push('## Ce que vaut chaque couche, rencontre par rencontre (médiane des voies)', '');
  md.push('| Rencontre | Mur du témoin (D) | Lignes de statistiques | Build de farm | Famille | + ensemble 4 | + gemme | + préparation | Voies où l’ensemble rapporte ≥ 1 palier |', '|---|---|---|---|---|---|---|---|---|');
  let good = 0;
  for (const e of encs) {
    const fams = FAMILY_OF(e);
    const w = paths.map((p) => get(p.id, e.id, 'witness'));
    const st = med(paths.map((p, i) => get(p.id, e.id, 'stats') / w[i]!));
    const farm = med(paths.map((p, i) => get(p.id, e.id, 'farm') / w[i]!));
    const best = paths.map((p) => Math.max(...fams.map((f) => get(p.id, e.id, `set:${f}`) / get(p.id, e.id, 'farm'))));
    if (best.every((x) => x >= PALIER)) good++;
    fams.forEach((f, j) => {
      const r = (k: string) => med(paths.map((p) => get(p.id, e.id, `${k}:${f}`) / get(p.id, e.id, 'farm')));
      const n = paths.filter((p) => get(p.id, e.id, `set:${f}`) / get(p.id, e.id, 'farm') >= PALIER).length;
      md.push(`| ${j ? '' : e.name} | ${j ? '' : fr(med(w), 2)} | ${j ? '' : pa(st)} | ${j ? '' : pa(farm)} | ${FAM[f]} | ${pa(r('set'))} | ${pa(r('gem'))} | ${pa(r('prep'))} | ${n}/${paths.length} |`);
    });
  }
  md.push('', `**Rencontres où, pour chaque voie, un 4 pièces de situation rapporte au moins un palier au build de farm : ${good} sur ${encs.length}.**`, '');
  const duo = encs.filter((e) => FAMILY_OF(e).length >= 2);
  if (duo.length) {
    md.push('## Deux familles : une réponse, ou les deux ?', '', 'Rencontres à deux familles (gardiens surtout) : le meilleur 4 pièces seul, ou les deux 4 pièces à la fois (4 + 4 + 2 : il ne reste presque rien du style). Paliers d’avance sur le build de farm, médiane des voies, et nombre de voies où porter les deux vaut mieux.', '');
    md.push('| Rencontre | Meilleur 4 pièces seul | Les deux 4 pièces | Voies où les deux valent mieux |', '|---|---|---|---|');
    for (const e of duo) {
      const one = paths.map((p) => Math.max(...FAMILY_OF(e).map((f) => get(p.id, e.id, `set:${f}`))) / get(p.id, e.id, 'farm'));
      const two = paths.map((p) => get(p.id, e.id, 'sets:both') / get(p.id, e.id, 'farm'));
      md.push(`| ${e.name} | ${pa(med(one))} | ${pa(med(two))} | ${two.filter((x, i) => x > one[i]! * 1.01).length}/${paths.length} |`);
    }
    md.push('');
  }
  md.push('## Voie par voie (paliers d’avance du meilleur 4 pièces sur le build de farm)', '');
  md.push(`| Rencontre | ${paths.map((p) => p.name).join(' | ')} |`, `|---|${paths.map(() => '---').join('|')}|`);
  for (const e of encs) md.push(`| ${e.name} | ${paths.map((p) => pa(Math.max(...FAMILY_OF(e).map((f) => get(p.id, e.id, `set:${f}`))) / get(p.id, e.id, 'farm'))).join(' | ')} |`);
  return md.join('\n');
}

// --- Catalogue lisible ----------------------------------------------------------------------------------------------

const ROLE: Record<string, string> = { producer: 'remplit', amplifier: 'amplifie', payoff: 'dépense', bridge: 'relie', utility: 'utilitaire', situation: 'situation' };

/** Le catalogue du build, en français, depuis les données de la proposition (jamais recopié à la main). */
export function catalogueMarkdown(lab: Lab): string {
  const c = lab.catalog;
  const poolName = (id?: string) => c.pools.find((p) => p.id === id)?.name ?? '—';
  const md = ['# Catalogue du build (proposition coherence-v2)', '', '> Généré par `pnpm --filter @bramo/sim sim combat-build --step catalogue` depuis `sim/proposals/coherence-v2/`. Ne pas modifier à la main.', ''];
  md.push('## Les huit réserves', '', '| Réserve | Plafond | Ce que c’est |', '|---|---|---|');
  for (const p of c.pools) md.push(`| **${p.name}** | ${p.max} | ${p.text ?? ''} |`);
  md.push('', `## Gemmes majeures (${c.gems.length})`, '', 'Une gemme occupe une des quatre places de talent (arme, torse, coiffe, collier). « Remplit » : elle donne des charges ; « dépense » : elle les utilise (seule, elle ne fait rien) ; « amplifie » : plafond ou dégâts ; « relie » : elle convertit une réserve en une autre.', '');
  for (const p of [...c.pools.map((x) => x.id), undefined]) {
    const list = c.gems.filter((g) => g.archetype === p);
    if (!list.length) continue;
    md.push(`### ${p ? poolName(p) : 'Utilitaires'}`, '', '| Gemme | Rôle | Effet |', '|---|---|---|');
    for (const g of list) md.push(`| **${g.name}** | ${ROLE[g.role ?? ''] ?? ''} | ${g.text ?? ''} |`);
    md.push('');
  }
  md.push(`## Ensembles (${c.sets.length})`, '', 'Deux étages : 2 et 3 pièces nourrissent un style (une réserve) ; 4 pièces répondent à une mécanique ennemie (sans effet ailleurs). Les ensembles de classe ont à la place un 4 pièces qui tord la mécanique de la classe.', '');
  md.push('| Ensemble | Réponse (4 pièces) | 2 / 3 / 4 pièces | Pièces |', '|---|---|---|---|');
  const FAM: Record<string, string> = { interstice: 'fenêtres (Interstice)', rain: 'érosion (Pluie)', impact: 'coups lourds (Impact)', beat: 'renforts (Battue)', fracture: 'gardes (Fracture)', breath: 'aura (Reprise)' };
  for (const s of c.sets) md.push(`| **${s.name}** | ${s.family ? FAM[s.family] : `classe : ${s.class}`} | ${(s.text ?? []).join('<br>')} | ${(s.items ?? []).join(', ')} |`);
  md.push('', `## Objets nommés (${c.named.length})`, '', 'Légendaires, non fabricables (butin, garantie, marché). Un nommé occupe une place de talent ; il tord une règle.', '');
  md.push('| Objet | Surnom | Classe | Où le trouver | Effet |', '|---|---|---|---|---|');
  for (const n of c.named) md.push(`| **${n.name}** | ${n.nickname ?? ''} | ${n.class ?? 'collier, toutes classes'} | ${n.source ?? ''} | ${n.text ?? ''} |`);
  md.push('', '## Lignes aléatoires par emplacement', '', 'Plage au palier 1 (× 1,12 par palier). Les plafonds de réserve sont en charges.', '');
  for (const [slot, lines] of Object.entries(lab.content.gearPools.pools)) md.push(`- **${lab.content.gearSlots[slot]?.name ?? slot}** : ${lines.map((l) => `${l.name} ${fr(l.min, 0)}-${fr(l.max, 0)}`).join(' · ')}`);
  return md.join('\n');
}

// --- Rapport --------------------------------------------------------------------------------------------------------

export function buildsMarkdown(lab: Lab, scores: BuildScore[], walls: { path: string; spec: string; encounter: string; wall: number }[]): string {
  const md = ['# Le build, version 2 : diversité, méta et récompense du bon build', '', '> Généré par `pnpm --filter @bramo/sim sim combat-build --step builds`. Ne pas modifier à la main.', ''];
  md.push(
    '**Méthode.** Proposition `coherence-v2` (8 réserves, 34 gemmes, 15 ensembles à deux étages, 12 nommés, lignes de build, outils recalés), zones `coherence-zones-v2`. Statistiques : kit palier 20 Rare mixte, plus les lignes du build (1,5 par pièce au jet moyen). **Vitesse** : temps du témoin sans talent / temps du build au danger 1, chacun avec le plan le plus rapide de la voie et la meilleure priorité de cible (3 graines ; 240 s si moins de deux victoires), moyenne géométrique des 18 rencontres — c’est le rendement de farm. **Mur** : part des combats gagnés **deux paliers au-dessus du mur du témoin** (×1,20, 4 graines) avec le plan qui en gagne le plus, moyenne des 18 rencontres — c’est « franchir le mur plus tôt ». Témoin sans talent : ≈ 0 % par construction.',
    '',
  );
  const paths = Object.values(lab.combat.paths).filter((p) => scores.some((s) => s.path === p.id));
  const name = (id: string) => [...lab.catalog.gems, ...lab.catalog.named].find((g) => g.id === id)?.name ?? lab.catalog.sets.find((s) => s.id === id)?.name ?? id;
  const poolName = (id: string) => lab.catalog.pools.find((p) => p.id === id)?.name ?? id;
  md.push('## Ce que rapporte un build, voie par voie', '');
  md.push('| Voie | Meilleur build (vitesse · mur) | Médiane des builds au hasard | Dernier | Builds à 10 % du meilleur en vitesse | Meilleur archétype | Moins bon archétype |', '|---|---|---|---|---|---|---|');
  const freq: Record<string, number> = {};
  const archBest: Record<string, number> = {};
  for (const p of paths) {
    const all = scores.filter((s) => s.path === p.id);
    const w = all.find((s) => s.spec.kind === 'witness' && s.spec.lines === 'none')!;
    const ranked = all.filter((s) => s.spec.kind !== 'witness').map((s) => ({ s, v: speedIndex(s, w), st: stepIndex(s) })).sort((a, b) => b.v - a.v);
    const rnd = ranked.filter((x) => x.s.spec.kind === 'random');
    const top = ranked[0]!;
    for (const x of ranked.slice(0, Math.ceil(ranked.length / 10))) for (const m of [...x.s.spec.majors, ...Object.keys(x.s.spec.sets)]) freq[m] = (freq[m] ?? 0) + 1;
    const arch = ranked.filter((x) => x.s.spec.kind === 'archetype').sort((a, b) => b.v - a.v);
    archBest[arch[0]!.s.spec.archetype] = (archBest[arch[0]!.s.spec.archetype] ?? 0) + 1;
    const near = ranked.filter((x) => x.v >= top.v / 1.1).length;
    const label = (x: (typeof ranked)[number]) => `${pct(x.v)} · ${fr(x.st * 100, 0)} %`;
    md.push(`| ${p.name} | ${label(top)} (${top.s.spec.kind === 'archetype' ? poolName(top.s.spec.archetype) : 'hasard'}) | ${pct(med(rnd.map((x) => x.v)))} · ${fr(med(rnd.map((x) => x.st)) * 100, 0)} % | ${label(rnd[rnd.length - 1]!)} | ${near} sur ${ranked.length} | ${poolName(arch[0]!.s.spec.archetype)} ${label(arch[0]!)} | ${poolName(arch[arch.length - 1]!.s.spec.archetype)} ${label(arch[arch.length - 1]!)} |`);
  }
  md.push('', '## Les archétypes, voie par voie (vitesse · mur)', '');
  md.push(`| Voie | ${ARCHETYPES.map(poolName).join(' | ')} |`, `|---|${ARCHETYPES.map(() => '---').join('|')}|`);
  for (const p of paths) {
    const all = scores.filter((s) => s.path === p.id);
    const w = all.find((s) => s.spec.kind === 'witness' && s.spec.lines === 'none')!;
    md.push(`| ${p.name} | ${ARCHETYPES.map((a) => {
      const s = all.find((x) => x.spec.id === `arch:${a}`);
      return s ? `${pct(speedIndex(s, w))} · ${fr(stepIndex(s) * 100, 0)} %` : '—';
    }).join(' | ')} |`);
  }
  md.push('', '## Le meilleur archétype selon la rencontre', '', 'Pour chaque rencontre, l’archétype le plus rapide de chaque voie (nombre de voies). Une méta qui change avec la rencontre : c’est ce qu’on cherche.', '');
  md.push(`| Rencontre | ${ARCHETYPES.map(poolName).join(' | ')} |`, `|---|${ARCHETYPES.map(() => '---').join('|')}|`);
  lab.encounters.forEach((e, i) => {
    const count: Record<string, number> = {};
    for (const p of paths) {
      const arch = scores.filter((s) => s.path === p.id && s.spec.kind === 'archetype').sort((a, b) => a.time[i]! - b.time[i]! || b.step[i]! - a.step[i]!);
      count[arch[0]!.spec.archetype] = (count[arch[0]!.spec.archetype] ?? 0) + 1;
    }
    md.push(`| ${e.name} | ${ARCHETYPES.map((a) => count[a] ?? '·').join(' | ')} |`);
  });
  md.push('', '## Ce qui revient dans les meilleurs builds (10 % les plus rapides de chaque voie)', '');
  md.push(Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 25).map(([m, n]) => `- ${name(m)} : ${n}`).join('\n'), '');
  md.push(`Meilleur archétype par voie : ${Object.entries(archBest).map(([a, n]) => `${poolName(a)} ${n}`).join(', ')}.`, '');
  md.push('## La valeur du bon butin', '', 'Le meilleur archétype de chaque voie, avec ses lignes : aucune, au hasard, alignées sur lui. Et le témoin sans talent avec des lignes de statistiques.', '');
  md.push('| Voie | Archétype | Sans ligne | Lignes au hasard | Lignes alignées | Témoin + lignes de statistiques |', '|---|---|---|---|---|---|');
  for (const p of paths) {
    const all = scores.filter((s) => s.path === p.id);
    const w = all.find((s) => s.spec.kind === 'witness' && s.spec.lines === 'none')!;
    const arch = all.filter((s) => s.spec.kind === 'archetype').sort((x, y) => speedIndex(y, w) - speedIndex(x, w));
    if (!arch.length) continue;
    const a = arch[0]!.spec.archetype;
    const get = (l: string) => (l === 'aligned' ? arch[0] : all.find((s) => s.spec.id === `loot:${a}:${l}`));
    const ws = all.find((s) => s.spec.id === 'witness:aligned');
    const cell = (s?: BuildScore) => (s ? `${pct(speedIndex(s, w))} · ${fr(stepIndex(s) * 100, 0)} %` : '—');
    md.push(`| ${p.name} | ${poolName(a)} | ${cell(get('none'))} | ${cell(get('mean'))} | ${cell(get('aligned'))} | ${cell(ws)} |`);
  }
  if (walls.length) {
    md.push('', '## En paliers d’avance (murs complets)', '', 'Mur du build / mur du témoin, moyenne géométrique des 18 rencontres, en paliers (×1,096 chacun).', '');
    md.push('| Voie | Témoin + lignes de statistiques | Meilleur build | Build médian | Meilleur archétype | Moins bon archétype |', '|---|---|---|---|---|---|');
    for (const p of paths) {
      const idx = (spec: string) => {
        const rs = walls.filter((x) => x.path === p.id && x.spec === spec);
        return rs.length ? geo(rs.map((x) => x.wall)) : NaN;
      };
      const witness = idx(walls.find((x) => x.path === p.id && x.spec.startsWith('witness|'))?.spec ?? '');
      const roles = ['stats', 'best', 'median', 'arch-best', 'arch-worst'].map((r) => walls.find((x) => x.path === p.id && x.spec.startsWith(`${r}|`))?.spec);
      md.push(`| ${p.name} | ${roles.map((r) => (r ? `${fr(paliers(idx(r) / witness), 1)} (${pct(idx(r) / witness)})` : '—')).join(' | ')} |`);
    }
  }
  return md.join('\n');
}

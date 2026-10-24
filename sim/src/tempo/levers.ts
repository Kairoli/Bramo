/**
 * Comment un joueur bloqué se débloque (demande de Louis, 24 octobre : « qqn qui perd 100 % de ses fights, ça va arriver ;
 * le plus important, c'est comment il peut se sortir de cette situation »). Au mur de chaque gardien et de deux zones dures,
 * pour chaque voie, on part d'un joueur « moyen » (le build tiré au hasard médian de 7) et on mesure, en paliers d'avance,
 * ce que rapporte chaque levier : changer de build, une gemme de situation, l'ensemble 4 pièces de situation, une
 * préparation, régler ses minuteurs, monter son équipement d'un cran de rareté, un rang d'Affineur. Puis le temps qu'il faut
 * pour obtenir chacun (XP de classe, butin, vestiges), tiré des règles de data/.
 *
 * pnpm --filter @bramo/sim exec tsx src/tempo/levers.ts     (mêmes variables que bench.ts : TEMPO, LIMIT, LIMITG, TALENTS_ADD)
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { type CombatStats, type PlanEntry, type Rarity, buildFromLines, resolveLoadout, statsFromGear } from '@bramo/shared';
import { buildKit } from '../coherence/kits.js';
import { type Build, type Lab, PALIER, paliers, seedList, wallOf } from '../coherence/lab.js';
import { loadVariant } from '../load.js';
import { ARCHETYPES, type BuildSpec, PREFERRED, archetypeSpec, kitLines, makeBuild, randomSpecs, situationSpecs } from '../scenarios/combat-build.js';
import { FAMILY_OF } from '../scenarios/combat-coherence.js';
import { applyAdditions, applyTempo, tempoFromEnv } from './patch.js';

const ROOT = fileURLToPath(new URL('../../../', import.meta.url));
const content = loadVariant(process.env.PROPOSAL || undefined);
const combat = content.combat!;
const feedsOf = process.env.TALENTS_ADD ? applyAdditions(combat, process.env.TALENTS_ADD, join(ROOT, 'data')) : {};
Object.assign(PREFERRED, { ouverture: ['Compétences', 'Puissance', 'Critique', 'Dégâts critiques'], endurance: ['Puissance', 'Vitalité', 'Attaques de base', 'Compétences'], cadence: ['Cadence', 'Attaques de base', 'Puissance', 'Critique'] });
applyTempo(combat, tempoFromEnv());
const walls = Object.values(combat.encounters).filter((e) => e.kind === 'gardien' || e.id === 'z08_wound_ford' || e.id === 'z10_watch_terraces');
const lab: Lab = { content, combat, encounters: walls, catalog: combat.talents!, tools: combat.tools, reports: 'tempo' };
const SEEDS = seedList(9300, Number(process.env.SEEDS ?? 8));
const archetypes = [...ARCHETYPES, ...new Set(Object.values(feedsOf))];
const paths = Object.keys(combat.paths).filter((p) => !process.env.PATHS || process.env.PATHS.split(',').includes(p));

const archSpec = (p: string, a: string): BuildSpec => {
  const s = archetypeSpec(lab, p, a);
  const own = Object.entries(feedsOf).filter(([, x]) => x === a).map(([id]) => id);
  if (!own.length) return s;
  const rest = Object.keys(s.sets).filter((id) => !own.includes(id));
  const sets: Record<string, number> = { [own[0]!]: 3 };
  [3, 2, 2].forEach((n, i) => (sets[rest[i]!] = n));
  return { ...s, sets };
};
/** Le même build sur un équipement d'une autre rareté (le banc suppose du Rare de palier 20). */
function withRarity(p: string, spec: BuildSpec, rarity: Rarity): Build {
  const b = makeBuild(lab, p, spec);
  const cls = combat.paths[p]!.class;
  const named = spec.majors.filter((m) => lab.catalog.named.some((n) => n.id === m));
  const r = resolveLoadout(lab.catalog, lab.tools, { gems: spec.majors.filter((m) => !named.includes(m)), named, sets: spec.sets, lines: buildFromLines(combat.rules, kitLines(lab, spec.archetype, spec.lines)) }, { majors: 4, setPieces: 10, preps: 1 });
  const kit = buildKit(content, { classId: cls, tier: 20, rarity, orientation: 'mixed', rolls: 'none' });
  const stats: CombatStats = statsFromGear(combat.rules, { stats: kit.totals.stats, lines: kitLines(lab, spec.archetype, spec.lines) }, 20, r.mods);
  return { ...b, stats };
}
const longFirst = (plan: PlanEntry[]) => [...plan].sort((a, b) => combat.spells[b.spell]!.cooldown - combat.spells[a.spell]!.cooldown).map((e, i) => ({ spell: e.spell, at: i }));
const plan80 = (p: string) => combat.plans[`${p}_advised`]!.levels['80']!;
const wall = (p: string, b: Build, e: (typeof walls)[number]) => wallOf(lab, p, { ...b, plan: b.plan ?? plan80(p) }, e, SEEDS, 0.9, 0.01).wall;

type Row = { path: string; enc: string; base: number; lever: Record<string, number> };
const rows: Row[] = [];
const t0 = Date.now();
for (const p of paths) {
  const randoms = randomSpecs(lab, p, 7);
  for (const e of walls) {
    const rw = randoms.map((s) => ({ s, w: wall(p, makeBuild(lab, p, s), e) })).sort((a, b) => a.w - b.w);
    const mid = rw[3]!;
    const base = mid.w;
    const lever: Record<string, number> = {};
    const gain = (w: number) => paliers(w / base);
    // Changer de build : le meilleur des archétypes sur ce mur.
    const archWalls = archetypes.map((a) => ({ a, w: wall(p, makeBuild(lab, p, archSpec(p, a)), e) })).sort((x, y) => y.w - x.w);
    lever.build = gain(archWalls[0]!.w);
    // Réponses de situation (la meilleure famille de la rencontre), sur le build du joueur.
    let best: Record<string, number> = { set: 0, gem: 0, prep: 0 };
    for (const fam of FAMILY_OF(e)) {
      for (const s of situationSpecs(lab, p, mid.s, fam)) {
        const b = makeBuild(lab, p, s.spec);
        if (s.kind.startsWith('prep:')) b.tools = [...(b.tools ?? []), lab.tools.find((t) => t.family === fam && t.rank === 'prep')!];
        const k = s.kind.split(':')[0]!;
        best[k] = Math.max(best[k]!, gain(wall(p, b, e)));
      }
    }
    Object.assign(lever, best);
    lever.timers = Math.max(0, gain(wall(p, { ...makeBuild(lab, p, mid.s), plan: longFirst(plan80(p)) }, e)));
    lever.epic = gain(wall(p, withRarity(p, mid.s, 'epic'), e));
    const b = makeBuild(lab, p, mid.s);
    lever.refine = gain(wall(p, { ...b, stats: { ...b.stats, power: b.stats.power * 1.03, maxHp: b.stats.maxHp * 1.03 } }, e));
    // Tout à la fois : le meilleur archétype, son 4 pièces de situation, sa préparation, en Épique.
    {
      const farm = archSpec(p, archWalls[0]!.a);
      let top = archWalls[0]!.w;
      for (const fam of FAMILY_OF(e)) {
        const set = situationSpecs(lab, p, farm, fam).find((x) => x.kind.startsWith('set:'))!.spec;
        const b = withRarity(p, set, 'epic');
        b.tools = [...(b.tools ?? []), lab.tools.find((t) => t.family === fam && t.rank === 'prep')!];
        top = Math.max(top, wall(p, b, e), wall(p, { ...b, plan: longFirst(plan80(p)) }, e));
      }
      lever.all = gain(top);
    }
    rows.push({ path: p, enc: e.id, base, lever });
  }
  console.error(`${p} (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
}

// --- Le temps pour obtenir chaque levier, tiré des règles ---------------------------------------------------------------
const R = combat.rules as unknown as { loot: Record<string, any>; progression: { xpPerHour: number; xpDoubling: number } };
const unitsPerHour = 3600 / R.loot.unitSeconds;
const xpHour = (L: number) => R.progression.xpPerHour * 2 ** ((L - 1) / R.progression.xpDoubling);
const hoursFor10 = (L: number) => {
  let h = 0;
  for (let l = L; l < L + 10; l++) h += (content.xpTable[l + 1]! - content.xpTable[l]!) / xpHour(l);
  return h;
};

const fr = (n: number, d = 1) => n.toFixed(d).replace('.', ',');
const med = (xs: number[]) => [...xs].sort((a, b) => a - b)[xs.length >> 1]!;
const LABEL: Record<string, string> = { build: 'Changer de build (le meilleur archétype pour ce mur)', set: 'Ensemble 4 pièces de la mécanique', gem: 'Gemme de situation', prep: 'Préparation (une heure)', timers: 'Régler ses minuteurs (grosses compétences d\'abord)', epic: 'Équipement Épique au lieu de Rare', refine: 'Un rang d\'Affineur (+3 %)', all: 'Tout à la fois (meilleur build, son 4 pièces de la mécanique, préparation, Épique, minuteurs)' };
const out: string[] = ['# Comment un joueur bloqué se débloque', '', `Rythme \`${JSON.stringify(tempoFromEnv())}\`${process.env.TALENTS_ADD ? ` · ${process.env.TALENTS_ADD}` : ''} · ${SEEDS.length} graines · ${paths.length} voies × ${walls.length} murs (${walls.map((w) => w.name).join(', ')}).`, '', 'Point de départ : un joueur « moyen » (build tiré au hasard, le médian de 7). Gain en **paliers d\'avance** (1 palier = ×1,096 de mur = un palier d\'équipement, ou environ 10 niveaux de classe).', '', '| Levier | Gain médian | Gain au quart le plus utile | Cas où il vaut au moins 1 palier |', '|---|---|---|---|'];
for (const k of Object.keys(LABEL)) {
  const xs = rows.map((r) => r.lever[k]!);
  const q3 = [...xs].sort((a, b) => a - b)[Math.floor(xs.length * 0.75)]!;
  out.push(`| ${LABEL[k]} | ${fr(med(xs))} | ${fr(q3)} | ${fr((100 * xs.filter((x) => x >= 1).length) / xs.length, 0)} % |`);
}
out.push('', '## Par mur (gain médian des 9 voies, en paliers)', '', `| Mur | ${Object.keys(LABEL).map((k) => k).join(' | ')} |`, `|---|${Object.keys(LABEL).map(() => '---').join('|')}|`);
for (const e of walls) {
  const rs = rows.filter((r) => r.enc === e.id);
  out.push(`| ${e.name} | ${Object.keys(LABEL).map((k) => fr(med(rs.map((r) => r.lever[k]!)))).join(' | ')} |`);
}
out.push('', '## Le temps pour l\'obtenir (règles de data/)', '', '| Ce qu\'il faut | Combien de temps |', '|---|---|');
for (const L of [10, 20, 40, 60, 80]) out.push(`| 10 niveaux de classe à partir du ${L} (≈ 1 palier) | ${fr(hoursFor10(L), 0)} h de combat |`);
out.push(`| Une pièce classique (n'importe quel emplacement) | ${fr(1 / (R.loot.classic * unitsPerHour), 0)} h |`);
out.push(`| Une pièce Épique ou mieux | ${fr(1 / (R.loot.classic * unitsPerHour * (R.loot.rarity.epic + R.loot.rarity.legendary)), 0)} h |`);
out.push(`| Une pièce d'ensemble (palier 40+) | ${fr(1 / (R.loot.setPiece * unitsPerHour), 0)} h, n'importe lequel des ensembles de la zone |`);
out.push(`| Les 12 vestiges d'une gemme de situation | ${fr(12 / (R.loot.vestiges * unitsPerHour), 0)} h |`);
out.push(`| Un objet nommé (garantie) | ${fr(R.loot.namedGuarantee / unitsPerHour, 0)} h sur la même rencontre |`);
out.push(`| Une gemme de talent trouvée | ${fr(1 / (R.loot.talentGem * unitsPerHour), 0)} h |`);
out.push('', `Calcul : ${((Date.now() - t0) / 1000).toFixed(0)} s.`);
const dir = join(ROOT, 'sim', 'reports', 'combat', 'tempo');
mkdirSync(dir, { recursive: true });
writeFileSync(join(dir, 'leviers.md'), `${out.join('\n')}\n`);
writeFileSync(join(dir, 'leviers.json'), JSON.stringify(rows));
console.log(out.join('\n'));
void PALIER;

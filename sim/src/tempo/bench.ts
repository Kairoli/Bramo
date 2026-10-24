/**
 * Banc des builds au rythme choisi (docs/design/coherence/rythme.md) : les 9 voies, les 12 zones et les 6 gardiens de data/,
 * le témoin (palier 20 Rare, sans talent), les 8 archétypes de réserve (et ceux ajoutés par une proposition), des builds tirés
 * au hasard. Pour chaque build et chaque rencontre : temps des victoires au danger 1, victoires au danger 1 et à `STEP`
 * (deux paliers plus dur : le « mur »), défaites au temps. Puis : la variété (combien d'archétypes à 10 % du meilleur, combien
 * d'archétypes différents en tête selon la rencontre) et ce que vaut le theorycraft (meilleur build contre build au hasard).
 *
 * pnpm --filter @bramo/sim exec tsx src/tempo/bench.ts [nom]        (écrit sim/reports/combat/tempo/<nom>.json et .md)
 * Rythme : TEMPO=vif, surcharges K, KG, D, DG, AR, M, C, TC, LIMIT, LIMITG, GCDHASTE=1 (src/tempo/patch.ts).
 * PROPOSAL=<dossier de sim/proposals> pour jouer une proposition ; RANDOM=40 builds au hasard par voie ; SEEDS=4 ; PATHS=a,b.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Encounter, PlanEntry, TargetPriority } from '@bramo/shared';
import type { Lab } from '../coherence/lab.js';
import { play, seedList } from '../coherence/lab.js';
import { loadVariant } from '../load.js';
import { ARCHETYPES, type BuildSpec, PREFERRED, archetypeSpec, makeBuild, priorities, randomSpecs, witnessSpec } from '../scenarios/combat-build.js';
import { applyAdditions, applyTempo, tempoFromEnv } from './patch.js';

const ROOT = fileURLToPath(new URL('../../../', import.meta.url));
const name = process.argv[2] ?? 'bench';
const tempo = tempoFromEnv();
const content = loadVariant(process.env.PROPOSAL || undefined);
const combat = content.combat!;
// TALENTS_ADD=<fichier> : gemmes, ensembles et nommés ajoutés au catalogue, et réglages (`rules`) fusionnés (sim/proposals/build-v3).
const feedsOf: Record<string, string> = process.env.TALENTS_ADD ? applyAdditions(combat, process.env.TALENTS_ADD, join(ROOT, 'data')) : {};
Object.assign(PREFERRED, {
  ouverture: ['Compétences', 'Puissance', 'Critique', 'Dégâts critiques'],
  endurance: ['Puissance', 'Vitalité', 'Attaques de base', 'Compétences'],
  cadence: ['Cadence', 'Attaques de base', 'Puissance', 'Critique'],
});
applyTempo(combat, tempo);
const encounters = Object.values(combat.encounters).filter((e) => e.kind === 'zone' || e.kind === 'gardien');
const lab: Lab = { content, combat, encounters, catalog: combat.talents!, tools: combat.tools, reports: 'tempo' };

const SEEDS = seedList(9100, Number(process.env.SEEDS ?? 4));
const STEP = Number(process.env.STEP ?? 1.096 ** 2);
const RANDOM = Number(process.env.RANDOM ?? 40);
const extra = [...new Set([...(process.env.ARCHS ?? '').split(',').filter(Boolean), ...Object.values(feedsOf)])];
const archetypes = [...ARCHETYPES, ...extra];
const paths = Object.keys(combat.paths).filter((p) => !process.env.PATHS || process.env.PATHS.split(',').includes(p));

const med = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length ? (s.length % 2 ? s[s.length >> 1]! : (s[s.length / 2 - 1]! + s[s.length / 2]!) / 2) : NaN;
};
const geo = (xs: number[]) => Math.exp(xs.reduce((a, x) => a + Math.log(x), 0) / xs.length);

interface Cell { time: number; win: number; step: number; timeouts: number; stepTimeouts: number; casts: number; plan: string }
interface Score { path: string; id: string; kind: BuildSpec['kind']; archetype: string; cells: Record<string, Cell> }

const ways = (pathId: string, enc: Encounter): { id: string; plan: PlanEntry[]; priority: TargetPriority }[] => {
  const plans: [string, PlanEntry[]][] = [['advised', combat.plans[`${pathId}_advised`]!.levels['80']!]];
  const group = combat.plans[`${pathId}_group`]?.levels['80'];
  if (group) plans.push(['group', group]);
  return plans.flatMap(([id, plan]) => priorities(enc).map((priority) => ({ id: priority === 'chief' ? id : `${id}+${priority}`, plan, priority })));
};

/** Archétype : celui du banc ; pour un archétype ajouté, son ensemble à 3 pièces d'abord (`feeds`), puis le remplissage. */
function archSpec(pathId: string, archetype: string): BuildSpec {
  const spec = archetypeSpec(lab, pathId, archetype);
  const own = Object.entries(feedsOf).filter(([, a]) => a === archetype).map(([id]) => id);
  if (!own.length) return spec;
  const rest = Object.keys(spec.sets).filter((id) => !own.includes(id));
  const sets: Record<string, number> = { [own[0]!]: 3 };
  [3, 2, 2].forEach((n, i) => (sets[rest[i]!] = n));
  return { ...spec, sets };
}

function score(pathId: string, spec: BuildSpec): Score {
  const build = makeBuild(lab, pathId, spec);
  const cells: Record<string, Cell> = {};
  for (const enc of encounters) {
    let best = null as Cell | null;
    for (const w of ways(pathId, enc)) {
      const b = { ...build, plan: w.plan, priority: w.priority };
      const rs = SEEDS.map((s) => play(lab, pathId, b, enc, 1, s));
      const wins = rs.filter((r) => r.win);
      const limit = enc.timeLimit ?? combat.rules.fightLimit;
      const cell: Cell = {
        // Une défaite compte comme la limite de temps : un build qui perd est le plus lent.
        time: wins.length ? med(rs.map((r) => (r.win ? r.time : limit))) : limit,
        win: wins.length / rs.length,
        ...(() => {
          const hard = SEEDS.map((s) => play(lab, pathId, b, enc, STEP, s));
          return { step: hard.filter((r) => r.win).length / SEEDS.length, stepTimeouts: hard.filter((r) => r.cause === 'timeout').length / SEEDS.length };
        })(),
        timeouts: rs.filter((r) => r.cause === 'timeout').length / rs.length,
        casts: med(rs.map((r) => r.team[0]!.metrics.skillCasts ?? 0)),
        plan: w.id,
      };
      if (!best || cell.win > best.win || (cell.win === best.win && cell.time < best.time)) best = { ...cell, step: Math.max(cell.step, best?.step ?? 0) };
      else best.step = Math.max(best.step, cell.step);
    }
    cells[enc.id] = best!;
  }
  return { path: pathId, id: spec.id, kind: spec.kind, archetype: spec.archetype, cells };
}

const t0 = Date.now();
const scores: Score[] = [];
for (const p of paths) {
  const specs = [witnessSpec('none'), ...archetypes.map((a) => archSpec(p, a)), ...randomSpecs(lab, p, RANDOM)];
  for (const s of specs) scores.push(score(p, s));
  console.error(`${p} : ${specs.length} builds (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
}

// --- Rapport ------------------------------------------------------------------------------------------------------
const fr = (n: number, d = 0) => n.toFixed(d).replace('.', ',');
const pct = (r: number) => `${r >= 1 ? '+' : ''}${fr((r - 1) * 100)} %`;
const speed = (s: Score, w: Score, encs = encounters) => geo(encs.map((e) => w.cells[e.id]!.time / s.cells[e.id]!.time));
const out: string[] = [];
out.push(`# Banc des builds : ${name}`, '', `Rythme : \`${JSON.stringify(tempo)}\`${process.env.PROPOSAL ? ` · proposition ${process.env.PROPOSAL}` : ''} · ${SEEDS.length} graines · mur à ×${fr(STEP, 2)} · ${RANDOM} builds au hasard par voie.`, '');

const zones = encounters.filter((e) => e.kind === 'zone');
const bosses = encounters.filter((e) => e.kind === 'gardien');
const all = (f: (s: Score) => boolean, key: keyof Cell, encs = encounters) => scores.filter(f).flatMap((s) => encs.map((e) => s.cells[e.id]![key] as number));
const isArch = (s: Score) => s.kind === 'archetype';
out.push('## Le rythme', '', '| | Témoin | Archétypes | Au hasard |', '|---|---|---|---|');
for (const [label, encs] of [['Durée médiane, zones (s)', zones], ['Durée médiane, gardiens (s)', bosses]] as const)
  out.push(`| ${label} | ${fr(med(all((s) => s.kind === 'witness', 'time', encs)))} | ${fr(med(all(isArch, 'time', encs)))} | ${fr(med(all((s) => s.kind === 'random', 'time', encs)))} |`);
const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / (xs.length || 1);
out.push(`| Victoires au danger 1 | ${fr(100 * avg(all((s) => s.kind === 'witness', 'win')))} % | ${fr(100 * avg(all(isArch, 'win')))} % | ${fr(100 * avg(all((s) => s.kind === 'random', 'win')))} % |`);
out.push(`| Défaites au temps | ${fr(100 * avg(all((s) => s.kind === 'witness', 'timeouts')))} % | ${fr(100 * avg(all(isArch, 'timeouts')))} % | ${fr(100 * avg(all((s) => s.kind === 'random', 'timeouts')))} % |`);
out.push(`| Victoires deux paliers plus dur (« mur ») | ${fr(100 * avg(all((s) => s.kind === 'witness', 'step')))} % | ${fr(100 * avg(all(isArch, 'step')))} % | ${fr(100 * avg(all((s) => s.kind === 'random', 'step')))} % |`);
out.push(`| Défaites au temps, deux paliers plus dur | ${fr(100 * avg(all((s) => s.kind === 'witness', 'stepTimeouts')))} % | ${fr(100 * avg(all(isArch, 'stepTimeouts')))} % | ${fr(100 * avg(all((s) => s.kind === 'random', 'stepTimeouts')))} % |`);
out.push(`| Sorts lancés par combat (médiane) | ${fr(med(all((s) => s.kind === 'witness', 'casts')))} | ${fr(med(all(isArch, 'casts')))} | ${fr(med(all((s) => s.kind === 'random', 'casts')))} |`, '');

out.push('## Par voie : les archétypes', '', '| Voie | Meilleur | Vitesse | Archétypes à 10 % du meilleur | En tête selon la rencontre | Meilleur / médiane au hasard | Mur : meilleur archétype |', '|---|---|---|---|---|---|---|');
const summary: Record<string, unknown>[] = [];
for (const p of paths) {
  const mine = scores.filter((s) => s.path === p);
  const w = mine.find((s) => s.kind === 'witness')!;
  const arch = mine.filter(isArch).map((s) => ({ s, v: speed(s, w) })).sort((a, b) => b.v - a.v);
  const near = arch.filter((a) => a.v >= arch[0]!.v * 0.9).map((a) => a.s.archetype);
  const heads: Record<string, number> = {};
  for (const e of encounters) {
    const top = mine.filter(isArch).sort((a, b) => b.cells[e.id]!.win - a.cells[e.id]!.win || a.cells[e.id]!.time - b.cells[e.id]!.time)[0]!;
    heads[top.archetype] = (heads[top.archetype] ?? 0) + 1;
  }
  const rnd = mine.filter((s) => s.kind === 'random').map((s) => speed(s, w));
  const bestAll = Math.max(arch[0]!.v, ...rnd);
  const wallBest = mine.filter(isArch).map((s) => ({ a: s.archetype, st: avg(encounters.map((e) => s.cells[e.id]!.step)) })).sort((a, b) => b.st - a.st)[0]!;
  out.push(`| ${combat.paths[p]!.name} | ${arch[0]!.s.archetype} | ${pct(arch[0]!.v)} | ${near.length} (${near.join(', ')}) | ${Object.entries(heads).sort((a, b) => b[1] - a[1]).map(([a, n]) => `${a} ${n}`).join(', ')} | ${fr(bestAll / med(rnd), 2)} | ${wallBest.a} (${fr(100 * wallBest.st)} %) |`);
  summary.push({ path: p, best: arch[0]!.s.archetype, speed: arch[0]!.v, near, heads, theory: bestAll / med(rnd), ranking: arch.map((a) => [a.s.archetype, +a.v.toFixed(3)]) });
}
out.push('', '## Par rencontre : qui est en tête (archétype le plus rapide, toutes voies)', '', '| Rencontre | Archétypes en tête (nombre de voies) | Durée du meilleur (s) |', '|---|---|---|');
for (const e of encounters) {
  const heads: Record<string, number> = {};
  const times: number[] = [];
  for (const p of paths) {
    const top = scores.filter((s) => s.path === p && isArch(s)).sort((a, b) => b.cells[e.id]!.win - a.cells[e.id]!.win || a.cells[e.id]!.time - b.cells[e.id]!.time)[0]!;
    heads[top.archetype] = (heads[top.archetype] ?? 0) + 1;
    times.push(top.cells[e.id]!.time);
  }
  out.push(`| ${e.name} | ${Object.entries(heads).sort((a, b) => b[1] - a[1]).map(([a, n]) => `${a} ${n}`).join(', ')} | ${fr(med(times))} |`);
}
out.push('', `Calcul : ${((Date.now() - t0) / 1000).toFixed(0)} s.`);
const dir = join(ROOT, 'sim', 'reports', 'combat', 'tempo');
mkdirSync(dir, { recursive: true });
writeFileSync(join(dir, `${name}.json`), JSON.stringify({ tempo, summary, scores }));
writeFileSync(join(dir, `${name}.md`), `${out.join('\n')}\n`);
console.log(out.join('\n'));

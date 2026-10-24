/**
 * Ce que vaut un bon réglage des minuteurs (l'ouverture du plan) : pour chaque voie et quelques archétypes, la vitesse en zone et
 * contre les gardiens avec trois ouvertures du même répertoire : le plan conseillé, les compétences longues d'abord (minuteurs
 * 0, 1, 2… s), les compétences longues en dernier. Même banc que `bench.ts` (mêmes variables d'environnement).
 *
 * pnpm --filter @bramo/sim exec tsx src/tempo/timers.ts
 */
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { PlanEntry } from '@bramo/shared';
import type { Lab } from '../coherence/lab.js';
import { play, seedList } from '../coherence/lab.js';
import { loadVariant } from '../load.js';
import { PREFERRED, archetypeSpec, makeBuild } from '../scenarios/combat-build.js';
import { applyAdditions, applyTempo, tempoFromEnv } from './patch.js';

const ROOT = fileURLToPath(new URL('../../../', import.meta.url));
const content = loadVariant(process.env.PROPOSAL || undefined);
const combat = content.combat!;
const feedsOf: Record<string, string> = process.env.TALENTS_ADD ? applyAdditions(combat, process.env.TALENTS_ADD, join(ROOT, 'data')) : {};
Object.assign(PREFERRED, { ouverture: ['Compétences', 'Puissance', 'Critique', 'Dégâts critiques'], endurance: ['Puissance', 'Vitalité', 'Attaques de base', 'Compétences'], cadence: ['Cadence', 'Attaques de base', 'Puissance', 'Critique'] });
applyTempo(combat, tempoFromEnv());
const encounters = Object.values(combat.encounters).filter((e) => e.kind === 'zone' || e.kind === 'gardien');
const lab: Lab = { content, combat, encounters, catalog: combat.talents!, tools: combat.tools, reports: 'tempo' };
const SEEDS = seedList(9100, Number(process.env.SEEDS ?? 4));
const archs = (process.env.ARCHS ?? 'ouverture,tisons,endurance').split(',');

const spec = (p: string, a: string) => {
  const s = archetypeSpec(lab, p, a);
  const own = Object.entries(feedsOf).filter(([, x]) => x === a).map(([id]) => id);
  if (!own.length) return s;
  const rest = Object.keys(s.sets).filter((id) => !own.includes(id));
  const sets: Record<string, number> = { [own[0]!]: 3 };
  [3, 2, 2].forEach((n, i) => (sets[rest[i]!] = n));
  return { ...s, sets };
};
const med = (xs: number[]) => [...xs].sort((a, b) => a - b)[xs.length >> 1]!;
const geo = (xs: number[]) => Math.exp(xs.reduce((a, x) => a + Math.log(x), 0) / xs.length);
const ordered = (plan: PlanEntry[], dir: 1 | -1) =>
  [...plan].sort((a, b) => dir * (combat.spells[b.spell]!.cooldown - combat.spells[a.spell]!.cooldown)).map((e, i) => ({ spell: e.spell, at: i }));

console.log('| Voie | Archétype | Zones : longues d\'abord / en dernier (contre le plan conseillé) | Gardiens : longues d\'abord / en dernier |');
console.log('|---|---|---|---|');
for (const p of Object.keys(combat.paths)) {
  const advised = combat.plans[`${p}_advised`]!.levels['80']!;
  for (const a of archs) {
    const build = makeBuild(lab, p, spec(p, a));
    const time = (plan: PlanEntry[], enc: (typeof encounters)[number]) => {
      const rs = SEEDS.map((s) => play(lab, p, { ...build, plan }, enc, 1, s));
      return med(rs.map((r) => (r.win ? r.time : (enc.timeLimit ?? combat.rules.fightLimit))));
    };
    const cmp = (kind: string) => {
      const es = encounters.filter((e) => e.kind === kind);
      const base = es.map((e) => time(advised, e));
      const first = es.map((e, i) => base[i]! / time(ordered(advised, 1), e));
      const last = es.map((e, i) => base[i]! / time(ordered(advised, -1), e));
      const f = (x: number) => `${x >= 1 ? '+' : ''}${((x - 1) * 100).toFixed(0)} %`;
      return `${f(geo(first))} / ${f(geo(last))}`;
    };
    console.log(`| ${combat.paths[p]!.name} | ${a} | ${cmp('zone')} | ${cmp('gardien')} |`);
  }
}

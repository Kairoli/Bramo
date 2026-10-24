/**
 * Le moteur de Puissance mesuré (docs/design/puissance.md) : 1. l'échelle de la Force dans la durée (un débutant, une
 * semaine, un mois, trois mois, six mois : niveau de classe, équipement, build, systèmes) ; 2. la Force suit-elle le vrai
 * mur ? (sur le banc des builds, le gain de mur mesuré contre le gain que la Force annonce). Proposition puissance-v1.
 *
 * pnpm --filter @bramo/sim exec tsx src/tempo/force.ts
 */
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { type CombatStats, type Content, applyPower, forceOf, nodeCost, powerTotals, strengthOf, tierFactorAt } from '@bramo/shared';
import type { CharacterState } from '@bramo/shared';
import { type Lab, paliers, seedList, wallOf } from '../coherence/lab.js';
import { loadVariant } from '../load.js';
import { makeBuild, randomSpecs } from '../scenarios/combat-build.js';

const ROOT = fileURLToPath(new URL('../../../', import.meta.url));
const content: Content = loadVariant('puissance-v1');
const combat = content.combat!;
const power = content.power!;
const ref = combat.rules.referenceStats;
const fr = (n: number, d = 0) => n.toLocaleString('fr-FR', { maximumFractionDigits: d, minimumFractionDigits: d });

// --- 1. Les phases d'un joueur actif ------------------------------------------------------------------------------
const xpHour = (L: number) => combat.rules.progression!.xpPerHour * 2 ** ((L - 1) / combat.rules.progression!.xpDoubling);
const levelAfter = (hours: number) => {
  let L = 1;
  let left = hours;
  while (L < 99) {
    const need = (content.xpTable[L + 1]! - content.xpTable[L]!) / xpHour(L);
    if (need > left) break;
    left -= need;
    L++;
  }
  return L;
};
type Snap = { label: string; days: number; gearTalents: number; levels: Record<string, Record<string, number>> };
const SNAPS: Snap[] = [
  { label: 'Premier jour', days: 1, gearTalents: 0, levels: {} },
  { label: 'Une semaine', days: 7, gearTalents: 1, levels: { recherches: { fil_de_lame: 5, cuir_epais: 5 }, lanterne: { meche: 8 } } },
  { label: 'Un mois', days: 30, gearTalents: 4, levels: { recherches: { fil_de_lame: 10, cuir_epais: 10, coup_franc: 3, elan: 2, savoir_maree: 5 }, lanterne: { meche: 18, flamme_vive: 1 }, reliques: { boussole_noyee: 3, cloche_du_puits: 2 } } },
  { label: 'Trois mois', days: 90, gearTalents: 8, levels: { recherches: { fil_de_lame: 16, cuir_epais: 16, coup_franc: 7, elan: 6, riposte: 5, pas_de_cote: 4, tranchant: 3, bonne_mine: 2, savoir_maree: 12, cadence_savante: 3 }, lanterne: { meche: 25, flamme: 9, flamme_vive: 1, halo: 1, fanal: 1 }, reliques: { boussole_noyee: 6, cloche_du_puits: 5, horloge_arretee: 5, lanterne_du_passeur: 4 } } },
  { label: 'Six mois', days: 180, gearTalents: 11, levels: { recherches: { fil_de_lame: 20, cuir_epais: 20, coup_franc: 10, elan: 10, riposte: 10, pas_de_cote: 10, tranchant: 8, bonne_mine: 6, savoir_maree: 20, cadence_savante: 8 }, lanterne: { meche: 25, flamme: 25, flamme_vive: 1, halo: 1, fanal: 1 }, reliques: { boussole_noyee: 10, cloche_du_puits: 9, horloge_arretee: 8, lanterne_du_passeur: 8, miroir_de_vase: 6, sceau_brise: 6 } } },
];
const researchHours = (lv: Record<string, number>) => {
  const sys = power.systems.find((s) => s.id === 'recherches')!;
  let s = 0;
  for (const [n, l] of Object.entries(lv)) for (let i = 1; i <= l; i++) s += nodeCost(sys.nodes.find((x) => x.id === n)!, i).seconds;
  return s / 3600;
};
const out: string[] = ['# Le moteur de Puissance, mesuré', '', '## 1. La Force dans la durée (un joueur actif, Forgefeu)', '', 'La route tourne ~20 h par jour. Équipement : Rare de son niveau (le plancher de référence). Build : talents de l\'équipement comptés à 0,15 palier chacun. Systèmes : les niveaux de la colonne « Systèmes ».', '', '| Phase | Niveau de classe | Talents d\'équipement | Recherches : temps demandé | Force sans les systèmes | Force avec | Gain des systèmes |', '|---|---|---|---|---|---|---|'];
for (const s of SNAPS) {
  const L = levelAfter(s.days * 20);
  const f = tierFactorAt(combat.rules, L);
  const stats: CombatStats = { ...ref, power: ref.power * f, maxHp: ref.maxHp * f };
  const state = { classId: 'forgefire', combat: { xp: { forgefire: content.xpTable[L]! } }, power: Object.fromEntries(Object.entries(s.levels).map(([k, v]) => [k, { levels: v, pending: [] }])) } as unknown as CharacterState;
  const pw = powerTotals(state, content);
  const withP = applyPower(stats, pw, power.config, combat.rules);
  const extra = s.gearTalents * power.config.force.talentValue;
  const f0 = forceOf(stats, power.config, ref, extra);
  const f1 = forceOf(withP, power.config, ref, extra + pw.force);
  const gain = paliers(strengthOf(withP, power.config) / strengthOf(stats, power.config)) + pw.force;
  out.push(`| ${s.label} | ${L} | ${s.gearTalents} | ${fr(researchHours(s.levels.recherches ?? {}))} h (${fr(researchHours(s.levels.recherches ?? {}) / 24 / s.days * 100)} % du temps) | ${fr(f0)} | **${fr(f1)}** | +${fr(gain, 1)} palier |`);
}

// --- 2. La Force suit-elle le mur ? -------------------------------------------------------------------------------
const encs = [combat.encounters.b4_notaire!, combat.encounters.b5_gardien_portes!, combat.encounters.z08_wound_ford!];
const lab: Lab = { content, combat, encounters: encs, catalog: combat.talents!, tools: combat.tools, reports: 'tempo' };
const SEEDS = seedList(9500, 8);
out.push('', '## 2. La Force suit-elle le vrai mur ?', '', 'Banc des builds (Rare de palier 20) : un build au hasard, puis le même avec les systèmes de chaque phase. Gain de mur mesuré (paliers) contre gain annoncé par la Force (paliers : (Force / Force sans)^(1/7)).', '', '| Voie | Phase | Mur mesuré | Annoncé par la Force |', '|---|---|---|---|');
const pairs: [number, number][] = [];
for (const p of ['red_temper', 'beastslayer', 'fulgurant']) {
  const cls = combat.paths[p]!.class;
  const spec = randomSpecs(lab, p, 4)[1]!;
  const b0 = makeBuild(lab, p, spec);
  const plan = combat.plans[`${p}_advised`]!.levels['80']!;
  for (const s of SNAPS.slice(1)) {
    const state = { classId: cls, combat: { xp: { [cls]: content.xpTable[60]! } }, power: Object.fromEntries(Object.entries(s.levels).map(([k, v]) => [k, { levels: v, pending: [] }])) } as unknown as CharacterState;
    const pw = powerTotals(state, content);
    const b1 = { ...b0, stats: applyPower(b0.stats, pw, power.config, combat.rules), talents: [...(b0.talents ?? []), ...pw.talents] };
    if (pw.talents.length) b1.pools = { ...Object.fromEntries(combat.talents!.pools.map((x) => [x.id, x.max])), ...b0.pools };
    let measured = 0;
    for (const e of encs) measured += paliers(wallOf(lab, p, { ...b1, plan }, e, SEEDS, 0.9, 0.01).wall / wallOf(lab, p, { ...b0, plan }, e, SEEDS, 0.9, 0.01).wall);
    measured /= encs.length;
    const announced = paliers(strengthOf(b1.stats, power.config) / strengthOf(b0.stats, power.config)) + pw.force;
    pairs.push([measured, announced]);
    out.push(`| ${combat.paths[p]!.name} | ${s.label} | +${fr(measured, 1)} | +${fr(announced, 1)} |`);
  }
}
const err = pairs.map(([m, a]) => a - m);
out.push('', `Écart moyen (annoncé − mesuré) : ${fr(err.reduce((x, y) => x + y, 0) / err.length, 2)} palier.`);
console.log(out.join('\n'));
void join;
void ROOT;

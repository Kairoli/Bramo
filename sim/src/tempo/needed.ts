/**
 * Le niveau qu'il faut pour chaque étape de la route : pour une liste d'étapes, le plus petit niveau de classe où chaque classe
 * gagne au moins 8 combats sur 10 avec le set de départ ramené au plancher (le joueur sans butin, comme `wall.ts`). Sert à
 * comparer deux versions des données (avant / après un changement de rythme) : la route doit rester aussi exigeante.
 *
 * pnpm --filter @bramo/sim exec tsx src/tempo/needed.ts [dossier data=../data] [étapes=1,5,10,...]
 */
import { fileURLToPath } from 'node:url';
import { type CharacterState, combatantOf, emptyCombat, fight, routeStage, tierFactorAt } from '@bramo/shared';
import { loadContent } from '@bramo/shared/node';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const dataDir = process.argv[2] ?? `${root}data`;
const content = loadContent(dataDir, `${root}art`);
const combat = content.combat!;
const stages = (process.argv[3] ?? '1,5,9,10,15,20,30,40,50,60,70,80,90,100,110,120').split(',').map(Number);

const wins = (classId: string, level: number, stageNo: number) => {
  const st = routeStage(combat, stageNo - 1);
  const starter = Object.values(content.gearModels).filter((m) => m.starter && m.classes.includes(classId));
  const state = { seed: 1, classId, equipment: starter.map((m) => ({ model: m.id, lines: [] })), combat: { ...emptyCombat(), xp: { [classId]: content.xpTable[level]! } } } as unknown as CharacterState;
  const setup = combatantOf(state, content);
  const s = tierFactorAt(combat.rules, st.tier);
  let w = 0;
  for (let seed = 1; seed <= 10; seed++) if (fight(combat, [setup], combat.encounters[st.encounter]!, { seed, enemyDamageScale: s, enemyHpScale: s }).win) w++;
  return w;
};
const need = (classId: string, stageNo: number) => {
  for (let L = 1; L <= 99; L++) if (wins(classId, L, stageNo) >= 8) return L;
  return 100;
};
const out: string[] = [`Données : ${dataDir}`, '| Étape | Palier | Rencontre | ' + Object.keys(combat.kits).join(' | ') + ' |'];
const all: Record<string, number[]> = {};
for (const n of stages) {
  const st = routeStage(combat, n - 1);
  const row = Object.keys(combat.kits).map((c) => need(c, n));
  all[n] = row;
  out.push(`| ${st.label} | ${st.tier} | ${combat.encounters[st.encounter]!.name.slice(0, 26)} | ${row.join(' | ')} |`);
}
console.log(out.join('\n'));
if (process.env.JSON) (await import('node:fs')).writeFileSync(process.env.JSON, JSON.stringify(all));

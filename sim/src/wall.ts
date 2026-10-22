/**
 * Mesure d'un mur de la route : victoires sur 10 à une étape, par classe et niveau de classe, sans ou avec une gemme de
 * situation sertie dans l'arme. Équipement : le set de départ, ramené au plancher du palier de la classe (le cas d'un
 * joueur qui n'a pas encore de butin). `pnpm --filter @bramo/sim exec tsx src/wall.ts [étape] [gemme]`, étape comptée
 * depuis 1 (10 = la Mère Grise).
 */
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadContent } from '@bramo/shared/node';
import { type CharacterState, combatantOf, emptyCombat, fight, routeStages, tierFactorAt } from '@bramo/shared';

const root = fileURLToPath(new URL('../../', import.meta.url));
export function wallTable(content: ReturnType<typeof loadContent>, stageNo: number, gem: string | null, levels = (process.env.LEVELS ?? "1,5,10,15,20").split(",").map(Number)): string[] {
  const combat = content.combat!;
  const stage = routeStages(combat)[stageNo - 1]!;
  const s = tierFactorAt(combat.rules, stage.tier);
  const out: string[] = [`Étape ${stage.label} (${combat.encounters[stage.encounter]!.name}, palier ${stage.tier}) · ${gem ?? 'sans gemme'}`];
  for (const classId of Object.keys(combat.kits)) {
    const starter = Object.values(content.gearModels).filter((m) => m.starter && m.classes.includes(classId));
    const row: string[] = [];
    for (const level of levels) {
      const state = {
        seed: 1,
        classId,
        equipment: starter.map((m) => ({ model: m.id, lines: [], ...(gem && m.slot === 'weapon' ? { gem } : {}) })),
        combat: { ...emptyCombat(), xp: { [classId]: content.xpTable[level]! } },
      } as unknown as CharacterState;
      const setup = combatantOf(state, content);
      let wins = 0;
      for (let seed = 1; seed <= 10; seed++) if (fight(combat, [setup], combat.encounters[stage.encounter]!, { seed, enemyDamageScale: s, enemyHpScale: s }).win) wins++;
      row.push(`niv ${level}: ${wins}/10`);
    }
    out.push(`  ${classId.padEnd(10)} ${row.join('  ')}`);
  }
  return out;
}

if (import.meta.url === `file:///${process.argv[1]!.replace(/\\/g, '/')}` || process.argv[1]?.endsWith('wall.ts')) {
  const content = loadContent(join(root, 'data'));
  const stageNo = Number(process.argv[2] ?? 10);
  const gem = process.argv[3] ?? null;
  for (const g of gem ? [null, gem] : [null]) console.log(wallTable(content, stageNo, g).join('\n'));
}

/**
 * Essai de donjon (dossier « Activités et artisanat » §9) : six salles enchaînées, PV gardés d'une salle à l'autre,
 * repos entre deux salles qui rend une part des PV maximum. Les cooldowns repartent à chaque salle dans cet essai
 * (le moteur ne transporte que les PV) : l'essai mesure la règle de récupération, pas la continuité des cooldowns.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { type CombatContent, fight } from '@bramo/shared';
import { ROOT } from '../load.js';

/** Fonderie sans maître, prototype : deux approches, deux rencontres, une combinaison, un gardien (profils du banc). */
export const foundryRooms = ['pack', 'duel', 'charge', 'pack', 'ward', 'recovery'];

export interface DungeonRun {
  path: string;
  restShare: number;
  danger: number;
  seed: number;
  cleared: number;
  win: boolean;
  /** Temps de combat cumulé (s), repos compris. */
  time: number;
  hpAtEnd: number;
}

export function runDungeon(combat: CombatContent, path: string, rooms: string[], restShare: number, restSeconds: number, danger: number, seed: number): DungeonRun {
  const plan = combat.plans[`${path}_advised`]!;
  const maxHp = combat.rules.referenceStats.maxHp;
  let hp = maxHp;
  let time = 0;
  let cleared = 0;
  for (const [i, room] of rooms.entries()) {
    const r = fight(combat, [{ id: 'p1', classId: plan.class, pathId: path, plan: plan.levels['80']!, weapon: plan.weapon, startHp: hp }], combat.encounters[room]!, {
      seed: seed * 31 + i,
      enemyDamageScale: danger,
    });
    time += r.time;
    if (!r.win) return { path, restShare, danger, seed, cleared, win: false, time, hpAtEnd: 0 };
    cleared++;
    hp = r.team[0]!.hp;
    if (i < rooms.length - 1) {
      hp = Math.min(maxHp, hp + restShare * maxHp);
      time += restSeconds;
    }
  }
  return { path, restShare, danger, seed, cleared, win: true, time, hpAtEnd: hp / maxHp };
}

export function dungeonReport(combat: CombatContent, seeds = 12): string {
  const shares = [0.2, 0.35, 0.5, 1];
  const dangers = [1, 1.25, 1.5];
  const runs: DungeonRun[] = [];
  for (const path of Object.keys(combat.paths))
    for (const share of shares)
      for (const danger of dangers) for (let seed = 0; seed < seeds; seed++) runs.push(runDungeon(combat, path, foundryRooms, share, 15, danger, seed));
  const md: string[] = ['# Essai de donjon : six salles, PV gardés', '', '> Généré par `pnpm --filter @bramo/sim sim combat-dungeon`. Ne pas modifier à la main.', ''];
  md.push(
    `Fonderie prototype : ${foundryRooms.join(' → ')} (profils du banc), plan conseillé de chaque voie au répertoire 80, ${seeds} graines. Entre deux salles, 15 s de repos qui rendent la part indiquée des PV maximum (100 % = salles indépendantes). Chaque cellule : parcours réussis · salles franchies en moyenne · durée médiane d'un parcours réussi.`,
    '',
  );
  for (const danger of dangers) {
    md.push(`## Danger ×${String(danger).replace('.', ',')}`, '');
    md.push(`| Voie | ${shares.map((s) => `Repos ${Math.round(s * 100)} %`).join(' | ')} |`, `|---|${shares.map(() => '---').join('|')}|`);
    for (const path of Object.values(combat.paths)) {
      const cells = shares.map((s) => {
        const rs = runs.filter((r) => r.path === path.id && r.restShare === s && r.danger === danger);
        const wins = rs.filter((r) => r.win).map((r) => r.time).sort((a, b) => a - b);
        const med = wins.length ? wins[wins.length >> 1]! : null;
        return `${Math.round((wins.length / rs.length) * 100)} % · ${(rs.reduce((a, r) => a + r.cleared, 0) / rs.length).toFixed(1).replace('.', ',')} · ${med === null ? '—' : `${(med / 60).toFixed(1).replace('.', ',')} min`}`;
      });
      md.push(`| ${path.name} | ${cells.join(' | ')} |`);
    }
    md.push('');
  }
  const dir = join(ROOT, 'sim', 'reports', 'combat');
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'donjon.md'), `${md.join('\n')}\n`);
  writeFileSync(join(dir, 'donjon.json'), `{"rooms":${JSON.stringify(foundryRooms)},"runs":[\n${runs.map((r) => JSON.stringify(r)).join(',\n')}\n]}\n`);
  return `Écrit : ${join(dir, 'donjon.md')}, donjon.json`;
}

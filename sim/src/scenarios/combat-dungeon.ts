/**
 * Essai de donjon (dossier « Activités et artisanat » §9) : six salles enchaînées, PV gardés d'une salle à l'autre,
 * repos entre deux salles qui rend une part des PV maximum, consommables préparés avant le départ (potions de secours,
 * repas de combat, chiffres du dossier §21). Les cooldowns repartent à chaque salle dans cet essai (le moteur ne
 * transporte que les PV et le stock de potions) : l'essai mesure la règle de récupération, pas la continuité des cooldowns.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { type CombatContent, type CombatantSetup, fight } from '@bramo/shared';
import { ROOT } from '../load.js';

/** Fonderie sans maître, prototype : deux approches, deux rencontres, une combinaison, un gardien (profils du banc). */
export const foundryRooms = ['pack', 'duel', 'charge', 'pack', 'ward', 'recovery'];

/** Ce que le personnage emporte : potions de secours (stock pour tout le parcours) et repas (+ PV maximum). */
export interface Supplies {
  id: string;
  name: string;
  potions?: NonNullable<CombatantSetup['potions']>;
  mealHp?: number;
}

const potion = (count: number) => ({ count, heal: 0.08, below: 0.35, cooldown: 90 });
export const supplies: Supplies[] = [
  { id: 'none', name: 'rien' },
  { id: 'potions', name: '3 potions', potions: potion(3) },
  { id: 'potions_meal', name: '3 potions + repas', potions: potion(3), mealHp: 0.03 },
  { id: 'potions6_meal', name: '6 potions + repas', potions: potion(6), mealHp: 0.03 },
];

export interface DungeonRun {
  path: string;
  restShare: number;
  supplies: string;
  danger: number;
  seed: number;
  cleared: number;
  win: boolean;
  /** Temps de combat cumulé (s), repos compris. */
  time: number;
  hpAtEnd: number;
  potionsUsed: number;
}

export function runDungeon(combat: CombatContent, path: string, rooms: string[], restShare: number, restSeconds: number, danger: number, seed: number, kit: Supplies = supplies[0]!): DungeonRun {
  const plan = combat.plans[`${path}_advised`]!;
  const maxHp = combat.rules.referenceStats.maxHp * (1 + (kit.mealHp ?? 0));
  let hp = maxHp;
  let time = 0;
  let cleared = 0;
  let potions = kit.potions?.count ?? 0;
  const base = { restShare, supplies: kit.id, danger, seed, path };
  for (const [i, room] of rooms.entries()) {
    const r = fight(
      combat,
      [{ id: 'p1', classId: plan.class, pathId: path, plan: plan.levels['80']!, weapon: plan.weapon, startHp: hp, stats: { maxHp }, ...(kit.potions ? { potions: { ...kit.potions, count: potions } } : {}) }],
      combat.encounters[room]!,
      { seed: seed * 31 + i, enemyDamageScale: danger },
    );
    time += r.time;
    potions -= r.team[0]!.metrics.potions ?? 0;
    const used = (kit.potions?.count ?? 0) - potions;
    if (!r.win) return { ...base, cleared, win: false, time, hpAtEnd: 0, potionsUsed: used };
    cleared++;
    hp = r.team[0]!.hp;
    if (i < rooms.length - 1) {
      hp = Math.min(maxHp, hp + restShare * maxHp);
      time += restSeconds;
    }
  }
  return { ...base, cleared, win: true, time, hpAtEnd: hp / maxHp, potionsUsed: (kit.potions?.count ?? 0) - potions };
}

export function dungeonReport(combat: CombatContent, seeds = 12): string {
  const shares = [0.2, 0.3, 0.4, 0.5, 1];
  const dangers = [1, 1.25, 1.5];
  const runs: DungeonRun[] = [];
  for (const path of Object.keys(combat.paths))
    for (const share of shares)
      for (const kit of supplies)
        for (const danger of dangers) for (let seed = 0; seed < seeds; seed++) runs.push(runDungeon(combat, path, foundryRooms, share, 15, danger, seed, kit));
  const cell = (path: string, share: number, kit: string, danger: number) => {
    const rs = runs.filter((r) => r.path === path && r.restShare === share && r.supplies === kit && r.danger === danger);
    const wins = rs.filter((r) => r.win).length / rs.length;
    return { wins, cleared: rs.reduce((a, r) => a + r.cleared, 0) / rs.length, potions: rs.reduce((a, r) => a + r.potionsUsed, 0) / rs.length };
  };
  const md: string[] = ['# Essai de donjon : six salles, PV gardés, consommables', '', '> Généré par `pnpm --filter @bramo/sim sim combat-dungeon`. Ne pas modifier à la main.', ''];
  md.push(
    `Fonderie prototype : ${foundryRooms.join(' → ')} (profils du banc), plan conseillé de chaque voie au répertoire 80, ${seeds} graines. Entre deux salles, 15 s de repos qui rendent la part indiquée des PV maximum (100 % = salles indépendantes). Consommables du dossier (§21) : potion de secours bue automatiquement sous 35 % des PV, rend 8 % des PV maximum, une toutes les 90 s, stock pour tout le parcours ; repas de combat +3 % de PV maximum. Chaque cellule : parcours réussis (salles franchies en moyenne).`,
    '',
  );
  for (const danger of dangers) {
    md.push(`## Danger ×${String(danger).replace('.', ',')}`, '');
    const cols = shares.filter((s) => s < 1).flatMap((s) => supplies.map((k) => ({ s, k })));
    md.push(`| Voie | ${cols.map(({ s, k }) => `${Math.round(s * 100)} % · ${k.name}`).join(' | ')} |`, `|---|${cols.map(() => '---').join('|')}|`);
    for (const path of Object.values(combat.paths)) {
      md.push(`| ${path.name} | ${cols.map(({ s, k }) => {
        const c = cell(path.id, s, k.id, danger);
        return `${Math.round(c.wins * 100)} % (${c.cleared.toFixed(1).replace('.', ',')})`;
      }).join(' | ')} |`);
    }
    md.push('');
  }
  // Synthèse : nombre de voies (sur 9) qui terminent au moins 90 % des parcours.
  md.push('## Synthèse : voies (sur 9) qui terminent au moins 90 % des parcours', '');
  md.push(`| Repos | ${supplies.map((k) => k.name).join(' | ')} |`, `|---|${supplies.map(() => '---').join('|')}|`);
  for (const danger of dangers)
    for (const s of shares) {
      md.push(`| ×${String(danger).replace('.', ',')} · ${Math.round(s * 100)} % | ${supplies.map((k) => Object.keys(combat.paths).filter((p) => cell(p, s, k.id, danger).wins >= 0.9).length).join(' | ')} |`);
    }
  md.push('');
  const dir = join(ROOT, 'sim', 'reports', 'combat');
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'donjon.md'), `${md.join('\n')}\n`);
  writeFileSync(join(dir, 'donjon.json'), `{"rooms":${JSON.stringify(foundryRooms)},"supplies":${JSON.stringify(supplies)},"runs":[\n${runs.map((r) => JSON.stringify(r)).join(',\n')}\n]}\n`);
  return `Écrit : ${join(dir, 'donjon.md')}, donjon.json`;
}

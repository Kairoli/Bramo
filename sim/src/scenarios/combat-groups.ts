/**
 * Essais de groupe (dossier « Activités et artisanat » §9 et §10) : 1 à 4 combattants, plusieurs façons d'adapter les ennemis.
 * Question posée : un groupe gagne-t-il du temps ou de la sûreté sans multiplier les récompenses par participant ?
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { type CombatContent, type CombatantSetup, type FightResult, fight } from '@bramo/shared';
import { ROOT } from '../load.js';

export interface Scaling {
  id: string;
  name: string;
  /** PV ennemis × N^hp ; cadence des attaques ordinaires × N^rate ; qui est visé. */
  hp: number;
  rate: number;
  targeting: 'front' | 'rotate';
}

export const scalings: Scaling[] = [
  { id: 'hp', name: 'PV × N, cadence inchangée, coups répartis', hp: 1, rate: 0, targeting: 'rotate' },
  { id: 'hp_rate', name: 'PV × N, cadence × N, coups répartis', hp: 1, rate: 1, targeting: 'rotate' },
  { id: 'hp_rate_front', name: 'PV × N, cadence × N, tout sur le premier', hp: 1, rate: 1, targeting: 'front' },
];

/** Compositions jouées avec les plans conseillés (`<voie>_advised`) au répertoire 80. */
export const compositions: { id: string; name: string; paths: string[] }[] = [
  { id: 'duo', name: 'Fulgurant + Glyphiste', paths: ['fulgurant', 'glyphkeeper'] },
  { id: 'trio', name: 'Trempe-Rouge + Enclumier + Rémouleur', paths: ['red_temper', 'anvil', 'whetter'] },
  { id: 'dps4', name: '4 dégâts', paths: ['red_temper', 'beastslayer', 'fulgurant', 'red_temper'] },
  { id: 'control4', name: '4 contrôles', paths: ['anvil', 'trapper', 'sigilbinder', 'sigilbinder'] },
  { id: 'support4', name: '4 soutiens', paths: ['whetter', 'packleader', 'glyphkeeper', 'glyphkeeper'] },
  { id: 'mixed4', name: 'Mixte (2 dégâts, contrôle, soutien)', paths: ['red_temper', 'sigilbinder', 'glyphkeeper', 'beastslayer'] },
];

const median = (xs: number[]): number | null => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  return s.length % 2 ? s[s.length >> 1]! : (s[s.length / 2 - 1]! + s[s.length / 2]!) / 2;
};

function setupOf(combat: CombatContent, pathId: string, i: number): CombatantSetup {
  const plan = combat.plans[`${pathId}_advised`];
  if (!plan) throw new Error(`plan conseillé absent : ${pathId}`);
  const role = combat.paths[pathId]!.role;
  return { id: `p${i + 1}`, classId: plan.class, pathId, plan: plan.levels['80']!, weapon: plan.weapon, beneficiary: role === 'support' ? 'lowest' : 'self' };
}

interface Cell {
  winRate: number;
  time: number | null;
  /** Temps de victoire du groupe rapporté au temps médian de ses membres en solo (même rencontre, même danger). */
  timeVsSolo: number | null;
  minMemberHp: number;
  deaths: number;
  /** Part des dégâts du meilleur et du moins bon participant ; soins utiles et absorbés par les soutiens. */
  damageShare: number[];
}

export function groupReport(combat: CombatContent, seeds = 8, dangers = [1, 2]): string {
  const encounters = Object.values(combat.encounters);
  const runs = (setups: CombatantSetup[], enc: (typeof encounters)[number], danger: number, s: Scaling | null): FightResult[] =>
    Array.from({ length: seeds }, (_, seed) =>
      fight(combat, setups, enc, {
        seed,
        enemyDamageScale: danger,
        ...(s ? { enemyHpScale: setups.length ** s.hp, enemyAttackRateScale: setups.length ** s.rate, targeting: s.targeting } : {}),
      }),
    );
  // Référence : chaque voie seule.
  const solo: Record<string, number | null> = {};
  for (const path of Object.keys(combat.paths)) {
    for (const enc of encounters)
      for (const danger of dangers) {
        const rs = runs([setupOf(combat, path, 0)], enc, danger, null);
        solo[`${path}|${enc.id}|${danger}`] = median(rs.filter((r) => r.win).map((r) => r.time));
      }
  }
  const rows: Record<string, unknown>[] = [];
  const md: string[] = ['# Essais de groupe (1 à 4 combattants)', '', '> Généré par `pnpm --filter @bramo/sim sim combat-groups`. Ne pas modifier à la main.', ''];
  md.push(
    `Plans conseillés au répertoire 80, statistiques normalisées, ${seeds} graines. Les soutiens protègent et soignent l'allié le plus bas en PV, les autres eux-mêmes. « vs solo » : temps de victoire du groupe divisé par le temps médian de ses membres seuls sur la même rencontre — 1,00 signifie que chacun gagne une rencontre aussi vite qu'en solo, donc **autant de récompenses par participant et par heure** si chaque victoire donne un butin personnel complet.`,
    '',
  );
  for (const s of scalings) {
    md.push(`## ${s.name}`, '');
    for (const danger of dangers) {
      md.push(`**Danger ×${String(danger).replace('.', ',')}** — victoires · vs solo · PV du membre le plus bas · morts par combat`, '');
      md.push(`| Composition | ${encounters.map((e) => e.name).join(' | ')} |`, `|---|${encounters.map(() => '---').join('|')}|`);
      for (const comp of compositions) {
        const setups = comp.paths.map((p, i) => setupOf(combat, p, i));
        const cells = encounters.map((enc) => {
          const rs = runs(setups, enc, danger, s);
          const wins = rs.filter((r) => r.win);
          const time = median(wins.map((r) => r.time));
          const soloTimes = comp.paths.map((p) => solo[`${p}|${enc.id}|${danger}`]).filter((x): x is number => x !== null);
          const ref = median(soloTimes);
          const cell: Cell = {
            winRate: wins.length / rs.length,
            time,
            timeVsSolo: time && ref ? time / ref : null,
            minMemberHp: median(rs.map((r) => Math.min(...r.team.map((m) => m.hpRatio))))!,
            deaths: rs.reduce((a, r) => a + r.team.filter((m) => !m.alive).length, 0) / rs.length,
            damageShare: (() => {
              const total = rs.reduce((a, r) => a + r.team.reduce((b, m) => b + m.contributions.damage, 0), 0);
              const per = setups.map((_, i) => rs.reduce((a, r) => a + r.team[i]!.contributions.damage, 0) / total);
              return [Math.max(...per), Math.min(...per)];
            })(),
          };
          rows.push({ scaling: s.id, danger, composition: comp.id, encounter: enc.id, ...cell });
          return `${Math.round(cell.winRate * 100)} % · ${cell.timeVsSolo === null ? '—' : cell.timeVsSolo.toFixed(2).replace('.', ',')} · ${Math.round(cell.minMemberHp * 100)} % · ${cell.deaths.toFixed(1).replace('.', ',')}`;
        });
        md.push(`| ${comp.name} | ${cells.join(' | ')} |`);
      }
      md.push('');
    }
  }
  const dir = join(ROOT, 'sim', 'reports', 'combat');
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'groupes.md'), `${md.join('\n')}\n`);
  writeFileSync(join(dir, 'groupes.json'), `{"seeds":${seeds},"rows":[\n${rows.map((r) => JSON.stringify(r)).join(',\n')}\n]}\n`);
  return `Écrit : ${join(dir, 'groupes.md')}, groupes.json`;
}

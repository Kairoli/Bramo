/**
 * Donjon en groupe : la Fonderie prototype jouée à 4 (et un DPS seul pour comparer). Ennemis à l'échelle du groupe
 * (PV × N, cadence × N, coups répartis), PV gardés par membre ; un membre tombé reste hors combat jusqu'à la fin de la
 * salle, puis revient avec 50 % de ses PV si elle est gagnée (dossier « Activités et artisanat » §9).
 * Question : un soutien ou un contrôle rend-il le groupe plus solide que des dégâts en plus ?
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { type CombatContent, fight } from '@bramo/shared';
import { ROOT } from '../load.js';
import { type Supplies, foundryRooms, supplies } from './combat-dungeon.js';

/** Compositions de 4 (plans conseillés) ; la première ligne est le DPS seul pour comparer. */
export const dungeonParties: { id: string; name: string; paths: string[] }[] = [
  { id: 'solo_dps', name: 'Trempe-Rouge seul', paths: ['red_temper'] },
  { id: 'dps4', name: '4 dégâts', paths: ['red_temper', 'beastslayer', 'fulgurant', 'red_temper'] },
  { id: 'dps3_ctrl', name: '3 dégâts + contrôle', paths: ['red_temper', 'beastslayer', 'fulgurant', 'sigilbinder'] },
  { id: 'dps2_ctrl2', name: '2 dégâts + 2 contrôles', paths: ['red_temper', 'fulgurant', 'sigilbinder', 'anvil'] },
  { id: 'dps2_sup_ctrl', name: '2 dégâts + soutien + contrôle', paths: ['red_temper', 'fulgurant', 'glyphkeeper', 'sigilbinder'] },
  { id: 'dps2_sup2', name: '2 dégâts + 2 soutiens', paths: ['red_temper', 'fulgurant', 'glyphkeeper', 'whetter'] },
  // Recherche de failles : des groupes sans dégâts deviennent-ils increvables, et à quelle vitesse gagnent-ils ?
  { id: 'sup2_ctrl2', name: '2 soutiens + 2 contrôles', paths: ['glyphkeeper', 'whetter', 'sigilbinder', 'anvil'] },
  { id: 'sup4', name: '4 soutiens', paths: ['glyphkeeper', 'whetter', 'packleader', 'glyphkeeper'] },
];

export interface PartyRun {
  party: string;
  restShare: number;
  supplies: string;
  danger: number;
  seed: number;
  cleared: number;
  win: boolean;
  /** Chutes de membres au cours du parcours (un même membre peut tomber plusieurs fois). */
  falls: number;
  potionsUsed: number;
  /** Aide apportée aux alliés (soins utiles, absorbé, atténué), par voie, et dégâts reçus par toute l'équipe. */
  helpAllies: number;
  helpBy: Record<string, number>;
  damageTaken: number;
  time: number;
}

/**
 * `hpExponent` : les PV ennemis suivent aussi le danger (PV × danger^exposant). La pente du dossier (PV × 1,012^s,
 * dégâts × 1,008^s) correspond à un exposant de 1,5 ; 0 = seuls les dégâts montent.
 */
export function runPartyDungeon(combat: CombatContent, party: string, paths: string[], rooms: string[], restShare: number, danger: number, seed: number, kit: Supplies, hpExponent = 0): PartyRun {
  const n = paths.length;
  const maxHp = combat.rules.referenceStats.maxHp * (1 + (kit.mealHp ?? 0));
  const hp = paths.map(() => maxHp);
  const potions = paths.map(() => kit.potions?.count ?? 0);
  const helpBy: Record<string, number> = {};
  let cleared = 0;
  let falls = 0;
  let helpAllies = 0;
  let damageTaken = 0;
  let time = 0;
  const used = () => paths.reduce((a, _, k) => a + (kit.potions?.count ?? 0) - potions[k]!, 0);
  for (const [i, room] of rooms.entries()) {
    const alive = paths.map((_, k) => k).filter((k) => hp[k]! > 0);
    const setups = alive.map((k) => {
      // Un plan de groupe (`<voie>_group`, soins et protections) prime sur le plan conseillé, fait pour le solo.
      const plan = combat.plans[`${paths[k]}_group`] ?? combat.plans[`${paths[k]}_advised`]!;
      const role = combat.paths[paths[k]!]!.role;
      return {
        id: `p${k + 1}`,
        classId: plan.class,
        pathId: paths[k]!,
        plan: plan.levels['80']!,
        weapon: plan.weapon,
        startHp: hp[k]!,
        stats: { maxHp },
        beneficiary: role === 'support' ? ('lowest' as const) : ('self' as const),
        ...(kit.potions ? { potions: { ...kit.potions, count: potions[k]! } } : {}),
      };
    });
    // L'échelle suit l'effectif engagé au départ (pas de redimensionnement en cours de parcours).
    // La fureur suit la profondeur : son seuil grandit comme les PV ennemis.
    const base = combat.encounters[room]!;
    const encounter = base.enrage ? { ...base, enrage: { ...base.enrage, after: base.enrage.after * danger ** hpExponent } } : base;
    const r = fight(combat, setups, encounter, { seed: seed * 31 + i, enemyDamageScale: danger, enemyHpScale: n * danger ** hpExponent, enemyAttackRateScale: n, targeting: 'rotate' });
    time += r.time;
    alive.forEach((k, j) => {
      const m = r.team[j]!;
      potions[k]! -= m.metrics.potions ?? 0;
      const help = (m.metrics.healingAllies ?? 0) + (m.metrics.absorbedAllies ?? 0) + (m.metrics.mitigatedAllies ?? 0);
      helpAllies += help;
      helpBy[paths[k]!] = (helpBy[paths[k]!] ?? 0) + help;
      damageTaken += (m.metrics.hpLost ?? 0) + (m.metrics.erosionDamage ?? 0) + (m.metrics.auraDamage ?? 0);
      if (!m.alive) falls++;
      hp[k] = m.hp;
    });
    if (!r.win) return { party, restShare, supplies: kit.id, danger, seed, cleared, win: false, falls, potionsUsed: used(), helpAllies, helpBy, damageTaken, time };
    cleared++;
    for (let k = 0; k < n; k++) {
      if (hp[k]! <= 0) hp[k] = 0.5 * maxHp;
      if (i < rooms.length - 1) hp[k] = Math.min(maxHp, hp[k]! + restShare * maxHp);
    }
    if (i < rooms.length - 1) time += 15;
  }
  return { party, restShare, supplies: kit.id, danger, seed, cleared, win: true, falls, potionsUsed: used(), helpAllies, helpBy, damageTaken, time };
}

export function partyDungeonReport(combat: CombatContent, seeds = 12, out = 'donjon-groupe', hpExponent = 0): string {
  const shares = [0.2, 0.3];
  const dangers = [1, 1.25, 1.5, 2];
  const kits = [supplies[0]!, supplies[2]!];
  const runs: PartyRun[] = [];
  for (const p of dungeonParties)
    for (const share of shares)
      for (const kit of kits)
        for (const danger of dangers) for (let seed = 0; seed < seeds; seed++) runs.push(runPartyDungeon(combat, p.id, p.paths, foundryRooms, share, danger, seed, kit, hpExponent));
  const md: string[] = ['# Essai de donjon en groupe', '', '> Généré par `pnpm --filter @bramo/sim sim combat-dungeon-party`. Ne pas modifier à la main.', ''];
  md.push(
    `Fonderie prototype (${foundryRooms.join(' → ')}), plans conseillés au répertoire 80, ${seeds} graines. Ennemis à l'échelle du groupe : PV × N, cadence des attaques × N, coups répartis entre les membres. Danger : dégâts ennemis × danger${hpExponent ? `, PV ennemis × danger^${String(hpExponent).replace('.', ',')} (pente du dossier)` : ' (PV inchangés)'}. PV gardés par membre ; un membre tombé revient à 50 % après une salle gagnée ; les soutiens visent l'allié le plus bas. Cellule : parcours réussis (chutes de membres par parcours).`,
    '',
  );
  const sel = (p: string, share: number, kit: string, d: number) => runs.filter((r) => r.party === p && r.restShare === share && r.supplies === kit && r.danger === d);
  for (const share of shares)
    for (const kit of kits) {
      md.push(`## Repos ${Math.round(share * 100)} % · ${kit.name}`, '');
      md.push(`| Composition | ${dangers.map((d) => `×${String(d).replace('.', ',')}`).join(' | ')} | Aide aux alliés / dégâts reçus (×1) | Durée médiane d'un parcours réussi (×1) |`, `|---|${dangers.map(() => '---').join('|')}|---|---|`);
      for (const p of dungeonParties) {
        const cells = dangers.map((d) => {
          const rs = sel(p.id, share, kit.id, d);
          return `${Math.round((rs.filter((r) => r.win).length / rs.length) * 100)} % (${(rs.reduce((a, r) => a + r.falls, 0) / rs.length).toFixed(1).replace('.', ',')})`;
        });
        const one = sel(p.id, share, kit.id, 1);
        const help = one.reduce((a, r) => a + r.helpAllies, 0) / Math.max(1, one.reduce((a, r) => a + r.damageTaken, 0));
        const won = one.filter((r) => r.win).map((r) => r.time).sort((a, b) => a - b);
        const dur = won.length ? `${(won[won.length >> 1]! / 60).toFixed(1).replace('.', ',')} min` : '—';
        md.push(`| ${p.name} | ${cells.join(' | ')} | ${p.paths.length > 1 ? `${Math.round(help * 100)} %` : '—'} | ${dur} |`);
      }
      md.push('');
    }
  md.push('## Aide apportée aux alliés, par voie (danger ×1, repos 30 %, 3 potions + repas)', '');
  md.push('Soins utiles, dégâts absorbés par ses boucliers et dégâts évités par ses affaiblissements, **sur les alliés seulement**, en moyenne par parcours (6 salles). À comparer aux 2 800 PV d’un membre.', '');
  md.push('| Composition | Aide par voie | Dégâts reçus par l’équipe |', '|---|---|---|');
  for (const p of dungeonParties.filter((x) => x.paths.length > 1)) {
    const rs = sel(p.id, 0.3, 'potions_meal', 1);
    const by: Record<string, number> = {};
    for (const r of rs) for (const [k, v] of Object.entries(r.helpBy)) by[k] = (by[k] ?? 0) + v / rs.length;
    md.push(`| ${p.name} | ${Object.entries(by).map(([k, v]) => `${combat.paths[k]!.name} ${Math.round(v)}`).join(' · ')} | ${Math.round(rs.reduce((a, r) => a + r.damageTaken, 0) / rs.length)} |`);
  }
  md.push('');
  const dir = join(ROOT, 'sim', 'reports', 'combat');
  writeFileSync(join(dir, `${out}.md`), `${md.join('\n')}\n`);
  writeFileSync(join(dir, `${out}.json`), `{"rooms":${JSON.stringify(foundryRooms)},"parties":${JSON.stringify(dungeonParties)},"runs":[\n${runs.map((r) => JSON.stringify(r)).join(',\n')}\n]}\n`);
  return `Écrit : ${join(dir, `${out}.md`)}, ${out}.json`;
}

/**
 * Sonde ponctuelle (diagnostic d'une zone) : `pnpm --filter @bramo/sim exec tsx src/coherence/probe.ts <zones> <voie> <rencontre> <danger> [outil]`.
 * Joue le témoin de la voie, avec et sans l'outil, sur 8 graines, et affiche les compteurs moyens utiles au diagnostic.
 */
import { makeLab, play } from './lab.js';
import { poolFor, referenceStats } from '../scenarios/combat-coherence.js';

const [zones = 'zones-v2', path = 'red_temper', enc = 'z05_balance_cloister', danger = '1.5', tool = 'fracture_4', priority = 'chief'] = process.argv.slice(2);
const lab = makeLab('coherence-v1', zones);
const cls = lab.combat.paths[path]!.class;
const stats = referenceStats(lab, cls);
const plans = poolFor(lab, path);
const keys = ['damage:basic', 'damage:skill', 'guardDamage', 'guardDamageBonus', 'guardedHits', 'hpLost', 'beatBonus', 'kills', 'potions'];
for (const p of plans) {
  for (const t of [null, lab.tools.find((x) => x.id === tool) ?? null]) {
    const build = { id: 'x', stats, plan: p.plan, priority: priority as 'chief', ...(t ? { tools: [t] } : {}) };
    const rs = [1, 2, 3, 4, 5, 6, 7, 8].map((s) => play(lab, path, build, lab.combat.encounters[enc]!, Number(danger), s));
    const m: Record<string, number> = {};
    for (const r of rs) for (const k of keys) m[k] = (m[k] ?? 0) + (r.team[0]!.metrics[k] ?? 0) / rs.length;
    const wins = rs.filter((r) => r.win).length;
    const time = rs.reduce((a, r) => a + r.time, 0) / rs.length;
    console.log(`${p.id.padEnd(8)} ${(t?.id ?? 'aucun').padEnd(12)} victoires ${wins}/8 temps ${time.toFixed(0)} s ${keys.map((k) => `${k}=${(m[k] ?? 0).toFixed(0)}`).join(' ')}`);
  }
}

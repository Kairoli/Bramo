/**
 * Audit, ajout n° 5 : compare des rapports de simulation de serveur (JSON de `src/server/run.ts`) sur ce qui juge le recalage
 * de la Puissance : route, Force et « dont systèmes » (paliers de Force ajoutés par recherches, reliques et lanterne) aux jours
 * 30, 60 et 89, pour chaque façon de jouer ; or créé et détruit.
 *
 * pnpm --filter @bramo/sim exec tsx src/audit/comparer-puissance.ts <rapport.json> [<rapport.json>…]
 */
import { readFileSync } from 'node:fs';
import { basename } from 'node:path';

interface Mark { classe: number; route: number; or: number; force: number; systemes?: number }
interface Row { persona: string; label: string; n: number; j30: Mark; j60: Mark; j89: Mark }
interface Report { runtimeSec: number; progression: Row[]; economy: { faucetTotal: number; sinkTotal: number; lateRatio: number; sink: Record<string, number> }; classes?: unknown }

const fr = (n: number, d = 0) => n.toLocaleString('fr-FR', { maximumFractionDigits: d, minimumFractionDigits: d });
const big = (n: number) => (n >= 1e6 ? `${fr(n / 1e6, 1)} M` : n >= 1e3 ? `${fr(n / 1e3, 0)} k` : fr(n));
const files = process.argv.slice(2);
const out: string[] = [];
for (const f of files) {
  const r = JSON.parse(readFileSync(f, 'utf8')) as Report;
  out.push(`### ${basename(f)} (calcul ${fr(r.runtimeSec)} s)`, '');
  out.push('| Façon de jouer | n | j30 : route · Force · systèmes | j60 : route · Force · systèmes | j89 : route · Force · systèmes |', '|---|---|---|---|---|');
  for (const p of r.progression) {
    const cell = (m: Mark) => `${fr(m.route, 1)} · ${big(m.force)} · ${m.systemes === undefined ? '—' : `+${fr(m.systemes, 1)}`}`;
    out.push(`| ${p.label} | ${p.n} | ${cell(p.j30)} | ${cell(p.j60)} | ${cell(p.j89)} |`);
  }
  const e = r.economy;
  out.push('', `Or créé ${big(e.faucetTotal)}, détruit ${big(e.sinkTotal)} (créé / détruit sur 90 jours : ${fr(e.faucetTotal / e.sinkTotal, 2)} ; sur les 30 derniers jours : ${e.lateRatio}). Mis dans la Puissance : ${big(e.sink['Puissance (systèmes)'] ?? 0)}.`, '');
}
console.log(out.join('\n'));

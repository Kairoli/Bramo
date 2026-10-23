/**
 * Simulation de serveur : `pnpm --filter @bramo/sim exec tsx src/server/run.ts [joueurs] [jours] [composition] [graine] [nom]`.
 * Écrit `sim/reports/serveur/<nom>.md` et `.json`.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadContent } from '@bramo/shared/node';
import { analyze, toMarkdown } from './report.js';
import { runServer } from './world.js';
import { type TideStats, tideHook } from './tideHook.js';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const content = loadContent(join(root, 'data'));
// Essais : PATCH='{"combat.rules.gearStats.floorShare":0.8}' change des valeurs du contenu pour cette simulation seulement.
for (const [path, value] of Object.entries(JSON.parse(process.env.PATCH ?? '{}') as Record<string, unknown>)) {
  const keys = path.split('.');
  let o = content as unknown as Record<string, unknown>;
  for (const k of keys.slice(0, -1)) o = o[k] as Record<string, unknown>;
  o[keys.at(-1)!] = value;
}
// Essais : GOLD_MUL=1.5 multiplie l'or des commandes du Comptoir (la question : plus d'or, plus d'échanges ?).
if (process.env.GOLD_MUL) for (const o of Object.values(content.npcOrders)) o.gold = Math.round(o.gold * Number(process.env.GOLD_MUL));
const [players = '20', days = '10', mix = 'real', seed = '1', name] = process.argv.slice(2);
const tide: TideStats = { nights: [], rows: [], outfits: 0, chests: { caches: 0, total: 0 } };
const hooks = process.env.TIDE === '0' ? [] : [tideHook(tide)];
const r = runServer(content, { players: Number(players), days: Number(days), mix, seed: Number(seed), hooks });
const a = analyze(r, content, tide);
const out = join(root, 'sim/reports/serveur');
mkdirSync(out, { recursive: true });
const file = name ?? `${mix}-${players}x${days}-s${seed}`;
writeFileSync(join(out, `${file}.json`), JSON.stringify(a, null, 1));
writeFileSync(join(out, `${file}.md`), toMarkdown(a));
console.log(`durée ${r.runtimeSec} s, cache ${Math.round((r.fightCache.hits / r.fightCache.calls) * 100)} % → sim/reports/serveur/${file}.md`);

/**
 * Serveur du test de charge (lancé par `stress.ts`, jamais seul) : le vrai serveur du jeu sur une base à part, avec une
 * horloge qu'on peut avancer (pour jouer un retour après 16 h ou une Marée) et ses mesures (processeur, mémoire, retard de
 * la boucle d'événements) envoyées au lanceur.
 */
import { monitorEventLoopDelay } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import { loadContent } from '@bramo/shared/node';
import { buildApp } from '../../app.js';
import { createDb } from '../../db/index.js';

process.env.LOG_LEVEL ??= 'error';
const root = fileURLToPath(new URL('../../../../../', import.meta.url));
const content = loadContent(`${root}data`, `${root}art`);
const pgliteDir = process.env.PGLITE_DIR;
if (!process.env.DATABASE_URL && !pgliteDir) throw new Error('PGLITE_DIR ou DATABASE_URL requis : jamais la base de développement.');

let offset = 0;
const { db, close } = await createDb(process.env.DATABASE_URL || undefined, pgliteDir ?? '');
const app = await buildApp({ db, content, clock: () => Date.now() + offset, devTools: true, trustProxy: true });
await app.listen({ port: Number(process.env.PORT ?? 3199), host: '127.0.0.1' });

const lag = monitorEventLoopDelay({ resolution: 10 });
lag.enable();
let cpu = process.cpuUsage();
let wall = performance.now();

process.on('message', async (msg: { type: string; offset?: number }) => {
  if (msg.type === 'clock') {
    offset = msg.offset ?? 0;
    process.send!({ type: 'clock' });
  } else if (msg.type === 'stats') {
    const used = process.cpuUsage(cpu);
    const elapsed = performance.now() - wall;
    process.send!({
      type: 'stats',
      cpu: (used.user + used.system) / 1000 / elapsed,
      rssMb: Math.round(process.memoryUsage().rss / 1e6),
      lagP50: lag.percentile(50) / 1e6,
      lagP99: lag.percentile(99) / 1e6,
      lagMax: lag.max / 1e6,
    });
    cpu = process.cpuUsage();
    wall = performance.now();
    lag.reset();
  } else if (msg.type === 'stop') {
    await app.close();
    await close();
    process.exit(0);
  }
});
// Le lanceur interrompu : on ne reste pas en vie sur le port.
process.on('disconnect', () => process.exit(0));
process.send!({ type: 'ready' });

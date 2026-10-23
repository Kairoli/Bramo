import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { ContentError } from '@bramo/shared';
import { loadContent } from '@bramo/shared/node';
import { buildApp } from './app.js';
import { createDb } from './db/index.js';

const root = fileURLToPath(new URL('../../../', import.meta.url));
if (existsSync(`${root}.env`)) process.loadEnvFile(`${root}.env`);

const dataDir = process.env.DATA_DIR ?? `${root}data`;
const artDir = process.env.ART_DIR ?? `${root}art`;
const pgliteDir = process.env.PGLITE_DIR ?? fileURLToPath(new URL('../.pglite', import.meta.url));
const port = Number(process.env.PORT ?? 3001);

let content;
try {
  content = loadContent(dataDir, artDir);
} catch (err) {
  // Données invalides : on refuse de démarrer, avec un message lisible.
  console.error(err instanceof ContentError ? `\n${err.message}\n` : err);
  process.exit(1);
}

const { db, close } = await createDb(process.env.DATABASE_URL || undefined, pgliteDir);
const app = await buildApp({ db, content, secureCookies: process.env.NODE_ENV === 'production', devTools: process.env.NODE_ENV !== 'production', trustProxy: process.env.TRUST_PROXY === '1' });

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, async () => {
    await app.close();
    await close();
    process.exit(0);
  });
}

// HOST : 127.0.0.1 par défaut (rien d'exposé) ; 0.0.0.0 dans le conteneur de production, derrière le reverse proxy.
await app.listen({ port, host: process.env.HOST ?? '127.0.0.1' });
console.log(`Bramo API sur http://127.0.0.1:${port} · base : ${process.env.DATABASE_URL ? 'PostgreSQL' : `PGlite (${pgliteDir})`}`);

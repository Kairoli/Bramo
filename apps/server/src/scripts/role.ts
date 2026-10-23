/**
 * Donner ou retirer le rôle de modérateur de la discussion :
 *   pnpm --filter @bramo/server role <pseudo> moderator
 *   pnpm --filter @bramo/server role <pseudo> player
 * Même base que le serveur (DATABASE_URL, sinon PGLITE_DIR) ; avec PGlite, arrêter le serveur d'abord (une seule connexion).
 */
import { fileURLToPath } from 'node:url';
import { eq } from 'drizzle-orm';
import { createDb } from '../db/index.js';
import { accounts } from '../db/schema.js';

const [username, role] = process.argv.slice(2);
if (!username || (role !== 'moderator' && role !== 'player')) {
  console.error('Usage : pnpm --filter @bramo/server role <pseudo> moderator|player');
  process.exit(1);
}
const pgliteDir = process.env.PGLITE_DIR ?? fileURLToPath(new URL('../../.pglite', import.meta.url));
const { db, close } = await createDb(process.env.DATABASE_URL || undefined, pgliteDir);
const done = await db.update(accounts).set({ role }).where(eq(accounts.username, username.toLowerCase())).returning({ id: accounts.id });
console.log(done.length ? `${username} est maintenant ${role === 'moderator' ? 'modérateur' : 'joueur'}.` : `Aucun compte « ${username} ».`);
await close();

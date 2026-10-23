/**
 * Photo de profil [demande de Louis, 23 octobre : « pouvoir être qui on veut ; mettre ce qu'on veut, une image d'anime ou
 * autre », comme Legend of Mushroom]. Le client recadre l'image en carré (256 × 256) et l'envoie ; le serveur n'accepte
 * que WebP, PNG ou JPEG (jamais SVG : une image ne doit pas pouvoir exécuter de code), sous une taille maximale, et vérifie
 * la signature du fichier. L'image est servie avec un numéro de version dans l'adresse (mise en cache longue).
 *
 * Modération (sortie publique) : un joueur peut signaler une photo ; à `hideAfterReports` signalements de joueurs
 * différents, elle est masquée (le joueur garde son personnage en portrait) ; un modérateur peut la retirer.
 */
import { and, count, eq, inArray } from 'drizzle-orm';
import { type Content, GameError } from '@bramo/shared';
import type { Db, Tx } from './db/index.js';
import { accounts, avatarReports, characterAvatars, characters } from './db/schema.js';

const MIME: Record<string, (b: Buffer) => boolean> = {
  'image/webp': (b) => b.subarray(0, 4).toString('ascii') === 'RIFF' && b.subarray(8, 12).toString('ascii') === 'WEBP',
  'image/png': (b) => b[0] === 0x89 && b.subarray(1, 4).toString('ascii') === 'PNG',
  'image/jpeg': (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
};

/** Image envoyée (data URL) → type et octets, ou une erreur claire. */
export function parseAvatar(dataUrl: string, maxBytes: number): { mime: string; bytes: Buffer } {
  const m = /^data:(image\/(?:webp|png|jpeg));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!m) throw new GameError('avatar_format', 'Image refusée : il faut une image WebP, PNG ou JPEG.');
  const mime = m[1]!;
  const bytes = Buffer.from(m[2]!, 'base64');
  if (bytes.length > maxBytes) throw new GameError('avatar_size', `Image trop lourde (${Math.round(bytes.length / 1000)} ko, ${Math.round(maxBytes / 1000)} ko au plus).`);
  if (!MIME[mime]!(bytes)) throw new GameError('avatar_format', 'Ce fichier n’est pas une image valide.');
  return { mime, bytes };
}

/** Changer sa photo de profil (pas plus d'une fois par `cooldownSec`). */
export async function setAvatar(tx: Tx, characterId: number, dataUrl: string, now: number, content: Content): Promise<number> {
  const rules = content.settings.avatar;
  const { mime, bytes } = parseAvatar(dataUrl, rules.maxBytes);
  const [old] = await tx.select().from(characterAvatars).where(eq(characterAvatars.characterId, characterId));
  if (old && now - old.updatedAt.getTime() < rules.cooldownSec * 1000) {
    throw new GameError('avatar_cooldown', `Vous venez de changer de photo : réessayez dans ${Math.ceil((rules.cooldownSec * 1000 - (now - old.updatedAt.getTime())) / 1000)} s.`);
  }
  const version = (old?.version ?? 0) + 1;
  const row = { characterId, mime, data: bytes.toString('base64'), version, hidden: false, updatedAt: new Date(now) };
  if (old) await tx.update(characterAvatars).set(row).where(eq(characterAvatars.characterId, characterId));
  else await tx.insert(characterAvatars).values(row);
  await tx.update(characters).set({ avatar: version }).where(eq(characters.id, characterId));
  return version;
}

/** Retirer sa photo (le personnage revient en portrait). */
export async function removeAvatar(tx: Tx, characterId: number): Promise<void> {
  await tx.delete(characterAvatars).where(eq(characterAvatars.characterId, characterId));
  await tx.update(characters).set({ avatar: null }).where(eq(characters.id, characterId));
}

/** Signaler la photo d'un joueur ; masquée après assez de signalements différents (pour cette version de la photo). */
export async function reportAvatar(tx: Tx, reporterId: number, characterId: number, content: Content, now: number): Promise<{ hidden: boolean }> {
  if (reporterId === characterId) throw new GameError('avatar_self', 'Vous ne pouvez pas signaler votre propre photo.');
  const [a] = await tx.select().from(characterAvatars).where(eq(characterAvatars.characterId, characterId));
  if (!a || a.hidden) return { hidden: true };
  await tx.insert(avatarReports).values({ characterId, reporterId, version: a.version, at: new Date(now) }).onConflictDoNothing();
  const [{ n } = { n: 0 }] = await tx.select({ n: count() }).from(avatarReports).where(and(eq(avatarReports.characterId, characterId), eq(avatarReports.version, a.version)));
  if (Number(n) >= content.settings.avatar.hideAfterReports) {
    await tx.update(characterAvatars).set({ hidden: true }).where(eq(characterAvatars.characterId, characterId));
    await tx.update(characters).set({ avatar: null }).where(eq(characters.id, characterId));
    return { hidden: true };
  }
  return { hidden: false };
}

/** Un modérateur retire la photo d'un joueur. */
export async function moderateAvatar(tx: Tx, moderatorId: number, characterId: number): Promise<void> {
  const [me] = await tx.select({ role: accounts.role }).from(characters).innerJoin(accounts, eq(accounts.id, characters.accountId)).where(eq(characters.id, moderatorId));
  if (me?.role !== 'moderator') throw new GameError('not_moderator', 'Réservé aux modérateurs.');
  await removeAvatar(tx, characterId);
  // La devise de la page profil part avec la photo.
  await tx.update(characters).set({ motto: null }).where(eq(characters.id, characterId));
}

/** La photo à servir (pas une photo masquée). */
export async function readAvatar(db: Db, characterId: number): Promise<{ mime: string; bytes: Buffer; version: number } | null> {
  const [a] = await db.select().from(characterAvatars).where(eq(characterAvatars.characterId, characterId));
  if (!a || a.hidden) return null;
  return { mime: a.mime, bytes: Buffer.from(a.data, 'base64'), version: a.version };
}

/** Sa photo et son état, pour la fenêtre Profil. */
export async function myAvatar(db: Db, characterId: number, now: number, content: Content): Promise<{ avatar: number | null; hidden: boolean; nextChangeAt: number }> {
  const [a] = await db.select().from(characterAvatars).where(eq(characterAvatars.characterId, characterId));
  return { avatar: a && !a.hidden ? a.version : null, hidden: !!a?.hidden, nextChangeAt: a ? a.updatedAt.getTime() + content.settings.avatar.cooldownSec * 1000 : now };
}

/** Versions des photos visibles de plusieurs personnages (pour les listes : discussion, classement…). */
export async function avatarsOf(tx: Tx | Db, ids: number[]): Promise<Map<number, { avatar: number | null; classId: string | null }>> {
  const unique = [...new Set(ids.filter((x) => x > 0))];
  if (!unique.length) return new Map();
  const rows = await tx.select({ id: characters.id, avatar: characters.avatar, classId: characters.classId }).from(characters).where(inArray(characters.id, unique));
  return new Map(rows.map((r) => [r.id, { avatar: r.avatar, classId: r.classId }]));
}

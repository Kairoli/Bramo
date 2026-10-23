/**
 * Discussion du serveur et des clans (sortie publique, 23 octobre ; réglages `settings.chat`).
 *
 * - Deux canaux : le serveur (tout le monde) et le clan (ses membres seulement).
 * - Limites : longueur, un message toutes les `minIntervalSec` secondes et `perMinute` par minute, liens refusés.
 * - Signalement : un par joueur et par message ; à `reportsToHide` signalements, le message est masqué.
 * - Modération : un modérateur (rôle du compte) supprime un message ou rend son auteur muet pour quelques heures.
 */
import { and, desc, eq, sql } from 'drizzle-orm';
import { type ChatMessageView, type ChatView, type Content, GameError } from '@bramo/shared';
import type { Db, Tx } from './db/index.js';
import { accounts, characters, chatMessages, chatReports, clanMembers } from './db/schema.js';

const LINK = /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|fr|net|org|io|gg|ru|xyz|ly|me)\b)/i;

/** Envois récents par personnage (en mémoire : seulement pour freiner les rafales). */
const recent = new Map<number, number[]>();

async function channelOf(tx: Tx | Db, characterId: number, channel: 'server' | 'clan'): Promise<string | null> {
  if (channel === 'server') return 'server';
  const [m] = await tx.select({ clanId: clanMembers.clanId }).from(clanMembers).where(eq(clanMembers.characterId, characterId));
  return m ? `clan:${m.clanId}` : null;
}

async function accountOf(tx: Tx | Db, characterId: number) {
  const [row] = await tx
    .select({ role: accounts.role, mutedUntil: accounts.mutedUntil, accountId: accounts.id })
    .from(characters)
    .innerJoin(accounts, eq(accounts.id, characters.accountId))
    .where(eq(characters.id, characterId));
  return row;
}

export async function readChat(db: Db, characterId: number, channel: 'server' | 'clan', now: number, content: Content): Promise<ChatView> {
  const key = await channelOf(db, characterId, channel);
  const me = await accountOf(db, characterId);
  const moderator = me?.role === 'moderator';
  if (!key) return { channel, messages: [], canWrite: false, reason: 'Rejoignez un clan pour discuter avec ses membres.', moderator };
  const rows = await db
    .select()
    .from(chatMessages)
    .where(and(eq(chatMessages.channel, key), eq(chatMessages.hidden, false)))
    .orderBy(desc(chatMessages.id))
    .limit(content.settings.chat.history);
  const messages: ChatMessageView[] = rows.reverse().map((r) => ({ id: r.id, at: r.at.getTime(), name: r.name, characterId: r.characterId, text: r.text, mine: r.characterId === characterId }));
  const muted = me?.mutedUntil && me.mutedUntil.getTime() > now;
  return { channel, messages, canWrite: !muted, reason: muted ? `Vous êtes muet dans la discussion jusqu’au ${me!.mutedUntil!.toLocaleString('fr-FR')}.` : null, moderator };
}

export async function postChat(tx: Tx, characterId: number, name: string, channel: 'server' | 'clan', raw: string, now: number, content: Content): Promise<void> {
  const rules = content.settings.chat;
  const text = raw.replace(/\s+/g, ' ').trim();
  if (!text) throw new GameError('empty', 'Le message est vide.');
  if (text.length > rules.maxLength) throw new GameError('too_long', `Un message fait au plus ${rules.maxLength} caractères.`);
  if (rules.blockLinks && LINK.test(text)) throw new GameError('link', 'Les liens ne sont pas autorisés dans la discussion.');
  const me = await accountOf(tx, characterId);
  if (me?.mutedUntil && me.mutedUntil.getTime() > now) throw new GameError('muted', 'Vous êtes muet dans la discussion pour le moment.');
  const key = await channelOf(tx, characterId, channel);
  if (!key) throw new GameError('no_clan', 'Rejoignez un clan pour discuter avec ses membres.');
  const sent = (recent.get(characterId) ?? []).filter((t) => t > now - 60_000);
  if (sent.length && now - sent.at(-1)! < rules.minIntervalSec * 1000) throw new GameError('too_fast', 'Doucement : un message à la fois.');
  if (sent.length >= rules.perMinute) throw new GameError('too_many', 'Trop de messages d’un coup : patientez un peu.');
  recent.set(characterId, [...sent, now]);
  await tx.insert(chatMessages).values({ channel: key, characterId, name, text, at: new Date(now) });
}

/** Signaler un message (une fois par joueur) ; il est masqué à partir de `reportsToHide` signalements. */
export async function reportChat(tx: Tx, characterId: number, messageId: number, now: number, content: Content): Promise<void> {
  const [msg] = await tx.select().from(chatMessages).where(eq(chatMessages.id, messageId));
  if (!msg) throw new GameError('gone', 'Ce message n’existe plus.');
  if (msg.characterId === characterId) throw new GameError('own', 'C’est votre propre message.');
  await tx.insert(chatReports).values({ messageId, characterId, at: new Date(now) }).onConflictDoNothing();
  const [n] = await tx.select({ n: sql<number>`count(*)::int` }).from(chatReports).where(eq(chatReports.messageId, messageId));
  if ((n?.n ?? 0) >= content.settings.chat.reportsToHide) await tx.update(chatMessages).set({ hidden: true }).where(eq(chatMessages.id, messageId));
}

/** Modération : supprimer un message, ou rendre son auteur muet pendant `hours` heures (et masquer le message). */
export async function moderateChat(tx: Tx, characterId: number, messageId: number, action: 'delete' | 'mute', hours: number | undefined, now: number): Promise<string> {
  const me = await accountOf(tx, characterId);
  if (me?.role !== 'moderator') throw new GameError('not_moderator', 'Réservé aux modérateurs.');
  const [msg] = await tx.select().from(chatMessages).where(eq(chatMessages.id, messageId));
  if (!msg) throw new GameError('gone', 'Ce message n’existe plus.');
  await tx.update(chatMessages).set({ hidden: true }).where(eq(chatMessages.id, messageId));
  if (action === 'delete' || !msg.characterId) return 'Message supprimé.';
  const author = await accountOf(tx, msg.characterId);
  const until = new Date(now + (hours ?? 24) * 3_600_000);
  if (author) await tx.update(accounts).set({ mutedUntil: until }).where(eq(accounts.id, author.accountId));
  return `${msg.name} est muet jusqu’au ${until.toLocaleString('fr-FR')}.`;
}

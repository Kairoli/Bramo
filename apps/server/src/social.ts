/**
 * Amis, blocage et messages privés (docs/design/social.md ; demande de Louis du 24 octobre ; décidé : messages privés
 * ouverts à tous par défaut, le réglage « qui peut m'écrire » ne sert que contre le harcèlement).
 *
 * - Ami : une demande, acceptée ou refusée ; une demande croisée devient tout de suite une amitié. `social.maxFriends` au plus.
 * - Bloquer : coupe l'amitié et les demandes ; le bloqué ne peut plus écrire ni demander ; ses messages publics sont masqués
 *   pour celui qui bloque (chat.ts).
 * - Messages privés : les règles de la discussion publique (chat.ts, `checkMessage`) ; gardés `social.historyDays` jours ;
 *   seul le destinataire peut en signaler un.
 */
import { and, desc, eq, inArray, lt, or, sql } from 'drizzle-orm';
import { type ConversationView, type Content, type FriendsView, GameError, type MessagesView, type RelationView, type SocialPerson, type ThreadView } from '@bramo/shared';
import type { Db, Tx } from './db/index.js';
import { blocks, characters, clanMembers, friendships, privateMessages } from './db/schema.js';
import { checkMessage } from './chat.js';
import { insertEntries } from './journal.js';

type Conn = Tx | Db;

/** Les fiches sociales de quelques joueurs : nom, photo, classe, en ligne, ce qu'il fait. */
export async function people(db: Conn, ids: number[], now: number, content: Content): Promise<Map<number, SocialPerson>> {
  const unique = [...new Set(ids)];
  if (!unique.length) return new Map();
  const rows = await db
    .select({ id: characters.id, name: characters.name, avatar: characters.avatar, classId: characters.classId, lastSeenAt: characters.lastSeenAt, activity: characters.activity })
    .from(characters)
    .where(inArray(characters.id, unique));
  const online = content.settings.social.onlineMin * 60_000;
  return new Map(
    rows.map((r) => {
      const recipe = r.activity ? content.recipes[r.activity.recipeId] : undefined;
      return [r.id, { id: r.id, name: r.name, avatar: r.avatar, classId: r.classId, online: now - r.lastSeenAt.getTime() < online, lastSeenAt: r.lastSeenAt.getTime(), doing: recipe?.name ?? null }];
    }),
  );
}

async function nameOf(db: Conn, id: number): Promise<string> {
  const [r] = await db.select({ name: characters.name }).from(characters).where(eq(characters.id, id));
  if (!r) throw new GameError('no_player', 'Ce joueur est introuvable.');
  return r.name;
}

async function sameClan(db: Conn, a: number, b: number): Promise<boolean> {
  const rows = await db.select({ id: clanMembers.characterId, clanId: clanMembers.clanId }).from(clanMembers).where(inArray(clanMembers.characterId, [a, b]));
  return rows.length === 2 && rows[0]!.clanId === rows[1]!.clanId;
}

/** Le lien de `me` vers `other`. */
export async function relation(db: Conn, me: number, other: number): Promise<RelationView> {
  const [f] = await db
    .select()
    .from(friendships)
    .where(or(and(eq(friendships.requesterId, me), eq(friendships.addresseeId, other)), and(eq(friendships.requesterId, other), eq(friendships.addresseeId, me))));
  const bl = await db.select().from(blocks).where(or(and(eq(blocks.blockerId, me), eq(blocks.blockedId, other)), and(eq(blocks.blockerId, other), eq(blocks.blockedId, me))));
  const blocked = bl.some((b) => b.blockerId === me);
  const blockedMe = bl.some((b) => b.blockerId === other);
  const friend: RelationView['friend'] = !f ? 'none' : f.status === 'accepted' ? 'friends' : f.requesterId === me ? 'sent' : 'received';
  const [target] = await db.select({ policy: characters.dmPolicy }).from(characters).where(eq(characters.id, other));
  const allowed = target?.policy !== 'friends_clan' || friend === 'friends' || (await sameClan(db, me, other));
  return { friend, blocked, canMessage: me !== other && !blocked && !blockedMe && allowed };
}

export async function requestFriend(tx: Tx, me: number, myName: string, other: number, now: number, content: Content): Promise<string> {
  if (me === other) throw new GameError('self', 'Vous ne pouvez pas être votre propre ami.');
  const name = await nameOf(tx, other);
  const rel = await relation(tx, me, other);
  if (rel.blocked) throw new GameError('blocked', 'Vous avez bloqué ce joueur.');
  const [them] = await tx.select().from(blocks).where(and(eq(blocks.blockerId, other), eq(blocks.blockedId, me)));
  if (them) throw new GameError('blocked_me', 'Ce joueur ne reçoit pas de demande de votre part.');
  if (rel.friend === 'friends') return `${name} est déjà votre ami.`;
  if (rel.friend === 'sent') return `Demande déjà envoyée à ${name}.`;
  const [count] = await tx
    .select({ n: sql<number>`count(*)::int` })
    .from(friendships)
    .where(and(eq(friendships.status, 'accepted'), or(eq(friendships.requesterId, me), eq(friendships.addresseeId, me))));
  if ((count?.n ?? 0) >= content.settings.social.maxFriends) throw new GameError('too_many', `${content.settings.social.maxFriends} amis au plus.`);
  // Il vous l'avait déjà demandé : c'est fait.
  if (rel.friend === 'received') return respondFriend(tx, me, myName, other, true, now);
  await tx.insert(friendships).values({ requesterId: me, addresseeId: other, status: 'pending', createdAt: new Date(now) });
  await insertEntries(tx, other, [{ at: now, kind: 'info', text: `Ami : ${myName} vous demande en ami (onglet Amis).` }]);
  return `Demande envoyée à ${name}.`;
}

export async function respondFriend(tx: Tx, me: number, myName: string, other: number, accept: boolean, now: number): Promise<string> {
  const name = await nameOf(tx, other);
  const [req] = await tx.select().from(friendships).where(and(eq(friendships.requesterId, other), eq(friendships.addresseeId, me), eq(friendships.status, 'pending')));
  if (!req) throw new GameError('no_request', 'Aucune demande de ce joueur.');
  if (!accept) {
    await tx.delete(friendships).where(and(eq(friendships.requesterId, other), eq(friendships.addresseeId, me)));
    return `Demande de ${name} refusée.`;
  }
  await tx.update(friendships).set({ status: 'accepted', acceptedAt: new Date(now) }).where(and(eq(friendships.requesterId, other), eq(friendships.addresseeId, me)));
  await insertEntries(tx, other, [{ at: now, kind: 'info', text: `Ami : ${myName} a accepté votre demande.` }]);
  return `${name} est maintenant votre ami.`;
}

/** Retirer un ami, ou annuler une demande envoyée. */
export async function removeFriend(tx: Tx, me: number, other: number): Promise<string> {
  const name = await nameOf(tx, other);
  await tx.delete(friendships).where(or(and(eq(friendships.requesterId, me), eq(friendships.addresseeId, other)), and(eq(friendships.requesterId, other), eq(friendships.addresseeId, me))));
  return `${name} n’est plus dans vos amis.`;
}

export async function setBlock(tx: Tx, me: number, other: number, block: boolean, now: number): Promise<string> {
  if (me === other) throw new GameError('self', 'Vous ne pouvez pas vous bloquer.');
  const name = await nameOf(tx, other);
  if (!block) {
    await tx.delete(blocks).where(and(eq(blocks.blockerId, me), eq(blocks.blockedId, other)));
    return `${name} n’est plus bloqué.`;
  }
  await tx.insert(blocks).values({ blockerId: me, blockedId: other, at: new Date(now) }).onConflictDoNothing();
  await removeFriend(tx, me, other);
  return `${name} est bloqué : il ne peut plus vous écrire ni vous demander en ami.`;
}

export async function friendsView(db: Db, me: number, now: number, content: Content): Promise<FriendsView> {
  const rows = await db.select().from(friendships).where(or(eq(friendships.requesterId, me), eq(friendships.addresseeId, me)));
  const bl = await db.select({ id: blocks.blockedId, name: characters.name }).from(blocks).innerJoin(characters, eq(characters.id, blocks.blockedId)).where(eq(blocks.blockerId, me));
  const others = rows.map((r) => (r.requesterId === me ? r.addresseeId : r.requesterId));
  const ps = await people(db, others, now, content);
  const pick = (f: (r: (typeof rows)[number]) => boolean) =>
    rows
      .filter(f)
      .map((r) => ps.get(r.requesterId === me ? r.addresseeId : r.requesterId))
      .filter((p): p is SocialPerson => !!p);
  // Les amis en ligne d'abord, puis les plus récemment vus.
  const friends = pick((r) => r.status === 'accepted').sort((a, b) => Number(b.online) - Number(a.online) || b.lastSeenAt - a.lastSeenAt);
  return { friends, incoming: pick((r) => r.status === 'pending' && r.addresseeId === me), outgoing: pick((r) => r.status === 'pending' && r.requesterId === me), blocked: bl, max: content.settings.social.maxFriends };
}

// --- Messages privés ------------------------------------------------------------------------------------------------

export async function sendPrivate(tx: Tx, me: number, to: number, raw: string, now: number, content: Content): Promise<void> {
  if (me === to) throw new GameError('self', 'Vous ne pouvez pas vous écrire.');
  await nameOf(tx, to);
  const rel = await relation(tx, me, to);
  if (rel.blocked) throw new GameError('blocked', 'Vous avez bloqué ce joueur : débloquez-le pour lui écrire.');
  if (!rel.canMessage) throw new GameError('closed', 'Ce joueur ne reçoit pas de messages de votre part.');
  const text = await checkMessage(tx, me, raw, now, content);
  await tx.insert(privateMessages).values({ fromId: me, toId: to, text, at: new Date(now) });
  // Les messages trop anciens s'en vont (au fil des envois : pas de tâche de fond).
  await tx.delete(privateMessages).where(lt(privateMessages.at, new Date(now - content.settings.social.historyDays * 86_400_000)));
}

export async function messagesView(db: Db, me: number, now: number, content: Content): Promise<MessagesView> {
  const rows = await db
    .select()
    .from(privateMessages)
    .where(or(eq(privateMessages.fromId, me), eq(privateMessages.toId, me)))
    .orderBy(desc(privateMessages.id))
    .limit(1000);
  const byOther = new Map<number, { last: (typeof rows)[number]; unread: number }>();
  for (const r of rows) {
    const other = r.fromId === me ? r.toId : r.fromId;
    const c = byOther.get(other) ?? { last: r, unread: 0 };
    if (r.toId === me && !r.readAt) c.unread++;
    byOther.set(other, c);
  }
  const ps = await people(db, [...byOther.keys()], now, content);
  const conversations: ConversationView[] = [...byOther]
    .map(([other, c]) => {
      const p = ps.get(other);
      return p ? { with: p, last: { text: c.last.text, at: c.last.at.getTime(), mine: c.last.fromId === me }, unread: c.unread } : null;
    })
    .filter((x): x is ConversationView => !!x);
  const [req] = await db.select({ n: sql<number>`count(*)::int` }).from(friendships).where(and(eq(friendships.addresseeId, me), eq(friendships.status, 'pending')));
  const [mine] = await db.select({ policy: characters.dmPolicy }).from(characters).where(eq(characters.id, me));
  return { conversations, unread: conversations.reduce((n, c) => n + c.unread, 0), requests: req?.n ?? 0, dmPolicy: mine?.policy === 'friends_clan' ? 'friends_clan' : 'all' };
}

/** Une conversation : les derniers messages, lus en l'ouvrant. */
export async function threadView(db: Db, me: number, other: number, now: number, content: Content): Promise<ThreadView> {
  const p = (await people(db, [other], now, content)).get(other);
  if (!p) throw new GameError('no_player', 'Ce joueur est introuvable.');
  const pair = or(and(eq(privateMessages.fromId, me), eq(privateMessages.toId, other)), and(eq(privateMessages.fromId, other), eq(privateMessages.toId, me)));
  const rows = await db.select().from(privateMessages).where(pair).orderBy(desc(privateMessages.id)).limit(content.settings.social.thread);
  await db
    .update(privateMessages)
    .set({ readAt: new Date(now) })
    .where(and(eq(privateMessages.fromId, other), eq(privateMessages.toId, me), sql`${privateMessages.readAt} is null`));
  const rel = await relation(db, me, other);
  return {
    with: p,
    messages: rows.reverse().map((r) => ({ id: r.id, at: r.at.getTime(), text: r.text, mine: r.fromId === me })),
    relation: rel,
    canWrite: rel.canMessage,
    reason: rel.blocked ? 'Vous avez bloqué ce joueur.' : rel.canMessage ? null : 'Ce joueur ne reçoit pas de messages de votre part.',
  };
}

/** Signaler un message reçu : un modérateur pourra le lire (et lui seul). */
export async function reportPrivate(tx: Tx, me: number, messageId: number): Promise<void> {
  const [m] = await tx.select().from(privateMessages).where(eq(privateMessages.id, messageId));
  if (!m || m.toId !== me) throw new GameError('gone', 'Ce message n’existe plus.');
  await tx.update(privateMessages).set({ reported: true }).where(eq(privateMessages.id, messageId));
}

export async function setDmPolicy(tx: Tx, me: number, policy: 'all' | 'friends_clan'): Promise<void> {
  await tx.update(characters).set({ dmPolicy: policy }).where(eq(characters.id, me));
}

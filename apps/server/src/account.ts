/**
 * Le compte du joueur (sortie publique, 23 octobre) : ses données en un fichier (droit d'accès et de portabilité du RGPD),
 * et la suppression de tout (droit à l'effacement). Les tables liées au personnage s'effacent en cascade ; l'historique du
 * marché garde ses échanges, sans le nom du joueur (acheteur ou vendeur à null).
 */
import { and, asc, eq, ne, or } from 'drizzle-orm';
import type { Db, Tx } from './db/index.js';
import { accounts, characterItems, characterSkills, characters, chatMessages, clanLog, clanMembers, clans, gearItems, journal, marketOrders, marketTrades, tideEntries } from './db/schema.js';

export async function exportAccount(db: Db, accountId: number) {
  const [account] = await db.select({ username: accounts.displayName, createdAt: accounts.createdAt }).from(accounts).where(eq(accounts.id, accountId));
  const [character] = await db.select().from(characters).where(eq(characters.accountId, accountId));
  if (!account || !character) return { account: account ?? null, character: null };
  const id = character.id;
  const [skills, items, gear, orders, trades, entries, notes, member, messages] = await Promise.all([
    db.select().from(characterSkills).where(eq(characterSkills.characterId, id)),
    db.select().from(characterItems).where(eq(characterItems.characterId, id)),
    db.select().from(gearItems).where(eq(gearItems.characterId, id)),
    db.select().from(marketOrders).where(eq(marketOrders.characterId, id)),
    db.select().from(marketTrades).where(or(eq(marketTrades.buyerId, id), eq(marketTrades.sellerId, id))),
    db.select().from(tideEntries).where(eq(tideEntries.characterId, id)),
    db.select().from(journal).where(eq(journal.characterId, id)),
    db.select().from(clanMembers).where(eq(clanMembers.characterId, id)),
    db.select().from(chatMessages).where(eq(chatMessages.characterId, id)),
  ]);
  return {
    exportedAt: new Date().toISOString(),
    account,
    character,
    skills,
    items,
    gear,
    marketOrders: orders,
    marketTrades: trades.map((t) => ({ at: t.at, itemId: t.itemId, qty: t.qty, price: t.price, side: t.buyerId === id ? 'achat' : 'vente' })),
    tideNights: entries,
    clan: member[0] ?? null,
    journal: notes,
    chatMessages: messages,
  };
}

/**
 * Supprime un compte et tout ce qui s'y rattache. Un chef de clan qui part laisse la direction à un officier, sinon au membre
 * le plus ancien ; seul, son clan est dissous.
 */
export async function deleteAccount(tx: Tx, accountId: number, now: number): Promise<void> {
  const [character] = await tx.select().from(characters).where(eq(characters.accountId, accountId));
  if (character) {
    const [me] = await tx.select().from(clanMembers).where(eq(clanMembers.characterId, character.id));
    if (me?.rank === 'leader') {
      const others = await tx
        .select()
        .from(clanMembers)
        .where(and(eq(clanMembers.clanId, me.clanId), ne(clanMembers.characterId, character.id)))
        .orderBy(asc(clanMembers.joinedAt));
      const heir = others.find((m) => m.rank === 'officer') ?? others[0];
      if (heir) {
        await tx.update(clanMembers).set({ rank: 'leader' }).where(eq(clanMembers.characterId, heir.characterId));
        const [h] = await tx.select({ name: characters.name }).from(characters).where(eq(characters.id, heir.characterId));
        await tx.insert(clanLog).values({ clanId: me.clanId, at: new Date(now), text: `${character.name} a quitté le jeu : ${h?.name ?? 'un membre'} prend la tête du clan.` });
      } else {
        await tx.delete(clans).where(eq(clans.id, me.clanId));
      }
    } else if (me) {
      await tx.insert(clanLog).values({ clanId: me.clanId, at: new Date(now), text: `${character.name} a quitté le jeu.` });
    }
  }
  // Ses messages de la discussion partent avec lui (ils portent son nom).
  if (character) await tx.delete(chatMessages).where(eq(chatMessages.characterId, character.id));
  // Le compte part ; le personnage, ses objets, ses ordres et ses sessions suivent (cascade).
  await tx.delete(accounts).where(eq(accounts.id, accountId));
}

import { and, asc, desc, eq, gte, sql } from 'drizzle-orm';
import {
  type CharacterState,
  type ClanListItem,
  type ClanMemberView,
  type ClanRank,
  type ClanView,
  type Content,
  GameError,
  addStack,
  clanBonusFor,
  clanLevelCost,
  cloneState,
  isDurable,
} from '@bramo/shared';
import type { Db, Tx } from './db/index.js';
import { characters, clanItems, clanLog, clanMembers, clans } from './db/schema.js';

export interface ClanResult {
  state: CharacterState;
  log: string;
}

const DAY = 86_400_000;

async function membership(tx: Tx, characterId: number) {
  const [row] = await tx.select().from(clanMembers).where(eq(clanMembers.characterId, characterId)).for('update');
  return row;
}

async function logLine(tx: Tx, clanId: number, at: number, text: string, keep: number) {
  await tx.insert(clanLog).values({ clanId, at: new Date(at), text });
  // On ne garde que les dernières lignes.
  const old = await tx.select({ id: clanLog.id }).from(clanLog).where(eq(clanLog.clanId, clanId)).orderBy(desc(clanLog.id)).offset(keep);
  for (const o of old) await tx.delete(clanLog).where(eq(clanLog.id, o.id));
}

async function memberCount(tx: Tx | Db, clanId: number): Promise<number> {
  const [r] = await tx.select({ n: sql<number>`count(*)::int` }).from(clanMembers).where(eq(clanMembers.clanId, clanId));
  return r?.n ?? 0;
}

async function activeCount(tx: Tx | Db, clanId: number, now: number, content: Content): Promise<number> {
  const since = new Date(now - content.settings.clan.activeDays * DAY);
  const [r] = await tx
    .select({ n: sql<number>`count(*)::int` })
    .from(clanMembers)
    .innerJoin(characters, eq(characters.id, clanMembers.characterId))
    .where(and(eq(clanMembers.clanId, clanId), gte(characters.lastSeenAt, since)));
  return r?.n ?? 0;
}

export async function createClan(
  tx: Tx,
  content: Content,
  characterId: number,
  characterName: string,
  input: CharacterState,
  p: { name: string; description: string },
  now: number,
): Promise<ClanResult> {
  const { clan } = content.settings;
  const name = p.name.replace(/\s+/g, ' ').trim();
  if (name.length < clan.nameMin || name.length > clan.nameMax) {
    throw new GameError('clan_name', `Le nom d’un clan fait entre ${clan.nameMin} et ${clan.nameMax} caractères.`);
  }
  if (await membership(tx, characterId)) throw new GameError('in_clan', 'Vous êtes déjà dans un clan : quittez-le d’abord.');
  if (input.gold < clan.creationCost) throw new GameError('gold', `Fonder un clan coûte ${clan.creationCost} or.`);
  const [taken] = await tx.select().from(clans).where(eq(clans.nameKey, name.toLowerCase()));
  if (taken) throw new GameError('clan_taken', 'Ce nom de clan est déjà pris.');
  const [created] = await tx.insert(clans).values({ name, nameKey: name.toLowerCase(), description: p.description }).returning();
  await tx.insert(clanMembers).values({ characterId, clanId: created!.id, rank: 'leader' });
  await logLine(tx, created!.id, now, `${characterName} fonde le clan.`, clan.logSize);
  const state = cloneState(input);
  state.gold -= clan.creationCost;
  state.clanBonus = clanBonusFor(0, content);
  return { state, log: `Vous fondez le clan « ${name} » (−${clan.creationCost} or).` };
}

export async function joinClan(
  tx: Tx,
  content: Content,
  characterId: number,
  characterName: string,
  input: CharacterState,
  clanId: number,
  now: number,
): Promise<ClanResult> {
  if (await membership(tx, characterId)) throw new GameError('in_clan', 'Vous êtes déjà dans un clan : quittez-le d’abord.');
  const [target] = await tx.select().from(clans).where(eq(clans.id, clanId)).for('update');
  if (!target) throw new GameError('no_clan', 'Ce clan n’existe plus.');
  if ((await memberCount(tx, clanId)) >= content.settings.clan.maxMembers) throw new GameError('clan_full', 'Ce clan est complet.');
  await tx.insert(clanMembers).values({ characterId, clanId, rank: 'member' });
  await logLine(tx, clanId, now, `${characterName} rejoint le clan.`, content.settings.clan.logSize);
  const state = cloneState(input);
  state.clanBonus = clanBonusFor(target.level, content);
  return { state, log: `Vous rejoignez le clan « ${target.name} » : bonus de clan +${Math.round(state.clanBonus * 100)} %.` };
}

/** Quitter son clan. Le chef ne peut partir qu'après avoir transféré la direction, ou en dissolvant un clan où il est seul. */
export async function leaveClan(
  tx: Tx,
  content: Content,
  characterId: number,
  characterName: string,
  input: CharacterState,
  now: number,
): Promise<ClanResult> {
  const me = await membership(tx, characterId);
  if (!me) throw new GameError('no_clan', 'Vous n’êtes dans aucun clan.');
  const members = await memberCount(tx, me.clanId);
  const state = cloneState(input);
  const [clan] = await tx.select().from(clans).where(eq(clans.id, me.clanId)).for('update');
  if (me.rank === 'leader' && members > 1) {
    throw new GameError('leader_stays', 'Transférez d’abord la direction du clan à un autre membre.');
  }
  if (me.rank === 'leader') {
    // Seul dans le clan : on le dissout et on rend l'entrepôt et le fonds du projet.
    const items = await tx.select().from(clanItems).where(eq(clanItems.clanId, me.clanId));
    for (const i of items) addStack(state.inventory, i.itemId, i.qty);
    state.gold += clan?.fund ?? 0;
    await tx.delete(clans).where(eq(clans.id, me.clanId));
    state.clanBonus = content.settings.clan.townGuildBonus;
    return { state, log: `Vous dissolvez le clan « ${clan?.name} » : entrepôt et fonds vous reviennent.` };
  }
  await tx.delete(clanMembers).where(eq(clanMembers.characterId, characterId));
  await logLine(tx, me.clanId, now, `${characterName} quitte le clan.`, content.settings.clan.logSize);
  state.clanBonus = content.settings.clan.townGuildBonus;
  return { state, log: `Vous quittez le clan « ${clan?.name} ».` };
}

async function requireOfficer(tx: Tx, characterId: number) {
  const me = await membership(tx, characterId);
  if (!me) throw new GameError('no_clan', 'Vous n’êtes dans aucun clan.');
  if (me.rank === 'member') throw new GameError('not_officer', 'Réservé aux officiers et au chef.');
  return me;
}

export async function kickMember(
  tx: Tx,
  content: Content,
  characterId: number,
  state: CharacterState,
  targetId: number,
  now: number,
): Promise<ClanResult> {
  const me = await requireOfficer(tx, characterId);
  const target = await membership(tx, targetId);
  if (!target || target.clanId !== me.clanId) throw new GameError('not_member', 'Ce joueur n’est pas dans votre clan.');
  if (target.characterId === characterId) throw new GameError('self', 'Pour partir, quittez le clan.');
  if (target.rank === 'leader' || (target.rank === 'officer' && me.rank !== 'leader')) {
    throw new GameError('rank', 'Vous ne pouvez pas exclure un membre de rang égal ou supérieur.');
  }
  const [t] = await tx.select({ name: characters.name }).from(characters).where(eq(characters.id, targetId));
  await tx.delete(clanMembers).where(eq(clanMembers.characterId, targetId));
  await logLine(tx, me.clanId, now, `${t?.name} est exclu du clan.`, content.settings.clan.logSize);
  return { state, log: `Vous excluez ${t?.name} du clan.` };
}

export async function setRank(
  tx: Tx,
  content: Content,
  characterId: number,
  state: CharacterState,
  targetId: number,
  rank: ClanRank,
  now: number,
): Promise<ClanResult> {
  const me = await membership(tx, characterId);
  if (!me || me.rank !== 'leader') throw new GameError('not_leader', 'Seul le chef peut changer les rangs.');
  const target = await membership(tx, targetId);
  if (!target || target.clanId !== me.clanId) throw new GameError('not_member', 'Ce joueur n’est pas dans votre clan.');
  if (target.characterId === characterId) throw new GameError('self', 'Vous êtes déjà chef.');
  const [t] = await tx.select({ name: characters.name }).from(characters).where(eq(characters.id, targetId));
  await tx.update(clanMembers).set({ rank }).where(eq(clanMembers.characterId, targetId));
  if (rank === 'leader') {
    // Transfert : l'ancien chef devient officier.
    await tx.update(clanMembers).set({ rank: 'officer' }).where(eq(clanMembers.characterId, characterId));
  }
  const label = rank === 'leader' ? 'nouveau chef' : rank === 'officer' ? 'officier' : 'membre';
  await logLine(tx, me.clanId, now, `${t?.name} devient ${label}.`, content.settings.clan.logSize);
  return { state, log: `${t?.name} devient ${label}.` };
}

export async function depositItems(
  tx: Tx,
  content: Content,
  characterId: number,
  characterName: string,
  input: CharacterState,
  itemId: string,
  qty: number,
  now: number,
): Promise<ClanResult> {
  const me = await membership(tx, characterId);
  if (!me) throw new GameError('no_clan', 'Vous n’êtes dans aucun clan.');
  const item = content.items[itemId];
  if (!item) throw new GameError('unknown_item', 'Objet inconnu.');
  if (isDurable(item)) throw new GameError('durable', 'Les objets qui s’usent ne vont pas encore à l’entrepôt : chaque exemplaire garde son état.');
  if ((input.inventory[itemId] ?? 0) < qty) throw new GameError('missing', 'Vous n’en avez pas assez.');
  const stock = await tx.select().from(clanItems).where(eq(clanItems.clanId, me.clanId)).for('update');
  const existing = stock.find((s) => s.itemId === itemId);
  if (!existing && stock.length >= content.settings.clan.warehouseKinds) {
    throw new GameError('warehouse_full', 'L’entrepôt ne peut plus accueillir de nouveau type d’objet.');
  }
  if (existing) await tx.update(clanItems).set({ qty: existing.qty + qty }).where(and(eq(clanItems.clanId, me.clanId), eq(clanItems.itemId, itemId)));
  else await tx.insert(clanItems).values({ clanId: me.clanId, itemId, qty });
  await logLine(tx, me.clanId, now, `${characterName} dépose ${qty} × ${item.name}.`, content.settings.clan.logSize);
  const state = cloneState(input);
  addStack(state.inventory, itemId, -qty);
  return { state, log: `Dépôt à l’entrepôt du clan : ${qty} × ${item.name}.` };
}

/** Retrait : réservé aux officiers et au chef (les membres passent par eux ; les commandes internes viendront). */
export async function withdrawItems(
  tx: Tx,
  content: Content,
  characterId: number,
  characterName: string,
  input: CharacterState,
  itemId: string,
  qty: number,
  now: number,
): Promise<ClanResult> {
  const me = await requireOfficer(tx, characterId);
  const [row] = await tx
    .select()
    .from(clanItems)
    .where(and(eq(clanItems.clanId, me.clanId), eq(clanItems.itemId, itemId)))
    .for('update');
  if (!row || row.qty < qty) throw new GameError('missing', 'L’entrepôt n’en contient pas autant.');
  if (row.qty === qty) await tx.delete(clanItems).where(and(eq(clanItems.clanId, me.clanId), eq(clanItems.itemId, itemId)));
  else await tx.update(clanItems).set({ qty: row.qty - qty }).where(and(eq(clanItems.clanId, me.clanId), eq(clanItems.itemId, itemId)));
  const name = content.items[itemId]?.name ?? itemId;
  await logLine(tx, me.clanId, now, `${characterName} retire ${qty} × ${name}.`, content.settings.clan.logSize);
  const state = cloneState(input);
  addStack(state.inventory, itemId, qty);
  return { state, log: `Retrait de l’entrepôt du clan : ${qty} × ${name}.` };
}

/** Verser de l'or au projet « bonus de clan » ; au coût du niveau suivant, le clan monte et le surplus reste au fonds. */
export async function donateGold(
  tx: Tx,
  content: Content,
  characterId: number,
  characterName: string,
  input: CharacterState,
  amount: number,
  now: number,
): Promise<ClanResult> {
  const me = await membership(tx, characterId);
  if (!me) throw new GameError('no_clan', 'Vous n’êtes dans aucun clan.');
  if (input.gold < amount) throw new GameError('gold', 'Pas assez d’or.');
  const [clan] = await tx.select().from(clans).where(eq(clans.id, me.clanId)).for('update');
  if (!clan) throw new GameError('no_clan', 'Ce clan n’existe plus.');
  const { clan: rules } = content.settings;
  if (clan.level >= rules.maxLevel) throw new GameError('max_level', 'Le projet est terminé : le clan est au niveau maximal.');
  const active = await activeCount(tx, clan.id, now, content);
  let level = clan.level;
  let fund = clan.fund + amount;
  while (level < rules.maxLevel && fund >= clanLevelCost(level + 1, active, content)) {
    fund -= clanLevelCost(level + 1, active, content);
    level++;
  }
  if (level >= rules.maxLevel) fund = 0;
  await tx.update(clans).set({ level, fund }).where(eq(clans.id, clan.id));
  await logLine(tx, clan.id, now, `${characterName} verse ${amount} or au projet du clan.`, rules.logSize);
  if (level > clan.level) {
    await logLine(tx, clan.id, now, `Le clan passe au niveau ${level} : bonus de +${Math.round(clanBonusFor(level, content) * 100)} % pour tous.`, rules.logSize);
  }
  const state = cloneState(input);
  state.gold -= amount;
  state.clanBonus = clanBonusFor(level, content);
  return { state, log: `Vous versez ${amount} or au projet du clan${level > clan.level ? ` : le clan passe au niveau ${level} !` : '.'}` };
}

// --- Lecture ---

export async function listClans(db: Db, content: Content): Promise<ClanListItem[]> {
  const rows = await db.select().from(clans).orderBy(desc(clans.level), asc(clans.id)).limit(100);
  const counts = await db
    .select({ clanId: clanMembers.clanId, n: sql<number>`count(*)::int` })
    .from(clanMembers)
    .groupBy(clanMembers.clanId);
  return rows.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    members: counts.find((x) => x.clanId === c.id)?.n ?? 0,
    maxMembers: content.settings.clan.maxMembers,
    level: c.level,
    bonus: clanBonusFor(c.level, content),
  }));
}

export async function myClanView(db: Db, content: Content, characterId: number, now: number): Promise<ClanView | null> {
  const [me] = await db.select().from(clanMembers).where(eq(clanMembers.characterId, characterId));
  if (!me) return null;
  const [clan] = await db.select().from(clans).where(eq(clans.id, me.clanId));
  if (!clan) return null;
  const since = now - content.settings.clan.activeDays * DAY;
  const members = await db
    .select({ id: characters.id, name: characters.name, rank: clanMembers.rank, lastSeenAt: characters.lastSeenAt })
    .from(clanMembers)
    .innerJoin(characters, eq(characters.id, clanMembers.characterId))
    .where(eq(clanMembers.clanId, clan.id));
  const order: Record<ClanRank, number> = { leader: 0, officer: 1, member: 2 };
  const memberViews: ClanMemberView[] = members
    .map((m) => ({ id: m.id, name: m.name, rank: m.rank, active: m.lastSeenAt.getTime() >= since, lastSeenAt: m.lastSeenAt.getTime() }))
    .sort((a, b) => order[a.rank] - order[b.rank] || a.name.localeCompare(b.name));
  const items = await db.select().from(clanItems).where(eq(clanItems.clanId, clan.id));
  const log = await db.select().from(clanLog).where(eq(clanLog.clanId, clan.id)).orderBy(desc(clanLog.id)).limit(content.settings.clan.logSize);
  const active = memberViews.filter((m) => m.active).length;
  return {
    id: clan.id,
    name: clan.name,
    description: clan.description,
    level: clan.level,
    bonus: clanBonusFor(clan.level, content),
    myRank: me.rank,
    members: memberViews,
    maxMembers: content.settings.clan.maxMembers,
    warehouse: Object.fromEntries(items.map((i) => [i.itemId, i.qty])),
    warehouseKinds: content.settings.clan.warehouseKinds,
    fund: clan.fund,
    nextCost: clan.level >= content.settings.clan.maxLevel ? null : clanLevelCost(clan.level + 1, active, content),
    activeMembers: active,
    log: log.map((l) => ({ id: l.id, at: l.at.getTime(), text: l.text })),
  };
}

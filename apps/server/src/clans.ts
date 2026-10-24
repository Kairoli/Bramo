import { and, asc, desc, eq, gte, sql } from 'drizzle-orm';
import {
  type BuildingLevels,
  type CharacterState,
  type ClanBuildingView,
  type ClanListItem,
  type ClanMemberView,
  type ClanRank,
  type ClanView,
  type Content,
  GameError,
  addStack,
  buildingNeeds,
  clanBonuses,
  cloneState,
  levelForXp,
  memberBonuses,
  renownRank,
  workAt,
  worksNeeds,
} from '@bramo/shared';
import type { Db, Tx } from './db/index.js';
import { characters, clanBuildings, clanLog, clanMembers, clanProgress, clans } from './db/schema.js';
import type { NewServerEvent } from './town.js';

export interface ClanResult {
  state: CharacterState;
  log: string;
  serverEvents?: NewServerEvent[];
}

const DAY = 86_400_000;

async function membership(tx: Tx, characterId: number) {
  const [row] = await tx.select().from(clanMembers).where(eq(clanMembers.characterId, characterId)).for('update');
  return row;
}

export async function logLine(tx: Tx, clanId: number, at: number, text: string, keep: number) {
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

/** Niveau de chaque bâtiment construit par un clan. */
export async function buildingLevels(tx: Tx | Db, clanId: number): Promise<BuildingLevels> {
  const rows = await tx.select().from(clanBuildings).where(eq(clanBuildings.clanId, clanId));
  return Object.fromEntries(rows.map((r) => [r.buildingId, r.level]));
}

/** Bonus de production par métier d'un personnage : ceux de son clan, sinon ceux de la Guilde du bourg. */
export async function bonusesOfCharacter(tx: Tx | Db, characterId: number, content: Content): Promise<Record<string, number>> {
  const [me] = await tx.select().from(clanMembers).where(eq(clanMembers.characterId, characterId));
  return memberBonuses(me ? await buildingLevels(tx, me.clanId) : null, content);
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
  state.clanBonuses = memberBonuses({}, content);
  return {
    state,
    log: `Vous fondez le clan « ${name} » (−${clan.creationCost} or).`,
    serverEvents: [{ kind: 'clan', text: `${characterName} fonde le clan « ${name} ».` }],
  };
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
  state.clanBonuses = memberBonuses(await buildingLevels(tx, clanId), content);
  return { state, log: `Vous rejoignez le clan « ${target.name} ».` };
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
  state.clanBonuses = memberBonuses(null, content);
  if (me.rank === 'leader') {
    // Seul dans le clan : on le dissout (les bâtiments et les apports en cours disparaissent avec lui).
    await tx.delete(clans).where(eq(clans.id, me.clanId));
    return { state, log: `Vous dissolvez le clan « ${clan?.name} ».` };
  }
  await tx.delete(clanMembers).where(eq(clanMembers.characterId, characterId));
  await logLine(tx, me.clanId, now, `${characterName} quitte le clan.`, content.settings.clan.logSize);
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

/**
 * Apport d'un membre à la construction du prochain niveau d'un bâtiment (de l'or, ou un des objets demandés).
 * L'apport est plafonné à ce qu'il manque ; quand tout est réuni, le bâtiment monte d'un niveau pour tous.
 */
export async function contribute(
  tx: Tx,
  content: Content,
  characterId: number,
  characterName: string,
  input: CharacterState,
  p: { buildingId: string; what: string; qty: number },
  now: number,
): Promise<ClanResult> {
  const me = await membership(tx, characterId);
  if (!me) throw new GameError('no_clan', 'Vous n’êtes dans aucun clan.');
  const building = content.buildings[p.buildingId];
  if (!building) throw new GameError('unknown_building', 'Bâtiment inconnu.');
  const [clan] = await tx.select().from(clans).where(eq(clans.id, me.clanId)).for('update');
  if (!clan) throw new GameError('no_clan', 'Ce clan n’existe plus.');
  const [built] = await tx.select().from(clanBuildings).where(and(eq(clanBuildings.clanId, clan.id), eq(clanBuildings.buildingId, p.buildingId)));
  const level = built?.level ?? 0;
  if (level >= building.maxLevel) throw new GameError('max_level', 'Ce bâtiment est au niveau maximal.');
  const needs = buildingNeeds(p.buildingId, level + 1, await activeCount(tx, clan.id, now, content), content);
  const required = new Map<string, number>([['gold', needs.gold], ...needs.items.map((i) => [i.item, i.qty] as [string, number])]);
  if (!required.has(p.what) || (required.get(p.what) ?? 0) <= 0) throw new GameError('not_needed', 'Ce bâtiment ne demande pas cela.');
  const rows = await tx.select().from(clanProgress).where(and(eq(clanProgress.clanId, clan.id), eq(clanProgress.buildingId, p.buildingId))).for('update');
  const have = new Map(rows.map((r) => [r.what, r.qty]));
  const remaining = required.get(p.what)! - (have.get(p.what) ?? 0);
  if (remaining <= 0) throw new GameError('complete', 'Cet apport est déjà complet pour ce niveau.');
  const give = Math.min(p.qty, remaining);
  const state = cloneState(input);
  if (p.what === 'gold') {
    if (state.gold < give) throw new GameError('gold', 'Pas assez d’or.');
    state.gold -= give;
  } else {
    if ((state.inventory[p.what] ?? 0) < give) throw new GameError('missing', 'Vous n’en avez pas assez.');
    addStack(state.inventory, p.what, -give);
  }
  have.set(p.what, (have.get(p.what) ?? 0) + give);
  await tx
    .insert(clanProgress)
    .values({ clanId: clan.id, buildingId: p.buildingId, what: p.what, qty: have.get(p.what)! })
    .onConflictDoUpdate({ target: [clanProgress.clanId, clanProgress.buildingId, clanProgress.what], set: { qty: have.get(p.what)! } });
  const label = p.what === 'gold' ? `${give} or` : `${give} × ${content.items[p.what]?.name ?? p.what}`;
  await logLine(tx, clan.id, now, `${characterName} apporte ${label} : ${building.name}.`, content.settings.clan.logSize);

  const done = [...required].every(([what, need]) => (have.get(what) ?? 0) >= need);
  if (!done) return { state, log: `Apport au clan : ${label} (${building.name}).` };
  await tx
    .insert(clanBuildings)
    .values({ clanId: clan.id, buildingId: p.buildingId, level: level + 1 })
    .onConflictDoUpdate({ target: [clanBuildings.clanId, clanBuildings.buildingId], set: { level: level + 1 } });
  await tx.delete(clanProgress).where(and(eq(clanProgress.clanId, clan.id), eq(clanProgress.buildingId, p.buildingId)));
  await logLine(tx, clan.id, now, `${building.name} passe au niveau ${level + 1} : +${Math.round(building.boost.perLevel * 100)} % de production${building.boost.professions.includes('all') ? '' : ' dans ses métiers'}.`, content.settings.clan.logSize);
  state.clanBonuses = memberBonuses(await buildingLevels(tx, clan.id), content);
  const rank = await addRenown(tx, clan.id, (content.settings.clan.renown?.buildingLevel ?? 0) * (level + 1), now, content, `${building.name} niveau ${level + 1}`);
  return {
    state,
    log: `Apport au clan : ${label}. ${building.name} passe au niveau ${level + 1} !`,
    serverEvents: [{ kind: 'clan', text: `Le clan « ${clan.name} » achève ${building.name}, niveau ${level + 1}.` }, ...(rank ? [rank] : [])],
  };
}

// --- Lecture ---

export async function listClans(db: Db, content: Content): Promise<ClanListItem[]> {
  const rows = await db.select().from(clans).orderBy(asc(clans.id)).limit(100);
  const counts = await db
    .select({ clanId: clanMembers.clanId, n: sql<number>`count(*)::int` })
    .from(clanMembers)
    .groupBy(clanMembers.clanId);
  const levels = await db.select().from(clanBuildings);
  return rows
    .map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      members: counts.find((x) => x.clanId === c.id)?.n ?? 0,
      maxMembers: content.settings.clan.maxMembers,
      buildingLevels: levels.filter((l) => l.clanId === c.id).reduce((s, l) => s + l.level, 0),
    }))
    .sort((a, b) => b.buildingLevels - a.buildingLevels || a.id - b.id);
}

export async function myClanView(db: Db, content: Content, characterId: number, now: number): Promise<ClanView | null> {
  const [me] = await db.select().from(clanMembers).where(eq(clanMembers.characterId, characterId));
  if (!me) return null;
  const [clan] = await db.select().from(clans).where(eq(clans.id, me.clanId));
  if (!clan) return null;
  const since = now - content.settings.clan.activeDays * DAY;
  const members = await db
    .select({ id: characters.id, name: characters.name, rank: clanMembers.rank, lastSeenAt: characters.lastSeenAt, classId: characters.classId, outfit: characters.outfit, combat: characters.combat, avatar: characters.avatar })
    .from(clanMembers)
    .innerJoin(characters, eq(characters.id, clanMembers.characterId))
    .where(eq(clanMembers.clanId, clan.id));
  const order: Record<ClanRank, number> = { leader: 0, officer: 1, member: 2 };
  const memberViews: ClanMemberView[] = members
    .map((m) => ({
      id: m.id,
      name: m.name,
      avatar: m.avatar,
      rank: m.rank,
      active: m.lastSeenAt.getTime() >= since,
      lastSeenAt: m.lastSeenAt.getTime(),
      classId: m.classId,
      outfit: m.outfit,
      classLevel: m.classId ? levelForXp(m.combat?.xp?.[m.classId] ?? 0, content.xpTable) : 1,
    }))
    .sort((a, b) => order[a.rank] - order[b.rank] || a.name.localeCompare(b.name));
  const active = memberViews.filter((m) => m.active).length;
  const levels = await buildingLevels(db, clan.id);
  const progress = await db.select().from(clanProgress).where(eq(clanProgress.clanId, clan.id));
  const buildings: ClanBuildingView[] = Object.values(content.buildings).map((b) => {
    const level = levels[b.id] ?? 0;
    if (level >= b.maxLevel) return { id: b.id, level, maxLevel: b.maxLevel, next: null };
    const needs = buildingNeeds(b.id, level + 1, active, content);
    const have = (what: string) => progress.find((p) => p.buildingId === b.id && p.what === what)?.qty ?? 0;
    return {
      id: b.id,
      level,
      maxLevel: b.maxLevel,
      next: {
        gold: { need: needs.gold, have: have('gold') },
        items: needs.items.map((i) => ({ item: i.item, need: i.qty, have: have(i.item) })),
      },
    };
  });
  const log = await db.select().from(clanLog).where(eq(clanLog.clanId, clan.id)).orderBy(desc(clanLog.id)).limit(content.settings.clan.logSize);
  return {
    id: clan.id,
    name: clan.name,
    description: clan.description,
    bonuses: clanBonuses(levels, content),
    myRank: me.rank,
    members: memberViews,
    maxMembers: content.settings.clan.maxMembers,
    buildings,
    activeMembers: active,
    log: log.map((l) => ({ id: l.id, at: l.at.getTime(), text: l.text })),
    renown: { value: clan.renown, ...renownRank(clan.renown, content) },
    works: worksView(clan, progress, active, me.rank, content, now),
  };
}

/**
 * Renom : ajouté au clan, jamais retiré. Un rang franchi s'écrit au journal du clan et s'annonce au fil du serveur.
 * Renvoie l'annonce éventuelle (le fil s'écrit avec les autres annonces de la requête).
 */
export async function addRenown(tx: Tx, clanId: number, amount: number, now: number, content: Content, why: string): Promise<NewServerEvent | null> {
  if (amount <= 0 || !content.settings.clan.renown) return null;
  const [clan] = await tx.select().from(clans).where(eq(clans.id, clanId)).for('update');
  if (!clan) return null;
  const before = renownRank(clan.renown, content).rank;
  const value = clan.renown + amount;
  await tx.update(clans).set({ renown: value }).where(eq(clans.id, clanId));
  const after = renownRank(value, content).rank;
  if (after === before) return null;
  await logLine(tx, clanId, now, `Le clan devient « ${after} » (${value} de Renom, ${why}).`, content.settings.clan.logSize);
  return { kind: 'clan', text: `Le clan « ${clan.name} » devient ${after}.` };
}

/** Le clan d'un personnage, ou null. */
export async function clanOf(tx: Tx, characterId: number): Promise<number | null> {
  const [m] = await tx.select().from(clanMembers).where(eq(clanMembers.characterId, characterId));
  return m?.clanId ?? null;
}

// --- Ouvrages du clan et Banquet (data/clan_works.yaml) ---

/** Les apports des ouvrages se rangent dans clan_progress sous cet identifiant (aucun bâtiment ne s'appelle ainsi). */
const WORKS = '__works';

/** Banquet en cours du clan d'un personnage (ce qu'il met dans `CharacterState.banquet`), ou null. */
export async function banquetOfCharacter(tx: Tx | Db, characterId: number, content: Content): Promise<{ from: number; until: number; bonus: number } | null> {
  if (!content.clanWorks) return null;
  const [row] = await tx
    .select({ from: clans.banquetFrom, until: clans.banquetUntil })
    .from(clanMembers)
    .innerJoin(clans, eq(clans.id, clanMembers.clanId))
    .where(eq(clanMembers.characterId, characterId));
  if (!row?.from || !row.until) return null;
  return { from: row.from.getTime(), until: row.until.getTime(), bonus: content.clanWorks.banquet.xpBonus };
}

/**
 * Apport d'un membre à l'ouvrage en cours (de l'or, ou un des objets demandés), plafonné à ce qu'il manque. Quand tout
 * est réuni, l'ouvrage est achevé : le niveau des ouvrages monte, le clan gagne un Banquet (au plus `maxStock` en
 * réserve) et du Renom, et l'ouvrage suivant commence.
 */
export async function contributeWorks(
  tx: Tx,
  content: Content,
  characterId: number,
  characterName: string,
  input: CharacterState,
  p: { what: string; qty: number },
  now: number,
): Promise<ClanResult> {
  const cw = content.clanWorks;
  if (!cw) throw new GameError('no_works', 'Les ouvrages ne sont pas encore là.');
  const me = await membership(tx, characterId);
  if (!me) throw new GameError('no_clan', 'Vous n’êtes dans aucun clan.');
  const [clan] = await tx.select().from(clans).where(eq(clans.id, me.clanId)).for('update');
  if (!clan) throw new GameError('no_clan', 'Ce clan n’existe plus.');
  const level = clan.worksLevel + 1;
  const work = workAt(level, content)!;
  const needs = worksNeeds(level, await activeCount(tx, clan.id, now, content), content);
  const required = new Map<string, number>([['gold', needs.gold], ...needs.items.map((i) => [i.item, i.qty] as [string, number])]);
  if (!required.has(p.what) || (required.get(p.what) ?? 0) <= 0) throw new GameError('not_needed', 'Cet ouvrage ne demande pas cela.');
  const rows = await tx.select().from(clanProgress).where(and(eq(clanProgress.clanId, clan.id), eq(clanProgress.buildingId, WORKS))).for('update');
  const have = new Map(rows.map((r) => [r.what, r.qty]));
  const remaining = required.get(p.what)! - (have.get(p.what) ?? 0);
  if (remaining <= 0) throw new GameError('complete', 'Cet apport est déjà complet pour cet ouvrage.');
  const give = Math.min(p.qty, remaining);
  const state = cloneState(input);
  if (p.what === 'gold') {
    if (state.gold < give) throw new GameError('gold', 'Pas assez d’or.');
    state.gold -= give;
  } else {
    if ((state.inventory[p.what] ?? 0) < give) throw new GameError('missing', 'Vous n’en avez pas assez.');
    addStack(state.inventory, p.what, -give);
  }
  have.set(p.what, (have.get(p.what) ?? 0) + give);
  await tx
    .insert(clanProgress)
    .values({ clanId: clan.id, buildingId: WORKS, what: p.what, qty: have.get(p.what)! })
    .onConflictDoUpdate({ target: [clanProgress.clanId, clanProgress.buildingId, clanProgress.what], set: { qty: have.get(p.what)! } });
  const label = p.what === 'gold' ? `${give} or` : `${give} × ${content.items[p.what]?.name ?? p.what}`;
  await logLine(tx, clan.id, now, `${characterName} apporte ${label} : ${work.name}.`, content.settings.clan.logSize);

  const done = [...required].every(([what, need]) => (have.get(what) ?? 0) >= need);
  if (!done) return { state, log: `Apport au clan : ${label} (${work.name}).` };
  const banquets = Math.min(cw.banquet.maxStock, clan.banquets + 1);
  await tx.update(clans).set({ worksLevel: level, banquets }).where(eq(clans.id, clan.id));
  await tx.delete(clanProgress).where(and(eq(clanProgress.clanId, clan.id), eq(clanProgress.buildingId, WORKS)));
  await logLine(tx, clan.id, now, `${work.name} est achevé (ouvrage n° ${level}) : un Banquet de plus pour le clan.`, content.settings.clan.logSize);
  const rank = await addRenown(tx, clan.id, (content.settings.clan.renown?.buildingLevel ?? 0) * 3, now, content, work.name);
  return {
    state,
    log: `Apport au clan : ${label}. ${work.name} est achevé : le clan gagne un Banquet !`,
    serverEvents: [{ kind: 'clan', text: `Le clan « ${clan.name} » achève ${work.name}.` }, ...(rank ? [rank] : [])],
  };
}

/** Le chef ou un officier lance un Banquet : `hours` de +`xpBonus` d'XP pour tous les membres. Un seul à la fois. */
export async function launchBanquet(tx: Tx, content: Content, characterId: number, characterName: string, input: CharacterState, now: number): Promise<ClanResult> {
  const cw = content.clanWorks;
  if (!cw) throw new GameError('no_works', 'Les ouvrages ne sont pas encore là.');
  const me = await membership(tx, characterId);
  if (!me) throw new GameError('no_clan', 'Vous n’êtes dans aucun clan.');
  if (me.rank === 'member') throw new GameError('rank', 'Seuls le chef et les officiers lancent un Banquet.');
  const [clan] = await tx.select().from(clans).where(eq(clans.id, me.clanId)).for('update');
  if (!clan) throw new GameError('no_clan', 'Ce clan n’existe plus.');
  if (clan.banquetUntil && clan.banquetUntil.getTime() > now) throw new GameError('banquet_on', 'Un Banquet est déjà en cours.');
  if (clan.banquets <= 0) throw new GameError('no_banquet', 'Le clan n’a pas de Banquet en réserve : achevez un ouvrage.');
  const until = now + cw.banquet.hours * 3_600_000;
  await tx.update(clans).set({ banquets: clan.banquets - 1, banquetFrom: new Date(now), banquetUntil: new Date(until) }).where(eq(clans.id, clan.id));
  const bonus = Math.round(cw.banquet.xpBonus * 100);
  await logLine(tx, clan.id, now, `${characterName} lance un Banquet : +${bonus} % d’XP pour tous pendant ${cw.banquet.hours} h.`, content.settings.clan.logSize);
  const state = cloneState(input);
  state.banquet = { from: now, until, bonus: cw.banquet.xpBonus };
  return {
    state,
    log: `Banquet du clan : +${bonus} % d’XP (métiers et combat) pour tous les membres pendant ${cw.banquet.hours} h.`,
    serverEvents: [{ kind: 'clan', text: `Le clan « ${clan.name} » ouvre un Banquet.` }],
  };
}

/** Ce que la salle du clan montre des ouvrages. */
function worksView(clan: typeof clans.$inferSelect, progress: (typeof clanProgress.$inferSelect)[], active: number, myRank: ClanRank, content: Content, now: number): ClanView['works'] {
  const cw = content.clanWorks;
  if (!cw) return null;
  const level = clan.worksLevel + 1;
  const work = workAt(level, content)!;
  const needs = worksNeeds(level, active, content);
  const have = (what: string) => progress.find((p) => p.buildingId === WORKS && p.what === what)?.qty ?? 0;
  const on = !!clan.banquetFrom && !!clan.banquetUntil && clan.banquetUntil.getTime() > now;
  return {
    level: clan.worksLevel,
    next: { id: work.id, name: work.name, description: work.description, gold: { need: needs.gold, have: have('gold') }, items: needs.items.map((i) => ({ item: i.item, need: i.qty, have: have(i.item) })) },
    banquets: clan.banquets,
    maxBanquets: cw.banquet.maxStock,
    banquet: on ? { from: clan.banquetFrom!.getTime(), until: clan.banquetUntil!.getTime(), bonus: cw.banquet.xpBonus } : null,
    hours: cw.banquet.hours,
    bonus: cw.banquet.xpBonus,
    canLaunch: myRank !== 'member' && clan.banquets > 0 && !on,
  };
}

import { and, asc, eq, isNotNull, isNull } from 'drizzle-orm';
import {
  type CharacterState,
  type Content,
  type RepairRequestView,
  GameError,
  addStack,
  cloneState,
  copiesWear,
  giveCopy,
  isDurable,
  netProceeds,
  repairProblem,
  spendRepairMaterials,
  takeCopy,
} from '@bramo/shared';
import type { Db, Tx } from './db/index.js';
import { characters, repairRequests } from './db/schema.js';

export interface RepairResult {
  state: CharacterState;
  log: string;
}

/** Confier un outil usé à un artisan : l'outil et l'or de la réparation sont mis de côté jusqu'à ce qu'un artisan le répare. */
export async function requestRepair(
  tx: Tx,
  content: Content,
  characterId: number,
  input: CharacterState,
  p: { itemId: string; copy: number; fee: number },
): Promise<RepairResult> {
  const item = content.items[p.itemId];
  if (!item?.repair || !isDurable(item)) throw new GameError('not_repairable', 'Cet objet ne se fait pas réparer par un artisan.');
  if (!Number.isInteger(p.fee) || p.fee < 1 || p.fee > content.settings.market.maxPrice) {
    throw new GameError('price', `Rémunération entre 1 et ${content.settings.market.maxPrice} or.`);
  }
  const copies = copiesWear(input, p.itemId);
  const wear = copies[p.copy];
  if (wear === undefined) throw new GameError('missing', 'Vous n’avez pas cet exemplaire.');
  if (wear <= 0) throw new GameError('not_worn', 'Cet exemplaire est comme neuf.');
  if (input.gold < p.fee) throw new GameError('gold', 'Pas assez d’or.');
  const open = await tx
    .select()
    .from(repairRequests)
    .where(and(eq(repairRequests.characterId, characterId), isNull(repairRequests.doneAt)));
  if (open.length >= content.settings.market.maxOpenOrders) {
    throw new GameError('too_many_orders', `Vous ne pouvez pas avoir plus de ${content.settings.market.maxOpenOrders} demandes ouvertes.`);
  }
  const state = cloneState(input);
  takeCopy(state, p.itemId, p.copy);
  addStack(state.inventory, p.itemId, -1);
  state.gold -= p.fee;
  await tx.insert(repairRequests).values({ characterId, itemId: p.itemId, wear, fee: p.fee });
  return { state, log: `Demande de réparation : ${item.name} contre ${p.fee} or. Un artisan peut la prendre.` };
}

/** Réparer l'outil d'un autre joueur : l'artisan fournit les matériaux et touche la rémunération (moins la taxe) et un peu d'XP. */
export async function takeRepair(
  tx: Tx,
  content: Content,
  characterId: number,
  input: CharacterState,
  requestId: number,
  now: number,
): Promise<RepairResult> {
  const [row] = await tx.select().from(repairRequests).where(eq(repairRequests.id, requestId)).for('update');
  if (!row || row.doneAt) throw new GameError('gone', 'Cette demande n’existe plus.');
  if (row.characterId === characterId) throw new GameError('own_order', 'C’est votre propre demande : réparez-la vous-même.');
  const problem = repairProblem(input, row.itemId, content);
  if (problem) throw new GameError('repair', problem);
  const state = cloneState(input);
  spendRepairMaterials(state, row.itemId, content);
  const net = netProceeds(row.fee, content);
  state.gold += net;
  await tx.update(repairRequests).set({ doneAt: new Date(now) }).where(eq(repairRequests.id, row.id));
  return { state, log: `Réparation faite : ${content.items[row.itemId]?.name ?? row.itemId} (+${net} or après taxe).` };
}

/** Reprendre sa demande tant qu'aucun artisan ne l'a prise : l'outil (avec son usure) et l'or reviennent. */
export async function cancelRepair(
  tx: Tx,
  content: Content,
  characterId: number,
  input: CharacterState,
  requestId: number,
): Promise<RepairResult> {
  const [row] = await tx
    .select()
    .from(repairRequests)
    .where(and(eq(repairRequests.id, requestId), eq(repairRequests.characterId, characterId)))
    .for('update');
  if (!row || row.doneAt) throw new GameError('gone', 'Cette demande n’existe plus.');
  const state = cloneState(input);
  addStack(state.inventory, row.itemId, 1);
  giveCopy(state, row.itemId, row.wear);
  state.gold += row.fee;
  await tx.delete(repairRequests).where(eq(repairRequests.id, row.id));
  return { state, log: `Demande annulée : ${content.items[row.itemId]?.name ?? row.itemId}.` };
}

/** Au passage du propriétaire : les outils réparés par un artisan lui sont rendus, comme neufs. */
export async function claimRepairs(
  tx: Tx,
  characterId: number,
  input: CharacterState,
  content: Content,
): Promise<{ state: CharacterState; lines: string[] }> {
  const rows = await tx
    .select()
    .from(repairRequests)
    .where(and(eq(repairRequests.characterId, characterId), isNotNull(repairRequests.doneAt)))
    .for('update');
  if (!rows.length) return { state: input, lines: [] };
  const state = cloneState(input);
  const lines: string[] = [];
  for (const r of rows) {
    addStack(state.inventory, r.itemId, 1);
    lines.push(`Un artisan a réparé votre ${content.items[r.itemId]?.name ?? r.itemId} : il est comme neuf.`);
    await tx.delete(repairRequests).where(eq(repairRequests.id, r.id));
  }
  return { state, lines };
}

export async function openRepairs(db: Db, characterId: number): Promise<RepairRequestView[]> {
  const rows = await db
    .select({ r: repairRequests, name: characters.name })
    .from(repairRequests)
    .innerJoin(characters, eq(characters.id, repairRequests.characterId))
    .where(isNull(repairRequests.doneAt))
    .orderBy(asc(repairRequests.id));
  return rows.map(({ r, name }) => ({
    id: r.id,
    itemId: r.itemId,
    wear: r.wear,
    fee: r.fee,
    ownerName: name,
    mine: r.characterId === characterId,
  }));
}

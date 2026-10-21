import { and, asc, eq, gt, ne, or } from 'drizzle-orm';
import {
  type CharacterState,
  type Content,
  type MarketItemSummary,
  type MarketOrder,
  type MarketOrderView,
  type MyOrderView,
  GameError,
  addStack,
  cloneState,
  copiesWear,
  giveCopy,
  isDurable,
  match,
  netProceeds,
  takeCopy,
  applyPrime,
  primeFor,
  validateOrder,
} from '@bramo/shared';
import type { Db, Tx } from './db/index.js';
import { characters, marketOrders } from './db/schema.js';

type Row = typeof marketOrders.$inferSelect;

const toOrder = (r: Row): MarketOrder => ({
  id: r.id,
  ownerId: r.characterId,
  side: r.side,
  itemId: r.itemId,
  qty: r.qty,
  price: r.price,
  wear: r.wear,
});

export interface MarketResult {
  state: CharacterState;
  log: string;
}

/** Au passage du propriétaire : verse l'or des ventes conclues et remet les objets des achats conclus. */
export async function claimOrders(
  tx: Tx,
  characterId: number,
  input: CharacterState,
  content: Content,
): Promise<{ state: CharacterState; lines: string[] }> {
  const rows = await tx
    .select()
    .from(marketOrders)
    .where(
      and(
        eq(marketOrders.characterId, characterId),
        or(gt(marketOrders.collectGold, 0), gt(marketOrders.collectQty, 0), eq(marketOrders.qty, 0)),
      ),
    )
    .for('update');
  if (!rows.length) return { state: input, lines: [] };
  const state = cloneState(input);
  const lines: string[] = [];
  const name = (id: string) => content.items[id]?.name ?? id;
  for (const r of rows) {
    if (r.collectGold > 0) {
      state.gold += r.collectGold;
      lines.push(
        `Vente conclue : ${name(r.itemId)}, +${r.collectGold} or (taxe de ${Math.round(content.settings.market.taxShare * 100)} % déduite).`,
      );
    }
    if (r.collectQty > 0) {
      addStack(state.inventory, r.itemId, r.collectQty);
      lines.push(`Achat conclu : ${r.collectQty} × ${name(r.itemId)}.`);
    }
    if (r.qty === 0) await tx.delete(marketOrders).where(eq(marketOrders.id, r.id));
    else await tx.update(marketOrders).set({ collectGold: 0, collectQty: 0 }).where(eq(marketOrders.id, r.id));
  }
  return { state, lines };
}

/** Ordre limite : s'exécute tout de suite contre les ordres en face qui conviennent, le reste attend dans le livre. */
export async function placeOrder(
  tx: Tx,
  content: Content,
  characterId: number,
  input: CharacterState,
  p: { side: 'buy' | 'sell'; itemId: string; qty: number; price: number; copy?: number },
  now: number,
): Promise<MarketResult> {
  validateOrder(content, p.side, p.itemId, p.qty, p.price);
  const name = content.items[p.itemId]!.name;
  const mine = await tx
    .select()
    .from(marketOrders)
    .where(and(eq(marketOrders.characterId, characterId), gt(marketOrders.qty, 0)));
  if (mine.length >= content.settings.market.maxOpenOrders) {
    throw new GameError('too_many_orders', `Vous ne pouvez pas avoir plus de ${content.settings.market.maxOpenOrders} ordres ouverts.`);
  }
  const crossesOwn = mine.some(
    (o) => o.itemId === p.itemId && o.side !== p.side && (p.side === 'buy' ? o.price <= p.price : o.price >= p.price),
  );
  if (crossesOwn) throw new GameError('self_cross', 'Vous avez déjà un ordre opposé à ce prix : annulez-le d’abord.');

  const state = cloneState(input);
  let wear = 0;
  if (p.side === 'sell') {
    if (isDurable(content.items[p.itemId])) {
      const copies = copiesWear(state, p.itemId);
      const index = p.copy ?? 0;
      if (index >= copies.length) throw new GameError('missing', 'Vous n’avez pas cet exemplaire.');
      wear = takeCopy(state, p.itemId, index);
      addStack(state.inventory, p.itemId, -1);
    } else {
      if ((state.inventory[p.itemId] ?? 0) < p.qty) throw new GameError('missing', 'Vous n’en avez pas assez.');
      addStack(state.inventory, p.itemId, -p.qty);
    }
  } else if (state.gold < p.price * p.qty) {
    throw new GameError('gold', 'Pas assez d’or pour cet ordre (le prix limite est mis de côté).');
  }

  const opposite = p.side === 'buy' ? 'sell' : 'buy';
  const resting = await tx
    .select()
    .from(marketOrders)
    .where(
      and(
        eq(marketOrders.itemId, p.itemId),
        eq(marketOrders.side, opposite),
        gt(marketOrders.qty, 0),
        ne(marketOrders.characterId, characterId),
      ),
    )
    .orderBy(asc(marketOrders.id))
    .for('update');
  const fills = match(resting.map(toOrder), p.side, p.itemId, p.qty, p.price, characterId);

  let filled = 0;
  let primed = 0;
  let money = 0;
  for (const f of fills) {
    const gross = f.qty * f.order.price;
    const row = resting.find((r) => r.id === f.order.id)!;
    filled += f.qty;
    if (p.side === 'sell') {
      // Prime de commande : livrer un ordre d'achat d'un objet qu'on sait fabriquer, payé au moins sa valeur de référence.
      if (f.order.price >= content.items[p.itemId]!.value) primed += f.qty;
      money += netProceeds(gross, content);
      await tx
        .update(marketOrders)
        .set({ qty: row.qty - f.qty, collectQty: row.collectQty + f.qty })
        .where(eq(marketOrders.id, row.id));
    } else {
      money -= gross;
      addStack(state.inventory, p.itemId, f.qty);
      await tx
        .update(marketOrders)
        .set({ qty: row.qty - f.qty, collectGold: row.collectGold + netProceeds(gross, content) })
        .where(eq(marketOrders.id, row.id));
    }
  }
  state.gold += money;
  let primeLog = '';
  if (primed > 0) {
    const prime = primeFor(state, p.itemId, primed, now, content);
    if (prime) {
      applyPrime(state, prime, now, content);
      primeLog = ` Prime de commande : +${Math.round(prime.xp * 10) / 10} XP.`;
    }
  }

  const rest = p.qty - filled;
  if (rest > 0) {
    if (p.side === 'buy') state.gold -= rest * p.price;
    await tx.insert(marketOrders).values({ characterId, side: p.side, itemId: p.itemId, qty: rest, price: p.price, wear });
  }
  const verb = p.side === 'buy' ? 'achat' : 'vente';
  const done = filled ? ` ${filled} échangé(s) tout de suite (${money >= 0 ? '+' : '−'}${Math.abs(money)} or).` : '';
  return {
    state,
    log: `Ordre d’${verb} : ${p.qty} × ${name} à ${p.price} or.${done}${rest > 0 ? ` ${rest} en attente.` : ''}${primeLog}`,
  };
}

/** Acheter directement à un ordre de vente précis (indispensable pour les objets durables : l'état de l'exemplaire compte). */
export async function fillOrder(
  tx: Tx,
  content: Content,
  characterId: number,
  input: CharacterState,
  orderId: number,
  qty: number,
): Promise<MarketResult> {
  const [row] = await tx.select().from(marketOrders).where(eq(marketOrders.id, orderId)).for('update');
  if (!row || row.side !== 'sell' || row.qty <= 0) throw new GameError('gone', 'Cette offre n’existe plus.');
  if (row.characterId === characterId) throw new GameError('own_order', 'C’est votre propre offre.');
  if (!Number.isInteger(qty) || qty < 1 || qty > row.qty) throw new GameError('quantity', `Quantité entre 1 et ${row.qty}.`);
  const item = content.items[row.itemId]!;
  const gross = qty * row.price;
  if (input.gold < gross) throw new GameError('gold', 'Pas assez d’or.');
  const state = cloneState(input);
  state.gold -= gross;
  addStack(state.inventory, row.itemId, qty);
  if (isDurable(item)) giveCopy(state, row.itemId, row.wear);
  await tx
    .update(marketOrders)
    .set({ qty: row.qty - qty, collectGold: row.collectGold + netProceeds(gross, content) })
    .where(eq(marketOrders.id, row.id));
  return { state, log: `Achat : ${qty} × ${item.name} à ${row.price} or (−${gross} or).` };
}

/** Annuler un ordre : l'or ou les objets mis de côté reviennent, avec ce qui était déjà conclu. */
export async function cancelOrder(
  tx: Tx,
  content: Content,
  characterId: number,
  input: CharacterState,
  orderId: number,
): Promise<MarketResult> {
  const [row] = await tx
    .select()
    .from(marketOrders)
    .where(and(eq(marketOrders.id, orderId), eq(marketOrders.characterId, characterId)))
    .for('update');
  if (!row || row.qty <= 0) throw new GameError('gone', 'Cet ordre n’existe plus.');
  const state = cloneState(input);
  state.gold += row.collectGold;
  addStack(state.inventory, row.itemId, row.collectQty);
  if (row.side === 'sell') {
    addStack(state.inventory, row.itemId, row.qty);
    if (row.wear > 0) giveCopy(state, row.itemId, row.wear);
  } else {
    state.gold += row.qty * row.price;
  }
  await tx.delete(marketOrders).where(eq(marketOrders.id, row.id));
  return { state, log: `Ordre annulé : ${content.items[row.itemId]?.name ?? row.itemId}.` };
}

/** Étal de la guilde : le PNJ vend un objet de palier 1 à prix fort, seulement tant qu'aucun joueur n'en propose. */
export async function buyFromStall(
  tx: Tx,
  content: Content,
  input: CharacterState,
  itemId: string,
  qty: number,
): Promise<MarketResult> {
  const item = content.items[itemId];
  if (!item?.stallPrice) throw new GameError('not_sold', 'L’étal de la guilde ne vend pas cet objet.');
  if (!Number.isInteger(qty) || qty < 1 || qty > content.settings.market.maxQuantity) {
    throw new GameError('quantity', `Quantité entre 1 et ${content.settings.market.maxQuantity}.`);
  }
  const offers = await tx.select().from(marketOrders).where(and(eq(marketOrders.itemId, itemId), eq(marketOrders.side, 'sell'), gt(marketOrders.qty, 0)));
  if (offers.length) throw new GameError('players_sell', 'Des joueurs en proposent : l’étal n’ouvre que quand le marché est vide.');
  const cost = item.stallPrice * qty;
  if (input.gold < cost) throw new GameError('gold', 'Pas assez d’or.');
  const state = cloneState(input);
  state.gold -= cost;
  addStack(state.inventory, itemId, qty);
  return { state, log: `Étal de la guilde : ${qty} × ${item.name} (−${cost} or).` };
}

// --- Lecture du livre d'ordres ---

export async function marketSummary(db: Db): Promise<MarketItemSummary[]> {
  const rows = await db.select().from(marketOrders).where(gt(marketOrders.qty, 0));
  const byItem = new Map<string, MarketItemSummary>();
  for (const r of rows) {
    const s = byItem.get(r.itemId) ?? { itemId: r.itemId, bestSell: null, bestBuy: null, sellQty: 0, buyQty: 0 };
    if (r.side === 'sell') {
      s.bestSell = s.bestSell === null ? r.price : Math.min(s.bestSell, r.price);
      s.sellQty += r.qty;
    } else {
      s.bestBuy = s.bestBuy === null ? r.price : Math.max(s.bestBuy, r.price);
      s.buyQty += r.qty;
    }
    byItem.set(r.itemId, s);
  }
  return [...byItem.values()].sort((a, b) => a.itemId.localeCompare(b.itemId));
}

export async function marketBook(db: Db, itemId: string, characterId: number): Promise<MarketOrderView[]> {
  const rows = await db
    .select({ o: marketOrders, name: characters.name })
    .from(marketOrders)
    .innerJoin(characters, eq(characters.id, marketOrders.characterId))
    .where(and(eq(marketOrders.itemId, itemId), gt(marketOrders.qty, 0)))
    .orderBy(asc(marketOrders.price), asc(marketOrders.wear), asc(marketOrders.id));
  return rows.map(({ o, name }) => ({
    id: o.id,
    side: o.side,
    itemId: o.itemId,
    qty: o.qty,
    price: o.price,
    wear: o.wear,
    ownerName: name,
    mine: o.characterId === characterId,
  }));
}

export async function myOrders(db: Db, characterId: number, name: string): Promise<MyOrderView[]> {
  const rows = await db
    .select()
    .from(marketOrders)
    .where(and(eq(marketOrders.characterId, characterId), gt(marketOrders.qty, 0)))
    .orderBy(asc(marketOrders.id));
  return rows.map((o) => ({
    id: o.id,
    side: o.side,
    itemId: o.itemId,
    qty: o.qty,
    price: o.price,
    wear: o.wear,
    ownerName: name,
    mine: true,
    waitingGold: o.collectGold,
    waitingQty: o.collectQty,
  }));
}

import type { Content } from '../schemas/content.js';
import { isDurable } from './gear.js';
import { GameError } from './state.js';

/** Ordre ouvert du marché. `wear` : usure de l'exemplaire proposé (objets durables, toujours en quantité 1) ; 0 sinon. */
export interface MarketOrder {
  id: number;
  ownerId: number;
  side: 'buy' | 'sell';
  itemId: string;
  /** Quantité restante à acheter ou à vendre. */
  qty: number;
  price: number;
  wear: number;
}

export interface Fill {
  order: MarketOrder;
  qty: number;
}

/** Produit net d'une vente après la taxe (arrondie à l'avantage de la taxe : jamais d'or créé). */
export function netProceeds(gross: number, content: Content): number {
  return gross - Math.ceil(gross * content.settings.market.taxShare);
}

/** Vérifie un nouvel ordre : objet, prix, quantité, règles des objets durables. */
export function validateOrder(
  content: Content,
  side: 'buy' | 'sell',
  itemId: string,
  qty: number,
  price: number,
): void {
  const { market } = content.settings;
  const item = content.items[itemId];
  if (!item) throw new GameError('unknown_item', 'Objet inconnu.');
  if (!Number.isInteger(price) || price < 1 || price > market.maxPrice) {
    throw new GameError('price', `Prix unitaire entre 1 et ${market.maxPrice} or.`);
  }
  if (!Number.isInteger(qty) || qty < 1 || qty > market.maxQuantity) {
    throw new GameError('quantity', `Quantité entre 1 et ${market.maxQuantity}.`);
  }
  if (isDurable(item)) {
    if (side === 'buy') throw new GameError('durable_buy', 'Les objets qui s’usent s’achètent à l’étal : l’état de chaque exemplaire compte.');
    if (qty !== 1) throw new GameError('durable_qty', 'Un exemplaire usé se vend à l’unité.');
  }
}

/**
 * Ordres en face qu'un ordre entrant peut croiser, dans l'ordre d'exécution : meilleur prix d'abord,
 * puis le moins usé, puis le plus ancien. Les ordres du joueur lui-même ne sont jamais croisés.
 */
export function crossable(book: MarketOrder[], side: 'buy' | 'sell', itemId: string, limit: number, selfId: number): MarketOrder[] {
  return book
    .filter(
      (o) =>
        o.itemId === itemId &&
        o.ownerId !== selfId &&
        o.qty > 0 &&
        o.side !== side &&
        (side === 'buy' ? o.price <= limit : o.price >= limit),
    )
    .sort((a, b) => (side === 'buy' ? a.price - b.price : b.price - a.price) || a.wear - b.wear || a.id - b.id);
}

/** Exécute un ordre entrant contre le livre : renvoie ce qui s'échange, au prix de l'ordre qui attendait. */
export function match(
  book: MarketOrder[],
  side: 'buy' | 'sell',
  itemId: string,
  qty: number,
  limit: number,
  selfId: number,
): Fill[] {
  const fills: Fill[] = [];
  let left = qty;
  for (const order of crossable(book, side, itemId, limit, selfId)) {
    if (left <= 0) break;
    const take = Math.min(left, order.qty);
    fills.push({ order, qty: take });
    left -= take;
  }
  return fills;
}

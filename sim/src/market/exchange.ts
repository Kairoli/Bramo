import {
  type CharacterState,
  type Content,
  type MarketOrder,
  addStack,
  applyPrime,
  copiesWear,
  giveCopy,
  isDurable,
  match,
  netProceeds,
  primeFor,
  takeCopy,
  validateOrder,
} from '@bramo/shared';

/** Ce que l'échangeur voit d'un joueur simulé. */
export interface Trader {
  id: number;
  state: CharacterState;
}

export interface BookEntry extends MarketOrder {
  /** Jour de pose (pour l'âge des ordres). */
  day: number;
}

export interface ExchangeStats {
  /** Taxe détruite. */
  tax: number;
  /** Or échangé (brut). */
  volume: number;
  trades: number;
  /** XP de prime de commande distribuée. */
  primeXp: number;
}

/**
 * Marché en mémoire : mêmes règles que le serveur (`match`, `netProceeds`, `validateOrder`, prime de commande),
 * sans base de données. Les contreparties sont créditées tout de suite (le serveur attend leur prochain passage).
 */
export class Exchange {
  /** Ordres ouverts par objet (index : un serveur simulé en compte des milliers). */
  private book = new Map<string, BookEntry[]>();
  /** Nombre d'ordres ouverts par joueur. */
  private open = new Map<number, number>();
  private seq = 1;
  /** Tous les ordres ouverts. */
  get orders(): BookEntry[] {
    return [...this.book.values()].flat();
  }
  private list(item: string): BookEntry[] {
    let l = this.book.get(item);
    if (!l) this.book.set(item, (l = []));
    return l;
  }
  private push(o: BookEntry) {
    this.list(o.itemId).push(o);
    this.open.set(o.ownerId, (this.open.get(o.ownerId) ?? 0) + 1);
  }
  /** Retire les ordres vides d'un objet. */
  private prune(item: string) {
    const l = this.book.get(item);
    if (!l) return;
    const keep = l.filter((o) => {
      if (o.qty > 0) return true;
      this.open.set(o.ownerId, (this.open.get(o.ownerId) ?? 1) - 1);
      return false;
    });
    this.book.set(item, keep);
  }
  /** Nombre d'ordres ouverts d'un joueur. */
  openCount(ownerId: number): number {
    return this.open.get(ownerId) ?? 0;
  }
  stats: ExchangeStats = { tax: 0, volume: 0, trades: 0, primeXp: 0 };
  /** Activité d'achat par jour : acheteurs distincts, achats, unités, or, achats en gros (100 unités et plus d'un coup). */
  daily = new Map<number, { buyers: Set<number>; purchases: number; units: number; gold: number; bulk: number }>();
  private noteBuy(botId: number, units: number, gold: number) {
    if (units <= 0) return;
    let d = this.daily.get(this.day);
    if (!d) this.daily.set(this.day, (d = { buyers: new Set(), purchases: 0, units: 0, gold: 0, bulk: 0 }));
    d.buyers.add(botId);
    d.purchases++;
    d.units += units;
    d.gold += gold;
    if (units >= 100) d.bulk++;
  }
  /** Ventes réalisées depuis la dernière remise à zéro, par vendeur puis objet (qty, or brut). */
  sold = new Map<number, Map<string, { qty: number; gross: number }>>();
  /** Achats réalisés, par acheteur puis objet. */
  bought = new Map<number, Map<string, { qty: number; gross: number }>>();
  /** Prix de chaque transaction du jour, par objet : [or brut, quantité]. */
  prices = new Map<string, [number, number][]>();
  /** Instant courant de la simulation (pour la prime de commande, qui dépend du jour de jeu). */
  nowMs = 0;

  constructor(
    private content: Content,
    private traders: Map<number, Trader>,
    public day = 0,
  ) {}

  private note(map: Map<number, Map<string, { qty: number; gross: number }>>, id: number, item: string, qty: number, gross: number) {
    const m = map.get(id) ?? new Map();
    const cur = m.get(item) ?? { qty: 0, gross: 0 };
    m.set(item, { qty: cur.qty + qty, gross: cur.gross + gross });
    map.set(id, m);
  }

  private trade(item: string, qty: number, gross: number) {
    this.stats.volume += gross;
    this.stats.trades += 1;
    const list = this.prices.get(item) ?? [];
    list.push([gross, qty]);
    this.prices.set(item, list);
  }

  resetDay() {
    this.sold.clear();
    this.bought.clear();
    this.prices.clear();
  }

  /** Offres de vente d'un objet, de la moins chère à la plus chère. */
  asks(item: string, excludeOwner?: number): BookEntry[] {
    return (this.book.get(item) ?? [])
      .filter((o) => o.side === 'sell' && o.qty > 0 && o.ownerId !== excludeOwner)
      .sort((a, b) => a.price - b.price || a.wear - b.wear || a.id - b.id);
  }

  bids(item: string, excludeOwner?: number): BookEntry[] {
    return (this.book.get(item) ?? [])
      .filter((o) => o.side === 'buy' && o.qty > 0 && o.ownerId !== excludeOwner)
      .sort((a, b) => b.price - a.price || a.id - b.id);
  }

  mine(ownerId: number): BookEntry[] {
    if (!this.openCount(ownerId)) return [];
    return this.orders.filter((o) => o.ownerId === ownerId && o.qty > 0);
  }

  /** Rend à `bot` tout ce que ses ordres avaient mis de côté. */
  cancelAll(bot: Trader): void {
    for (const o of this.mine(bot.id)) {
      if (o.side === 'sell') {
        addStack(bot.state.inventory, o.itemId, o.qty);
        if (o.wear > 0) giveCopy(bot.state, o.itemId, o.wear);
      } else bot.state.gold += o.qty * o.price;
    }
    for (const [item, l] of this.book) if (l.some((o) => o.ownerId === bot.id)) this.book.set(item, l.filter((o) => o.ownerId !== bot.id));
    this.open.delete(bot.id);
  }

  /** Vend : exécute contre les demandes qui conviennent, le reste attend. Renvoie l'or net gagné et la quantité vendue. */
  sell(bot: Trader, item: string, qty: number, price: number, copy = 0): { qty: number; gold: number } {
    qty = Math.min(qty, this.content.settings.market.maxQuantity);
    // Comme le serveur : au plus `maxOpenOrders` ordres ouverts par joueur.
    if (this.openCount(bot.id) >= this.content.settings.market.maxOpenOrders) return { qty: 0, gold: 0 };
    validateOrder(this.content, 'sell', item, qty, price);
    const state = bot.state;
    let wear = 0;
    if (isDurable(this.content.items[item])) {
      if (copy >= copiesWear(state, item).length) return { qty: 0, gold: 0 };
      wear = takeCopy(state, item, copy);
      addStack(state.inventory, item, -1);
    } else {
      if ((state.inventory[item] ?? 0) < qty) return { qty: 0, gold: 0 };
      addStack(state.inventory, item, -qty);
    }
    const fills = match(this.list(item), 'sell', item, qty, price, bot.id);
    let filled = 0;
    let gold = 0;
    let primed = 0;
    for (const f of fills) {
      const gross = f.qty * f.order.price;
      const net = netProceeds(gross, this.content);
      const entry = f.order as BookEntry;
      entry.qty -= f.qty;
      const buyer = this.traders.get(entry.ownerId);
      if (buyer) addStack(buyer.state.inventory, item, f.qty);
      filled += f.qty;
      gold += net;
      if (f.order.price >= this.content.items[item]!.value) primed += f.qty;
      this.stats.tax += gross - net;
      this.trade(item, f.qty, gross);
      this.note(this.sold, bot.id, item, f.qty, gross);
      if (buyer) this.note(this.bought, buyer.id, item, f.qty, gross);
    }
    state.gold += gold;
    if (primed > 0) {
      const prime = primeFor(state, item, primed, this.nowMs, this.content);
      if (prime) {
        applyPrime(state, prime, this.nowMs, this.content);
        this.stats.primeXp += prime.xp;
      }
    }
    const rest = qty - filled;
    if (rest > 0) this.push({ id: this.seq++, ownerId: bot.id, side: 'sell', itemId: item, qty: rest, price, wear, day: this.day });
    this.prune(item);
    return { qty: filled, gold };
  }

  /** Achète jusqu'à `qty` au prix limite : exécute contre les offres, met le reste en demande (l'or est mis de côté). */
  buy(bot: Trader, item: string, qty: number, limit: number, rest = true): { qty: number; gold: number } {
    qty = Math.min(qty, this.content.settings.market.maxQuantity);
    if (rest && this.openCount(bot.id) >= this.content.settings.market.maxOpenOrders) rest = false;
    validateOrder(this.content, 'buy', item, qty, limit);
    const state = bot.state;
    const fills = match(this.list(item), 'buy', item, qty, limit, bot.id);
    let filled = 0;
    let paid = 0;
    for (const f of fills) {
      const gross = f.qty * f.order.price;
      if (state.gold < gross) break;
      const net = netProceeds(gross, this.content);
      const entry = f.order as BookEntry;
      entry.qty -= f.qty;
      const seller = this.traders.get(entry.ownerId);
      if (seller) seller.state.gold += net;
      state.gold -= gross;
      addStack(state.inventory, item, f.qty);
      filled += f.qty;
      paid += gross;
      this.stats.tax += gross - net;
      this.trade(item, f.qty, gross);
      this.note(this.bought, bot.id, item, f.qty, gross);
      if (seller) this.note(this.sold, seller.id, item, f.qty, gross);
    }
    this.noteBuy(bot.id, filled, paid);
    const left = qty - filled;
    if (rest && left > 0 && state.gold >= left * limit) {
      state.gold -= left * limit;
      this.push({ id: this.seq++, ownerId: bot.id, side: 'buy', itemId: item, qty: left, price: limit, wear: 0, day: this.day });
    }
    this.prune(item);
    return { qty: filled, gold: paid };
  }

  /** Achète à une offre précise (objets durables : l'état de l'exemplaire compte). */
  fill(bot: Trader, order: BookEntry, qty = 1): boolean {
    const state = bot.state;
    const entry = (this.book.get(order.itemId) ?? []).find((o) => o.id === order.id);
    if (!entry || entry.qty < qty || entry.ownerId === bot.id) return false;
    const gross = qty * entry.price;
    if (state.gold < gross) return false;
    const net = netProceeds(gross, this.content);
    entry.qty -= qty;
    state.gold -= gross;
    addStack(state.inventory, entry.itemId, qty);
    if (entry.wear > 0) giveCopy(state, entry.itemId, entry.wear);
    const seller = this.traders.get(entry.ownerId);
    if (seller) seller.state.gold += net;
    this.stats.tax += gross - net;
    this.trade(entry.itemId, qty, gross);
    this.note(this.bought, bot.id, entry.itemId, qty, gross);
    if (seller) this.note(this.sold, seller.id, entry.itemId, qty, gross);
    this.prune(entry.itemId);
    return true;
  }
}

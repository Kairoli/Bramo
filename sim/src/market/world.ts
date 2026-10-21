import {
  type CharacterState,
  type Content,
  type Item,
  type Recipe,
  GameError,
  activeTool,
  advance,
  completeNpcOrder,
  copiesRemaining,
  levelForXp,
  newCharacterState,
  npcOrdersOfDay,
  recycleItem,
  recycleYield,
  repairCost,
  repairItem,
  repairProblem,
  repairWithMaterials,
  startActivity,
  stockPantry,
} from '@bramo/shared';
import { SIM_START, bestGatherRecipe } from '../bot.js';
import { unitCost, workSec } from '../chains.js';
import { type PresenceProfile, PROFILES } from '../profiles.js';
import { Exchange, type Trader } from './exchange.js';

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
/** Or par minute de travail au niveau 1 : même échelle que les commandes PNJ (15 min de récolte = 150 or). */
const GOLD_PER_MIN = 10;

export interface WorldOptions {
  players: number;
  days: number;
  seed: number;
  /** Part des joueurs déjà là au jour 0 ; les autres arrivent régulièrement pendant `joinDays`. */
  initialShare?: number;
  joinDays?: number;
}

/** Comment un joueur simulé joue. */
export type Archetype = 'xp' | 'marchand' | 'artisan';

export interface BotView {
  id: number;
  name: string;
  profession: string;
  archetype: Archetype;
  presence: string;
  joinDay: number;
  /** Dernier état connu, en une phrase. */
  status: string;
  level: number;
  topLevels: Record<string, number>;
  gold: number;
  tool: string | null;
  toolState: 'neuf' | 'entamé' | 'usé' | 'aucun';
  goldHistory: number[];
  levelHistory: number[];
  firstToolDay: number | null;
  day500: number | null;
  idleDays: number;
  /** Compteurs sur toute la simulation. */
  totals: {
    npcGold: number;
    salesNet: number;
    purchases: number;
    taxPaid: number;
    pnjRepairs: number;
    selfRepairs: number;
    stallBuys: number;
    recycled: number;
    craftedUnits: number;
  };
}

export interface DayMetrics {
  day: number;
  players: number;
  goldSupply: number;
  gold: { npc: number; tax: number; pnjRepair: number; stall: number };
  volume: number;
  trades: number;
  /** Or mis en vente (au prix demandé) resté invendu en fin de journée. */
  unsoldValue: number;
  openAsks: number;
  openBids: number;
  workMin: Record<string, number>;
  idle: number;
  idleNoTool: number;
}

export interface ItemSeries {
  item: string;
  name: string;
  ref: number;
  /** Par semaine : prix moyen des transactions, 0 si aucune. */
  weekly: { price: number; qty: number }[];
  qty: number;
}

export interface WorldResult {
  options: Required<WorldOptions>;
  bots: BotView[];
  days: DayMetrics[];
  items: ItemSeries[];
  repairs: { pnj: number; self: number; artisanFeeFloor: number; pnjPriceAvg: number };
  events: { day: number; text: string }[];
  primeXp: number;
  gini: number;
}

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const PROFESSIONS: [string, number][] = [
  ['mining', 0.2],
  ['woodcutting', 0.12],
  ['herbalism', 0.13],
  ['fishing', 0.13],
  ['smithing', 0.14],
  ['carpentry', 0.12],
  ['cooking', 0.16],
];
const PRESENCES: [string, number][] = [
  ['casu20', 0.25],
  ['casu2v', 0.15],
  ['mobile', 0.2],
  ['regular2h', 0.15],
  ['block2h', 0.15],
  ['tab16h', 0.1],
];
const GATHER = new Set(['mining', 'woodcutting', 'herbalism', 'fishing']);
/** Métier de récolte qu'un artisan pratique quand il manque d'ingrédients. */
const FEEDER: Record<string, string> = { smithing: 'mining', carpentry: 'woodcutting', cooking: 'herbalism' };

const FIRST = ['Aldric', 'Brinn', 'Cora', 'Dagna', 'Eloi', 'Fenn', 'Garance', 'Hugo', 'Isaure', 'Jorun', 'Kaelo', 'Lise', 'Maelle', 'Nils', 'Orla', 'Pavel', 'Quentin', 'Rowan', 'Sacha', 'Thessa', 'Ulric', 'Vera', 'Wyatt', 'Xenia', 'Yann', 'Zelie'];
const LAST = ['Cendre', 'Brume', 'Lanterne', 'Pierre', 'Mousse', 'Givre', 'Braise', 'Ecume', 'Sauge', 'Corbeau', 'Ronce', 'Argile'];

interface Bot extends Trader {
  name: string;
  profession: string;
  archetype: Archetype;
  presence: PresenceProfile;
  joinDay: number;
  ask: Map<string, number>;
  bid: Map<string, number>;
  listed: Map<string, number>;
  wanted: Map<string, number>;
  status: string;
  started: boolean;
  firstToolDay: number | null;
  day500: number | null;
  idleDays: number;
  goldHistory: number[];
  levelHistory: number[];
  totals: BotView['totals'];
}

function pick<T>(list: [T, number][], r: number): T {
  let acc = 0;
  for (const [v, w] of list) {
    acc += w;
    if (r < acc) return v;
  }
  return list.at(-1)![0];
}

export function runWorld(content: Content, input: WorldOptions): WorldResult {
  const opts: Required<WorldOptions> = { initialShare: 0.6, joinDays: 60, ...input };
  const rand = rng(opts.seed);
  const traders = new Map<number, Trader>();
  const exchange = new Exchange(content, traders);
  const events: { day: number; text: string }[] = [];
  const event = (day: number, text: string) => events.length < 400 && events.push({ day, text });
  const itemName = (id: string) => content.items[id]?.name ?? id;
  const lvl = (s: CharacterState, p: string) => levelForXp(s.skills[p] ?? 0, content.xpTable);

  // --- Prix de référence : 10 or par minute de travail de chaîne, qui croît avec le niveau requis ---
  const refCache = new Map<string, number>();
  const ref = (id: string): number => {
    const hit = refCache.get(id);
    if (hit !== undefined) return hit;
    let value = Math.max(1, content.items[id]?.value ?? 1);
    try {
      const c = unitCost(id, content);
      const top = Math.max(1, ...Object.values(c.levels));
      value = Math.max(1, Math.round((GOLD_PER_MIN * workSec(c) * 2 ** ((top - 1) / 55)) / 60));
    } catch {
      // pas de recette : valeur du jeu
    }
    refCache.set(id, value);
    return value;
  };

  // --- Joueurs ---
  const bots: Bot[] = [];
  const professions = PROFESSIONS.filter(([p]) => content.professions.find((x) => x.id === p)?.status === 'playable');
  for (let i = 0; i < opts.players; i++) {
    const profession = pick(professions, rand() * professions.reduce((s, [, w]) => s + w, 0) / 1);
    const presenceId = pick(PRESENCES, rand());
    const late = i >= Math.round(opts.players * opts.initialShare);
    const archetype: Archetype = GATHER.has(profession) ? (rand() < 0.3 ? 'marchand' : 'xp') : 'artisan';
    bots.push({
      id: i + 1,
      name: `${FIRST[i % FIRST.length]} ${LAST[(i * 7 + 3) % LAST.length]}`,
      profession,
      archetype,
      presence: PROFILES[presenceId]!,
      joinDay: late ? Math.floor(1 + rand() * opts.joinDays) : 0,
      state: undefined as unknown as CharacterState,
      ask: new Map(),
      bid: new Map(),
      listed: new Map(),
      wanted: new Map(),
      status: 'pas encore arrivé',
      started: false,
      firstToolDay: null,
      day500: null,
      idleDays: 0,
      goldHistory: [],
      levelHistory: [],
      totals: { npcGold: 0, salesNet: 0, purchases: 0, taxPaid: 0, pnjRepairs: 0, selfRepairs: 0, stallBuys: 0, recycled: 0, craftedUnits: 0 },
    });
  }
  const firstSession = (b: Bot) => Math.min(...b.presence.sessions.map((s) => s.at));

  let pnjRepairGold = 0;
  let stallGold = 0;
  let npcGoldToday = 0;
  let workMin: Record<string, number> = {};
  const repairs = { pnj: 0, self: 0 };
  const priceHistory = new Map<string, [number, number][][]>();

  const tools = (profession: string): Item[] =>
    Object.values(content.items)
      .filter((i) => i.tool?.profession === profession)
      .sort((a, b) => b.tool!.bonus - a.tool!.bonus);

  const sellPrice = (b: Bot, item: string) => Math.max(1, Math.round(ref(item) * (b.ask.get(item) ?? 1.2)));
  const bidPrice = (b: Bot, item: string) => Math.max(1, Math.round(ref(item) * (b.bid.get(item) ?? 1.1)));
  const cheapestAsk = (item: string, self: number) => exchange.asks(item, self)[0]?.price;
  const buyEstimate = (item: string, self: number) => cheapestAsk(item, self) ?? Math.round(ref(item) * 1.3);
  const sellEstimate = (b: Bot, item: string) => exchange.bids(item, b.id)[0]?.price ?? sellPrice(b, item);

  const step = (b: Bot, to: number) => {
    const before = b.state.activity && content.recipes[b.state.activity.recipeId]?.profession;
    const { state, summary } = advance(b.state, to, content);
    b.state = state;
    traders.get(b.id)!.state = state;
    if (before && summary.workedMs > 0) workMin[before] = (workMin[before] ?? 0) + summary.workedMs / 60_000;
    if (summary.worn.length && b.started) event(Math.floor((to - SIM_START) / DAY), `${b.name} : ${summary.worn.map(itemName).join(', ')} usé`);
    for (const [item, qty] of Object.entries(summary.produced)) {
      if (!GATHER.has(b.profession) || content.recipes[b.state.activity?.recipeId ?? '']?.inputs.length) b.totals.craftedUnits += qty;
      void item;
    }
  };

  const startDay = (b: Bot, t: number) => {
    if (b.started) return;
    b.state = newCharacterState(t, content);
    b.state.classId = Object.keys(content.classes)[0] ?? null;
    // Hypothèse du simulateur : les commandes du maître sont validées sans délai (voir les limites du tableau de bord).
    b.state.trials = Object.keys(content.trials);
    b.state.seed = b.id;
    b.started = true;
    traders.set(b.id, b);
    b.status = 'vient d’arriver';
  };

  // --- Décisions d'un joueur à sa première visite du jour ---

  const adaptPrices = (b: Bot) => {
    const sold = exchange.sold.get(b.id);
    for (const [item, qty] of b.listed) {
      const got = sold?.get(item)?.qty ?? 0;
      const m = b.ask.get(item) ?? 1.2;
      const next = got >= qty * 0.9 ? m * 1.06 : got < qty * 0.2 ? m * 0.88 : m * 0.97;
      b.ask.set(item, Math.min(4, Math.max(0.3, next)));
    }
    const bought = exchange.bought.get(b.id);
    for (const [item, qty] of b.wanted) {
      const got = bought?.get(item)?.qty ?? 0;
      const m = b.bid.get(item) ?? 1.1;
      b.bid.set(item, Math.min(3, Math.max(0.5, got >= qty * 0.9 ? m * 0.97 : m * 1.1)));
    }
    exchange.sold.delete(b.id);
    exchange.bought.delete(b.id);
    b.listed.clear();
    b.wanted.clear();
  };

  const npcOrders = (b: Bot, t: number, day: number) => {
    for (const o of npcOrdersOfDay(b.state, t, content)) {
      // Il manque des objets ? On les achète si la commande reste rentable.
      for (const s of o.items) {
        const have = b.state.inventory[s.item] ?? 0;
        if (have >= s.qty) continue;
        const asks = exchange.asks(s.item, b.id);
        let need = s.qty - have;
        let cost = 0;
        let top = 0;
        for (const a of asks) {
          const q = Math.min(need, a.qty);
          cost += q * a.price;
          top = a.price;
          need -= q;
          if (need <= 0) break;
        }
        if (need <= 0 && cost <= o.gold * 0.6 && cost <= b.state.gold) {
          exchange.buy(b, s.item, s.qty - have, top, false);
          b.totals.purchases += cost;
        }
      }
      try {
        const before = b.state.gold;
        b.state = completeNpcOrder(b.state, o.id, t, content);
        traders.get(b.id)!.state = b.state;
        const earned = b.state.gold - before;
        b.totals.npcGold += earned;
        npcGoldToday += earned;
      } catch (e) {
        if (!(e instanceof GameError)) throw e;
      }
    }
    void day;
  };

  const toolUpkeep = (b: Bot, day: number) => {
    const list = tools(b.profession);
    if (!list.length) return;
    // Réparer ce qui est usé : soi-même avec ses matériaux, sinon chez le PNJ (le moins cher).
    for (const item of list) {
      if (!b.state.inventory[item.id]) continue;
      const copies = copiesRemaining(b.state, item.id, content);
      const worn = copies.some((r) => r <= 0.1 * (item.tool!.durabilityHours ?? 1) * HOUR);
      if (!worn) continue;
      if (item.repair && repairProblem(b.state, item.id, content) === null) {
        b.state = repairWithMaterials(b.state, item.id, content);
        b.totals.selfRepairs++;
        repairs.self++;
      } else {
        const cost = repairCost(item.id, b.state, content);
        if (cost > 0 && b.state.gold >= cost) {
          b.state = repairItem(b.state, item.id, content);
          b.totals.pnjRepairs++;
          pnjRepairGold += cost;
          repairs.pnj++;
        }
      }
      traders.get(b.id)!.state = b.state;
    }
    const have = activeTool(b.profession, b.state, content);
    const best = list[0]!;
    if (have && have.bonus >= best.tool!.bonus) return;
    // Acheter le meilleur outil abordable à un joueur ; sinon l'étal (palier 1) quand personne n'en vend.
    for (const item of list) {
      if (have && item.tool!.bonus <= have.bonus) break;
      const ask = exchange.asks(item.id, b.id)[0];
      const budget = have ? b.state.gold / 3 : b.state.gold * 0.8;
      if (ask && ask.price <= budget && exchange.fill(b, ask)) {
        b.totals.purchases += ask.price;
        return;
      }
    }
    if (!have) {
      for (const item of [...list].reverse()) {
        if (!item.stallPrice) continue;
        if (exchange.asks(item.id).length === 0 && b.state.gold >= item.stallPrice) {
          b.state.gold -= item.stallPrice;
          b.state.inventory[item.id] = (b.state.inventory[item.id] ?? 0) + 1;
          stallGold += item.stallPrice;
          b.totals.stallBuys++;
          event(day, `${b.name} achète ${item.name} à l’étal de la guilde`);
          return;
        }
      }
    }
  };

  const meals = (b: Bot) => {
    const L = lvl(b.state, b.profession);
    for (const item of Object.values(content.items)) {
      if (!item.meal) continue;
      const ask = exchange.asks(item.id, b.id)[0];
      if (!ask) continue;
      const benefit = item.meal.bonus * item.meal.durationMin * GOLD_PER_MIN * 2 ** ((L - 1) / 55) * 0.6;
      if (ask.price <= benefit && b.state.gold >= ask.price * 4 + 50) {
        const r = exchange.buy(b, item.id, 3, ask.price, false);
        if (r.qty) {
          b.totals.purchases += r.gold;
          b.state = stockPantry(b.state, item.id, r.qty, content);
          traders.get(b.id)!.state = b.state;
        }
      }
    }
  };

  const reserved = (b: Bot, item: string, plan?: Recipe): number => (plan?.inputs.find((i) => i.item === item) ? 1e9 : 0);

  const sellSurplus = (b: Bot, plan?: Recipe) => {
    for (const [item, qty] of Object.entries(b.state.inventory)) {
      const def = content.items[item];
      if (!def || qty <= 0) continue;
      if (def.tool && activeTool(b.profession, b.state, content)?.itemId === item && qty <= 1) continue;
      const keep = reserved(b, item, plan) > 0 ? qty : 0;
      let sellQty = qty - keep;
      if (def.tool) sellQty = Math.min(sellQty, Math.max(0, qty - (def.tool.profession === b.profession ? 1 : 0)));
      if (sellQty <= 0) continue;
      // Un objet durable se vend à l'unité.
      if (def.tool) {
        for (let i = 0; i < sellQty; i++) {
          const r = exchange.sell(b, item, 1, sellPrice(b, item), 0);
          b.totals.salesNet += r.gold;
        }
        b.listed.set(item, (b.listed.get(item) ?? 0) + sellQty);
        continue;
      }
      // Trop de stock invendable et prix au plancher : on recycle (40 % des matériaux).
      if ((b.ask.get(item) ?? 1.2) <= 0.35 && recycleYield(item, content).length && qty > 200) {
        b.state = recycleItem(b.state, item, Math.floor(qty * 0.5), content);
        b.totals.recycled += Math.floor(qty * 0.5);
        traders.get(b.id)!.state = b.state;
        continue;
      }
      const r = exchange.sell(b, item, sellQty, sellPrice(b, item));
      b.totals.salesNet += r.gold;
      b.listed.set(item, sellQty);
    }
  };

  /** Meilleure récolte pour un joueur « marchand » : ce qui se vendrait le mieux à la seconde. */
  const bestSellingGather = (b: Bot, skill: string): Recipe | undefined => {
    const L = lvl(b.state, skill);
    return Object.values(content.recipes)
      .filter((r) => r.profession === skill && !r.trial && r.inputs.length === 0 && r.level <= L)
      .sort((a, c) => (sellEstimate(b, c.outputs[0]!.item) * c.outputs[0]!.qty) / c.durationSec - (sellEstimate(b, a.outputs[0]!.item) * a.outputs[0]!.qty) / a.durationSec)[0];
  };

  const setActivity = (b: Bot, t: number, primary: Recipe, qty: number, then?: Recipe) => {
    const { maxQuantity, queueLength } = content.settings.activity;
    let s = startActivity(b.state, primary.id, Math.max(1, Math.min(maxQuantity, qty)), 'replace', t, content);
    s = { ...s, queue: [] };
    if (then) for (let i = 0; i < queueLength; i++) s = startActivity(s, then.id, maxQuantity, 'queue', t, content);
    else for (let i = 0; i < queueLength; i++) s = startActivity(s, primary.id, maxQuantity, 'queue', t, content);
    b.state = s;
    traders.get(b.id)!.state = s;
  };

  const act = (b: Bot, t: number, day: number) => {
    adaptPrices(b);
    exchange.cancelAll(b);
    npcOrders(b, t, day);
    toolUpkeep(b, day);
    meals(b);
    const tool = activeTool(b.profession, b.state, content);
    if (tool && b.firstToolDay === null) b.firstToolDay = day;
    const L = lvl(b.state, b.profession);

    if (GATHER.has(b.profession)) {
      sellSurplus(b);
      const main = b.archetype === 'marchand' ? bestSellingGather(b, b.profession) : bestGatherRecipe(b.profession, b.state, content);
      // Une commande PNJ de son métier d'abord, si on peut la fournir en peu de temps.
      const order = npcOrdersOfDay(b.state, t, content).find(
        (o) => o.profession === b.profession && !b.state.npc.done.includes(o.id) && o.items.every((s) => (b.state.inventory[s.item] ?? 0) < s.qty),
      );
      const need = order && content.recipes[Object.keys(content.recipes).find((k) => content.recipes[k]!.outputs[0]!.item === order.items[0]!.item && !content.recipes[k]!.inputs.length) ?? ''];
      if (!main) return;
      if (order && need && need.level <= L) {
        setActivity(b, t, need, order.items[0]!.qty - (b.state.inventory[order.items[0]!.item] ?? 0), main);
        b.status = `récolte pour une commande PNJ (${itemName(order.items[0]!.item)})`;
      } else {
        setActivity(b, t, main, 1e9);
        b.status = `récolte : ${main.name}`;
      }
      return;
    }

    // Artisan : choisit la fabrication qui rapporte le plus d'XP sans trop perdre d'or, achète ses ingrédients, vend le reste.
    const feeder = bestGatherRecipe(FEEDER[b.profession] ?? 'mining', b.state, content);
    const candidates = Object.values(content.recipes).filter(
      (r) => r.profession === b.profession && !r.trial && r.category !== 'masterwork' && r.inputs.length > 0 && r.level <= L,
    );
    const scored = candidates
      .map((r) => {
        const cost = r.inputs.reduce((s, i) => s + i.qty * buyEstimate(i.item, b.id), 0);
        const out = r.outputs[0]!;
        const revenue = sellEstimate(b, out.item) * out.qty * 0.93;
        return { r, cost, revenue, score: r.xp / r.durationSec };
      })
      .filter((x) => x.revenue >= x.cost * 0.5)
      // Seules comptent les fabrications dont on peut réunir les ingrédients : en stock ou en vente sur le marché.
      .filter((x) =>
        x.r.inputs.every((i) => (b.state.inventory[i.item] ?? 0) + exchange.asks(i.item, b.id).reduce((n, a) => n + a.qty, 0) >= i.qty * 3),
      )
      .sort((a, c) => c.score - a.score);
    const plan = scored[0];
    sellSurplus(b, plan?.r);
    if (plan) {
      const crafts = Math.min(Math.floor((14 * 3600) / plan.r.durationSec), 4000);
      const budget = b.state.gold * 0.6;
      const n = Math.max(1, Math.min(crafts, Math.floor(budget / Math.max(1, plan.cost))));
      for (const i of plan.r.inputs) {
        const need = i.qty * n - (b.state.inventory[i.item] ?? 0);
        if (need <= 0) continue;
        const r = exchange.buy(b, i.item, need, bidPrice(b, i.item));
        b.totals.purchases += r.gold;
        b.wanted.set(i.item, need);
      }
      const canNow = plan.r.inputs.every((i) => (b.state.inventory[i.item] ?? 0) >= i.qty);
      if (canNow) {
        setActivity(b, t, plan.r, n, feeder);
        b.status = `fabrique : ${plan.r.name}`;
        return;
      }
    }
    if (feeder) {
      setActivity(b, t, feeder, 1e9);
      b.status = plan ? `attend ses ingrédients (${plan.r.name}), récolte en attendant` : `récolte ${feeder.name} faute de fabrication rentable`;
    } else b.status = 'rien à faire';
  };

  // --- Boucle des jours ---
  const dayMetrics: DayMetrics[] = [];
  let lastTax = 0;
  let lastVolume = 0;
  let lastTrades = 0;
  const events0 = events.length;
  void events0;

  for (let day = 0; day < opts.days; day++) {
    const dayStart = SIM_START + day * DAY;
    exchange.day = day;
    npcGoldToday = 0;
    pnjRepairGold = 0;
    stallGold = 0;
    workMin = {};
    const active = bots.filter((b) => b.joinDay <= day);
    // Phase A : première visite du jour, dans l'ordre des heures (le marché se remplit au fil de la journée).
    for (const b of [...active].sort((a, c) => firstSession(a) - firstSession(c))) {
      const t = dayStart + firstSession(b) * HOUR;
      exchange.nowMs = t;
      if (!b.started) startDay(b, t);
      else step(b, t);
      b.state.lastSeenAt = t;
      act(b, t, day);
    }
    // Phase B : le reste de la journée, session par session, puis jusqu'à minuit.
    for (const b of active) {
      for (const s of [...b.presence.sessions].sort((a, c) => a.at - c.at)) {
        const start = dayStart + s.at * HOUR;
        const end = start + s.minutes * 60_000;
        if (start > b.state.lastTickAt) step(b, start);
        b.state.lastSeenAt = Math.max(b.state.lastSeenAt, start);
        b.state.lastSeenAt = end;
        step(b, end);
      }
      step(b, dayStart + DAY);
    }
    // Relevés du jour.
    let supply = 0;
    for (const b of active) supply += b.state.gold;
    for (const o of exchange.orders) if (o.side === 'buy') supply += o.qty * o.price;
    let unsold = 0;
    let asks = 0;
    let bids = 0;
    for (const o of exchange.orders) {
      if (o.side === 'sell') {
        unsold += o.qty * o.price;
        asks++;
      } else bids++;
    }
    let idle = 0;
    let idleNoTool = 0;
    for (const b of active) {
      const a = b.state.activity;
      const recipe = a && content.recipes[a.recipeId];
      const stuck = !a || !recipe || a.done >= a.quantity || recipe.inputs.some((i) => (b.state.inventory[i.item] ?? 0) < i.qty);
      const hasTool = !tools(b.profession).length || !!activeTool(b.profession, b.state, content);
      if (stuck) {
        idle++;
        b.idleDays++;
      }
      if (!hasTool) idleNoTool++;
      if (b.firstToolDay === null && activeTool(b.profession, b.state, content)) b.firstToolDay = day;
      if (b.day500 === null && b.state.gold >= 500) b.day500 = day;
      b.goldHistory.push(Math.round(b.state.gold));
      b.levelHistory.push(lvl(b.state, b.profession));
    }
    for (const b of bots) if (b.joinDay > day) {
      b.goldHistory.push(0);
      b.levelHistory.push(0);
    }
    for (const [item, list] of exchange.prices) {
      const weeks = priceHistory.get(item) ?? [];
      const w = Math.floor(day / 7);
      (weeks[w] ??= []).push(...list);
      priceHistory.set(item, weeks);
    }
    dayMetrics.push({
      day,
      players: active.length,
      goldSupply: Math.round(supply),
      gold: { npc: npcGoldToday, tax: exchange.stats.tax - lastTax, pnjRepair: pnjRepairGold, stall: stallGold },
      volume: exchange.stats.volume - lastVolume,
      trades: exchange.stats.trades - lastTrades,
      unsoldValue: Math.round(unsold),
      openAsks: asks,
      openBids: bids,
      workMin: { ...workMin },
      idle,
      idleNoTool,
    });
    lastTax = exchange.stats.tax;
    lastVolume = exchange.stats.volume;
    lastTrades = exchange.stats.trades;
    exchange.prices.clear();
  }

  // --- Résultats ---
  const views: BotView[] = bots.map((b) => {
    const s = b.state;
    const list = tools(b.profession);
    const tool = s ? activeTool(b.profession, s, content) : null;
    const owned = s ? list.find((i) => (s.inventory[i.id] ?? 0) > 0) : undefined;
    const remaining = owned && s ? copiesRemaining(s, owned.id, content) : [];
    const total = (owned?.tool?.durabilityHours ?? 1) * HOUR;
    const topLevels: Record<string, number> = {};
    if (s) for (const p of Object.keys(s.skills)) if (lvl(s, p) > 1) topLevels[p] = lvl(s, p);
    return {
      id: b.id,
      name: b.name,
      profession: b.profession,
      archetype: b.archetype,
      presence: b.presence.id,
      joinDay: b.joinDay,
      status: b.status,
      level: s ? lvl(s, b.profession) : 0,
      topLevels,
      gold: s ? Math.round(s.gold) : 0,
      tool: tool ? itemName(tool.itemId) : owned ? itemName(owned.id) : null,
      toolState: !owned ? 'aucun' : tool ? (Math.min(...remaining) < 0.5 * total ? 'entamé' : 'neuf') : 'usé',
      goldHistory: b.goldHistory,
      levelHistory: b.levelHistory,
      firstToolDay: b.firstToolDay,
      day500: b.day500,
      idleDays: b.idleDays,
      totals: b.totals,
    };
  });
  for (const v of views) v.totals.taxPaid = 0;

  const items: ItemSeries[] = [...priceHistory.entries()]
    .map(([item, weeks]) => {
      const weekly = Array.from({ length: Math.ceil(opts.days / 7) }, (_, w) => {
        const list = weeks[w] ?? [];
        const qty = list.reduce((s, [, q]) => s + q, 0);
        return { price: qty ? list.reduce((s, [g]) => s + g, 0) / qty : 0, qty };
      });
      return { item, name: itemName(item), ref: ref(item), weekly, qty: weekly.reduce((s, w) => s + w.qty, 0) };
    })
    .sort((a, b) => b.qty - a.qty);

  // Gini des richesses à la fin.
  const golds = views.filter((v) => v.level > 0).map((v) => v.gold).sort((a, b) => a - b);
  const n = golds.length;
  const sum = golds.reduce((s, g) => s + g, 0);
  const gini = n && sum ? golds.reduce((acc, g, i) => acc + (2 * (i + 1) - n - 1) * g, 0) / (n * sum) : 0;

  const bronzeBar = ref('bronze_bar');
  const artisanFeeFloor = Math.round(3 * bronzeBar);
  const pnjPriceAvg = repairs.pnj ? Math.round(dayMetrics.reduce((s, d) => s + d.gold.pnjRepair, 0) / repairs.pnj) : 0;
  return { options: opts, bots: views, days: dayMetrics, items, repairs: { ...repairs, artisanFeeFloor, pnjPriceAvg }, events, primeXp: exchange.stats.primeXp, gini };
}

/**
 * Simulateur de serveur : une population de joueurs très différents joue tout le jeu avec le vrai moteur (`advance`,
 * combat de la route et son butin compris), un marché aux règles du serveur, les commandes PNJ, les commandes du maître,
 * les clans et leurs bâtiments, l'équipement et les gemmes. Il relève tout ce qu'il faut pour trouver les failles :
 * progression, buts, or, prix, butin, ensembles, classes et voies.
 */
import {
  type CharacterState,
  type Content,
  type GearInstance,
  type GearModel,
  type Item,
  type Recipe,
  GameError,
  activateEnergy,
  activeTool,
  addStack,
  advance,
  buildingNeeds,
  canHoldGem,
  canWear,
  chooseClass,
  choosePath,
  classLevel,
  combatantOf,
  completeNpcOrder,
  completeTrial,
  copiesRemaining,
  energyChargesLeft,
  gemItemOf,
  memberBonuses,
  newCharacterState,
  newInstance,
  nextTrial,
  npcOrdersOfDay,
  repairCost,
  repairItem,
  routeStages,
  skillLevel,
  socketGem,
  startActivity,
  stockPantry,
  tierFactorAt,
  wallIndex,
  wornGear,
} from '@bramo/shared';
import { SIM_START } from '../bot.js';
import { unitCost, workSec } from '../chains.js';
import { Exchange, type Trader } from '../market/exchange.js';
import { PROFILES, type PresenceProfile } from '../profiles.js';
import { relevantFamilies } from '../scenarios/combat-tools.js';
import { installFightCache, probe } from './fightCache.js';
import { MIXES, PERSONAS, type Persona } from './personas.js';

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
/** Or par minute de travail au niveau 1 (même échelle que les commandes PNJ : 15 min de récolte = 150 or). */
const GOLD_PER_MIN = 10;
/** Un vestige ≈ 3 minutes de combat gagné (2 vestiges par unité de 6 min). */
const VESTIGE_REF = 30;
const RARITY_RANK: Record<string, number> = { common: 0, rare: 1, epic: 2, legendary: 3 };

export interface ServerOptions {
  players: number;
  days: number;
  seed: number;
  /** Composition du serveur (personas.ts, MIXES). */
  mix: string;
  /** Part des joueurs présents au jour 0 ; les autres arrivent pendant `joinDays`. */
  initialShare?: number;
  joinDays?: number;
  /** Extensions branchées (world boss…), appelées chaque jour. */
  hooks?: ServerHook[];
}

export interface ServerHook {
  name: string;
  /** Après la première visite de chaque joueur. */
  onVisit?(ctx: HookContext, b: Bot, t: number, day: number): void;
  /** Une fois par jour, après les sessions. */
  onDayEnd?(ctx: HookContext, day: number): void;
}

export interface HookContext {
  content: Content;
  bots: Bot[];
  exchange: Exchange;
  ledger: Ledger;
  rand: () => number;
  gearOf(b: Bot): GearInstance[];
  grantGear(b: Bot, model: string, source: string): void;
  equipBest(b: Bot): void;
}

/** Robinets et puits d'or, et mouvements d'objets, cumulés. */
export interface Ledger {
  faucet: Record<string, number>;
  sink: Record<string, number>;
  produced: Record<string, number>;
  consumed: Record<string, number>;
  /** Objets sortis du jeu ou d'un joueur hors recettes : commandes PNJ, maîtres, bâtiments, gemmes serties… */
  delivered: Record<string, number>;
  /** Équipement tombé : par source, rareté, palier ; ensembles et nommés. */
  drops: { classic: Record<string, number>; sets: Record<string, number>; named: Record<string, number>; total: number; bySource: Record<string, number> };
  gemsSocketed: Record<string, number>;
  trials: { id: string; day: number; bot: number }[];
  notes: { day: number; text: string }[];
}

interface SimClan {
  id: number;
  members: Bot[];
  levels: Record<string, number>;
  progress: Record<string, Record<string, number>>;
}

export interface Bot extends Trader {
  persona: Persona;
  presence: PresenceProfile;
  name: string;
  joinDay: number;
  started: boolean;
  rand: () => number;
  professions: string[];
  clan: SimClan | null;
  gear: GearInstance[];
  nextGearId: number;
  ask: Map<string, number>;
  listed: Map<string, number>;
  /** Plan de travail en cours (pour les objets à garder). */
  plan: string[];
  /** Jours : dernier progrès de la route, dernière amélioration d'équipement. */
  lastRouteDay: number;
  lastBest: number;
  lastGearDay: number;
  lastGearScore: number;
  /** Jours bloqué au même endroit de la route, par étape. */
  stuck: Record<number, number>;
  /** Suivi quotidien. */
  history: { gold: number[]; best: number[]; classLevel: number[]; topLevel: number[]; gearScore: number[]; totalLevels: number[] };
  totals: { npcGold: number; trialGold: number; salesNet: number; purchases: number; clanGold: number; stall: number; repairs: number };
  /** Spéculateur : stock acheté et prix payé. */
  spec: Map<string, { qty: number; paid: number }>;
  classSwitches: number;
}

export interface ServerResult {
  options: Required<Omit<ServerOptions, 'hooks'>> & { hooks: string[] };
  bots: Bot[];
  clans: SimClan[];
  ledger: Ledger;
  /** Par jour : or en circulation, joueurs actifs, volume du marché, ordres ouverts. */
  days: { day: number; players: number; gold: number; volume: number; trades: number; asks: number; bids: number; unsold: number; tax: number }[];
  /** Prix moyen par objet et par semaine. */
  prices: Record<string, { ref: number; weekly: number[]; qty: number[] }>;
  refs: Record<string, number>;
  fightCache: { calls: number; hits: number; ms: number };
  runtimeSec: number;
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

function pick<T>(list: [T, number][], r: number): T {
  const total = list.reduce((s, [, w]) => s + w, 0);
  let acc = 0;
  for (const [v, w] of list) {
    acc += w / total;
    if (r < acc) return v;
  }
  return list.at(-1)![0];
}

const add = (m: Record<string, number>, k: string, v: number) => {
  if (v) m[k] = (m[k] ?? 0) + v;
};

const FIRST = ['Aldric', 'Brinn', 'Cora', 'Dagna', 'Eloi', 'Fenn', 'Garance', 'Hugo', 'Isaure', 'Jorun', 'Kaelo', 'Lise', 'Maelle', 'Nils', 'Orla', 'Pavel', 'Quentin', 'Rowan', 'Sacha', 'Thessa', 'Ulric', 'Vera', 'Wyatt', 'Xenia', 'Yann', 'Zelie'];
const LAST = ['Cendre', 'Brume', 'Lanterne', 'Pierre', 'Mousse', 'Givre', 'Braise', 'Ecume', 'Sauge', 'Corbeau', 'Ronce', 'Argile', 'Saule', 'Grêle'];

export function runServer(content: Content, input: ServerOptions): ServerResult {
  const t0 = performance.now();
  const opts = { initialShare: 0.6, joinDays: 30, hooks: [] as ServerHook[], ...input };
  const rand = rng(opts.seed);
  const combat = content.combat!;
  const stages = routeStages(combat);
  const cache = installFightCache();
  const traders = new Map<number, Trader>();
  const exchange = new Exchange(content, traders);
  const ledger: Ledger = {
    faucet: {},
    sink: {},
    produced: {},
    consumed: {},
    delivered: {},
    drops: { classic: {}, sets: {}, named: {}, total: 0, bySource: {} },
    gemsSocketed: {},
    trials: [],
    notes: [],
  };
  const note = (day: number, text: string) => ledger.notes.length < 3000 && ledger.notes.push({ day, text });
  const playable = content.professions.filter((p) => p.status === 'playable');
  const recipes = Object.values(content.recipes).filter((r) => !r.trial);
  const producers = new Map<string, Recipe[]>();
  for (const r of recipes) for (const o of r.outputs) producers.set(o.item, [...(producers.get(o.item) ?? []), r]);
  const lvl = (s: CharacterState, p: string) => skillLevel(s, p, content);

  // --- Prix de référence : 10 or par minute de travail de chaîne, qui croît avec le niveau requis ---
  const refCache = new Map<string, number>();
  const ref = (id: string, depth = 0): number => {
    const hit = refCache.get(id);
    if (hit !== undefined) return hit;
    const item = content.items[id];
    let value = Math.max(1, item?.value ?? 1);
    if (item?.category === 'vestige') value = VESTIGE_REF;
    else
      try {
        const c = unitCost(id, content);
        const top = Math.max(1, ...Object.values(c.levels));
        value = Math.max(1, Math.round((GOLD_PER_MIN * workSec(c) * 2 ** ((top - 1) / 55)) / 60));
      } catch {
        // Sans source de récolte (vestiges dans la chaîne) : intrants + temps de fabrication.
        const r = producers.get(id)?.[0];
        if (r && depth < 4) {
          const out = r.outputs.find((o) => o.item === id)!.qty;
          value = Math.max(1, Math.round((r.inputs.reduce((s, i) => s + i.qty * ref(i.item, depth + 1), 0) + (GOLD_PER_MIN * r.durationSec) / 60) / out));
        }
      }
    refCache.set(id, value);
    return value;
  };

  // --- Joueurs ---
  const mix = MIXES[opts.mix];
  if (!mix) throw new Error(`Composition inconnue : ${opts.mix} (connues : ${Object.keys(MIXES).join(', ')})`);
  const personaList: [Persona, number][] = Object.entries(mix).map(([id, w]) => [PERSONAS.find((p) => p.id === id)!, w]);
  const bots: Bot[] = [];
  for (let i = 0; i < opts.players; i++) {
    const persona = pick(personaList, rand());
    const presence = PROFILES[pick(persona.presence, rand())]!;
    const late = i >= Math.round(opts.players * opts.initialShare);
    const r = rng(opts.seed * 7919 + i);
    // Métiers : selon les familles préférées, au hasard parmi les jouables.
    const professions: string[] = [];
    for (let k = 0; k < persona.professions.count; k++) {
      const fam = persona.professions.families[k % persona.professions.families.length]!;
      const pool = playable.filter((p) => p.family === fam && !professions.includes(p.id));
      const p = pool[Math.floor(r() * pool.length)];
      if (p) professions.push(p.id);
    }
    bots.push({
      id: i + 1,
      state: undefined as unknown as CharacterState,
      persona,
      presence,
      name: `${FIRST[i % FIRST.length]} ${LAST[(i * 7 + 3) % LAST.length]}`,
      joinDay: late ? Math.floor(1 + rand() * opts.joinDays) : 0,
      started: false,
      rand: r,
      professions,
      clan: null,
      gear: [],
      nextGearId: 1,
      ask: new Map(),
      listed: new Map(),
      plan: [],
      lastRouteDay: 0,
      lastBest: 0,
      lastGearDay: 0,
      lastGearScore: 0,
      stuck: {},
      history: { gold: [], best: [], classLevel: [], topLevel: [], gearScore: [], totalLevels: [] },
      totals: { npcGold: 0, trialGold: 0, salesNet: 0, purchases: 0, clanGold: 0, stall: 0, repairs: 0 },
      spec: new Map(),
      classSwitches: 0,
    });
  }
  // Clans : les joueurs qui veulent un clan, par groupes de 5 à 15.
  const clans: SimClan[] = [];
  {
    const willing = bots.filter((b) => rand() < b.persona.clan).sort(() => rand() - 0.5);
    let next = 0;
    while (next < willing.length) {
      const size = Math.min(willing.length - next, 5 + Math.floor(rand() * 11));
      const clan: SimClan = { id: clans.length + 1, members: willing.slice(next, next + size), levels: {}, progress: {} };
      for (const m of clan.members) m.clan = clan;
      clans.push(clan);
      next += size;
    }
  }
  const firstSession = (b: Bot) => Math.min(...b.presence.sessions.map((s) => s.at));

  // --- Classe et voie : la méta suit ce qui marche le mieux sur le serveur ---
  const classIds = Object.keys(combat.kits);
  const classScore = (): Record<string, number> => {
    const out: Record<string, number> = {};
    for (const c of classIds) {
      const xs = bots.filter((b) => b.started && b.state.classId === c && b.persona.classPick === 'meta').map((b) => b.state.combat.route.best);
      out[c] = xs.length >= 3 ? xs.reduce((s, x) => s + x, 0) / xs.length : 0;
    }
    return out;
  };
  const pickClass = (b: Bot): string => {
    if (b.persona.classPick === 'meta') {
      const sc = classScore();
      const best = Object.entries(sc).sort((a, c) => c[1] - a[1])[0]!;
      if (best[1] > 0 && b.rand() < 0.7) return best[0];
    }
    return classIds[Math.floor(b.rand() * classIds.length)]!;
  };
  const pickPath = (b: Bot): string | null => {
    const classId = b.state.classId!;
    const paths = combat.kits[classId]!.paths;
    if (b.persona.classPick === 'meta') {
      const score = (pid: string) => {
        const xs = bots.filter((x) => x.started && x.state.classId === classId && x.state.combat.paths[classId] === pid).map((x) => x.state.combat.route.best);
        return xs.length >= 3 ? xs.reduce((s, v) => s + v, 0) / xs.length : -1;
      };
      const ranked = paths.map((p) => ({ p, s: score(p.id) })).sort((a, c) => c.s - a.s);
      if (ranked[0]!.s > 0 && b.rand() < 0.75) return ranked[0]!.p.id;
      return paths.find((p) => p.role === 'damage')?.id ?? paths[0]!.id;
    }
    return paths[Math.floor(b.rand() * paths.length)]!.id;
  };

  // --- Équipement ---
  const syncEquipment = (b: Bot) => {
    b.state.equipment = b.gear.filter((g) => g.equipped).map((g) => ({ model: g.model, lines: g.lines, ...(g.gem ? { gem: g.gem } : {}) }));
  };
  const grantGear = (b: Bot, modelId: string, source: string) => {
    const m = content.gearModels[modelId];
    if (!m) return;
    const g = newInstance(m, content, b.rand, { id: b.nextGearId++ });
    b.gear.push(g);
    ledger.drops.total++;
    add(ledger.drops.bySource, source, 1);
    if (m.set) add(ledger.drops.sets, m.set, 1);
    else if (m.talent) add(ledger.drops.named, m.talent, 1);
    else add(ledger.drops.classic, `${m.rarity}:${m.tier}`, 1);
  };
  const giveStarter = (b: Bot) => {
    const classId = b.state.classId!;
    for (const m of Object.values(content.gearModels)) {
      if (!m.starter || !m.classes.includes(classId)) continue;
      if (b.gear.some((g) => g.model === m.id)) continue;
      const g = newInstance(m, content, b.rand, { id: b.nextGearId++ });
      b.gear.push(g);
    }
  };
  /** Le mur du joueur : l'étape qui le bloque (ou la dernière franchie). */
  const wallStage = (b: Bot) => stages[Math.min(b.state.combat.route.best, stages.length - 1)]!;
  const scoreOf = (b: Bot, gear: GearInstance[]): number => {
    const s = { ...b.state, equipment: gear.filter((g) => g.equipped).map((g) => ({ model: g.model, lines: g.lines, ...(g.gem ? { gem: g.gem } : {}) })) } as CharacterState;
    const st = wallStage(b);
    const setup = combatantOf(s, content);
    const r = probe(combat, setup, combat.encounters[st.encounter]!, tierFactorAt(combat.rules, st.tier));
    // Gagner d'abord ; à victoires égales, vite ; sans victoire, entamer le plus l'ennemi.
    return r.winRate * 2 - (r.winRate > 0 ? r.time / 2000 : r.hpLeft);
  };
  const heuristic = (m: GearModel) => m.tier * 10 + RARITY_RANK[m.rarity]! * 2 + (m.talent ? 3 : 0) + (m.set ? 1 : 0);
  const gearScoreNow = (b: Bot) => {
    const w = wornGear(b.state, content);
    return w ? wallIndex(w.stats) : 0;
  };
  /** Choisit son équipement : en vrai combat contre son mur (joueurs qui calculent), ou à l'œil (palier, rareté). */
  const equipBest = (b: Bot) => {
    const classId = b.state.classId;
    if (!classId) return;
    const owned = b.gear.filter((g) => {
      const m = content.gearModels[g.model];
      return m && canWear(m, classId);
    });
    const bySlot = new Map<string, GearInstance[]>();
    for (const g of owned) {
      const slot = content.gearModels[g.model]!.slot;
      bySlot.set(slot, [...(bySlot.get(slot) ?? []), g]);
    }
    let gear = b.gear.map((g) => ({ ...g, equipped: owned.includes(g) ? g.equipped : null }));
    const setSlot = (list: GearInstance[], slot: string, ids: number[]) =>
      list.map((g) => (content.gearModels[g.model]!.slot === slot ? { ...g, equipped: ids.includes(g.id) ? slot : null } : g));
    for (const [slot, list] of bySlot) {
      const cap = content.gearSlots[slot]?.capacity ?? 1;
      const ranked = [...list].sort((a, c) => heuristic(content.gearModels[c.model]!) - heuristic(content.gearModels[a.model]!) || c.lines.length - a.lines.length);
      if (!b.persona.gearByFight) {
        gear = setSlot(gear, slot, ranked.slice(0, cap).map((g) => g.id));
        continue;
      }
      // Calcul : les 4 meilleures à l'œil, essayées une à une contre le mur.
      const current = gear.filter((g) => g.equipped === slot).map((g) => g.id);
      let best = { ids: current, score: scoreOf(b, gear) };
      for (const cand of ranked.slice(0, 4)) {
        if (current.includes(cand.id)) continue;
        const ids = cap > 1 ? [cand.id, ...current.filter((x) => x !== cand.id)].slice(0, cap) : [cand.id];
        const trial = setSlot(gear, slot, ids);
        const sc = scoreOf(b, trial);
        if (sc > best.score + 1e-9) best = { ids, score: sc };
      }
      gear = setSlot(gear, slot, best.ids);
    }
    // Ensembles : essayer de porter ensemble les pièces d'un même ensemble.
    if (b.persona.gearByFight) {
      const sets = new Map<string, GearInstance[]>();
      for (const g of owned) {
        const m = content.gearModels[g.model]!;
        if (m.set) sets.set(m.set, [...(sets.get(m.set) ?? []), g]);
      }
      for (const [, pieces] of sets) {
        const slots = new Set(pieces.map((g) => content.gearModels[g.model]!.slot));
        if (slots.size < 2) continue;
        let trial = gear;
        for (const slot of slots) {
          const best = pieces.filter((g) => content.gearModels[g.model]!.slot === slot).sort((a, c) => heuristic(content.gearModels[c.model]!) - heuristic(content.gearModels[a.model]!))[0]!;
          trial = setSlot(trial, slot, [best.id]);
        }
        if (scoreOf(b, trial) > scoreOf(b, gear) + 1e-9) gear = trial;
      }
    }
    // Les gemmes restent sur leur pièce : si la pièce change, la gemme est rendue au sac.
    for (const g of gear) {
      if (g.gem && !g.equipped) {
        const item = gemItemOf(g.gem, content);
        if (item) addStack(b.state.inventory, item, 1);
        g.gem = null;
      }
    }
    b.gear = gear;
    syncEquipment(b);
  };

  /** Gemme de situation devant un mur : celle de sa mécanique, achetée ou dans le sac, sertie si elle aide. */
  const useGems = (b: Bot, day: number) => {
    if (!b.persona.gems || !b.state.classId) return;
    if (day - b.lastRouteDay < 2) return;
    const st = wallStage(b);
    const fams = relevantFamilies(combat.encounters[st.encounter]!);
    const gems = Object.values(combat.tools).filter((t) => t.rank === 'gem' && fams.includes(t.family));
    const worn = b.gear.filter((g) => g.equipped && canHoldGem(content.gearModels[g.model]!));
    if (!worn.length) return;
    for (const tool of gems) {
      if (worn.some((g) => g.gem === tool.id)) continue;
      const item = gemItemOf(tool.id, content);
      if (!item) continue;
      if (!(b.state.inventory[item] ?? 0)) {
        const ask = exchange.asks(item, b.id)[0];
        if (!ask || ask.price > b.state.gold * 0.5) continue;
        const r = buy(b, item, 1, ask.price, false);
        if (!r.qty) continue;
        b.totals.purchases += r.gold;
      }
      const host = worn.find((g) => !g.gem) ?? worn[0]!;
      const before = scoreOf(b, b.gear);
      const res = socketGem(b.gear, host.id, item, content);
      const after = scoreOf(b, res.items);
      if (after > before + 1e-9) {
        b.gear = res.items;
        addStack(b.state.inventory, res.take, -1);
        if (res.give) addStack(b.state.inventory, res.give, 1);
        add(ledger.gemsSocketed, tool.id, 1);
        add(ledger.delivered, item, 1);
        syncEquipment(b);
        note(day, `${b.name} sertit ${content.items[item]!.name} devant ${combat.encounters[st.encounter]!.name}`);
        return;
      }
    }
  };

  // --- Marché ---
  /** Acheter : les objets durables (outils) se prennent offre par offre, le reste par ordre. */
  const buy = (b: Bot, item: string, qty: number, limit: number, rest: boolean): { qty: number; gold: number } => {
    if (!content.items[item]?.tool) return exchange.buy(b, item, qty, limit, rest);
    let got = 0;
    let gold = 0;
    for (const a of exchange.asks(item, b.id)) {
      if (got >= qty || a.price > limit) break;
      if (exchange.fill(b, a)) {
        got++;
        gold += a.price;
      }
    }
    return { qty: got, gold };
  };
  const lowestAsk = (item: string, self: number) => exchange.asks(item, self)[0]?.price;
  const highestBid = (item: string, self: number) => exchange.bids(item, self)[0]?.price;
  const buyEstimate = (item: string, self: number) => lowestAsk(item, self) ?? Math.round(ref(item) * 1.3);
  const sellEstimate = (item: string, self: number) => highestBid(item, self) ?? Math.round((lowestAsk(item, self) ?? ref(item) * 1.1) * 0.97);
  /** Prix moyen récent (7 jours) d'un objet. */
  const recent = new Map<string, number[]>();
  const avgPrice = (item: string) => {
    const xs = recent.get(item);
    return xs?.length ? xs.reduce((s, x) => s + x, 0) / xs.length : ref(item);
  };

  const askPrice = (b: Bot, item: string): number => {
    const low = lowestAsk(item, b.id);
    const m = b.ask.get(item) ?? 1.15;
    switch (b.persona.priceStyle) {
      case 'dumper':
        return Math.max(1, Math.round(Math.min(low ?? ref(item), ref(item)) * 0.7));
      case 'speculator':
        return Math.max(1, Math.round(Math.max(avgPrice(item) * 1.12, ref(item) * 0.8)));
      default:
        // Un vendeur normal s'aligne sur l'offre la moins chère, sans descendre sous la moitié de la référence.
        return Math.max(1, Math.round(low !== undefined ? Math.max(low, ref(item) * 0.5 * m) : ref(item) * m));
    }
  };
  const adaptPrices = (b: Bot) => {
    const sold = exchange.sold.get(b.id);
    for (const v of sold?.values() ?? []) b.totals.salesNet += v.gross * (1 - content.settings.market.taxShare);
    for (const [item, qty] of b.listed) {
      const got = sold?.get(item)?.qty ?? 0;
      const m = b.ask.get(item) ?? 1.15;
      b.ask.set(item, Math.min(3, Math.max(0.5, got >= qty * 0.9 ? m * 1.06 : got < qty * 0.2 ? m * 0.9 : m * 0.98)));
    }
    exchange.sold.delete(b.id);
    exchange.bought.delete(b.id);
    b.listed.clear();
  };

  const tools = (p: string): Item[] =>
    Object.values(content.items)
      .filter((i) => i.tool?.profession === p)
      .sort((a, c) => c.tool!.bonus - a.tool!.bonus);
  const toolUpkeep = (b: Bot) => {
    for (const p of b.professions) {
      const list = tools(p);
      if (!list.length) continue;
      for (const item of list) {
        if (!b.state.inventory[item.id]) continue;
        const copies = copiesRemaining(b.state, item.id, content);
        if (!copies.some((r) => r <= 0.1 * (item.tool!.durabilityHours ?? 1) * HOUR)) continue;
        const cost = repairCost(item.id, b.state, content);
        if (cost > 0 && b.state.gold >= cost) {
          b.state = repairItem(b.state, item.id, content);
          traders.get(b.id)!.state = b.state;
          add(ledger.sink, 'réparations PNJ', cost);
          b.totals.repairs += cost;
        }
      }
      const have = activeTool(p, b.state, content);
      if (have && have.bonus >= list[0]!.tool!.bonus) continue;
      let done = false;
      for (const item of list) {
        if (have && item.tool!.bonus <= have.bonus) break;
        const ask = exchange.asks(item.id, b.id)[0];
        const budget = have ? b.state.gold / 3 : b.state.gold * 0.8;
        if (ask && ask.price <= budget && exchange.fill(b, ask)) {
          b.totals.purchases += ask.price;
          done = true;
          break;
        }
      }
      if (!done && !have) {
        for (const item of [...list].reverse()) {
          if (!item.stallPrice || exchange.asks(item.id).length || b.state.gold < item.stallPrice) continue;
          b.state.gold -= item.stallPrice;
          addStack(b.state.inventory, item.id, 1);
          add(ledger.sink, 'étal de la guilde', item.stallPrice);
          b.totals.stall += item.stallPrice;
          break;
        }
      }
    }
  };

  const meals = (b: Bot) => {
    if (b.persona.skill < 0.3) return;
    const L = Math.max(...b.professions.map((p) => lvl(b.state, p)));
    const pantry = Object.values(b.state.pantry ?? {}).reduce((s, n) => s + (n as number), 0);
    if (pantry > 6) return;
    for (const item of Object.values(content.items)) {
      if (!item.meal) continue;
      // Ses propres repas d'abord.
      const own = b.state.inventory[item.id] ?? 0;
      if (own > 0) {
        b.state = stockPantry(b.state, item.id, Math.min(own, 6), content);
        traders.get(b.id)!.state = b.state;
        continue;
      }
      const ask = exchange.asks(item.id, b.id)[0];
      if (!ask) continue;
      const benefit = item.meal.bonus * item.meal.durationMin * GOLD_PER_MIN * 2 ** ((L - 1) / 55) * 0.6;
      if (ask.price <= benefit && b.state.gold >= ask.price * 4 + 50) {
        const r = buy(b, item.id, 3, ask.price, false);
        if (r.qty) {
          b.totals.purchases += r.gold;
          b.state = stockPantry(b.state, item.id, r.qty, content);
          traders.get(b.id)!.state = b.state;
        }
      }
    }
  };

  const npcOrders = (b: Bot, t: number) => {
    for (const o of npcOrdersOfDay(b.state, t, content)) {
      if (b.persona.skill >= 0.3) {
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
          if (need <= 0 && cost <= o.gold * 0.7 && cost <= b.state.gold) b.totals.purchases += buy(b, s.item, s.qty - have, top, false).gold;
        }
      }
      try {
        const before = b.state.gold;
        const inv = { ...b.state.inventory };
        b.state = completeNpcOrder(b.state, o.id, t, content);
        traders.get(b.id)!.state = b.state;
        const earned = b.state.gold - before;
        b.totals.npcGold += earned;
        add(ledger.faucet, 'commandes PNJ', earned);
        for (const s of o.items) add(ledger.delivered, s.item, Math.min(s.qty, inv[s.item] ?? 0));
      } catch (e) {
        if (!(e instanceof GameError)) throw e;
      }
    }
  };

  /** Commandes du maître : livrer dès qu'on a tout ; sinon acheter ce qui manque si c'est raisonnable. */
  const trials = (b: Bot, day: number) => {
    for (const p of b.professions) {
      const trial = nextTrial(p, b.state.trials, content);
      if (!trial || lvl(b.state, p) < trial.rank) continue;
      if (b.persona.trials) {
        for (const task of trial.tasks) {
          const need = task.qty - (b.state.inventory[task.item] ?? 0);
          if (need <= 0) continue;
          const asks = exchange.asks(task.item, b.id);
          const limit = Math.round(ref(task.item) * 2);
          if (asks.reduce((n, a) => n + (a.price <= limit ? a.qty : 0), 0) >= need && b.state.gold > need * limit * 1.5) {
            b.totals.purchases += buy(b, task.item, need, limit, false).gold;
          }
        }
      }
      try {
        const before = b.state.gold;
        b.state = completeTrial(b.state, trial.id, content);
        traders.get(b.id)!.state = b.state;
        const earned = b.state.gold - before;
        b.totals.trialGold += earned;
        add(ledger.faucet, 'commandes du maître', earned);
        for (const task of trial.tasks) add(ledger.delivered, task.item, task.qty);
        ledger.trials.push({ id: trial.id, day, bot: b.id });
      } catch (e) {
        if (!(e instanceof GameError)) throw e;
      }
    }
  };

  // --- Clans ---
  const RESERVE = 300;
  const contributeToClan = (b: Bot, day: number) => {
    const clan = b.clan;
    if (!clan) return;
    const active = clan.members.filter((m) => m.started).length;
    let budget = Math.max(0, b.state.gold - RESERVE) * b.persona.clanGenerosity;
    const own = Object.values(content.buildings).find((x) => b.professions.some((p) => x.boost.professions.includes(p)))?.id;
    const order = [own, 'hall', ...Object.keys(content.buildings).sort((x, y) => (clan.levels[x] ?? 0) - (clan.levels[y] ?? 0))].filter(
      (id, i, all): id is string => !!id && all.indexOf(id) === i && !!content.buildings[id],
    );
    for (const id of order) {
      const def = content.buildings[id]!;
      const level = clan.levels[id] ?? 0;
      if (level >= def.maxLevel) continue;
      const needs = buildingNeeds(id, level + 1, active, content);
      const prog = (clan.progress[id] ??= {});
      for (const it of needs.items) {
        const rem = it.qty - (prog[it.item] ?? 0);
        if (rem <= 0) continue;
        let give = Math.min(rem, b.state.inventory[it.item] ?? 0);
        if (give <= 0 && budget > 0) {
          const bought = buy(b, it.item, Math.min(rem, 300), Math.max(2, Math.round(ref(it.item) * 2)), true);
          b.totals.purchases += bought.gold;
          budget -= bought.gold;
          give = Math.min(rem, b.state.inventory[it.item] ?? 0);
        }
        if (give > 0) {
          addStack(b.state.inventory, it.item, -give);
          prog[it.item] = (prog[it.item] ?? 0) + give;
          add(ledger.delivered, it.item, give);
        }
      }
      const remGold = needs.gold - (prog.gold ?? 0);
      if (remGold > 0 && budget > 0) {
        const g = Math.min(remGold, Math.floor(budget));
        if (g > 0) {
          b.state.gold -= g;
          prog.gold = (prog.gold ?? 0) + g;
          budget -= g;
          b.totals.clanGold += g;
          add(ledger.sink, 'bâtiments de clan', g);
        }
      }
      if ((prog.gold ?? 0) >= needs.gold && needs.items.every((i) => (prog[i.item] ?? 0) >= i.qty)) {
        clan.levels[id] = level + 1;
        clan.progress[id] = {};
        for (const m of clan.members) if (m.started) m.state.clanBonuses = memberBonuses(clan.levels, content);
        note(day, `Clan ${clan.id} : ${def.name} niveau ${level + 1}`);
      }
    }
  };

  // --- Travail : choisir quoi produire ---
  interface Plan {
    steps: { recipe: Recipe; qty: number }[];
    keep: string[];
    label: string;
  }
  const canDo = (b: Bot, r: Recipe) => b.professions.includes(r.profession) && r.level <= lvl(b.state, r.profession);
  /** Pour se fournir, tout le monde peut faire n'importe quel métier à son niveau (on récolte son minerai soi-même). */
  const canFeed = (b: Bot, r: Recipe) => r.level <= lvl(b.state, r.profession);
  /** Secondes de travail pour produire soi-même une unité (récolte, ou fabrication intermédiaire depuis la récolte). */
  const selfTime = (b: Bot, item: string, depth = 0): { sec: number; chain: { recipe: Recipe; perUnit: number }[] } | null => {
    if (depth > 2) return null;
    let best: { sec: number; chain: { recipe: Recipe; perUnit: number }[] } | null = null;
    for (const r of producers.get(item) ?? []) {
      if (!canFeed(b, r)) continue;
      const out = r.outputs.find((o) => o.item === item)!.qty;
      let sec = r.durationSec / out;
      const chain: { recipe: Recipe; perUnit: number }[] = [];
      let ok = true;
      for (const i of r.inputs) {
        const have = b.state.inventory[i.item] ?? 0;
        if (have >= i.qty * 50) continue;
        const sub = selfTime(b, i.item, depth + 1);
        if (!sub) {
          ok = false;
          break;
        }
        sec += (sub.sec * i.qty) / out;
        for (const c of sub.chain) chain.push({ recipe: c.recipe, perUnit: (c.perUnit * i.qty) / out });
      }
      if (!ok) continue;
      chain.push({ recipe: r, perUnit: 1 / out });
      if (!best || sec < best.sec) best = { sec, chain };
    }
    return best;
  };

  const choosePlan = (b: Bot, horizonSec: number): Plan | null => {
    const candidates: { score: number; plan: Plan; xps: number; gps: number }[] = [];
    // Le métier travaillé : un joueur qui cherche l'or prend le plus rentable ; les autres montent leurs métiers ensemble
    // (le moins avancé d'abord, le principal un peu devant).
    const target =
      b.persona.goal === 'gold'
        ? null
        : [...b.professions].sort((x, y) => lvl(b.state, x) - (x === b.professions[0] ? 3 : 0) - (lvl(b.state, y) - (y === b.professions[0] ? 3 : 0)))[0]!;
    for (const p of b.professions) {
      if (target && p !== target) continue;
      for (const r of recipes) {
        if (r.profession !== p || !canDo(b, r) || r.category === 'masterwork') continue;
        // Temps par fabrication, avec ce qu'il faut produire soi-même avant.
        let sec = r.durationSec;
        let buyCost = 0;
        const pre: { recipe: Recipe; perUnit: number }[] = [];
        const buys: { item: string; qty: number; price: number }[] = [];
        let ok = true;
        for (const i of r.inputs) {
          const have = b.state.inventory[i.item] ?? 0;
          if (have >= i.qty * 20) continue;
          const self = selfTime(b, i.item);
          const askP = lowestAsk(i.item, b.id);
          const askQty = exchange.asks(i.item, b.id).reduce((n, a) => n + a.qty, 0);
          // Un joueur qui calcule achète si c'est moins cher que son temps ; les autres produisent s'ils peuvent.
          const timeValue = self ? (self.sec * i.qty * GOLD_PER_MIN) / 60 : Infinity;
          if (askP !== undefined && askQty >= i.qty * 5 && (!self || (b.persona.goal === 'gold' && askP * i.qty < timeValue * 0.8))) {
            buyCost += askP * i.qty;
            buys.push({ item: i.item, qty: i.qty, price: askP });
          } else if (self) {
            sec += self.sec * i.qty;
            for (const c of self.chain) pre.push({ recipe: c.recipe, perUnit: c.perUnit * i.qty });
          } else {
            ok = false;
            break;
          }
        }
        if (!ok) continue;
        if (pre.length > 3) continue;
        const xp = r.xp + pre.reduce((s, c) => s + c.recipe.xp * c.perUnit, 0);
        const value = r.outputs.reduce((s, o) => s + o.qty * sellEstimate(o.item, b.id), 0);
        const xps = xp / sec;
        const gps = (value - buyCost) / sec;
        const n = Math.max(1, Math.min(content.settings.activity.maxQuantity, Math.floor(horizonSec / sec)));
        const affordable = buyCost > 0 ? Math.floor((b.state.gold * 0.6) / buyCost) : n;
        const qty = Math.max(1, Math.min(n, affordable));
        if (buyCost > 0 && affordable < 1) continue;
        // Étapes : ce qu'il faut produire avant, regroupé par recette, puis la fabrication.
        const merged = new Map<string, { recipe: Recipe; qty: number }>();
        for (const c of pre) {
          const cur = merged.get(c.recipe.id) ?? { recipe: c.recipe, qty: 0 };
          cur.qty += c.perUnit * qty;
          merged.set(c.recipe.id, cur);
        }
        const steps = [...merged.values()].map((s) => ({ recipe: s.recipe, qty: Math.ceil(s.qty) }));
        steps.push({ recipe: r, qty });
        candidates.push({
          score: 0,
          xps,
          gps,
          plan: { steps, keep: [...r.inputs.map((i) => i.item), ...pre.flatMap((c) => c.recipe.inputs.map((i) => i.item)), ...buys.map((x) => `buy:${x.item}:${x.qty * qty}:${x.price}`)], label: r.name },
        });
      }
    }
    if (!candidates.length) {
      // Rien de faisable : la meilleure récolte de ses métiers, sinon une récolte de base.
      const gathers = recipes.filter((r) => r.inputs.length === 0 && canFeed(b, r) && (b.professions.includes(r.profession) || r.level === 1));
      const best = gathers.filter((r) => b.professions.includes(r.profession)).sort((x, y) => y.xp / y.durationSec - x.xp / x.durationSec)[0] ?? gathers[0];
      return best ? { steps: [{ recipe: best, qty: Math.floor(horizonSec / best.durationSec) }], keep: [], label: `${best.name} (faute de mieux)` } : null;
    }
    const maxX = Math.max(...candidates.map((c) => c.xps), 1e-9);
    const maxG = Math.max(...candidates.map((c) => c.gps), 1e-9);
    for (const c of candidates) {
      const x = c.xps / maxX;
      const g = c.gps / maxG;
      const base = b.persona.goal === 'xp' ? x * 0.8 + g * 0.2 : b.persona.goal === 'gold' ? g * 0.8 + x * 0.2 : (x + g) / 2;
      c.score = base * (1 + (1 - b.persona.skill) * (b.rand() - 0.5) * 1.5);
    }
    candidates.sort((a, c) => c.score - a.score);
    return candidates[0]!.plan;
  };

  const applyPlan = (b: Bot, t: number, plan: Plan) => {
    // Achats d'abord.
    for (const k of plan.keep) {
      if (!k.startsWith('buy:')) continue;
      const [, item, qty, price] = k.split(':');
      const need = Number(qty) - (b.state.inventory[item!] ?? 0);
      if (need > 0) b.totals.purchases += buy(b, item!, need, Math.ceil(Number(price) * 1.1), false).gold;
    }
    const { queueLength, maxQuantity } = content.settings.activity;
    let s = b.state;
    let first = true;
    for (const step of plan.steps.slice(0, queueLength + 1)) {
      try {
        s = startActivity(s, step.recipe.id, Math.max(1, Math.min(maxQuantity, step.qty)), first ? 'replace' : 'queue', t, content);
        if (first) s = { ...s, queue: [] };
        first = false;
      } catch (e) {
        if (!(e instanceof GameError)) throw e;
      }
    }
    b.state = s;
    traders.get(b.id)!.state = s;
    b.plan = plan.keep.filter((k) => !k.startsWith('buy:'));
  };

  // --- Vendre ce qu'on ne garde pas ---
  const keepSet = (b: Bot): Set<string> => {
    const keep = new Set(b.plan);
    for (const p of b.professions) {
      const tr = nextTrial(p, b.state.trials, content);
      if (tr && b.persona.trials) for (const task of tr.tasks) keep.add(task.item);
    }
    if (b.professions.includes('jewelcrafting')) for (const i of Object.values(content.items)) if (i.category === 'vestige') keep.add(i.id);
    return keep;
  };
  const sellSurplus = (b: Bot) => {
    if (b.persona.priceStyle === 'hoarder') return;
    const keep = keepSet(b);
    for (const [item, qty] of Object.entries(b.state.inventory)) {
      const def = content.items[item];
      if (!def || qty <= 0) continue;
      if (keep.has(item)) continue;
      // Les gemmes : on garde celles de sa propre route.
      if (def.gem && b.persona.gems) continue;
      // Les repas se gardent pour le garde-manger.
      if (def.meal && b.persona.skill >= 0.3 && qty <= 12) continue;
      if (def.tool) {
        const mine = b.professions.includes(def.tool.profession);
        const n = qty - (mine ? 1 : 0);
        for (let i = 0; i < n; i++) {
          const r = exchange.sell(b, item, 1, askPrice(b, item), 0);
          
        }
        if (n > 0) b.listed.set(item, n);
        continue;
      }
      const r = exchange.sell(b, item, qty, askPrice(b, item));
      
      b.listed.set(item, qty);
    }
  };

  /** Spéculateur : achète ce qui est bradé sous 70 % du prix moyen, le revend plus haut (sellSurplus s'en charge). */
  const speculate = (b: Bot) => {
    if (b.persona.priceStyle !== 'speculator') return;
    let budget = b.state.gold * 0.5;
    for (const item of recent.keys()) {
      if (budget <= 50) break;
      const ask = lowestAsk(item, b.id);
      if (ask === undefined) continue;
      const avg = avgPrice(item);
      if (ask < avg * 0.7) {
        const qty = Math.min(200, Math.floor(budget / ask / 3));
        if (qty <= 0) continue;
        const r = buy(b, item, qty, Math.round(avg * 0.75), false);
        budget -= r.gold;
        b.totals.purchases += r.gold;
        if (r.qty) {
          const cur = b.spec.get(item) ?? { qty: 0, paid: 0 };
          b.spec.set(item, { qty: cur.qty + r.qty, paid: cur.paid + r.gold });
        }
      }
    }
  };

  /** Le métier le plus rentable du moment (chasseurs de profit : une fois par semaine). */
  const chaseProfit = (b: Bot, day: number) => {
    if (day % 7 !== 0 || b.rand() >= b.persona.chaseProfit) return;
    let best: { p: string; gps: number } | null = null;
    for (const p of playable) {
      if (p.family !== 'gathering') continue;
      const L = lvl(b.state, p.id);
      for (const r of recipes) {
        if (r.profession !== p.id || r.inputs.length || r.level > Math.max(L, 1)) continue;
        const gps = r.outputs.reduce((s, o) => s + o.qty * sellEstimate(o.item, b.id), 0) / r.durationSec;
        if (!best || gps > best.gps) best = { p: p.id, gps };
      }
    }
    if (best && !b.professions.includes(best.p)) {
      const gather = b.professions.findIndex((p) => content.professions.find((x) => x.id === p)?.family === 'gathering');
      if (gather >= 0) {
        note(day, `${b.name} change de récolte : ${b.professions[gather]} → ${best.p}`);
        b.professions[gather] = best.p;
      }
    }
  };

  // --- Une visite ---
  const step = (b: Bot, to: number) => {
    syncEquipment(b);
    const { state, summary } = advance(b.state, to, content);
    b.state = state;
    traders.get(b.id)!.state = state;
    for (const [k, v] of Object.entries(summary.produced)) add(ledger.produced, k, v);
    for (const [k, v] of Object.entries(summary.consumed)) add(ledger.consumed, k, v);
    for (const [k, v] of Object.entries(summary.combat.vestiges)) add(ledger.produced, k, v);
    for (const l of summary.combat.loot) grantGear(b, l.model, l.encounter);
  };

  const start = (b: Bot, t: number) => {
    b.state = newCharacterState(t, content);
    b.state.seed = b.id;
    b.state.clanBonuses = memberBonuses(b.clan?.levels ?? null, content);
    b.started = true;
    traders.set(b.id, b);
    b.state = chooseClass(b.state, pickClass(b), content);
    giveStarter(b);
    equipBest(b);
  };

  const horizon = (b: Bot, t: number) => {
    // Jusqu'à la prochaine visite + l'autonomie, au plus 16 h de travail.
    return Math.min(16 * 3600, 24 * 3600);
  };

  const ctx: HookContext = { content, bots, exchange, ledger, rand, gearOf: (b) => b.gear, grantGear, equipBest };

  const act = (b: Bot, t: number, day: number) => {
    adaptPrices(b);
    exchange.cancelAll(b);
    // Coups de fouet.
    const charges = Math.floor(b.persona.energy) + (b.rand() < b.persona.energy % 1 ? 1 : 0);
    for (let i = 0; i < charges; i++) {
      if (energyChargesLeft(b.state.energy, t, content.settings) <= 0) break;
      b.state = activateEnergy(b.state, t, content);
    }
    npcOrders(b, t);
    trials(b, day);
    toolUpkeep(b);
    // Voie : dès le niveau de voie.
    const classId = b.state.classId!;
    if (!b.state.combat.paths[classId] && classLevel(b.state, classId, content) >= combat.pathLevel) {
      const path = pickPath(b);
      if (path) b.state = choosePath(b.state, path, content);
    }
    // La méta change de classe si une autre fait nettement mieux (une fois au plus par mois).
    if (b.persona.classPick === 'meta' && day % 30 === 15 && b.classSwitches < 2) {
      const sc = classScore();
      const mine = sc[classId] ?? 0;
      const best = Object.entries(sc).sort((a, c) => c[1] - a[1])[0]!;
      if (best[0] !== classId && best[1] > mine * 1.25 && b.rand() < 0.3) {
        b.state = chooseClass(b.state, best[0], content);
        b.classSwitches++;
        giveStarter(b);
        note(day, `${b.name} passe ${best[0]} (la méta fait mieux)`);
      }
    }
    if (day - b.lastGearDay >= b.persona.gearEvery) {
      equipBest(b);
      b.lastGearDay = day;
    }
    useGems(b, day);
    contributeToClan(b, day);
    meals(b);
    chaseProfit(b, day);
    for (const h of opts.hooks) h.onVisit?.(ctx, b, t, day);
    // L'onglet oublié ne relance son métier que quand il n'a plus rien.
    if (b.persona.id === 'afk' && b.state.activity) {
      sellSurplus(b);
      return;
    }
    const plan = choosePlan(b, horizon(b, t));
    if (process.env.DEBUG_PLAN && day < 3) console.log(day, b.name, b.professions.join('/'), '→', plan?.label, plan?.steps.map((x) => `${x.recipe.id}×${x.qty}`).join(' > '));
    if (plan) applyPlan(b, t, plan);
    sellSurplus(b);
    speculate(b);
  };

  // --- Boucle des jours ---
  const dayRows: ServerResult['days'] = [];
  const priceWeeks = new Map<string, { gross: number; qty: number }[]>();
  let lastTax = 0;
  let lastVolume = 0;
  let lastTrades = 0;
  for (let day = 0; day < opts.days; day++) {
    const dayStart = SIM_START + day * DAY;
    exchange.day = day;
    const active = bots.filter((b) => b.joinDay <= day);
    for (const b of [...active].sort((a, c) => firstSession(a) - firstSession(c))) {
      const t = dayStart + firstSession(b) * HOUR;
      exchange.nowMs = t;
      if (!b.started) start(b, t);
      else step(b, t);
      b.state.lastSeenAt = t;
      act(b, t, day);
    }
    for (const b of active) {
      for (const s of [...b.presence.sessions].sort((a, c) => a.at - c.at)) {
        const st = dayStart + s.at * HOUR;
        const end = st + s.minutes * 60_000;
        if (st > b.state.lastTickAt) step(b, st);
        b.state.lastSeenAt = end;
        step(b, end);
      }
      step(b, dayStart + DAY);
    }
    for (const h of opts.hooks) h.onDayEnd?.(ctx, day);
    // Relevés du jour.
    let gold = 0;
    for (const b of active) gold += b.state.gold;
    let asks = 0;
    let bids = 0;
    let unsold = 0;
    for (const o of exchange.orders) {
      if (o.side === 'buy') {
        gold += o.qty * o.price;
        bids++;
      } else {
        asks++;
        unsold += o.qty * o.price;
      }
    }
    for (const b of active) {
      const best = b.state.combat.route.best;
      if (best > b.lastBest) {
        b.lastBest = best;
        b.lastRouteDay = day;
      } else b.stuck[best] = (b.stuck[best] ?? 0) + 1;
      const score = gearScoreNow(b);
      if (score > b.lastGearScore * 1.005) {
        b.lastGearScore = score;
        b.lastGearDay = Math.min(b.lastGearDay, day);
      }
      const levels = playable.map((p) => lvl(b.state, p.id));
      b.history.gold.push(Math.round(b.state.gold));
      b.history.best.push(best);
      b.history.classLevel.push(classLevel(b.state, b.state.classId!, content));
      b.history.topLevel.push(Math.max(...b.professions.map((p) => lvl(b.state, p))));
      b.history.gearScore.push(Math.round(score * 10) / 10);
      b.history.totalLevels.push(levels.reduce((s, l) => s + l, 0));
    }
    for (const [item, list] of exchange.prices) {
      const g = list.reduce((s, [x]) => s + x, 0);
      const q = list.reduce((s, [, x]) => s + x, 0);
      const r = recent.get(item) ?? [];
      r.push(g / q);
      if (r.length > 7) r.shift();
      recent.set(item, r);
      const w = Math.floor(day / 7);
      const weeks = priceWeeks.get(item) ?? [];
      const cur = (weeks[w] ??= { gross: 0, qty: 0 });
      cur.gross += g;
      cur.qty += q;
      priceWeeks.set(item, weeks);
    }
    exchange.prices.clear();
    add(ledger.sink, 'taxe du marché', exchange.stats.tax - lastTax);
    dayRows.push({ day, players: active.length, gold: Math.round(gold), volume: exchange.stats.volume - lastVolume, trades: exchange.stats.trades - lastTrades, asks, bids, unsold: Math.round(unsold), tax: Math.round(exchange.stats.tax - lastTax) });
    lastTax = exchange.stats.tax;
    lastVolume = exchange.stats.volume;
    lastTrades = exchange.stats.trades;
  }
  cache.uninstall();
  const weeksN = Math.ceil(opts.days / 7);
  const prices: ServerResult['prices'] = {};
  for (const [item, weeks] of priceWeeks) {
    prices[item] = {
      ref: ref(item),
      weekly: Array.from({ length: weeksN }, (_, w) => (weeks[w]?.qty ? Math.round((weeks[w]!.gross / weeks[w]!.qty) * 10) / 10 : 0)),
      qty: Array.from({ length: weeksN }, (_, w) => weeks[w]?.qty ?? 0),
    };
  }
  const refs: Record<string, number> = {};
  for (const id of Object.keys(content.items)) refs[id] = ref(id);
  return {
    options: { ...opts, hooks: opts.hooks.map((h) => h.name) },
    bots,
    clans,
    ledger,
    days: dayRows,
    prices,
    refs,
    fightCache: cache.stats,
    runtimeSec: Math.round((performance.now() - t0) / 1000),
  };
}

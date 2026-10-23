/**
 * La Marée du soir (docs/design/contenu/le-monde.md §5 ; data/combat/tide.yaml).
 *
 * - Tous les soirs, à `startHour` dans le fuseau du serveur (20 h à Paris) pendant `durationMin`, une Marée (la rotation tourne d'un soir à l'autre).
 * - Chaque participant marque des points : en combat, sa contribution face à la Marée, ramenée à celle d'un build moyen de
 *   son niveau (60 points un soir pour un build moyen) ; en travail, la part de ce que la digue demande qu'il a livrée.
 * - Le serveur additionne les points : à chaque seuil de son objectif, tout le monde reçoit un bonus d'éclats.
 * - Les absents participent tout seuls (`auto`, coché par défaut) ; le joueur connecté marque `liveBonus` de plus.
 * - Le coffre de la semaine compte les meilleurs soirs ; les éclats achètent des apparences, jamais de la puissance.
 *
 * Tout est pur et déterministe : le serveur règle un soir une fois pour tout le monde, le simulateur fait de même.
 */
import type { Content } from '../schemas/content.js';
import type { CombatContent, TideRules } from '../schemas/combat.js';
import { type CharacterState, GameError, addStack, cloneState } from '../engine/state.js';
import { type CombatantSetup, fight } from './engine.js';
import { curveTier, tierFactorAt } from './loadout.js';
import { advisedPlan, classLevel, combatantOf } from './progress.js';
import { hash32, stream } from './rng.js';
import { skillLevel } from '../engine/trials.js';

const DAY = 86_400_000;

export type TideChannel = 'combat' | 'work';

export interface TideNight {
  day: number;
  tide: string;
  points: number;
  shards: number;
  live: boolean;
  channel: TideChannel;
}

export interface TideState {
  /** Soir pour lequel le personnage est inscrit (inscriptions pendant l'heure qui précède la Marée), ou null. */
  registered: number | null;
  /** Ce que fait le personnage pendant la Marée. */
  channel: TideChannel;
  /** Soir rejoint en direct (le joueur était là). */
  liveDay: number | null;
  /** Ce que le joueur a livré à la digue, pour le soir `day`. */
  work: { day: number; items: Record<string, number> } | null;
  /** Les derniers soirs réglés (14 au plus). */
  nights: TideNight[];
  /** Nombre de soirs par Marée (titres). */
  counts: Record<string, number>;
  /** Tenues achetées avec des éclats. */
  unlocked: string[];
  /** Dernière semaine dont le coffre a été donné. */
  weekly: number;
  /** Soirs offerts au serveur (Mécène de la Marée, titres). */
  patron: number;
}

export const emptyTide = (): TideState => ({ registered: null, channel: 'combat', liveDay: null, work: null, nights: [], counts: {}, unlocked: [], weekly: 0, patron: 0 });
export const readTide = (raw: Partial<TideState> | null | undefined): TideState => ({ ...emptyTide(), ...(raw ?? {}) });

const need = (content: Content): { combat: CombatContent; tide: TideRules } => {
  const combat = content.combat;
  if (!combat?.tide) throw new GameError('no_tide', 'La Marée du soir n’est pas encore là.');
  return { combat, tide: combat.tide };
};

/** Jour (UTC) d'un instant. */
export const tideDay = (t: number) => Math.floor(t / DAY);
/** Semaine (du lundi au dimanche) d'un jour. Le 5 janvier 1970 était un lundi. */
export const tideWeek = (day: number) => Math.floor((day + 3) / 7);

/** La Marée d'un soir : la rotation tourne d'un soir à l'autre. */
export function tideOf(day: number, rules: TideRules) {
  const id = rules.rotation[((day % rules.rotation.length) + rules.rotation.length) % rules.rotation.length]!;
  return rules.tides.find((t) => t.id === id)!;
}

/** Décalage (ms) du fuseau à un instant : heure locale − heure UTC. */
function zoneOffset(t: number, timeZone: string): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', { timeZone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
      .formatToParts(new Date(t))
      .map((p) => [p.type, p.value]),
  );
  const local = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute), Number(parts.second));
  return local - Math.floor(t / 1000) * 1000;
}

/** La Marée du jour `day` : à `startHour` dans le fuseau du serveur (20 h à Paris, heure d'été ou d'hiver). */
export function tideWindow(day: number, rules: TideRules): { start: number; end: number } {
  const naive = day * DAY + rules.startHour * 3_600_000;
  const start = naive - zoneOffset(naive, rules.timeZone);
  return { start, end: start + rules.durationMin * 60_000 };
}

/** Les inscriptions du soir `day` : pendant les `registrationMin` minutes qui précèdent la Marée. */
export function registrationWindow(day: number, rules: TideRules): { start: number; end: number } {
  const w = tideWindow(day, rules);
  return { start: w.start - rules.registrationMin * 60_000, end: w.start };
}

/** Les inscriptions sont-elles ouvertes ? */
export const registrationOpen = (t: number, rules: TideRules) => {
  const r = registrationWindow(tideDay(t), rules);
  return t >= r.start && t < r.end;
};

/** Le soir réglable le plus récent avant `t` (la Marée est finie). */
export function lastFinishedTide(t: number, rules: TideRules): number {
  const day = tideDay(t);
  return t >= tideWindow(day, rules).end ? day : day - 1;
}

/** La Marée est-elle en cours ? */
export const tideOpen = (t: number, rules: TideRules) => {
  const w = tideWindow(tideDay(t), rules);
  return t >= w.start && t < w.end;
};

function contribution(combat: CombatContent, setup: CombatantSetup, encounterId: string, scale: number, scoring: 'damage' | 'support', seed: number) {
  const r = fight(combat, [setup], combat.encounters[encounterId]!, { seed, enemyDamageScale: scale, enemyHpScale: scale });
  const c = r.team[0]!.contributions;
  return scoring === 'damage' ? c.damage : c.damage + combat.tide!.points.supportWeight * (c.healing + c.absorbed + c.mitigated);
}

const references = new WeakMap<CombatContent, Map<string, number>>();
/**
 * Contribution d'un build moyen d'un niveau : la moyenne des trois classes, voie de dégâts et plan conseillé, avec
 * `referenceShare` de l'équipement de référence de ce niveau (Rare complet).
 */
export function tideReference(combat: CombatContent, tideId: string, level: number): number {
  let memo = references.get(combat);
  if (!memo) references.set(combat, (memo = new Map()));
  const key = `${tideId}|${level}`;
  const hit = memo.get(key);
  if (hit !== undefined) return hit;
  const rules = combat.tide!;
  const def = rules.tides.find((t) => t.id === tideId)!;
  const f = tierFactorAt(combat.rules, level);
  const k = f * rules.points.referenceShare;
  const stats = { ...combat.rules.referenceStats, power: combat.rules.referenceStats.power * k, maxHp: combat.rules.referenceStats.maxHp * k };
  let total = 0;
  let n = 0;
  for (const [classId, kit] of Object.entries(combat.kits)) {
    const pathId = level >= combat.pathLevel ? (kit.paths.find((p) => p.role === 'damage')?.id ?? null) : null;
    const setup: CombatantSetup = { id: 'p1', classId, pathId, plan: advisedPlan(combat, classId, pathId, level), weapon: kit.weapons[0]!, stats };
    for (let i = 0; i < rules.points.fights; i++) {
      total += contribution(combat, setup, def.encounter, f, def.scoring, i);
      n++;
    }
  }
  const v = Math.max(1, total / n);
  memo.set(key, v);
  return v;
}

/** Points d'un soir : la contribution du personnage (combat) ou sa livraison (travail). */
export function tideScore(state: CharacterState, day: number, content: Content, live: boolean): { points: number; ratio: number; channel: TideChannel } {
  const { combat, tide } = need(content);
  const def = tideOf(day, tide);
  const t = readTide(state.combat.tide);
  const bonus = live ? 1 + tide.points.liveBonus : 1;
  const full = tide.points.perMinute * tide.durationMin;
  // Canal travail sans livraison ce soir : le personnage part combattre (il n'est jamais puni d'avoir oublié).
  if (t.channel === 'work' && t.work?.day === day) {
    const got = t.work?.day === day ? t.work.items : {};
    const asked = def.work.items.reduce((s, w) => s + w.qty, 0);
    const done = def.work.items.reduce((s, w) => s + Math.min(w.qty, got[w.item] ?? 0), 0);
    const ratio = asked ? done / asked : 0;
    return { points: Math.round(full * tide.points.workMultiplier * ratio * bonus), ratio, channel: 'work' };
  }
  if (!state.classId || !combat.kits[state.classId]) return { points: 0, ratio: 0, channel: 'combat' };
  const level = classLevel(state, state.classId, content);
  const scale = tierFactorAt(combat.rules, level);
  const setup = combatantOf(state, content);
  let mine = 0;
  for (let i = 0; i < tide.points.fights; i++) mine += contribution(combat, setup, def.encounter, scale, def.scoring, hash32(`${state.seed}:tide:${day}:${i}`));
  mine /= tide.points.fights;
  const raw = mine / tideReference(combat, def.id, level);
  const ratio = Math.min(tide.points.maxRatio, Math.max(tide.points.minRatio, raw));
  return { points: Math.round(full * ratio * bonus), ratio: raw, channel: 'combat' };
}

/** Éclats d'un participant : ses points, plus le bonus de chaque seuil du serveur franchi ; chaque mécène du soir en ajoute. */
export function tideShards(points: number, serverPoints: number, participants: number, content: Content, patrons = 0): { shards: number; thresholds: number } {
  const { tide } = need(content);
  const objective = tide.shards.objectivePerParticipant * Math.max(1, participants);
  let shards = Math.round(points * tide.shards.perPoint);
  let reached = 0;
  for (const th of tide.shards.thresholds) {
    if (serverPoints >= objective * th.share) {
      shards += th.bonus;
      reached++;
    }
  }
  if (patrons > 0 && tide.patron) shards = Math.round(shards * (1 + Math.min(patrons, tide.patron.maxPerNight) * tide.patron.shardBonus));
  return { shards, thresholds: reached };
}

/** Le soir qu'une offre de mécène finance : la Marée de ce soir tant qu'elle n'est pas finie, sinon celle de demain. */
export function patronDay(now: number, rules: TideRules): number {
  const day = tideDay(now);
  return now < tideWindow(day, rules).end ? day : day + 1;
}

/** Prix pour offrir la Marée : selon les participants du dernier soir réglé (un grand serveur coûte plus cher). */
export function patronPrice(lastParticipants: number, content: Content): number {
  const p = need(content).tide.patron;
  if (!p) throw new GameError('no_patron', 'On ne peut pas encore offrir la Marée.');
  return Math.max(p.minPrice, Math.round(p.perParticipant * lastParticipants));
}

/**
 * Offrir la Marée : l'or est retiré (détruit), le compte des soirs offerts monte (titres). Le serveur vérifie qu'il reste
 * une place ce soir-là (`patron.maxPerNight`) et enregistre le mécène.
 */
export function offerTide(input: CharacterState, price: number, content: Content): CharacterState {
  need(content);
  if (input.gold < price) throw new GameError('gold', `Il faut ${price} or pour offrir la Marée.`);
  const state = cloneState(input);
  state.gold -= price;
  const t = readTide(state.combat.tide);
  state.combat.tide = { ...t, patron: t.patron + 1 };
  return state;
}

/**
 * S'inscrire à la Marée de ce soir, pendant l'heure qui précède [Décidé par Louis] : inscrit, le personnage combat même si
 * le joueur se déconnecte.
 */
export function registerTide(input: CharacterState, now: number, content: Content): CharacterState {
  const { tide } = need(content);
  if (!registrationOpen(now, tide)) throw new GameError('registration_closed', 'Les inscriptions à la Marée ouvrent chaque soir à 19 h, jusqu’à 20 h.');
  if (!input.classId) throw new GameError('no_class', 'Choisissez d’abord une classe.');
  const state = cloneState(input);
  state.combat.tide = { ...readTide(state.combat.tide), registered: tideDay(now) };
  return state;
}

/** Inscrit pour le soir `day` ? */
export const isRegistered = (state: CharacterState, day: number) => readTide(state.combat.tide).registered === day;

/** Prend part à la Marée en direct (le joueur est là pendant l'heure) : son bonus de points est acquis pour ce soir. */
export function joinTideLive(input: CharacterState, now: number, content: Content): CharacterState {
  const { tide } = need(content);
  if (!tideOpen(now, tide)) throw new GameError('tide_closed', 'La Marée n’est pas là : elle monte chaque soir à 20 h.');
  if (!isRegistered(input, tideDay(now))) throw new GameError('not_registered', 'Il fallait s’inscrire entre 19 h et 20 h : à demain soir !');
  const state = cloneState(input);
  state.combat.tide = { ...readTide(state.combat.tide), liveDay: tideDay(now) };
  return state;
}

/** Préférence : par quel canal (combattre ou travailler pour la digue). */
export function setTidePrefs(input: CharacterState, prefs: { channel?: TideChannel }, content: Content): CharacterState {
  need(content);
  const state = cloneState(input);
  const t = readTide(state.combat.tide);
  state.combat.tide = { ...t, ...(prefs.channel ? { channel: prefs.channel } : {}) };
  return state;
}

/** Livrer à la digue ce qu'elle demande ce soir (canal travail) : jusqu'à la quantité demandée, le soir même. */
export function deliverTideWork(input: CharacterState, now: number, content: Content): { state: CharacterState; delivered: Record<string, number> } {
  const { tide } = need(content);
  const day = tideDay(now);
  const def = tideOf(day, tide);
  const state = cloneState(input);
  const t = readTide(state.combat.tide);
  const items = t.work?.day === day ? { ...t.work.items } : {};
  const delivered: Record<string, number> = {};
  for (const w of def.work.items) {
    const give = Math.min(w.qty - (items[w.item] ?? 0), state.inventory[w.item] ?? 0);
    if (give <= 0) continue;
    addStack(state.inventory, w.item, -give);
    items[w.item] = (items[w.item] ?? 0) + give;
    delivered[w.item] = give;
  }
  if (!Object.keys(delivered).length) throw new GameError('tide_nothing', `Rien à livrer : la digue demande ce soir ${def.work.items.map((w) => `${w.qty} × ${content.items[w.item]?.name ?? w.item}`).join(', ')}.`);
  state.combat.tide = { ...t, work: { day, items }, channel: 'work' };
  return { state, delivered };
}

/** Enregistre un soir réglé (titres, historique) et verse ses éclats. */
export function recordTideNight(state: CharacterState, night: TideNight, content: Content): void {
  const { tide } = need(content);
  const t = readTide(state.combat.tide);
  addStack(state.inventory, tide.shards.item, night.shards);
  state.combat.tide = { ...t, nights: [...t.nights.filter((n) => n.day !== night.day), night].sort((a, b) => a.day - b.day).slice(-14), counts: { ...t.counts, [night.tide]: (t.counts[night.tide] ?? 0) + 1 } };
}

export interface WeeklyChest {
  week: number;
  points: number;
  nights: number;
  materials: { item: string; qty: number } | null;
  /** Modèle d'équipement à créer (une pièce épique du palier de la classe), ou null. */
  cache: string | null;
  shards: number;
}

/**
 * Coffre des semaines terminées : les `bestNights` meilleurs soirs de chaque semaine pas encore récompensée. Réserve de
 * matières (la meilleure récolte du personnage), chance d'une cache d'équipement, éclats en plus au-dessus d'un total.
 */
export function claimWeeklyChests(state: CharacterState, now: number, content: Content): WeeklyChest[] {
  const { combat, tide } = need(content);
  const t = readTide(state.combat.tide);
  const current = tideWeek(tideDay(now));
  const weeks = [...new Set(t.nights.map((n) => tideWeek(n.day)))].filter((w) => w < current && w > t.weekly).sort((a, b) => a - b);
  const out: WeeklyChest[] = [];
  for (const week of weeks) {
    const best = t.nights.filter((n) => tideWeek(n.day) === week).sort((a, b) => b.points - a.points).slice(0, tide.weekly.bestNights);
    const points = best.reduce((s, n) => s + n.points, 0);
    const share = best.length / tide.weekly.bestNights;
    // Réserve de matières : la récolte la plus avancée que le personnage sait faire.
    const gather = Object.values(content.recipes)
      .filter((r) => !r.trial && r.inputs.length === 0 && r.level <= skillLevel(state, r.profession, content))
      .sort((a, b) => b.level - a.level || a.id.localeCompare(b.id))[0];
    const materials = gather ? { item: gather.outputs[0]!.item, qty: Math.floor(((tide.weekly.materialsMinutes * 60) / gather.durationSec) * gather.outputs[0]!.qty * share) } : null;
    const rand = stream(state.seed, `tide-week:${week}`);
    let cache: string | null = null;
    if (state.classId && rand() < tide.weekly.cacheChance * share) {
      const tier = curveTier(combat.rules, classLevel(state, state.classId, content)) ?? 1;
      const models = Object.values(content.gearModels).filter((m) => m.tier === tier && m.rarity === 'epic' && !m.set && !m.named && !m.starter && m.classes.includes(state.classId!));
      cache = models[Math.floor(rand() * models.length)]?.id ?? null;
    }
    const shards = points >= tide.weekly.bonusAbove ? tide.weekly.bonusShards : 0;
    if (materials && materials.qty > 0) addStack(state.inventory, materials.item, materials.qty);
    if (shards) addStack(state.inventory, tide.shards.item, shards);
    out.push({ week, points, nights: best.length, materials: materials && materials.qty > 0 ? materials : null, cache, shards });
  }
  if (weeks.length) state.combat.tide = { ...readTide(state.combat.tide), weekly: weeks.at(-1)! };
  return out;
}

/** Acheter une apparence avec ses éclats de marée. */
export function buyTideItem(input: CharacterState, shopId: string, content: Content): CharacterState {
  const { tide } = need(content);
  const offer = tide.shop.find((s) => s.id === shopId);
  if (!offer) throw new GameError('unknown_offer', 'Offre inconnue.');
  const t = readTide(input.combat.tide);
  if (t.unlocked.includes(offer.outfit)) throw new GameError('already_owned', 'Déjà débloquée.');
  if ((input.inventory[tide.shards.item] ?? 0) < offer.cost) throw new GameError('not_enough_shards', `Il faut ${offer.cost} éclats de marée.`);
  const state = cloneState(input);
  addStack(state.inventory, tide.shards.item, -offer.cost);
  state.combat.tide = { ...t, unlocked: [...t.unlocked, offer.outfit] };
  return state;
}

/** Titres gagnés à la Marée. */
export function tideTitles(state: CharacterState, content: Content): string[] {
  const tide = content.combat?.tide;
  if (!tide) return [];
  const t = readTide(state.combat.tide);
  return [...tide.titles.filter((x) => (t.counts[x.tide] ?? 0) >= x.nights).map((x) => x.title), ...(tide.patron?.titles ?? []).filter((x) => t.patron >= x.offered).map((x) => x.title)];
}

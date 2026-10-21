import type { Content, NpcOrder } from '../schemas/content.js';
import { dayKey } from '../formulas/rates.js';
import { type CharacterState, GameError, addStack, cloneState } from './state.js';
import { skillLevel } from './trials.js';

/** Commandes déjà remises par le joueur pendant le jour de jeu `dayKey`. */
export interface NpcProgress {
  dayKey: string;
  done: string[];
}

/** Hachage stable (FNV-1a) pour tirer les commandes sans état serveur. */
function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Nombre d'accessibles parmi lesquels on tire une commande d'un métier (les plus hautes que le niveau permet). */
const TOP_TIERS = 3;

/**
 * Les commandes PNJ du jour pour ce joueur : `perDay` métiers jouables tirés au hasard (propres au joueur et au jour),
 * et dans chacun une commande adaptée à son niveau (parmi les plus hautes qu'il peut honorer).
 * Un joueur haut en Minage mais niveau 1 en Pêche reçoit une commande de pêche de niveau 1.
 */
export function npcOrdersOfDay(state: CharacterState, now: number, content: Content): NpcOrder[] {
  const key = dayKey(now, content.settings);
  const orders = Object.values(content.npcOrders);
  const picks: { profession: string; h: number; order: NpcOrder }[] = [];
  for (const p of content.professions) {
    if (p.status !== 'playable') continue;
    const level = skillLevel(state, p.id, content);
    const eligible = orders
      .filter((o) => o.profession === p.id && o.level <= level)
      .sort((a, b) => b.level - a.level || a.id.localeCompare(b.id))
      .slice(0, TOP_TIERS);
    if (!eligible.length) continue;
    const order = [...eligible].sort((a, b) => hash(`${state.seed}:${key}:${a.id}`) - hash(`${state.seed}:${key}:${b.id}`))[0]!;
    picks.push({ profession: p.id, h: hash(`${state.seed}:${key}:${p.id}`), order });
  }
  return picks
    .sort((a, b) => a.h - b.h || a.profession.localeCompare(b.profession))
    .slice(0, content.settings.npcOrders.perDay)
    .map((x) => x.order);
}

export function npcDoneToday(state: CharacterState, now: number, content: Content): string[] {
  return state.npc.dayKey === dayKey(now, content.settings) ? state.npc.done : [];
}

/** Remettre une commande du jour : les objets sont pris dans le sac, l'or est versé. */
export function completeNpcOrder(input: CharacterState, orderId: string, now: number, content: Content): CharacterState {
  const order = npcOrdersOfDay(input, now, content).find((o) => o.id === orderId);
  if (!order) throw new GameError('not_today', 'Cette commande n’est pas à l’affiche pour vous aujourd’hui.');
  const done = npcDoneToday(input, now, content);
  if (done.includes(orderId)) throw new GameError('done', 'Vous avez déjà honoré cette commande aujourd’hui.');
  for (const s of order.items) {
    if ((input.inventory[s.item] ?? 0) < s.qty) throw new GameError('missing', 'Il vous manque des objets pour cette commande.');
  }
  const state = cloneState(input);
  for (const s of order.items) addStack(state.inventory, s.item, -s.qty);
  state.gold += order.gold;
  state.npc = { dayKey: dayKey(now, content.settings), done: [...done, orderId] };
  return state;
}

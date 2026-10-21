import type { Content } from '../schemas/content.js';
import { levelForXp } from '../formulas/xp.js';
import { NO_ENERGY, dayKey, energyChargesLeft, energyDurationMs } from '../formulas/rates.js';
import { type CharacterState, GameError, addStack, cloneState } from './state.js';
import { startNextFromQueue } from './advance.js';
import { copiesWear, durabilityMs, isDurable, takeCopy } from './gear.js';
import { recipeAvailable } from './trials.js';

/**
 * Actions du joueur. Toutes pures : elles reçoivent un état déjà avancé jusqu'à `now`
 * et renvoient un nouvel état, ou lèvent une GameError avec un message affichable.
 */

export type StartMode = 'replace' | 'queue';

export function startActivity(
  input: CharacterState,
  recipeId: string,
  quantity: number,
  mode: StartMode,
  now: number,
  content: Content,
): CharacterState {
  const recipe = content.recipes[recipeId];
  if (!recipe) throw new GameError('unknown_recipe', 'Recette inconnue.');
  const profession = content.professions.find((p) => p.id === recipe.profession);
  if (profession?.status !== 'playable') throw new GameError('soon', 'Ce métier arrive bientôt.');
  const level = levelForXp(input.skills[recipe.profession] ?? 0, content.xpTable);
  if (level < recipe.level) throw new GameError('level', `Niveau ${recipe.level} requis.`);
  if (!recipeAvailable(recipe.trial, input, content)) {
    throw new GameError('trial', 'Ce chef-d’œuvre ne se fabrique que pendant l’épreuve du maître.');
  }
  const { maxQuantity, queueLength } = content.settings.activity;
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > maxQuantity) {
    throw new GameError('quantity', `Quantité entre 1 et ${maxQuantity}.`);
  }

  const state = cloneState(input);
  const action = { recipeId, quantity };
  if (mode === 'replace' || !state.activity) {
    state.activity = { ...action, done: 0, progress: 0, startedAt: now };
  } else {
    if (state.queue.length >= queueLength) throw new GameError('queue_full', 'La file est pleine.');
    state.queue.push(action);
  }
  return state;
}

/** index -1 : l'activité en cours (la file prend le relais). Sinon : une entrée de la file. */
export function cancelAction(input: CharacterState, index: number, now: number): CharacterState {
  const state = cloneState(input);
  if (index === -1) {
    if (!state.activity) throw new GameError('no_activity', 'Aucune activité en cours.');
    startNextFromQueue(state, now);
  } else {
    if (!state.queue[index]) throw new GameError('not_found', 'Action introuvable.');
    state.queue.splice(index, 1);
  }
  return state;
}

export function eatMeal(input: CharacterState, itemId: string, now: number, content: Content): CharacterState {
  const item = content.items[itemId];
  if (!item?.meal) throw new GameError('not_meal', 'Cet objet ne se mange pas.');
  if ((input.inventory[itemId] ?? 0) < 1) throw new GameError('missing', 'Vous n’en avez pas.');
  const state = cloneState(input);
  addStack(state.inventory, itemId, -1);
  state.buff = { itemId, bonus: item.meal.bonus, until: now + item.meal.durationMin * 60_000 };
  return state;
}

/** Part d'usure d'un exemplaire entre 0 (neuf) et 1 (usé). */
function wornShare(wear: number, itemId: string, content: Content): number {
  const total = durabilityMs(content.items[itemId]);
  return Number.isFinite(total) ? Math.min(1, wear / total) : 0;
}

/** Prix de la réparation (chez le PNJ) de l'exemplaire le plus usé : proportionnel à l'usure, au moins 1 or. */
export function repairCost(itemId: string, state: CharacterState, content: Content): number {
  const share = wornShare(copiesWear(state, itemId)[0] ?? 0, itemId, content);
  if (share <= 0) return 0;
  return Math.max(1, Math.ceil(content.items[itemId]!.value * content.settings.wear.repairGoldShare * share));
}

/** Réparer chez le PNJ l'exemplaire le plus usé : il retrouve toute sa durabilité, le maximum ne baisse jamais. */
export function repairItem(input: CharacterState, itemId: string, content: Content): CharacterState {
  const item = content.items[itemId];
  if (!item || !isDurable(item)) throw new GameError('not_repairable', 'Cet objet ne s’use pas.');
  if ((input.inventory[itemId] ?? 0) < 1) throw new GameError('missing', 'Vous n’en avez pas.');
  const cost = repairCost(itemId, input, content);
  if (cost === 0) throw new GameError('not_worn', 'Cet objet est comme neuf.');
  if (input.gold < cost) throw new GameError('gold', 'Pas assez d’or.');
  const state = cloneState(input);
  state.gold -= cost;
  takeCopy(state, itemId, 0);
  return state;
}

/** Ce que rend le recyclage d'un exemplaire : une part des matériaux de la recette qui le fabrique. */
export function recycleYield(itemId: string, content: Content): { item: string; qty: number }[] {
  const item = content.items[itemId];
  if (!item || item.meal) return [];
  const recipe = Object.values(content.recipes).find(
    (r) => r.inputs.length > 0 && r.outputs.length === 1 && r.outputs[0]!.item === itemId,
  );
  if (!recipe) return [];
  const out = recipe.outputs[0]!.qty;
  return recipe.inputs
    .map((i) => ({ item: i.item, qty: Math.floor((i.qty * content.settings.wear.recycleShare) / out) }))
    .filter((y) => y.qty > 0);
}

/** Recycler : détruit des exemplaires et rend une part des matériaux, sans or. */
export function recycleItem(input: CharacterState, itemId: string, qty: number, content: Content): CharacterState {
  if (!Number.isInteger(qty) || qty < 1) throw new GameError('quantity', 'Quantité invalide.');
  if ((input.inventory[itemId] ?? 0) < qty) throw new GameError('missing', 'Vous n’en avez pas assez.');
  const yields = recycleYield(itemId, content);
  if (!yields.length) throw new GameError('not_recyclable', 'Rien à récupérer dans cet objet.');
  const state = cloneState(input);
  addStack(state.inventory, itemId, -qty);
  // Les exemplaires les plus usés partent d'abord.
  for (let i = 0; i < qty; i++) takeCopy(state, itemId, 0);
  for (const y of yields) addStack(state.inventory, y.item, y.qty * qty);
  return state;
}

/** Ranger des repas dans le garde-manger (ou les reprendre avec une quantité négative côté appelant). */
export function stockPantry(input: CharacterState, itemId: string, qty: number, content: Content): CharacterState {
  if (!content.items[itemId]?.meal) throw new GameError('not_meal', 'Seuls les repas se rangent au garde-manger.');
  if (!Number.isInteger(qty) || qty < 1) throw new GameError('quantity', 'Quantité invalide.');
  if ((input.inventory[itemId] ?? 0) < qty) throw new GameError('missing', 'Vous n’en avez pas assez.');
  const state = cloneState(input);
  addStack(state.inventory, itemId, -qty);
  addStack(state.pantry, itemId, qty);
  return state;
}

export function unstockPantry(input: CharacterState, itemId: string, qty: number): CharacterState {
  if (!Number.isInteger(qty) || qty < 1) throw new GameError('quantity', 'Quantité invalide.');
  if ((input.pantry[itemId] ?? 0) < qty) throw new GameError('missing', 'Il n’y en a pas autant au garde-manger.');
  const state = cloneState(input);
  addStack(state.pantry, itemId, -qty);
  addStack(state.inventory, itemId, qty);
  return state;
}

/**
 * Activer un coup de fouet : une charge du jour, effet immédiat pendant `durationMin`, en ligne comme hors ligne.
 * Activé pendant un autre, il s'ajoute à la suite (deux charges d'un coup = une heure).
 */
export function activateEnergy(input: CharacterState, now: number, content: Content): CharacterState {
  const { settings } = content;
  if (energyChargesLeft(input.energy, now, settings) <= 0) {
    throw new GameError('energy_empty', 'Plus de coup de fouet aujourd’hui : ils reviennent au prochain jour de jeu.');
  }
  const state = cloneState(input);
  const key = dayKey(now, settings);
  const used = input.energy.dayKey === key ? input.energy.used : 0;
  state.energy = { dayKey: key, used: used + 1, activeUntil: Math.max(now, input.energy.activeUntil) + energyDurationMs(settings) };
  return state;
}

/**
 * Choisir ou changer de classe : gratuit et à tout moment, puisque les classes s'appuient sur les métiers.
 * Une tenue choisie est gardée ; sinon le personnage prend la tenue de départ de sa nouvelle classe.
 */
export function chooseClass(input: CharacterState, classId: string, content: Content): CharacterState {
  if (!content.classes[classId]) throw new GameError('unknown_class', 'Classe inconnue.');
  if (input.classId === classId) throw new GameError('same_class', 'C’est déjà votre classe.');
  const state = cloneState(input);
  state.classId = classId;
  return state;
}

export function newCharacterState(now: number, content: Content): CharacterState {
  return {
    seed: 0,
    gold: content.settings.character.startingGold,
    skills: {},
    inventory: {},
    activity: null,
    queue: [],
    lastTickAt: now,
    lastSeenAt: now,
    energy: { ...NO_ENERGY },
    buff: null,
    wear: {},
    pantry: {},
    npc: { dayKey: '', done: [] },
    prime: { dayKey: '', units: 0 },
    classId: null,
    outfit: null,
    trials: [],
  };
}

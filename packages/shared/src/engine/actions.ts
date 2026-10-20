import type { Content } from '../schemas/content.js';
import { levelForXp } from '../formulas/xp.js';
import { type CharacterState, GameError, addStack, cloneState } from './state.js';
import { startNextFromQueue } from './advance.js';
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

export function buyItem(input: CharacterState, itemId: string, qty: number, content: Content): CharacterState {
  const item = content.items[itemId];
  if (!item?.shopPrice) throw new GameError('not_sold', 'Le marchand ne vend pas cet objet.');
  if (!Number.isInteger(qty) || qty < 1) throw new GameError('quantity', 'Quantité invalide.');
  const cost = item.shopPrice * qty;
  if (input.gold < cost) throw new GameError('gold', 'Pas assez d’or.');
  const state = cloneState(input);
  state.gold -= cost;
  addStack(state.inventory, itemId, qty);
  return state;
}

export function sellItem(input: CharacterState, itemId: string, qty: number, content: Content): CharacterState {
  const item = content.items[itemId];
  if (!item) throw new GameError('unknown_item', 'Objet inconnu.');
  if (!Number.isInteger(qty) || qty < 1) throw new GameError('quantity', 'Quantité invalide.');
  if ((input.inventory[itemId] ?? 0) < qty) throw new GameError('missing', 'Vous n’en avez pas assez.');
  const state = cloneState(input);
  state.gold += item.value * qty;
  addStack(state.inventory, itemId, -qty);
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
    gold: content.settings.character.startingGold,
    skills: {},
    inventory: {},
    activity: null,
    queue: [],
    lastTickAt: now,
    lastSeenAt: now,
    energy: { dayKey: '', usedMs: 0 },
    buff: null,
    classId: null,
    outfit: null,
    trials: [],
  };
}

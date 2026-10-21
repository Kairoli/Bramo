import type { Content, Recipe } from '../schemas/content.js';
import { dayKey } from '../formulas/rates.js';
import { levelForXp } from '../formulas/xp.js';
import { type CharacterState, GameError, addStack, addTo, cloneState } from './state.js';
import { isDurable, takeCopy } from './gear.js';

/** Unités déjà primées pendant le jour de jeu `dayKey`. */
export interface PrimeProgress {
  dayKey: string;
  units: number;
}

/** La recette qui fabrique un objet (un seul résultat, au moins un ingrédient, hors chef-d'œuvre d'épreuve). */
export function recipeFor(itemId: string, content: Content): Recipe | undefined {
  return Object.values(content.recipes).find(
    (r) => !r.trial && r.inputs.length > 0 && r.outputs.length === 1 && r.outputs[0]!.item === itemId,
  );
}

export const levelIn = (state: CharacterState, profession: string, content: Content): number =>
  levelForXp(state.skills[profession] ?? 0, content.xpTable);

/**
 * Prime de commande : livrer `units` exemplaires d'un objet qu'on sait fabriquer à un ordre d'achat rapporte un peu d'XP
 * en plus, dans la limite de `commissions.primeUnitsPerDay` unités par jour de jeu.
 */
export function primeFor(
  state: CharacterState,
  itemId: string,
  units: number,
  now: number,
  content: Content,
): { units: number; xp: number; profession: string } | null {
  const recipe = recipeFor(itemId, content);
  if (!recipe || levelIn(state, recipe.profession, content) < recipe.level) return null;
  const key = dayKey(now, content.settings);
  const used = state.prime.dayKey === key ? state.prime.units : 0;
  const n = Math.min(units, Math.max(0, content.settings.commissions.primeUnitsPerDay - used));
  if (n <= 0) return null;
  const xp = (recipe.xp * (n / recipe.outputs[0]!.qty)) * content.settings.commissions.primeShare;
  return { units: n, xp, profession: recipe.profession };
}

/** Applique une prime calculée par `primeFor` (modifie `state`). */
export function applyPrime(state: CharacterState, prime: { units: number; xp: number; profession: string }, now: number, content: Content): void {
  const key = dayKey(now, content.settings);
  state.prime = { dayKey: key, units: (state.prime.dayKey === key ? state.prime.units : 0) + prime.units };
  addTo(state.skills, prime.profession, prime.xp);
}

/** XP d'une réparation par matériaux. */
export function repairXp(itemId: string, content: Content): number {
  const recipe = recipeFor(itemId, content);
  return recipe ? recipe.xp * content.settings.wear.repairXpShare : 0;
}

/** Les matériaux manquent-ils pour réparer cet objet ? Renvoie une erreur affichable, ou null si tout est prêt. */
export function repairProblem(state: CharacterState, itemId: string, content: Content): string | null {
  const item = content.items[itemId];
  const repair = item?.repair;
  if (!item || !repair || !isDurable(item)) return 'Cet objet ne se répare pas par matériaux.';
  if (levelIn(state, repair.profession, content) < repair.level) {
    const profession = content.professions.find((p) => p.id === repair.profession)?.name ?? repair.profession;
    return `${profession} niveau ${repair.level} requis pour réparer cet objet.`;
  }
  for (const m of repair.materials) {
    if ((state.inventory[m.item] ?? 0) < m.qty) return 'Il vous manque des matériaux pour cette réparation.';
  }
  return null;
}

/** Consomme les matériaux de réparation et gagne l'XP : à appeler après `repairProblem`. */
export function spendRepairMaterials(state: CharacterState, itemId: string, content: Content): void {
  const item = content.items[itemId]!;
  for (const m of item.repair!.materials) addStack(state.inventory, m.item, -m.qty);
  addTo(state.skills, item.repair!.profession, repairXp(itemId, content));
}

/** Réparer soi-même l'exemplaire le plus usé, avec des matériaux (≈ 30 % de ceux de l'objet) : sans or, avec un peu d'XP. */
export function repairWithMaterials(input: CharacterState, itemId: string, content: Content): CharacterState {
  if ((input.inventory[itemId] ?? 0) < 1) throw new GameError('missing', 'Vous n’en avez pas.');
  const problem = repairProblem(input, itemId, content);
  if (problem) throw new GameError('repair', problem);
  const worn = (input.wear[itemId] ?? [])[0] ?? 0;
  if (worn <= 0) throw new GameError('not_worn', 'Cet objet est comme neuf.');
  const state = cloneState(input);
  spendRepairMaterials(state, itemId, content);
  takeCopy(state, itemId, 0);
  return state;
}

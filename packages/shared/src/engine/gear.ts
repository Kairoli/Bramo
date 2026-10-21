import type { Content, Item } from '../schemas/content.js';
import type { CharacterState } from './state.js';

/**
 * Objets durables : chaque exemplaire a sa propre usure (ms de travail effectif), pour qu'une pioche à moitié usée
 * reste à moitié usée quand elle change de main. `state.wear[itemId]` liste l'usure des exemplaires usés, du plus usé
 * au moins usé, sans les zéros ; les exemplaires au-delà de la liste sont neufs. `inventory` garde le nombre total.
 */

/** Durabilité totale d'un objet en ms de travail ; Infinity s'il ne s'use pas. */
export function durabilityMs(item: Item | undefined): number {
  const hours = item?.tool?.durabilityHours;
  return hours === undefined ? Number.POSITIVE_INFINITY : hours * 3_600_000;
}

export const isDurable = (item: Item | undefined): boolean => Number.isFinite(durabilityMs(item));

/** Usure de chaque exemplaire possédé (du plus usé au plus neuf). */
export function copiesWear(state: CharacterState, itemId: string): number[] {
  const count = state.inventory[itemId] ?? 0;
  const list = state.wear[itemId] ?? [];
  return Array.from({ length: count }, (_, i) => list[i] ?? 0);
}

/** Temps de travail restant de chaque exemplaire possédé (du plus usé au plus neuf). */
export function copiesRemaining(state: CharacterState, itemId: string, content: Content): number[] {
  const total = durabilityMs(content.items[itemId]);
  return copiesWear(state, itemId).map((w) => Math.max(0, total - w));
}

/** L'exemplaire qui travaille : le plus usé de ceux qui ne sont pas usés (on finit un outil avant d'entamer le suivant). */
export function activeCopy(state: CharacterState, itemId: string, content: Content): { index: number; remaining: number } | null {
  const remaining = copiesRemaining(state, itemId, content);
  const index = remaining.findIndex((r) => r > 0);
  return index < 0 ? null : { index, remaining: remaining[index]! };
}

/** Ajoute de l'usure à un exemplaire (borné à la durabilité totale). */
export function wearCopy(state: CharacterState, itemId: string, index: number, ms: number, content: Content): void {
  const total = durabilityMs(content.items[itemId]);
  const list = [...(state.wear[itemId] ?? [])];
  while (list.length <= index) list.push(0);
  list[index] = Math.min(total, list[index]! + ms);
  state.wear[itemId] = list.filter((w) => w > 0);
}

/** Retire l'usure d'un exemplaire qui quitte le sac (le compte de `inventory` se change à part). */
export function takeCopy(state: CharacterState, itemId: string, index: number): number {
  const list = [...(state.wear[itemId] ?? [])];
  const wear = list[index] ?? 0;
  if (index < list.length) list.splice(index, 1);
  if (list.length) state.wear[itemId] = list;
  else delete state.wear[itemId];
  return wear;
}

/** Range un exemplaire d'usure donnée dans le sac (le compte de `inventory` se change à part). */
export function giveCopy(state: CharacterState, itemId: string, wear: number): void {
  if (wear <= 0) return;
  const list = [...(state.wear[itemId] ?? []), wear].sort((a, b) => b - a);
  state.wear[itemId] = list;
}

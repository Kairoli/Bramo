import type { EnergyState } from '../formulas/rates.js';

export interface QueuedAction {
  recipeId: string;
  quantity: number;
}

export interface Activity extends QueuedAction {
  /** Nombre de fabrications terminées. */
  done: number;
  /** Avancement de la fabrication en cours, en ms « effectives » (temps × rendement). */
  progress: number;
  startedAt: number;
}

export interface MealBuff {
  itemId: string;
  bonus: number;
  until: number;
}

/** État complet d'un personnage, tel que le moteur le manipule. Horodatages en ms epoch. */
export interface CharacterState {
  gold: number;
  /** XP par métier. */
  skills: Record<string, number>;
  inventory: Record<string, number>;
  activity: Activity | null;
  queue: QueuedAction[];
  /** Instant jusqu'auquel la progression a été calculée. */
  lastTickAt: number;
  /** Dernière preuve de présence du joueur. */
  lastSeenAt: number;
  energy: EnergyState;
  buff: MealBuff | null;
  /** Classe de base, choisie à la création (null tant qu'elle ne l'est pas) et changeable à tout moment. */
  classId: string | null;
  /** Tenue choisie ; null = la tenue de départ de la classe. */
  outfit: string | null;
  /** Épreuves de maître réussies. */
  trials: string[];
}

export class GameError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export function addStack(inv: Record<string, number>, item: string, qty: number): void {
  const next = (inv[item] ?? 0) + qty;
  if (next <= 0) delete inv[item];
  else inv[item] = next;
}

export function addTo(map: Record<string, number>, key: string, qty: number): void {
  map[key] = (map[key] ?? 0) + qty;
}

export function cloneState(s: CharacterState): CharacterState {
  return structuredClone(s);
}

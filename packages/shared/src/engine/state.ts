import type { EnergyState } from '../formulas/rates.js';
import type { Content } from '../schemas/content.js';
import { boostedXp } from '../formulas/xp.js';
import type { CombatState } from '../combat/progress.js';

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
  /** Graine propre au personnage (son identifiant en base) : sert aux tirages déterministes, comme les commandes PNJ. */
  seed: number;
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
  /** Usure des exemplaires usés de chaque objet durable, en ms de travail, du plus usé au moins usé (voir gear.ts). */
  wear: Record<string, number[]>;
  /** Garde-manger : repas rangés, mangés automatiquement dès que le précédent expire (hors ligne compris). */
  pantry: Record<string, number>;
  /** Unités déjà primées aujourd'hui (prime de commande). */
  prime: { dayKey: string; units: number };
  /** Commandes PNJ remises pendant le jour de jeu en cours. */
  npc: { dayKey: string; done: string[] };
  /** Classe de base, choisie à la création (null tant qu'elle ne l'est pas) et changeable à tout moment. */
  classId: string | null;
  /** Tenue choisie ; null = la tenue de départ de la classe. */
  outfit: string | null;
  /** Apparence pièce par pièce : emplacement → pièce, au-dessus de la tenue. N'affecte jamais l'équipement réel. */
  look: Record<string, string>;
  /** Bonus de clan par métier (clé « all » = toute production), renseignés au chargement par le serveur, jamais enregistrés. */
  clanBonuses: Record<string, number>;
  /** Commandes de maître réussies. */
  trials: string[];
  /** Surnom affiché par métier : rang choisi (0 = surnom de départ). Absent = le plus haut débloqué. */
  shown: Record<string, number>;
  /** Ornement de métier porté (identifiant de data/ornaments.yaml) ; null = aucun. */
  ornament: string | null;
  /** Titre affiché, choisi à part de l'ornement (engine/titles.ts) ; null ou absent = le titre par défaut. */
  title?: string | null;
  /** Tour guidé de la première session vu (ou passé) ; absent = pas encore. */
  tourDone?: boolean;
  /** Combat : XP par classe, voies, plans, activité de combat (voir combat/progress.ts). */
  combat: CombatState;
  /** Famille de l'arme portée (renseignée au chargement depuis l'équipement, jamais enregistrée). */
  weaponFamily: string | null;
  /**
   * Pièces portées et non usées (renseignées au chargement depuis l'équipement, jamais enregistrées) : elles font les
   * statistiques, les ensembles et les objets nommés du combat. Absent : statistiques de référence du combat.
   */
  equipment?: { model: string; lines: { name: string; value: number }[]; gem?: string; rank?: number }[];
  /**
   * Banquet du clan (data/clan_works.yaml) : +bonus d'XP, métiers et combat, de from à until. Renseigné au chargement depuis
   * le clan, jamais enregistré.
   */
  banquet?: { from: number; until: number; bonus: number } | null;
  /** Moteur de Puissance (power/power.ts) : par système, le niveau de chaque nœud et les recherches en cours. */
  power?: Record<string, { levels: Record<string, number>; pending: { node: string; until: number }[] }>;
}

/** Multiplicateur d'XP à l'instant t (Banquet du clan). */
export const xpMultiplier = (state: Pick<CharacterState, 'banquet'>, t: number): number =>
  state.banquet && t >= state.banquet.from && t < state.banquet.until ? 1 + state.banquet.bonus : 1;

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

/** XP de `n` fabrications à `each` XP pour un métier à `current` XP : doublée au début (`settings.xp.earlyBoost`). */
export function craftXp(each: number, n: number, current: number, content: Content): number {
  const boost = content.settings.xp.earlyBoost;
  if (!boost) return each * n;
  return boostedXp(each, n, current, content.xpTable[boost.untilLevel] ?? 0, boost.multiplier);
}

/** Multiplicateur d'XP du début de métier à `current` XP (1 une fois le seuil passé) : pour l'affichage. */
export function earlyXpMultiplier(current: number, content: Pick<Content, 'settings' | 'xpTable'>): number {
  const boost = content.settings.xp.earlyBoost;
  return boost && current < (content.xpTable[boost.untilLevel] ?? 0) ? boost.multiplier : 1;
}

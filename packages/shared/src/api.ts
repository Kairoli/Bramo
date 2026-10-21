import { z } from 'zod';
import type { Content } from './schemas/content.js';
import type { AdvanceSummary } from './engine/advance.js';
import type { StateView } from './engine/view.js';

/** Corps de requêtes, validés par le serveur. */
export const credentialsBody = z.object({
  username: z
    .string()
    .trim()
    .regex(/^[\p{L}0-9_-]{3,20}$/u, 'Pseudo : 3 à 20 lettres, chiffres, - ou _.'),
  password: z.string().min(8, 'Mot de passe : 8 caractères minimum.').max(200),
});

export const startBody = z.object({
  recipeId: z.string(),
  quantity: z.number().int(),
  mode: z.enum(['replace', 'queue']),
});

export const cancelBody = z.object({ index: z.number().int().min(-1) });
export const itemBody = z.object({ itemId: z.string() });
export const tradeBody = z.object({ itemId: z.string(), qty: z.number().int().min(1) });
export const classBody = z.object({ classId: z.string() });
export const outfitBody = z.object({ outfitId: z.string() });
export const lookBody = z.object({ slot: z.string(), partId: z.string().nullable() });
export const trialBody = z.object({ trialId: z.string() });
export const nicknameBody = z.object({ profession: z.string(), rank: z.number().int().min(0) });

export const placeOrderBody = z.object({
  side: z.enum(['buy', 'sell']),
  itemId: z.string(),
  qty: z.number().int(),
  price: z.number().int(),
  /** Objets durables : rang de l'exemplaire proposé (0 = le plus usé), tel que le sac les liste. */
  copy: z.number().int().min(0).optional(),
});
export const fillOrderBody = z.object({ orderId: z.number().int(), qty: z.number().int().min(1) });
export const orderIdBody = z.object({ orderId: z.number().int() });
export const npcOrderBody = z.object({ orderId: z.string() });

export const requestRepairBody = z.object({ itemId: z.string(), copy: z.number().int().min(0), fee: z.number().int() });
export const repairIdBody = z.object({ requestId: z.number().int() });
export const stallBody = z.object({ itemId: z.string(), qty: z.number().int().min(1) });

/** Demande de réparation confiée aux artisans. */
export interface RepairRequestView {
  id: number;
  itemId: string;
  /** Usure de l'outil confié, en ms de travail. */
  wear: number;
  /** Or mis de côté pour l'artisan (avant taxe). */
  fee: number;
  ownerName: string;
  mine: boolean;
}

/** Un ordre du marché tel que le client le voit. */
export interface MarketOrderView {
  id: number;
  side: 'buy' | 'sell';
  itemId: string;
  qty: number;
  price: number;
  /** Usure de l'exemplaire (objets durables) en ms de travail ; 0 sinon. */
  wear: number;
  ownerName: string;
  mine: boolean;
}

/** Résumé d'un objet sur le marché : meilleurs prix et profondeur. */
export interface MarketItemSummary {
  itemId: string;
  bestSell: number | null;
  bestBuy: number | null;
  sellQty: number;
  buyQty: number;
}

export interface MyOrderView extends MarketOrderView {
  /** À récupérer : or net des ventes ou objets achetés, versés au prochain passage. */
  waitingGold: number;
  waitingQty: number;
}

export const clanNameBody = z.object({ name: z.string().trim().min(1).max(60), description: z.string().trim().max(200).default('') });
export const clanIdBody = z.object({ clanId: z.number().int() });
export const clanMemberBody = z.object({ characterId: z.number().int() });
export const clanRankBody = z.object({ characterId: z.number().int(), rank: z.enum(['officer', 'member']) });
/** Apport à un bâtiment : de l'or (`what` = « gold ») ou des objets. */
export const clanContributeBody = z.object({ buildingId: z.string(), what: z.string(), qty: z.number().int().min(1) });

export type ClanRank = 'leader' | 'officer' | 'member';

/** Un clan dans la liste des clans à rejoindre. */
export interface ClanListItem {
  id: number;
  name: string;
  description: string;
  members: number;
  maxMembers: number;
  /** Somme des niveaux des bâtiments construits. */
  buildingLevels: number;
}

export interface ClanMemberView {
  id: number;
  name: string;
  rank: ClanRank;
  /** Vu depuis moins de `clan.activeDays` jours. */
  active: boolean;
  lastSeenAt: number;
}

/** Un bâtiment du clan : niveau, effet, et ce qu'il manque pour le niveau suivant. */
export interface ClanBuildingView {
  id: string;
  level: number;
  maxLevel: number;
  /** Ce que demande le niveau suivant, avec les apports déjà faits (null si le bâtiment est au maximum). */
  next: { gold: { need: number; have: number }; items: { item: string; need: number; have: number }[] } | null;
}

/** Le clan du joueur, avec ses bâtiments. */
export interface ClanView {
  id: number;
  name: string;
  description: string;
  /** Bonus de production donnés aux membres par métier (« all » = tout), avant plafond. */
  bonuses: Record<string, number>;
  myRank: ClanRank;
  members: ClanMemberView[];
  maxMembers: number;
  buildings: ClanBuildingView[];
  activeMembers: number;
  log: { id: number; at: number; text: string }[];
}

/** Un joueur vu dans la scène du bourg (informations publiques seulement). */
export interface TownPlayer {
  id: number;
  name: string;
  classId: string;
  outfit: string;
  /** Recette en cours, ou null s'il ne fait rien. */
  doing: string | null;
  doingProfession: string | null;
  /** Son métier le plus haut, avec son niveau et son titre. */
  profession: string | null;
  level: number;
  /** Surnom affiché dans son métier le plus haut. */
  nickname: string;
  self: boolean;
}

/** Une ligne du fil du serveur. */
export interface TownEvent {
  id: number;
  at: number;
  kind: 'level' | 'trial' | 'first' | 'join' | 'clan';
  text: string;
}

export interface TownView {
  /** Joueurs actifs récemment (au-delà de ceux montrés). */
  online: number;
  /** Personnages sur le serveur. */
  total: number;
  players: TownPlayer[];
  feed: TownEvent[];
}

export interface JournalEntry {
  id: number;
  at: number;
  kind: 'absence' | 'levelup' | 'finished' | 'started' | 'info' | 'trial';
  text: string;
  data?: AdvanceSummary;
}

export interface StateResponse {
  name: string;
  state: StateView;
  /** Présent une seule fois, à la première requête après une absence. */
  absence: AdvanceSummary | null;
  /** Entrées de journal créées par cette requête. */
  journal: JournalEntry[];
}

export type ContentResponse = Omit<Content, 'xpTable'>;

export interface ApiError {
  code: string;
  message: string;
}

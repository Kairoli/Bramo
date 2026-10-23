import { z } from 'zod';
import type { Content } from './schemas/content.js';
import type { AdvanceSummary } from './engine/advance.js';
import type { StateView } from './engine/view.js';
import type { TideNight } from './combat/tide.js';
import type { GearItemView } from './engine/equipment.js';

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
/** Combat : une rencontre en boucle, ou null pour le Terrain d'entraînement. */
/** `tier` : le cercle choisi dans une région haute (palier 40 à 90). */
export const combatStartBody = z.object({ encounter: z.string().nullable(), tier: z.number().int().min(1).optional() });
/** La route (PvE solo) : à l'étape atteinte, ou à une étape déjà franchie. */
export const combatRouteBody = z.object({ stage: z.number().int().min(0).optional() });
/** Préréglages : enregistrer le build actuel (dans `id`, ou un nouveau), renommer, appliquer, supprimer. */
export const presetSaveBody = z.object({ id: z.number().int().optional(), name: z.string().max(40).optional() });
export const presetIdBody = z.object({ id: z.number().int() });
export const presetRenameBody = z.object({ id: z.number().int(), name: z.string().max(40) });
/** Préréglage composé à la main (classe, voie, plan, exemplaires d'équipement), sans changer le build porté. */
export const presetWriteBody = z.object({
  id: z.number().int().optional(),
  name: z.string().max(40),
  classId: z.string(),
  path: z.string().nullable(),
  plan: z.array(z.object({ spell: z.string(), at: z.number().min(0) })).max(10).nullable(),
  gear: z.array(z.number().int()).max(20),
});
export const combatPathBody = z.object({ pathId: z.string() });
/** Plan de combat : sorts et première utilisation (s) ; null revient au plan conseillé. */
export const combatPlanBody = z.object({ plan: z.array(z.object({ spell: z.string(), at: z.number().min(0) })).max(10).nullable() });
export const outfitBody = z.object({ outfitId: z.string() });
export const ornamentBody = z.object({ ornamentId: z.string().nullable() });
export const gearIdBody = z.object({ id: z.number().int() });
/** Sertir une gemme du sac dans une pièce ; `itemId` null la retire. */
/** Développement : mettre des objets dans son sac. */
export const devItemGrantBody = z.object({ itemId: z.string(), qty: z.number().int().min(1).max(10_000) });
export const gearSocketBody = z.object({ id: z.number().int(), itemId: z.string().nullable() });
export const gearCraftBody = z.object({ modelId: z.string() });
export const gearSellBody = z.object({ id: z.number().int(), price: z.number().int().min(1).max(1_000_000) });
export const gearMarketQuery = z.object({ slot: z.string().optional(), classId: z.string().optional(), tier: z.coerce.number().int().optional() });
export const suppliesBody = z.object({ itemId: z.string(), qty: z.number().int().min(1).max(10000) });
export const tidePrefsBody = z.object({ auto: z.boolean().optional(), channel: z.enum(['combat', 'work']).optional() });
export const tideBuyBody = z.object({ offer: z.string() });
export const gearGrantBody = z.object({ modelId: z.string(), masterpiece: z.boolean().optional(), count: z.number().int().min(1).max(20).optional() });
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
  /** Pour le montrer dans la scène du clan : sa classe (null avant le choix), sa tenue, son niveau de classe. */
  classId: string | null;
  outfit: string | null;
  classLevel: number;
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
/** Fiche publique d'un joueur (clic sur un personnage du bourg ou du clan) : de quoi le voir, sans rien de privé. */
export interface PlayerProfile {
  id: number;
  name: string;
  classId: string | null;
  outfit: string | null;
  look: Record<string, string>;
  ornament: string | null;
  /** Surnom et métier du meilleur métier. */
  nickname: string;
  clan: { name: string; rank: ClanRank } | null;
  /** Classe actuelle : niveau et voie ; les autres classes jouées. */
  classLevel: number;
  path: string | null;
  otherClasses: { classId: string; level: number }[];
  /** Équipement porté (de quoi dessiner chaque pièce). */
  gear: { slot: string; family: string; tier: number; rarity: string; name: string; masterpiece: boolean }[];
  /** Métiers au-delà du niveau 1, du plus haut au plus bas. */
  skills: { profession: string; level: number }[];
  totalLevel: number;
  doing: string | null;
  lastSeenAt: number;
}

export interface TownEvent {
  id: number;
  at: number;
  kind: 'level' | 'trial' | 'first' | 'join' | 'clan' | 'loot';
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
  kind: 'absence' | 'levelup' | 'finished' | 'started' | 'info' | 'trial' | 'combat';
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

// Le combat n'est pas encore envoyé au client (salle Combat : étape 4 de docs/design/coeur-du-jeu/integration.md).
export type ContentResponse = Omit<Content, 'xpTable' | 'gearModels' | 'combat'>;

export interface ApiError {
  code: string;
  message: string;
}

/** La Marée du soir vue par un joueur (GET /api/tide). */
export interface TideView {
  tonight: {
    day: number;
    id: string;
    name: string;
    blurb: string;
    shines: string;
    start: number;
    end: number;
    open: boolean;
    work: { text: string; items: { item: string; name: string; qty: number; have: number; delivered: number }[] };
  };
  prefs: { auto: boolean; channel: 'combat' | 'work' };
  joinedLive: boolean;
  shards: number;
  nights: TideNight[];
  /** Points de la semaine en cours (meilleurs soirs) et ce qu'il faut pour le coffre plein. */
  week: { points: number; nights: number; bestNights: number; bonusAbove: number };
  shop: { id: string; name: string; outfit: string; cost: number; owned: boolean; forClass: boolean }[];
  titles: string[];
  counts: Record<string, number>;
  last: { day: number; name: string; participants: number; points: number; objective: number; thresholds: number; of: number } | null;
}


/** Une pièce en vitrine au marché (GET /api/market/gear). */
export interface GearListingView {
  id: number;
  price: number;
  seller: string;
  mine: boolean;
  item: GearItemView;
}

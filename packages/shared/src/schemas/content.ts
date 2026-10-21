import { z } from 'zod';
import type { CharacterClass, Cosmetics } from './art.js';

/** Identifiants techniques : anglais, snake_case. */
const id = z.string().regex(/^[a-z][a-z0-9_]*$/, 'identifiant attendu en snake_case (ex. bronze_ingot)');
const ratio = z.number().min(0);

export const settingsSchema = z.object({
  xp: z.object({
    maxLevel: z.number().int().min(2),
  }),
  /** Rangs de métier : niveaux où le maître propose une commande (surnom + déblocage de la tranche suivante). */
  ranks: z.object({ levels: z.array(z.number().int().min(2)).min(1) }),
  activity: z.object({
    queueLength: z.number().int().min(0),
    maxQuantity: z.number().int().min(1),
  }),
  presence: z.object({
    activeTimeoutSec: z.number().positive(),
    heartbeatSec: z.number().positive(),
  }),
  rates: z.object({
    active: ratio,
    offline: ratio,
    offlineCapHours: z.number().min(0),
  }),
  /** Coups de fouet activés par le joueur : `charges` par jour de jeu, chacun `durationMin` à ×`multiplier`. */
  energy: z.object({
    multiplier: ratio,
    charges: z.number().int().min(0),
    durationMin: z.number().positive(),
    resetHourUtc: z.number().int().min(0).max(23),
  }),
  bonusCaps: z.object({
    tool: ratio,
    meal: ratio,
    clan: ratio,
    season: ratio,
  }),
  /** Usure (outils) : la durabilité se compte en heures de travail effectif ; réparer rend tout, sans perte de maximum. */
  wear: z.object({
    /** Coût d'une réparation chez le PNJ : part de la valeur de l'objet, au prorata de l'usure. */
    repairGoldShare: ratio,
    /** Part des matériaux principaux rendue par le recyclage (arrondie vers le bas). */
    recycleShare: z.number().min(0).max(1),
    /** XP d'une réparation par matériaux (soi-même ou pour un autre) : part de l'XP de la recette de l'objet. */
    repairXpShare: ratio,
  }),
  /** Prime de commande : en livrant un ordre d'achat d'un objet qu'on sait fabriquer, on gagne un peu d'XP en plus (protégée par un plafond quotidien). */
  commissions: z.object({
    primeShare: ratio,
    primeUnitsPerDay: z.number().int().min(0),
  }),
  /** Marché entre joueurs : ordres d'achat et de vente, taxe sur les ventes (puits d'or). */
  market: z.object({
    taxShare: z.number().min(0).max(1),
    maxOpenOrders: z.number().int().min(1),
    maxPrice: z.number().int().min(1),
    maxQuantity: z.number().int().min(1),
  }),
  /** Commandes PNJ du Comptoir de la guilde : seul achat du PNJ, `perDay` par jour de jeu. */
  npcOrders: z.object({ perDay: z.number().int().min(0) }),
  /** Bourg (accueil) : joueurs récemment actifs montrés dans la scène, fil du serveur. */
  town: z.object({
    activeWindowMin: z.number().positive(),
    maxWalkers: z.number().int().min(0),
    feedSize: z.number().int().min(1),
    /** Niveaux de métier annoncés sur le fil du serveur. */
    milestoneLevels: z.array(z.number().int().min(2)),
  }),
  absence: z.object({
    minSummaryMin: z.number().min(0),
  }),
  character: z.object({
    startingGold: z.number().int().min(0),
  }),
});

export const professionFamilySchema = z.enum(['gathering', 'crafting', 'world']);

export const professionSchema = z.object({
  id,
  name: z.string(),
  /** Surnom de départ du métier (rang 0), avant la première commande du maître. */
  nickname: z.string().default(''),
  family: professionFamilySchema,
  status: z.enum(['playable', 'soon']),
  place: z.string(),
  description: z.string(),
  master: z.object({ name: z.string(), line: z.string() }).optional(),
  categories: z.array(z.object({ id, name: z.string() })).default([]),
});

export const itemSchema = z.object({
  id,
  name: z.string(),
  category: id,
  /** Valeur de référence en or (réparations, repères d'équilibrage) ; il n'y a plus de marchand PNJ qui rachète. */
  value: z.number().int().min(0),
  /** Étal de la guilde : prix auquel le PNJ vend cet objet de palier 1 tant qu'aucun joueur n'en propose. Absent = jamais vendu par le PNJ. */
  stallPrice: z.number().int().min(1).optional(),
  /** Réparation par un artisan ou soi-même : métier et niveau requis, matériaux consommés (≈ 30 % des matériaux principaux). */
  repair: z
    .object({ profession: id, level: z.number().int().min(1), materials: z.array(z.object({ item: id, qty: z.number().int().min(1) })).min(1) })
    .optional(),
  tool: z
    .object({
      profession: id,
      bonus: ratio,
      /** Heures de travail effectif avant d'être usé ; absent = ne s'use pas. */
      durabilityHours: z.number().positive().optional(),
    })
    .optional(),
  meal: z.object({ bonus: ratio, durationMin: z.number().positive() }).optional(),
});

const stackSchema = z.object({ item: id, qty: z.number().int().min(1) });

export const recipeSchema = z.object({
  id,
  name: z.string(),
  profession: id,
  category: id,
  level: z.number().int().min(1),
  durationSec: z.number().positive(),
  xp: z.number().min(0),
  inputs: z.array(stackSchema).default([]),
  outputs: z.array(stackSchema).min(1),
  /** Recette de chef-d'œuvre : n'existe que pendant cette épreuve de maître. */
  trial: id.optional(),
});

/**
 * Commande du maître : à un palier de rang (settings.ranks.levels), le maître du métier demande des objets
 * (récolte, fabrication ou préparation, livrées). La réussir donne le surnom du palier et débloque la tranche suivante.
 */
export const trialSchema = z.object({
  id,
  profession: id,
  /** Palier ouvert par la commande (un niveau de settings.ranks.levels). */
  rank: z.number().int().min(2),
  /** Titre de la commande. */
  name: z.string(),
  /** Surnom accordé, propre au métier. */
  nickname: z.string(),
  /** Ce que dit le maître en confiant la commande. */
  intro: z.string(),
  /** La petite histoire, racontée à la réussite : elle explique le surnom. */
  outro: z.string(),
  /** Objets à remettre au maître (consommés). */
  tasks: z.array(stackSchema).min(1),
  reward: z.object({ gold: z.number().int().min(0) }),
});

export const npcOrderSchema = z.object({
  id,
  profession: id,
  /** Niveau minimum dans le métier pour que la commande soit proposée. */
  level: z.number().int().min(1),
  client: z.string(),
  text: z.string(),
  items: z.array(stackSchema).min(1),
  gold: z.number().int().min(1),
});

export const professionsFileSchema = z.array(professionSchema);
export const itemsFileSchema = z.array(itemSchema);
export const recipesFileSchema = z.array(recipeSchema);
export const trialsFileSchema = z.array(trialSchema);
export const npcOrdersFileSchema = z.array(npcOrderSchema);

export type Settings = z.infer<typeof settingsSchema>;
export type ProfessionFamily = z.infer<typeof professionFamilySchema>;
export type Profession = z.infer<typeof professionSchema>;
export type Item = z.infer<typeof itemSchema>;
export type Recipe = z.infer<typeof recipeSchema>;
export type Stack = z.infer<typeof stackSchema>;
export type Trial = z.infer<typeof trialSchema>;
export type NpcOrder = z.infer<typeof npcOrderSchema>;

/** Contenu chargé, validé et indexé. Construit par `buildContent`. */
export interface Content {
  settings: Settings;
  professions: Profession[];
  items: Record<string, Item>;
  recipes: Record<string, Recipe>;
  /** Épreuves de maître, dans l'ordre des paliers pour chaque métier. */
  trials: Record<string, Trial>;
  /** Liste des commandes PNJ possibles ; chaque jour en tire `settings.npcOrders.perDay`. */
  npcOrders: Record<string, NpcOrder>;
  classes: Record<string, CharacterClass>;
  cosmetics: Cosmetics;
  /** xpTable[L] = XP totale pour atteindre le niveau L (index 0 inutilisé). */
  xpTable: number[];
}

import { z } from 'zod';
import type { CharacterClass, Cosmetics } from './art.js';
import type { GearCrafting, GearModel, GearPools, GearSet, GearSlot } from './gear.js';
import type { CombatContent } from './combat.js';

/** Identifiants techniques : anglais, snake_case. */
const id = z.string().regex(/^[a-z][a-z0-9_]*$/, 'identifiant attendu en snake_case (ex. bronze_ingot)');
const ratio = z.number().min(0);

export const settingsSchema = z.object({
  xp: z.object({
    maxLevel: z.number().int().min(2),
    /** XP des métiers multipliée tant que le métier est sous ce niveau (début de métier plus vif). */
    earlyBoost: z.object({ untilLevel: z.number().int().min(1), multiplier: z.number().min(1) }).optional(),
  }),
  /** Rangs de métier : niveaux où le maître propose une commande (surnom + déblocage de la tranche suivante). */
  ranks: z.object({
    levels: z.array(z.number().int().min(2)).min(1),
    /** true : le niveau s'arrête au palier jusqu'à la commande du maître (l'XP est gardée). false : la commande ne donne que le surnom, le niveau monte librement. */
    gatesLevel: z.boolean(),
  }),
  activity: z.object({
    queueLength: z.number().int().min(0),
    maxQuantity: z.number().int().min(1),
  }),
  presence: z.object({
    activeTimeoutSec: z.number().positive(),
    heartbeatSec: z.number().positive(),
  }),
  /** Discussion du serveur et des clans (apps/server/src/chat.ts). */
  chat: z
    .object({
      maxLength: z.number().int().min(1),
      perMinute: z.number().int().min(1),
      minIntervalSec: z.number().min(0),
      reportsToHide: z.number().int().min(1),
      blockLinks: z.boolean(),
      history: z.number().int().min(1),
    })
    .default({ maxLength: 300, perMinute: 10, minIntervalSec: 2, reportsToHide: 3, blockLinks: true, history: 60 }),
  /** Amis et messages privés (apps/server/src/social.ts, docs/design/social.md). */
  social: z
    .object({
      maxFriends: z.number().int().min(1),
      /** Messages privés gardés (jours) et renvoyés par conversation. */
      historyDays: z.number().int().min(1),
      thread: z.number().int().min(1),
      /** En ligne : vu dans les dernières minutes. */
      onlineMin: z.number().int().min(1),
    })
    .default({ maxFriends: 100, historyDays: 90, thread: 100, onlineMin: 15 }),
  /** Photo de profil (apps/server/src/avatar.ts) : taille maximale, délai entre deux changements, signalements avant masquage. */
  avatar: z
    .object({
      maxBytes: z.number().int().min(10_000),
      cooldownSec: z.number().min(0),
      hideAfterReports: z.number().int().min(1),
    })
    .default({ maxBytes: 300_000, cooldownSec: 60, hideAfterReports: 3 }),
  /** Garde-fous des comptes (apps/server/src/guard.ts). */
  security: z
    .object({
      loginFailures: z.object({ max: z.number().int().min(1), windowMin: z.number().positive() }),
      registrationsPerIpPerDay: z.number().int().min(1),
    })
    .default({ loginFailures: { max: 5, windowMin: 15 }, registrationsPerIpPerDay: 5 }),
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
  /** Équipement : usure des pièces portées et chef-d'œuvre. */
  gear: z.object({
    /** Heures de combat effectif avant qu'une pièce soit usée (elle perd alors ses statistiques ; la réparation remet tout, sans perte de maximum). */
    lifeHours: z.number().positive(),
    /** Chef-d'œuvre : chance par fabrication selon l'avance de l'artisan sur la recette, bornée à [min, max]. X à fixer quand on connaîtra le nombre de fabrications par jour. */
    masterpiece: z.object({ chanceMin: z.number().min(0).max(1), chanceMax: z.number().min(0).max(1), dailyCap: z.number().int().min(0), gapForMax: z.number().positive() }),
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
  /** Clans : création, taille, projet de bonus de clan (docs/design/monde.md §3). */
  clan: z.object({
    creationCost: z.number().int().min(0),
    nameMin: z.number().int().min(1),
    nameMax: z.number().int().min(1),
    maxMembers: z.number().int().min(2),
    /** Le coût d'un bâtiment croît avec le nombre de membres actifs, par rapport à ce nombre de référence. */
    minMembersForCost: z.number().int().min(1),
    /** Bonus de la Guilde du bourg (toute production), donné à qui n'a pas de clan. */
    townGuildBonus: ratio,
    logSize: z.number().int().min(1),
    activeDays: z.number().int().min(1),
    /** Renom (le-monde.md §7.1) : il ne baisse jamais ; les rangs ne donnent que du prestige. */
    renown: z
      .object({
        ranks: z.array(z.object({ name: z.string(), at: z.number().int().min(0) })).min(1),
        buildingLevel: z.number().int().min(0),
        tideMember: z.number().int().min(0),
        tideMinPoints: z.number().int().min(0),
        tideMaxPerNight: z.number().int().min(0),
        guardian: z.number().int().min(0),
      })
      .optional(),
  }),
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
  /** Ornements de métier. unlockAll : tous portables sans commande réussie, variantes en réserve comprises (essais). */
  ornaments: z.object({ unlockAll: z.boolean() }).default({ unlockAll: false }),
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
  /** D'où vient l'objet quand ni une recette ni le combat ne le donnent (infobulle « où l'obtenir »). */
  obtain: z.string().optional(),
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
  /** Gemme à sertir : l'outil de situation (rang `gem`, data/combat/tools.yaml) ou le talent (gemme de data/combat/talents.yaml) qu'elle donne une fois sertie. */
  gem: id.optional(),
  /** Potion de secours (fournitures de combat) : bue toute seule sous `below` des PV, rend `heal` des PV maximum. */
  potion: z.object({ heal: z.number().positive().max(1), below: z.number().positive().max(1), cooldown: z.number().positive() }).optional(),
  /** Préparation (fournitures de combat) : l'outil de situation de rang `prep` pendant `minutes` de combat. */
  prep: z.object({ tool: id, minutes: z.number().positive() }).optional(),
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

/**
 * Bâtiment de clan : construit par niveaux grâce aux apports des membres, il donne un bonus de production à un métier
 * (ou à tous). Coût du niveau N = `base` × N pour `settings.clan.minMembersForCost` membres actifs.
 */
export const buildingSchema = z.object({
  id,
  name: z.string(),
  description: z.string(),
  maxLevel: z.number().int().min(1),
  /** Métiers accélérés par chaque niveau : une liste de métiers, ou `[all]` pour toute la production. */
  boost: z.object({ professions: z.array(z.string()).min(1), perLevel: ratio }),
  /** `fromLevel` : cet objet n'est demandé qu'à partir de ce niveau (les premiers niveaux restent simples, les derniers demandent
   * des pièces fabriquées par d'autres artisans). */
  base: z.object({ gold: z.number().int().min(0), items: z.array(stackSchema.extend({ fromLevel: z.number().int().min(1).optional() })).default([]) }),
});

/**
 * Ouvrages du clan (data/clan_works.yaml) [Décidé par Louis, 23 octobre] : une suite sans fin d'ouvrages, bâtis comme les
 * bâtiments (or et matières des membres). Chaque niveau achevé donne au clan un Banquet : `banquet.hours` de
 * +`banquet.xpBonus` d'XP (métiers et combat) pour tous ses membres, lancé quand le clan le veut.
 * Coût du niveau N : celui de l'ouvrage N (la liste tourne) × membres actifs / `settings.clan.minMembersForCost`
 * × min(1 + growth.perLevel × (N − 1), growth.max) : il monte un peu, puis se stabilise (jamais hors de portée).
 */
export const clanWorksSchema = z.object({
  banquet: z.object({ hours: z.number().positive(), xpBonus: z.number().positive(), maxStock: z.number().int().min(1) }),
  growth: z.object({ perLevel: z.number().min(0), max: z.number().min(1) }),
  works: z
    .array(z.object({ id, name: z.string(), description: z.string(), gold: z.number().int().min(0), items: z.array(stackSchema).min(1) }))
    .min(1),
});
export type ClanWorks = z.infer<typeof clanWorksSchema>;

/**
 * Ornement de métier : cadre dessiné autour du pseudo et du titre (images dans apps/web/public/ornaments/<métier>/<rang>/).
 * Débloqué par la commande du maître `trial`, dont le surnom est le titre affiché. `reserved` : dessin sans déblocage.
 */
export const ornamentSchema = z.object({
  id,
  profession: id,
  rank: z.number().int().min(1),
  trial: id.optional(),
  reserved: z.boolean().default(false),
});

export const professionsFileSchema = z.array(professionSchema);
export const itemsFileSchema = z.array(itemSchema);
export const recipesFileSchema = z.array(recipeSchema);
export const trialsFileSchema = z.array(trialSchema);
export const npcOrdersFileSchema = z.array(npcOrderSchema);
export const buildingsFileSchema = z.array(buildingSchema);
export const ornamentsFileSchema = z.array(ornamentSchema);

export type Settings = z.infer<typeof settingsSchema>;
export type ProfessionFamily = z.infer<typeof professionFamilySchema>;
export type Profession = z.infer<typeof professionSchema>;
export type Item = z.infer<typeof itemSchema>;
export type Recipe = z.infer<typeof recipeSchema>;
export type Stack = z.infer<typeof stackSchema>;
export type Trial = z.infer<typeof trialSchema>;
export type NpcOrder = z.infer<typeof npcOrderSchema>;
export type Building = z.infer<typeof buildingSchema>;
export type Ornament = z.infer<typeof ornamentSchema>;

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
  /** Bâtiments de clan. */
  buildings: Record<string, Building>;
  /** Ouvrages du clan et Banquet (null sans data/clan_works.yaml). */
  clanWorks: ClanWorks | null;
  /** Ornements de métier, par métier puis par palier. */
  ornaments: Record<string, Ornament>;
  classes: Record<string, CharacterClass>;
  cosmetics: Cosmetics;
  /** Emplacements d'équipement. */
  gearSlots: Record<string, GearSlot>;
  /** Lignes aléatoires par emplacement. */
  gearPools: GearPools;
  /** Modèles d'équipement (volumineux : non envoyés avec le contenu, voir /api/gear/catalogue). */
  gearModels: Record<string, GearModel>;
  /** Ensembles d'équipement. */
  gearSets: Record<string, GearSet>;
  /** Fabrication de l'équipement (null sans data/gear_crafting.yaml). */
  gearCrafting: GearCrafting | null;
  /** Combat automatique (null si data/combat/ est absent). */
  combat: CombatContent | null;
  /** xpTable[L] = XP totale pour atteindre le niveau L (index 0 inutilisé). */
  xpTable: number[];
}

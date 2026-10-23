import { z } from 'zod';

/** Identifiants techniques : anglais, snake_case. */
const id = z.string().regex(/^[a-z][a-z0-9_]*$/, 'identifiant attendu en snake_case');

export const gearStats = ['vitality', 'defense', 'power', 'haste', 'crit', 'tenacity'] as const;
export const rarities = ['common', 'rare', 'epic', 'legendary'] as const;
export type Rarity = (typeof rarities)[number];

/** Emplacement d'équipement ; `capacity` exemplaires peuvent être portés à la fois (deux anneaux). */
export const gearSlotSchema = z.object({
  id,
  name: z.string(),
  kind: z.enum(['clothing', 'jewel', 'weapon']),
  capacity: z.number().int().min(1),
  /** Poids de l'emplacement dans le budget de statistiques (indicatif, déjà appliqué aux valeurs). */
  weight: z.number().positive(),
});

/** Ligne aléatoire possible : plage de valeur en % au palier 1 (multipliée par `tierScale` du palier de l'objet). */
export const gearLineSchema = z.object({ name: z.string(), min: z.number().positive(), max: z.number().positive() });

export const gearPoolsFileSchema = z.object({
  tierScale: z.record(z.string(), z.number().positive()),
  pools: z.record(z.string(), z.array(gearLineSchema).min(1)),
});

/**
 * Modèle d'équipement. Sa rareté est fixe. Chaque exemplaire garde les lignes fixes (`stats`) et tire entre `rolls[0]`
 * et `rolls[1]` lignes aléatoires dans le groupe de lignes de son emplacement.
 */
export const gearModelSchema = z.object({
  id,
  name: z.string(),
  kind: z.enum(['clothing', 'jewel', 'weapon']),
  slot: id,
  /** Famille : armor, cuirass, trail, robe (vêtements), jewel, ou la catégorie d'arme. */
  family: id,
  /** Classes qui peuvent le porter (les bijoux sont universels). */
  classes: z.array(id).min(1),
  tier: z.number().int().min(1),
  rarity: z.enum(rarities),
  orientation: z.enum(['protective', 'offensive']),
  material: z.string(),
  stats: z.array(z.object({ stat: z.enum(gearStats), value: z.number().int().min(1) })).min(1),
  rolls: z.tuple([z.number().int().min(0), z.number().int().min(0)]),
  socket: z.enum(['aucun', 'mineur', 'oui', 'majeur']),
  set: id.optional(),
  source: z.array(z.enum(['craft', 'loot', 'plan', 'dungeon', 'event', 'start'])).min(1),
  weaponSpeed: z.string().optional(),
  conditional: z.string().optional(),
  named: z.boolean().optional(),
  /** Objet nommé : identifiant de son talent dans data/combat/talents.yaml (section `named`). */
  talent: id.optional(),
  /** Pièce du set de départ : donnée une fois par classe, au choix de la classe. */
  starter: z.boolean().optional(),
  /** Liée au personnage : ne se vend ni ne s'échange. */
  bound: z.boolean().optional(),
});

export const gearSetSchema = z.object({
  id,
  name: z.string(),
  /** Classe qui le porte ; absente pour un ensemble de toutes les classes (ensembles de situation). */
  class: id.optional(),
  /** Famille de vêtement, ou famille de situation (interstice, rain…) pour un ensemble de toutes les classes. */
  family: id,
  theme: z.string(),
  event: z.boolean(),
  /** Bonus à 2, 3 et 4 pièces portées. */
  bonuses: z.array(z.string()).length(3),
  note: z.string(),
});

export const gearFileSchema = z.array(gearModelSchema);
export const gearSlotsFileSchema = z.array(gearSlotSchema);
export const gearSetsFileSchema = z.array(gearSetSchema);

export type GearSlot = z.infer<typeof gearSlotSchema>;
export type GearLine = z.infer<typeof gearLineSchema>;
export type GearPools = z.infer<typeof gearPoolsFileSchema>;
export type GearModel = z.infer<typeof gearModelSchema>;
export type GearSet = z.infer<typeof gearSetSchema>;

/** Ligne aléatoire tirée sur un exemplaire. */
export interface RolledLine {
  name: string;
  value: number;
  /** Plage possible pour ce modèle, pour afficher « 4,2 sur 3,8-8,6 ». */
  min: number;
  max: number;
  /** Ligne bonus du chef-d'œuvre (non perfectionnable). */
  bonus?: boolean;
}

/** Un exemplaire d'équipement : le modèle, ses lignes tirées, son usure et ce qu'il doit à son artisan. */
export interface GearInstance {
  id: number;
  model: string;
  lines: RolledLine[];
  masterpiece: boolean;
  /** Nom de l'artisan qui l'a fabriqué (null : butin). */
  signedBy: string | null;
  /** Usure en ms de combat effectif ; l'exemplaire est « usé » à partir de `settings.gear.lifeHours`. */
  wear: number;
  /** Emplacement où il est porté, ou null (dans le sac). */
  equipped: string | null;
  /** Gemme sertie : l'outil de situation qu'elle donne (data/combat/tools.yaml), ou null. */
  gem: string | null;
  /** En vitrine au marché à ce prix (ni portée ni sertie tant qu'elle y est), ou absent. */
  price?: number | null;
  /** Rang d'affinage (l'Affineur du bourg) : +1, +2… sans plafond ; absent = 0. */
  rank?: number;
  /** Affûtages déjà faits sur cet exemplaire (chacun coûte plus que le précédent) ; absent = 0. */
  hones?: number;
}

/**
 * Fabrication de l'équipement (data/gear_crafting.yaml) : de quoi calculer la recette de chaque modèle fabricable
 * (métier, matières, quantités, durée, XP). Première version, à équilibrer.
 */
export const gearCraftingSchema = z.object({
  families: z.record(z.string(), z.string()),
  secondary: z.record(z.string(), z.object({ profession: z.string(), share: z.number().min(0) })),
  materials: z.record(z.string(), z.array(z.object({ tier: z.number().int().min(1), item: z.string() })).min(1)),
  slotQty: z.record(z.string(), z.number().positive()),
  slotMinutes: z.record(z.string(), z.number().positive()),
  tierMultiplier: z.array(z.object({ tier: z.number().int().min(1), mul: z.number().positive() })).min(1),
  rarityMultiplier: z.record(z.string(), z.number().positive()),
  xp: z.object({ perHourAtLevel1: z.number().positive(), doubling: z.number().positive() }),
  /** Niveau de métier requis = palier × ce facteur (les métiers montent plus lentement que les classes). */
  levelPerTier: z.number().positive().max(1).default(1),
  /**
   * L'Affineur du bourg (perfectionnement, docs/design/combat-items.md §5.6) : son or est détruit, ses matières sont celles
   * de la pièce (la matière principale de sa famille à son palier). Coût = base × multiplicateurs du palier et de la rareté
   * × croissance^(services déjà faits sur cette pièce).
   */
  refine: z
    .object({
      /** Rang d'affinage (+1, +2…, sans plafond [Décidé par Louis, 23 octobre]) : les lignes fixes de la pièce, +statPerRank par rang. */
      rank: z.object({
        minRarity: z.enum(['common', 'rare', 'epic', 'legendary']),
        minTier: z.number().int().min(1),
        statPerRank: z.number().positive(),
        gold: z.number().positive(),
        goldGrowth: z.number().min(1),
        /** Matière : cette part de la quantité principale de la recette du modèle, × materialGrowth^rang. */
        materialShare: z.number().positive(),
        materialGrowth: z.number().min(1),
      }),
      /** Affûtage d'une ligne tirée : +step de sa plage, jamais au-delà de son maximum [Décidé par Louis]. */
      hone: z.object({
        step: z.number().positive().max(1),
        gold: z.number().positive(),
        goldGrowth: z.number().min(1),
        materialShare: z.number().positive(),
      }),
    })
    .optional(),
});
export type GearCrafting = z.infer<typeof gearCraftingSchema>;

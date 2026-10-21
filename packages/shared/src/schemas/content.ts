import { z } from 'zod';
import type { CharacterClass, Cosmetics } from './art.js';

/** Identifiants techniques : anglais, snake_case. */
const id = z.string().regex(/^[a-z][a-z0-9_]*$/, 'identifiant attendu en snake_case (ex. bronze_ingot)');
const ratio = z.number().min(0);

export const settingsSchema = z.object({
  xp: z.object({
    maxLevel: z.number().int().min(2),
  }),
  titles: z
    .array(z.object({ level: z.number().int().min(1), name: z.string() }))
    .min(1),
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
  /** Prix de revente au marchand PNJ, en or. */
  value: z.number().int().min(0),
  /** Prix d'achat au marchand PNJ ; absent = non vendu par le PNJ. */
  shopPrice: z.number().int().min(1).optional(),
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
 * Épreuve de maître : au niveau d'un palier de titre, le maître du métier demande des objets.
 * Les remettre donne le titre (Apprenti, Compagnon…). Le niveau, lui, continue de monter sans elle.
 */
export const trialSchema = z.object({
  id,
  profession: id,
  /** Palier de titre ouvert par l'épreuve (un niveau de settings.titles). */
  rank: z.number().int().min(2),
  name: z.string(),
  /** Ce que dit le maître en confiant l'épreuve. */
  intro: z.string(),
  /** Objets à remettre au maître (consommés). */
  tasks: z.array(stackSchema).min(1),
  reward: z.object({ gold: z.number().int().min(0) }),
});

export const professionsFileSchema = z.array(professionSchema);
export const itemsFileSchema = z.array(itemSchema);
export const recipesFileSchema = z.array(recipeSchema);
export const trialsFileSchema = z.array(trialSchema);

export type Settings = z.infer<typeof settingsSchema>;
export type ProfessionFamily = z.infer<typeof professionFamilySchema>;
export type Profession = z.infer<typeof professionSchema>;
export type Item = z.infer<typeof itemSchema>;
export type Recipe = z.infer<typeof recipeSchema>;
export type Stack = z.infer<typeof stackSchema>;
export type Trial = z.infer<typeof trialSchema>;

/** Contenu chargé, validé et indexé. Construit par `buildContent`. */
export interface Content {
  settings: Settings;
  professions: Profession[];
  items: Record<string, Item>;
  recipes: Record<string, Recipe>;
  /** Épreuves de maître, dans l'ordre des paliers pour chaque métier. */
  trials: Record<string, Trial>;
  classes: Record<string, CharacterClass>;
  cosmetics: Cosmetics;
  /** xpTable[L] = XP totale pour atteindre le niveau L (index 0 inutilisé). */
  xpTable: number[];
}

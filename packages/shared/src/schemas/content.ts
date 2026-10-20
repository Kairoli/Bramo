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
  energy: z.object({
    multiplier: ratio,
    dailyHours: z.number().min(0),
    resetHourUtc: z.number().int().min(0).max(23),
  }),
  bonusCaps: z.object({
    tool: ratio,
    meal: ratio,
    clan: ratio,
    season: ratio,
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
  tool: z.object({ profession: id, bonus: ratio }).optional(),
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
});

export const professionsFileSchema = z.array(professionSchema);
export const itemsFileSchema = z.array(itemSchema);
export const recipesFileSchema = z.array(recipeSchema);

export type Settings = z.infer<typeof settingsSchema>;
export type ProfessionFamily = z.infer<typeof professionFamilySchema>;
export type Profession = z.infer<typeof professionSchema>;
export type Item = z.infer<typeof itemSchema>;
export type Recipe = z.infer<typeof recipeSchema>;
export type Stack = z.infer<typeof stackSchema>;

/** Contenu chargé, validé et indexé. Construit par `buildContent`. */
export interface Content {
  settings: Settings;
  professions: Profession[];
  items: Record<string, Item>;
  recipes: Record<string, Recipe>;
  classes: Record<string, CharacterClass>;
  cosmetics: Cosmetics;
  /** xpTable[L] = XP totale pour atteindre le niveau L (index 0 inutilisé). */
  xpTable: number[];
}

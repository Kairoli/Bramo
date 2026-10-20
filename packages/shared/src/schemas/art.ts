import { z } from 'zod';

/**
 * Personnages : gabarit (os), pièces de tenue, animations, classes et tenues.
 * Modèle proche de Spine (os → emplacements → ordre d'affichage) pour pouvoir y migrer.
 */

const id = z.string().regex(/^[a-z][a-z0-9_]*$/);
const hex = z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'couleur attendue au format #RRGGBB');
const point = z.tuple([z.number(), z.number()]);

/** Emplacements de tenue. « near » = côté proche du spectateur, « far » = côté vers lequel le personnage regarde. */
export const slots = [
  'body',
  'headwear',
  'face',
  'shoulder_near',
  'shoulder_far',
  'top',
  'belt',
  'robe',
  'gloves',
  'boots',
  'cape',
  'weapon',
  'effect',
] as const;
export const slotSchema = z.enum(slots);
export type Slot = z.infer<typeof slotSchema>;

/** Les 7 rôles de couleur d'une tenue. */
export const paletteSchema = z.object({
  coat: hex,
  coatDark: hex,
  mantle: hex,
  under: hex,
  trim: hex,
  metal: hex,
  beard: hex,
});
export type Palette = z.infer<typeof paletteSchema>;

export const rigSchema = z.object({
  id,
  description: z.string().optional(),
  viewBox: z.tuple([z.number(), z.number(), z.number(), z.number()]),
  bones: z
    .array(z.object({ id, parent: id.nullable(), pivot: point, rotation: z.number().default(0) }))
    .min(1),
  colors: z.record(z.string(), hex),
  lods: z.record(
    z.enum(['portrait', 'scene', 'combat']),
    z.object({ viewBox: z.tuple([z.number(), z.number(), z.number(), z.number()]), detail: z.number().int().min(1) }),
  ),
});
export type Rig = z.infer<typeof rigSchema>;
export type Lod = keyof Rig['lods'];

export const partManifestSchema = z.object({
  id,
  slot: slotSchema,
  name: z.string(),
  colorRoles: z.array(z.string()),
  /** Décalage de la pièce par rapport à la pose de repos du gabarit. */
  anchor: point.default([0, 0]),
  layers: z
    .array(
      z.object({
        id: z.string(),
        bone: id,
        /** Ordre d'empilement global : plus petit = plus loin. */
        z: z.number(),
        /** Niveau de détail minimal : 1 portrait, 2 scène, 3 combat. */
        detail: z.number().int().min(1).default(1),
      }),
    )
    .min(1),
});
export type PartManifest = z.infer<typeof partManifestSchema>;

const keys = <T extends z.ZodTypeAny>(item: T) => z.array(item).min(2);
export const animationSchema = z.object({
  id,
  description: z.string().optional(),
  duration: z.number().positive(),
  bones: z.record(
    id,
    z.object({
      rotate: keys(z.tuple([z.number(), z.number()])).optional(),
      translate: keys(z.tuple([z.number(), z.number(), z.number()])).optional(),
    }),
  ),
});
export type Animation = z.infer<typeof animationSchema>;

/**
 * Pose d'une classe (plus tard : d'une voie) : décalages d'angle sur la pose de référence du gabarit,
 * puis animation de repos propre. Les pièces suivent leurs os : une tenue va avec toutes les poses.
 */
export const poseSchema = z.object({
  id,
  description: z.string().optional(),
  /** Degrés ajoutés à la rotation de référence de chaque os. */
  bones: z.record(id, z.number()).default({}),
  /** Corps de base propre à la pose (forme des mains : main ouverte du sort, poing qui tient l'arme…). */
  body: id.default('base'),
  animation: id,
});
export type Pose = z.infer<typeof poseSchema>;

export const classSchema = z.object({
  id,
  name: z.string(),
  style: z.enum(['melee', 'ranged', 'magic']),
  profession: id,
  affinityColor: hex,
  /** Phrase de présentation affichée au choix de la classe. */
  pitch: z.string(),
  /** Tenue portée tant que le joueur n'en a pas choisi d'autre. */
  startingOutfit: id,
  pose: id,
  weapon: id.optional(),
  effect: id.optional(),
});
export type CharacterClass = z.infer<typeof classSchema>;

export const outfitSchema = z.object({
  id,
  name: z.string(),
  subtitle: z.string(),
  palette: paletteSchema,
  parts: z.partialRecord(slotSchema.exclude(['body', 'weapon', 'effect']), id),
});
export type Outfit = z.infer<typeof outfitSchema>;

export const classesFileSchema = z.array(classSchema);
export const cosmeticsFileSchema = z.object({
  default: z.object({ outfit: id, class: id }),
  outfits: z.array(outfitSchema).min(1),
});
export type Cosmetics = z.infer<typeof cosmeticsFileSchema>;

/** Apparence d'un personnage : tenue, classe (qui donne la pose, l'arme et l'effet), et pièces changées une à une. */
export interface Appearance {
  outfit: string;
  classId: string;
  overrides?: Partial<Record<Slot, string | null>>;
}

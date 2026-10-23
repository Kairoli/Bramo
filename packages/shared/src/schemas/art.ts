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
  'legs',
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
  /** Facultatif : une tenue peut aussi teinter les jambes, les bottes et le cuir (sinon, les couleurs du gabarit). */
  legs: hex.optional(),
  legsDark: hex.optional(),
  boots: hex.optional(),
  leather: hex.optional(),
  /** Facultatif : couleur des sorts et des lueurs de classe avec cette tenue (sinon, la couleur d'affinité de la classe). */
  glow: hex.optional(),
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
  /** Animation d'action (attaque, sort) jouée une fois par-dessus le repos : instant du coup ou du lâcher, en secondes. */
  impact: z.number().min(0).optional(),
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
  /** Classes qui peuvent la porter : l'apparence n'emprunte que les styles de sa classe (décision de Louis, 21 octobre). */
  classes: z.array(id).min(1),
  /** Condition de déblocage (saison, réalisation) ; absent = disponible. */
  locked: z.string().optional(),
  palette: paletteSchema,
  parts: z.partialRecord(slotSchema.exclude(['body', 'weapon', 'effect']), id),
  /**
   * Version d'une classe [demande de Louis, 23 octobre : « reconnaître les classes hors pose »] : les pièces qui changent
   * pour garder la signature de la classe (barbe et avant-bras nus du Forgefeu, capuche et robe longue du Runiste,
   * capuchon, carquois et cape courte du Traqueur ; null retire une pièce), et des couleurs qui changent.
   */
  byClass: z
    .record(
      id,
      z.object({
        parts: z.partialRecord(slotSchema.exclude(['body', 'weapon', 'effect']), id.nullable()).default({}),
        palette: paletteSchema.partial().default({}),
      }),
    )
    .optional(),
});
export type Outfit = z.infer<typeof outfitSchema>;

/** Pièces d'une tenue pour une classe (sa version propre si elle en a une). */
export function outfitParts(outfit: Outfit, classId: string | null | undefined): Partial<Record<Slot, string>> {
  const own = classId ? outfit.byClass?.[classId]?.parts : undefined;
  const merged: Partial<Record<Slot, string | null>> = { ...outfit.parts, ...own };
  return Object.fromEntries(Object.entries(merged).filter(([, v]) => v)) as Partial<Record<Slot, string>>;
}

/** Couleurs d'une tenue pour une classe. */
export function outfitPalette(outfit: Outfit, classId: string | null | undefined): Palette {
  return { ...outfit.palette, ...(classId ? outfit.byClass?.[classId]?.palette : undefined) };
}

export const classesFileSchema = z.array(classSchema);
/**
 * Pièce d'apparence à part (hors tenue) : posable emplacement par emplacement par les classes indiquées, y compris l'arme
 * et l'aura (effet). `test` : essai (23 octobre), pas une pièce à vendre.
 */
export const cosmeticPieceSchema = z.object({
  slot: slotSchema.exclude(['body']),
  id,
  classes: z.array(id).min(1),
  test: z.boolean().optional(),
});
export type CosmeticPiece = z.infer<typeof cosmeticPieceSchema>;

export const cosmeticsFileSchema = z.object({
  default: z.object({ outfit: id, class: id }),
  outfits: z.array(outfitSchema).min(1),
  pieces: z.array(cosmeticPieceSchema).default([]),
});
export type Cosmetics = z.infer<typeof cosmeticsFileSchema>;

/** Apparence d'un personnage : tenue, classe (qui donne la pose, l'arme et l'effet), et pièces changées une à une. */
export interface Appearance {
  outfit: string;
  classId: string;
  overrides?: Partial<Record<Slot, string | null>>;
}

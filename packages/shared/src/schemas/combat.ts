import { z } from 'zod';

/** Identifiants techniques : anglais, snake_case. */
const id = z.string().regex(/^[a-z][a-z0-9_]*$/, 'identifiant attendu en snake_case');
const seconds = z.number().nonnegative();
const coef = z.number().nonnegative();

export const elements = ['physical', 'fire', 'frost', 'lightning'] as const;
export type Element = (typeof elements)[number];
export const roles = ['damage', 'control', 'support'] as const;
export type Role = (typeof roles)[number];
export const runeForms = ['trait', 'circle', 'seal'] as const;
export type RuneForm = (typeof runeForms)[number];
export const spellTags = ['heat', 'temper', 'setup', 'exploit', 'companion', 'ultimate'] as const;
export type SpellTag = (typeof spellTags)[number];

/** Règles communes (data/combat/rules.yaml). */
export const combatRulesSchema = z.object({
  tick: z.number().positive(),
  gcd: seconds,
  fightLimit: z.number().positive(),
  opening: z.enum(['independent', 'sequence']),
  secondaryShare: z.number().min(0).max(1),
  firstBasicAt: seconds,
  basicAttack: z.object({ coefficient: coef, referencePeriod: z.number().positive() }),
  weaponPeriods: z.record(id, z.number().positive()),
  referenceStats: z.object({
    power: z.number().positive(),
    maxHp: z.number().positive(),
    damageReduction: z.number().min(0).max(0.9),
    critChance: z.number().min(0).max(1),
    critMultiplier: z.number().min(1),
    haste: z.number().min(0).max(1),
  }),
  caps: z.object({
    critChance: z.number().min(0).max(1),
    vulnerability: z.number().min(0),
    bossSlow: z.number().min(0).max(1),
    hardControl: seconds,
    totalShield: coef,
    secondaryShield: coef,
    afflictionsPerType: z.number().int().min(1),
  }),
  enemy: z.object({
    defense: z.number().min(0).max(0.9),
    firstAttackAt: seconds,
    attackStagger: seconds,
    damageSpread: z.number().min(0).max(1),
  }),
  stability: z.object({
    max: z.number().positive(),
    stunPressurePerSecond: coef,
    breakDuration: seconds,
    recovery: seconds,
    breakDamageTaken: z.number().min(0),
    breakNextHitReduction: z.number().min(0).max(1),
  }),
  cleanse: z.object({ auraImmunity: seconds }),
  dotTick: z.number().positive(),
});

const params = z.record(z.string(), z.number());

export const pathSchema = z.object({
  id,
  name: z.string(),
  role: z.enum(roles),
  passive: z.string(),
  params,
});

export const classKitSchema = z.object({
  id,
  mechanic: z.enum(['heat', 'angle', 'rune']),
  label: z.string(),
  state: z.string(),
  params,
  elements: z.array(z.enum(elements)).min(1),
  weapons: z.array(id).min(1),
  paths: z.array(pathSchema).length(3),
});

export const kitsFileSchema = z.object({
  slots: z.object({ beforePath: z.number().int().min(1), fromPath: z.number().int().min(1) }),
  pathLevel: z.number().int().min(1),
  classes: z.array(classKitSchema),
});

export const spellSchema = z.object({
  id,
  name: z.string(),
  class: id,
  path: id.optional(),
  level: z.number().int().min(1).max(99),
  cooldown: z.number().positive(),
  /** `inherit` : élément du sort précédent (Phrase souveraine). */
  element: z.enum([...elements, 'inherit']),
  damage: coef,
  targets: z.number().int().min(1),
  tags: z.array(z.enum(spellTags)),
  form: z.enum(runeForms).optional(),
  heat: z.number().int().min(0).optional(),
  shield: coef.optional(),
  heal: coef.optional(),
  duration: seconds.optional(),
  pressure: coef.optional(),
  slow: z.number().min(0).max(1).optional(),
  stun: seconds.optional(),
  mark: seconds.optional(),
  weaken: z.number().min(0).max(1).optional(),
  antiheal: z.number().min(0).max(1).optional(),
  penetration: z.number().min(0).max(1).optional(),
  dot: z.object({ amount: coef, type: z.enum(['burn', 'bleed']), duration: z.number().positive() }).optional(),
  dispel: z.boolean().optional(),
  cleanse: z.boolean().optional(),
  empowerAuto: coef.optional(),
});

export const planEntrySchema = z.object({ spell: id, at: seconds });

/** Plan d'exemple : un répertoire de sorts par niveau de référence. */
export const examplePlanSchema = z.object({
  id,
  name: z.string(),
  class: id,
  path: id,
  weapon: id,
  basicElement: z.enum(elements).optional(),
  levels: z.record(z.string(), z.array(planEntrySchema).min(1)),
  /** Équipement du dossier, pas encore exécuté par le moteur. */
  dossierGear: z.unknown().optional(),
});

const phase = z.object({ period: z.number().positive() });

export const encounterSchema = z.object({
  id,
  name: z.string(),
  inspiredBy: z.string().optional(),
  enemies: z.number().int().min(1),
  hp: z.number().positive(),
  attack: z.object({ damage: coef, period: z.number().positive() }),
  charge: phase.extend({ damage: coef }).optional(),
  guard: phase.extend({ amount: coef, duration: z.number().positive() }).optional(),
  regen: phase.extend({ amount: coef }).optional(),
  aura: z.object({ damage: coef }).optional(),
});

export const spellsFileSchema = z.array(spellSchema);
export const plansFileSchema = z.array(examplePlanSchema);
export const encountersFileSchema = z.array(encounterSchema);

export type CombatRules = z.infer<typeof combatRulesSchema>;
export type ClassKit = z.infer<typeof classKitSchema>;
export type CombatPath = z.infer<typeof pathSchema>;
export type KitsFile = z.infer<typeof kitsFileSchema>;
export type Spell = z.infer<typeof spellSchema>;
export type PlanEntry = z.infer<typeof planEntrySchema>;
export type ExamplePlan = z.infer<typeof examplePlanSchema>;
export type Encounter = z.infer<typeof encounterSchema>;

/** Contenu de combat validé et indexé. */
export interface CombatContent {
  rules: CombatRules;
  slots: KitsFile['slots'];
  pathLevel: number;
  kits: Record<string, ClassKit>;
  paths: Record<string, CombatPath & { class: string }>;
  spells: Record<string, Spell>;
  plans: Record<string, ExamplePlan>;
  encounters: Record<string, Encounter>;
}

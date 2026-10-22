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
  /** Horaire de première utilisation maximal d'un sort du plan (s). */
  maxFirstUse: seconds,
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
    /**
     * Affaiblissements « une attaque » (Rupture, Contrepiège, Interdit…) : consommés par la prochaine attaque (`next`, défaut),
     * ou gardés pour la prochaine attaque lourde ou chargée quand la rencontre en a (`heavy`).
     */
    onceWeakenTarget: z.enum(['next', 'heavy']).optional(),
  }),
  stability: z.object({
    max: z.number().positive(),
    stunPressurePerSecond: coef,
    breakDuration: seconds,
    recovery: seconds,
    breakDamageTaken: z.number().min(0),
    breakNextHitReduction: z.number().min(0).max(1),
    /** Stabilité d'un ennemi ordinaire (pas un boss) ; par défaut `max`. */
    ordinaryMax: z.number().positive().optional(),
    /** Étourdissement d'un ennemi ordinaire à sa Rupture (s) ; 0 par défaut. */
    ordinaryBreakStun: seconds.optional(),
  }),
  cleanse: z.object({ auraImmunity: seconds }),
  dotTick: z.number().positive(),
  progression: z.object({
    xpPerHour: z.number().positive(),
    xpDoubling: z.number().positive(),
    catchUpBonus: z.number().min(0),
    catchUpBelow: z.number().min(0).max(1),
    rest: seconds,
    lossXpShare: z.number().min(0).max(1),
    maxConsecutiveLosses: z.number().int().min(1),
    training: z.object({ xpShare: z.number().min(0).max(1), maxLevel: z.number().int().min(1).max(99) }),
  }),
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

/**
 * Attaque ordinaire (ralentissable). `heavyEvery` : un coup sur N est lourd (× `heavyMultiplier`), comme une série
 * « deux coups puis un coup renforcé ».
 */
const attackSchema = z.object({
  damage: coef,
  period: z.number().positive(),
  heavyEvery: z.number().int().min(2).optional(),
  heavyMultiplier: z.number().min(1).optional(),
});

/**
 * Rencontre. Le groupe principal (`enemies` × `hp`, un boss s'il est seul) peut recevoir des renforts (`adds`) à heure fixe.
 * Toutes les phases ont un horaire fixe : un ralentissement ne les décale jamais.
 */
export const encounterSchema = z.object({
  id,
  name: z.string(),
  inspiredBy: z.string().optional(),
  enemies: z.number().int().min(1),
  hp: z.number().positive(),
  attack: attackSchema,
  /** Renforts : jamais des boss ; `arrive` en secondes (0 = présents dès le début). */
  adds: z.array(z.object({ name: z.string(), count: z.number().int().min(1), hp: z.number().positive(), attack: attackSchema, arrive: seconds })).optional(),
  charge: phase.extend({ damage: coef }).optional(),
  /**
   * Garde (réserve qui absorbe les dégâts) : sur tous les ennemis du groupe principal, ou à tour de rôle (`alternate`).
   * `boostedByAdds` : multipliée tant qu'un renfort est en vie.
   */
  guard: phase.extend({ amount: coef, duration: z.number().positive(), on: z.enum(['all', 'alternate']).optional(), boostedByAdds: z.number().min(1).optional() }).optional(),
  /** Soin du groupe principal ; `uses` : nombre maximal d'utilisations (jamais de combat perpétuel) ; `requiresAdds` : seulement tant qu'un renfort est en vie (un auxiliaire soigneur). */
  regen: phase.extend({ amount: coef, uses: z.number().int().min(1).optional(), requiresAdds: z.boolean().optional() }).optional(),
  aura: z.object({ damage: coef }).optional(),
  /** Érosion : une charge de plus à chaque période (au plus `maxStacks`), `damage` par charge et par seconde ; une purification les retire. */
  erosion: phase.extend({ damage: coef, maxStacks: z.number().int().min(1) }).optional(),
  /** Fenêtres : hors des `open` secondes ouvertes à chaque période, les ennemis subissent `closedReduction` de dégâts en moins. */
  windows: phase.extend({ open: z.number().positive(), closedReduction: z.number().min(0).max(0.95) }).optional(),
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

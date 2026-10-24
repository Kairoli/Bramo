import { z } from 'zod';
import { talentSchema } from './combat.js';

/**
 * Le moteur de Puissance (docs/design/puissance.md) : des **systèmes** de progression permanente (recherches de la Guilde,
 * reliques, lanterne de dos…) qui s'ajoutent à la classe, à l'équipement et au build. Tous ont la même forme : une liste de
 * **nœuds à niveaux**. Chaque niveau coûte (or, objets du sac, temps) et rapporte (statistiques, talents). Ajouter un système =
 * écrire un fichier de `data/power/`, sans toucher au code.
 */

const id = z.string().regex(/^[a-z][a-z0-9_]*$/);

/** Statistiques qu'un nœud peut améliorer (celles du combattant, `CombatStats`), y compris les statistiques spéciales. */
export const powerStats = ['power', 'maxHp', 'damageReduction', 'critChance', 'critMultiplier', 'haste', 'penetration', 'combo', 'counter', 'evasion', 'regen'] as const;
export type PowerStat = (typeof powerStats)[number];

/** Contenus où un bonus s'applique (absent : partout) : les points forts d'une classe ou d'un système. */
export const powerContexts = ['route', 'patrol', 'tide', 'arena', 'dungeon'] as const;
export type PowerContext = (typeof powerContexts)[number];

/** Une quantité qui grandit d'un niveau à l'autre : `base × growth^(niveau − 1)`, arrondie. */
const growing = z.object({ base: z.number().min(0), growth: z.number().min(1).default(1) });

/**
 * Un bonus par niveau : `flat` s'ajoute à la statistique (en points pour les parts : 0,01 = 1 point de critique), `pct`
 * multiplie la Puissance ou les PV (les `pct` de toutes les sources s'additionnent, puis multiplient une fois).
 */
export const powerBonusSchema = z.object({
  stat: z.enum(powerStats),
  flat: z.number().optional(),
  pct: z.number().optional(),
  in: z.array(z.enum(powerContexts)).optional(),
});
export type PowerBonus = z.infer<typeof powerBonusSchema>;

export const powerNodeSchema = z.object({
  id,
  name: z.string(),
  text: z.string().optional(),
  icon: z.string().optional(),
  /** Une branche de l'arbre, pour l'écran (« Le fer », « Le cuir »…). */
  group: z.string().optional(),
  maxLevel: z.number().int().min(1).default(1),
  /** Nœuds à avoir avant (arbre de recherche, talents de la lanterne). */
  requires: z.array(z.object({ node: id, level: z.number().int().min(1).default(1) })).default([]),
  /** Réservé à ces classes (absent : toutes). */
  classes: z.array(id).optional(),
  /** Coût d'un niveau : or et objets du sac. */
  cost: z.object({ gold: growing.optional(), items: z.array(growing.extend({ item: id })).default([]) }).default({ items: [] }),
  /** Temps d'un niveau (s) : la recherche tourne pendant qu'on joue (ou pas) ; absent : immédiat. */
  durationSec: growing.optional(),
  /** Ce que rapporte chaque niveau (cumulé). */
  perLevel: z.array(powerBonusSchema).default([]),
  /** Talents débloqués à un niveau (même langage que les gemmes : déclencheurs, réserves, effets). */
  talents: z.array(z.object({ level: z.number().int().min(1), talent: talentSchema })).default([]),
  /** Force de plus par niveau, en paliers (0,1 = un dixième de palier), pour ce que la formule ne voit pas (un talent). */
  force: z.number().min(0).default(0),
  /** Un seul nœud de ce groupe à la fois (un choix entre deux talents) : les autres nœuds du même `choice` sont exclus. */
  choice: id.optional(),
});
export type PowerNode = z.infer<typeof powerNodeSchema>;

export const powerSystemSchema = z.object({
  id,
  name: z.string(),
  /** research : arbre à minuteurs ; collection : objets trouvés puis montés ; companion : un objet porté qui monte ; innate : la classe. */
  kind: z.enum(['research', 'collection', 'companion', 'innate']),
  text: z.string().optional(),
  /** Ouvert à partir de ce niveau de classe (le plus haut du personnage). */
  unlock: z.object({ classLevel: z.number().int().min(1).optional() }).default({}),
  /** Recherches menées en même temps (systèmes à minuteurs). */
  slots: z.number().int().min(1).default(1),
  nodes: z.array(powerNodeSchema).min(1),
});
export type PowerSystem = z.infer<typeof powerSystemSchema>;

/** Réglages communs : plafonds des statistiques (toutes sources confondues) et formule de la Force de combat. */
export const powerConfigSchema = z.object({
  caps: z.partialRecord(z.enum(powerStats), z.number()).default({}),
  /**
   * Force = scale × (vraie force / force de référence)^exponent (docs/design/puissance.md §3) : à l'équipement de référence
   * (Rare, palier 20), `scale` ; chaque palier de plus (×1,096) la multiplie par 1,096^exponent (×1,9 avec 7). De gros
   * chiffres qui grandissent vite, comme dans Legend of Mushroom, mais qui suivent la vraie force.
   */
  force: z
    .object({
      scale: z.number().positive().default(10_000),
      exponent: z.number().positive().default(7),
      /**
       * Ce que vaut chaque statistique spéciale dans la Force, réglé sur le mur mesuré (sim/src/tempo/force.ts) : un combo ne
       * double que l'attaque de base, l'esquive n'évite que les coups ordinaires, la régénération compte sur un combat.
       */
      comboValue: z.number().default(0.4),
      counterValue: z.number().default(0.3),
      evasionValue: z.number().default(0.6),
      regenValue: z.number().default(10),
      /** Paliers comptés par talent de l'équipement (gemme, palier d'ensemble, objet nommé) : une estimation, le mannequin dira le vrai. */
      talentValue: z.number().min(0).default(0.15),
    })
    .default({ scale: 10_000, exponent: 7, comboValue: 0.4, counterValue: 0.3, evasionValue: 0.6, regenValue: 10, talentValue: 0.15 }),
});
export type PowerConfig = z.infer<typeof powerConfigSchema>;

export interface PowerContent {
  config: PowerConfig;
  systems: PowerSystem[];
}

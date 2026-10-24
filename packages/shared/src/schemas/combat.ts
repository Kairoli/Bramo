import { z } from 'zod';

/** Identifiants techniques : anglais, snake_case. */
const id = z.string().regex(/^[a-z][a-z0-9_]*$/, 'identifiant attendu en snake_case');
const seconds = z.number().nonnegative();
const coef = z.number().nonnegative();
const ratio = z.number().min(0).max(1);

export const elements = ['physical', 'fire', 'frost', 'lightning'] as const;
export type Element = (typeof elements)[number];
export const roles = ['damage', 'control', 'support'] as const;
export type Role = (typeof roles)[number];
export const runeForms = ['trait', 'circle', 'seal'] as const;
export type RuneForm = (typeof runeForms)[number];
export const spellTags = ['heat', 'temper', 'setup', 'exploit', 'companion', 'ultimate'] as const;
export type SpellTag = (typeof spellTags)[number];

/**
 * Conversion de l'équipement porté (lignes fixes et lignes aléatoires, `gearTotals`) en statistiques de combat (étape 5a,
 * dossier « Le cœur du jeu » §4). Puissance et PV : linéaires (`base` + points × `perPoint`). Défense, Cadence et Critique :
 * rendement décroissant `plafond × score / (score + K)`, K selon le palier du porteur (`k` : palier → K), pour qu'un même
 * pourcentage demande un score qui suit les paliers. Lignes aléatoires : `lines` associe un libellé à son effet (en %).
 */
const ratioStat = z.object({ cap: z.number().min(0).max(1), k: z.record(z.string(), z.number().positive()) });
/**
 * Effet d'un point de ligne aléatoire : `power`, `maxHp` en % de la statistique ; `damageReduction`, `haste`, `critChance`,
 * `critMultiplier`, `penetration` en points ; un élément en % de ses dégâts ; `startShield` en % des PV maximum.
 */
export const lineEffects = ['power', 'maxHp', 'damageReduction', 'haste', 'critChance', 'critMultiplier', 'penetration', 'physical', 'fire', 'frost', 'lightning', 'startShield', 'none'] as const;
export type LineEffect = (typeof lineEffects)[number];
export const gearStatsSchema = z.object({
  power: z.object({ base: z.number().min(0), perPoint: z.number().min(0) }),
  /** `perDefense` : PV par point de Défense (la Défense réduit et encaisse : une armure protectrice vaut une offensive). */
  maxHp: z.object({ base: z.number().min(0), perPoint: z.number().min(0), perDefense: z.number().min(0).optional() }),
  /**
   * Courbe de palier (facultative) : les points de l'équipement d'un porteur de palier T sont multipliés par `norm` (ce qui ramène
   * le catalogue d'un palier à celui de référence), puis sa Puissance et ses PV par `factor` (la courbe voulue, ex. +12 % par
   * palier). Sans elle, les points comptent tels quels.
   */
  tiers: z.record(z.string(), z.object({ norm: z.number().positive(), factor: z.number().positive() })).optional(),
  /**
   * Plancher : part de l'équipement de référence du niveau de la classe (Puissance et PV) sous laquelle un personnage ne
   * descend jamais (1 = un équipement Rare complet de son niveau). Plus bas, le butin et la fabrication comptent vraiment.
   */
  floorShare: z.number().min(0).max(1).optional(),
  /** Le plancher part de 100 % au niveau 1 et descend jusqu'à `floorShare` à ce niveau (un débutant n'a pas encore de butin). */
  floorRampLevel: z.number().int().min(2).optional(),
  defense: ratioStat,
  /** Cadence et Critique : `base` + rendement décroissant (`cap` est le plafond de la part venue de l'équipement). */
  haste: ratioStat.extend({ base: z.number().min(0).max(1) }),
  crit: ratioStat.extend({ base: z.number().min(0).max(1) }),
  critMultiplier: z.number().min(1),
  /** Durée du bouclier de début de combat donné par les lignes `startShield` (part des PV maximum). */
  startShieldDuration: z.number().positive(),
  /**
   * Libellé d'une ligne aléatoire → effet d'un point de %. `none` : ligne sans effet en combat (signalée par le simulateur).
   * Lignes de build : `mod:<clé>` ajoute (valeur / 100) au modificateur de talent (`talentModKeys`), `pool:<réserve>` ajoute
   * (valeur) charges au plafond d'une réserve.
   */
  lines: z.record(z.string(), z.union([z.enum(lineEffects), z.string().regex(/^(mod:[a-zA-Z]+|pool:[a-z][a-z0-9_]*)$/)])),
});
export type GearStatsConversion = z.infer<typeof gearStatsSchema>;

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
  /** Conversion des statistiques d'équipement en statistiques de combat (étape 5a) ; absente : `referenceStats` pour tous. */
  gearStats: gearStatsSchema.optional(),
  /**
   * La route ne finit jamais (décision de Louis) : une fois les douze chapitres faits, ils recommencent en boucle, chaque
   * cycle plus dur. Le palier continue de monter d'étape en étape, `loopTierStep` fois plus vite qu'au premier cycle (les
   * ennemis suivent la courbe au-delà du palier 90 ; le butin reste au palier 90).
   */
  route: z.object({ loopTierStep: z.number().positive() }).optional(),
  /** Fournitures de combat (potions de secours, préparations) : potions bues au plus par rencontre. */
  supplies: z.object({ potionsPerFight: z.number().int().min(0) }).optional(),
  /**
   * Butin d'une victoire (docs/design/contenu/butin-et-recettes.md §2), compté en unités : une unité = `unitSeconds` de combat.
   * Par unité : `vestiges` vestiges de la région, `classic` chance d'un objet classique du palier (rareté tirée dans `rarity`),
   * `setPiece` chance d'une pièce d'ensemble (palier 40 et plus, Légendaire à `setLegendary`), `named` chance par objet nommé
   * de la rencontre, garanti après `namedGuarantee` unités sans l'avoir eu. Absent : pas de butin.
   */
  loot: z
    .object({
      unitSeconds: z.number().positive(),
      vestiges: z.number().min(0),
      classic: ratio,
      rarity: z.object({ common: ratio, rare: ratio, epic: ratio, legendary: ratio }),
      setPiece: ratio,
      setLegendary: ratio,
      named: ratio,
      namedGuarantee: z.number().positive(),
      /** Chance par unité d'une gemme de talent taillée dans le vestige de la région (docs/design/gemmes/gemmes-de-talent.md). */
      talentGem: ratio.optional(),
    })
    .optional(),
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
  /** Ce que fait le passif, en une phrase simple (infobulle de la voie). */
  about: z.string().optional(),
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
  /**
   * Réserve de survie personnelle (Repli couvert, dossier PvE v2 §6) : `maxHpFraction` des PV maximum du lanceur au début
   * du combat, pendant `duration` s. Toujours sur soi ; ni Puissance de soutien ni plafonds de bouclier ; contre coups et
   * charges seulement (pas l'aura ni l'érosion). Un nouveau lancer remplace la réserve restante.
   */
  selfPool: z.object({ maxHpFraction: z.number().min(0).max(1), duration: z.number().positive() }).optional(),
});

/**
 * Outils de situation (dossier PvE v2 §3, `equipements-situation.yaml`) : un effet fort contre une mécanique ennemie
 * précise, nul ailleurs. Un porteur n'a qu'une variante active par famille, choisie au départ par `rank`
 * (set4 > gemme > set3 > préparation > set2) ; les paliers d'un ensemble remplacent les précédents.
 */
export const toolFamilies = ['interstice', 'rain', 'impact', 'beat', 'fracture', 'breath'] as const;
export type ToolFamily = (typeof toolFamilies)[number];
export const toolRanks = ['set4', 'gem', 'set3', 'prep', 'set2'] as const;
const toolBase = { id, name: z.string(), rank: z.enum(toolRanks), cooldown: seconds.default(0) };
export const toolSchema = z.discriminatedUnion('family', [
  /** Stocke `store` des dégâts natifs perdus contre une fenêtre fermée (plafond `bankCap` × P par cycle), rendus à l'ouverture. */
  z.object({ ...toolBase, family: z.literal('interstice'), store: z.number().min(0).max(1), bankCap: coef }),
  /** À partir de `atLeast` charges d'érosion, en retire `remove` (délai `cooldown`, `charges` usages au plus). */
  z.object({ ...toolBase, family: z.literal('rain'), remove: z.number().int().min(1), atLeast: z.number().int().min(1).default(2), charges: z.number().int().min(1).optional() }),
  /** Atténue un coup lourd ou une charge : min(`incoming` × coup, `maxHp` × PV max). */
  z.object({ ...toolBase, family: z.literal('impact'), incoming: z.number().min(0).max(0.75), maxHp: z.number().min(0).max(1) }),
  /** Multiplie les dégâts natifs contre un renfort (jamais contre le chef). */
  z.object({ ...toolBase, family: z.literal('beat'), multiplier: z.number().min(1) }),
  /** Multiplie les dégâts natifs contre la garde seulement : le supplément ne déborde jamais sur les PV. */
  z.object({ ...toolBase, family: z.literal('fracture'), multiplier: z.number().min(1) }),
  /** Récupère `recover` des PV perdus à l'aura (réserve `pulse` × PV max, soins au plus `rolling` × PV max sur `window` s). */
  z.object({ ...toolBase, family: z.literal('breath'), recover: z.number().min(0).max(1), pulse: z.number().min(0).max(1), rolling: z.number().min(0).max(1), window: z.number().positive() }),
]);
export type Tool = z.infer<typeof toolSchema>;
export const toolsFileSchema = z.array(toolSchema);

/**
 * Talents (dossier « Le cœur du jeu » §6.3, §11 à §13, §17) : la langue commune des gemmes majeures, des capacités des
 * objets nommés et des bonus d'ensemble « de build ». Un talent est une liste d'effets « quand [événement], si [conditions],
 * alors [action] », avec un délai interne, et des modificateurs passifs (`mods`).
 * Règles du moteur : un effet de talent ne déclenche jamais un autre talent (profondeur 1) ; ses dégâts ne critiquent pas et
 * ne profitent d'aucun outil de situation ; ses boucliers et soins sont secondaires (ni Encre, ni Réserve, ni Puissance de
 * soutien) ; il ne donne ni Braise, ni Angle, ni rune, sauf action explicite (`heat`, `replayRune`).
 */
export const talentTriggers = [
  'fight_start', // début de la rencontre
  'direct', // attaque de base ou compétence (action directe)
  'basic',
  'skill',
  'crit', // critique d'une action directe
  'kill', // une cible tuée par le porteur
  'hit_taken', // perte réelle de PV due à un coup ennemi
  'shield_broken', // un coup ennemi brise un bouclier du porteur
  'shield_expired', // un bouclier de compétence du porteur expire avec un reste (montant = reste)
  'heal_done', // soin effectif d'une compétence (montant = soin utile)
  'protect_done', // bouclier de compétence posé (montant = bouclier)
  'absorbed', // absorption réelle par les boucliers de compétence du porteur (montant)
  'control', // action de classe qui ralentit, étourdit ou retire de la Stabilité
  'break', // une Rupture provoquée par le porteur
  'dispel', // dissipation d'une garde ou purification utile
  'temper', // Trempe (Forgefeu) ; `heat` = Braises dépensées
  'angle', // Angle consommé (Traqueur)
  'companion', // compétence de compagnon
  'rune_read', // rune lue (Runiste) ; `rune` = forme lue
  'hp_below', // les PV du porteur baissent (la condition `hpBelow` fixe le seuil)
  'dot_expired', // une affliction du porteur arrive à son terme
  'every', // toutes les `period` secondes
] as const;
export type TalentTrigger = (typeof talentTriggers)[number];
export const targetStates = ['marked', 'burning', 'bleeding', 'afflicted', 'slowed', 'stunned', 'controlled', 'add'] as const;
export const actionKinds = ['direct', 'basic', 'skill', 'companion', 'support_skill'] as const;
export const skillKinds = ['companion', 'noncompanion', 'heat', 'temper', 'setup', 'exploit', 'heals', 'shields', 'support'] as const;

const talentAction = z.object({
  /**
   * Avant l'action (l'effet est évalué au début de l'action, conditions comprises) : `amplify` = +x % de ses dégâts directs,
   * `critBonus` = +x points de critique. Un effet qui porte l'un d'eux ne fait rien d'autre.
   */
  amplify: z.number().min(0).optional(),
  critBonus: z.number().min(0).max(1).optional(),
  /** Dégâts immédiats (× P) ; `to` : la cible, un autre ennemi (sinon `fallback`), l'attaquant (coups reçus). */
  damage: coef.optional(),
  to: z.enum(['target', 'other', 'other_or_target', 'attacker']).optional(),
  /** Avec `to: other` : action faite à la place quand il n'y a pas d'autre ennemi. */
  fallback: z.lazy((): z.ZodType<TalentAction> => talentAction).optional(),
  /** Avec `damage` : sous ce seuil de PV, `coef` du montant devient un soin personnel (Vigie). */
  lowHpHeal: z.object({ below: z.number().min(0).max(1), coef }).optional(),
  dot: z.object({ type: z.enum(['burn', 'bleed']), amount: coef, duration: z.number().positive() }).optional(),
  mark: seconds.optional(),
  slow: z.object({ amount: z.number().min(0).max(1), duration: z.number().positive() }).optional(),
  vuln: z.object({ amount: z.number().min(0).max(1), duration: z.number().positive() }).optional(),
  shield: z.object({ coef, duration: z.number().positive(), to: z.enum(['self', 'beneficiary']).default('self') }).optional(),
  heal: z.object({ coef, to: z.enum(['self', 'beneficiary']).default('self') }).optional(),
  /** Soin du bénéficiaire égal à cette part du montant de l'événement (reste d'un bouclier qui expire). */
  healShare: z.number().min(0).max(1).optional(),
  /** +x % de dégâts directs pendant `duration` s (une valeur par talent, remplacée). */
  buff: z.object({ amount: z.number().min(0), duration: z.number().positive() }).optional(),
  /** Braises rendues (Forgefeu). */
  heat: z.number().int().min(1).optional(),
  /** Rejoue une rune à ce multiple, en copie secondaire (ni écrite, ni Encre) : celle que lit l'action, ou celle de la préparation. */
  replayRune: z.number().positive().optional(),
  replayFrom: z.enum(['read', 'prepared']).optional(),
  /** À la mort de la cible : ses afflictions du porteur passent à un autre ennemi (montant restant). */
  transferDots: z.boolean().optional(),
  /** Réserve propre au talent : ajoute `share` du montant de l'événement, plafonnée à `cap` × P. */
  bank: z.object({ share: z.number().min(0).max(1), cap: coef, max: coef.optional() }).optional(),
  /** Dépense la réserve du talent : en bouclier (`shield`, durée) ou en dégâts sur la cible (`damage`). */
  spend: z.object({ as: z.enum(['shield', 'damage']), duration: z.number().positive().default(6) }).optional(),
  /**
   * Préparation : au lieu d'agir tout de suite, la prochaine action éligible reçoit l'action (une préparation acquise
   * pendant une action attend la suivante ; le délai interne démarre à sa consommation). `other` : bonus à un autre ennemi.
   */
  next: z.enum(actionKinds).optional(),
  /** Avec `next` : seulement une compétence de cooldown de base au plus (s). */
  nextMaxCooldown: seconds.optional(),
  /** Durée de vie de la préparation (s ; 8 par défaut, dossier §17). */
  within: z.number().positive().optional(),
  other: coef.optional(),
  /** Nombre d'actions qui la consomment (Rivets) ; `usesPerHeat` : autant que de Braises dépensées (au plus 3). */
  uses: z.number().int().min(1).optional(),
  usesPerHeat: z.boolean().optional(),
  /** Préparation cumulable (Rancune) : chaque déclenchement ajoute `damage`, `max` fois au plus, une fois par `gap` s. */
  stack: z.object({ max: z.number().int().min(1), gap: seconds }).optional(),
  /**
   * Réserves de build (Tisons, Entailles, Givre…, `talentCatalogSchema.pools`) : propres au porteur, remises à zéro à chaque
   * rencontre, plafonnées. `gain` en ajoute ; `spendPool` les vide toutes en dégâts (sur la cible, `other` à un autre ennemi),
   * en bouclier ou en soin, `perStack` × P par charge ; `perStack` (sur l'action) multiplie `amplify`, `critBonus` et `damage`
   * par les charges présentes d'une réserve, sans les dépenser.
   */
  gain: z.object({ pool: id, n: z.number().positive() }).optional(),
  spendPool: z.object({ pool: id, perStack: coef, as: z.enum(['damage', 'shield', 'heal']).default('damage'), other: coef.optional(), duration: z.number().positive().default(6), keep: z.number().min(0).max(1).default(0) }).optional(),
  scaleBy: id.optional(),
});
export interface TalentAction {
  gain?: { pool: string; n: number };
  spendPool?: { pool: string; perStack: number; as: 'damage' | 'shield' | 'heal'; other?: number; duration: number; keep: number };
  scaleBy?: string;
  amplify?: number;
  critBonus?: number;
  damage?: number;
  to?: 'target' | 'other' | 'other_or_target' | 'attacker';
  fallback?: TalentAction;
  lowHpHeal?: { below: number; coef: number };
  dot?: { type: 'burn' | 'bleed'; amount: number; duration: number };
  mark?: number;
  slow?: { amount: number; duration: number };
  vuln?: { amount: number; duration: number };
  shield?: { coef: number; duration: number; to: 'self' | 'beneficiary' };
  heal?: { coef: number; to: 'self' | 'beneficiary' };
  healShare?: number;
  buff?: { amount: number; duration: number };
  heat?: number;
  replayRune?: number;
  replayFrom?: 'read' | 'prepared';
  transferDots?: boolean;
  bank?: { share: number; cap: number; max?: number };
  spend?: { as: 'shield' | 'damage'; duration: number };
  next?: (typeof actionKinds)[number];
  nextMaxCooldown?: number;
  within?: number;
  other?: number;
  uses?: number;
  usesPerHeat?: boolean;
  stack?: { max: number; gap: number };
}

export const talentEffectSchema = z.object({
  when: z.union([z.enum(talentTriggers), z.array(z.enum(talentTriggers)).min(1)]),
  /** Conditions (toutes) : état de la cible au début de l'action. */
  target: z.array(z.enum(targetStates)).optional(),
  /** Compétence : cooldown de base au moins / au plus (avant Cadence) ; genre de compétence (au moins un). */
  minCooldown: seconds.optional(),
  maxCooldown: seconds.optional(),
  skill: z.array(z.enum(skillKinds)).optional(),
  /** Trempe : Braises dépensées au moins. */
  heatAtLeast: z.number().int().min(1).optional(),
  /** Aucune compétence lancée depuis ce délai (s). */
  noSkillFor: seconds.optional(),
  /** PV du porteur sous cette part. */
  hpBelow: z.number().min(0).max(1).optional(),
  /** Un bouclier protège le porteur. */
  selfShielded: z.boolean().optional(),
  /** Rune lue / forme écrite par la compétence. */
  rune: z.enum(runeForms).optional(),
  form: z.enum(runeForms).optional(),
  /**
   * Motif : `distinct_pair` deux compétences différentes de suite (dans `within` s) ; `same_skill` la même compétence deux
   * fois en `within` s ; `form_change` la forme écrite change ; `aba` les trois dernières formes A–B–A ; `repeat_read` deux
   * lectures de suite de la même forme.
   */
  pattern: z.enum(['distinct_pair', 'same_skill', 'form_change', 'aba', 'repeat_read']).optional(),
  within: z.number().positive().optional(),
  /** Compteur : l'effet part au N-ième événement éligible ; `sameTarget` : il repart de zéro si la cible change. */
  every: z.number().int().min(1).optional(),
  sameTarget: z.boolean().optional(),
  /** Seuil : somme des montants de l'événement sur `within` s, au moins `amountAtLeast` × P. */
  amountAtLeast: coef.optional(),
  /** Déclencheur `every` : période (s). */
  period: z.number().positive().optional(),
  /** Une réserve contient au moins `n` charges ; la cible a moins (ou plus) que cette part de ses PV. */
  poolAtLeast: z.object({ pool: id, n: z.number().positive() }).optional(),
  targetHpBelow: z.number().min(0).max(1).optional(),
  targetHpAbove: z.number().min(0).max(1).optional(),
  cooldown: seconds.default(0),
  do: talentAction,
});
export type TalentEffect = z.infer<typeof talentEffectSchema>;

/**
 * Modificateurs passifs, additionnés entre sources : durée et dégâts des afflictions personnelles ; durée des Marques et des
 * ralentissements ; boucliers et soins produits (hors talents) ; Pression ; valeur des runes ; durée de l'Angle (s) ; durée des
 * boucliers de compétence (s) ; dégâts directs reçus des ennemis ralentis (réduction). Les scores de Défense et de Cadence
 * (`defenseScore`, `hasteScore`) agissent avant conversion, dans le calcul des statistiques (`statsFromGear`). Les bonus
 * conditionnels (attaques de base, compétences longues, critique contre une cible marquée…) sont des effets `amplify`.
 */
export const talentModKeys = [
  'dotDuration',
  'dotDamage',
  'markDuration',
  'slowDuration',
  'shieldPower',
  'healPower',
  'pressure',
  'runeValue',
  'angleDuration',
  'shieldDuration',
  'slowedTakenReduction',
  'defenseScore',
  'hasteScore',
  /** Braises au plus (Forgefeu), en plus du plafond de la classe. */
  'heatCap',
  /** Dégâts directs des attaques de base, des compétences (%). */
  'basicDamage',
  'skillDamage',
  /** Dégâts, boucliers et soins des dépenses de réserve (%) ; part d'une réserve gardée quand on la dépense. */
  'spendPower',
  'spendKeep',
] as const;
export type TalentMods = Partial<Record<(typeof talentModKeys)[number], number>>;
const modsSchema = z.partialRecord(z.enum(talentModKeys), z.number());

/** Un talent porté (gemme majeure, capacité nommée, palier d'ensemble). */
export const talentSchema = z.object({
  id,
  name: z.string(),
  effects: z.array(talentEffectSchema).default([]),
  mods: modsSchema.optional(),
  /** Charges de plus au plafond d'une réserve. */
  pools: z.record(id, z.number()).optional(),
  /** Conversion : chaque charge gagnée dans `from` en donne aussi `share` dans `to` (sans événement). */
  convert: z.array(z.object({ from: id, to: id, share: z.number().positive() })).optional(),
  /** Palier d'ensemble de situation : l'outil (`toolSchema`) qu'il apporte. */
  tool: id.optional(),
});
export type Talent = z.infer<typeof talentSchema>;

/** Une réserve de build : nom, plafond de départ, ce qui la remplit et la vide (texte pour le joueur). */
export const poolSchema = z.object({ id, name: z.string(), max: z.number().positive(), text: z.string().optional() });
export type Pool = z.infer<typeof poolSchema>;

/**
 * Catalogue d'une proposition : gemmes majeures et objets nommés (un talent chacun, une place de majeure), ensembles (bonus à
 * 2, 3 et 4 pièces, cumulés) et ensembles de situation (`tool` : la famille d'outil, rang selon les pièces portées).
 */
const tier = talentSchema.omit({ id: true, name: true });
export const talentCatalogSchema = z.object({
  pools: z.array(poolSchema).default([]),
  /** `archetype` : la réserve ou le style que sert la gemme (texte et rapports), `role` : produire, amplifier, dépenser, relier. */
  gems: z.array(talentSchema.extend({ text: z.string().optional(), archetype: z.string().optional(), role: z.enum(['producer', 'amplifier', 'payoff', 'bridge', 'utility', 'situation']).optional() })).default([]),
  named: z.array(talentSchema.extend({ class: id.optional(), weapon: id.optional(), slot: id.optional(), nickname: z.string().optional(), text: z.string().optional(), source: z.string().optional() })).default([]),
  sets: z
    .array(
      z.object({
        id,
        name: z.string(),
        class: id.optional(),
        /** Famille de situation de son 4 pièces (`toolFamilies`), s'il en a une. */
        family: z.enum(toolFamilies).optional(),
        /** 2, 3 et 4 pièces : chacun ajoute ses effets et modificateurs aux paliers précédents. */
        pieces: z.object({ '2': tier.optional(), '3': tier.optional(), '4': tier.optional() }),
        text: z.array(z.string()).optional(),
        /** Noms des pièces (pistes pour le catalogue d'objets). */
        items: z.array(z.string()).optional(),
      }),
    )
    .default([]),
});
export type TalentCatalog = z.infer<typeof talentCatalogSchema>;

export const planEntrySchema = z.object({ spell: id, at: seconds });
/** Priorité de cible réglée avant le combat (dossier PvE v2) : chef d'abord (défaut), renforts d'abord, ou chef sans garde. */
export const targetPriorities = ['chief', 'adds_first', 'unguarded_first'] as const;
export type TargetPriority = (typeof targetPriorities)[number];

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
  /**
   * Place dans le monde (docs/design/contenu/le-monde.md) : `profil` (rencontre d'essai du banc), `zone` (zone de la route)
   * ou `gardien` (gardien de région). Absent : profil.
   */
  kind: z.enum(['profil', 'zone', 'gardien', 'maree']).optional(),
  /** Région du monde (nom affiché). */
  region: z.string().optional(),
  /** Palier de la rencontre : ses ennemis suivent la courbe d'équipement de ce palier (`rules.gearStats.tiers`). */
  tier: z.number().int().min(1).optional(),
  /** Régions hautes : on y entre au cercle de son choix, du palier `tier` à 90 (même lieu, ennemis et butin du cercle). */
  circles: z.boolean().optional(),
  /** Une phrase pour le joueur : ce qui s'y passe. */
  blurb: z.string().optional(),
  /** Ce qui y tombe en plus des objets classiques du palier : vestige de la région, objets nommés, pièces d'ensemble. */
  loot: z.object({ vestige: id.optional(), named: z.array(id).optional(), sets: z.array(id).optional() }).optional(),
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
  guard: phase
    .extend({
      amount: coef,
      duration: z.number().positive(),
      on: z.enum(['all', 'alternate']).optional(),
      boostedByAdds: z.number().min(1).optional(),
      /** Tant que sa garde tient, l'ennemi frappe plus fort (coups et charges × (1 + `empower`)) : briser la garde coupe la menace. */
      empower: z.number().min(0).optional(),
      /** La garde suit les PV ennemis (`hp`, défaut : × D^1,5 avec la difficulté couplée) ou les dégâts (`damage` : × D). */
      scale: z.enum(['hp', 'damage']).optional(),
    })
    .optional(),
  /** Soin du groupe principal ; `uses` : nombre maximal d'utilisations (jamais de combat perpétuel) ; `requiresAdds` : seulement tant qu'un renfort est en vie (un auxiliaire soigneur). */
  regen: phase.extend({ amount: coef, uses: z.number().int().min(1).optional(), requiresAdds: z.boolean().optional() }).optional(),
  aura: z.object({ damage: coef }).optional(),
  /** Érosion : une charge de plus à chaque période (au plus `maxStacks`), `damage` par charge et par seconde ; une purification les retire. */
  erosion: phase.extend({ damage: coef, maxStacks: z.number().int().min(1) }).optional(),
  /** Fenêtres : hors des `open` secondes ouvertes à chaque période, les ennemis subissent `closedReduction` de dégâts en moins. */
  windows: phase.extend({ open: z.number().positive(), closedReduction: z.number().min(0).max(0.95) }).optional(),
  /** Fureur : passé `after` secondes, les dégâts ennemis augmentent de `perSecond` par seconde (un combat ne peut pas durer indéfiniment). */
  enrage: z.object({ after: z.number().positive(), perSecond: z.number().positive() }).optional(),
});

/**
 * La Marée du soir (docs/design/contenu/le-monde.md §5, décidé par Louis : tous les soirs à 20 h pendant une heure, le type
 * tourne chaque soir). Chaque participant marque des points : en combat, sa contribution face à la Marée ramenée à celle
 * d'un build moyen de son palier ; ou en travail, ce que la digue demande ce soir-là. Les points donnent des éclats de
 * marée (cosmétiques, jamais de puissance), les seuils du serveur un bonus pour tous, et le coffre de la semaine compte
 * les meilleurs soirs.
 */
export const tideSchema = z.object({
  /** Heure de début dans le fuseau du serveur (`timeZone`, ex. Europe/Paris : 20 h été comme hiver) et durée. */
  startHour: z.number().int().min(0).max(23),
  timeZone: z.string(),
  durationMin: z.number().int().min(1),
  /**
   * Inscriptions : pendant les `registrationMin` minutes avant la Marée [Décidé par Louis, 23 octobre : de 19 h à 20 h, plus
   * d'inscription automatique]. Un personnage inscrit combat même déconnecté.
   */
  registrationMin: z.number().int().min(1).default(60),
  /** Ordre des Marées, un soir chacune, puis on recommence. */
  rotation: z.array(id).min(1),
  tides: z.array(
    z.object({
      id,
      name: z.string(),
      blurb: z.string(),
      /** Ce qui marque : les dégâts, ou les dégâts avec les soins, protections et atténuations (l'escorte). */
      scoring: z.enum(['damage', 'support']),
      /** Rencontre jouée (encounters.yaml, kind: maree), à la hauteur du palier de la classe. */
      encounter: id,
      /** Qui y brille, en mots simples. */
      shines: z.string(),
      /** Canal travail : ce que la digue demande ce soir-là (une heure de travail pour 100 % des points). */
      work: z.object({ text: z.string(), items: z.array(z.object({ item: id, qty: z.number().int().min(1) })).min(1) }),
    }),
  ),
  points: z.object({
    /** Points par minute d'un build moyen de son palier. */
    perMinute: z.number().positive(),
    minRatio: z.number().min(0),
    maxRatio: z.number().positive(),
    /** Joueur connecté pendant la Marée : ce bonus de points (petit, ~15 %). */
    liveBonus: z.number().min(0),
    /** Canal travail : tout livrer vaut ce multiple des points d'un build moyen (un artisan doit y trouver son compte). */
    workMultiplier: z.number().positive().default(1),
    /** Le build moyen d'un niveau : cette part d'un équipement Rare complet de ce niveau (un joueur réel n'a pas tout en Rare). */
    referenceShare: z.number().positive().max(1),
    /** Soins, protections et atténuations comptent autant de fois plus que les dégâts quand la Marée compte l'escorte. */
    supportWeight: z.number().min(0),
    /** Rencontres jouées pour mesurer la contribution (graines différentes). */
    fights: z.number().int().min(1),
  }),
  shards: z.object({
    /** Objet des éclats de marée (items.yaml). */
    item: id,
    perPoint: z.number().min(0),
    /** Objectif du serveur : points par participant ; à chaque seuil franchi, tout le monde reçoit le bonus. */
    objectivePerParticipant: z.number().positive(),
    thresholds: z.array(z.object({ share: z.number().positive(), bonus: z.number().int().min(0) })),
  }),
  /** Coffre de la semaine : les meilleurs soirs comptent (dimanche). */
  weekly: z.object({
    bestNights: z.number().int().min(1),
    /** Réserve de matières : minutes de la meilleure récolte du joueur. */
    materialsMinutes: z.number().min(0),
    /** Chance d'une cache d'équipement (pièce épique du palier de la classe). */
    cacheChance: z.number().min(0).max(1),
    /** Éclats en plus si les meilleurs soirs dépassent ce total de points. */
    bonusAbove: z.number().min(0),
    bonusShards: z.number().int().min(0),
  }),
  /** Ce que les éclats achètent : des tenues verrouillées (jamais de puissance). */
  shop: z.array(z.object({ id, name: z.string(), outfit: id, cost: z.number().int().min(1) })),
  /** Titres : nombre de soirs d'une Marée pour le titre. */
  titles: z.array(z.object({ tide: id, nights: z.number().int().min(1), title: z.string() })),
  /**
   * Mécène de la Marée [Décidé par Louis, 23 octobre] : un joueur offre la Marée du soir au serveur (son or est détruit) ;
   * chaque mécène donne `shardBonus` d'éclats en plus à tous les participants de ce soir, `maxPerNight` au plus.
   * Prix : `perParticipant` × participants du dernier soir réglé, au moins `minPrice`. Titres selon le nombre de soirs offerts.
   */
  patron: z
    .object({
      perParticipant: z.number().min(0),
      minPrice: z.number().int().min(1),
      maxPerNight: z.number().int().min(1),
      shardBonus: z.number().min(0),
      titles: z.array(z.object({ offered: z.number().int().min(1), title: z.string() })),
    })
    .optional(),
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
export type TideRules = z.infer<typeof tideSchema>;

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
  /** Talents des gemmes, des ensembles et des objets nommés (data/combat/talents.yaml), s'il existe. */
  talents: TalentCatalog | null;
  /** Outils de situation (data/combat/tools.yaml) : le 4 pièces des ensembles, gemmes et préparations de situation. */
  tools: Tool[];
  /** La Marée du soir (data/combat/tide.yaml), s'il existe. */
  tide: TideRules | null;
}

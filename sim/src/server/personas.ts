/**
 * Les joueurs simulés du serveur : des façons de jouer très différentes (ou au contraire la même méta pour tous),
 * chacune avec sa présence, ses priorités et sa manière de commercer.
 */

/** Comment un joueur fixe ses prix au marché. */
export type PriceStyle = 'normal' | 'dumper' | 'speculator' | 'hoarder';

export interface Persona {
  id: string;
  label: string;
  /** Profils de présence possibles (sim/src/profiles.ts), avec leur poids. */
  presence: [string, number][];
  /** 0 = choisit au hasard ; 1 = optimise tout (méta, guides, calculs). */
  skill: number;
  /** Ce qui compte pour lui : 'xp' (monter vite), 'gold' (gagner), 'balanced'. */
  goal: 'xp' | 'gold' | 'balanced';
  /** Métiers suivis : combien, et de quelles familles d'abord. */
  professions: { count: number; families: ('gathering' | 'crafting' | 'world')[] };
  /** Coups de fouet utilisés par jour (0 à 2). */
  energy: number;
  priceStyle: PriceStyle;
  /** Revoit son équipement tous les N jours (1 = à chaque visite). */
  gearEvery: number;
  /** Compare les pièces en combat (vrai calcul) ou à l'œil (palier, rareté). */
  gearByFight: boolean;
  /** Utilise des gemmes de situation devant un mur. */
  gems: boolean;
  /** Probabilité d'être dans un clan. */
  clan: number;
  /** Part de l'or au-dessus de sa réserve qu'il donne aux bâtiments chaque jour. */
  clanGenerosity: number;
  /** Fait les commandes du maître (rangs). */
  trials: boolean;
  /** Probabilité de changer de métier principal pour le plus rentable du moment, chaque semaine. */
  chaseProfit: number;
  /** Choix de la classe et de la voie : 'meta' (ce qui marche le mieux), 'random'. */
  classPick: 'meta' | 'random';
}

export const PERSONAS: Persona[] = [
  {
    id: 'tryhard',
    label: 'Tryhard méta',
    presence: [['tab16h', 0.6], ['regular2h', 0.2], ['block2h', 0.2]],
    skill: 1,
    goal: 'xp',
    professions: { count: 2, families: ['gathering', 'crafting'] },
    energy: 2,
    priceStyle: 'normal',
    gearEvery: 1,
    gearByFight: true,
    gems: true,
    clan: 0.9,
    clanGenerosity: 0.4,
    trials: true,
    chaseProfit: 0.5,
    classPick: 'meta',
  },
  {
    id: 'meta_casual',
    label: 'Casu qui suit les guides',
    presence: [['casu2v', 0.4], ['mobile', 0.4], ['casu20', 0.2]],
    skill: 0.8,
    goal: 'balanced',
    professions: { count: 2, families: ['gathering', 'crafting'] },
    energy: 2,
    priceStyle: 'normal',
    gearEvery: 2,
    gearByFight: true,
    gems: true,
    clan: 0.7,
    clanGenerosity: 0.5,
    trials: true,
    chaseProfit: 0.3,
    classPick: 'meta',
  },
  {
    id: 'casual',
    label: 'Casu tranquille',
    presence: [['casu20', 0.4], ['casu2v', 0.3], ['mobile', 0.3]],
    skill: 0.2,
    goal: 'balanced',
    professions: { count: 1, families: ['gathering', 'crafting', 'world'] },
    energy: 0.7,
    priceStyle: 'normal',
    gearEvery: 7,
    gearByFight: false,
    gems: false,
    clan: 0.5,
    clanGenerosity: 0.3,
    trials: false,
    chaseProfit: 0,
    classPick: 'random',
  },
  {
    id: 'crafter',
    label: 'Artisan du marché',
    presence: [['regular2h', 0.4], ['block2h', 0.3], ['casu2v', 0.3]],
    skill: 0.7,
    goal: 'gold',
    professions: { count: 2, families: ['crafting', 'gathering'] },
    energy: 1.5,
    priceStyle: 'normal',
    gearEvery: 3,
    gearByFight: false,
    gems: false,
    clan: 0.7,
    clanGenerosity: 0.4,
    trials: true,
    chaseProfit: 0.4,
    classPick: 'random',
  },
  {
    id: 'gatherer',
    label: 'Récolteur pur',
    presence: [['mobile', 0.4], ['casu2v', 0.3], ['tab16h', 0.3]],
    skill: 0.5,
    goal: 'gold',
    professions: { count: 1, families: ['gathering'] },
    energy: 1,
    priceStyle: 'normal',
    gearEvery: 7,
    gearByFight: false,
    gems: false,
    clan: 0.6,
    clanGenerosity: 0.4,
    trials: true,
    chaseProfit: 0.2,
    classPick: 'random',
  },
  {
    id: 'dumper',
    label: 'Bradeur pressé',
    presence: [['mobile', 0.5], ['casu20', 0.5]],
    skill: 0.3,
    goal: 'gold',
    professions: { count: 1, families: ['gathering', 'crafting'] },
    energy: 1,
    priceStyle: 'dumper',
    gearEvery: 7,
    gearByFight: false,
    gems: false,
    clan: 0.3,
    clanGenerosity: 0.2,
    trials: false,
    chaseProfit: 0,
    classPick: 'random',
  },
  {
    id: 'speculator',
    label: 'Spéculateur',
    presence: [['regular2h', 0.5], ['tab16h', 0.5]],
    skill: 0.9,
    goal: 'gold',
    professions: { count: 1, families: ['gathering'] },
    energy: 1,
    priceStyle: 'speculator',
    gearEvery: 3,
    gearByFight: true,
    gems: true,
    clan: 0.5,
    clanGenerosity: 0.1,
    trials: false,
    chaseProfit: 0.6,
    classPick: 'meta',
  },
  {
    id: 'hoarder',
    label: 'Thésauriseur (ne vend rien)',
    presence: [['casu2v', 0.5], ['block2h', 0.5]],
    skill: 0.5,
    goal: 'xp',
    professions: { count: 2, families: ['gathering', 'crafting'] },
    energy: 1,
    priceStyle: 'hoarder',
    gearEvery: 3,
    gearByFight: false,
    gems: false,
    clan: 0.4,
    clanGenerosity: 0.1,
    trials: true,
    chaseProfit: 0,
    classPick: 'random',
  },
  {
    id: 'fighter',
    label: 'Combattant avant tout',
    presence: [['tab16h', 0.4], ['regular2h', 0.3], ['casu2v', 0.3]],
    skill: 0.9,
    goal: 'xp',
    professions: { count: 1, families: ['crafting'] },
    energy: 2,
    priceStyle: 'normal',
    gearEvery: 1,
    gearByFight: true,
    gems: true,
    clan: 0.8,
    clanGenerosity: 0.3,
    trials: false,
    chaseProfit: 0,
    classPick: 'meta',
  },
  {
    id: 'collector',
    label: 'Collectionneur (tous les métiers)',
    presence: [['regular2h', 0.5], ['tab16h', 0.5]],
    skill: 0.7,
    goal: 'xp',
    professions: { count: 4, families: ['gathering', 'crafting', 'world'] },
    energy: 2,
    priceStyle: 'normal',
    gearEvery: 2,
    gearByFight: true,
    gems: true,
    clan: 0.8,
    clanGenerosity: 0.5,
    trials: true,
    chaseProfit: 0,
    classPick: 'random',
  },
  {
    id: 'afk',
    label: 'Onglet oublié (ne touche à rien)',
    presence: [['tab24h', 0.5], ['casu20', 0.5]],
    skill: 0,
    goal: 'xp',
    professions: { count: 1, families: ['gathering'] },
    energy: 0,
    priceStyle: 'hoarder',
    gearEvery: 30,
    gearByFight: false,
    gems: false,
    clan: 0.2,
    clanGenerosity: 0,
    trials: false,
    chaseProfit: 0,
    classPick: 'random',
  },
];

/** Composition d'un serveur : part de chaque façon de jouer. */
export const MIXES: Record<string, Record<string, number>> = {
  /** Un serveur réaliste : beaucoup de casus, quelques tryhards, des marchands. */
  real: { tryhard: 0.08, meta_casual: 0.17, casual: 0.3, crafter: 0.1, gatherer: 0.1, dumper: 0.06, speculator: 0.03, hoarder: 0.04, fighter: 0.06, collector: 0.03, afk: 0.03 },
  /** Tout le monde joue la méta. */
  meta: { tryhard: 0.5, meta_casual: 0.5 },
  /** Un serveur de bradeurs (pire cas pour le marché). */
  dump: { dumper: 0.4, casual: 0.3, crafter: 0.2, tryhard: 0.1 },
  /** Un serveur de collectionneurs et de thésauriseurs (pire cas pour la demande). */
  hoard: { hoarder: 0.4, collector: 0.2, afk: 0.2, casual: 0.2 },
};

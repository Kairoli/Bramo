import {
  boolean,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import type { Activity, AdvanceSummary, CombatState, EnergyState, MealBuff, QueuedAction, RolledLine } from '@bramo/shared';

/** Postgres standard uniquement : le schéma doit rester compatible Supabase. */

const ts = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });

export const accounts = pgTable('accounts', {
  id: serial('id').primaryKey(),
  /** Pseudo en minuscules, pour l'unicité. */
  username: text('username').notNull().unique(),
  displayName: text('display_name').notNull(),
  passwordHash: text('password_hash').notNull(),
  createdAt: ts('created_at').notNull().defaultNow(),
});

export const sessions = pgTable('sessions', {
  /** Empreinte SHA-256 du jeton : le jeton lui-même n'est jamais stocké. */
  id: text('id').primaryKey(),
  accountId: integer('account_id')
    .notNull()
    .references(() => accounts.id, { onDelete: 'cascade' }),
  expiresAt: ts('expires_at').notNull(),
});

export const characters = pgTable('characters', {
  id: serial('id').primaryKey(),
  accountId: integer('account_id')
    .notNull()
    .unique()
    .references(() => accounts.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  gold: integer('gold').notNull(),
  activity: jsonb('activity').$type<Activity | null>(),
  queue: jsonb('queue').$type<QueuedAction[]>().notNull().default([]),
  energy: jsonb('energy').$type<EnergyState>().notNull(),
  buff: jsonb('buff').$type<MealBuff | null>(),
  wear: jsonb('wear').$type<Record<string, number[]>>().notNull().default({}),
  prime: jsonb('prime').$type<{ dayKey: string; units: number }>().notNull().default({ dayKey: '', units: 0 }),
  npc: jsonb('npc').$type<{ dayKey: string; done: string[] }>().notNull().default({ dayKey: '', done: [] }),
  pantry: jsonb('pantry').$type<Record<string, number>>().notNull().default({}),
  /** Null tant que le joueur n'a pas choisi sa classe. */
  classId: text('class_id'),
  /** Null = tenue de départ de la classe. */
  outfit: text('outfit'),
  /** Apparence pièce par pièce (emplacement → pièce), au-dessus de la tenue. */
  /** Classes dont le set de départ a déjà été donné (une fois par classe). */
  starterClasses: jsonb('starter_classes').$type<string[]>().notNull().default([]),
  look: jsonb('look').$type<Record<string, string>>().notNull().default({}),
  trials: jsonb('trials').$type<string[]>().notNull().default([]),
  /** Surnom affiché par métier (rang choisi). */
  shown: jsonb('shown').$type<Record<string, number>>().notNull().default({}),
  /** Ornement de métier porté (null = aucun). */
  ornament: text('ornament'),
  /** Combat : XP par classe, voies, plans, activité de combat (CombatState de @bramo/shared). */
  combat: jsonb('combat').$type<Partial<CombatState>>().notNull().default({}),
  lastTickAt: ts('last_tick_at').notNull(),
  lastSeenAt: ts('last_seen_at').notNull(),
  createdAt: ts('created_at').notNull().defaultNow(),
});

export const characterSkills = pgTable(
  'character_skills',
  {
    characterId: integer('character_id')
      .notNull()
      .references(() => characters.id, { onDelete: 'cascade' }),
    skill: text('skill').notNull(),
    xp: doublePrecision('xp').notNull(),
  },
  (t) => [primaryKey({ columns: [t.characterId, t.skill] })],
);

/** Exemplaires d'équipement : un identifiant propre, des lignes tirées, une usure, un emplacement porté (ou null : dans le sac). */
export const gearItems = pgTable(
  'gear_items',
  {
    id: serial('id').primaryKey(),
    characterId: integer('character_id')
      .notNull()
      .references(() => characters.id, { onDelete: 'cascade' }),
    modelId: text('model_id').notNull(),
    lines: jsonb('lines').$type<RolledLine[]>().notNull().default([]),
    masterpiece: boolean('masterpiece').notNull().default(false),
    signedBy: text('signed_by'),
    /** Usure en ms de combat effectif. */
    wear: doublePrecision('wear').notNull().default(0),
    equipped: text('equipped'),
    /** Gemme sertie (outil de situation, data/combat/tools.yaml), ou null. */
    gem: text('gem'),
    createdAt: ts('created_at').notNull().defaultNow(),
  },
  (t) => [index('gear_items_character').on(t.characterId)],
);

export const characterItems = pgTable(
  'character_items',
  {
    characterId: integer('character_id')
      .notNull()
      .references(() => characters.id, { onDelete: 'cascade' }),
    itemId: text('item_id').notNull(),
    qty: integer('qty').notNull(),
  },
  (t) => [primaryKey({ columns: [t.characterId, t.itemId] })],
);

export const marketOrders = pgTable(
  'market_orders',
  {
    id: serial('id').primaryKey(),
    characterId: integer('character_id')
      .notNull()
      .references(() => characters.id, { onDelete: 'cascade' }),
    side: text('side').$type<'buy' | 'sell'>().notNull(),
    itemId: text('item_id').notNull(),
    /** Quantité restante à échanger. */
    qty: integer('qty').notNull(),
    price: integer('price').notNull(),
    /** Usure de l'exemplaire proposé (objets durables), en ms. */
    wear: integer('wear').notNull().default(0),
    /** Or net des ventes déjà conclues, que le propriétaire récupère à son prochain passage. */
    collectGold: integer('collect_gold').notNull().default(0),
    /** Objets déjà achetés par un ordre d'achat, à récupérer. */
    collectQty: integer('collect_qty').notNull().default(0),
    createdAt: ts('created_at').notNull().defaultNow(),
  },
  (t) => [index('market_orders_book').on(t.itemId, t.side, t.price), index('market_orders_owner').on(t.characterId)],
);

/** Demandes de réparation à un artisan : l'outil et l'or sont mis de côté ; réparé, l'outil attend son propriétaire. */
export const repairRequests = pgTable(
  'repair_requests',
  {
    id: serial('id').primaryKey(),
    characterId: integer('character_id')
      .notNull()
      .references(() => characters.id, { onDelete: 'cascade' }),
    itemId: text('item_id').notNull(),
    /** Usure de l'exemplaire confié, en ms. */
    wear: integer('wear').notNull(),
    /** Or mis de côté, versé (moins la taxe) à l'artisan. */
    fee: integer('fee').notNull(),
    /** Renseigné quand un artisan a réparé : l'outil est à récupérer par son propriétaire. */
    doneAt: ts('done_at'),
    createdAt: ts('created_at').notNull().defaultNow(),
  },
  (t) => [index('repair_requests_open').on(t.doneAt), index('repair_requests_owner').on(t.characterId)],
);

/** Fil du serveur : annonces publiques (paliers de niveau, épreuves, premières fabrications, arrivées). */
export const serverEvents = pgTable('server_events', {
  id: serial('id').primaryKey(),
  at: ts('at').notNull(),
  kind: text('kind').notNull(),
  text: text('text').notNull(),
});

/** Premier personnage à avoir fabriqué chaque objet sur ce serveur. */
export const serverFirsts = pgTable('server_firsts', {
  itemId: text('item_id').primaryKey(),
  characterName: text('character_name').notNull(),
  at: ts('at').notNull().defaultNow(),
});

/** Clans : bâtiments à boosts construits par les membres (docs/design/monde.md §3). */
export const clans = pgTable('clans', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  /** Nom en minuscules, unique : « Les Braises » et « les braises » sont le même clan. */
  nameKey: text('name_key').notNull().unique(),
  description: text('description').notNull().default(''),
  createdAt: ts('created_at').notNull().defaultNow(),
});

export const clanMembers = pgTable('clan_members', {
  characterId: integer('character_id')
    .primaryKey()
    .references(() => characters.id, { onDelete: 'cascade' }),
  clanId: integer('clan_id')
    .notNull()
    .references(() => clans.id, { onDelete: 'cascade' }),
  rank: text('rank').$type<'leader' | 'officer' | 'member'>().notNull(),
  joinedAt: ts('joined_at').notNull().defaultNow(),
});

/** Bâtiments construits par un clan. */
export const clanBuildings = pgTable(
  'clan_buildings',
  {
    clanId: integer('clan_id')
      .notNull()
      .references(() => clans.id, { onDelete: 'cascade' }),
    buildingId: text('building_id').notNull(),
    level: integer('level').notNull(),
  },
  (t) => [primaryKey({ columns: [t.clanId, t.buildingId] })],
);

/** Apports déjà faits pour le niveau suivant d'un bâtiment : or (what = 'gold') ou objets. */
export const clanProgress = pgTable(
  'clan_progress',
  {
    clanId: integer('clan_id')
      .notNull()
      .references(() => clans.id, { onDelete: 'cascade' }),
    buildingId: text('building_id').notNull(),
    what: text('what').notNull(),
    qty: integer('qty').notNull(),
  },
  (t) => [primaryKey({ columns: [t.clanId, t.buildingId, t.what] })],
);

export const clanLog = pgTable(
  'clan_log',
  {
    id: serial('id').primaryKey(),
    clanId: integer('clan_id')
      .notNull()
      .references(() => clans.id, { onDelete: 'cascade' }),
    at: ts('at').notNull(),
    text: text('text').notNull(),
  },
  (t) => [index('clan_log_clan').on(t.clanId, t.at)],
);

export const journal = pgTable(
  'journal',
  {
    id: serial('id').primaryKey(),
    characterId: integer('character_id')
      .notNull()
      .references(() => characters.id, { onDelete: 'cascade' }),
    at: ts('at').notNull(),
    kind: text('kind').notNull(),
    text: text('text').notNull(),
    data: jsonb('data').$type<AdvanceSummary>(),
  },
  (t) => [index('journal_character_at').on(t.characterId, t.at)],
);

import {
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
import type { Activity, AdvanceSummary, EnergyState, MealBuff, QueuedAction } from '@bramo/shared';

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
  trials: jsonb('trials').$type<string[]>().notNull().default([]),
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

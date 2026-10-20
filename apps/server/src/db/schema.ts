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

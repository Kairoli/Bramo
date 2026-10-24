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
import type { Activity, AdvanceSummary, CombatState, EnergyState, MealBuff, QueuedAction, RolledLine, TideAward, TideStats } from '@bramo/shared';

/** Postgres standard uniquement : le schéma doit rester compatible Supabase. */

const ts = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });

export const accounts = pgTable('accounts', {
  id: serial('id').primaryKey(),
  /** Pseudo en minuscules, pour l'unicité. */
  username: text('username').notNull().unique(),
  displayName: text('display_name').notNull(),
  passwordHash: text('password_hash').notNull(),
  /** Rôle : joueur, ou modérateur de la discussion (donné en ligne de commande, `pnpm --filter @bramo/server role`). */
  role: text('role').$type<'player' | 'moderator'>().notNull().default('player'),
  /** Muet dans la discussion jusqu'à cette date (décision d'un modérateur), ou null. */
  mutedUntil: ts('muted_until'),
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
  /** Titre affiché sous le nom, choisi à part de l'ornement (null = par défaut). */
  title: text('title'),
  /** Photo de profil visible : son numéro de version (adresse de l'image), null sans photo ou photo masquée. */
  avatar: integer('avatar'),
  /** Page profil : la devise (une phrase) et la bannière (un décor du jeu, apps/web/public/scenes) ; null : par défaut. */
  motto: text('motto'),
  banner: text('banner'),
  /** Le tour guidé de la première session a été vu (ou passé). */
  tourDone: boolean('tour_done').notNull().default(false),
  /** Combat : XP par classe, voies, plans, activité de combat (CombatState de @bramo/shared). */
  combat: jsonb('combat').$type<Partial<CombatState>>().notNull().default({}),
  lastTickAt: ts('last_tick_at').notNull(),
  lastSeenAt: ts('last_seen_at').notNull(),
  /** Qui peut lui écrire en privé : tout le monde (par défaut) ou ses amis et son clan. */
  dmPolicy: text('dm_policy').notNull().default('all'),
  /** Il accepte qu'on lui passe des commandes (docs/design/social.md §3). */
  ordersOpen: boolean('orders_open').notNull().default(true),
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
    /** En vitrine au marché à ce prix (ni portée, ni sertie), ou null. */
    price: integer('price'),
    /** Rang d'affinage (l'Affineur du bourg, sans plafond) et affûtages déjà faits. */
    rank: integer('rank').notNull().default(0),
    hones: integer('hones').notNull().default(0),
    /** Retaille : la ligne retaillable (fixée à la première), les retailles faites, les propositions en attente. */
    rerollLine: integer('reroll_line'),
    rerolls: integer('rerolls').notNull().default(0),
    rerollOffer: jsonb('reroll_offer').$type<RolledLine[] | null>(),
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
  /** Renom : l'histoire du clan, qui ne baisse jamais (rangs de prestige). */
  renown: integer('renown').notNull().default(0),
  /** Ouvrages du clan : niveaux achevés, Banquets en réserve, banquet en cours (data/clan_works.yaml). */
  worksLevel: integer('works_level').notNull().default(0),
  banquets: integer('banquets').notNull().default(0),
  banquetFrom: ts('banquet_from'),
  banquetUntil: ts('banquet_until'),
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

/** La Marée du soir : un soir réglé (une fois pour tout le serveur), son total et ses seuils franchis. */
export const tideDays = pgTable('tide_days', {
  day: integer('day').primaryKey(),
  tide: text('tide').notNull(),
  participants: integer('participants').notNull().default(0),
  points: integer('points').notNull().default(0),
  thresholds: integer('thresholds').notNull().default(0),
  /** Récapitulatif de fin de soirée : le meilleur de chaque rôle (tideRecap). */
  recap: jsonb('recap').$type<TideAward[]>().notNull().default([]),
  settledAt: ts('settled_at').notNull(),
});

/** Inscrits à la Marée d'un soir (19 h à 20 h), pour la scène en direct (GET /api/tide/live). */
export const tideSignups = pgTable(
  'tide_signups',
  {
    day: integer('day').notNull(),
    characterId: integer('character_id')
      .notNull()
      .references(() => characters.id, { onDelete: 'cascade' }),
    at: ts('at').notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.day, t.characterId] })],
);

/** Ce que chaque participant a marqué un soir ; les éclats arrivent à sa prochaine visite (`claimed`). */
export const tideEntries = pgTable(
  'tide_entries',
  {
    day: integer('day').notNull(),
    characterId: integer('character_id')
      .notNull()
      .references(() => characters.id, { onDelete: 'cascade' }),
    tide: text('tide').notNull(),
    points: integer('points').notNull(),
    ratio: doublePrecision('ratio').notNull(),
    channel: text('channel').notNull(),
    live: boolean('live').notNull().default(false),
    shards: integer('shards').notNull().default(0),
    claimed: boolean('claimed').notNull().default(false),
    /** Ce qu'il a fait ce soir-là (dégâts, soins, boucliers, contrôle), pour le classement ; null : canal travail. */
    stats: jsonb('stats').$type<TideStats | null>(),
  },
  (t) => [primaryKey({ columns: [t.day, t.characterId] }), index('tide_entries_character').on(t.characterId, t.claimed)],
);

/** Discussion : le canal du serveur (`server`) ou celui d'un clan (`clan:<id>`). Un message masqué ne s'affiche plus. */
export const chatMessages = pgTable(
  'chat_messages',
  {
    id: serial('id').primaryKey(),
    channel: text('channel').notNull(),
    characterId: integer('character_id').references(() => characters.id, { onDelete: 'set null' }),
    name: text('name').notNull(),
    text: text('text').notNull(),
    at: ts('at').notNull(),
    hidden: boolean('hidden').notNull().default(false),
  },
  (t) => [index('chat_messages_channel').on(t.channel, t.id)],
);

/** Signalements d'un message (un par joueur) : à partir de `chat.reportsToHide`, le message est masqué. */
export const chatReports = pgTable(
  'chat_reports',
  {
    messageId: integer('message_id')
      .notNull()
      .references(() => chatMessages.id, { onDelete: 'cascade' }),
    characterId: integer('character_id')
      .notNull()
      .references(() => characters.id, { onDelete: 'cascade' }),
    at: ts('at').notNull(),
  },
  (t) => [primaryKey({ columns: [t.messageId, t.characterId] })],
);

/** Amis (docs/design/social.md) : une demande (status « pending ») de requester à addressee, puis acceptée (« accepted »). */
export const friendships = pgTable(
  'friendships',
  {
    requesterId: integer('requester_id')
      .notNull()
      .references(() => characters.id, { onDelete: 'cascade' }),
    addresseeId: integer('addressee_id')
      .notNull()
      .references(() => characters.id, { onDelete: 'cascade' }),
    status: text('status').notNull(),
    createdAt: ts('created_at').notNull(),
    acceptedAt: ts('accepted_at'),
  },
  (t) => [primaryKey({ columns: [t.requesterId, t.addresseeId] }), index('friendships_addressee').on(t.addresseeId)],
);

/** Blocages : le bloqué ne peut plus écrire, demander en ami ni passer commande ; ses messages publics sont masqués. */
export const blocks = pgTable(
  'blocks',
  {
    blockerId: integer('blocker_id')
      .notNull()
      .references(() => characters.id, { onDelete: 'cascade' }),
    blockedId: integer('blocked_id')
      .notNull()
      .references(() => characters.id, { onDelete: 'cascade' }),
    at: ts('at').notNull(),
  },
  (t) => [primaryKey({ columns: [t.blockerId, t.blockedId] })],
);

/** Messages privés : gardés settings.social.historyDays jours ; un modérateur ne voit qu'un message signalé. */
export const privateMessages = pgTable(
  'private_messages',
  {
    id: serial('id').primaryKey(),
    fromId: integer('from_id')
      .notNull()
      .references(() => characters.id, { onDelete: 'cascade' }),
    toId: integer('to_id')
      .notNull()
      .references(() => characters.id, { onDelete: 'cascade' }),
    text: text('text').notNull(),
    at: ts('at').notNull(),
    readAt: ts('read_at'),
    reported: boolean('reported').notNull().default(false),
  },
  (t) => [index('private_messages_to').on(t.toId, t.id), index('private_messages_from').on(t.fromId, t.id)],
);

/**
 * Commandes entre joueurs (docs/design/social.md §3) : l'or du client (et ses matériaux) mis de côté à la commande ;
 * proposée, acceptée (les matériaux passent à l'artisan, la date limite part), livrée (l'artisan est payé, moins la taxe),
 * refusée, annulée ou expirée. Une commande ouverte (« open », sans artisan) attend sur le panneau des commandes, au clan ou à
 * tout le serveur, que le premier artisan qui sait la faire la prenne. clientSettled : le client a reçu ce qui lui revient (objets livrés ou remboursement).
 */
export const artisanOrders = pgTable(
  'artisan_orders',
  {
    id: serial('id').primaryKey(),
    clientId: integer('client_id')
      .notNull()
      .references(() => characters.id, { onDelete: 'cascade' }),
    /** null : commande ouverte, pas encore prise (docs/design/social.md §4.4). */
    artisanId: integer('artisan_id').references(() => characters.id, { onDelete: 'cascade' }),
    /** À qui elle s'adresse : un artisan désigné, le clan du client, ou tout le serveur. */
    scope: text('scope').notNull().default('direct'),
    clanId: integer('clan_id').references(() => clans.id, { onDelete: 'set null' }),
    kind: text('kind').notNull(),
    target: text('target').notNull(),
    qty: integer('qty').notNull(),
    price: integer('price').notNull(),
    materials: jsonb('materials').$type<{ item: string; qty: number }[]>().notNull(),
    delay: text('delay').notNull(),
    delayHours: integer('delay_hours').notNull(),
    message: text('message'),
    status: text('status').notNull(),
    createdAt: ts('created_at').notNull(),
    acceptedAt: ts('accepted_at'),
    deadline: ts('deadline'),
    closedAt: ts('closed_at'),
    onTime: boolean('on_time'),
    clientSettled: boolean('client_settled').notNull().default(false),
  },
  (t) => [index('artisan_orders_client').on(t.clientId, t.status), index('artisan_orders_artisan').on(t.artisanId, t.status)],
);

/**
 * Transactions du marché entre joueurs (une ligne par échange conclu) : courbe de prix d'un objet, historique d'un joueur.
 * Les joueurs supprimés laissent leurs échanges (acheteur ou vendeur à null) : la courbe de prix ne change pas.
 */
export const marketTrades = pgTable(
  'market_trades',
  {
    id: serial('id').primaryKey(),
    itemId: text('item_id').notNull(),
    qty: integer('qty').notNull(),
    /** Prix unitaire de l'échange. */
    price: integer('price').notNull(),
    buyerId: integer('buyer_id').references(() => characters.id, { onDelete: 'set null' }),
    sellerId: integer('seller_id').references(() => characters.id, { onDelete: 'set null' }),
    at: ts('at').notNull(),
  },
  (t) => [index('market_trades_item').on(t.itemId, t.at), index('market_trades_buyer').on(t.buyerId, t.at), index('market_trades_seller').on(t.sellerId, t.at)],
);

/** Mécènes de la Marée : qui a offert le soir `day` (une place par `slot`, `patron.maxPerNight` au plus). */
export const tidePatrons = pgTable(
  'tide_patrons',
  {
    day: integer('day').notNull(),
    slot: integer('slot').notNull(),
    characterId: integer('character_id')
      .notNull()
      .references(() => characters.id, { onDelete: 'cascade' }),
    characterName: text('character_name').notNull(),
    gold: integer('gold').notNull(),
    at: ts('at').notNull(),
  },
  (t) => [primaryKey({ columns: [t.day, t.slot] })],
);

/** Vitrine : l'or d'une pièce vendue, versé au vendeur à sa prochaine visite. */
export const gearSales = pgTable(
  'gear_sales',
  {
    id: serial('id').primaryKey(),
    sellerId: integer('seller_id')
      .notNull()
      .references(() => characters.id, { onDelete: 'cascade' }),
    modelId: text('model_id').notNull(),
    gold: integer('gold').notNull(),
    at: ts('at').notNull(),
  },
  (t) => [index('gear_sales_seller').on(t.sellerId)],
);

/** Photo de profil d'un personnage (apps/server/src/avatar.ts) : l'image recadrée, en base64, et sa version. */
export const characterAvatars = pgTable('character_avatars', {
  characterId: integer('character_id')
    .primaryKey()
    .references(() => characters.id, { onDelete: 'cascade' }),
  mime: text('mime').notNull(),
  data: text('data').notNull(),
  version: integer('version').notNull(),
  /** Masquée après assez de signalements. */
  hidden: boolean('hidden').notNull().default(false),
  updatedAt: ts('updated_at').notNull(),
});

/** Signalements d'une photo de profil (un par joueur et par version de la photo). */
export const avatarReports = pgTable(
  'avatar_reports',
  {
    characterId: integer('character_id')
      .notNull()
      .references(() => characters.id, { onDelete: 'cascade' }),
    reporterId: integer('reporter_id')
      .notNull()
      .references(() => characters.id, { onDelete: 'cascade' }),
    version: integer('version').notNull(),
    at: ts('at').notNull(),
  },
  (t) => [primaryKey({ columns: [t.characterId, t.reporterId, t.version] })],
);

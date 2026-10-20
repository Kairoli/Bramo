import Fastify, { type FastifyReply, type FastifyRequest } from 'fastify';
import cookie from '@fastify/cookie';
import { eq } from 'drizzle-orm';
import { ZodError, type z } from 'zod';
import {
  type Content,
  type ContentResponse,
  GameError,
  buyItem,
  cancelAction,
  cancelBody,
  credentialsBody,
  eatMeal,
  itemBody,
  newCharacterState,
  sellItem,
  startActivity,
  startBody,
  tradeBody,
} from '@bramo/shared';
import type { Db } from './db/index.js';
import { accounts, characters } from './db/schema.js';
import {
  SESSION_COOKIE,
  SESSION_DAYS,
  accountForToken,
  createSession,
  deleteSession,
  hashPassword,
  verifyPassword,
} from './auth.js';
import { type Action, NoCharacterError, play } from './game.js';
import { recentEntries } from './journal.js';

export interface AppOptions {
  db: Db;
  content: Content;
  /** Horloge injectable pour les tests. */
  clock?: () => number;
  secureCookies?: boolean;
}

class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export async function buildApp({ db, content, clock = Date.now, secureCookies = false }: AppOptions) {
  const app = Fastify({ logger: { level: process.env.LOG_LEVEL ?? 'info' }, disableRequestLogging: true });
  await app.register(cookie);

  app.setErrorHandler((err, _req, reply) => {
    if (err instanceof GameError) return reply.status(400).send({ code: err.code, message: err.message });
    if (err instanceof HttpError) return reply.status(err.status).send({ code: err.code, message: err.message });
    if (err instanceof ZodError) {
      return reply.status(400).send({ code: 'invalid', message: err.issues[0]?.message ?? 'Requête invalide.' });
    }
    app.log.error(err);
    return reply.status(500).send({ code: 'server', message: 'Erreur du serveur.' });
  });

  const setSessionCookie = (reply: FastifyReply, token: string) =>
    reply.setCookie(SESSION_COOKIE, token, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: secureCookies,
      maxAge: SESSION_DAYS * 86_400,
    });

  async function requireAccount(req: FastifyRequest): Promise<number> {
    const accountId = await accountForToken(db, req.cookies[SESSION_COOKIE], new Date(clock()));
    if (!accountId) throw new HttpError(401, 'unauthorized', 'Session expirée, reconnectez-vous.');
    return accountId;
  }

  async function playAs(req: FastifyRequest, action?: Action) {
    const accountId = await requireAccount(req);
    try {
      return await play(db, content, accountId, clock(), action);
    } catch (err) {
      if (err instanceof NoCharacterError) throw new HttpError(404, 'no_character', 'Aucun personnage.');
      throw err;
    }
  }

  const body = <T>(schema: z.ZodType<T>, req: FastifyRequest): T => schema.parse(req.body);
  const recipeName = (id: string) => content.recipes[id]?.name ?? id;
  const itemName = (id: string) => content.items[id]?.name ?? id;

  // --- Contenu public ---

  const publicContent: ContentResponse = {
    settings: content.settings,
    professions: content.professions,
    items: content.items,
    recipes: content.recipes,
  };
  app.get('/api/health', async () => ({ ok: true }));
  app.get('/api/content', async () => publicContent);

  // --- Comptes ---

  app.post('/api/auth/register', async (req, reply) => {
    const { username, password } = body(credentialsBody, req);
    const now = clock();
    const passwordHash = await hashPassword(password);
    const accountId = await db.transaction(async (tx) => {
      const existing = await tx.select().from(accounts).where(eq(accounts.username, username.toLowerCase()));
      if (existing.length) throw new HttpError(409, 'taken', 'Ce pseudo est déjà pris.');
      const [account] = await tx
        .insert(accounts)
        .values({ username: username.toLowerCase(), displayName: username, passwordHash })
        .returning();
      const s = newCharacterState(now, content);
      await tx.insert(characters).values({
        accountId: account!.id,
        name: username,
        gold: s.gold,
        activity: s.activity,
        queue: s.queue,
        energy: s.energy,
        buff: s.buff,
        lastTickAt: new Date(s.lastTickAt),
        lastSeenAt: new Date(s.lastSeenAt),
      });
      return account!.id;
    });
    setSessionCookie(reply, await createSession(db, accountId, new Date(now)));
    return { ok: true };
  });

  app.post('/api/auth/login', async (req, reply) => {
    const { username, password } = body(credentialsBody, req);
    const [account] = await db.select().from(accounts).where(eq(accounts.username, username.toLowerCase()));
    if (!account || !(await verifyPassword(password, account.passwordHash))) {
      throw new HttpError(401, 'credentials', 'Pseudo ou mot de passe incorrect.');
    }
    setSessionCookie(reply, await createSession(db, account.id, new Date(clock())));
    return { ok: true };
  });

  app.post('/api/auth/logout', async (req, reply) => {
    const token = req.cookies[SESSION_COOKIE];
    if (token) await deleteSession(db, token);
    reply.clearCookie(SESSION_COOKIE, { path: '/' });
    return { ok: true };
  });

  // --- Jeu : chaque route recalcule la progression puis applique l'intention du joueur ---

  /** Sert aussi de signe de vie : le client l'appelle régulièrement tant que l'onglet est visible. */
  app.get('/api/state', (req) => playAs(req));

  app.post('/api/activity/start', (req) => {
    const { recipeId, quantity, mode } = body(startBody, req);
    return playAs(req, (state, now) => {
      const replacing = mode === 'replace' && state.activity;
      const queued = mode === 'queue' && state.activity;
      return {
        state: startActivity(state, recipeId, quantity, mode, now, content),
        log: queued
          ? `Ajouté à la file : ${quantity} × ${recipeName(recipeId)}.`
          : `${replacing ? 'Vous passez à' : 'Vous lancez'} : ${quantity} × ${recipeName(recipeId)}.`,
      };
    });
  });

  app.post('/api/activity/cancel', (req) => {
    const { index } = body(cancelBody, req);
    return playAs(req, (state, now) => ({ state: cancelAction(state, index, now) }));
  });

  app.post('/api/items/eat', (req) => {
    const { itemId } = body(itemBody, req);
    return playAs(req, (state, now) => ({
      state: eatMeal(state, itemId, now, content),
      log: `Vous mangez : ${itemName(itemId)}.`,
    }));
  });

  app.post('/api/shop/buy', (req) => {
    const { itemId, qty } = body(tradeBody, req);
    return playAs(req, (state) => ({
      state: buyItem(state, itemId, qty, content),
      log: `Achat : ${qty} × ${itemName(itemId)}.`,
    }));
  });

  app.post('/api/shop/sell', (req) => {
    const { itemId, qty } = body(tradeBody, req);
    return playAs(req, (state) => ({
      state: sellItem(state, itemId, qty, content),
      log: `Vente : ${qty} × ${itemName(itemId)}.`,
    }));
  });

  app.get('/api/journal', async (req) => {
    const accountId = await requireAccount(req);
    const [character] = await db.select({ id: characters.id }).from(characters).where(eq(characters.accountId, accountId));
    if (!character) throw new HttpError(404, 'no_character', 'Aucun personnage.');
    return recentEntries(db, character.id, 100);
  });

  return app;
}

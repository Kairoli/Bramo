import Fastify, { type FastifyReply, type FastifyRequest } from 'fastify';
import cookie from '@fastify/cookie';
import { eq } from 'drizzle-orm';
import { ZodError, type z } from 'zod';
import {
  type Content,
  type ContentResponse,
  GameError,
  activateEnergy,
  completeNpcOrder,
  repairIdBody,
  repairWithMaterials,
  requestRepairBody,
  stallBody,
  fillOrderBody,
  npcOrderBody,
  orderIdBody,
  placeOrderBody,
  cancelAction,
  cancelBody,
  chooseClass,
  classBody,
  completeTrial,
  credentialsBody,
  eatMeal,
  recycleItem,
  repairCost,
  repairItem,
  stockPantry,
  unstockPantry,
  itemBody,
  newCharacterState,
  startActivity,
  startBody,
  tradeBody,
  trialBody,
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
import { cancelRepair, openRepairs, requestRepair, takeRepair } from './repairs.js';
import { buyFromStall, cancelOrder, fillOrder, marketBook, marketSummary, myOrders, placeOrder } from './market.js';

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
  const app = Fastify({ logger: { level: process.env.LOG_LEVEL ?? 'warn' } });
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

  async function myCharacter(req: FastifyRequest) {
    const accountId = await requireAccount(req);
    const [me] = await db.select().from(characters).where(eq(characters.accountId, accountId));
    if (!me) throw new HttpError(404, 'no_character', 'Aucun personnage.');
    return me;
  }

  const body = <T>(schema: z.ZodType<T>, req: FastifyRequest): T => schema.parse(req.body);
  const recipeName = (id: string) => content.recipes[id]?.name ?? id;
  const itemName = (id: string) => content.items[id]?.name ?? id;

  // --- Contenu public ---

  const publicContent: ContentResponse = {
    settings: content.settings,
    professions: content.professions,
    items: content.items,
    npcOrders: content.npcOrders,
    recipes: content.recipes,
    trials: content.trials,
    classes: content.classes,
    cosmetics: content.cosmetics,
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
        classId: s.classId,
        outfit: s.outfit,
        trials: s.trials,
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

  app.post('/api/shop/repair', (req) => {
    const { itemId } = body(itemBody, req);
    return playAs(req, (state) => ({
      state: repairItem(state, itemId, content),
      log: `Réparation : ${itemName(itemId)} (${repairCost(itemId, state, content)} or).`,
    }));
  });

  app.post('/api/items/recycle', (req) => {
    const { itemId, qty } = body(tradeBody, req);
    return playAs(req, (state) => ({
      state: recycleItem(state, itemId, qty, content),
      log: `Recyclage : ${qty} × ${itemName(itemId)}.`,
    }));
  });

  app.post('/api/pantry/stock', (req) => {
    const { itemId, qty } = body(tradeBody, req);
    return playAs(req, (state) => ({ state: stockPantry(state, itemId, qty, content) }));
  });

  app.post('/api/pantry/unstock', (req) => {
    const { itemId, qty } = body(tradeBody, req);
    return playAs(req, (state) => ({ state: unstockPantry(state, itemId, qty) }));
  });

  app.post('/api/energy/activate', (req) =>
    playAs(req, (state, now) => ({
      state: activateEnergy(state, now, content),
      log: `Coup de fouet : rendement ×${String(content.settings.energy.multiplier).replace('.', ',')} pendant ${content.settings.energy.durationMin} min.`,
    })),
  );

  app.post('/api/market/order', (req) => {
    const p = body(placeOrderBody, req);
    return playAs(req, async (state, now, { tx, characterId }) => placeOrder(tx, content, characterId, state, p, now));
  });

  app.post('/api/market/fill', (req) => {
    const { orderId, qty } = body(fillOrderBody, req);
    return playAs(req, async (state, _now, { tx, characterId }) => fillOrder(tx, content, characterId, state, orderId, qty));
  });

  app.post('/api/market/cancel', (req) => {
    const { orderId } = body(orderIdBody, req);
    return playAs(req, async (state, _now, { tx, characterId }) => cancelOrder(tx, content, characterId, state, orderId));
  });

  app.get('/api/market', async (req) => {
    await requireAccount(req);
    return marketSummary(db);
  });

  app.get('/api/market/mine', async (req) => {
    const me = await myCharacter(req);
    return myOrders(db, me.id, me.name);
  });

  app.get('/api/market/item/:itemId', async (req) => {
    const me = await myCharacter(req);
    const { itemId } = req.params as { itemId: string };
    if (!content.items[itemId]) throw new HttpError(404, 'unknown_item', 'Objet inconnu.');
    return marketBook(db, itemId, me.id);
  });

  app.post('/api/stall/buy', (req) => {
    const { itemId, qty } = body(stallBody, req);
    return playAs(req, async (state, _now, { tx }) => buyFromStall(tx, content, state, itemId, qty));
  });

  app.post('/api/items/repair-self', (req) => {
    const { itemId } = body(itemBody, req);
    return playAs(req, (state) => ({
      state: repairWithMaterials(state, itemId, content),
      log: `Réparation avec vos matériaux : ${itemName(itemId)}.`,
    }));
  });

  app.post('/api/repairs/request', (req) => {
    const p = body(requestRepairBody, req);
    return playAs(req, async (state, _now, { tx, characterId }) => requestRepair(tx, content, characterId, state, p));
  });

  app.post('/api/repairs/take', (req) => {
    const { requestId } = body(repairIdBody, req);
    return playAs(req, async (state, now, { tx, characterId }) => takeRepair(tx, content, characterId, state, requestId, now));
  });

  app.post('/api/repairs/cancel', (req) => {
    const { requestId } = body(repairIdBody, req);
    return playAs(req, async (state, _now, { tx, characterId }) => cancelRepair(tx, content, characterId, state, requestId));
  });

  app.get('/api/repairs', async (req) => {
    const me = await myCharacter(req);
    return openRepairs(db, me.id);
  });

  app.post('/api/npc/complete', (req) => {
    const { orderId } = body(npcOrderBody, req);
    return playAs(req, (state, now) => ({
      state: completeNpcOrder(state, orderId, now, content),
      log: `Commande honorée : ${content.npcOrders[orderId]?.client ?? orderId} (+${content.npcOrders[orderId]?.gold ?? 0} or).`,
    }));
  });

  app.post('/api/character/class', (req) => {
    const { classId } = body(classBody, req);
    return playAs(req, (state) => ({
      state: chooseClass(state, classId, content),
      log: `${state.classId ? 'Vous changez de classe' : 'Vous choisissez votre classe'} : ${content.classes[classId]?.name}.`,
    }));
  });

  app.post('/api/trials/complete', (req) => {
    const { trialId } = body(trialBody, req);
    return playAs(req, (state) => {
      const trial = content.trials[trialId];
      const next = completeTrial(state, trialId, content);
      const title = trial && content.settings.titles.find((t) => t.level === trial.rank)?.name;
      const profession = trial && content.professions.find((p) => p.id === trial.profession);
      return {
        state: next,
        log: `Épreuve réussie : « ${trial?.name} ». Vous devenez ${title} en ${profession?.name}, +${trial?.reward.gold} or.`,
        logKind: 'trial',
      };
    });
  });

  app.get('/api/journal', async (req) => {
    const accountId = await requireAccount(req);
    const [character] = await db.select({ id: characters.id }).from(characters).where(eq(characters.accountId, accountId));
    if (!character) throw new HttpError(404, 'no_character', 'Aucun personnage.');
    return recentEntries(db, character.id, 100);
  });

  return app;
}

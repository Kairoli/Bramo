import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { StateResponse } from '@bramo/shared';
import { loadContent } from '@bramo/shared/node';
import { buildApp } from '../src/app.js';
import { createDb } from '../src/db/index.js';

process.env.LOG_LEVEL ??= 'silent';
const content = loadContent(fileURLToPath(new URL('../../../data', import.meta.url)));
let now = Date.UTC(2026, 0, 10, 12);
let app: Awaited<ReturnType<typeof buildApp>>;
let close: () => Promise<void>;
let cookie = '';

beforeAll(async () => {
  // PGlite en mémoire : aucune base externe nécessaire pour les tests.
  const created = await createDb(undefined, 'memory://');
  close = created.close;
  app = await buildApp({ db: created.db, content, clock: () => now });
});
afterAll(async () => {
  await app.close();
  await close();
});

const call = async (method: 'GET' | 'POST', url: string, payload?: object) => {
  const res = await app.inject({ method, url, payload, headers: { cookie } });
  const set = res.headers['set-cookie'];
  if (set) cookie = String(Array.isArray(set) ? set[0] : set).split(';')[0]!;
  return { status: res.statusCode, json: res.json() };
};

describe('API', () => {
  it('refuse l’accès sans session', async () => {
    expect((await call('GET', '/api/state')).status).toBe(401);
  });

  it('inscrit un joueur et crée son personnage', async () => {
    const res = await call('POST', '/api/auth/register', { username: 'Brann', password: 'motdepasse' });
    expect(res.status).toBe(200);
    const state = (await call('GET', '/api/state')).json as StateResponse;
    expect(state.name).toBe('Brann');
    expect(state.state.gold).toBe(content.settings.character.startingGold);
    expect(state.state.skills.mining?.level).toBe(1);
  });

  it('fait choisir la classe au nouveau personnage, puis la laisse changer', async () => {
    const fresh = (await call('GET', '/api/state')).json as StateResponse;
    expect(fresh.state.classId).toBeNull();
    const chosen = (await call('POST', '/api/character/class', { classId: 'forgefire' })).json as StateResponse;
    expect(chosen.state.appearance).toEqual({ classId: 'forgefire', outfit: 'embers' });
    expect(chosen.journal[0]?.text).toBe('Vous choisissez votre classe : Forgefeu.');
    const changed = (await call('POST', '/api/character/class', { classId: 'runist' })).json as StateResponse;
    expect(changed.state.appearance).toEqual({ classId: 'runist', outfit: 'ashes' });
    expect((await call('POST', '/api/character/class', { classId: 'paladin' })).status).toBe(400);
  });

  it('refuse une épreuve de maître avant son niveau', async () => {
    const res = await call('POST', '/api/trials/complete', { trialId: 'mining_apprentice' });
    expect(res.status).toBe(400);
    expect(res.json.message).toBe('Niveau 30 requis pour cette épreuve.');
    const state = (await call('GET', '/api/state')).json as StateResponse;
    expect(state.state.trials.mining_apprentice).toBe('locked');
    expect(state.state.skills.mining?.nextTitle).toMatchObject({ name: 'Apprenti', trialId: 'mining_apprentice' });
  });

  it('refuse un pseudo déjà pris', async () => {
    const res = await call('POST', '/api/auth/register', { username: 'brann', password: 'motdepasse' });
    expect(res.status).toBe(409);
  });

  it('refuse une recette au-dessus du niveau', async () => {
    const res = await call('POST', '/api/activity/start', { recipeId: 'mine_iron', quantity: 1, mode: 'replace' });
    expect(res.status).toBe(400);
    expect(res.json.message).toBe('Niveau 15 requis.');
  });

  it('lance une activité et la fait progresser côté serveur', async () => {
    const start = await call('POST', '/api/activity/start', { recipeId: 'mine_copper', quantity: 1000, mode: 'replace' });
    expect((start.json as StateResponse).state.activity?.recipeId).toBe('mine_copper');
    now += 60_000;
    const after = (await call('GET', '/api/state')).json as StateResponse;
    // Énergie quotidienne active : 60 s × 1,5 / 3 s = 30 minerais.
    expect(after.state.inventory.copper_ore).toBe(30);
    expect(after.absence).toBeNull();
  });

  it('renvoie un résumé d’absence au retour, une seule fois', async () => {
    now += 6 * 3_600_000;
    const back = (await call('GET', '/api/state')).json as StateResponse;
    expect(back.absence).not.toBeNull();
    expect(back.absence!.produced.copper_ore).toBeGreaterThan(0);
    expect(back.journal.some((e) => e.kind === 'absence')).toBe(true);
    now += 10_000;
    expect(((await call('GET', '/api/state')).json as StateResponse).absence).toBeNull();
  });

  it('achète au marchand et garde le journal', async () => {
    const res = await call('POST', '/api/shop/buy', { itemId: 'raw_fish', qty: 5 });
    expect((res.json as StateResponse).state.inventory.raw_fish).toBe(5);
    const journal = (await call('GET', '/api/journal')).json as { text: string }[];
    expect(journal[0]!.text).toBe('Achat : 5 × Poisson frais.');
  });

  it('se reconnecte avec le mot de passe', async () => {
    await call('POST', '/api/auth/logout');
    cookie = '';
    expect((await call('POST', '/api/auth/login', { username: 'BRANN', password: 'mauvais!!' })).status).toBe(401);
    expect((await call('POST', '/api/auth/login', { username: 'BRANN', password: 'motdepasse' })).status).toBe(200);
    expect((await call('GET', '/api/state')).status).toBe(200);
  });
});

import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { StateResponse } from '@bramo/shared';
import { loadContent } from '@bramo/shared/node';
import { buildApp } from '../src/app.js';
import { createDb } from '../src/db/index.js';
import { characterItems, characters } from '../src/db/schema.js';
import { eq } from 'drizzle-orm';

process.env.LOG_LEVEL ??= 'silent';
const content = loadContent(fileURLToPath(new URL('../../../data', import.meta.url)));
let now = Date.UTC(2026, 0, 10, 12);
let app: Awaited<ReturnType<typeof buildApp>>;
let close: () => Promise<void>;
let db: Awaited<ReturnType<typeof createDb>>['db'];
let cookie = '';

beforeAll(async () => {
  // PGlite en mémoire : aucune base externe nécessaire pour les tests.
  const created = await createDb(undefined, 'memory://');
  close = created.close;
  db = created.db;
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

/** Un joueur à part, avec son propre cookie. */
const player = (cookieOf: { value: string }) => async (method: 'GET' | 'POST', url: string, payload?: object) => {
  const res = await app.inject({ method, url, payload, headers: { cookie: cookieOf.value } });
  const set = res.headers['set-cookie'];
  if (set) cookieOf.value = String(Array.isArray(set) ? set[0] : set).split(';')[0]!;
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
    // La tenue se change librement parmi les tenues débloquées ; les autres sont refusées.
    const dressed = (await call('POST', '/api/character/outfit', { outfitId: 'embers' })).json as StateResponse;
    expect(dressed.state.appearance).toEqual({ classId: 'runist', outfit: 'embers' });
    expect(dressed.state.unlockedOutfits).toEqual(['ashes', 'embers', 'thicket']);
    expect((await call('POST', '/api/character/outfit', { outfitId: 'grandmaster' })).status).toBe(400);
  });

  it('refuse une commande de maître avant son niveau', async () => {
    const res = await call('POST', '/api/trials/complete', { trialId: 'mining_20' });
    expect(res.status).toBe(400);
    expect(res.json.message).toBe('Niveau 20 requis pour cette commande.');
    const state = (await call('GET', '/api/state')).json as StateResponse;
    expect(state.state.trials.mining_20).toBe('locked');
    expect(state.state.skills.mining?.next).toMatchObject({ rank: 20, trialId: 'mining_20', nickname: 'Gratteur de galeries', reached: false });
    expect(state.state.skills.mining?.nickname).toBe('Gratte-sol');
  });

  it('refuse un pseudo déjà pris', async () => {
    const res = await call('POST', '/api/auth/register', { username: 'brann', password: 'motdepasse' });
    expect(res.status).toBe(409);
  });

  it('refuse une recette au-dessus du niveau', async () => {
    const res = await call('POST', '/api/activity/start', { recipeId: 'mine_iron', quantity: 1, mode: 'replace' });
    expect(res.status).toBe(400);
    expect(res.json.message).toBe('Niveau 10 requis.');
  });

  it('lance une activité et la fait progresser côté serveur', async () => {
    const start = await call('POST', '/api/activity/start', { recipeId: 'mine_copper', quantity: 1000, mode: 'replace' });
    expect((start.json as StateResponse).state.activity?.recipeId).toBe('mine_copper');
    now += 120_000;
    const after = (await call('GET', '/api/state')).json as StateResponse;
    // 120 s / 12 s = 10 minerais.
    expect(after.state.inventory.copper_ore).toBe(10);
    expect(after.absence).toBeNull();
  });

  it('active un coup de fouet : ×1,5 pendant 30 min, deux par jour', async () => {
    const res = (await call('POST', '/api/energy/activate')).json as StateResponse;
    expect(res.state.energy).toMatchObject({ chargesLeft: 1, charges: 2, activeUntil: now + 30 * 60_000 });
    expect(res.state.activity?.rate.total).toBeCloseTo(1.5 * (1 + content.settings.clan.townGuildBonus));
    now += 120_000;
    const after = (await call('GET', '/api/state')).json as StateResponse;
    // 120 s × 1,5 / 12 s = 15 minerais de plus.
    expect(after.state.inventory.copper_ore).toBe(25);
    await call('POST', '/api/energy/activate');
    const empty = await call('POST', '/api/energy/activate');
    expect(empty.status).toBe(400);
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

  it('refuse de ranger un non-repas au garde-manger et expose usure et garde-manger', async () => {
    const res = await call('POST', '/api/pantry/stock', { itemId: 'copper_ore', qty: 1 });
    expect(res.status).toBe(400);
    const view = ((await call('GET', '/api/state')).json as StateResponse).state;
    expect(view.pantry).toEqual({});
    expect(view.durability).toEqual({});
    expect((await call('POST', '/api/shop/repair', { itemId: 'copper_ore' })).status).toBe(400);
  });

  it('se reconnecte avec le mot de passe', async () => {
    await call('POST', '/api/auth/logout');
    cookie = '';
    expect((await call('POST', '/api/auth/login', { username: 'BRANN', password: 'mauvais!!' })).status).toBe(401);
    expect((await call('POST', '/api/auth/login', { username: 'BRANN', password: 'motdepasse' })).status).toBe(200);
    expect((await call('GET', '/api/state')).status).toBe(200);
  });

  it('marché : deux joueurs, ordres croisés, taxe, récupération au passage', async () => {
    const a = player({ value: '' });
    const b = player({ value: '' });
    await a('POST', '/api/auth/register', { username: 'Vendeuse', password: 'motdepasse' });
    await b('POST', '/api/auth/register', { username: 'Acheteur', password: 'motdepasse' });
    // A mine 50 cuivre (10 min), puis passe plus tard pour les récupérer.
    await a('POST', '/api/activity/start', { recipeId: 'mine_copper', quantity: 50, mode: 'replace' });
    now += 15 * 60_000;
    const mined = (await a('GET', '/api/state')).json as StateResponse;
    expect(mined.state.inventory.copper_ore).toBe(50);
    const gold0 = mined.state.gold;

    // A propose 20 cuivre à 5 or l'unité : l'ordre attend.
    const sell = (await a('POST', '/api/market/order', { side: 'sell', itemId: 'copper_ore', qty: 20, price: 5 })).json as StateResponse;
    expect(sell.state.inventory.copper_ore).toBe(30);
    // B achète 10 à 6 : exécuté au prix de l'offre (5), B paie 50.
    const buy = (await b('POST', '/api/market/order', { side: 'buy', itemId: 'copper_ore', qty: 10, price: 6 })).json as StateResponse;
    expect(buy.state.inventory.copper_ore).toBe(10);
    expect(buy.state.gold).toBe(content.settings.character.startingGold - 50);
    // A récupère son or net (50 − 5 % arrondi à l'avantage de la taxe = 47) au passage suivant.
    const after = (await a('GET', '/api/state')).json as StateResponse;
    expect(after.state.gold).toBe(gold0 + 47);
    expect(after.journal.some((j) => j.text.startsWith('Vente conclue'))).toBe(true);
    // Achat direct du reste de l'offre.
    const book = (await b('GET', '/api/market/item/copper_ore')).json as { id: number; qty: number; mine: boolean }[];
    expect(book).toHaveLength(1);
    expect(book[0]!.qty).toBe(10);
    const fill = await b('POST', '/api/market/fill', { orderId: book[0]!.id, qty: 10 });
    expect((fill.json as StateResponse).state.inventory.copper_ore).toBe(20);
    expect((await b('GET', '/api/market/item/copper_ore')).json).toEqual([]);
    // Ni acheter à soi-même, ni dépasser son or.
    await a('POST', '/api/market/order', { side: 'sell', itemId: 'copper_ore', qty: 5, price: 9 });
    const mineOrders = (await a('GET', '/api/market/mine')).json as { id: number; qty: number }[];
    expect(mineOrders).toHaveLength(1);
    expect((await a('POST', '/api/market/fill', { orderId: mineOrders[0]!.id, qty: 1 })).status).toBe(400);
    expect((await a('POST', '/api/market/order', { side: 'buy', itemId: 'copper_ore', qty: 1, price: 9 })).status).toBe(400);
    expect((await b('POST', '/api/market/order', { side: 'buy', itemId: 'copper_ore', qty: 100, price: 900 })).status).toBe(400);
    // Annuler rend les objets.
    const cancelled = (await a('POST', '/api/market/cancel', { orderId: mineOrders[0]!.id })).json as StateResponse;
    expect(cancelled.state.inventory.copper_ore).toBe(30);
    expect(((await a('GET', '/api/market')).json as unknown[]).length).toBe(0);
  });

  it('commandes PNJ : trois par jour, une fois chacune', async () => {
    const a = player({ value: '' });
    await a('POST', '/api/auth/register', { username: 'Livreur', password: 'motdepasse' });
    const view = (await a('GET', '/api/state')).json as StateResponse;
    expect(view.state.npcOrders).toHaveLength(content.settings.npcOrders.perDay);
    // Sans les objets demandés, la remise échoue.
    expect((await a('POST', '/api/npc/complete', { orderId: view.state.npcOrders[0]!.id })).status).toBe(400);
    expect((await a('POST', '/api/npc/complete', { orderId: 'inconnue' })).status).toBe(400);
  });

  /** Donne de l'or, des objets et un métier à un joueur (le test saute le temps de jeu). */
  const grant = async (name: string, gold: number, items: Record<string, number>, wear: Record<string, number[]> = {}, skills: Record<string, number> = {}) => {
    const [me] = await db.select().from(characters).where(eq(characters.name, name));
    await db.update(characters).set({ gold, wear }).where(eq(characters.id, me!.id));
    for (const [itemId, qty] of Object.entries(items)) await db.insert(characterItems).values({ characterId: me!.id, itemId, qty });
    for (const [skill, xp] of Object.entries(skills)) {
      const { characterSkills } = await import('../src/db/schema.js');
      await db.insert(characterSkills).values({ characterId: me!.id, skill, xp }).onConflictDoUpdate({ target: [characterSkills.characterId, characterSkills.skill], set: { xp } });
    }
  };

  it('étal de la guilde : palier 1 seulement, et seulement si aucun joueur n’en vend', async () => {
    const a = player({ value: '' });
    const b = player({ value: '' });
    await a('POST', '/api/auth/register', { username: 'Eleveur', password: 'motdepasse' });
    await b('POST', '/api/auth/register', { username: 'Forgeur', password: 'motdepasse' });
    await grant('Eleveur', 500, {});
    expect((await a('POST', '/api/stall/buy', { itemId: 'iron_pickaxe', qty: 1 })).status).toBe(400); // pas de palier 1
    const bought = await a('POST', '/api/stall/buy', { itemId: 'bronze_pickaxe', qty: 1 });
    expect((bought.json as StateResponse).state.inventory.bronze_pickaxe).toBe(1);
    expect((bought.json as StateResponse).state.gold).toBe(500 - 150);
    // Un joueur met une pioche en vente : l'étal ferme pour cet objet.
    await grant('Forgeur', 0, { bronze_pickaxe: 1 });
    await b('POST', '/api/market/order', { side: 'sell', itemId: 'bronze_pickaxe', qty: 1, price: 120, copy: 0 });
    const closed = await a('POST', '/api/stall/buy', { itemId: 'bronze_pickaxe', qty: 1 });
    expect(closed.status).toBe(400);
    expect((closed.json as { code: string }).code).toBe('players_sell');
  });

  it('réparation par un artisan : outil et or mis de côté, matériaux et or échangés, outil rendu comme neuf', async () => {
    const owner = player({ value: '' });
    const smith = player({ value: '' });
    await owner('POST', '/api/auth/register', { username: 'Mineur', password: 'motdepasse' });
    await smith('POST', '/api/auth/register', { username: 'Artisan', password: 'motdepasse' });
    const half = 20 * 3_600_000; // 20 h d'usure sur 40 h
    await grant('Mineur', 200, { bronze_pickaxe: 1 }, { bronze_pickaxe: [half] });
    // Niveau 5 de Forge (XP suffisante) et 3 lingots de bronze pour l'artisan.
    await grant('Artisan', 0, { bronze_bar: 3 }, {}, { smithing: Math.round(content.xpTable[5]!) });

    const asked = (await owner('POST', '/api/repairs/request', { itemId: 'bronze_pickaxe', copy: 0, fee: 60 })).json as StateResponse;
    expect(asked.state.inventory.bronze_pickaxe).toBeUndefined();
    expect(asked.state.gold).toBe(140);
    const board = (await smith('GET', '/api/repairs')).json as { id: number; fee: number; mine: boolean }[];
    expect(board).toHaveLength(1);
    expect(board[0]!.mine).toBe(false);
    expect(((await owner('GET', '/api/repairs')).json as { mine: boolean }[])[0]!.mine).toBe(true);

    const done = (await smith('POST', '/api/repairs/take', { requestId: board[0]!.id })).json as StateResponse;
    expect(done.state.inventory.bronze_bar).toBeUndefined();
    expect(done.state.gold).toBe(60 - 3); // taxe 5 % arrondie à l'avantage de la taxe
    expect((await smith('POST', '/api/repairs/take', { requestId: board[0]!.id })).status).toBe(400);

    const back = (await owner('GET', '/api/state')).json as StateResponse;
    expect(back.state.inventory.bronze_pickaxe).toBe(1);
    expect(back.state.durability.bronze_pickaxe!.copies[0]).toBe(40 * 3_600_000);
    expect(back.journal.some((j) => j.text.includes('comme neuf'))).toBe(true);
    expect((await owner('GET', '/api/repairs')).json).toEqual([]);
  });

  it('réparation par un artisan : refuse sans niveau ou sans matériaux, et rend l’outil si on annule', async () => {
    const owner = player({ value: '' });
    const novice = player({ value: '' });
    await owner('POST', '/api/auth/register', { username: 'Client', password: 'motdepasse' });
    await novice('POST', '/api/auth/register', { username: 'Apprenti', password: 'motdepasse' });
    await grant('Client', 100, { bronze_pickaxe: 1 }, { bronze_pickaxe: [10 * 3_600_000] });
    await grant('Apprenti', 0, { bronze_bar: 3 });
    expect((await owner('POST', '/api/repairs/request', { itemId: 'copper_ore', copy: 0, fee: 10 })).status).toBe(400);
    expect((await owner('POST', '/api/repairs/request', { itemId: 'bronze_pickaxe', copy: 0, fee: 500 })).status).toBe(400);
    await owner('POST', '/api/repairs/request', { itemId: 'bronze_pickaxe', copy: 0, fee: 30 });
    const [req] = (await novice('GET', '/api/repairs')).json as { id: number }[];
    expect((await novice('POST', '/api/repairs/take', { requestId: req!.id })).status).toBe(400); // niveau 5 de Forge requis
    const back = (await owner('POST', '/api/repairs/cancel', { requestId: req!.id })).json as StateResponse;
    expect(back.state.gold).toBe(100);
    expect(back.state.durability.bronze_pickaxe!.copies[0]).toBe(30 * 3_600_000);
  });

  it('prime de commande : livrer un ordre d’achat d’un objet qu’on sait fabriquer rapporte de l’XP', async () => {
    const client = player({ value: '' });
    const maker = player({ value: '' });
    await client('POST', '/api/auth/register', { username: 'Commanditaire', password: 'motdepasse' });
    await maker('POST', '/api/auth/register', { username: 'Fondeur', password: 'motdepasse' });
    await grant('Fondeur', 0, { bronze_bar: 5 });
    await client('POST', '/api/market/order', { side: 'buy', itemId: 'bronze_bar', qty: 5, price: 5 });
    const res = (await maker('POST', '/api/market/order', { side: 'sell', itemId: 'bronze_bar', qty: 5, price: 5 })).json as StateResponse;
    // « Lingot de bronze » : 1,6 XP par lingot × 5 × prime de 20 % = 1,6 XP.
    expect(res.state.skills.smithing!.xp).toBeCloseTo(1.6);
    expect(res.journal.some((j) => j.text.includes('Prime de commande'))).toBe(true);
  });

  it('bourg : les joueurs actifs passent dans la scène et le fil annonce les arrivées', async () => {
    const a = player({ value: '' });
    await a('POST', '/api/auth/register', { username: 'Passant', password: 'motdepasse' });
    await a('POST', '/api/character/class', { classId: 'tracker' });
    const town = (await a('GET', '/api/town')).json as import('@bramo/shared').TownView;
    const me = town.players.find((p) => p.name === 'Passant');
    expect(me?.self).toBe(true);
    expect(me?.classId).toBe('tracker');
    expect(town.total).toBeGreaterThan(0);
    expect(town.feed.some((e) => e.kind === 'join' && e.text.includes('Passant'))).toBe(true);
    // Une heure plus tard, plus personne n'est actif : la scène est vide mais le fil reste.
    now += 3_600_000;
    const later = (await a('GET', '/api/town')).json as import('@bramo/shared').TownView;
    expect(later.players.find((p) => p.name === 'Passant')).toBeUndefined(); // consulter le bourg n’est pas une visite
    expect(later.feed.some((e) => e.text.includes('Passant'))).toBe(true);
  });

  it('clans : fonder, rejoindre, entrepôt par rang, projet de bonus', async () => {
    const chef = player({ value: '' });
    const recrue = player({ value: '' });
    const intrus = player({ value: '' });
    await chef('POST', '/api/auth/register', { username: 'Chefclan', password: 'motdepasse' });
    await recrue('POST', '/api/auth/register', { username: 'Recrue', password: 'motdepasse' });
    await intrus('POST', '/api/auth/register', { username: 'Intrus', password: 'motdepasse' });
    // Sans clan : le bonus de la Guilde du bourg ; fonder coûte de l'or.
    expect((await chef('POST', '/api/clan/create', { name: 'Les Braises' })).status).toBe(400);
    await grant('Chefclan', 3000, {});
    const created = (await chef('POST', '/api/clan/create', { name: 'Les Braises', description: 'Forgerons du matin' })).json as StateResponse;
    expect(created.state.gold).toBe(3000 - content.settings.clan.creationCost);
    expect((await intrus('POST', '/api/clan/create', { name: 'les braises' })).status).toBe(400); // nom déjà pris (or insuffisant aussi)
    expect(((await chef('GET', '/api/clan')).json as import('@bramo/shared').ClanView).myRank).toBe('leader');

    const list = (await recrue('GET', '/api/clans')).json as import('@bramo/shared').ClanListItem[];
    expect(list).toHaveLength(1);
    await recrue('POST', '/api/clan/join', { clanId: list[0]!.id });
    await grant('Recrue', 0, { copper_ore: 50 });
    await recrue('POST', '/api/clan/deposit', { itemId: 'copper_ore', qty: 30 });
    // Un simple membre ne retire rien de l'entrepôt.
    expect((await recrue('POST', '/api/clan/withdraw', { itemId: 'copper_ore', qty: 5 })).status).toBe(400);
    const view = (await chef('GET', '/api/clan')).json as import('@bramo/shared').ClanView;
    expect(view.warehouse.copper_ore).toBe(30);
    expect(view.members.map((m) => m.rank)).toEqual(['leader', 'member']);
    expect(view.log.some((l) => l.text.includes('dépose 30'))).toBe(true);
    // Le chef retire, puis promeut la recrue officier : elle peut retirer à son tour.
    const taken = (await chef('POST', '/api/clan/withdraw', { itemId: 'copper_ore', qty: 10 })).json as StateResponse;
    expect(taken.state.inventory.copper_ore).toBe(10);
    const recruitId = view.members.find((m) => m.rank === 'member')!.id;
    await chef('POST', '/api/clan/rank', { characterId: recruitId, rank: 'officer' });
    expect(((await recrue('POST', '/api/clan/withdraw', { itemId: 'copper_ore', qty: 5 })).json as StateResponse).state.inventory.copper_ore).toBe(25);

    // Projet : 1 × 500 × max(3, membres actifs) = 1 500 or pour le niveau 1 ; le surplus reste au fonds.
    const donated = (await chef('POST', '/api/clan/donate', { amount: 1700 })).json as StateResponse;
    expect(donated.state.gold).toBe(3000 - content.settings.clan.creationCost - 1700);
    const after = (await chef('GET', '/api/clan')).json as import('@bramo/shared').ClanView;
    expect(after.level).toBe(1);
    expect(after.bonus).toBeCloseTo(0.02);
    expect(after.fund).toBe(200);
    expect(after.nextCost).toBe(3000);

    // Quitter : le chef doit d'abord transférer la direction.
    expect((await chef('POST', '/api/clan/leave')).status).toBe(400);
    await chef('POST', '/api/clan/leader', { characterId: recruitId });
    expect((await chef('POST', '/api/clan/leave')).status).toBe(200);
    expect(((await recrue('GET', '/api/clan')).json as import('@bramo/shared').ClanView).myRank).toBe('leader');
  });
});

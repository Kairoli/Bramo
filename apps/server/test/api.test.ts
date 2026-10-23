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
  app = await buildApp({ db: created.db, content, clock: () => now, devTools: true });
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

/**
 * Un joueur à part, avec son propre cookie et sa propre adresse ; `ip` pour faire jouer plusieurs comptes depuis la même
 * connexion.
 */
let nextIp = 1;
const player = (cookieOf: { value: string }, ip = `10.0.${nextIp >> 8}.${nextIp++ & 255}`) => {
  return async (method: 'GET' | 'POST', url: string, payload?: object) => {
    const res = await app.inject({ method, url, payload, headers: { cookie: cookieOf.value }, remoteAddress: ip });
    const set = res.headers['set-cookie'];
    if (set) cookieOf.value = String(Array.isArray(set) ? set[0] : set).split(';')[0]!;
    return { status: res.statusCode, json: res.json() };
  };
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
    // L'apparence n'emprunte que les styles de sa classe : un Runiste ne porte pas la tenue du Forgefeu.
    expect((await call('POST', '/api/character/outfit', { outfitId: 'embers' })).status).toBe(400);
    expect((await call('POST', '/api/character/outfit', { outfitId: 'grandmaster' })).status).toBe(400);
    const own = (await call('GET', '/api/state')).json as StateResponse;
    expect(own.state.unlockedOutfits).toContain('ashes');
    expect(own.state.unlockedOutfits).not.toContain('embers');
    expect((await call('POST', '/api/character/look', { slot: 'headwear', partId: 'plate_helm' })).status).toBe(400);
    // Pièce par pièce, dans le style de sa classe, sans toucher à l'équipement.
    await call('POST', '/api/character/class', { classId: 'forgefire' });
    const forge = (await call('GET', '/api/state')).json as StateResponse;
    expect(forge.state.unlockedOutfits).toContain('embers');
    expect(forge.state.lookOptions.headwear).toContain('plate_helm_legendary');
    const dressed = (await call('POST', '/api/character/look', { slot: 'headwear', partId: 'plate_helm_legendary' })).json as StateResponse;
    expect(dressed.state.appearance).toEqual({ classId: 'forgefire', outfit: 'embers', overrides: { headwear: 'plate_helm_legendary' } });
    expect(dressed.state.gold).toBe(forge.state.gold);
    const reset = (await call('POST', '/api/character/look', { slot: 'headwear', partId: null })).json as StateResponse;
    expect(reset.state.appearance).toEqual({ classId: 'forgefire', outfit: 'embers' });
    await call('POST', '/api/character/class', { classId: 'runist' });
  });

  it('donne des exemplaires, les équipe selon la classe, et les range quand la classe change', async () => {
    const catalogue = (await call('GET', '/api/gear/catalogue')).json as { models: { id: string; slot: string; classes: string[]; tier: number }[] };
    expect(catalogue.models.length).toBeGreaterThan(700);
    const pick = (slot: string, cls: string, tier = 1) => catalogue.models.find((m) => m.slot === slot && m.classes.length === 1 && m.classes[0] === cls && m.tier === tier)!.id;

    // Le personnage est un Runiste à ce stade.
    const robe = pick('torso', 'runist');
    const mail = pick('torso', 'forgefire');
    const granted = (await call('POST', '/api/dev/gear/grant', { modelId: robe, count: 2 })).json;
    const mine = granted.items.filter((g: { model: string }) => g.model === robe);
    expect(mine).toHaveLength(2);
    expect(mine[0]).toMatchObject({ model: robe, equipped: null, wearable: true, worn: false, bound: false });
    expect(mine[0].lines.length).toBeLessThanOrEqual(4);
    const other = (await call('POST', '/api/dev/gear/grant', { modelId: mail })).json;
    const mailId = other.items.find((g: { model: string }) => g.model === mail).id;
    expect(other.items.find((g: { id: number }) => g.id === mailId).wearable).toBe(false);
    expect((await call('POST', '/api/dev/gear/grant', { modelId: 'nope' })).status).toBe(404);

    // Équiper : le bon style, pas un autre ; un second torse remplace le premier.
    expect((await call('POST', '/api/gear/equip', { id: mailId })).status).toBe(400);
    const [first, second] = mine as { id: number }[];
    const worn = (await call('POST', '/api/gear/equip', { id: first!.id })).json;
    expect(worn.items.find((g: { id: number }) => g.id === first!.id).equipped).toBe('torso');
    expect(worn.totals.stats.power ?? worn.totals.stats.vitality ?? worn.totals.stats.defense).toBeGreaterThan(0);
    const swapped = (await call('POST', '/api/gear/equip', { id: second!.id })).json;
    expect(swapped.items.filter((g: { equipped: string | null }) => g.equipped === 'torso')).toHaveLength(1);
    expect(swapped.items.find((g: { id: number }) => g.id === first!.id).equipped).toBeNull();

    // Trois anneaux : deux portés au plus.
    const ring = catalogue.models.find((m) => m.slot === 'ring' && m.tier === 1)!.id;
    const rings = ((await call('POST', '/api/dev/gear/grant', { modelId: ring, count: 3 })).json.items as { id: number; model: string }[]).filter((g) => g.model === ring);
    for (const r of rings) await call('POST', '/api/gear/equip', { id: r.id });
    const all = (await call('GET', '/api/gear')).json;
    expect(all.items.filter((g: { equipped: string | null }) => g.equipped === 'ring')).toHaveLength(2);

    // Changer de classe range les pièces qui ne sont plus du bon style (les anneaux, universels, restent).
    await call('POST', '/api/character/class', { classId: 'forgefire' });
    const forge = (await call('GET', '/api/gear')).json;
    // Le set de départ n'est donné qu'une fois par classe : changer de classe et revenir ne le redonne pas.
    expect(forge.items.filter((g: { bound: boolean }) => g.bound)).toHaveLength(10);
    expect(forge.items.find((g: { id: number }) => g.id === second!.id).equipped).toBeNull();
    expect(forge.items.filter((g: { equipped: string | null }) => g.equipped === 'ring')).toHaveLength(2);
    await call('POST', '/api/character/class', { classId: 'runist' });
    expect((await call('POST', '/api/gear/unequip', { id: rings[0]!.id })).json.items.find((g: { id: number }) => g.id === rings[0]!.id).equipped).toBeNull();
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

  it('marché : acheter en gros d’un coup, des offres les moins chères à la plus chère, sans ordre en attente', async () => {
    const s1 = player({ value: '' });
    const s2 = player({ value: '' });
    const buyer = player({ value: '' });
    await s1('POST', '/api/auth/register', { username: 'Grossiste', password: 'motdepasse' });
    await s2('POST', '/api/auth/register', { username: 'Detaillant', password: 'motdepasse' });
    await buyer('POST', '/api/auth/register', { username: 'Apprentie', password: 'motdepasse' });
    await grant('Grossiste', 0, { tin_ore: 30 });
    await grant('Detaillant', 0, { tin_ore: 30 });
    await s1('POST', '/api/market/order', { side: 'sell', itemId: 'tin_ore', qty: 30, price: 5 });
    await s2('POST', '/api/market/order', { side: 'sell', itemId: 'tin_ore', qty: 30, price: 7 });
    // 50 unités : les 30 à 5 or, puis 20 à 7 or = 290 or ; rien ne reste en attente.
    const r = (await buyer('POST', '/api/market/order', { side: 'buy', itemId: 'tin_ore', qty: 50, price: 7, immediate: true })).json as StateResponse;
    expect(r.state.inventory.tin_ore).toBe(50);
    expect(r.state.gold).toBe(content.settings.character.startingGold - 290);
    expect((await buyer('GET', '/api/market/mine')).json).toEqual([]);
    // Plus d'offre à ce prix : refusé, pas d'ordre posé.
    expect((await buyer('POST', '/api/market/order', { side: 'buy', itemId: 'tin_ore', qty: 50, price: 6, immediate: true })).status).toBe(400);
    expect((await buyer('GET', '/api/market/mine')).json).toEqual([]);
    // L'historique : la courbe de prix de l'objet (moyenne pondérée du jour) et les transactions de chacun.
    const history = (await buyer('GET', '/api/market/history/tin_ore')).json as import('@bramo/shared').PriceHistoryView;
    const today = history.points.at(-1)!;
    expect(today.volume).toBeGreaterThanOrEqual(50);
    expect(today.min).toBe(5);
    expect(today.max).toBe(7);
    const mine = (await buyer('GET', '/api/market/trades')).json as import('@bramo/shared').MyTradeView[];
    expect(mine.map((t) => [t.side, t.qty, t.price]).sort()).toEqual([['buy', 20, 7], ['buy', 30, 5]]);
    const sold = (await s1('GET', '/api/market/trades')).json as import('@bramo/shared').MyTradeView[];
    expect(sold).toMatchObject([{ side: 'sell', qty: 30, price: 5, itemId: 'tin_ore' }]);
    expect((await buyer('GET', '/api/market/history/nothing')).status).toBe(404);
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
    await grant('Eleveur', 5000, {});
    expect((await a('POST', '/api/stall/buy', { itemId: 'iron_pickaxe', qty: 1 })).status).toBe(400); // pas de palier 1
    const bought = await a('POST', '/api/stall/buy', { itemId: 'bronze_pickaxe', qty: 1 });
    expect((bought.json as StateResponse).state.inventory.bronze_pickaxe).toBe(1);
    expect((bought.json as StateResponse).state.gold).toBe(5000 - 1500);
    // Un joueur met une pioche en vente : l'étal ferme pour cet objet.
    await grant('Forgeur', 0, { bronze_pickaxe: 1 });
    await b('POST', '/api/market/order', { side: 'sell', itemId: 'bronze_pickaxe', qty: 1, price: 1200, copy: 0 });
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
    await grant('Client', 100, { iron_pickaxe: 1 }, { iron_pickaxe: [10 * 3_600_000] });
    await grant('Apprenti', 0, { iron_bar: 3 });
    expect((await owner('POST', '/api/repairs/request', { itemId: 'copper_ore', copy: 0, fee: 10 })).status).toBe(400);
    expect((await owner('POST', '/api/repairs/request', { itemId: 'iron_pickaxe', copy: 0, fee: 500 })).status).toBe(400);
    await owner('POST', '/api/repairs/request', { itemId: 'iron_pickaxe', copy: 0, fee: 30 });
    const [req] = (await novice('GET', '/api/repairs')).json as { id: number }[];
    expect((await novice('POST', '/api/repairs/take', { requestId: req!.id })).status).toBe(400); // niveau 10 de Forge requis
    const back = (await owner('POST', '/api/repairs/cancel', { requestId: req!.id })).json as StateResponse;
    expect(back.state.gold).toBe(100);
    expect(back.state.durability.iron_pickaxe!.copies[0]).toBe(50 * 3_600_000);
  });

  it('prime de commande : livrer un ordre d’achat d’un objet qu’on sait fabriquer rapporte de l’XP', async () => {
    const client = player({ value: '' });
    const maker = player({ value: '' });
    await client('POST', '/api/auth/register', { username: 'Commanditaire', password: 'motdepasse' });
    await maker('POST', '/api/auth/register', { username: 'Fondeur', password: 'motdepasse' });
    await grant('Fondeur', 0, { bronze_bar: 5 });
    await client('POST', '/api/market/order', { side: 'buy', itemId: 'bronze_bar', qty: 5, price: 10 });
    const res = (await maker('POST', '/api/market/order', { side: 'sell', itemId: 'bronze_bar', qty: 5, price: 10 })).json as StateResponse;
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

  it('clans : fonder, rejoindre, construire un bâtiment ensemble', async () => {
    const chef = player({ value: '' });
    const recrue = player({ value: '' });
    const intrus = player({ value: '' });
    await chef('POST', '/api/auth/register', { username: 'Chefclan', password: 'motdepasse' });
    await recrue('POST', '/api/auth/register', { username: 'Recrue', password: 'motdepasse' });
    await intrus('POST', '/api/auth/register', { username: 'Intrus', password: 'motdepasse' });
    // Sans clan : le bonus de la Guilde du bourg ; fonder coûte de l'or.
    expect((await chef('POST', '/api/clan/create', { name: 'Les Braises' })).status).toBe(400);
    await grant('Chefclan', 30000, {});
    const created = (await chef('POST', '/api/clan/create', { name: 'Les Braises', description: 'Forgerons du matin' })).json as StateResponse;
    expect(created.state.gold).toBe(30000 - content.settings.clan.creationCost);
    expect((await intrus('POST', '/api/clan/create', { name: 'les braises' })).status).toBe(400); // nom déjà pris
    const view0 = (await chef('GET', '/api/clan')).json as import('@bramo/shared').ClanView;
    expect(view0.myRank).toBe('leader');
    expect(view0.buildings.map((b) => b.id)).toContain('forge');

    const list = (await recrue('GET', '/api/clans')).json as import('@bramo/shared').ClanListItem[];
    expect(list).toHaveLength(1);
    await recrue('POST', '/api/clan/join', { clanId: list[0]!.id });
    await grant('Recrue', 0, { dressed_stone: 200, coal: 1500, copper_ore: 5 });

    // Forge, niveau 1 : 15 000 or, 1 000 de charbon et 200 moellons (2 membres actifs : coût de référence) ; lingots et arches aux niveaux 2 et 3.
    const gallery = view0.buildings.find((b) => b.id === 'forge')!;
    expect(gallery.next?.gold.need).toBe(15000);
    // L'or : l'apport est plafonné à ce qu'il manque ; un objet non demandé est refusé ; un non-membre ne peut rien apporter.
    expect((await chef('POST', '/api/clan/contribute', { buildingId: 'forge', what: 'gold', qty: 10000 })).status).toBe(200);
    expect((await recrue('POST', '/api/clan/contribute', { buildingId: 'forge', what: 'copper_ore', qty: 5 })).status).toBe(400);
    expect((await intrus('POST', '/api/clan/contribute', { buildingId: 'forge', what: 'gold', qty: 10 })).status).toBe(400);
    const capped = (await chef('POST', '/api/clan/contribute', { buildingId: 'forge', what: 'gold', qty: 20000 })).json as StateResponse;
    expect(capped.state.gold).toBe(30000 - content.settings.clan.creationCost - 15000);
    expect((await chef('POST', '/api/clan/contribute', { buildingId: 'forge', what: 'gold', qty: 1 })).status).toBe(400); // complet
    // Les membres apportent ensemble : le bâtiment monte quand tout est réuni.
    await recrue('POST', '/api/clan/contribute', { buildingId: 'forge', what: 'dressed_stone', qty: 200 });
    const mid = (await chef('GET', '/api/clan')).json as import('@bramo/shared').ClanView;
    expect(mid.buildings.find((b) => b.id === 'forge')?.level).toBe(0);
    const done = (await recrue('POST', '/api/clan/contribute', { buildingId: 'forge', what: 'coal', qty: 1000 })).json as StateResponse;
    expect(done.journal.some((j) => j.text.includes('niveau 1'))).toBe(true);
    expect(done.state.inventory.coal).toBe(500);
    const after = (await chef('GET', '/api/clan')).json as import('@bramo/shared').ClanView;
    expect(after.buildings.find((b) => b.id === 'forge')).toMatchObject({ level: 1, next: { gold: { need: 30000, have: 0 } } });
    expect(after.bonuses.mining).toBeCloseTo(0.02);
    expect(after.bonuses.smithing).toBeCloseTo(0.02); // la forge sert aussi les forgerons
    expect(after.log.some((l) => l.text.includes('Forge passe au niveau 1'))).toBe(true);
    // Renom : un niveau de bâtiment en rapporte (10 × le niveau), il ne baisse jamais.
    expect(after.renown).toMatchObject({ value: 10, rank: 'Hameau', next: { name: 'Village', at: 500 } });
    // Le bonus s'applique à la production des membres : +2 % mineur, en plus des 3 % de la Guilde du bourg.
    await recrue('POST', '/api/activity/start', { recipeId: 'mine_copper', quantity: 50, mode: 'replace' });
    const rate = ((await recrue('GET', '/api/state')).json as StateResponse).state.activity!.rate;
    expect(rate.clan).toBeCloseTo(content.settings.clan.townGuildBonus + 0.02);
    // Le fil du serveur annonce l'achèvement.
    const feed = ((await chef('GET', '/api/town')).json as import('@bramo/shared').TownView).feed;
    expect(feed.some((e) => e.kind === 'clan' && e.text.includes('Forge'))).toBe(true);

    // Rangs : l'officier peut exclure un membre ; le chef doit transférer la direction avant de partir.
    const recruitId = after.members.find((m) => m.rank === 'member')!.id;
    await chef('POST', '/api/clan/rank', { characterId: recruitId, rank: 'officer' });
    expect((await chef('POST', '/api/clan/leave')).status).toBe(400);
    await chef('POST', '/api/clan/leader', { characterId: recruitId });
    expect((await chef('POST', '/api/clan/leave')).status).toBe(200);
    expect(((await recrue('GET', '/api/clan')).json as import('@bramo/shared').ClanView).myRank).toBe('leader');
  });

  it('combat : plan conseillé, rencontres en boucle côté serveur, XP de classe, journal du combat', async () => {
    const f = player({ value: '' });
    await f('POST', '/api/auth/register', { username: 'Combattante', password: 'motdepasse' });
    const chosen = (await f('POST', '/api/character/class', { classId: 'forgefire' })).json as StateResponse;
    const view = chosen.state.combat!;
    expect(view.level).toBe(1);
    // La route part dès le choix de la classe.
    expect(view.activity?.route).toBe(true);
    expect(view.advised).toBe(true);
    expect(view.plan.length).toBeGreaterThan(0);
    // Le set de départ donne un marteau : sa cadence est celle de l'attaque de base.
    expect((await f('POST', '/api/combat/path', { pathId: 'anvil' })).status).toBe(400);
    expect((await f('POST', '/api/combat/plan', { plan: [{ spell: 'fg_workshop', at: 11 }] })).status).toBe(400);
    const planned = (await f('POST', '/api/combat/plan', { plan: [{ spell: 'fg_quench', at: 0 }, { spell: 'fg_workshop', at: 2 }] })).json as StateResponse;
    expect(planned.state.combat!.advised).toBe(false);
    // Une zone du palier 1 : le set de départ y gagne (les profils d'essai se jouent au palier de la classe, plus durs).
    const started = (await f('POST', '/api/combat/start', { encounter: 'z01_lantern_road' })).json as StateResponse;
    expect(started.state.combat!.activity?.name).toBe('La Chaussée des lanternes');
    now += 3_600_000;
    const after = (await f('GET', '/api/state')).json as StateResponse;
    const c = after.state.combat!;
    expect(c.activity!.wins).toBeGreaterThan(10);
    expect(c.xp).toBeGreaterThan(0);
    expect(c.lastFight?.win).toBe(true);
    expect(c.lastFight!.lines.some((l) => l.text.includes('Braise'))).toBe(true);
    expect(after.state.skills.mining?.xp ?? 0).toBe(0);
    expect(after.absence?.combat.fights).toBeGreaterThan(10);
    expect(after.journal.some((e) => e.kind === 'combat')).toBe(true);
    // Le combat tourne à côté du métier ; quitter la patrouille rend la main à la route, qui ne s'arrête pas.
    const mining = (await f('POST', '/api/activity/start', { recipeId: 'mine_copper', quantity: 10, mode: 'replace' })).json as StateResponse;
    expect(mining.state.activity?.recipeId).toBe('mine_copper');
    expect(mining.state.combat!.activity?.name).toBe('La Chaussée des lanternes');
    const route = (await f('POST', '/api/combat/stop')).json as StateResponse;
    expect(route.state.combat!.activity?.route).toBe(true);
    expect(route.state.activity?.recipeId).toBe('mine_copper');
    expect((await f('POST', '/api/combat/stop')).status).toBe(400);
  });

  it('atelier et vitrine : on fabrique une pièce, on la met en vente, un autre l’achète, le vendeur est payé à sa visite', async () => {
    const smith = player({ value: '' });
    await smith('POST', '/api/auth/register', { username: 'Forgeronne', password: 'motdepasse' });
    await smith('POST', '/api/character/class', { classId: 'forgefire' });
    const list = (await smith('GET', '/api/gear/recipes?profession=smithing')).json as { level: number; models: { id: string; tier: number; slot: string; recipe: { inputs: { item: string; qty: number }[] } }[] };
    const model = list.models.find((m) => m.tier === 1 && m.slot === 'head')!;
    expect(model).toBeDefined();
    expect((await smith('POST', '/api/gear/craft', { modelId: model.id })).status).toBe(400);
    for (const i of model.recipe.inputs) await smith('POST', '/api/dev/items/grant', { itemId: i.item, qty: i.qty });
    const crafted = (await smith('POST', '/api/gear/craft', { modelId: model.id })).json as StateResponse;
    expect(crafted.journal.some((e) => e.text.includes('fabriquez') || e.text.includes('Chef-d'))).toBe(true);
    const gear = (await smith('GET', '/api/gear')).json as { items: { id: number; model: string; bound: boolean }[] };
    const piece = gear.items.find((g) => g.model === model.id)!;
    const starter = gear.items.find((g) => g.bound)!;
    expect((await smith('POST', '/api/gear/sell', { id: starter.id, price: 10 })).status).toBe(400);
    expect((await smith('POST', '/api/gear/sell', { id: piece.id, price: 60 })).status).toBe(200);
    expect((await smith('POST', '/api/gear/equip', { id: piece.id })).status).toBe(400);
    const buyer = player({ value: '' });
    await buyer('POST', '/api/auth/register', { username: 'Chineuse', password: 'motdepasse' });
    await buyer('POST', '/api/character/class', { classId: 'forgefire' });
    const shelfRes = await buyer('GET', '/api/market/gear');
    const shelf = shelfRes.json as { id: number; price: number; mine: boolean }[];
    const offer = shelf.find((o) => o.id === piece.id)!;
    expect(offer.price).toBe(60);
    const before = ((await buyer('GET', '/api/state')).json as StateResponse).state.gold;
    const bought = (await buyer('POST', '/api/market/gear/buy', { id: piece.id })).json as StateResponse;
    expect(bought.state.gold).toBe(before - 60);
    expect((await buyer('POST', '/api/market/gear/buy', { id: piece.id })).status).toBe(400);
    const mine = (await buyer('GET', '/api/gear')).json as { items: { id: number }[] };
    expect(mine.items.some((g) => g.id === piece.id)).toBe(true);
    const paid = (await smith('GET', '/api/state')).json as StateResponse;
    expect(paid.journal.some((e) => e.text.includes('Vitrine'))).toBe(true);
  });

  it('comptes : essais limités, comptes limités par adresse ; un foyer joue à plusieurs depuis la même adresse', async () => {
    // Cinq mauvais mots de passe, puis le sixième essai est refusé même juste.
    const a = player({ value: '' }, '10.9.0.1');
    await a('POST', '/api/auth/register', { username: 'Gardienne', password: 'motdepasse' });
    await a('POST', '/api/auth/logout');
    for (let i = 0; i < 5; i++) expect((await a('POST', '/api/auth/login', { username: 'Gardienne', password: 'mauvais-mdp' })).status).toBe(401);
    expect((await a('POST', '/api/auth/login', { username: 'Gardienne', password: 'motdepasse' })).status).toBe(429);
    // Depuis une autre adresse, le compte reste accessible.
    const a2 = player({ value: '' }, '10.9.0.2');
    expect((await a2('POST', '/api/auth/login', { username: 'Gardienne', password: 'motdepasse' })).status).toBe(200);
    // Deux comptes d'un même foyer, la même adresse, en même temps : aucun souci.
    const b = player({ value: '' }, '10.9.0.2');
    expect((await b('POST', '/api/auth/register', { username: 'Jumelle', password: 'motdepasse' })).status).toBe(200);
    expect((await a2('GET', '/api/state')).status).toBe(200);
    expect((await b('GET', '/api/state')).status).toBe(200);
    // Cinq comptes par adresse et par jour.
    const ip = '10.9.0.3';
    for (let i = 0; i < 5; i++) {
      const p = player({ value: '' }, ip);
      expect((await p('POST', '/api/auth/register', { username: `Serie${i}`, password: 'motdepasse' })).status).toBe(200);
      await p('POST', '/api/auth/logout');
    }
    expect((await player({ value: '' }, ip)('POST', '/api/auth/register', { username: 'Serie5', password: 'motdepasse' })).status).toBe(429);
  });

  it('compte : changer son mot de passe, télécharger ses données, tout supprimer (le clan garde un chef)', async () => {
    const me = player({ value: '' });
    const other = { value: '' };
    await me('POST', '/api/auth/register', { username: 'Partante', password: 'motdepasse' });
    other.value = ''; // un autre appareil
    const phone = player(other);
    await phone('POST', '/api/auth/login', { username: 'Partante', password: 'motdepasse' });
    expect((await me('POST', '/api/account/password', { current: 'faux-mdp-1', next: 'nouveau-mdp' })).status).toBe(400);
    expect((await me('POST', '/api/account/password', { current: 'motdepasse', next: 'nouveau-mdp' })).status).toBe(200);
    expect((await me('GET', '/api/state')).status).toBe(200);
    expect((await phone('GET', '/api/state')).status).toBe(401); // l'autre appareil est déconnecté
    // Ses données, en un fichier.
    const data = (await me('GET', '/api/account/export')).json as { character: { name: string }; skills: unknown[] };
    expect(data.character.name).toBe('Partante');
    // Chef d'un clan à deux : en partant, la direction passe à l'autre membre.
    await grant('Partante', 10_000, {});
    await me('POST', '/api/clan/create', { name: 'Les Partants' });
    const heir = player({ value: '' });
    await heir('POST', '/api/auth/register', { username: 'Heritiere', password: 'motdepasse' });
    const list = (await heir('GET', '/api/clans')).json as import('@bramo/shared').ClanListItem[];
    await heir('POST', '/api/clan/join', { clanId: list.find((c) => c.name === 'Les Partants')!.id });
    expect((await me('POST', '/api/account/delete', { password: 'nouveau-mdp', confirm: 'oui' })).status).toBe(400);
    expect((await me('POST', '/api/account/delete', { password: 'nouveau-mdp', confirm: 'SUPPRIMER' })).status).toBe(200);
    expect((await me('GET', '/api/state')).status).toBe(401);
    expect((await player({ value: '' })('POST', '/api/auth/login', { username: 'Partante', password: 'nouveau-mdp' })).status).toBe(401);
    expect(((await heir('GET', '/api/clan')).json as import('@bramo/shared').ClanView).myRank).toBe('leader');
  });

  it('discussion : serveur et clan, limites, liens refusés, signalements, modération', async () => {
    const [p1, p2, p3, p4] = [player({ value: '' }), player({ value: '' }), player({ value: '' }), player({ value: '' })];
    const names = ['Bavarde', 'Ecoute', 'Rapporte', 'Moderee'];
    for (const [i, p] of [p1, p2, p3, p4].entries()) await p!('POST', '/api/auth/register', { username: names[i]!, password: 'motdepasse' });
    type Chat = import('@bramo/shared').ChatView;
    const sent = (await p1!('POST', '/api/chat', { channel: 'server', text: '  Bonjour   le bourg !  ' })).json as Chat;
    expect(sent.messages.at(-1)).toMatchObject({ name: 'Bavarde', text: 'Bonjour le bourg !', mine: true });
    expect(((await p2!('GET', '/api/chat?channel=server')).json as Chat).messages.some((m) => m.text === 'Bonjour le bourg !' && !m.mine)).toBe(true);
    // Trop vite, trop long, un lien : refusés.
    expect((await p1!('POST', '/api/chat', { channel: 'server', text: 'encore' })).status).toBe(400);
    now += 5_000;
    expect((await p1!('POST', '/api/chat', { channel: 'server', text: 'x'.repeat(301) })).status).toBe(400);
    expect((await p1!('POST', '/api/chat', { channel: 'server', text: 'venez sur www.arnaque.com' })).status).toBe(400);
    // Le canal du clan : réservé aux membres.
    const clanView = (await p2!('GET', '/api/chat?channel=clan')).json as Chat;
    expect(clanView.canWrite).toBe(false);
    expect((await p2!('POST', '/api/chat', { channel: 'clan', text: 'coucou' })).status).toBe(400);
    // Trois signalements masquent le message.
    const id = sent.messages.at(-1)!.id;
    await p2!('POST', '/api/chat/report', { messageId: id });
    await p3!('POST', '/api/chat/report', { messageId: id });
    expect(((await p2!('GET', '/api/chat?channel=server')).json as Chat).messages.some((m) => m.id === id)).toBe(true);
    await p4!('POST', '/api/chat/report', { messageId: id });
    expect(((await p2!('GET', '/api/chat?channel=server')).json as Chat).messages.some((m) => m.id === id)).toBe(false);
    // Un modérateur rend un joueur muet.
    const { accounts } = await import('../src/db/schema.js');
    await db.update(accounts).set({ role: 'moderator' }).where(eq(accounts.username, 'moderee'));
    now += 5_000;
    const second = ((await p1!('POST', '/api/chat', { channel: 'server', text: 'Me revoilà' })).json as Chat).messages.at(-1)!;
    expect((await p2!('POST', '/api/chat/moderate', { messageId: second.id, action: 'mute', hours: 2 })).status).toBe(400); // pas modérateur
    expect((await p4!('POST', '/api/chat/moderate', { messageId: second.id, action: 'mute', hours: 2 })).status).toBe(200);
    now += 5_000;
    expect((await p1!('POST', '/api/chat', { channel: 'server', text: 'je peux parler ?' })).status).toBe(400);
    expect(((await p1!('GET', '/api/chat?channel=server')).json as Chat).canWrite).toBe(false);
  });

  it('Marée du soir : inscription de 19 h à 20 h ; un inscrit combat même déconnecté, un non-inscrit ne marque rien', async () => {
    const { tideDay, tideWindow, registrationWindow } = await import('@bramo/shared');
    const rules = content.combat!.tide!;
    const inscrit = player({ value: '' });
    const absent = player({ value: '' });
    await inscrit('POST', '/api/auth/register', { username: 'Inscrite', password: 'motdepasse' });
    await absent('POST', '/api/auth/register', { username: 'Distrait', password: 'motdepasse' });
    await inscrit('POST', '/api/character/class', { classId: 'runist' });
    await absent('POST', '/api/character/class', { classId: 'forgefire' });
    // Le prochain soir : avant 19 h, refusé ; pendant l'heure, accepté.
    let day = tideDay(now);
    if (now >= registrationWindow(day, rules).start) day += 1;
    const reg = registrationWindow(day, rules);
    now = reg.start - 60_000;
    expect((await inscrit('POST', '/api/tide/register')).status).toBe(400);
    now = reg.start + 10 * 60_000;
    const view = (await inscrit('GET', '/api/tide')).json as import('@bramo/shared').TideView;
    expect(view.registration).toMatchObject({ open: true, registered: false });
    expect((await inscrit('POST', '/api/tide/register')).status).toBe(200);
    expect(((await inscrit('GET', '/api/tide')).json as import('@bramo/shared').TideView).registration.registered).toBe(true);
    // La scène en direct : l'inscrit est devant la digue, on se rassemble ; pendant la Marée, la digue avance.
    type Live = import('@bramo/shared').TideLiveView;
    const gathering = (await inscrit('GET', '/api/tide/live')).json as Live;
    expect(gathering).toMatchObject({ phase: 'gathering', total: 1 });
    expect(gathering.fighters[0]).toMatchObject({ me: true });
    now = tideWindow(day, rules).start + 30 * 60_000;
    const battle = (await inscrit('GET', '/api/tide/live')).json as Live;
    expect(battle.phase).toBe('battle');
    expect(battle.progress.points).toBeGreaterThan(0);
    // Le joueur se déconnecte ; la Marée passe ; il revient le lendemain : ses points et ses éclats sont là.
    now = tideWindow(day, rules).end + 60_000;
    await absent('GET', '/api/state'); // règle le soir
    await inscrit('GET', '/api/state'); // la visite qui verse la soirée
    const back = (await inscrit('GET', '/api/tide')).json as import('@bramo/shared').TideView;
    expect(back.nights.some((n) => n.day === day && n.points > 0)).toBe(true);
    // Le récapitulatif du soir : le seul combattant est le pilier de la digue et le plus gros dégâts.
    expect(back.last?.recap.find((x) => x.key === 'mvp')?.name).toBe('Inscrite');
    expect(back.last?.recap.some((x) => x.key === 'damage')).toBe(true);
    // Le classement du soir : elle est première aux points, et c'est bien elle.
    const ranking = (await inscrit('GET', '/api/tide/ranking')).json as import('@bramo/shared').TideRankingView;
    const pts = ranking.categories.find((c) => c.key === 'mvp')!;
    expect(pts.top[0]).toMatchObject({ rank: 1, name: 'Inscrite', me: true });
    expect(pts.me?.rank).toBe(1);
    await absent('GET', '/api/state');
    const missed = (await absent('GET', '/api/tide')).json as import('@bramo/shared').TideView;
    expect(missed.nights.some((n) => n.day === day)).toBe(false);
  });

  it('photo de profil : envoi, affichage, refus d’un SVG, délai, signalements, discussion', async () => {
    const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    const moi = player({ value: '' });
    await moi('POST', '/api/auth/register', { username: 'Portrait', password: 'motdepasse' });
    await moi('POST', '/api/character/class', { classId: 'runist' });
    expect((await moi('POST', '/api/profile/avatar', { image: 'data:image/svg+xml;base64,PHN2Zy8+' })).status).toBe(400);
    expect((await moi('POST', '/api/profile/avatar', { image: 'data:image/png;base64,QUJD' })).status).toBe(400); // pas une vraie image
    const set = await moi('POST', '/api/profile/avatar', { image: png });
    expect(set.json).toMatchObject({ avatar: 1, hidden: false });
    const st = (await moi('GET', '/api/state')).json as StateResponse;
    expect(st.avatar).toBe(1);
    const img = await app.inject({ method: 'GET', url: '/api/avatars/' + st.characterId + '?v=1' });
    expect(img.statusCode).toBe(200);
    expect(img.headers['content-type']).toContain('image/png');
    expect((await moi('POST', '/api/profile/avatar', { image: png })).status).toBe(400); // trop tôt pour en changer
    // Sa photo accompagne ses messages.
    await moi('POST', '/api/chat', { channel: 'server', text: 'Bonjour la digue' });
    const chat = (await moi('GET', '/api/chat?channel=server')).json as import('@bramo/shared').ChatView;
    expect(chat.messages.find((m) => m.text === 'Bonjour la digue')).toMatchObject({ avatar: 1, mine: true });
    // Trois joueurs la signalent : elle est masquée.
    for (const n of ['Temoin1', 'Temoin2', 'Temoin3']) {
      const t = player({ value: '' });
      await t('POST', '/api/auth/register', { username: n, password: 'motdepasse' });
      await t('POST', '/api/profile/avatar/report', { characterId: st.characterId });
    }
    expect(((await moi('GET', '/api/state')).json as StateResponse).avatar).toBeNull();
    expect((await app.inject({ method: 'GET', url: '/api/avatars/' + st.characterId + '?v=1' })).statusCode).toBe(404);
    expect(((await moi('GET', '/api/profile/avatar')).json as { hidden: boolean }).hidden).toBe(true);
  });

  it('tour guidé : proposé une fois, puis retenu', async () => {
    const p = player({ value: '' });
    await p('POST', '/api/auth/register', { username: 'Novice', password: 'motdepasse' });
    expect(((await p('GET', '/api/state')).json as StateResponse).state.tourDone).toBe(false);
    expect(((await p('POST', '/api/character/tour')).json as StateResponse).state.tourDone).toBe(true);
    expect(((await p('GET', '/api/state')).json as StateResponse).state.tourDone).toBe(true);
  });

  it('Mécène de la Marée : on offre la prochaine Marée, l’or part, le nom s’affiche, trois places au plus', async () => {
    const rules = content.combat!.tide!.patron!;
    const names = ['Mecene', 'Mecenedeux', 'Mecenetrois', 'Mecenequatre'];
    const players = names.map(() => player({ value: '' }));
    for (const [i, p] of players.entries()) {
      await p('POST', '/api/auth/register', { username: names[i]!, password: 'motdepasse' });
      await p('POST', '/api/character/class', { classId: 'runist' });
    }
    expect((await players[0]!('POST', '/api/tide/patron')).status).toBe(400); // pas assez d'or
    for (const n of names) await grant(n, 5000, {});
    const view0 = (await players[0]!('GET', '/api/tide')).json as import('@bramo/shared').TideView;
    const price = view0.patron!.price;
    expect(price).toBeGreaterThanOrEqual(rules.minPrice);
    const offered = (await players[0]!('POST', '/api/tide/patron')).json as StateResponse;
    expect(offered.state.gold).toBe(5000 - price);
    expect((await players[0]!('POST', '/api/tide/patron')).status).toBe(400); // une fois par soir
    await players[1]!('POST', '/api/tide/patron');
    await players[2]!('POST', '/api/tide/patron');
    expect((await players[3]!('POST', '/api/tide/patron')).status).toBe(400); // complet
    const view = (await players[3]!('GET', '/api/tide')).json as import('@bramo/shared').TideView;
    expect(view.patron!.names).toEqual(names.slice(0, 3));
    const mine = (await players[0]!('GET', '/api/tide')).json as import('@bramo/shared').TideView;
    expect(mine.patron!.offered).toBe(1);
    expect(mine.titles).toContain(rules.titles[0]!.title);
    const feed = ((await players[0]!('GET', '/api/town')).json as import('@bramo/shared').TownView).feed;
    expect(feed.some((e) => e.kind === 'tide' && e.text.includes('Mecene offre'))).toBe(true);
  });

  it('Ouvrages du clan : on bâtit ensemble, l’ouvrage achevé donne un Banquet que le chef lance', async () => {
    const chef = player({ value: '' });
    const membre = player({ value: '' });
    await chef('POST', '/api/auth/register', { username: 'Batisseuse', password: 'motdepasse' });
    await membre('POST', '/api/auth/register', { username: 'Gacheur', password: 'motdepasse' });
    await grant('Batisseuse', 100_000, {});
    await chef('POST', '/api/clan/create', { name: 'Les Maçons' });
    const list = (await membre('GET', '/api/clans')).json as import('@bramo/shared').ClanListItem[];
    await membre('POST', '/api/clan/join', { clanId: list.find((c) => c.name === 'Les Maçons')!.id });
    const v0 = (await chef('GET', '/api/clan')).json as import('@bramo/shared').ClanView;
    expect(v0.works).toMatchObject({ level: 0, banquets: 0, banquet: null, canLaunch: false });
    const next = v0.works!.next;
    expect(next.id).toBe(content.clanWorks!.works[0]!.id);
    await grant('Gacheur', 0, Object.fromEntries(next.items.map((i) => [i.item, i.need])));
    expect((await chef('POST', '/api/clan/banquet')).status).toBe(400); // pas de banquet en réserve
    await chef('POST', '/api/clan/works/contribute', { what: 'gold', qty: next.gold.need });
    for (const i of next.items) await membre('POST', '/api/clan/works/contribute', { what: i.item, qty: i.need });
    const v1 = (await chef('GET', '/api/clan')).json as import('@bramo/shared').ClanView;
    expect(v1.works).toMatchObject({ level: 1, banquets: 1, canLaunch: true });
    expect(v1.works!.next.id).toBe(content.clanWorks!.works[1]!.id);
    // Un simple membre ne lance pas le banquet ; le chef, oui, une fois à la fois.
    expect((await membre('POST', '/api/clan/banquet')).status).toBe(400);
    const launched = (await chef('POST', '/api/clan/banquet')).json as StateResponse;
    expect(launched.journal.some((j) => j.text.includes('Banquet'))).toBe(true);
    expect((await chef('POST', '/api/clan/banquet')).status).toBe(400);
    const v2 = (await membre('GET', '/api/clan')).json as import('@bramo/shared').ClanView;
    expect(v2.works!.banquet).toMatchObject({ bonus: content.clanWorks!.banquet.xpBonus });
    expect(v2.works!.banquet!.until - v2.works!.banquet!.from).toBe(content.clanWorks!.banquet.hours * 3_600_000);
  });

  it('l’Affineur du bourg : un rang de plus (or et matière de la pièce), un affûtage de ligne', async () => {
    const a = player({ value: '' });
    await a('POST', '/api/auth/register', { username: 'Affineuse', password: 'motdepasse' });
    await a('POST', '/api/character/class', { classId: 'forgefire' });
    const model = Object.values(content.gearModels).find((m) => m.rarity === 'epic' && m.tier === 60 && !m.set && !m.talent && m.slot === 'torso' && m.classes.includes('forgefire'))!;
    const gear0 = (await a('POST', '/api/dev/gear/grant', { modelId: model.id })).json as import('@bramo/shared').GearView;
    const piece = gear0.items.find((g) => g.model === model.id)!;
    expect(piece.rank).toBe(0);
    const cost = piece.rankCost!;
    expect((await a('POST', '/api/gear/refine', { id: piece.id, kind: 'rank' })).status).toBe(400); // sans or ni matière
    await grant('Affineuse', 100_000, { [cost.items[0]!.item]: 10_000 });
    const r1 = (await a('POST', '/api/gear/refine', { id: piece.id, kind: 'rank' })).json as { state: StateResponse; gear: import('@bramo/shared').GearView };
    const up = r1.gear.items.find((g) => g.id === piece.id)!;
    expect(up.rank).toBe(1);
    expect(up.rankCost!.gold).toBeGreaterThan(cost.gold);
    expect(r1.state.state.gold).toBe(100_000 - cost.gold);
    expect(up.stats[0]!.value).toBeGreaterThan(piece.stats[0]!.value);
    const line = up.honeable[0]!;
    const r2 = (await a('POST', '/api/gear/refine', { id: piece.id, kind: 'hone', line })).json as { gear: import('@bramo/shared').GearView };
    const honed = r2.gear.items.find((g) => g.id === piece.id)!;
    expect(honed.lines[line]!.value).toBeGreaterThan(up.lines[line]!.value);
  });

  it('l’Affineur : démonter des pièces en poussière, puis retailler une ligne et garder une proposition', async () => {
    type GV = import('@bramo/shared').GearView;
    const a = player({ value: '' });
    await a('POST', '/api/auth/register', { username: 'Retailleuse', password: 'motdepasse' });
    await a('POST', '/api/character/class', { classId: 'forgefire' });
    const model = Object.values(content.gearModels).find((m) => m.rarity === 'epic' && m.tier === 40 && !m.set && !m.talent && m.slot === 'torso' && m.classes.includes('forgefire') && m.rolls[1] >= 2)!;
    for (let i = 0; i < 6; i++) await a('POST', '/api/dev/gear/grant', { modelId: model.id });
    const bag = ((await a('GET', '/api/gear')).json as GV).items.filter((g) => g.model === model.id);
    const [keep, ...junk] = bag;
    expect(keep!.salvage).toEqual({ item: 'lointain_dust', qty: 16 });
    // Une pièce portée ne se démonte pas.
    await a('POST', '/api/gear/equip', { id: keep!.id });
    expect((await a('POST', '/api/gear/salvage', { ids: [keep!.id] })).status).toBe(400);
    const s1 = (await a('POST', '/api/gear/salvage', { ids: junk.map((g) => g.id) })).json as { state: StateResponse; gear: GV };
    expect(s1.state.state.inventory.lointain_dust).toBe(16 * junk.length);
    expect(s1.gear.items.some((g) => junk.some((j) => j.id === g.id))).toBe(false);
    // Retailler la pièce portée : propositions, puis choix.
    await grant('Retailleuse', 100_000, {});
    const piece = s1.gear.items.find((g) => g.id === keep!.id)!;
    const r1 = (await a('POST', '/api/gear/refine', { id: piece.id, kind: 'reroll', line: 0 })).json as { state: StateResponse; gear: GV };
    const offered = r1.gear.items.find((g) => g.id === piece.id)!;
    expect(offered.rerollOffer!.length).toBe(2);
    expect(r1.state.state.inventory.lointain_dust ?? 0).toBe(16 * junk.length - piece.rerollCost!.items[0]!.qty);
    const r2 = (await a('POST', '/api/gear/refine', { id: piece.id, kind: 'reroll_pick', pick: 1 })).json as { gear: GV };
    const done = r2.gear.items.find((g) => g.id === piece.id)!;
    expect(done.lines[0]).toEqual(offered.rerollOffer![1]);
    expect(done.rerollOffer).toBeNull();
    expect(done.rerollable).toEqual([0]);
  });
});

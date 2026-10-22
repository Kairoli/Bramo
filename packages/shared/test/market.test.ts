import { describe, expect, it } from 'vitest';
import { GameError } from '../src/engine/state.js';
import { type MarketOrder, match, netProceeds, validateOrder } from '../src/engine/market.js';
import { completeNpcOrder, npcOrdersOfDay } from '../src/engine/npc.js';
import { T0, content, makeState } from './fixture.js';

const order = (over: Partial<MarketOrder>): MarketOrder => ({ id: 1, ownerId: 2, side: 'sell', itemId: 'ore', qty: 5, price: 10, wear: 0, ...over });

describe('marché : appariement', () => {
  it('un achat prend d’abord les offres les moins chères, puis les plus anciennes, au prix de l’offre', () => {
    const book = [order({ id: 3, price: 9 }), order({ id: 1, price: 8, qty: 2 }), order({ id: 2, price: 8, qty: 2 }), order({ id: 4, price: 20 })];
    const fills = match(book, 'buy', 'ore', 5, 10, 99);
    expect(fills.map((f) => [f.order.id, f.qty])).toEqual([[1, 2], [2, 2], [3, 1]]);
  });

  it('une vente prend d’abord les demandes les plus généreuses', () => {
    const book = [order({ id: 1, side: 'buy', price: 5 }), order({ id: 2, side: 'buy', price: 8 })];
    expect(match(book, 'sell', 'ore', 3, 6, 99).map((f) => f.order.id)).toEqual([2]);
  });

  it('ne croise jamais ses propres ordres ni un autre objet', () => {
    const book = [order({ ownerId: 99 }), order({ id: 2, itemId: 'bar' })];
    expect(match(book, 'buy', 'ore', 5, 10, 99)).toEqual([]);
  });

  it('à prix égal, l’exemplaire le moins usé part en premier', () => {
    const book = [order({ id: 1, wear: 500, qty: 1 }), order({ id: 2, wear: 100, qty: 1 })];
    expect(match(book, 'buy', 'pick', 1, 10, 99).length).toBe(0);
    const picks = book.map((o) => ({ ...o, itemId: 'pick' }));
    expect(match(picks, 'buy', 'pick', 1, 10, 99)[0]!.order.id).toBe(2);
  });

  it('la taxe est arrondie au plus proche : 5 % en moyenne, sans écraser les petits lots ni créer d’or', () => {
    expect(netProceeds(50, content)).toBe(47);
    expect(netProceeds(10, content)).toBe(9);
    expect(netProceeds(1, content)).toBe(1);
    expect(netProceeds(19, content)).toBe(18);
    for (let g = 1; g <= 500; g++) expect(netProceeds(g, content)).toBeLessThanOrEqual(g);
  });

  it('valide prix, quantité et règles des objets durables', () => {
    expect(() => validateOrder(content, 'sell', 'ore', 1, 0)).toThrow(GameError);
    expect(() => validateOrder(content, 'sell', 'ore', 1000, 5)).toThrow(GameError);
    expect(() => validateOrder(content, 'sell', 'nothing', 1, 5)).toThrow(GameError);
    expect(() => validateOrder(content, 'buy', 'frail_pick', 1, 5)).toThrow(GameError);
    expect(() => validateOrder(content, 'sell', 'frail_pick', 2, 5)).toThrow(GameError);
    expect(() => validateOrder(content, 'sell', 'frail_pick', 1, 5)).not.toThrow();
  });
});

describe('commandes PNJ', () => {
  const lvl = (level: number) => Math.round(content.xpTable[level]!);

  it('propres au joueur et au jour : stables dans la journée, différentes d’un joueur à l’autre', () => {
    const me = makeState({ seed: 7 });
    const today = npcOrdersOfDay(me, T0, content).map((o) => o.id);
    expect(npcOrdersOfDay(me, T0 + 3_600_000, content).map((o) => o.id)).toEqual(today);
    const others = new Set(Array.from({ length: 20 }, (_, i) => npcOrdersOfDay(makeState({ seed: i }), T0, content).map((o) => o.id).join()));
    expect(others.size).toBeGreaterThan(1);
  });

  it('s’adapte au niveau métier par métier, sans métier fermé', () => {
    const novice = npcOrdersOfDay(makeState(), T0, content);
    expect(novice.map((o) => o.profession).sort()).toEqual(['mining', 'smithing']);
    expect(novice.every((o) => o.level === 1)).toBe(true);
    // Haut en Minage, niveau 1 en Forge : la commande de minage monte, celle de forge reste de niveau 1.
    const mixed = npcOrdersOfDay(makeState({ skills: { mining: lvl(25) } }), T0, content);
    expect(mixed.find((o) => o.profession === 'mining')!.level).toBe(20);
    expect(mixed.find((o) => o.profession === 'smithing')!.level).toBe(1);
  });

  it('prend les objets, verse l’or et refuse une seconde remise', () => {
    const base = makeState();
    const [first] = npcOrdersOfDay(base, T0, content);
    const inventory = Object.fromEntries(first!.items.map((i) => [i.item, i.qty]));
    const s = completeNpcOrder({ ...base, inventory }, first!.id, T0, content);
    expect(s.gold).toBe(100 + first!.gold);
    expect(s.inventory).toEqual({});
    expect(() => completeNpcOrder({ ...s, inventory }, first!.id, T0, content)).toThrow('déjà');
    expect(() => completeNpcOrder(base, first!.id, T0, content)).toThrow('manque');
    expect(() => completeNpcOrder({ ...base, inventory }, 'ore_hard', T0, content)).toThrow(GameError);
  });
});

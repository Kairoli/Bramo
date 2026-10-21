import { describe, expect, it } from 'vitest';
import { advance } from '../src/engine/advance.js';
import { GameError } from '../src/engine/state.js';
import { recycleItem, repairCost, repairItem, stockPantry, unstockPantry } from '../src/engine/actions.js';
import { viewState } from '../src/engine/view.js';
import { HOUR, MIN, SEC, T0, content, makeState, mining } from './fixture.js';

describe('usure des outils', () => {
  it('un outil s’use au temps de travail et perd son bonus une fois usé, sans disparaître', () => {
    // Pioche +20 % pendant 36 s de travail (3 fabrications d'avance : 36 s × 1,2 = 43,2 s), puis 100 % : 100 s au total.
    const s = makeState({ activity: mining(), inventory: { frail_pick: 1 } });
    const { state, summary } = advance(s, T0 + 100 * SEC, content);
    expect(state.inventory.ore).toBe(Math.floor((36 * 1.2 + 64) / 10));
    expect(state.wear.frail_pick).toBeCloseTo(36 * SEC);
    expect(state.inventory.frail_pick).toBe(1);
    expect(summary.worn).toEqual(['frail_pick']);
  });

  it('ne s’use pas quand le personnage est à l’arrêt', () => {
    const s = makeState({ inventory: { frail_pick: 1 } });
    expect(advance(s, T0 + HOUR, content).state.wear).toEqual({});
  });

  it('calculer en une fois ou en plusieurs fois donne la même usure', () => {
    const start = makeState({ activity: mining(), inventory: { frail_pick: 1 } });
    const once = advance(start, T0 + 5 * MIN, content).state;
    let step = start;
    for (let t = T0 + 13 * SEC; t < T0 + 5 * MIN; t += 13 * SEC) step = advance(step, t, content).state;
    step = advance(step, T0 + 5 * MIN, content).state;
    expect(step.wear.frail_pick).toBeCloseTo(once.wear.frail_pick!);
    expect(step.inventory.ore).toBe(once.inventory.ore);
  });

  it('un outil neuf de rechange prend le relais d’un outil usé', () => {
    const s = makeState({ activity: mining(), inventory: { frail_pick: 1, pick: 1 }, wear: { frail_pick: 36 * SEC } });
    const { state } = advance(s, T0 + 100 * SEC, content);
    expect(state.inventory.ore).toBe(13); // la pioche à +50 % (plafonnée +30 %) travaille
    expect(state.wear.pick).toBeUndefined();
  });

  it('la réparation rend toute la durabilité contre de l’or, au prorata de l’usure', () => {
    const worn = makeState({ inventory: { frail_pick: 1 }, wear: { frail_pick: 18 * SEC } });
    expect(repairCost('frail_pick', worn, content)).toBe(3); // 10 × 50 % × 50 % = 2,5 → 3
    const fixed = repairItem(worn, 'frail_pick', content);
    expect(fixed.gold).toBe(97);
    expect(fixed.wear.frail_pick).toBeUndefined();
    expect(() => repairItem(fixed, 'frail_pick', content)).toThrow(GameError);
    expect(() => repairItem({ ...worn, gold: 1 }, 'frail_pick', content)).toThrow(GameError);
  });
});

describe('recyclage', () => {
  it('rend 40 % des matériaux, arrondi vers le bas', () => {
    const s = recycleItem(makeState({ inventory: { block: 2 } }), 'block', 2, content);
    expect(s.inventory.block).toBeUndefined();
    expect(s.inventory.ore).toBe(8);
  });

  it('refuse ce qui ne rend rien', () => {
    expect(() => recycleItem(makeState({ inventory: { bar: 1 } }), 'bar', 1, content)).toThrow(GameError);
    expect(() => recycleItem(makeState({ inventory: { stew: 1 } }), 'stew', 1, content)).toThrow(GameError);
  });
});

describe('garde-manger', () => {
  it('range et reprend des repas', () => {
    const s = stockPantry(makeState({ inventory: { stew: 3 } }), 'stew', 2, content);
    expect(s.pantry).toEqual({ stew: 2 });
    expect(s.inventory.stew).toBe(1);
    expect(unstockPantry(s, 'stew', 2).inventory.stew).toBe(3);
    expect(() => stockPantry(makeState({ inventory: { ore: 1 } }), 'ore', 1, content)).toThrow(GameError);
  });

  it('mange automatiquement dès que le précédent expire, hors ligne compris', () => {
    // Repas de 30 min en réserve ×2 ; 2 min en ligne puis hors ligne (25 %).
    const s = makeState({ activity: mining(), pantry: { stew: 2 } });
    const { state, summary } = advance(s, T0 + 50 * MIN, content);
    expect(summary.autoMeals).toEqual(['stew', 'stew']);
    expect(state.pantry.stew).toBeUndefined();
    expect(state.buff?.until).toBe(T0 + 60 * MIN);
  });

  it('ne gaspille pas de repas quand rien ne tourne', () => {
    const { state, summary } = advance(makeState({ pantry: { stew: 2 } }), T0 + HOUR, content);
    expect(summary.autoMeals).toEqual([]);
    expect(state.pantry.stew).toBe(2);
  });

  it('le résultat est le même en une ou plusieurs étapes', () => {
    const start = makeState({ activity: mining(), pantry: { stew: 3 } });
    const once = advance(start, T0 + 2 * HOUR, content).state;
    let step = start;
    for (let t = T0 + 11 * MIN; t < T0 + 2 * HOUR; t += 11 * MIN) step = advance(step, t, content).state;
    step = advance(step, T0 + 2 * HOUR, content).state;
    expect(step.inventory.ore).toBe(once.inventory.ore);
    expect(step.pantry).toEqual(once.pantry);
  });
});

describe('vue', () => {
  it('expose durabilité, prix de réparation, recyclage et garde-manger', () => {
    const s = makeState({ inventory: { frail_pick: 1, block: 1 }, wear: { frail_pick: 18 * SEC }, pantry: { stew: 1 } });
    const v = viewState(s, T0, content);
    expect(v.durability.frail_pick).toEqual({ remainingMs: 18 * SEC, totalMs: 36 * SEC, repairCost: 3 });
    expect(v.recycle.block).toEqual([{ item: 'ore', qty: 4 }]);
    expect(v.pantry).toEqual({ stew: 1 });
  });
});

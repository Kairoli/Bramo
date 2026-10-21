import { describe, expect, it } from 'vitest';
import { advance } from '../src/engine/advance.js';
import { GameError } from '../src/engine/state.js';
import { applyPrime, primeFor, repairWithMaterials } from '../src/engine/commission.js';
import { recycleItem, repairCost, repairItem, stockPantry, unstockPantry } from '../src/engine/actions.js';
import { copiesWear, giveCopy, takeCopy } from '../src/engine/gear.js';
import { viewState } from '../src/engine/view.js';
import { HOUR, MIN, SEC, T0, content, makeState, mining } from './fixture.js';

describe('usure des outils', () => {
  it('un outil s’use au temps de travail et perd son bonus une fois usé, sans disparaître', () => {
    // Pioche +20 % pendant 36 s de travail (3 fabrications d'avance : 36 s × 1,2 = 43,2 s), puis 100 % : 100 s au total.
    const s = makeState({ activity: mining(), inventory: { frail_pick: 1 } });
    const { state, summary } = advance(s, T0 + 100 * SEC, content);
    expect(state.inventory.ore).toBe(Math.floor((36 * 1.2 + 64) / 10));
    expect(state.wear.frail_pick![0]).toBeCloseTo(36 * SEC);
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
    expect(step.wear.frail_pick![0]).toBeCloseTo(once.wear.frail_pick![0]!);
    expect(step.inventory.ore).toBe(once.inventory.ore);
  });

  it('un outil neuf de rechange prend le relais d’un outil usé', () => {
    const s = makeState({ activity: mining(), inventory: { frail_pick: 1, pick: 1 }, wear: { frail_pick: [36 * SEC] } });
    const { state } = advance(s, T0 + 100 * SEC, content);
    expect(state.inventory.ore).toBe(13); // la pioche à +50 % (plafonnée +30 %) travaille
    expect(state.wear.pick).toBeUndefined();
  });

  it('la réparation rend toute la durabilité contre de l’or, au prorata de l’usure', () => {
    const worn = makeState({ inventory: { frail_pick: 1 }, wear: { frail_pick: [18 * SEC] } });
    expect(repairCost('frail_pick', worn, content)).toBe(3); // 10 × 50 % × 50 % = 2,5 → 3
    const fixed = repairItem(worn, 'frail_pick', content);
    expect(fixed.gold).toBe(97);
    expect(fixed.wear.frail_pick).toBeUndefined();
    expect(() => repairItem(fixed, 'frail_pick', content)).toThrow(GameError);
    expect(() => repairItem({ ...worn, gold: 1 }, 'frail_pick', content)).toThrow(GameError);
  });
});

describe('exemplaires', () => {
  it('chaque exemplaire garde son usure : on finit le plus usé avant d’entamer le neuf', () => {
    const s = makeState({ activity: mining(), inventory: { frail_pick: 2 }, wear: { frail_pick: [30 * SEC] } });
    const { state } = advance(s, T0 + 20 * SEC, content);
    // 6 s sur l'exemplaire à 30 s (il atteint 36 s), puis 14 s sur le neuf.
    expect(state.wear.frail_pick).toEqual([36 * SEC, 14 * SEC]);
  });

  it('réparer remet à neuf le plus usé seulement ; recycler jette les plus usés d’abord', () => {
    const s = makeState({ inventory: { frail_pick: 3 }, wear: { frail_pick: [30 * SEC, 10 * SEC] } });
    expect(repairItem(s, 'frail_pick', content).wear.frail_pick).toEqual([10 * SEC]);
    expect(copiesWear(s, 'frail_pick')).toEqual([30 * SEC, 10 * SEC, 0]);
  });

  it('un exemplaire qui change de main garde son usure', () => {
    const s = makeState({ inventory: { frail_pick: 1 }, wear: { frail_pick: [12 * SEC] } });
    const copy = structuredClone(s);
    const wear = takeCopy(copy, 'frail_pick', 0);
    delete copy.inventory.frail_pick;
    expect(wear).toBe(12 * SEC);
    const other = makeState({ inventory: { frail_pick: 2 }, wear: { frail_pick: [20 * SEC] } });
    giveCopy(other, 'frail_pick', wear);
    other.inventory.frail_pick = 3;
    expect(other.wear.frail_pick).toEqual([20 * SEC, 12 * SEC]);
  });
});

describe('réparation par matériaux et prime de commande', () => {
  const smith = (xp = 0) => ({ smithing: xp });

  it('l’artisan répare avec ses matériaux : l’exemplaire le plus usé redevient neuf (l’XP suit la recette de l’objet, absente ici)', () => {
    const s = makeState({ inventory: { frail_pick: 1, bar: 3 }, wear: { frail_pick: [30 * SEC] }, skills: smith() });
    const fixed = repairWithMaterials(s, 'frail_pick', content);
    expect(fixed.wear.frail_pick).toBeUndefined();
    expect(fixed.inventory.bar).toBe(1);
    expect(fixed.skills.smithing).toBe(0);
  });

  it('refuse sans matériaux, sans niveau ou sans usure', () => {
    const base = { inventory: { frail_pick: 1, bar: 3 }, wear: { frail_pick: [30 * SEC] } };
    expect(() => repairWithMaterials(makeState({ ...base, inventory: { frail_pick: 1 } }), 'frail_pick', content)).toThrow('matériaux');
    expect(() => repairWithMaterials(makeState({ ...base, wear: {} }), 'frail_pick', content)).toThrow('comme neuf');
    expect(() => repairWithMaterials(makeState({ inventory: { pick: 1 } }), 'pick', content)).toThrow(GameError);
  });

  it('la prime ne vaut que pour un objet qu’on sait fabriquer, et dans la limite du jour', () => {
    // Fixture : « Fondre » donne 1 lingot (20 XP) ; prime 20 %, plafond 10 unités par jour.
    const s = makeState({ skills: { smithing: 0 } });
    const p = primeFor(s, 'bar', 4, T0, content)!;
    expect(p.units).toBe(4);
    expect(p.xp).toBeCloseTo(16);
    applyPrime(s, p, T0, content);
    expect(primeFor(s, 'bar', 20, T0, content)!.units).toBe(6);
    expect(primeFor(s, 'bar', 20, T0 + 86_400_000, content)!.units).toBe(10);
    expect(primeFor(s, 'ore', 5, T0, content)).toBeNull();
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
    const s = makeState({ inventory: { frail_pick: 1, block: 1 }, wear: { frail_pick: [18 * SEC] }, pantry: { stew: 1 } });
    const v = viewState(s, T0, content);
    expect(v.durability.frail_pick).toEqual({ totalMs: 36 * SEC, copies: [18 * SEC], repairCost: 3, repair: { materials: [{ item: 'bar', qty: 2 }], problem: 'Il vous manque des matériaux pour cette réparation.' } });
    expect(v.recycle.block).toEqual([{ item: 'ore', qty: 4 }]);
    expect(v.pantry).toEqual({ stew: 1 });
  });
});

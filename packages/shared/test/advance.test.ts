import { describe, expect, it } from 'vitest';
import { advance } from '../src/engine/advance.js';
import { HOUR, MIN, SEC, T0, content, makeState, mining } from './fixture.js';

describe('advance : rendement', () => {
  it('actif sans énergie : 100 %', () => {
    // Présent jusqu’à T0 + 2 min (délai), on avance de 2 min : 12 fabrications de 10 s.
    const { state, summary } = advance(makeState({ activity: mining() }), T0 + 2 * MIN, content);
    expect(state.inventory.ore).toBe(12);
    expect(summary.xp.mining).toBe(120);
    expect(summary.time.active).toBe(2 * MIN);
  });

  it('avec énergie : 150 %', () => {
    const s = makeState({ activity: mining(), energy: { dayKey: '', usedMs: 0 } });
    const { state, summary } = advance(s, T0 + 2 * MIN, content);
    expect(state.inventory.ore).toBe(18);
    expect(summary.energyUsedMs).toBe(2 * MIN);
    expect(state.energy.usedMs).toBe(2 * MIN);
  });

  it('hors ligne : 25 %, plafonné à 12 h', () => {
    // Le joueur part à T0 ; 2 min actives, puis 12 h hors ligne, puis plus rien.
    const { state, summary } = advance(makeState({ activity: mining() }), T0 + 48 * HOUR, content);
    const offlineCrafts = (12 * HOUR * 0.25) / (10 * SEC);
    expect(state.inventory.ore).toBe(12 + offlineCrafts);
    expect(summary.time).toEqual({ active: 2 * MIN, offline: 12 * HOUR, capped: 36 * HOUR - 2 * MIN });
  });

  it('ne perd jamais rien : l’avancement partiel est conservé', () => {
    const { state } = advance(makeState({ activity: mining() }), T0 + 15 * SEC, content);
    expect(state.inventory.ore).toBe(1);
    expect(state.activity?.progress).toBeCloseTo(5 * SEC);
  });

  it('calculer en une fois ou en plusieurs fois donne le même résultat', () => {
    const start = makeState({ activity: mining() });
    const once = advance(start, T0 + 10 * HOUR, content).state;
    let step = start;
    for (let t = T0 + 7 * MIN; t <= T0 + 10 * HOUR; t += 7 * MIN) step = advance(step, t, content).state;
    step = advance(step, T0 + 10 * HOUR, content).state;
    expect(step.inventory.ore).toBe(once.inventory.ore);
    expect(step.skills.mining).toBe(once.skills.mining);
  });

  it('applique le bonus d’outil plafonné (+50 % demandé → +30 %)', () => {
    const s = makeState({ activity: mining(), inventory: { pick: 1 } });
    const { state } = advance(s, T0 + 100 * SEC, content);
    expect(state.inventory.ore).toBe(13); // 100 s × 1,3 / 10 s
  });

  it('le bonus de repas s’arrête à l’expiration du repas', () => {
    const s = makeState({ activity: mining(), buff: { itemId: 'stew', bonus: 0.1, until: T0 + 100 * SEC } });
    const { state } = advance(s, T0 + 2 * MIN, content);
    // 100 s à ×1,1 = 110 s effectives, puis 20 s à ×1 : 130 s → 13 fabrications.
    expect(state.inventory.ore).toBe(13);
    expect(state.buff).toBeNull();
  });
});

describe('advance : activités et file', () => {
  it('termine l’activité à la quantité demandée puis enchaîne sur la file', () => {
    const s = makeState({
      activity: mining(4),
      queue: [{ recipeId: 'smelt', quantity: 10 }],
    });
    const { state, summary } = advance(s, T0 + 2 * MIN, content);
    // 4 minerais en 40 s, puis 2 lingots (2 × 2 minerais) en 20 s, puis plus de minerai.
    expect(state.inventory).toEqual({ bar: 2 });
    expect(summary.finished).toEqual([
      { recipeId: 'mine_ore', done: 4, reason: 'completed' },
      { recipeId: 'smelt', done: 2, reason: 'missing_inputs' },
    ]);
    expect(summary.started).toEqual(['smelt']);
    expect(state.activity).toBeNull();
    // Le temps sans activité ne consomme rien.
    expect(summary.workedMs).toBe(60 * SEC);
  });

  it('l’énergie ne se consomme pas sans activité', () => {
    const s = makeState({ activity: mining(3), energy: { dayKey: '', usedMs: 0 } });
    const { summary } = advance(s, T0 + 2 * MIN, content);
    expect(summary.energyUsedMs).toBe(20 * SEC); // 3 × 10 s à ×1,5
  });

  it('signale les montées de niveau', () => {
    // 83 XP pour le niveau 2 : 9 fabrications de 10 XP.
    const { summary } = advance(makeState({ activity: mining() }), T0 + 90 * SEC, content);
    expect(summary.levelUps).toEqual([{ skill: 'mining', from: 1, to: 2 }]);
  });
});

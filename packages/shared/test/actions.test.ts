import { describe, expect, it } from 'vitest';
import { cancelAction, eatMeal, startActivity } from '../src/engine/actions.js';
import { MIN, T0, content, makeState, mining } from './fixture.js';

describe('actions du joueur', () => {
  it('lance une activité', () => {
    const s = startActivity(makeState(), 'mine_ore', 10, 'queue', T0, content);
    expect(s.activity).toMatchObject({ recipeId: 'mine_ore', quantity: 10, done: 0 });
  });

  it('refuse un niveau insuffisant', () => {
    expect(() => startActivity(makeState(), 'hard', 1, 'queue', T0, content)).toThrow('Niveau 50 requis.');
  });

  it('remplace ou met en file', () => {
    const base = makeState({ activity: mining() });
    expect(startActivity(base, 'smelt', 5, 'replace', T0, content).activity?.recipeId).toBe('smelt');
    expect(startActivity(base, 'smelt', 5, 'queue', T0, content).queue).toEqual([{ recipeId: 'smelt', quantity: 5 }]);
  });

  it('la file est limitée à la longueur des réglages', () => {
    let s = makeState({ activity: mining() });
    for (let i = 0; i < 3; i++) s = startActivity(s, 'mine_ore', 1, 'queue', T0, content);
    expect(() => startActivity(s, 'mine_ore', 1, 'queue', T0, content)).toThrow('La file est pleine.');
  });

  it('annuler l’activité fait avancer la file', () => {
    const s = cancelAction(makeState({ activity: mining(), queue: [{ recipeId: 'smelt', quantity: 2 }] }), -1, T0);
    expect(s.activity?.recipeId).toBe('smelt');
    expect(s.queue).toEqual([]);
  });

  it('manger un repas donne un bonus temporaire', () => {
    const s = eatMeal(makeState({ inventory: { stew: 2 } }), 'stew', T0, content);
    expect(s.inventory.stew).toBe(1);
    expect(s.buff).toEqual({ itemId: 'stew', bonus: 0.1, until: T0 + 30 * MIN });
  });
});

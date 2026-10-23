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
    const base = makeState({ activity: mining(), inventory: { ore: 2 } });
    expect(startActivity(base, 'smelt', 5, 'replace', T0, content).activity?.recipeId).toBe('smelt');
    expect(startActivity(base, 'smelt', 5, 'queue', T0, content).queue).toEqual([{ recipeId: 'smelt', quantity: 5 }]);
  });

  it('refuse de lancer tout de suite sans de quoi en faire une (l’activité en cours continue), mais permet la file', () => {
    const base = makeState({ activity: mining(), inventory: { ore: 1 } });
    expect(() => startActivity(base, 'smelt', 1, 'replace', T0, content)).toThrow('Il vous manque');
    expect(() => startActivity(makeState(), 'smelt', 1, 'queue', T0, content)).toThrow('Il vous manque');
    expect(startActivity(base, 'smelt', 1, 'queue', T0, content).activity?.recipeId).toBe('mine_ore');
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

describe('XP du début de métier', () => {
  it('double chaque fabrication commencée sous le seuil, exact quel que soit le découpage', async () => {
    const { boostedXp } = await import('../src/formulas/xp.js');
    // Seuil 100 : sous lui, 10 XP comptent 20.
    expect(boostedXp(10, 3, 0, 100, 2)).toBe(60);
    expect(boostedXp(10, 10, 0, 100, 2)).toBe(5 * 20 + 5 * 10);
    expect(boostedXp(10, 4, 95, 100, 2)).toBe(20 + 30);
    expect(boostedXp(10, 4, 100, 100, 2)).toBe(40);
    // En un lot ou en deux, même total.
    const a = boostedXp(10, 10, 0, 100, 2);
    const first = boostedXp(10, 3, 0, 100, 2);
    expect(first + boostedXp(10, 7, first, 100, 2)).toBe(a);
  });
});

describe('titres', () => {
  it('on choisit un titre gagné, à part de l’ornement ; un titre pas gagné est refusé', async () => {
    const { chooseTitle, chosenTitle, unlockedTitles } = await import('../src/engine/titles.js');
    const s = makeState();
    expect(unlockedTitles(s, content).map((t) => t.text)).toContain('Gratte-sol');
    expect(() => chooseTitle(s, 'Roi du monde', content)).toThrow('pas encore gagné');
    const t = chooseTitle(s, 'Souffleur', content);
    expect(chosenTitle(t, content)).toBe('Souffleur');
    expect(chosenTitle(chooseTitle(t, null, content), content)).toBeNull();
  });
});

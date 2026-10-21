import { describe, expect, it } from 'vitest';
import { buildXpTable, levelForXp, nextTitle, titleForLevel, xpForLevel } from '../src/formulas/xp.js';
import { settings } from './fixture.js';

describe('courbe d’XP', () => {
  it('niveau 1 = 0 XP, niveau 2 = 83 XP', () => {
    expect(xpForLevel(1)).toBe(0);
    expect(xpForLevel(2)).toBe(83);
  });

  it('niveau 99 = 13 034 431 XP', () => {
    expect(xpForLevel(99)).toBe(13_034_431);
  });

  it('valeurs de référence RuneScape', () => {
    expect(xpForLevel(10)).toBe(1_154);
    expect(xpForLevel(50)).toBe(101_333);
    expect(xpForLevel(92)).toBe(6_517_253);
  });

  it('est strictement croissante', () => {
    const table = buildXpTable(99);
    for (let l = 2; l <= 99; l++) expect(table[l]!).toBeGreaterThan(table[l - 1]!);
  });

  it('levelForXp inverse la table et plafonne à 99', () => {
    const table = buildXpTable(99);
    expect(levelForXp(0, table)).toBe(1);
    expect(levelForXp(82, table)).toBe(1);
    expect(levelForXp(83, table)).toBe(2);
    expect(levelForXp(13_034_430, table)).toBe(98);
    expect(levelForXp(13_034_431, table)).toBe(99);
    expect(levelForXp(200_000_000, table)).toBe(99);
  });
});

describe('titres de métier', () => {
  it.each([
    [1, 'Novice'],
    [29, 'Novice'],
    [30, 'Apprenti'],
    [60, 'Compagnon'],
    [84, 'Compagnon'],
    [85, 'Maître'],
    [99, 'Grand maître'],
  ])('niveau %i → %s', (level, title) => {
    expect(titleForLevel(level, settings.titles)).toBe(title);
  });

  it('prochain titre', () => {
    expect(nextTitle(74, settings.titles)?.name).toBe('Maître');
    expect(nextTitle(99, settings.titles)).toBeNull();
  });
});

import { describe, expect, it } from 'vitest';
import { bonusMultiplier, consumeEnergy, dayKey, nextDayReset, presenceAt } from '../src/formulas/rates.js';
import { HOUR, MIN, T0, settings } from './fixture.js';

const fresh = { dayKey: '', usedMs: 0 };
const empty = { dayKey: '2026-01-10', usedMs: 2 * HOUR };

describe('présence et rendement', () => {
  it('actif pendant le délai de présence, avec énergie : ×1,5', () => {
    const w = presenceAt(T0, T0, fresh, settings);
    expect(w).toMatchObject({ presence: 'active', energized: true, multiplier: 1.5 });
    expect(w.until).toBe(T0 + 2 * MIN);
  });

  it('actif sans énergie : ×1', () => {
    expect(presenceAt(T0, T0, empty, settings)).toMatchObject({ presence: 'active', energized: false, multiplier: 1 });
  });

  it('hors ligne : ×0,25 jusqu’à 12 h après le départ', () => {
    const w = presenceAt(T0 + 3 * HOUR, T0, empty, settings);
    expect(w).toMatchObject({ presence: 'offline', multiplier: 0.25 });
    expect(w.until).toBe(T0 + 2 * MIN + 12 * HOUR);
  });

  it('au-delà du plafond : plus rien n’avance', () => {
    expect(presenceAt(T0 + 13 * HOUR, T0, empty, settings)).toMatchObject({ presence: 'capped', multiplier: 0 });
  });

  it('la fenêtre énergisée s’arrête quand l’énergie s’épuise', () => {
    const energy = { dayKey: '2026-01-10', usedMs: 2 * HOUR - 30_000 };
    expect(presenceAt(T0, T0, energy, settings).until).toBe(T0 + 30_000);
  });
});

describe('énergie quotidienne', () => {
  it('le jour bascule à 4 h UTC', () => {
    expect(dayKey(Date.UTC(2026, 0, 10, 3, 59), settings)).toBe('2026-01-09');
    expect(dayKey(Date.UTC(2026, 0, 10, 4, 0), settings)).toBe('2026-01-10');
    expect(nextDayReset(T0, settings)).toBe(Date.UTC(2026, 0, 11, 4));
  });

  it('se recharge le lendemain', () => {
    const tomorrow = Date.UTC(2026, 0, 11, 9);
    expect(presenceAt(tomorrow, tomorrow, empty, settings).energized).toBe(true);
  });

  it('la consommation est plafonnée à 2 h', () => {
    const e = consumeEnergy(fresh, T0, 3 * HOUR, settings);
    expect(e).toEqual({ dayKey: '2026-01-10', usedMs: 2 * HOUR });
  });
});

describe('bonus plafonnés', () => {
  const caps = settings.bonusCaps;
  it('additionne les bonus sous leurs plafonds', () => {
    expect(bonusMultiplier({ tool: 0.1, meal: 0.05, clan: 0, season: 0 }, caps)).toBeCloseTo(1.15);
  });
  it('borne chaque source : outil 30 %, repas 10 %, clan 10 %, saison 20 %', () => {
    expect(bonusMultiplier({ tool: 1, meal: 1, clan: 1, season: 1 }, caps)).toBeCloseTo(1.7);
  });
});

import { describe, expect, it } from 'vitest';
import { bonusMultiplier, dayKey, energyChargesLeft, nextDayReset, presenceAt, readEnergy } from '../src/formulas/rates.js';
import { activateEnergy } from '../src/engine/actions.js';
import { GameError } from '../src/engine/state.js';
import { HOUR, MIN, T0, content, makeState, settings } from './fixture.js';

const none = { dayKey: '', used: 0, activeUntil: 0 };
const boosted = { dayKey: '2026-01-10', used: 1, activeUntil: T0 + 30 * MIN };

describe('présence et rendement', () => {
  it('actif pendant le délai de présence : ×1', () => {
    const w = presenceAt(T0, T0, none, settings);
    expect(w).toMatchObject({ presence: 'active', energized: false, multiplier: 1 });
    expect(w.until).toBe(T0 + 2 * MIN);
  });

  it('coup de fouet : ×1,5 jusqu’à sa fin', () => {
    const w = presenceAt(T0 + 5 * MIN, T0 + 5 * MIN, boosted, settings);
    expect(w).toMatchObject({ presence: 'active', energized: true, multiplier: 1.5 });
    expect(presenceAt(T0 + 29 * MIN, T0, boosted, settings)).toMatchObject({ presence: 'offline', multiplier: 0.375 });
    expect(presenceAt(T0 + 20 * MIN, T0, boosted, settings).until).toBe(T0 + 30 * MIN);
  });

  it('hors ligne : ×0,25 jusqu’à 12 h après le départ', () => {
    const w = presenceAt(T0 + 3 * HOUR, T0, none, settings);
    expect(w).toMatchObject({ presence: 'offline', multiplier: 0.25 });
    expect(w.until).toBe(T0 + 2 * MIN + 12 * HOUR);
  });

  it('au-delà du plafond : plus rien n’avance, même sous coup de fouet', () => {
    expect(presenceAt(T0 + 13 * HOUR, T0, none, settings)).toMatchObject({ presence: 'capped', multiplier: 0 });
  });
});

describe('coups de fouet', () => {
  it('le jour bascule à 4 h UTC', () => {
    expect(dayKey(Date.UTC(2026, 0, 10, 3, 59), settings)).toBe('2026-01-09');
    expect(dayKey(Date.UTC(2026, 0, 10, 4, 0), settings)).toBe('2026-01-10');
    expect(nextDayReset(T0, settings)).toBe(Date.UTC(2026, 0, 11, 4));
  });

  it('deux charges par jour, rechargées le lendemain', () => {
    let s = activateEnergy(makeState(), T0, content);
    expect(s.energy).toEqual({ dayKey: '2026-01-10', used: 1, activeUntil: T0 + 30 * MIN });
    s = activateEnergy(s, T0 + HOUR, content);
    expect(energyChargesLeft(s.energy, T0 + 2 * HOUR, settings)).toBe(0);
    expect(() => activateEnergy(s, T0 + 2 * HOUR, content)).toThrow(GameError);
    expect(energyChargesLeft(s.energy, Date.UTC(2026, 0, 11, 9), settings)).toBe(2);
  });

  it('activé pendant un autre, il s’ajoute à la suite', () => {
    const s = activateEnergy(activateEnergy(makeState(), T0, content), T0 + 10 * MIN, content);
    expect(s.energy.activeUntil).toBe(T0 + 60 * MIN);
  });

  it('lit l’ancien format d’énergie quotidienne', () => {
    expect(readEnergy({ dayKey: '2026-01-10', usedMs: 3600 })).toEqual(none);
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

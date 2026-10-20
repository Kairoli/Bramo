import type { Settings } from '../schemas/content.js';

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

export type Presence = 'active' | 'offline' | 'capped';

export interface EnergyState {
  /** Jour de jeu (AAAA-MM-JJ) auquel se rapporte `usedMs`. */
  dayKey: string;
  usedMs: number;
}

/** Sources de bonus, en fraction (0,3 = +30 %). Bornées par `bonusCaps`. */
export interface Bonuses {
  tool: number;
  meal: number;
  clan: number;
  season: number;
}

export const NO_BONUS: Bonuses = { tool: 0, meal: 0, clan: 0, season: 0 };

/** Jour de jeu : il bascule à `resetHourUtc`, pas à minuit. */
export function dayKey(t: number, settings: Settings): string {
  return new Date(t - settings.energy.resetHourUtc * HOUR).toISOString().slice(0, 10);
}

export function nextDayReset(t: number, settings: Settings): number {
  const shift = settings.energy.resetHourUtc * HOUR;
  return Math.floor((t - shift) / DAY) * DAY + DAY + shift;
}

export function energyMaxMs(settings: Settings): number {
  return settings.energy.dailyHours * HOUR;
}

export function energyRemainingMs(energy: EnergyState, t: number, settings: Settings): number {
  const used = energy.dayKey === dayKey(t, settings) ? energy.usedMs : 0;
  return Math.max(0, energyMaxMs(settings) - used);
}

/** Somme des bonus, chacun borné par son plafond. */
export function bonusMultiplier(bonuses: Bonuses, caps: Settings['bonusCaps']): number {
  return (
    1 +
    Math.min(bonuses.tool, caps.tool) +
    Math.min(bonuses.meal, caps.meal) +
    Math.min(bonuses.clan, caps.clan) +
    Math.min(bonuses.season, caps.season)
  );
}

export interface PresenceWindow {
  presence: Presence;
  /** Énergie quotidienne active sur cette fenêtre. */
  energized: boolean;
  /** Multiplicateur de présence (actif, énergie, hors ligne, 0 au-delà du plafond). */
  multiplier: number;
  /** Fin de la fenêtre : le contexte ne change pas avant cet instant. */
  until: number;
}

/**
 * Contexte de rendement à l'instant t, déduit uniquement des horodatages :
 * - actif tant que t < lastSeenAt + délai de présence (×énergie tant qu'il en reste) ;
 * - hors ligne ensuite, pendant au plus `offlineCapHours` ;
 * - au-delà, plus rien n'avance, mais rien n'est perdu.
 */
export function presenceAt(t: number, lastSeenAt: number, energy: EnergyState, settings: Settings): PresenceWindow {
  const activeEnd = lastSeenAt + settings.presence.activeTimeoutSec * 1000;
  if (t < activeEnd) {
    const reset = nextDayReset(t, settings);
    const remaining = energyRemainingMs(energy, t, settings);
    if (remaining > 0) {
      return {
        presence: 'active',
        energized: true,
        multiplier: settings.energy.multiplier,
        until: Math.min(activeEnd, reset, t + remaining),
      };
    }
    return { presence: 'active', energized: false, multiplier: settings.rates.active, until: Math.min(activeEnd, reset) };
  }
  const offlineEnd = activeEnd + settings.rates.offlineCapHours * HOUR;
  if (t < offlineEnd) {
    return { presence: 'offline', energized: false, multiplier: settings.rates.offline, until: offlineEnd };
  }
  return { presence: 'capped', energized: false, multiplier: 0, until: Number.POSITIVE_INFINITY };
}

/** Enregistre `ms` d'énergie consommée à l'instant t (change de jour si besoin). */
export function consumeEnergy(energy: EnergyState, t: number, ms: number, settings: Settings): EnergyState {
  const key = dayKey(t, settings);
  const used = energy.dayKey === key ? energy.usedMs : 0;
  return { dayKey: key, usedMs: Math.min(energyMaxMs(settings), used + ms) };
}

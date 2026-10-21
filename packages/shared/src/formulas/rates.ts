import type { Settings } from '../schemas/content.js';

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const MIN = 60_000;

export type Presence = 'active' | 'offline' | 'capped';

/**
 * Coups de fouet : le joueur active quand il veut un bonus de vitesse de courte durée.
 * `settings.energy.charges` par jour de jeu, chacune dure `durationMin` en temps réel.
 */
export interface EnergyState {
  /** Jour de jeu (AAAA-MM-JJ) auquel se rapporte `used`. */
  dayKey: string;
  /** Charges utilisées ce jour-là. */
  used: number;
  /** Fin du coup de fouet en cours (ms epoch) ; 0 = aucun. */
  activeUntil: number;
}

export const NO_ENERGY: EnergyState = { dayKey: '', used: 0, activeUntil: 0 };

/** Lit un état d'énergie enregistré, y compris l'ancien format (énergie quotidienne en ms). */
export function readEnergy(raw: unknown): EnergyState {
  const e = raw as Partial<EnergyState> | null;
  if (!e || typeof e.used !== 'number') return { ...NO_ENERGY };
  return { dayKey: e.dayKey ?? '', used: e.used, activeUntil: e.activeUntil ?? 0 };
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

export function energyDurationMs(settings: Settings): number {
  return settings.energy.durationMin * MIN;
}

/** Charges encore disponibles aujourd'hui. */
export function energyChargesLeft(energy: EnergyState, t: number, settings: Settings): number {
  const used = energy.dayKey === dayKey(t, settings) ? energy.used : 0;
  return Math.max(0, settings.energy.charges - used);
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
  /** Un coup de fouet est actif sur cette fenêtre. */
  energized: boolean;
  /** Multiplicateur de présence (actif ou hors ligne, ×coup de fouet, 0 au-delà de l'autonomie). */
  multiplier: number;
  /** Fin de la fenêtre : le contexte ne change pas avant cet instant. */
  until: number;
}

/**
 * Contexte de rendement à l'instant t, déduit uniquement des horodatages :
 * - actif tant que t < lastSeenAt + délai de présence ;
 * - hors ligne ensuite, pendant au plus `offlineCapHours` (l'autonomie) ;
 * - au-delà, plus rien n'avance, mais rien n'est perdu.
 * Un coup de fouet multiplie le rendement jusqu'à `energy.activeUntil`, en ligne comme hors ligne.
 */
export function presenceAt(t: number, lastSeenAt: number, energy: EnergyState, settings: Settings): PresenceWindow {
  const activeEnd = lastSeenAt + settings.presence.activeTimeoutSec * 1000;
  const offlineEnd = activeEnd + settings.rates.offlineCapHours * HOUR;
  if (t >= offlineEnd) return { presence: 'capped', energized: false, multiplier: 0, until: Number.POSITIVE_INFINITY };
  const active = t < activeEnd;
  const base = active ? settings.rates.active : settings.rates.offline;
  let until = active ? activeEnd : offlineEnd;
  const energized = t < energy.activeUntil;
  if (energized) until = Math.min(until, energy.activeUntil);
  return {
    presence: active ? 'active' : 'offline',
    energized,
    multiplier: energized ? base * settings.energy.multiplier : base,
    until,
  };
}

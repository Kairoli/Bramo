import type { Content, Recipe } from '../schemas/content.js';
import { gainXp, levelForXp } from '../formulas/xp.js';
import {
  type Bonuses,
  type Presence,
  bonusMultiplier,
  consumeEnergy,
  presenceAt,
} from '../formulas/rates.js';
import { type CharacterState, addStack, addTo, cloneState } from './state.js';

export interface FinishedActivity {
  recipeId: string;
  done: number;
  reason: 'completed' | 'missing_inputs';
}

export interface AdvanceSummary {
  from: number;
  to: number;
  /** Temps réel écoulé, par état de présence. */
  time: Record<Presence, number>;
  /** Temps réel pendant lequel une activité a réellement tourné. */
  workedMs: number;
  energyUsedMs: number;
  xp: Record<string, number>;
  produced: Record<string, number>;
  consumed: Record<string, number>;
  levelUps: { skill: string; from: number; to: number }[];
  finished: FinishedActivity[];
  /** Recettes démarrées automatiquement depuis la file. */
  started: string[];
}

/** Bonus applicables à une recette selon l'état courant (outil possédé, repas actif). */
export function bonusesFor(recipe: Recipe, state: CharacterState, t: number, content: Content): Bonuses {
  let tool = 0;
  for (const [itemId, qty] of Object.entries(state.inventory)) {
    const item = content.items[itemId];
    if (qty > 0 && item?.tool?.profession === recipe.profession) tool = Math.max(tool, item.tool.bonus);
  }
  const meal = state.buff && t < state.buff.until ? state.buff.bonus : 0;
  // Clan et saison : prévus dans le calcul, inactifs en P1.
  return { tool, meal, clan: 0, season: 0 };
}

export function maxAffordable(recipe: Recipe, inventory: Record<string, number>): number {
  let max = Number.POSITIVE_INFINITY;
  for (const input of recipe.inputs) max = Math.min(max, Math.floor((inventory[input.item] ?? 0) / input.qty));
  return max;
}

/** Démarre la prochaine action de la file, s'il y en a une. */
export function startNextFromQueue(state: CharacterState, t: number): string | null {
  const next = state.queue.shift();
  state.activity = next ? { ...next, done: 0, progress: 0, startedAt: t } : null;
  return next?.recipeId ?? null;
}

/**
 * Fait avancer l'état du personnage jusqu'à `now`, uniquement à partir des horodatages.
 * Fonction pure : renvoie un nouvel état et le résumé de ce qui s'est passé.
 */
export function advance(
  input: CharacterState,
  now: number,
  content: Content,
): { state: CharacterState; summary: AdvanceSummary } {
  const state = cloneState(input);
  const { settings } = content;
  const summary: AdvanceSummary = {
    from: state.lastTickAt,
    to: now,
    time: { active: 0, offline: 0, capped: 0 },
    workedMs: 0,
    energyUsedMs: 0,
    xp: {},
    produced: {},
    consumed: {},
    levelUps: [],
    finished: [],
    started: [],
  };
  const levelsBefore: Record<string, number> = {};

  // Répartition du temps écoulé, indépendamment de l'activité (pour le résumé d'absence).
  for (let t = state.lastTickAt; t < now; ) {
    const win = presenceAt(t, state.lastSeenAt, state.energy, settings);
    const end = Math.min(now, win.until);
    summary.time[win.presence] += end - t;
    t = end;
  }

  let t = state.lastTickAt;
  while (t < now) {
    const win = presenceAt(t, state.lastSeenAt, state.energy, settings);
    let end = Math.min(now, win.until);
    if (state.buff && t < state.buff.until) end = Math.min(end, state.buff.until);

    const workStart = t;
    while (state.activity && t < end && win.multiplier > 0) {
      const activity = state.activity;
      const recipe = content.recipes[activity.recipeId];
      if (!recipe) {
        startNextFromQueue(state, t);
        continue;
      }
      const affordable = maxAffordable(recipe, state.inventory);
      const remaining = activity.quantity - activity.done;
      if (affordable <= 0 || remaining <= 0) {
        summary.finished.push({
          recipeId: recipe.id,
          done: activity.done,
          reason: remaining <= 0 ? 'completed' : 'missing_inputs',
        });
        const started = startNextFromQueue(state, t);
        if (started) summary.started.push(started);
        continue;
      }

      const rate = win.multiplier * bonusMultiplier(bonusesFor(recipe, state, t, content), settings.bonusCaps);
      const duration = recipe.durationSec * 1000;
      const reachable = activity.progress + (end - t) * rate;
      const n = Math.min(Math.floor(reachable / duration), remaining, affordable);
      if (n === 0) {
        activity.progress = reachable;
        t = end;
        break;
      }

      // Instant exact où la n-ième fabrication se termine.
      t += (n * duration - activity.progress) / rate;
      activity.progress = 0;
      activity.done += n;
      if (!(recipe.profession in levelsBefore)) {
        levelsBefore[recipe.profession] = levelForXp(state.skills[recipe.profession] ?? 0, content.xpTable);
      }
      const gained = gainXp(state.skills[recipe.profession] ?? 0, recipe.xp * n, settings.xp, content.xpTable);
      addTo(state.skills, recipe.profession, gained);
      addTo(summary.xp, recipe.profession, gained);
      for (const i of recipe.inputs) {
        addStack(state.inventory, i.item, -i.qty * n);
        addTo(summary.consumed, i.item, i.qty * n);
      }
      for (const o of recipe.outputs) {
        addStack(state.inventory, o.item, o.qty * n);
        addTo(summary.produced, o.item, o.qty * n);
      }
    }

    const worked = t - workStart;
    if (worked > 0) {
      summary.workedMs += worked;
      // L'énergie ne se consomme que pendant qu'une activité tourne.
      if (win.energized) {
        state.energy = consumeEnergy(state.energy, workStart, worked, settings);
        summary.energyUsedMs += worked;
      }
    }
    // Plus d'activité : le reste de l'intervalle s'écoule sans rien produire.
    if (!state.activity) break;
    t = end;
  }

  if (state.buff && state.buff.until <= now) state.buff = null;
  state.lastTickAt = now;

  for (const [skill, from] of Object.entries(levelsBefore)) {
    const to = levelForXp(state.skills[skill] ?? 0, content.xpTable);
    if (to > from) summary.levelUps.push({ skill, from, to });
  }
  return { state, summary };
}

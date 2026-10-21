import type { Content, Item, Recipe } from '../schemas/content.js';
import {
  type Bonuses,
  type Presence,
  bonusMultiplier,
  presenceAt,
} from '../formulas/rates.js';
import { type CharacterState, addStack, addTo, cloneState } from './state.js';
import { activeCopy, isDurable, wearCopy } from './gear.js';
import { skillLevel } from './trials.js';

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
  /** Temps réel de travail sous coup de fouet. */
  energyUsedMs: number;
  xp: Record<string, number>;
  produced: Record<string, number>;
  consumed: Record<string, number>;
  /** Usure ajoutée par objet, en ms de travail. */
  wear: Record<string, number>;
  /** Objets devenus usés pendant ce calcul. */
  worn: string[];
  /** Repas pris automatiquement dans le garde-manger. */
  autoMeals: string[];
  levelUps: { skill: string; from: number; to: number }[];
  finished: FinishedActivity[];
  /** Recettes démarrées automatiquement depuis la file. */
  started: string[];
}

/** Le meilleur outil du métier qui n'est pas usé (un outil usé ne donne rien mais n'est pas perdu). */
export function activeTool(
  profession: string,
  state: CharacterState,
  content: Content,
): { itemId: string; bonus: number; index: number; remaining: number } | null {
  let best: { itemId: string; bonus: number; index: number; remaining: number } | null = null;
  for (const [itemId, qty] of Object.entries(state.inventory)) {
    const item = content.items[itemId];
    if (qty <= 0 || item?.tool?.profession !== profession) continue;
    const copy = isDurable(item) ? activeCopy(state, itemId, content) : { index: 0, remaining: Number.POSITIVE_INFINITY };
    if (!copy) continue;
    if (!best || item.tool.bonus > best.bonus) best = { itemId, bonus: item.tool.bonus, ...copy };
  }
  return best;
}

/** Bonus applicables à une recette selon l'état courant (outil en état, repas actif). */
export function bonusesFor(recipe: Recipe, state: CharacterState, t: number, content: Content): Bonuses {
  const tool = activeTool(recipe.profession, state, content)?.bonus ?? 0;
  const meal = state.buff && t < state.buff.until ? state.buff.bonus : 0;
  // Saison : prévue dans le calcul, pas encore active.
  return { tool, meal, clan: state.clanBonus, season: 0 };
}

/** Une activité tourne et peut fabriquer : c'est le moment de manger (pas de repas gâché sur un personnage à l'arrêt). */
function canWork(state: CharacterState, content: Content): boolean {
  const recipe = state.activity && content.recipes[state.activity.recipeId];
  return !!recipe && maxAffordable(recipe, state.inventory) > 0 && state.activity!.done < state.activity!.quantity;
}

/** Retire du garde-manger le repas au meilleur bonus (le plus long en cas d'égalité). */
function takeFromPantry(state: CharacterState, content: Content): Item | null {
  let best: Item | null = null;
  for (const [itemId, qty] of Object.entries(state.pantry)) {
    const item = content.items[itemId];
    if (qty <= 0 || !item?.meal) continue;
    if (!best || item.meal.bonus > best.meal!.bonus || (item.meal.bonus === best.meal!.bonus && item.meal.durationMin > best.meal!.durationMin)) best = item;
  }
  if (best) addStack(state.pantry, best.id, -1);
  return best;
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
    wear: {},
    worn: [],
    autoMeals: [],
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
    if (state.buff && state.buff.until <= t) state.buff = null;
    if (!state.buff && win.multiplier > 0 && canWork(state, content)) {
      const meal = takeFromPantry(state, content);
      if (meal) {
        state.buff = { itemId: meal.id, bonus: meal.meal!.bonus, until: t + meal.meal!.durationMin * 60_000 };
        summary.autoMeals.push(meal.id);
      }
    }
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
      // L'outil utilisé s'use au temps réel de travail ; on s'arrête au moment où il est usé pour recalculer le rendement.
      const tool = activeTool(recipe.profession, state, content);
      const toolLeft = tool ? tool.remaining : Number.POSITIVE_INFINITY;
      const segEnd = Math.min(end, t + toolLeft);
      const segStart = t;
      const wearTool = () => {
        if (!tool || !Number.isFinite(toolLeft)) return;
        wearCopy(state, tool.itemId, tool.index, t - segStart, content);
        addTo(summary.wear, tool.itemId, t - segStart);
        if (tool.remaining - (t - segStart) <= 0) summary.worn.push(tool.itemId);
      };
      const reachable = activity.progress + (segEnd - t) * rate;
      const n = Math.min(Math.floor(reachable / duration), remaining, affordable);
      if (n === 0) {
        activity.progress = reachable;
        t = segEnd;
        wearTool();
        if (t >= end) break;
        continue;
      }

      // Instant exact où la n-ième fabrication se termine.
      t += (n * duration - activity.progress) / rate;
      activity.progress = 0;
      activity.done += n;
      wearTool();
      if (!(recipe.profession in levelsBefore)) {
        levelsBefore[recipe.profession] = skillLevel(state, recipe.profession, content);
      }
      addTo(state.skills, recipe.profession, recipe.xp * n);
      addTo(summary.xp, recipe.profession, recipe.xp * n);
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
      if (win.energized) summary.energyUsedMs += worked;
    }
    // Plus d'activité : le reste de l'intervalle s'écoule sans rien produire.
    if (!state.activity) break;
    t = end;
  }

  if (state.buff && state.buff.until <= now) state.buff = null;
  state.lastTickAt = now;

  for (const [skill, from] of Object.entries(levelsBefore)) {
    const to = skillLevel(state, skill, content);
    if (to > from) summary.levelUps.push({ skill, from, to });
  }
  return { state, summary };
}

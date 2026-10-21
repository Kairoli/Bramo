import {
  type CharacterState,
  type Content,
  type Recipe,
  advance,
  levelForXp,
  newCharacterState,
  startActivity,
} from '@bramo/shared';
import type { PresenceProfile } from './profiles.js';

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

/** Lundi 5 janvier 2026, minuit UTC : début de toutes les simulations. */
export const SIM_START = Date.UTC(2026, 0, 5);

/** Ce que fait le bot à chaque visite (et pendant ses sessions, toutes les `decisionEveryMin`). */
export interface Policy {
  name: string;
  onVisit(state: CharacterState, t: number, content: Content): CharacterState;
}

export interface BotOptions {
  days: number;
  /** Pendant une session, le bot revoit ses choix à cet intervalle (minutes). */
  decisionEveryMin?: number;
  /** Niveaux dont on relève la date d'obtention, pour ce métier. */
  track?: { skill: string; levels: number[] };
}

export interface BotResult {
  state: CharacterState;
  /** Jour (décimal, depuis la première visite) où chaque niveau suivi est atteint. */
  levelDay: Record<number, number>;
  /** Niveau du métier suivi à la fin de chaque jour. */
  levelByDay: number[];
  /** Heures effectives produites par jour : fabrications × durée de la recette (bonus compris). */
  effHoursByDay: number[];
  /** XP gagnée par jour, tous métiers confondus. */
  xpByDay: number[];
}

/**
 * Fait jouer un personnage pendant `days` jours avec le vrai moteur (`advance`).
 * Présence : pendant une session, le dernier signe de vie est tenu à jour ; ensuite le moteur
 * applique tout seul le hors-ligne et son plafond, exactement comme sur le serveur.
 */
export function runBot(content: Content, presence: PresenceProfile, policy: Policy, opts: BotOptions): BotResult {
  const decisionMs = (opts.decisionEveryMin ?? 15) * MIN;
  let state = newCharacterState(SIM_START, content);
  state.classId = Object.keys(content.classes)[0] ?? null;
  const result: BotResult = { state, levelDay: {}, levelByDay: [], effHoursByDay: [], xpByDay: [] };
  const track = opts.track;
  const firstVisit = SIM_START + Math.min(...presence.sessions.map((s) => s.at)) * HOUR;
  let effMs = 0;
  let xp = 0;

  const step = (to: number) => {
    const { state: next, summary } = advance(state, to, content);
    state = next;
    for (const [skill, gained] of Object.entries(summary.xp)) xp += gained;
    for (const [itemId, qty] of Object.entries(summary.produced)) {
      const recipe = producerOf(content, itemId, summary);
      if (recipe) effMs += (qty / outputQty(recipe, itemId)) * recipe.durationSec * 1000;
    }
    if (track) {
      const level = levelForXp(state.skills[track.skill] ?? 0, content.xpTable);
      for (const l of track.levels) {
        if (level >= l && result.levelDay[l] === undefined) result.levelDay[l] = (to - firstVisit) / DAY;
      }
    }
  };

  for (let d = 0; d < opts.days; d++) {
    const dayStart = SIM_START + d * DAY;
    const sessions = [...presence.sessions].sort((a, b) => a.at - b.at);
    for (const s of sessions) {
      const start = dayStart + s.at * HOUR;
      const end = start + s.minutes * MIN;
      // Hors session : on avance par heures pour relever les niveaux (le moteur donne le même résultat en une fois).
      for (let t = Math.max(state.lastTickAt, dayStart) + HOUR; t < start; t += HOUR) step(t);
      step(start);
      state.lastSeenAt = start;
      state = policy.onVisit(state, start, content);
      for (let t = start; t < end; ) {
        const next = Math.min(end, t + decisionMs);
        // Signe de vie à `next` : tout l'intervalle compte comme présent.
        state.lastSeenAt = next;
        step(next);
        t = next;
        if (t < end) state = policy.onVisit(state, t, content);
      }
    }
    const dayEnd = dayStart + DAY;
    for (let t = state.lastTickAt + HOUR; t < dayEnd; t += HOUR) step(t);
    step(dayEnd);
    result.effHoursByDay.push(effMs / HOUR);
    result.xpByDay.push(xp);
    effMs = 0;
    xp = 0;
    if (track) result.levelByDay.push(levelForXp(state.skills[track.skill] ?? 0, content.xpTable));
  }
  result.state = state;
  return result;
}

function outputQty(recipe: Recipe, itemId: string): number {
  return recipe.outputs.find((o) => o.item === itemId)?.qty ?? 1;
}

/** Recette qui a produit un objet pendant ce pas (le bot ne fait tourner qu'une recette par objet). */
function producerOf(content: Content, itemId: string, summary: { finished: { recipeId: string }[] }): Recipe | undefined {
  const candidates = Object.values(content.recipes).filter((r) => r.outputs.some((o) => o.item === itemId));
  if (candidates.length <= 1) return candidates[0];
  return candidates.find((r) => summary.finished.some((f) => f.recipeId === r.id)) ?? candidates[0];
}

// --- Politiques ---------------------------------------------------------------------------

export function level(state: CharacterState, skill: string, content: Content): number {
  return levelForXp(state.skills[skill] ?? 0, content.xpTable);
}

/** Recettes de récolte (sans ingrédient) débloquées, de la meilleure XP par seconde à la moins bonne. */
export function bestGatherRecipe(skill: string, state: CharacterState, content: Content): Recipe | undefined {
  const lvl = level(state, skill, content);
  return Object.values(content.recipes)
    .filter((r) => r.profession === skill && !r.trial && r.inputs.length === 0 && r.level <= lvl)
    .sort((a, b) => b.xp / b.durationSec - a.xp / a.durationSec)[0];
}

export interface GatherOptions {
  /** Outils obtenus (achetés) en atteignant un niveau : [niveau, objet]. */
  tools?: [number, string][];
  /** Repas consommés automatiquement selon le niveau, [niveau, bonus] : le bonus couvre tout le temps (garde-manger). */
  autoMeal?: [number, number][];
}

/**
 * Récolteur qui ne fait qu'un métier et prend toujours la recette qui rapporte le plus d'XP.
 * À chaque visite il remplit l'activité et la file au maximum.
 */
export function gatherer(skill: string, opts: GatherOptions = {}): Policy {
  return {
    name: `récolte ${skill}`,
    onVisit(input, t, content) {
      let state = input;
      const lvl = level(state, skill, content);
      for (const [need, item] of opts.tools ?? []) {
        if (lvl >= need && !state.inventory[item]) state = { ...state, inventory: { ...state.inventory, [item]: 1 } };
      }
      const meal = (opts.autoMeal ?? []).filter(([need]) => lvl >= need).at(-1);
      if (meal) state = { ...state, buff: { itemId: 'auto', bonus: meal[1], until: t + 7 * DAY } };
      const best = bestGatherRecipe(skill, state, content);
      if (!best) return state;
      const { maxQuantity, queueLength } = content.settings.activity;
      if (state.activity?.recipeId !== best.id) state = startActivity(state, best.id, maxQuantity, 'replace', t, content);
      state = { ...state, queue: state.queue.filter((q) => q.recipeId === best.id) };
      while (state.queue.length < queueLength) state = startActivity(state, best.id, maxQuantity, 'queue', t, content);
      return state;
    },
  };
}

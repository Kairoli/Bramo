import type { Content } from '../schemas/content.js';
import { levelForXp, nextTitle, titleForLevel } from '../formulas/xp.js';
import { bonusMultiplier, energyMaxMs, energyRemainingMs, presenceAt } from '../formulas/rates.js';
import type { Activity, CharacterState, MealBuff, QueuedAction } from './state.js';
import { bonusesFor } from './advance.js';

/** Ce que le client reçoit. Tous les nombres sont calculés par le serveur. */
export interface SkillView {
  xp: number;
  level: number;
  title: string;
  levelXp: number;
  nextLevelXp: number | null;
  nextTitle: { level: number; name: string } | null;
}

export interface RateView {
  presence: number;
  energized: boolean;
  tool: number;
  meal: number;
  clan: number;
  season: number;
  /** Rendement total appliqué au temps réel. */
  total: number;
}

export interface StateView {
  serverTime: number;
  gold: number;
  skills: Record<string, SkillView>;
  inventory: Record<string, number>;
  activity: (Activity & { rate: RateView; durationMs: number }) | null;
  queue: QueuedAction[];
  energy: { remainingMs: number; maxMs: number };
  buff: MealBuff | null;
}

export function viewSkill(xp: number, content: Content): SkillView {
  const { xpTable, settings } = content;
  const level = levelForXp(xp, xpTable);
  return {
    xp,
    level,
    title: titleForLevel(level, settings.titles),
    levelXp: xpTable[level]!,
    nextLevelXp: level < settings.xp.maxLevel ? xpTable[level + 1]! : null,
    nextTitle: nextTitle(level, settings.titles),
  };
}

export function viewState(state: CharacterState, now: number, content: Content): StateView {
  const { settings } = content;
  const skills: Record<string, SkillView> = {};
  for (const p of content.professions) skills[p.id] = viewSkill(state.skills[p.id] ?? 0, content);

  let activity: StateView['activity'] = null;
  const recipe = state.activity && content.recipes[state.activity.recipeId];
  if (state.activity && recipe) {
    // Le joueur qui regarde est présent : on affiche le rendement « actif ».
    const win = presenceAt(now, now, state.energy, settings);
    const b = bonusesFor(recipe, state, now, content);
    const caps = settings.bonusCaps;
    activity = {
      ...state.activity,
      durationMs: recipe.durationSec * 1000,
      rate: {
        presence: win.multiplier,
        energized: win.energized,
        tool: Math.min(b.tool, caps.tool),
        meal: Math.min(b.meal, caps.meal),
        clan: Math.min(b.clan, caps.clan),
        season: Math.min(b.season, caps.season),
        total: win.multiplier * bonusMultiplier(b, caps),
      },
    };
  }

  return {
    serverTime: now,
    gold: state.gold,
    skills,
    inventory: state.inventory,
    activity,
    queue: state.queue,
    energy: { remainingMs: energyRemainingMs(state.energy, now, settings), maxMs: energyMaxMs(settings) },
    buff: state.buff && state.buff.until > now ? state.buff : null,
  };
}

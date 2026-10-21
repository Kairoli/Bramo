import type { Content } from '../schemas/content.js';
import type { Appearance } from '../schemas/art.js';
import { levelForXp, nextTitle } from '../formulas/xp.js';
import { bonusMultiplier, energyChargesLeft, energyDurationMs, presenceAt } from '../formulas/rates.js';
import type { Activity, CharacterState, MealBuff, QueuedAction } from './state.js';
import { bonusesFor } from './advance.js';
import { type TrialStatus, earnedTitle, trialStatus, trialsOf } from './trials.js';

/** Ce que le client reçoit. Tous les nombres sont calculés par le serveur. */
export interface SkillView {
  xp: number;
  level: number;
  /** Titre acquis : un palier avec épreuve attend que l'épreuve soit réussie. */
  title: string;
  levelXp: number;
  nextLevelXp: number | null;
  /** Prochain titre. `trialId` : l'épreuve qui le donne ; si level ≥ niveau, le maître attend déjà. */
  nextTitle: { level: number; name: string; trialId: string | null } | null;
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
  /** Coups de fouet : charges restantes aujourd'hui, et fin de celui en cours (null = aucun). */
  energy: { chargesLeft: number; charges: number; activeUntil: number | null; durationMs: number; multiplier: number };
  buff: MealBuff | null;
  /** null tant que le joueur n'a pas choisi sa classe (écran de choix). */
  classId: string | null;
  /** Apparence à afficher : classe et tenue (tenue de départ de la classe par défaut). */
  appearance: Appearance | null;
  trials: Record<string, TrialStatus>;
}

export function viewSkill(profession: string, xp: number, done: readonly string[], content: Content): SkillView {
  const { xpTable, settings } = content;
  const level = levelForXp(xp, xpTable);
  const { name, pendingTrial } = earnedTitle(profession, level, done, content);
  const trialAt = (rank: number) => trialsOf(profession, content).find((t) => t.rank === rank)?.id ?? null;
  const upcoming = nextTitle(level, settings.titles);
  return {
    xp,
    level,
    title: name,
    levelXp: xpTable[level]!,
    nextLevelXp: level < settings.xp.maxLevel ? xpTable[level + 1]! : null,
    nextTitle: pendingTrial
      ? {
          level: pendingTrial.rank,
          name: settings.titles.find((t) => t.level === pendingTrial.rank)!.name,
          trialId: pendingTrial.id,
        }
      : upcoming && { ...upcoming, trialId: trialAt(upcoming.level) },
  };
}

export function viewAppearance(state: CharacterState, content: Content): Appearance | null {
  const cls = state.classId ? content.classes[state.classId] : undefined;
  if (!cls) return null;
  return { classId: cls.id, outfit: state.outfit ?? cls.startingOutfit };
}

export function viewState(state: CharacterState, now: number, content: Content): StateView {
  const { settings } = content;
  const skills: Record<string, SkillView> = {};
  for (const p of content.professions) skills[p.id] = viewSkill(p.id, state.skills[p.id] ?? 0, state.trials, content);
  const trials: Record<string, TrialStatus> = {};
  for (const t of Object.values(content.trials)) {
    trials[t.id] = trialStatus(t, skills[t.profession]?.level ?? 1, state.trials, content);
  }

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
    energy: {
      chargesLeft: energyChargesLeft(state.energy, now, settings),
      charges: settings.energy.charges,
      activeUntil: state.energy.activeUntil > now ? state.energy.activeUntil : null,
      durationMs: energyDurationMs(settings),
      multiplier: settings.energy.multiplier,
    },
    buff: state.buff && state.buff.until > now ? state.buff : null,
    classId: state.classId,
    appearance: viewAppearance(state, content),
    trials,
  };
}

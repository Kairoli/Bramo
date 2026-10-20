import type { Content, Trial } from '../schemas/content.js';
import { levelForXp } from '../formulas/xp.js';
import { type CharacterState, GameError, addStack, cloneState } from './state.js';

/** locked : niveau pas encore atteint ; open : le maître attend ; done : réussie. */
export type TrialStatus = 'locked' | 'open' | 'done';

/** Épreuves d'un métier, du premier palier au dernier. */
export function trialsOf(profession: string, content: Pick<Content, 'trials'>): Trial[] {
  return Object.values(content.trials)
    .filter((t) => t.profession === profession)
    .sort((a, b) => a.rank - b.rank);
}

/** Épreuve précédente du même métier pas encore réussie : on ne saute pas une épreuve. */
export function previousTrial(trial: Trial, done: readonly string[], content: Pick<Content, 'trials'>): Trial | null {
  return trialsOf(trial.profession, content).find((t) => t.rank < trial.rank && !done.includes(t.id)) ?? null;
}

export function trialStatus(trial: Trial, level: number, done: readonly string[], content: Pick<Content, 'trials'>): TrialStatus {
  if (done.includes(trial.id)) return 'done';
  return level >= trial.rank && !previousTrial(trial, done, content) ? 'open' : 'locked';
}

/**
 * Titre de métier : le plus haut palier atteint, mais un palier qui a une épreuve
 * n'est acquis qu'une fois l'épreuve réussie (et on ne saute pas une épreuve).
 */
export function earnedTitle(
  profession: string,
  level: number,
  done: readonly string[],
  content: Pick<Content, 'trials' | 'settings'>,
): { name: string; pendingTrial: Trial | null } {
  const trials = trialsOf(profession, content);
  let name = content.settings.titles[0]!.name;
  for (const t of content.settings.titles) {
    if (level < t.level) break;
    const trial = trials.find((x) => x.rank === t.level);
    if (trial && !done.includes(trial.id)) return { name, pendingTrial: trial };
    name = t.name;
  }
  return { name, pendingTrial: null };
}

/** Une recette de chef-d'œuvre n'existe que pendant son épreuve. */
export function recipeAvailable(recipeTrial: string | undefined, state: CharacterState, content: Content): boolean {
  if (!recipeTrial) return true;
  const trial = content.trials[recipeTrial];
  if (!trial) return false;
  const level = levelForXp(state.skills[trial.profession] ?? 0, content.xpTable);
  return trialStatus(trial, level, state.trials, content) === 'open';
}

/** Remettre au maître les objets de l'épreuve : ils sont consommés, le titre et l'or sont acquis. */
export function completeTrial(input: CharacterState, trialId: string, content: Content): CharacterState {
  const trial = content.trials[trialId];
  if (!trial) throw new GameError('unknown_trial', 'Épreuve inconnue.');
  const level = levelForXp(input.skills[trial.profession] ?? 0, content.xpTable);
  if (input.trials.includes(trial.id)) throw new GameError('trial_done', 'Épreuve déjà réussie.');
  const previous = previousTrial(trial, input.trials, content);
  if (previous) throw new GameError('trial_order', `Réussissez d’abord l’épreuve « ${previous.name} ».`);
  if (level < trial.rank) throw new GameError('level', `Niveau ${trial.rank} requis pour cette épreuve.`);
  const missing = trial.tasks.find((t) => (input.inventory[t.item] ?? 0) < t.qty);
  if (missing) {
    const name = content.items[missing.item]?.name ?? missing.item;
    throw new GameError('missing', `Il manque ${missing.qty - (input.inventory[missing.item] ?? 0)} × ${name}.`);
  }

  const state = cloneState(input);
  for (const t of trial.tasks) addStack(state.inventory, t.item, -t.qty);
  state.gold += trial.reward.gold;
  state.trials = [...state.trials, trial.id];
  return state;
}

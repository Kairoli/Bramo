import type { Content, Trial } from '../schemas/content.js';
import { levelForXp } from '../formulas/xp.js';
import { type CharacterState, GameError, addStack, cloneState } from './state.js';

/**
 * Rangs de métier (docs/design/rangs.md). Aux niveaux de `settings.ranks.levels`, le maître du métier propose une
 * commande spéciale. La réussir accorde le surnom du palier. Avec `settings.ranks.gatesLevel`, elle **débloque aussi la
 * tranche suivante** : tant qu'elle n'est pas faite, le niveau reste au palier, mais l'XP continue de s'accumuler
 * (rien n'est perdu) et se débloque à la validation. Sans, le niveau monte librement et seul le surnom attend.
 */

/** locked : palier pas encore atteint ; open : le maître attend ; done : réussie. */
export type TrialStatus = 'locked' | 'open' | 'done';

type TrialContent = Pick<Content, 'trials' | 'professions' | 'xpTable' | 'settings'>;

/** Commandes d'un métier, du premier palier au dernier. */
export function trialsOf(profession: string, content: Pick<Content, 'trials'>): Trial[] {
  return Object.values(content.trials)
    .filter((t) => t.profession === profession)
    .sort((a, b) => a.rank - b.rank);
}

/** Commande précédente du même métier pas encore réussie : on ne saute pas un palier. */
export function previousTrial(trial: Trial, done: readonly string[], content: Pick<Content, 'trials'>): Trial | null {
  return trialsOf(trial.profession, content).find((t) => t.rank < trial.rank && !done.includes(t.id)) ?? null;
}

/** Prochaine commande à réussir pour ce métier (celle qui borne le niveau), ou null si toutes sont faites. */
export function nextTrial(profession: string, done: readonly string[], content: Pick<Content, 'trials'>): Trial | null {
  return trialsOf(profession, content).find((t) => !done.includes(t.id)) ?? null;
}

/** Niveau réel (celui de l'XP) borné par le prochain palier non validé. */
export function effectiveLevel(xp: number, profession: string, done: readonly string[], content: TrialContent): number {
  const raw = levelForXp(xp, content.xpTable);
  if (!content.settings.ranks.gatesLevel) return raw;
  const cap = nextTrial(profession, done, content)?.rank;
  return cap === undefined ? raw : Math.min(raw, cap);
}

export function skillLevel(state: CharacterState, profession: string, content: TrialContent): number {
  return effectiveLevel(state.skills[profession] ?? 0, profession, state.trials, content);
}

/** XP gagnée au-delà du palier bloquant : gardée, créditée dès que la commande est validée. */
export function heldXp(xp: number, profession: string, done: readonly string[], content: TrialContent): number {
  if (!content.settings.ranks.gatesLevel) return 0;
  const cap = nextTrial(profession, done, content)?.rank;
  if (cap === undefined || levelForXp(xp, content.xpTable) <= cap) return 0;
  const limit = content.xpTable[cap + 1];
  return limit === undefined ? 0 : Math.max(0, xp - limit);
}

export function trialStatus(trial: Trial, level: number, done: readonly string[], content: Pick<Content, 'trials'>): TrialStatus {
  if (done.includes(trial.id)) return 'done';
  return level >= trial.rank && !previousTrial(trial, done, content) ? 'open' : 'locked';
}

/** Un surnom d'un métier : le surnom de départ (palier 0) et un par commande. */
export interface RankName {
  rank: number;
  nickname: string;
  trialId: string | null;
  unlocked: boolean;
}

export function ranksOf(profession: string, done: readonly string[], content: Pick<Content, 'trials' | 'professions'>): RankName[] {
  const start = content.professions.find((p) => p.id === profession)?.nickname ?? '';
  return [
    { rank: 0, nickname: start, trialId: null, unlocked: true },
    ...trialsOf(profession, content).map((t) => ({ rank: t.rank, nickname: t.nickname, trialId: t.id, unlocked: done.includes(t.id) })),
  ];
}

/** Surnom affiché : celui que le joueur a choisi s'il est débloqué, sinon le plus haut débloqué. */
export function shownNickname(
  profession: string,
  done: readonly string[],
  shown: Record<string, number>,
  content: Pick<Content, 'trials' | 'professions'>,
): RankName {
  const ranks = ranksOf(profession, done, content).filter((r) => r.unlocked);
  return ranks.find((r) => r.rank === shown[profession]) ?? ranks.at(-1)!;
}

/** Afficher n'importe lequel de ses surnoms débloqués, même après un rang supérieur. */
export function setNickname(input: CharacterState, profession: string, rank: number, content: Content): CharacterState {
  const found = ranksOf(profession, input.trials, content).find((r) => r.rank === rank);
  if (!found) throw new GameError('unknown_rank', 'Ce surnom n’existe pas.');
  if (!found.unlocked) throw new GameError('locked_rank', 'Ce surnom n’est pas encore débloqué.');
  const state = cloneState(input);
  state.shown = { ...state.shown, [profession]: rank };
  return state;
}

/**
 * Ornements que le joueur peut porter : celui de chaque commande réussie. Avec `settings.ornaments.unlockAll` (essais),
 * tous, variantes en réserve comprises.
 */
export function unlockedOrnaments(state: Pick<CharacterState, 'trials'>, content: Pick<Content, 'ornaments' | 'settings'>): string[] {
  return Object.values(content.ornaments)
    .filter((o) => content.settings.ornaments.unlockAll || (!!o.trial && state.trials.includes(o.trial)))
    .map((o) => o.id);
}

/** Ornement affiché : celui que le joueur porte, s'il est encore débloqué. */
export function wornOrnament(state: Pick<CharacterState, 'trials' | 'ornament'>, content: Pick<Content, 'ornaments' | 'settings'>): string | null {
  return state.ornament && unlockedOrnaments(state, content).includes(state.ornament) ? state.ornament : null;
}

/** Porter un ornement débloqué, de n'importe quel métier (null = aucun). */
export function chooseOrnament(input: CharacterState, ornamentId: string | null, content: Content): CharacterState {
  if (ornamentId !== null) {
    if (!content.ornaments[ornamentId]) throw new GameError('unknown_ornament', 'Ornement inconnu.');
    if (!unlockedOrnaments(input, content).includes(ornamentId)) {
      throw new GameError('locked_ornament', 'Cet ornement se débloque avec la commande du maître de son palier.');
    }
  }
  const state = cloneState(input);
  state.ornament = ornamentId;
  return state;
}

/** Une recette de chef-d'œuvre n'existe que pendant sa commande. */
export function recipeAvailable(recipeTrial: string | undefined, state: CharacterState, content: Content): boolean {
  if (!recipeTrial) return true;
  const trial = content.trials[recipeTrial];
  if (!trial) return false;
  return trialStatus(trial, skillLevel(state, trial.profession, content), state.trials, content) === 'open';
}

/** Remettre au maître les objets de la commande : ils sont consommés, le surnom et l'or sont acquis, le palier se débloque. */
export function completeTrial(input: CharacterState, trialId: string, content: Content): CharacterState {
  const trial = content.trials[trialId];
  if (!trial) throw new GameError('unknown_trial', 'Commande inconnue.');
  const level = skillLevel(input, trial.profession, content);
  if (input.trials.includes(trial.id)) throw new GameError('trial_done', 'Commande déjà réussie.');
  const previous = previousTrial(trial, input.trials, content);
  if (previous) throw new GameError('trial_order', `Réussissez d’abord la commande « ${previous.name} ».`);
  if (level < trial.rank) throw new GameError('level', `Niveau ${trial.rank} requis pour cette commande.`);
  const missing = trial.tasks.find((t) => (input.inventory[t.item] ?? 0) < t.qty);
  if (missing) {
    const name = content.items[missing.item]?.name ?? missing.item;
    throw new GameError('missing', `Il manque ${missing.qty - (input.inventory[missing.item] ?? 0)} × ${name}.`);
  }

  const state = cloneState(input);
  for (const t of trial.tasks) addStack(state.inventory, t.item, -t.qty);
  state.gold += trial.reward.gold;
  state.trials = [...state.trials, trial.id];
  // Le nouveau surnom s'affiche tout de suite ; le joueur peut en changer ensuite.
  state.shown = { ...state.shown, [trial.profession]: trial.rank };
  return state;
}

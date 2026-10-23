import type { Content } from '../schemas/content.js';
import { tideTitles } from '../combat/tide.js';
import { type CharacterState, GameError, cloneState } from './state.js';
import { ranksOf } from './trials.js';

/**
 * Le titre affiché sous son nom, choisi à part de l'ornement [demande de Louis, 24 octobre : « ornements et titres ; on
 * doit pouvoir changer son titre indépendamment de l'ornement »]. Tous les titres gagnés : les surnoms de métier
 * débloqués (celui de départ et ceux des commandes du maître) et les titres de la Marée (soirs joués, Marées offertes).
 * Sans choix (null), le titre est celui de l'ornement porté, ou le surnom de son meilleur métier.
 */
export interface TitleOption {
  text: string;
  /** D'où il vient : un métier (« Forge ») ou « Marée du soir ». */
  source: string;
}

export function unlockedTitles(state: CharacterState, content: Content): TitleOption[] {
  const out: TitleOption[] = [];
  const seen = new Set<string>();
  const add = (text: string, source: string) => {
    if (!text || seen.has(text)) return;
    seen.add(text);
    out.push({ text, source });
  };
  for (const p of content.professions) for (const r of ranksOf(p.id, state.trials, content)) if (r.unlocked) add(r.nickname, p.name);
  for (const t of tideTitles(state, content)) add(t, 'Marée du soir');
  return out;
}

/** Le titre choisi, s'il est toujours gagné (sinon null : le titre par défaut). */
export function chosenTitle(state: CharacterState, content: Content): string | null {
  const t = state.title ?? null;
  return t && unlockedTitles(state, content).some((o) => o.text === t) ? t : null;
}

export function chooseTitle(input: CharacterState, title: string | null, content: Content): CharacterState {
  if (title !== null && !unlockedTitles(input, content).some((o) => o.text === title)) throw new GameError('locked_title', 'Ce titre n’est pas encore gagné.');
  const state = cloneState(input);
  state.title = title;
  return state;
}

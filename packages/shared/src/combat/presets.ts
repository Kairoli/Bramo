/**
 * Préréglages de build : une classe, sa voie, son plan de sorts et l'équipement porté, enregistrés sous un nom pour passer
 * d'un build à l'autre en un clic (farm, mur, gardien…). Le serveur s'occupe des exemplaires d'équipement (table à part) ;
 * ici, la classe, la voie et le plan.
 */
import type { Content } from '../schemas/content.js';
import type { PlanEntry } from '../schemas/combat.js';
import { type CharacterState, GameError, cloneState } from '../engine/state.js';
import { chooseClass } from '../engine/actions.js';
import { activePath, choosePath, classLevel, currentPlan, setPlan } from './progress.js';
import { planErrors } from './content.js';

export interface Preset {
  id: number;
  name: string;
  classId: string;
  path: string | null;
  /** Plan enregistré ; null = le plan conseillé. */
  plan: PlanEntry[] | null;
  /** Exemplaires d'équipement portés (identifiants). */
  gear: number[];
}

export const MAX_PRESETS = 6;

const clean = (name: string | undefined, fallback: string) => (name ?? '').trim().slice(0, 24) || fallback;

/** Enregistre le build actuel : dans un préréglage existant (`id`), ou dans un nouveau. */
export function savePreset(input: CharacterState, opts: { id?: number; name?: string }, gear: number[], content: Content): CharacterState {
  const classId = input.classId;
  if (!classId) throw new GameError('no_class', 'Choisissez d’abord une classe.');
  const state = cloneState(input);
  const list = state.combat.presets;
  const old = opts.id !== undefined ? list.find((p) => p.id === opts.id) : undefined;
  if (opts.id !== undefined && !old) throw new GameError('unknown_preset', 'Préréglage introuvable.');
  if (!old && list.length >= MAX_PRESETS) throw new GameError('presets_full', `Au plus ${MAX_PRESETS} préréglages : remplacez-en un.`);
  const { plan, advised } = currentPlan(input, content);
  const preset: Preset = {
    id: old?.id ?? Math.max(0, ...list.map((p) => p.id)) + 1,
    name: clean(opts.name, old?.name ?? `Build ${list.length + 1}`),
    classId,
    path: activePath(input, classId, content),
    plan: advised ? null : plan,
    gear: [...gear],
  };
  state.combat.presets = old ? list.map((p) => (p.id === old.id ? preset : p)) : [...list, preset];
  state.combat.activePreset = preset.id;
  return state;
}

/** Un préréglage composé à la main, sans toucher au build porté (Louis, 22 octobre : « je dois pouvoir les créer manuellement »). */
export interface PresetDraft {
  id?: number;
  name: string;
  classId: string;
  path: string | null;
  /** null = le plan conseillé. */
  plan: PlanEntry[] | null;
  gear: number[];
}

/**
 * Crée ou modifie un préréglage à partir d'un brouillon : classe, voie et plan sont vérifiés au niveau qu'a la classe
 * (une voie pas encore ouverte est gardée pour plus tard, le plan se joue alors sans elle). L'équipement est filtré par
 * le serveur (exemplaires du personnage). Le build porté et le préréglage actif ne changent pas.
 */
export function writePreset(input: CharacterState, draft: PresetDraft, content: Content): CharacterState {
  const combat = content.combat;
  if (!combat?.kits[draft.classId]) throw new GameError('unknown_class', 'Classe inconnue.');
  if (draft.path && combat.paths[draft.path]?.class !== draft.classId) throw new GameError('unknown_path', 'Cette voie n’est pas celle de cette classe.');
  const state = cloneState(input);
  const list = state.combat.presets;
  const old = draft.id !== undefined ? list.find((p) => p.id === draft.id) : undefined;
  if (draft.id !== undefined && !old) throw new GameError('unknown_preset', 'Préréglage introuvable.');
  if (!old && list.length >= MAX_PRESETS) throw new GameError('presets_full', `Au plus ${MAX_PRESETS} préréglages : remplacez-en un.`);
  if (draft.plan) {
    const level = classLevel(input, draft.classId, content);
    const path = draft.path && level >= combat.pathLevel ? draft.path : null;
    const errors = planErrors(combat, draft.classId, path, level, draft.plan);
    if (errors.length) throw new GameError('invalid_plan', `Plan refusé : ${errors.join(' ; ')}.`);
  }
  const preset: Preset = {
    id: old?.id ?? Math.max(0, ...list.map((p) => p.id)) + 1,
    name: clean(draft.name, old?.name ?? `Build ${list.length + 1}`),
    classId: draft.classId,
    path: draft.path,
    plan: draft.plan ? draft.plan.map((e) => ({ spell: e.spell, at: e.at })) : null,
    gear: [...new Set(draft.gear)],
  };
  state.combat.presets = old ? list.map((p) => (p.id === old.id ? preset : p)) : [...list, preset];
  return state;
}

export function renamePreset(input: CharacterState, id: number, name: string): CharacterState {
  const state = cloneState(input);
  const p = state.combat.presets.find((x) => x.id === id);
  if (!p) throw new GameError('unknown_preset', 'Préréglage introuvable.');
  p.name = clean(name, p.name);
  return state;
}

export function deletePreset(input: CharacterState, id: number): CharacterState {
  const state = cloneState(input);
  if (!state.combat.presets.some((p) => p.id === id)) throw new GameError('unknown_preset', 'Préréglage introuvable.');
  state.combat.presets = state.combat.presets.filter((p) => p.id !== id);
  if (state.combat.activePreset === id) state.combat.activePreset = null;
  return state;
}

/**
 * Remet la classe, la voie et le plan d'un préréglage (l'équipement est remis par le serveur). Ce qui n'est plus
 * possible (voie pas encore ouverte, sort d'un niveau trop haut) est laissé tel quel plutôt que de bloquer.
 */
export function applyPreset(input: CharacterState, id: number, content: Content): CharacterState {
  const preset = input.combat.presets.find((p) => p.id === id);
  if (!preset) throw new GameError('unknown_preset', 'Préréglage introuvable.');
  let state = input.classId === preset.classId ? cloneState(input) : chooseClass(input, preset.classId, content);
  if (preset.path) {
    try {
      state = choosePath(state, preset.path, content);
    } catch {
      // Voie pas encore ouverte : on garde la base.
    }
  }
  try {
    state = setPlan(state, preset.plan, content);
  } catch {
    // Plan devenu invalide (données changées) : le plan conseillé.
  }
  state.combat.activePreset = id;
  return state;
}

import type { Pt, SpellFx } from './kit';
import { FORGEFIRE, FORGEFIRE_BASIC } from './forgefire';
import { RUNIST, RUNIST_BASIC } from './runist';
import { TRACKER, TRACKER_BASIC } from './tracker';

export * from './kit';
export { statusLayer, type StatusSource } from './status';

/** Effet propre de chaque sort (66) : geste du personnage et dessin. */
export const SPELL_FX: Record<string, SpellFx> = { ...FORGEFIRE, ...TRACKER, ...RUNIST };
/** Attaque de base de chaque classe. */
export const BASIC_FX: Record<string, SpellFx> = { forgefire: FORGEFIRE_BASIC, tracker: TRACKER_BASIC, runist: RUNIST_BASIC };

const HAMMER = { bone: 'hand_far', point: [178.3, 62.2] as Pt };
const ARROW = { bone: 'hand_far', point: [364.7, 207.5] as Pt };
const NEAR_HAND = { bone: 'forearm_near', point: [140, 370] as Pt };
const PALM = { bone: 'hand_far', point: [352, 220] as Pt };
const STAFF_BUTT = { bone: 'hand_near', point: [122, 696] as Pt };

/**
 * D'où part l'effet de chaque geste, dans le repère de repos de l'os : masse du marteau (dessinée dans la pose, ramenée dans
 * ce repère), pointe de la flèche encochée, main proche, paume du sort, pied du bâton.
 */
export const GESTURE_POINT: Record<string, { bone: string; point: Pt }> = {
  attack_forgefire: HAMMER,
  ff_sweep: HAMMER,
  ff_upper: HAMMER,
  ff_brace: HAMMER,
  ff_throw: HAMMER,
  ff_ultimate: HAMMER,
  ff_punch: NEAR_HAND,
  attack_tracker: ARROW,
  tr_aim: ARROW,
  tr_volley: ARROW,
  tr_dodge: ARROW,
  tr_ultimate: ARROW,
  tr_throw: NEAR_HAND,
  tr_whistle: NEAR_HAND,
  attack_runist: PALM,
  rn_slash: PALM,
  rn_seal: PALM,
  rn_channel: PALM,
  rn_ultimate: PALM,
  rn_staff: STAFF_BUTT,
};

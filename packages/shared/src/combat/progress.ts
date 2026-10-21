/**
 * Niveau de classe et activité de combat (étape 4 de docs/design/coeur-du-jeu/integration.md).
 *
 * - L'XP de classe ne vient que du combat [Décidé par Louis] ; chaque classe a son niveau, ses voies le partagent.
 * - Le combat est une activité comme une recette : une seule à la fois, 100 % en ligne comme hors ligne pendant
 *   l'autonomie, accélérée par les coups de fouet (le multiplicateur de présence s'applique au temps de combat).
 * - Chaque rencontre est résolue par `fight()` quand elle commence, avec le build figé à cet instant et une graine
 *   tirée du personnage et du numéro de la rencontre : avancer en une ou plusieurs fois donne le même résultat.
 * - Une défaite ne coûte rien ; après `maxConsecutiveLosses` défaites de suite, l'activité se met en pause.
 */
import type { Content } from '../schemas/content.js';
import type { CombatContent, PlanEntry, Spell } from '../schemas/combat.js';
import { levelForXp } from '../formulas/xp.js';
import { type CharacterState, GameError, cloneState } from '../engine/state.js';
import { planErrors, spellSlots } from './content.js';
import { type CombatantSetup, type FightResult, fight } from './engine.js';
import { hash32 } from './rng.js';

/** Rencontre en cours ou dernière rencontre jouée : le build figé et son issue (déjà calculée). */
export interface FightRecord {
  index: number;
  encounter: string;
  setup: CombatantSetup;
  win: boolean;
  /** Durée de la rencontre (ms de combat). */
  ms: number;
}

export interface CombatActivity {
  /** Rencontre affrontée en boucle ; null = Terrain d'entraînement (sans rencontre ni butin). */
  encounter: string | null;
  startedAt: number;
  /** Temps de combat effectif déjà passé dans la rencontre en cours, repos compris (ms). */
  progress: number;
  current: FightRecord | null;
  wins: number;
  losses: number;
  /** Défaites de suite. */
  streak: number;
}

export interface CombatState {
  /** XP par classe. */
  xp: Record<string, number>;
  /** Voie choisie par classe (à partir du niveau de voie). */
  paths: Record<string, string>;
  /** Plan enregistré par classe et voie (`classe/voie`, ou `classe/base` avant la voie). Absent = plan conseillé. */
  plans: Record<string, PlanEntry[]>;
  activity: CombatActivity | null;
  /** Numéro de la prochaine rencontre (graine). */
  nextIndex: number;
  /** Dernière rencontre terminée, pour le journal du combat. */
  last: FightRecord | null;
  /** Pourquoi la dernière activité s'est arrêtée toute seule. */
  stopped: 'losses' | 'training_cap' | null;
}

export const emptyCombat = (): CombatState => ({ xp: {}, paths: {}, plans: {}, activity: null, nextIndex: 0, last: null, stopped: null });

/** Complète un état de combat enregistré avant l'ajout d'un champ. */
export const readCombat = (raw: Partial<CombatState> | null | undefined): CombatState => ({ ...emptyCombat(), ...(raw ?? {}) });

export interface CombatSummary {
  fights: number;
  wins: number;
  losses: number;
  /** XP de classe gagnée, par classe. */
  xp: Record<string, number>;
  levelUps: { classId: string; from: number; to: number }[];
  stopped: CombatState['stopped'];
}

export const emptyCombatSummary = (): CombatSummary => ({ fights: 0, wins: 0, losses: 0, xp: {}, levelUps: [], stopped: null });

const need = (content: Content): CombatContent => {
  if (!content.combat) throw new GameError('no_combat', 'Le combat n’est pas encore disponible.');
  return content.combat;
};

export function classLevel(state: CharacterState, classId: string, content: Content): number {
  return levelForXp(state.combat.xp[classId] ?? 0, content.xpTable);
}

/** Voie active de la classe : celle choisie, si le niveau de voie est atteint. */
export function activePath(state: CharacterState, classId: string, content: Content): string | null {
  const combat = need(content);
  const path = state.combat.paths[classId];
  return path && classLevel(state, classId, content) >= combat.pathLevel ? path : null;
}

/** XP de classe par heure de combat crédité : R(L), avec le rattrapage d'une classe en retard. */
export function classXpPerHour(state: CharacterState, classId: string, content: Content): number {
  const p = need(content).rules.progression;
  const level = classLevel(state, classId, content);
  const best = Math.max(level, ...Object.keys(state.combat.xp).map((c) => classLevel(state, c, content)));
  const catchUp = level < best * p.catchUpBelow ? 1 + p.catchUpBonus : 1;
  return p.xpPerHour * 2 ** ((level - 1) / p.xpDoubling) * catchUp;
}

/** Sorts accessibles à une classe, à son niveau, avec sa voie (les sorts des autres voies sont exclus). */
export function availableSpells(combat: CombatContent, classId: string, pathId: string | null, level: number): Spell[] {
  return Object.values(combat.spells).filter((s) => s.class === classId && s.level <= level && (!s.path || s.path === pathId));
}

const score = (s: Spell) => (s.damage * s.targets ** 0.5 + (s.heal ?? 0) + (s.shield ?? 0) + (s.dot?.amount ?? 0)) / s.cooldown;

/**
 * Plan conseillé : le plan `<voie>_advised` (trouvé par la recherche du simulateur) du répertoire le plus proche,
 * réduit aux sorts accessibles, complété par les meilleurs sorts accessibles ; sans horaire, dans l'ordre des cooldowns.
 * Avant la voie, on part du plan conseillé de la voie de dégâts de la classe.
 */
export function advisedPlan(combat: CombatContent, classId: string, pathId: string | null, level: number): PlanEntry[] {
  const kit = combat.kits[classId];
  if (!kit) return [];
  const ref = combat.plans[`${pathId ?? kit.paths.find((p) => p.role === 'damage')!.id}_advised`];
  const keys = Object.keys(ref?.levels ?? {}).map(Number).sort((a, b) => a - b);
  const key = [...keys].reverse().find((k) => k <= level) ?? keys[0];
  const pool = availableSpells(combat, classId, pathId, level);
  const chosen: Spell[] = [];
  for (const e of key !== undefined ? ref!.levels[String(key)]! : []) {
    const s = pool.find((x) => x.id === e.spell);
    if (s) chosen.push(s);
  }
  const slots = spellSlots(combat, level);
  for (const s of [...pool].sort((a, b) => score(b) - score(a))) {
    if (chosen.length >= slots) break;
    if (chosen.includes(s) || (s.tags.includes('ultimate') && chosen.some((x) => x.tags.includes('ultimate')))) continue;
    chosen.push(s);
  }
  return chosen.sort((a, b) => a.cooldown - b.cooldown).map((s) => ({ spell: s.id, at: 0 }));
}

const planKey = (classId: string, pathId: string | null) => `${classId}/${pathId ?? 'base'}`;

/** Plan utilisé : le plan enregistré s'il est encore valable, sinon le plan conseillé. */
export function currentPlan(state: CharacterState, content: Content): { plan: PlanEntry[]; advised: boolean } {
  const combat = need(content);
  const classId = state.classId;
  if (!classId) return { plan: [], advised: true };
  const path = activePath(state, classId, content);
  const level = classLevel(state, classId, content);
  const saved = state.combat.plans[planKey(classId, path)];
  if (saved && planErrors(combat, classId, path, level, saved).length === 0) return { plan: saved, advised: false };
  return { plan: advisedPlan(combat, classId, path, level), advised: true };
}

/** Le combattant tel qu'il entre dans une rencontre (build figé). */
export function combatantOf(state: CharacterState, content: Content): CombatantSetup {
  const combat = need(content);
  const classId = state.classId;
  if (!classId || !combat.kits[classId]) throw new GameError('no_class', 'Choisissez d’abord une classe.');
  const kit = combat.kits[classId]!;
  const weapon = state.weaponFamily && kit.weapons.includes(state.weaponFamily) ? state.weaponFamily : kit.weapons[0]!;
  return { id: 'p1', classId, pathId: activePath(state, classId, content), plan: currentPlan(state, content).plan, weapon };
}

const fightSeed = (state: CharacterState, index: number) => hash32(`${state.seed}:fight:${index}`);

/** Rejoue une rencontre enregistrée (même build, même graine), avec son journal. */
export function replayFight(state: CharacterState, record: FightRecord, content: Content): FightResult {
  const combat = need(content);
  return fight(combat, [record.setup], combat.encounters[record.encounter]!, { seed: fightSeed(state, record.index), trace: true });
}

function startFight(state: CharacterState, a: CombatActivity, content: Content): FightRecord {
  const combat = need(content);
  const setup = combatantOf(state, content);
  const index = state.combat.nextIndex++;
  const r = fight(combat, [setup], combat.encounters[a.encounter!]!, { seed: fightSeed(state, index) });
  return { index, encounter: a.encounter!, setup, win: r.win, ms: Math.round(r.time * 1000) };
}

function gainXp(state: CharacterState, classId: string, xp: number, content: Content, summary: CombatSummary) {
  const from = classLevel(state, classId, content);
  state.combat.xp[classId] = (state.combat.xp[classId] ?? 0) + xp;
  summary.xp[classId] = (summary.xp[classId] ?? 0) + xp;
  const to = classLevel(state, classId, content);
  if (to > from) {
    const prev = summary.levelUps.find((l) => l.classId === classId);
    if (prev) prev.to = to;
    else summary.levelUps.push({ classId, from, to });
  }
}

/**
 * Fait tourner l'activité de combat de `t` à `end` (temps réel), au multiplicateur de présence `rate`.
 * Renvoie l'instant où elle s'arrête (`end`, ou plus tôt si elle se met en pause).
 */
export function runCombat(state: CharacterState, t: number, end: number, rate: number, content: Content, summary: CombatSummary): number {
  const a = state.combat.activity;
  if (!a || rate <= 0 || !state.classId) return end;
  const p = need(content).rules.progression;
  const classId = state.classId;
  if (a.encounter === null) {
    // Terrain d'entraînement : XP continue, réduite, jusqu'au niveau plafond.
    while (t < end) {
      const level = classLevel(state, classId, content);
      if (level >= p.training.maxLevel) {
        state.combat.activity = null;
        state.combat.stopped = summary.stopped = 'training_cap';
        return t;
      }
      const perMs = (classXpPerHour(state, classId, content) * p.training.xpShare) / 3_600_000;
      const toNext = content.xpTable[level + 1]! - (state.combat.xp[classId] ?? 0);
      const msToNext = toNext / perMs / rate;
      const step = Math.min(end - t, Math.max(1, msToNext));
      gainXp(state, classId, perMs * step * rate, content, summary);
      t += step;
    }
    return end;
  }
  while (t < end) {
    a.current ??= startFight(state, a, content);
    const fightTotal = a.current.ms + p.rest * 1000;
    const left = fightTotal - a.progress;
    const available = (end - t) * rate;
    if (available < left) {
      a.progress += available;
      return end;
    }
    t += left / rate;
    const f = a.current;
    summary.fights++;
    // L'XP va à la classe qui a combattu (le joueur a pu changer de classe pendant la rencontre).
    const fighter = f.setup.classId;
    const perMs = classXpPerHour(state, fighter, content) / 3_600_000;
    if (f.win) {
      a.wins++;
      a.streak = 0;
      summary.wins++;
      gainXp(state, fighter, perMs * f.ms, content, summary);
    } else {
      a.losses++;
      a.streak++;
      summary.losses++;
      gainXp(state, fighter, perMs * f.ms * p.lossXpShare, content, summary);
    }
    state.combat.last = f;
    a.current = null;
    a.progress = 0;
    if (a.streak >= p.maxConsecutiveLosses) {
      state.combat.activity = null;
      state.combat.stopped = summary.stopped = 'losses';
      return t;
    }
  }
  return end;
}

// --- Actions ---------------------------------------------------------------------------------------------------------

/** Lancer le combat (une rencontre en boucle, ou le Terrain d'entraînement). Arrête l'activité de métier en cours. */
export function startCombat(input: CharacterState, encounter: string | null, now: number, content: Content): CharacterState {
  const combat = need(content);
  if (!input.classId) throw new GameError('no_class', 'Choisissez d’abord une classe.');
  if (encounter !== null && !combat.encounters[encounter]) throw new GameError('unknown_encounter', 'Rencontre inconnue.');
  const p = combat.rules.progression;
  if (encounter === null && classLevel(input, input.classId, content) >= p.training.maxLevel) {
    throw new GameError('training_cap', `Le Terrain d’entraînement s’arrête au niveau ${p.training.maxLevel} : affrontez de vraies rencontres.`);
  }
  const state = cloneState(input);
  state.activity = null;
  state.combat.activity = { encounter, startedAt: now, progress: 0, current: null, wins: 0, losses: 0, streak: 0 };
  state.combat.stopped = null;
  return state;
}

export function stopCombat(input: CharacterState): CharacterState {
  if (!input.combat.activity) throw new GameError('no_combat_activity', 'Aucun combat en cours.');
  const state = cloneState(input);
  state.combat.activity = null;
  return state;
}

/** Choisir la voie de la classe actuelle : gratuit, à tout moment ; s'applique à la prochaine rencontre. */
export function choosePath(input: CharacterState, pathId: string, content: Content): CharacterState {
  const combat = need(content);
  const classId = input.classId;
  if (!classId) throw new GameError('no_class', 'Choisissez d’abord une classe.');
  if (combat.paths[pathId]?.class !== classId) throw new GameError('unknown_path', 'Cette voie n’est pas celle de votre classe.');
  if (classLevel(input, classId, content) < combat.pathLevel) throw new GameError('path_level', `Les voies s’ouvrent au niveau ${combat.pathLevel}.`);
  const state = cloneState(input);
  state.combat.paths[classId] = pathId;
  return state;
}

/** Enregistrer le plan de la classe et de la voie actuelles ; null revient au plan conseillé. */
export function setPlan(input: CharacterState, entries: PlanEntry[] | null, content: Content): CharacterState {
  const combat = need(content);
  const classId = input.classId;
  if (!classId) throw new GameError('no_class', 'Choisissez d’abord une classe.');
  const path = activePath(input, classId, content);
  const state = cloneState(input);
  if (entries === null) {
    delete state.combat.plans[planKey(classId, path)];
    return state;
  }
  const errors = planErrors(combat, classId, path, classLevel(input, classId, content), entries);
  if (errors.length) throw new GameError('invalid_plan', `Plan refusé : ${errors.join(' ; ')}.`);
  state.combat.plans[planKey(classId, path)] = entries.map((e) => ({ spell: e.spell, at: e.at }));
  return state;
}

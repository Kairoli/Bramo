import type { Content } from '../schemas/content.js';
import type { Appearance } from '../schemas/art.js';
import { levelForXp } from '../formulas/xp.js';
import { bonusMultiplier, energyChargesLeft, energyDurationMs, presenceAt } from '../formulas/rates.js';
import type { Activity, CharacterState, MealBuff, QueuedAction } from './state.js';
import { earlyXpMultiplier } from './state.js';
import { type TitleOption, chosenTitle, unlockedTitles } from './titles.js';
import { bonusesFor } from './advance.js';
import { copiesRemaining, durabilityMs, isDurable } from './gear.js';
import { lookOptions, recycleYield, repairCost, unlockedOutfits } from './actions.js';
import { repairProblem } from './commission.js';
import { npcDoneToday, npcOrdersOfDay } from './npc.js';
import { type CombatView, viewCombat } from '../combat/view.js';
import {
  type RankName,
  type TrialStatus,
  effectiveLevel,
  heldXp,
  nextTrial,
  ranksOf,
  shownNickname,
  skillLevel,
  trialStatus,
  unlockedOrnaments,
  wornOrnament,
} from './trials.js';

/** Ce que le client reçoit. Tous les nombres sont calculés par le serveur. */
export interface SkillView {
  xp: number;
  /** Niveau effectif : borné par le prochain palier dont la commande du maître n'est pas réussie. */
  level: number;
  levelXp: number;
  nextLevelXp: number | null;
  /** XP gagnée au-delà du palier bloquant : gardée, créditée à la validation de la commande. */
  heldXp: number;
  /** Le niveau est-il bloqué au palier par la commande du maître (settings.ranks.gatesLevel) ? */
  gated: boolean;
  /** Surnom affiché. */
  nickname: string;
  /** Tous les surnoms du métier (rang 0 = départ), débloqués ou non. */
  nicknames: RankName[];
  shownRank: number;
  /** Prochaine commande du maître : `reached` quand le niveau du palier est atteint (le maître attend). */
  next: { rank: number; trialId: string; name: string; nickname: string; reached: boolean } | null;
  /** XP du début de métier : multiplicateur en cours (1 une fois passé) et niveau où il s'arrête. */
  boost: { multiplier: number; untilLevel: number } | null;
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
  /** Objets à durabilité possédés : durabilité totale, temps restant de chaque exemplaire (le plus usé d'abord), prix de réparation du plus usé chez le PNJ. */
  durability: Record<string, { totalMs: number; copies: number[]; repairCost: number; repair: { materials: { item: string; qty: number }[]; problem: string | null } | null }>;
  /** Ce que rend le recyclage d'un exemplaire, pour les objets recyclables possédés. */
  recycle: Record<string, { item: string; qty: number }[]>;
  pantry: Record<string, number>;
  /** Commandes PNJ du jour, avec ce que le joueur a déjà remis. */
  npcOrders: { id: string; profession: string; level: number; client: string; text: string; items: { item: string; qty: number }[]; gold: number; done: boolean }[];
  /** null tant que le joueur n'a pas choisi sa classe (écran de choix). */
  classId: string | null;
  /** Le tour guidé de la première session a été vu (ou passé). */
  tourDone: boolean;
  /** Tenues que le personnage peut porter. */
  unlockedOutfits: string[];
  /** Pièces qu'on peut poser sur chaque emplacement (apparence pièce par pièce). */
  lookOptions: Record<string, string[]>;
  /** Apparence à afficher : classe et tenue (tenue de départ de la classe par défaut). */
  appearance: Appearance | null;
  /** Ornement de métier porté (null = aucun) et ceux que le personnage peut porter. */
  ornament: string | null;
  unlockedOrnaments: string[];
  /** Titre choisi (null = par défaut) et tous les titres gagnés. */
  title: string | null;
  titles: TitleOption[];
  trials: Record<string, TrialStatus>;
  /** Combat de la classe actuelle (null sans classe ou sans data/combat/). */
  combat: CombatView | null;
}

export function viewSkill(
  profession: string,
  xp: number,
  done: readonly string[],
  shown: Record<string, number>,
  content: Content,
): SkillView {
  const { xpTable, settings } = content;
  const level = effectiveLevel(xp, profession, done, content);
  const upcoming = nextTrial(profession, done, content);
  const current = shownNickname(profession, done, shown, content);
  return {
    xp,
    level,
    levelXp: xpTable[level]!,
    nextLevelXp: level < settings.xp.maxLevel ? xpTable[level + 1]! : null,
    heldXp: heldXp(xp, profession, done, content),
    gated: settings.ranks.gatesLevel && !!upcoming && level >= upcoming.rank,
    nickname: current.nickname,
    nicknames: ranksOf(profession, done, content),
    shownRank: current.rank,
    boost: earlyXpMultiplier(xp, content) > 1 ? { multiplier: earlyXpMultiplier(xp, content), untilLevel: settings.xp.earlyBoost!.untilLevel } : null,
    next: upcoming
      ? { rank: upcoming.rank, trialId: upcoming.id, name: upcoming.name, nickname: upcoming.nickname, reached: level >= upcoming.rank }
      : null,
  };
}

export function viewAppearance(state: CharacterState, content: Content): Appearance | null {
  const cls = state.classId ? content.classes[state.classId] : undefined;
  if (!cls) return null;
  // Une tenue qui n'est pas du style de la classe (anciens personnages) est remplacée par la tenue de départ.
  const chosen = state.outfit ? content.cosmetics.outfits.find((o) => o.id === state.outfit) : undefined;
  const compatible = !!chosen && chosen.classes.includes(cls.id);
  const outfit = compatible ? chosen.id : cls.startingOutfit;
  const look = compatible || !state.outfit ? state.look : {};
  return { classId: cls.id, outfit, ...(Object.keys(look).length ? { overrides: look as Appearance['overrides'] } : {}) };
}

export function viewState(state: CharacterState, now: number, content: Content): StateView {
  const { settings } = content;
  const skills: Record<string, SkillView> = {};
  for (const p of content.professions) skills[p.id] = viewSkill(p.id, state.skills[p.id] ?? 0, state.trials, state.shown, content);
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
    durability: Object.fromEntries(
      Object.keys(state.inventory)
        .filter((id) => isDurable(content.items[id]))
        .map((id) => [
          id,
          {
            totalMs: durabilityMs(content.items[id]),
            copies: copiesRemaining(state, id, content),
            repairCost: repairCost(id, state, content),
            repair: content.items[id]?.repair
              ? { materials: content.items[id]!.repair!.materials, problem: repairProblem(state, id, content) }
              : null,
          },
        ]),
    ),
    recycle: Object.fromEntries(
      Object.keys(state.inventory)
        .map((id) => [id, recycleYield(id, content)] as const)
        .filter(([, y]) => y.length > 0),
    ),
    pantry: state.pantry,
    npcOrders: npcOrdersOfDay(state, now, content).map((o) => ({ ...o, done: npcDoneToday(state, now, content).includes(o.id) })),
    classId: state.classId,
    unlockedOutfits: unlockedOutfits(state, content),
    lookOptions: lookOptions(state, content),
    appearance: viewAppearance(state, content),
    ornament: wornOrnament(state, content),
    title: chosenTitle(state, content),
    titles: unlockedTitles(state, content),
    tourDone: !!state.tourDone,
    unlockedOrnaments: unlockedOrnaments(state, content),
    trials,
    combat: viewCombat(state, content),
  };
}

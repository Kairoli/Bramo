/**
 * Niveau de classe et activité de combat (étape 4 de docs/design/coeur-du-jeu/integration.md).
 *
 * - L'XP de classe ne vient que du combat [Décidé par Louis] ; chaque classe a son niveau, ses voies le partagent.
 * - Le combat tourne à côté du métier (décision de Louis du 22 octobre : la route « tourne tout le temps », même quand
 *   on monte un métier) : 100 % en ligne comme hors ligne pendant l'autonomie, accélérée par les coups de fouet (le
 *   multiplicateur de présence s'applique au temps de combat). Sans patrouille ni entraînement, c'est la route.
 * - Chaque rencontre est résolue par `fight()` quand elle commence, avec le build figé à cet instant et une graine
 *   tirée du personnage et du numéro de la rencontre : avancer en une ou plusieurs fois donne le même résultat.
 * - Une défaite ne coûte rien ; après `maxConsecutiveLosses` défaites de suite, une patrouille s'arrête et la route
 *   reprend. Sur la route, une défaite fait rejouer l'étape ; trois de suite la font reculer d'une étape.
 */
import type { Content } from '../schemas/content.js';
import type { CombatContent, Encounter, PlanEntry, Spell } from '../schemas/combat.js';
import type { Rarity } from '../schemas/gear.js';
import { levelForXp } from '../formulas/xp.js';
import { type CharacterState, GameError, addStack, cloneState } from '../engine/state.js';
import { planErrors, spellSlots } from './content.js';
import { type CombatantSetup, type FightResult, fight } from './engine.js';
import { curveTier, tierFactorAt, wornLoadout } from './loadout.js';
import { hash32, stream } from './rng.js';
import type { Preset } from './presets.js';
import type { TideState } from './tide.js';

/** Rencontre en cours ou dernière rencontre jouée : le build figé et son issue (déjà calculée). */
export interface FightRecord {
  index: number;
  encounter: string;
  /** Palier joué (cercle choisi, ou palier de la rencontre) ; absent pour un profil d'essai. */
  tier?: number;
  setup: CombatantSetup;
  win: boolean;
  /** Durée de la rencontre (ms de combat). */
  ms: number;
}

export interface CombatActivity {
  /** Rencontre affrontée en boucle ; null = Terrain d'entraînement (sans rencontre ni butin). */
  encounter: string | null;
  /** Cercle choisi dans une région haute (palier 40 à 90) ; absent : le palier de la rencontre. */
  tier?: number;
  startedAt: number;
  /** Temps de combat effectif déjà passé dans la rencontre en cours, repos compris (ms). */
  progress: number;
  current: FightRecord | null;
  wins: number;
  losses: number;
  /** Défaites de suite. */
  streak: number;
  /** La route (PvE solo) : la rencontre suit l'étape atteinte, elle avance à chaque victoire et ne s'arrête jamais. */
  route?: boolean;
}

/** Une étape de la route : une zone ou un gardien, à un palier. */
export interface RouteStage {
  index: number;
  /** « 3-2 » : chapitre et rang dans le chapitre. */
  label: string;
  chapter: number;
  /** Le chapitre porte le nom de sa zone ; sa région donne le gardien de l'étape 10. */
  chapterName: string;
  region: string;
  encounter: string;
  tier: number;
  guardian: boolean;
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
  stopped: 'losses' | 'training_cap' | 'unavailable' | null;
  /** Garantie des objets nommés : unités de butin accumulées sans l'avoir eu, par objet nommé. */
  pity: Record<string, number>;
  /** Fraction de vestige pas encore donnée (les vestiges tombent entiers). */
  vestigeCarry: number;
  /** La route : étape jouée (rang dans `routeStages`) et nombre d'étapes franchies. */
  route: { stage: number; best: number };
  /** Préréglages de build (classe, voie, plan, équipement), et le dernier appliqué ou enregistré. */
  presets: Preset[];
  activePreset: number | null;
  /** La Marée du soir : préférences, soirs réglés, tenues achetées (absent avant la Marée : valeurs par défaut). */
  tide?: TideState;
}

export const emptyCombat = (): CombatState => ({
  xp: {},
  paths: {},
  plans: {},
  activity: null,
  nextIndex: 0,
  last: null,
  stopped: null,
  pity: {},
  vestigeCarry: 0,
  route: { stage: 0, best: 0 },
  presets: [],
  activePreset: null,
});

/** Étapes d'un chapitre de la route : neuf dans la zone, la dixième contre le gardien de sa région (le-monde.md §3.1). */
export const ROUTE_CHAPTER = 10;

const stagesCache = new WeakMap<CombatContent, RouteStage[]>();
/**
 * Les étapes de la route (le-monde.md §3.1 : « douze zones de dix étapes », un gardien à l'étape 10). Un chapitre = une
 * zone, dans l'ordre de leurs paliers ; ses neuf premières étapes s'y jouent, la dixième contre le gardien de la région.
 * Le palier monte d'une étape à l'autre, du premier palier de la courbe au dernier (1 à 90) : la difficulté croît en
 * douceur au lieu de sauter d'un palier de la courbe au suivant.
 */
export function routeStages(combat: CombatContent): RouteStage[] {
  const cached = stagesCache.get(combat);
  if (cached) return cached;
  const all = Object.values(combat.encounters).filter((e) => e.tier && e.region);
  const zones = all.filter((e) => e.kind === 'zone').sort((a, b) => a.tier! - b.tier!);
  const guardianOf = (region: string) => all.find((e) => e.kind === 'gardien' && e.region === region);
  const keys = Object.keys(combat.rules.gearStats?.tiers ?? {}).map(Number);
  const first = keys.length ? Math.min(...keys) : 1;
  const last = keys.length ? Math.max(...keys) : Math.max(1, ...zones.map((z) => z.tier!));
  const total = zones.length * ROUTE_CHAPTER;
  const tierAt = (i: number) => (total > 1 ? Math.round(first + (i * (last - first)) / (total - 1)) : first);
  const out: RouteStage[] = [];
  zones.forEach((z, ci) => {
    const boss = guardianOf(z.region!);
    for (let si = 0; si < ROUTE_CHAPTER; si++) {
      const e = si === ROUTE_CHAPTER - 1 && boss ? boss : z;
      const index = out.length;
      out.push({ index, label: `${ci + 1}-${si + 1}`, chapter: ci + 1, chapterName: z.name, region: z.region!, encounter: e.id, tier: tierAt(index), guardian: e.kind === 'gardien' });
    }
  });
  stagesCache.set(combat, out);
  return out;
}

/**
 * La route reprend d'elle-même dès qu'aucun combat ne tourne (elle « tourne tout le temps », décision de Louis du
 * 22 octobre) : après l'arrêt d'une patrouille, sa pause, la fin de l'entraînement, ou pour un personnage qui vient de
 * choisir sa classe. Renvoie true si elle a repris.
 */
export function resumeRoute(state: CharacterState, t: number, content: Content): boolean {
  const combat = content.combat;
  if (state.combat.activity || !state.classId || !combat?.kits[state.classId]) return false;
  const stages = routeStages(combat);
  if (!stages.length) return false;
  const s = stages[Math.min(state.combat.route.stage, stages.length - 1)]!;
  state.combat.activity = { encounter: s.encounter, tier: s.tier, route: true, startedAt: t, progress: 0, current: null, wins: 0, losses: 0, streak: 0 };
  return true;
}

/**
 * Le build change (classe, voie, plan) : la rencontre en cours repart avec lui. Sinon elle finit avec l'ancien build,
 * figé à son début, et l'écran montre le nouveau personnage sans ses sorts (retour de Louis du 22 octobre).
 */
export function restartFight(state: CharacterState): void {
  const a = state.combat.activity;
  if (!a?.current) return;
  a.current = null;
  a.progress = 0;
}

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
  /** Équipement tombé : modèles à créer dans le sac (le serveur tire leurs lignes). */
  loot: { model: string; encounter: string }[];
  /** Vestiges tombés (déjà dans l'inventaire), par objet. */
  vestiges: Record<string, number>;
}

export const emptyCombatSummary = (): CombatSummary => ({ fights: 0, wins: 0, losses: 0, xp: {}, levelUps: [], stopped: null, loot: [], vestiges: {} });

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
 * En groupe (`context: 'group'`), une voie qui a un plan de groupe (`<voie>_group`, les soins et protections des soutiens)
 * part de celui-ci : en solo, le plan le plus rapide ; en groupe, celui qui aide ses alliés.
 */
export type PlanContext = 'solo' | 'group';

const advisedCache = new WeakMap<CombatContent, Map<string, PlanEntry[]>>();

export function advisedPlan(combat: CombatContent, classId: string, pathId: string | null, level: number, context: PlanContext = 'solo'): PlanEntry[] {
  // Pur et appelé à chaque rencontre : gardé par classe, voie, niveau et contexte (copie rendue, l'appelant peut la modifier).
  let memo = advisedCache.get(combat);
  if (!memo) advisedCache.set(combat, (memo = new Map()));
  const key = `${classId}|${pathId}|${level}|${context}`;
  const hit = memo.get(key);
  if (hit) return hit.map((e) => ({ ...e }));
  const plan = computeAdvisedPlan(combat, classId, pathId, level, context);
  memo.set(key, plan);
  return plan.map((e) => ({ ...e }));
}

function computeAdvisedPlan(combat: CombatContent, classId: string, pathId: string | null, level: number, context: PlanContext): PlanEntry[] {
  const kit = combat.kits[classId];
  if (!kit) return [];
  const path = pathId ?? kit.paths.find((p) => p.role === 'damage')!.id;
  const ref = (context === 'group' ? combat.plans[`${path}_group`] : undefined) ?? combat.plans[`${path}_advised`];
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

/**
 * Palier de l'équipement de référence d'un niveau de classe : le plus haut palier de la courbe au plus égal au niveau.
 * Sert de plancher provisoire aux statistiques tant que le butin et la fabrication ne fournissent pas l'équipement.
 */
export function classTier(state: CharacterState, classId: string, content: Content): number {
  return curveTier(need(content).rules, classLevel(state, classId, content)) ?? 1;
}

/**
 * Statistiques, talents et outils que l'équipement porté donne au combat (`state.equipment`, renseigné par le serveur).
 * Plancher : l'équipement de référence (Rare, palier 20 : `referenceStats`) ramené au niveau de la classe, interpolé entre les paliers
 * de la courbe (chaque niveau compte, comme les étapes de la route). Sans conversion
 * (`rules.gearStats`) ou sans équipement connu, les statistiques de référence du moteur.
 */
export function equipmentSetup(state: CharacterState, content: Content): Pick<CombatantSetup, 'stats' | 'talents' | 'tools' | 'pools' | 'convert'> {
  const w = wornGear(state, content);
  if (!w) return {};
  return {
    stats: w.stats,
    ...(w.talents.length ? { talents: w.talents } : {}),
    ...(w.tools.length ? { tools: w.tools } : {}),
    ...(w.talents.length ? { pools: w.pools } : {}),
    ...(w.convert.length ? { convert: w.convert } : {}),
  };
}

/** L'équipement porté converti pour le combat (`floored` : le plancher du palier de la classe l'emporte), ou null. */
const wornCache = new WeakMap<object, { content: Content; memo: Map<string, ReturnType<typeof computeWornGear>> }>();

export function wornGear(state: CharacterState, content: Content) {
  const combat = need(content);
  if (!combat.rules.gearStats || !state.equipment || !state.classId) return null;
  // Une absence joue des centaines de rencontres avec le même équipement : le calcul est gardé par liste d'équipement
  // (jamais modifiée en place), classe et niveau.
  let entry = wornCache.get(state.equipment);
  if (!entry || entry.content !== content) wornCache.set(state.equipment, (entry = { content, memo: new Map() }));
  const memo = entry.memo;
  const key = `${state.classId}|${classLevel(state, state.classId, content)}`;
  let hit = memo.get(key);
  if (!hit) memo.set(key, (hit = computeWornGear(state, content)));
  return hit;
}

function computeWornGear(state: CharacterState, content: Content) {
  const combat = need(content);
  const rules = combat.rules;
  const f = tierFactorAt(rules, classLevel(state, state.classId!, content));
  const conv = rules.gearStats!;
  const level = classLevel(state, state.classId!, content);
  const ramp = conv.floorRampLevel ? Math.min(1, (level - 1) / (conv.floorRampLevel - 1)) : 1;
  const share = 1 - (1 - (conv.floorShare ?? 1)) * ramp;
  const floor = { ...rules.referenceStats, power: rules.referenceStats.power * f * share, maxHp: rules.referenceStats.maxHp * f * share };
  const pieces = state.equipment!.flatMap((p) => {
    const m = content.gearModels[p.model];
    if (!m) return [];
    return [{ tier: m.tier, weight: content.gearSlots[m.slot]?.weight ?? 1, stats: m.stats, lines: p.lines, ...(m.set ? { set: m.set } : {}), ...(m.talent ? { talent: m.talent } : {}), ...(p.gem ? { gem: p.gem } : {}) }];
  });
  return wornLoadout(rules, combat.talents, combat.tools, pieces, floor);
}

/** Le combattant tel qu'il entre dans une rencontre (build figé). */
export function combatantOf(state: CharacterState, content: Content): CombatantSetup {
  const combat = need(content);
  const classId = state.classId;
  if (!classId || !combat.kits[classId]) throw new GameError('no_class', 'Choisissez d’abord une classe.');
  const kit = combat.kits[classId]!;
  const weapon = state.weaponFamily && kit.weapons.includes(state.weaponFamily) ? state.weaponFamily : kit.weapons[0]!;
  return { id: 'p1', classId, pathId: activePath(state, classId, content), plan: currentPlan(state, content).plan, weapon, ...equipmentSetup(state, content) };
}

/**
 * Paliers jouables d'une rencontre : son palier ; dans une région haute (`circles`), chaque cercle de la courbe depuis son
 * palier, jusqu'au palier de la classe (au moins le premier).
 */
export function encounterTiers(e: Encounter, combat: CombatContent, classTierValue: number): number[] {
  if (!e.tier) return [];
  if (!e.circles) return [e.tier];
  const keys = Object.keys(combat.rules.gearStats?.tiers ?? {}).map(Number).sort((a, b) => a - b);
  const open = keys.filter((k) => k >= e.tier! && k <= Math.max(e.tier!, classTierValue));
  return open.length ? open : [e.tier];
}

/** Ennemis du palier joué : PV et dégâts suivent la courbe d'équipement (palier 20 = 1), entre ses paliers aussi. */
const fightOptions = (combat: CombatContent, tier: number | undefined) => {
  const s = tier ? tierFactorAt(combat.rules, tier) : 1;
  return { enemyDamageScale: s, enemyHpScale: s };
};

const fightSeed = (state: CharacterState, index: number) => hash32(`${state.seed}:fight:${index}`);

/** Rejoue une rencontre enregistrée (même build, même graine, même palier), avec son journal. */
export function replayFight(state: CharacterState, record: FightRecord, content: Content): FightResult {
  const combat = need(content);
  return fight(combat, [record.setup], combat.encounters[record.encounter]!, { seed: fightSeed(state, record.index), trace: true, ...fightOptions(combat, record.tier) });
}

/**
 * Résolution des rencontres de `runCombat` : le moteur, sauf dans le simulateur de serveur, qui la remplace par un cache
 * (des milliers de joueurs simulés rejouent les mêmes combats). Le jeu ne l’appelle jamais.
 */
let resolver: typeof fight = fight;
export function setFightResolver(fn: typeof fight | null): void {
  resolver = fn ?? fight;
}

function startFight(state: CharacterState, a: CombatActivity, content: Content): FightRecord {
  const combat = need(content);
  const setup = combatantOf(state, content);
  const index = state.combat.nextIndex++;
  // Un profil d'essai (sans palier) se joue au palier de la classe : il ne donne pas de butin.
  const tier = a.tier ?? combat.encounters[a.encounter!]!.tier ?? classTier(state, setup.classId, content);
  const r = resolver(combat, [setup], combat.encounters[a.encounter!]!, { seed: fightSeed(state, index), ...fightOptions(combat, tier) });
  return { index, encounter: a.encounter!, ...(tier ? { tier } : {}), setup, win: r.win, ms: Math.round(r.time * 1000) };
}

/**
 * Butin d'une victoire (rules.loot) : vestiges de la région, un objet classique du palier joué (de la classe qui a combattu),
 * une pièce d'ensemble de la région au palier 40 et plus, les objets nommés de la rencontre avec leur garantie. Tirages
 * déterministes (graine du personnage et numéro de la rencontre) : avancer en une ou plusieurs fois donne le même butin.
 */
/** Modèles d'équipement indexés pour le butin (le catalogue en compte des milliers ; une absence, des centaines de victoires). */
interface LootIndex {
  classic: Map<string, string[]>;
  sets: Map<string, string[]>;
  named: Map<string, { id: string; tier: number }[]>;
}
const lootIndexes = new WeakMap<object, LootIndex>();
function lootIndex(content: Content): LootIndex {
  const hit = lootIndexes.get(content.gearModels);
  if (hit) return hit;
  const idx: LootIndex = { classic: new Map(), sets: new Map(), named: new Map() };
  const push = <T>(m: Map<string, T[]>, k: string, v: T) => {
    const l = m.get(k);
    if (l) l.push(v);
    else m.set(k, [v]);
  };
  for (const m of Object.values(content.gearModels)) {
    if (m.talent) push(idx.named, m.talent, { id: m.id, tier: m.tier });
    for (const c of m.classes) {
      if (!m.set && !m.named && !m.starter) push(idx.classic, `${m.tier}|${m.rarity}|${c}`, m.id);
      if (m.set) push(idx.sets, `${m.set}|${m.tier}|${m.rarity}|${c}`, m.id);
    }
  }
  for (const l of idx.named.values()) l.sort((a, b) => b.tier - a.tier);
  lootIndexes.set(content.gearModels, idx);
  return idx;
}

function rollLoot(state: CharacterState, f: FightRecord, content: Content, summary: CombatSummary): void {
  const combat = need(content);
  const rules = combat.rules.loot;
  const e = combat.encounters[f.encounter];
  if (!rules || !e?.tier || !f.tier) return;
  const rand = stream(state.seed, `loot:${f.index}`);
  const units = f.ms / 1000 / rules.unitSeconds;
  const cls = f.setup.classId;
  // L'équipement n'existe qu'aux paliers de la courbe : une étape de la route au palier 37 donne celui du palier 30.
  const tier = curveTier(combat.rules, f.tier) ?? f.tier;
  // Vestiges : entiers, la fraction est gardée pour la victoire suivante.
  if (e.loot?.vestige) {
    const total = state.combat.vestigeCarry + rules.vestiges * units;
    const n = Math.floor(total);
    state.combat.vestigeCarry = total - n;
    if (n > 0) {
      addStack(state.inventory, e.loot.vestige, n);
      summary.vestiges[e.loot.vestige] = (summary.vestiges[e.loot.vestige] ?? 0) + n;
    }
  }
  const idx = lootIndex(content);
  const pick = <T>(xs: T[]) => xs[Math.floor(rand() * xs.length)];
  const drop = (model: string | undefined) => model && summary.loot.push({ model, encounter: e.id });
  // Objet classique : rareté tirée, puis un modèle de la classe à ce palier.
  if (rand() < rules.classic * units) {
    let x = rand();
    const rarity = (['common', 'rare', 'epic', 'legendary'] as Rarity[]).find((r) => (x -= rules.rarity[r]) < 0) ?? 'common';
    drop(pick(idx.classic.get(`${tier}|${rarity}|${cls}`) ?? []));
  }
  // Pièce d'ensemble de la région (paliers 40 et plus).
  const sets = e.loot?.sets ?? [];
  if (sets.length && rand() < rules.setPiece * units) {
    const rarity: Rarity = rand() < rules.setLegendary ? 'legendary' : 'epic';
    const set = pick(sets);
    drop(pick(idx.sets.get(`${set}|${tier}|${rarity}|${cls}`) ?? []));
  }
  // Objets nommés : chance par unité, garantis après `namedGuarantee` unités ; la plus haute version au plus égale au palier.
  for (const n of e.loot?.named ?? []) {
    const versions = (idx.named.get(n) ?? []).filter((m) => m.tier <= tier);
    if (!versions.length) continue;
    const pity = (state.combat.pity[n] ?? 0) + units;
    if (rand() < rules.named * units || pity >= rules.namedGuarantee) {
      drop(versions[0]!.id);
      state.combat.pity[n] = 0;
    } else state.combat.pity[n] = pity;
  }
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
  const classId = state.classId;
  // Données changées depuis le lancement (rencontre retirée, classe sans kit) : on s'arrête proprement plutôt que de bloquer le personnage.
  const combat = content.combat;
  if (!combat?.kits[classId] || (a.encounter !== null && !combat.encounters[a.encounter])) {
    state.combat.activity = null;
    state.combat.stopped = summary.stopped = 'unavailable';
    return t;
  }
  const p = combat.rules.progression;
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
      rollLoot(state, f, content, summary);
    } else {
      a.losses++;
      a.streak++;
      summary.losses++;
      gainXp(state, fighter, perMs * f.ms * p.lossXpShare, content, summary);
    }
    state.combat.last = f;
    a.current = null;
    a.progress = 0;
    // La route : une victoire ouvre l'étape suivante, une défaite fait rejouer la même, sans jamais s'arrêter. Après
    // `maxConsecutiveLosses` défaites de suite, elle recule d'une étape (décision de Louis du 22 octobre) : on y gagne
    // (XP entière, butin), puis la victoire suivante retente l'étape qui bloquait.
    if (a.route) {
      const stages = routeStages(combat);
      const r = state.combat.route;
      if (f.win) {
        r.best = Math.max(r.best, r.stage + 1);
        r.stage = Math.min(r.stage + 1, stages.length - 1);
      } else if (a.streak >= p.maxConsecutiveLosses && r.stage > 0) {
        r.stage--;
        a.streak = 0;
      }
      const next = stages[Math.min(r.stage, stages.length - 1)]!;
      a.encounter = next.encounter;
      a.tier = next.tier;
      continue;
    }
    if (a.streak >= p.maxConsecutiveLosses) {
      state.combat.activity = null;
      state.combat.stopped = summary.stopped = 'losses';
      return t;
    }
  }
  return end;
}

// --- Actions ---------------------------------------------------------------------------------------------------------

/**
 * Lancer une patrouille (une rencontre en boucle) ou le Terrain d'entraînement, à la place de la route ; le métier en
 * cours continue. `tier` : le cercle choisi dans une région haute (parmi `encounterTiers`).
 */
export function startCombat(input: CharacterState, encounter: string | null, now: number, content: Content, tier?: number): CharacterState {
  const combat = need(content);
  if (!input.classId) throw new GameError('no_class', 'Choisissez d’abord une classe.');
  const e = encounter !== null ? combat.encounters[encounter] : undefined;
  if (encounter !== null && !e) throw new GameError('unknown_encounter', 'Rencontre inconnue.');
  const p = combat.rules.progression;
  if (encounter === null && classLevel(input, input.classId, content) >= p.training.maxLevel) {
    throw new GameError('training_cap', `Le Terrain d’entraînement s’arrête au niveau ${p.training.maxLevel} : affrontez de vraies rencontres.`);
  }
  if (tier !== undefined && (!e || !encounterTiers(e, combat, classTier(input, input.classId, content)).includes(tier))) {
    throw new GameError('unknown_circle', 'Ce cercle n’est pas ouvert pour cette rencontre.');
  }
  const state = cloneState(input);
  state.combat.activity = { encounter, ...(tier !== undefined && tier !== e?.tier ? { tier } : {}), startedAt: now, progress: 0, current: null, wins: 0, losses: 0, streak: 0 };
  state.combat.stopped = null;
  return state;
}

/**
 * Prendre la route (PvE solo) : à l'étape atteinte, ou à une étape déjà franchie (`stage`). Elle tourne en boucle : une
 * victoire mène à l'étape suivante, une défaite fait rejouer la même. Le métier en cours continue.
 */
export function startRoute(input: CharacterState, now: number, content: Content, stage?: number): CharacterState {
  const combat = need(content);
  if (!input.classId) throw new GameError('no_class', 'Choisissez d’abord une classe.');
  const stages = routeStages(combat);
  if (!stages.length) throw new GameError('no_route', 'La route n’est pas encore ouverte.');
  const r = input.combat.route;
  const at = stage ?? Math.min(r.stage, stages.length - 1);
  if (at < 0 || at > Math.min(r.best, stages.length - 1)) throw new GameError('route_locked', 'Cette étape n’est pas encore ouverte : franchissez d’abord les précédentes.');
  const s = stages[at]!;
  const state = cloneState(input);
  state.combat.route = { ...r, stage: at };
  state.combat.activity = { encounter: s.encounter, tier: s.tier, route: true, startedAt: now, progress: 0, current: null, wins: 0, losses: 0, streak: 0 };
  state.combat.stopped = null;
  return state;
}

/** Quitter une patrouille ou l'entraînement : la route reprend. La route elle-même ne s'arrête pas. */
export function stopCombat(input: CharacterState, now: number, content: Content): CharacterState {
  const a = input.combat.activity;
  if (!a || a.route) throw new GameError('no_combat_activity', 'Aucune patrouille en cours : la route, elle, tourne toujours.');
  const state = cloneState(input);
  state.combat.activity = null;
  resumeRoute(state, now, content);
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
  restartFight(state);
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
    restartFight(state);
    return state;
  }
  const errors = planErrors(combat, classId, path, classLevel(input, classId, content), entries);
  if (errors.length) throw new GameError('invalid_plan', `Plan refusé : ${errors.join(' ; ')}.`);
  state.combat.plans[planKey(classId, path)] = entries.map((e) => ({ spell: e.spell, at: e.at }));
  restartFight(state);
  return state;
}

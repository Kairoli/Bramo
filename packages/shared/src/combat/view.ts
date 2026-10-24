/** Ce que le client reçoit du combat : tous les nombres viennent du serveur. */
import type { Content } from '../schemas/content.js';
import type { Element, Encounter, PlanEntry, Role, Spell } from '../schemas/combat.js';
import type { CharacterState } from '../engine/state.js';
import { spellSlots } from './content.js';
import type { CombatStats, Contributions } from './engine.js';
import type { CombatContent } from '../schemas/combat.js';
import { MAX_PRESETS } from './presets.js';
import { type MechanicView, type PoolLinks, buildPoolLinks, encounterMechanics, gamePoolLinks } from './guide.js';
import { activePrep, readSupplies } from './supplies.js';
import { activePath, advisedPlan, availableSpells, classLevel, classTier, classXpPerHour, currentPlan, encounterTiers, replayFight, routeStage, routeStages, wornGear } from './progress.js';

export interface SpellView {
  id: string;
  name: string;
  level: number;
  path: string | null;
  cooldown: number;
  element: Element | 'inherit';
  tags: Spell['tags'];
  form: Spell['form'] | null;
  /** Une phrase lisible : dégâts, ressource de classe, effets. */
  text: string;
  /** Accessible maintenant (niveau et voie). */
  available: boolean;
  /** Ce que le sort fait, pour le montrer à l'écran (durées en secondes). */
  effects: SpellEffects;
}

export interface SpellEffects {
  targets: number;
  ultimate: boolean;
  shield?: number;
  heal?: boolean;
  dot?: { type: 'burn' | 'bleed'; duration: number };
  slow?: number;
  stun?: number;
  mark?: number;
  weaken?: number;
  antiheal?: number;
  dispel?: boolean;
  cleanse?: boolean;
  pressure?: boolean;
}

/** Durées des effets d'un sort (mêmes défauts que le moteur). */
export function spellEffects(s: Spell): SpellEffects {
  const d = s.duration;
  return {
    targets: s.targets,
    ultimate: s.tags.includes('ultimate'),
    ...(s.shield ? { shield: d ?? 6 } : {}),
    ...(s.heal ? { heal: true } : {}),
    ...(s.dot ? { dot: { type: s.dot.type, duration: s.dot.duration } } : {}),
    ...(s.slow ? { slow: d ?? 4 } : {}),
    ...(s.stun ? { stun: s.stun } : {}),
    ...(s.mark ? { mark: s.mark } : {}),
    ...(s.weaken ? { weaken: d ?? 6 } : {}),
    ...(s.antiheal ? { antiheal: d ?? 6 } : {}),
    ...(s.dispel ? { dispel: true } : {}),
    ...(s.cleanse ? { cleanse: true } : {}),
    ...(s.pressure ? { pressure: true } : {}),
  };
}

export interface CombatView {
  classId: string;
  level: number;
  xp: number;
  levelXp: number;
  nextLevelXp: number | null;
  /** XP de classe par heure de combat (rattrapage compris). */
  xpPerHour: number;
  mechanic: { label: string; state: string };
  pathLevel: number;
  /** Voie active (null avant le niveau de voie ou sans choix). */
  path: string | null;
  paths: { id: string; name: string; role: Role; passive: string; about: string | null }[];
  slots: number;
  maxFirstUse: number;
  plan: PlanEntry[];
  /** Le plan affiché est le plan conseillé (rien d'enregistré pour cette classe et cette voie). */
  advised: boolean;
  advisedPlan: PlanEntry[];
  /** Plan conseillé pour jouer en groupe (différent du solo pour les soutiens). */
  advisedGroupPlan: PlanEntry[];
  spells: SpellView[];
  encounters: EncounterView[];
  /** Palier de la classe (courbe d'équipement) : il ouvre les cercles et fixe le plancher des statistiques. */
  classTier: number;
  /** Statistiques au combat : celles de l'équipement porté, jamais sous le plancher du palier de la classe. */
  stats: { power: number; maxHp: number; damageReduction: number; haste: number; critChance: number; critMultiplier: number };
  /** Le plancher l'emporte sur l'équipement porté (équipement trop faible ou trop bas). */
  floored: boolean;
  /** Réponses de situation actives (gemmes serties, ensembles de situation) : leur nom. */
  situation: string[];
  /** Fournitures de combat : potions et préparations emportées, celle en cours, et ce que le sac pourrait y mettre. */
  supplies: {
    potions: { item: string; name: string; qty: number; heal: number }[];
    preps: { item: string; name: string; qty: number; tool: string; minutes: number }[];
    active: { item: string; name: string; tool: string; minutesLeft: number } | null;
    inBag: { item: string; name: string; qty: number; kind: 'potion' | 'prep'; text: string }[];
    potionsPerFight: number;
  };
  training: { xpShare: number; maxLevel: number };
  activity: {
    encounter: string | null;
    name: string;
    /** Palier joué (cercle choisi dans une région haute), null pour un profil d'essai ou l'entraînement. */
    tier: number | null;
    /** La route (PvE solo) : l'étape en cours (« 2-3 »). */
    route: boolean;
    stageLabel: string | null;
    enemies: number;
    guardian: boolean;
    wins: number;
    losses: number;
    streak: number;
    /** Temps passé dans la rencontre en cours et sa durée totale, repos compris (ms de combat). */
    progressMs: number;
    fightMs: number | null;
    startedAt: number;
    /** Déroulé de la rencontre en cours (rejouée : mêmes graine et build), pour la montrer à l'écran ; null à l'entraînement. */
    timeline: TimelineEvent[] | null;
    /** Durée du combat lui-même (s), sans le repos ; la victoire ou la défaite tombe à cet instant. */
    fightTime: number | null;
    win: boolean | null;
    /** Les huit réserves, toujours toutes (vides si le build ne les remplit pas), avec leur plafond pour ce build. */
    pools: PoolView[];
    /** Les mécaniques de la rencontre en cours, expliquées, et de quoi les suivre en direct. */
    mechanics: MechanicView[];
  } | null;
  stopped: 'losses' | 'training_cap' | 'unavailable' | null;
  lastFight: { encounter: string; name: string; win: boolean; time: number; lines: { t: number; text: string }[]; contributions: Contributions } | null;
  /** Niveau de chaque classe du personnage. */
  classLevels: Record<string, number>;
  /** La route (PvE solo) : étape atteinte, étapes franchies, et toutes les étapes par chapitre. */
  route: RouteView | null;
  /** Préréglages de build, et le dernier appliqué ou enregistré. */
  presets: PresetView[];
  activePreset: number | null;
  maxPresets: number;
  /** Toutes les classes, pour composer un préréglage à la main. */
  kits: KitView[];
}

export interface PresetView {
  id: number;
  name: string;
  classId: string;
  path: string | null;
  pathName: string | null;
  /** Sorts du plan (le plan conseillé si aucun). */
  spells: { id: string; element: string; ultimate: boolean }[];
  gear: number;
  /** Pour l'éditeur : le plan enregistré (null = conseillé) et les exemplaires d'équipement. */
  plan: PlanEntry[] | null;
  gearIds: number[];
}

/** Ce qu'il faut pour composer un préréglage de n'importe quelle classe : son niveau, ses places, ses voies, ses sorts. */
export interface KitView {
  classId: string;
  level: number;
  slots: number;
  paths: { id: string; name: string; role: Role }[];
  spells: { id: string; name: string; level: number; path: string | null; element: string; ultimate: boolean; cooldown: number; text: string }[];
}

export interface RouteStageView {
  index: number;
  label: string;
  /** Rencontre jouée (détails dans `CombatView.encounters`). */
  encounter: string;
  name: string;
  tier: number;
  guardian: boolean;
  /** Pour l'écran : nombre d'ennemis de la rencontre. */
  enemies: number;
}

export interface RouteView {
  /** Étape jouée (ou à jouer), étapes franchies, et si la route tourne en ce moment. */
  stage: number;
  best: number;
  running: boolean;
  /** Un chapitre = une zone (son nom), dans une région ; dix étapes, la dernière contre le gardien. */
  chapters: { number: number; name: string; region: string; stages: RouteStageView[] }[];
}

/**
 * Un instant du combat montré à l'écran : attaque de base, sort (`spell`), coup ennemi, ennemi vaincu, Rupture.
 * `hp` : PV ennemis restants après l'action, en part du total.
 */
export interface TimelineEvent {
  t: number;
  kind: 'basic' | 'cast' | 'attack' | 'charge' | 'kill' | 'break';
  spell?: string;
  hp?: number;
  crit?: boolean;
  /** Dégâts directs de l'action, ou du coup reçu. */
  dmg?: number;
  /** PV du personnage après l'instant, en part de son maximum. */
  self?: number;
  /** Ses réserves après l'instant (les non vides). */
  pools?: Record<string, number>;
  /** Charges d'érosion sur lui, garde levée chez l'ennemi, après l'instant. */
  erosion?: number;
  guard?: boolean;
}

/** Une réserve du build (Tisons, Ferveur…) : sa jauge en combat et son explication [Louis, 24 octobre : « le cœur du combat »]. */
export interface PoolView {
  id: string;
  name: string;
  /** Plafond pour ce build (le catalogue, plus ce que donnent l'équipement et les talents). */
  max: number;
  text: string | null;
  /** Dans le build de la rencontre en cours : ce qui la remplit, la dépense, s'en sert sans la vider. */
  build: PoolLinks;
  /** Dans le jeu (objets nommés, ensembles) : pour monter un build autour d'elle. */
  game: PoolLinks;
}

const SHOWN = new Set(['basic', 'cast', 'attack', 'charge', 'kill', 'break']);

/** Une rencontre telle que le joueur la choisit : où, quel palier, ce qui s'y passe, ce qui y tombe. */
export interface EncounterView {
  id: string;
  name: string;
  kind: 'profil' | 'zone' | 'gardien';
  region: string | null;
  tier: number | null;
  /** Paliers jouables maintenant (cercles ouverts d'une région haute, sinon le palier de la rencontre). */
  tiers: number[];
  /** Région haute : d'autres cercles s'ouvriront avec le palier de la classe. */
  circles: boolean;
  blurb: string | null;
  /** Ses mécaniques, expliquées, avec leurs réponses (gemme, préparation, ensembles). */
  mechanics: MechanicView[];
  enemies: number;
  /** Mécaniques lisibles : ce qu'il faut savoir pour préparer son plan. */
  text: string;
  loot: { vestige: string | null; named: { name: string; nickname: string | null; classId: string | null }[]; sets: string[] } | null;
}

const ELEMENT: Record<Element, string> = { physical: 'Physique', fire: 'Feu', frost: 'Givre', lightning: 'Foudre' };

/** Ce qu'il faut savoir d'une rencontre, en une ligne. */
function mechanics(e: Encounter): string {
  return [
    e.enemies > 1 ? `${e.enemies} ennemis` : 'un adversaire',
    e.adds?.length ? `renforts (${e.adds.map((a) => `${a.count > 1 ? `${a.count} ` : ''}${a.name}`).join(', ')})` : '',
    e.charge ? `attaque chargée toutes les ${e.charge.period} s` : '',
    e.guard ? `${e.guard.empower ? 'garde menaçante' : 'garde'} toutes les ${e.guard.period} s` : '',
    e.regen ? `se soigne toutes les ${e.regen.period} s` : '',
    e.aura ? 'aura qui use' : '',
    e.erosion ? 'érosion qui s’accumule (une purification la retire)' : '',
    e.windows ? `vulnérable ${e.windows.open} s toutes les ${e.windows.period} s` : '',
    e.enrage ? `fureur après ${e.enrage.after} s` : '',
  ].filter(Boolean).join(', ');
}
const fr = (n: number) => String(Math.round(n * 100) / 100).replace('.', ',');

/** Phrase d'un sort, à partir de ses données (pas de texte recopié à la main). */
export function describeSpell(s: Spell): string {
  const parts: string[] = [];
  const el = s.element === 'inherit' ? 'élément du sort précédent' : ELEMENT[s.element];
  if (s.damage) parts.push(`${fr(s.damage)} P de dégâts (${el})${s.targets > 1 ? `, ${s.targets} cibles` : ''}`);
  if (s.tags.includes('heat')) parts.push(`+${s.heat ?? 1} Braise`);
  if (s.tags.includes('temper')) parts.push('Trempe : dépense les Braises');
  if (s.tags.includes('setup')) parts.push('Repérage : ouvre un Angle');
  if (s.tags.includes('exploit')) parts.push('Poursuite : exploite l’Angle');
  if (s.tags.includes('companion')) parts.push('compagnon');
  if (s.form) parts.push(`écrit ${{ trait: 'Trait', circle: 'Cercle', seal: 'Sceau' }[s.form]}`);
  if (s.dot) parts.push(`${s.dot.type === 'burn' ? 'Brûlure' : 'Saignement'} ${fr(s.dot.amount)} P / ${s.dot.duration} s`);
  if (s.heal) parts.push(`soin ${fr(s.heal)} P`);
  if (s.shield) parts.push(`protection ${fr(s.shield)} P / ${s.duration ?? 6} s`);
  if (s.slow) parts.push(`ralentit ${Math.round(s.slow * 100)} % / ${s.duration ?? 4} s`);
  if (s.stun) parts.push(`étourdit ${fr(s.stun)} s`);
  if (s.pressure) parts.push(`Pression ${s.pressure}`);
  if (s.mark) parts.push(`Marque ${s.mark} s`);
  if (s.weaken) parts.push(`Affaiblit ${Math.round(s.weaken * 100)} %`);
  if (s.antiheal) parts.push(`soins ennemis −${Math.round(s.antiheal * 100)} %`);
  if (s.dispel) parts.push('dissipe une garde');
  if (s.cleanse) parts.push('purifie');
  if (s.penetration) parts.push(`ignore ${Math.round(s.penetration * 100)} % de Défense`);
  return parts.join(' ; ');
}

export function viewCombat(state: CharacterState, content: Content): CombatView | null {
  const combat = content.combat;
  const classId = state.classId;
  const kit = classId ? combat?.kits[classId] : undefined;
  if (!combat || !classId || !kit) return null;
  const level = classLevel(state, classId, content);
  const path = activePath(state, classId, content);
  const xp = state.combat.xp[classId] ?? 0;
  const { plan, advised } = currentPlan(state, content);
  const available = new Set(availableSpells(combat, classId, path, level).map((s) => s.id));
  const a = state.combat.activity;
  const tier = classTier(state, classId, content);
  const worn = wornGear(state, content);
  const pick = (s: CombatStats) => ({ power: s.power, maxHp: s.maxHp, damageReduction: s.damageReduction, haste: s.haste, critChance: s.critChance, critMultiplier: s.critMultiplier });
  const encounterName = (id: string | null) => (id === null ? 'Terrain d’entraînement' : (combat.encounters[id]?.name ?? id));
  const last = state.combat.last;
  let lastFight: CombatView['lastFight'] = null;
  // Rejouer le dernier combat peut échouer si les données ont changé depuis (sort retiré) : on n'affiche alors pas son journal.
  let r: ReturnType<typeof replayFight> | null = null;
  try {
    r = last && combat.encounters[last.encounter] ? replayFight(state, last, content) : null;
  } catch {
    r = null;
  }
  // La rencontre en cours, rejouée pour l'écran (le serveur l'a déjà jouée : même résultat).
  let now: ReturnType<typeof replayFight> | null = null;
  try {
    now = a?.current && combat.encounters[a.current.encounter] ? replayFight(state, a.current, content) : null;
  } catch {
    now = null;
  }
  const timeline: TimelineEvent[] | null = now
    ? (now.trace ?? [])
        .filter((x) => SHOWN.has(x.kind) && (x.who === 'p1' || x.who === 'ennemi'))
        .map((x) => ({
          t: x.t,
          kind: x.kind as TimelineEvent['kind'],
          ...(x.ref ? { spell: x.ref } : {}),
          ...(x.hp !== undefined ? { hp: Math.round(x.hp * 1000) / 1000 } : {}),
          ...(x.dmg !== undefined ? { dmg: x.dmg } : {}),
          ...(x.self !== undefined ? { self: Math.round(x.self * 1000) / 1000 } : {}),
          ...(x.text.includes('critique') ? { crit: true } : {}),
          ...(x.pools ? { pools: x.pools } : {}),
          ...(x.erosion ? { erosion: x.erosion } : {}),
          ...(x.guard ? { guard: true } : {}),
        }))
    : null;
  if (last && r) {
    lastFight = {
      encounter: last.encounter,
      name: encounterName(last.encounter),
      win: r.win,
      time: r.time,
      // Le journal lisible : sorts, Ruptures, attaques chargées, ennemis vaincus (pas chaque coup reçu).
      lines: (r.trace ?? []).filter((x) => x.kind !== 'attack' && x.kind !== 'guard' && x.kind !== 'basic').slice(0, 60).map((x) => ({ t: x.t, text: x.text })),
      contributions: r.team[0]!.contributions,
    };
  }
  return {
    classId,
    level,
    xp,
    levelXp: content.xpTable[level]!,
    nextLevelXp: content.xpTable[level + 1] ?? null,
    xpPerHour: classXpPerHour(state, classId, content),
    mechanic: { label: kit.label, state: kit.state },
    pathLevel: combat.pathLevel,
    path,
    paths: kit.paths.map((p) => ({ id: p.id, name: p.name, role: p.role, passive: p.passive, about: p.about ?? null })),
    slots: spellSlots(combat, level),
    maxFirstUse: combat.rules.maxFirstUse,
    plan,
    advised,
    advisedPlan: advisedPlan(combat, classId, path, level),
    advisedGroupPlan: advisedPlan(combat, classId, path, level, 'group'),
    spells: Object.values(combat.spells)
      .filter((s) => s.class === classId && (!s.path || s.path === path || !path))
      .sort((x, y) => x.level - y.level)
      .map((s) => ({ id: s.id, name: s.name, level: s.level, path: s.path ?? null, cooldown: s.cooldown, element: s.element, tags: s.tags, form: s.form ?? null, text: describeSpell(s), available: available.has(s.id), effects: spellEffects(s) })),
    // Les rencontres de la Marée du soir ne se jouent qu’à 20 h : elles ne sont pas des patrouilles.
    encounters: Object.values(combat.encounters).filter((e) => e.kind !== 'maree').map((e) => ({
      id: e.id,
      name: e.name,
      kind: (e.kind ?? 'profil') as EncounterView['kind'],
      region: e.region ?? null,
      tier: e.tier ?? null,
      tiers: encounterTiers(e, combat, tier),
      circles: !!e.circles,
      blurb: e.blurb ?? null,
      enemies: e.enemies,
      text: mechanics(e),
      mechanics: encounterMechanics(combat, e),
      loot: e.loot
        ? {
            vestige: e.loot.vestige ? (content.items[e.loot.vestige]?.name ?? e.loot.vestige) : null,
            named: (e.loot.named ?? []).map((n) => {
              const t = combat.talents?.named.find((x) => x.id === n);
              return { name: t?.name ?? n, nickname: t?.nickname ?? null, classId: t?.class ?? null };
            }),
            sets: (e.loot.sets ?? []).map((s) => content.gearSets[s]?.name ?? s),
          }
        : null,
    })),
    classTier: tier,
    stats: pick(worn?.stats ?? combat.rules.referenceStats),
    floored: !!worn?.floored,
    situation: [...(worn?.tools ?? []).map((t) => t.name), ...(() => {
      const prep = activePrep(state, content);
      const tool = prep && combat.tools.find((t) => t.id === prep);
      return tool ? [`${tool.name} (préparation)`] : [];
    })()],
    supplies: (() => {
      const s = readSupplies(state.combat.supplies);
      const toolName = (id: string) => combat.tools.find((t) => t.id === id)?.name ?? id;
      const active = s.active && s.active.leftMs > 0 ? s.active : null;
      return {
        potions: Object.entries(s.potions).map(([item, qty]) => ({ item, name: content.items[item]?.name ?? item, qty, heal: content.items[item]?.potion?.heal ?? 0 })),
        preps: Object.entries(s.preps).map(([item, qty]) => ({ item, name: content.items[item]?.name ?? item, qty, tool: toolName(content.items[item]?.prep?.tool ?? ''), minutes: content.items[item]?.prep?.minutes ?? 0 })),
        active: active ? { item: active.item, name: content.items[active.item]?.name ?? active.item, tool: toolName(content.items[active.item]?.prep?.tool ?? ''), minutesLeft: Math.ceil(active.leftMs / 60_000) } : null,
        inBag: Object.entries(state.inventory)
          .filter(([id, n]) => n > 0 && (content.items[id]?.potion || content.items[id]?.prep))
          .map(([item, qty]) => {
            const it = content.items[item]!;
            return it.potion
              ? { item, name: it.name, qty, kind: 'potion' as const, text: `rend ${Math.round(it.potion.heal * 100)} % des PV sous ${Math.round(it.potion.below * 100)} %` }
              : { item, name: it.name, qty, kind: 'prep' as const, text: `${toolName(it.prep!.tool)} pendant ${it.prep!.minutes} min de combat` };
          }),
        potionsPerFight: combat.rules.supplies?.potionsPerFight ?? 0,
      };
    })(),
    training: { xpShare: combat.rules.progression.training.xpShare, maxLevel: combat.rules.progression.training.maxLevel },
    activity: a
      ? {
          encounter: a.encounter,
          name: encounterName(a.encounter),
          tier: a.tier ?? (a.encounter !== null ? (combat.encounters[a.encounter]?.tier ?? null) : null),
          route: !!a.route,
          stageLabel: a.route ? routeStage(combat, state.combat.route.stage).label : null,
          enemies: a.encounter !== null ? (combat.encounters[a.encounter]?.enemies ?? 1) : 1,
          guardian: a.encounter !== null && combat.encounters[a.encounter]?.kind === 'gardien',
          wins: a.wins,
          losses: a.losses,
          streak: a.streak,
          progressMs: a.progress,
          fightMs: a.current ? a.current.ms + combat.rules.progression.rest * 1000 : null,
          startedAt: a.startedAt,
          timeline,
          fightTime: now ? now.time : null,
          win: now ? now.win : null,
          pools: (combat.talents?.pools ?? []).map((p) => ({
            id: p.id,
            name: p.name,
            max: a.current?.setup.pools?.[p.id] ?? p.max,
            text: p.text ?? null,
            build: buildPoolLinks(combat, a.current?.setup.talents ?? [], p.id),
            game: gamePoolLinks(combat, p.id),
          })),
          mechanics: a.encounter !== null && combat.encounters[a.encounter] ? encounterMechanics(combat, combat.encounters[a.encounter]!) : [],
        }
      : null,
    stopped: state.combat.stopped,
    lastFight,
    classLevels: Object.fromEntries(Object.keys(combat.kits).map((c) => [c, classLevel(state, c, content)])),
    route: routeView(state, combat),
    presets: state.combat.presets.map((p) => {
      const plan = p.plan ?? advisedPlan(combat, p.classId, p.path, classLevel(state, p.classId, content));
      return {
        id: p.id,
        name: p.name,
        classId: p.classId,
        path: p.path,
        pathName: p.path ? (combat.paths[p.path]?.name ?? null) : null,
        spells: plan.flatMap((e) => {
          const s = combat.spells[e.spell];
          return s ? [{ id: s.id, element: s.element, ultimate: s.tags.includes('ultimate') }] : [];
        }),
        gear: p.gear.length,
        plan: p.plan,
        gearIds: p.gear,
      };
    }),
    activePreset: state.combat.activePreset,
    maxPresets: MAX_PRESETS,
    kits: Object.values(combat.kits).map((k) => {
      const lv = classLevel(state, k.id, content);
      return {
        classId: k.id,
        level: lv,
        slots: spellSlots(combat, lv),
        paths: k.paths.map((p) => ({ id: p.id, name: p.name, role: p.role })),
        spells: Object.values(combat.spells)
          .filter((s) => s.class === k.id)
          .sort((x, y) => x.level - y.level)
          .map((s) => ({ id: s.id, name: s.name, level: s.level, path: s.path ?? null, element: s.element, ultimate: s.tags.includes('ultimate'), cooldown: s.cooldown, text: describeSpell(s) })),
      };
    }),
  };
}

function routeView(state: CharacterState, combat: CombatContent): RouteView | null {
  const base = routeStages(combat);
  if (!base.length) return null;
  // La route boucle sans fin : le premier cycle, puis les chapitres déjà ouverts des cycles suivants (jusqu'à celui de
  // l'étape atteinte ou jouée).
  const r0 = state.combat.route;
  const lastChapter = Math.max(base.at(-1)!.chapter, routeStage(combat, Math.max(r0.best, r0.stage)).chapter);
  const stages = Array.from({ length: lastChapter * 10 }, (_, i) => routeStage(combat, i));
  const chapters: RouteView['chapters'] = [];
  for (const s of stages) {
    const e = combat.encounters[s.encounter]!;
    let ch = chapters[s.chapter - 1];
    if (!ch) chapters.push((ch = { number: s.chapter, name: s.chapterName, region: s.region, stages: [] }));
    ch.stages.push({ index: s.index, label: s.label, encounter: s.encounter, name: e.name, tier: s.tier, guardian: s.guardian, enemies: e.enemies });
  }
  const r = state.combat.route;
  return { stage: r.stage, best: r.best, running: !!state.combat.activity?.route, chapters };
}

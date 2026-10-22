/** Ce que le client reçoit du combat : tous les nombres viennent du serveur. */
import type { Content } from '../schemas/content.js';
import type { Element, Encounter, PlanEntry, Role, Spell } from '../schemas/combat.js';
import type { CharacterState } from '../engine/state.js';
import { spellSlots } from './content.js';
import type { CombatStats, Contributions } from './engine.js';
import { activePath, advisedPlan, availableSpells, classLevel, classTier, classXpPerHour, currentPlan, encounterTiers, replayFight, wornGear } from './progress.js';

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
  paths: { id: string; name: string; role: Role; passive: string }[];
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
  training: { xpShare: number; maxLevel: number };
  activity: {
    encounter: string | null;
    name: string;
    /** Palier joué (cercle choisi dans une région haute), null pour un profil d'essai ou l'entraînement. */
    tier: number | null;
    wins: number;
    losses: number;
    streak: number;
    /** Temps passé dans la rencontre en cours et sa durée totale, repos compris (ms de combat). */
    progressMs: number;
    fightMs: number | null;
    startedAt: number;
  } | null;
  stopped: 'losses' | 'training_cap' | 'unavailable' | null;
  lastFight: { encounter: string; name: string; win: boolean; time: number; lines: { t: number; text: string }[]; contributions: Contributions } | null;
  /** Niveau de chaque classe du personnage. */
  classLevels: Record<string, number>;
}

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
  if (last && r) {
    lastFight = {
      encounter: last.encounter,
      name: encounterName(last.encounter),
      win: r.win,
      time: r.time,
      // Le journal lisible : sorts, Ruptures, attaques chargées, ennemis vaincus (pas chaque coup reçu).
      lines: (r.trace ?? []).filter((x) => x.kind !== 'attack' && x.kind !== 'guard').slice(0, 60).map((x) => ({ t: x.t, text: x.text })),
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
    paths: kit.paths.map((p) => ({ id: p.id, name: p.name, role: p.role, passive: p.passive })),
    slots: spellSlots(combat, level),
    maxFirstUse: combat.rules.maxFirstUse,
    plan,
    advised,
    advisedPlan: advisedPlan(combat, classId, path, level),
    advisedGroupPlan: advisedPlan(combat, classId, path, level, 'group'),
    spells: Object.values(combat.spells)
      .filter((s) => s.class === classId && (!s.path || s.path === path || !path))
      .sort((x, y) => x.level - y.level)
      .map((s) => ({ id: s.id, name: s.name, level: s.level, path: s.path ?? null, cooldown: s.cooldown, element: s.element, tags: s.tags, form: s.form ?? null, text: describeSpell(s), available: available.has(s.id) })),
    encounters: Object.values(combat.encounters).map((e) => ({
      id: e.id,
      name: e.name,
      kind: e.kind ?? 'profil',
      region: e.region ?? null,
      tier: e.tier ?? null,
      tiers: encounterTiers(e, combat, tier),
      circles: !!e.circles,
      blurb: e.blurb ?? null,
      enemies: e.enemies,
      text: mechanics(e),
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
    training: { xpShare: combat.rules.progression.training.xpShare, maxLevel: combat.rules.progression.training.maxLevel },
    activity: a
      ? {
          encounter: a.encounter,
          name: encounterName(a.encounter),
          tier: a.tier ?? (a.encounter !== null ? (combat.encounters[a.encounter]?.tier ?? null) : null),
          wins: a.wins,
          losses: a.losses,
          streak: a.streak,
          progressMs: a.progress,
          fightMs: a.current ? a.current.ms + combat.rules.progression.rest * 1000 : null,
          startedAt: a.startedAt,
        }
      : null,
    stopped: state.combat.stopped,
    lastFight,
    classLevels: Object.fromEntries(Object.keys(combat.kits).map((c) => [c, classLevel(state, c, content)])),
  };
}

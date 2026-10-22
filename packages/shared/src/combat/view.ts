/** Ce que le client reçoit du combat : tous les nombres viennent du serveur. */
import type { Content } from '../schemas/content.js';
import type { Element, PlanEntry, Role, Spell } from '../schemas/combat.js';
import type { CharacterState } from '../engine/state.js';
import { spellSlots } from './content.js';
import type { Contributions } from './engine.js';
import { activePath, advisedPlan, availableSpells, classLevel, classXpPerHour, currentPlan, replayFight } from './progress.js';

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
  encounters: { id: string; name: string; enemies: number; text: string }[];
  training: { xpShare: number; maxLevel: number };
  activity: {
    encounter: string | null;
    name: string;
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

const ELEMENT: Record<Element, string> = { physical: 'Physique', fire: 'Feu', frost: 'Givre', lightning: 'Foudre' };
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
      enemies: e.enemies,
      text: [
        e.enemies > 1 ? `${e.enemies} ennemis` : 'un adversaire',
        e.charge ? `attaque chargée toutes les ${e.charge.period} s` : '',
        e.guard ? `garde toutes les ${e.guard.period} s` : '',
        e.regen ? `se soigne toutes les ${e.regen.period} s` : '',
        e.aura ? 'aura qui use' : '',
      ].filter(Boolean).join(', '),
    })),
    training: { xpShare: combat.rules.progression.training.xpShare, maxLevel: combat.rules.progression.training.maxLevel },
    activity: a
      ? {
          encounter: a.encounter,
          name: encounterName(a.encounter),
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

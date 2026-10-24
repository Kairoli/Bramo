/**
 * Le moteur de Puissance (docs/design/puissance.md) : les systèmes de progression permanente (`data/power/`) donnent des
 * statistiques et des talents qui s'ajoutent à la classe, à l'équipement et au build ; la **Force** les résume en un seul
 * nombre. Fonctions pures, le temps est passé en paramètre.
 *
 * Forme commune : un système est une liste de nœuds à niveaux ; le personnage garde, par système, le niveau de chaque nœud
 * et les recherches en cours (`CharacterState.power`). Ajouter un système = un fichier de données.
 */
import type { CombatStats } from '../combat/engine.js';
import type { CombatRules, Talent } from '../schemas/combat.js';
import type { Content } from '../schemas/content.js';
import type { PowerConfig, PowerContext, PowerNode, PowerStat, PowerSystem } from '../schemas/power.js';
import { levelForXp } from '../formulas/xp.js';
import { type CharacterState, GameError, addStack } from '../engine/state.js';

/** Avancée d'un personnage dans un système : niveau de chaque nœud, recherches en cours (nœud, fin). */
export interface PowerProgress {
  levels: Record<string, number>;
  pending: { node: string; until: number }[];
}
export type PowerState = Record<string, PowerProgress>;

const progressOf = (state: CharacterState, sys: string): PowerProgress => state.power?.[sys] ?? { levels: {}, pending: [] };
export const nodeLevel = (state: CharacterState, sys: string, node: string): number => state.power?.[sys]?.levels[node] ?? 0;

/** Le plus haut niveau de classe du personnage (ouvre les systèmes). */
export function bestClassLevel(state: CharacterState, content: Content): number {
  const xps = Object.values(state.combat?.xp ?? {});
  return Math.max(1, ...xps.map((xp) => levelForXp(xp, content.xpTable)));
}

export const systemOpen = (sys: PowerSystem, state: CharacterState, content: Content) => bestClassLevel(state, content) >= (sys.unlock.classLevel ?? 1);

/** Les recherches finies à `now` passent au niveau suivant. Rend le même état s'il n'y a rien à finir. */
export function settlePower(state: CharacterState, now: number): CharacterState {
  if (!state.power || !Object.values(state.power).some((p) => p.pending.some((x) => x.until <= now))) return state;
  const power: PowerState = {};
  for (const [sys, p] of Object.entries(state.power)) {
    const levels = { ...p.levels };
    for (const x of p.pending) if (x.until <= now) levels[x.node] = (levels[x.node] ?? 0) + 1;
    power[sys] = { levels, pending: p.pending.filter((x) => x.until > now) };
  }
  return { ...state, power };
}

const grow = (g: { base: number; growth: number } | undefined, level: number) => (g ? Math.round(g.base * g.growth ** (level - 1)) : 0);

/** Ce que coûte le niveau `level` d'un nœud (le premier niveau = 1). */
export function nodeCost(node: PowerNode, level: number) {
  return {
    gold: grow(node.cost.gold, level),
    items: node.cost.items.map((c) => ({ item: c.item, qty: grow(c, level) })).filter((c) => c.qty > 0),
    seconds: grow(node.durationSec, level),
  };
}

/** Ce qu'apportent les systèmes à un personnage, pour un contenu donné. */
export interface PowerTotals {
  flat: Partial<Record<PowerStat, number>>;
  pct: Partial<Record<PowerStat, number>>;
  talents: Talent[];
  /** Force déclarée par les nœuds (ce que la formule ne voit pas). */
  force: number;
  /** Nœuds actifs : système, nœud, niveau. */
  parts: { system: string; node: string; level: number }[];
}

export function powerTotals(state: CharacterState, content: Content, context: PowerContext = 'route'): PowerTotals {
  const out: PowerTotals = { flat: {}, pct: {}, talents: [], force: 0, parts: [] };
  if (!content.power) return out;
  for (const sys of content.power.systems) {
    // Un système inné (les points forts d'une classe) est actif d'office : chaque nœud au niveau 1, sans rien payer.
    const innate = sys.kind === 'innate';
    if ((!innate && !state.power?.[sys.id]) || !systemOpen(sys, state, content)) continue;
    for (const node of sys.nodes) {
      const level = innate ? 1 : nodeLevel(state, sys.id, node.id);
      if (level <= 0 || (node.classes && (!state.classId || !node.classes.includes(state.classId)))) continue;
      out.parts.push({ system: sys.id, node: node.id, level });
      for (const b of node.perLevel) {
        if (b.in && !b.in.includes(context)) continue;
        if (b.flat) out.flat[b.stat] = (out.flat[b.stat] ?? 0) + b.flat * level;
        if (b.pct) out.pct[b.stat] = (out.pct[b.stat] ?? 0) + b.pct * level;
      }
      for (const t of node.talents) if (t.level <= level) out.talents.push(t.talent);
      out.force += node.force * level;
    }
  }
  return out;
}

const RATIO: PowerStat[] = ['damageReduction', 'critChance', 'haste', 'penetration', 'combo', 'counter', 'evasion', 'regen'];

/**
 * Les statistiques du combattant avec les systèmes : `flat` s'ajoute, puis `pct` multiplie (Puissance, PV, dégâts
 * critiques) ; les parts (critique, Cadence, combo…) sont plafonnées par `config.caps`, et le critique aussi par les règles.
 */
export function applyPower(stats: CombatStats, t: PowerTotals, config: PowerConfig, rules: CombatRules): CombatStats {
  const out: CombatStats = { ...stats };
  const s = out as unknown as Record<PowerStat, number | undefined>;
  for (const k of new Set([...Object.keys(t.flat), ...Object.keys(t.pct)]) as Set<PowerStat>) {
    let v = (s[k] ?? 0) + (t.flat[k] ?? 0);
    if (!RATIO.includes(k)) v *= 1 + (t.pct[k] ?? 0);
    const cap = config.caps[k] ?? (k === 'critChance' ? rules.caps.critChance : undefined);
    s[k] = cap !== undefined ? Math.min(cap, v) : v;
  }
  return out;
}

/** La vraie force d'un jeu de statistiques : moyenne géométrique de l'attaque et de la survie (×1,096 par palier, comme le mur). */
export function strengthOf(stats: CombatStats, config: PowerConfig): number {
  const f = config.force;
  const attack = stats.power * (1 + stats.critChance * (stats.critMultiplier - 1)) * (1 + stats.haste) * (1 + (stats.combo ?? 0) * f.comboValue) * (1 + (stats.counter ?? 0) * f.counterValue);
  const survive = (stats.maxHp / (1 - Math.min(0.9, stats.damageReduction))) / (1 - Math.min(0.9, (stats.evasion ?? 0) * f.evasionValue)) * (1 + (stats.regen ?? 0) * f.regenValue);
  return Math.sqrt(attack * survive);
}

/**
 * La **Force** de combat : un seul gros nombre pour comparer deux personnages ou deux builds. La vraie force (attaque :
 * Puissance, critique, Cadence, combo, contre-attaque ; survie : PV, Défense, esquive, régénération), rapportée à celle de
 * l'équipement de référence (`reference`, les statistiques de référence des règles), à la puissance `exponent`, × `scale`.
 * `extra` : les paliers déclarés par les nœuds (talents que la formule ne voit pas).
 */
export function forceOf(stats: CombatStats, config: PowerConfig, reference: CombatStats, extra = 0): number {
  const ratio = (strengthOf(stats, config) / strengthOf(reference, config)) * 1.096 ** extra;
  return Math.round(config.force.scale * ratio ** config.force.exponent);
}

/** Pourquoi un nœud ne peut pas monter (null s'il peut). */
export function upgradeBlocker(state: CharacterState, content: Content, sysId: string, nodeId: string, now: number): string | null {
  const sys = content.power?.systems.find((x) => x.id === sysId);
  const node = sys?.nodes.find((n) => n.id === nodeId);
  if (!sys || !node) return 'Inconnu.';
  if (sys.kind === 'innate') return 'Toujours actif.';
  if (!systemOpen(sys, state, content)) return `S'ouvre au niveau ${sys.unlock.classLevel} de classe.`;
  if (node.classes && (!state.classId || !node.classes.includes(state.classId))) return 'Réservé à une autre classe.';
  const p = progressOf(state, sysId);
  const level = p.levels[nodeId] ?? 0;
  if (level + p.pending.filter((x) => x.node === nodeId).length >= node.maxLevel) return 'Au niveau maximum.';
  for (const r of node.requires) if ((p.levels[r.node] ?? 0) < r.level) return `Demande ${sys.nodes.find((n) => n.id === r.node)?.name ?? r.node} niveau ${r.level}.`;
  if (node.choice && sys.nodes.some((n) => n.id !== node.id && n.choice === node.choice && (p.levels[n.id] ?? 0) > 0)) return 'Un autre choix de ce groupe est déjà pris.';
  const cost = nodeCost(node, level + 1);
  if (cost.seconds > 0 && p.pending.filter((x) => x.until > now).length >= sys.slots) return 'Une recherche est déjà en cours.';
  if (state.gold < cost.gold) return `Il faut ${cost.gold} or.`;
  for (const c of cost.items) if ((state.inventory[c.item] ?? 0) < c.qty) return `Il faut ${c.qty} × ${content.items[c.item]?.name ?? c.item}.`;
  return null;
}

/** Monter un nœud d'un niveau : le coût est payé tout de suite ; un nœud à minuteur passe au niveau suivant à la fin. */
export function upgradeNode(state: CharacterState, content: Content, sysId: string, nodeId: string, now: number): CharacterState {
  const s = settlePower(state, now);
  const why = upgradeBlocker(s, content, sysId, nodeId, now);
  if (why) throw new GameError('power_blocked', why);
  const node = content.power!.systems.find((x) => x.id === sysId)!.nodes.find((n) => n.id === nodeId)!;
  const p = progressOf(s, sysId);
  const cost = nodeCost(node, (p.levels[nodeId] ?? 0) + 1);
  const inventory = { ...s.inventory };
  for (const c of cost.items) addStack(inventory, c.item, -c.qty);
  const next: PowerProgress = cost.seconds > 0
    ? { levels: { ...p.levels }, pending: [...p.pending, { node: nodeId, until: now + cost.seconds * 1000 }] }
    : { levels: { ...p.levels, [nodeId]: (p.levels[nodeId] ?? 0) + 1 }, pending: [...p.pending] };
  return { ...s, gold: s.gold - cost.gold, inventory, power: { ...s.power, [sysId]: next } };
}

/** Un nœud tel que le joueur le voit : son niveau, ce que coûte le suivant, ce qui l'en empêche. */
export interface PowerNodeView {
  id: string;
  name: string;
  text: string | null;
  icon: string | null;
  level: number;
  maxLevel: number;
  /** Recherche en cours sur ce nœud : sa fin (ms epoch). */
  pendingUntil: number | null;
  /** Le niveau suivant : or, objets (avec ce qu'on en a), temps. Null au maximum. */
  next: { gold: number; items: { item: string; name: string; qty: number; have: number }[]; seconds: number } | null;
  /** Pourquoi on ne peut pas le monter maintenant (null : on peut). */
  blocker: string | null;
  requires: { node: string; name: string; level: number }[];
  choice: string | null;
  /** Talents débloqués et à quel niveau. */
  talents: { level: number; name: string }[];
}
export interface PowerSystemView {
  id: string;
  name: string;
  kind: PowerSystem['kind'];
  text: string | null;
  open: boolean;
  unlockLevel: number;
  slots: number;
  nodes: PowerNodeView[];
}

/** Les systèmes de Puissance pour l'écran (null sans data/power/). */
export function powerView(state: CharacterState, content: Content, now: number): PowerSystemView[] | null {
  if (!content.power) return null;
  const s = settlePower(state, now);
  return content.power.systems.map((sys) => {
    const p = s.power?.[sys.id] ?? { levels: {}, pending: [] };
    const innate = sys.kind === 'innate';
    return {
      id: sys.id,
      name: sys.name,
      kind: sys.kind,
      text: sys.text ?? null,
      open: systemOpen(sys, s, content),
      unlockLevel: sys.unlock.classLevel ?? 1,
      slots: sys.slots,
      nodes: sys.nodes
        .filter((n) => !innate || !n.classes || (s.classId && n.classes.includes(s.classId)))
        .map((n) => {
          const level = innate ? 1 : (p.levels[n.id] ?? 0);
          const pend = p.pending.find((x) => x.node === n.id) ?? null;
          const cost = !innate && level < n.maxLevel ? nodeCost(n, level + 1) : null;
          return {
            id: n.id,
            name: n.name,
            text: n.text ?? null,
            icon: n.icon ?? null,
            level,
            maxLevel: n.maxLevel,
            pendingUntil: pend?.until ?? null,
            next: cost ? { gold: cost.gold, items: cost.items.map((c) => ({ ...c, name: content.items[c.item]?.name ?? c.item, have: s.inventory[c.item] ?? 0 })), seconds: cost.seconds } : null,
            blocker: innate ? null : upgradeBlocker(s, content, sys.id, n.id, now),
            requires: n.requires.map((r) => ({ node: r.node, name: sys.nodes.find((x) => x.id === r.node)?.name ?? r.node, level: r.level })),
            choice: n.choice ?? null,
            talents: n.talents.map((t) => ({ level: t.level, name: t.talent.name })),
          };
        }),
    };
  });
}

/** Les recherches qui viennent de finir (pour le journal) : système, nœud, nouveau niveau. */
export function finishedResearch(before: CharacterState, after: CharacterState, content: Content): string[] {
  const out: string[] = [];
  for (const [sys, p] of Object.entries(after.power ?? {})) {
    const def = content.power?.systems.find((x) => x.id === sys);
    for (const [node, level] of Object.entries(p.levels)) {
      if ((before.power?.[sys]?.levels[node] ?? 0) < level && (before.power?.[sys]?.pending ?? []).some((x) => x.node === node)) {
        out.push(`${def?.nodes.find((n) => n.id === node)?.name ?? node} : niveau ${level} (${def?.name ?? sys}).`);
      }
    }
  }
  return out;
}

/**
 * Fournitures de combat (23 octobre, nuit) : ce que le personnage emporte sur la route, comme le garde-manger pour les
 * métiers. Les potions de secours se boivent toutes seules quand les PV baissent ; une préparation donne son outil de
 * situation (combat/tools.yaml, rang `prep`) pendant `minutes` de combat, puis la suivante du même type prend le relais.
 * Elles se fabriquent (Alchimie, Artificerie…) et s'achètent au marché : les combattants ont besoin des artisans.
 */
import type { Content } from '../schemas/content.js';
import { type CharacterState, GameError, addStack, cloneState } from '../engine/state.js';

export interface Supplies {
  /** Potions emportées, par objet. */
  potions: Record<string, number>;
  /** Préparations emportées, par objet. */
  preps: Record<string, number>;
  /** Préparation en cours : l'objet, et le temps de combat qu'il lui reste. */
  active: { item: string; leftMs: number } | null;
}

export const emptySupplies = (): Supplies => ({ potions: {}, preps: {}, active: null });
export const readSupplies = (raw: Partial<Supplies> | null | undefined): Supplies => ({ ...emptySupplies(), ...(raw ?? {}) });

/** Emporter des fournitures : des potions ou des préparations du sac. */
export function stockSupplies(input: CharacterState, itemId: string, qty: number, content: Content): CharacterState {
  const item = content.items[itemId];
  if (!item || (!item.potion && !item.prep)) throw new GameError('not_supply', 'Ce n’est ni une potion ni une préparation de combat.');
  if (qty <= 0 || (input.inventory[itemId] ?? 0) < qty) throw new GameError('missing', 'Pas assez dans le sac.');
  const state = cloneState(input);
  const s = readSupplies(state.combat.supplies);
  addStack(state.inventory, itemId, -qty);
  const key = item.potion ? 'potions' : 'preps';
  state.combat.supplies = { ...s, [key]: { ...s[key], [itemId]: (s[key][itemId] ?? 0) + qty } };
  return state;
}

/** Reprendre des fournitures dans le sac. */
export function unstockSupplies(input: CharacterState, itemId: string, qty: number): CharacterState {
  const state = cloneState(input);
  const s = readSupplies(state.combat.supplies);
  const key = (s.potions[itemId] ?? 0) > 0 ? 'potions' : 'preps';
  const have = s[key][itemId] ?? 0;
  const n = Math.min(have, qty);
  if (n <= 0) throw new GameError('missing', 'Rien de tel dans les fournitures.');
  addStack(state.inventory, itemId, n);
  const next = { ...s[key] };
  if (have - n > 0) next[itemId] = have - n;
  else delete next[itemId];
  state.combat.supplies = { ...s, [key]: next };
  return state;
}

/** La potion bue en combat : la plus forte emportée, au plus `perFight` par rencontre. */
export function potionsFor(state: CharacterState, content: Content): { item: string; count: number; heal: number; below: number; cooldown: number } | null {
  const s = readSupplies(state.combat.supplies);
  const per = content.combat?.rules.supplies?.potionsPerFight ?? 0;
  const best = Object.entries(s.potions)
    .filter(([id, n]) => n > 0 && content.items[id]?.potion)
    .sort((a, b) => content.items[b[0]]!.potion!.heal - content.items[a[0]]!.potion!.heal || a[0].localeCompare(b[0]))[0];
  if (!best || per <= 0) return null;
  const p = content.items[best[0]]!.potion!;
  return { item: best[0], count: Math.min(best[1], per), ...p };
}

/** La préparation en cours (outil de situation), en entamant la suivante si la précédente est finie. */
export function activePrep(state: CharacterState, content: Content): string | null {
  const s = readSupplies(state.combat.supplies);
  if (s.active && s.active.leftMs > 0) return content.items[s.active.item]?.prep?.tool ?? null;
  // La prochaine : une du même type d'abord, sinon la première emportée.
  const next = (s.active && (s.preps[s.active.item] ?? 0) > 0 ? s.active.item : null) ?? Object.keys(s.preps).sort().find((id) => (s.preps[id] ?? 0) > 0 && content.items[id]?.prep);
  return next ? content.items[next]!.prep!.tool : null;
}

/** Après une rencontre : potions bues, temps de préparation écoulé (une nouvelle préparation est entamée si besoin). */
export function useSupplies(state: CharacterState, fightMs: number, potionItem: string | null, potionsDrunk: number, content: Content): void {
  const s = readSupplies(state.combat.supplies);
  if (!potionsDrunk && !Object.keys(s.preps).length && !s.active) return;
  const potions = { ...s.potions };
  if (potionItem && potionsDrunk > 0) {
    const left = (potions[potionItem] ?? 0) - potionsDrunk;
    if (left > 0) potions[potionItem] = left;
    else delete potions[potionItem];
  }
  const preps = { ...s.preps };
  let active = s.active;
  if (!active || active.leftMs <= 0) {
    const next = (active && (preps[active.item] ?? 0) > 0 ? active.item : null) ?? Object.keys(preps).sort().find((id) => (preps[id] ?? 0) > 0 && content.items[id]?.prep);
    active = null;
    if (next) {
      preps[next] = preps[next]! - 1;
      if (preps[next]! <= 0) delete preps[next];
      active = { item: next, leftMs: content.items[next]!.prep!.minutes * 60_000 };
    }
  }
  if (active) active = { ...active, leftMs: active.leftMs - fightMs };
  state.combat.supplies = { potions, preps, active: active && active.leftMs > 0 ? active : active ? { ...active, leftMs: 0 } : null };
}

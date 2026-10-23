/**
 * L'Affineur du bourg : le perfectionnement de l'équipement (data/gear_crafting.yaml, `refine` ; docs/design/combat-items.md §5.6).
 *
 * - **Rang d'affinage** [Décidé par Louis, 23 octobre : sans plafond] : +1, +2… ; chaque rang ajoute `statPerRank` aux
 *   lignes fixes de la pièce (le combat le lit dans `CharacterState.equipment[].rank`). Pièces de `minRarity` et plus, palier
 *   `minTier` et plus.
 * - **Affûtage** [Décidé par Louis : jusqu'au maximum, jamais au-delà, jamais un chef-d'œuvre] : une ligne tirée monte de
 *   `step` de sa plage. La ligne bonus du chef-d'œuvre ne s'affûte pas.
 *
 * L'or est détruit (un puits) ; la matière est celle de la pièce : la matière principale de sa famille à son palier, que les
 * artisans produisent. Chaque service coûte plus que le précédent sur le même exemplaire. Tout est pur.
 */
import type { Content } from '../schemas/content.js';
import type { GearInstance, GearModel, Rarity } from '../schemas/gear.js';
import { type CharacterState, GameError, addStack, cloneState } from './state.js';
import { interpolate, materialAt } from './gearCraft.js';

export interface RefineCost {
  gold: number;
  items: { item: string; qty: number }[];
}

const RARITIES: Rarity[] = ['common', 'rare', 'epic', 'legendary'];
const round1 = (n: number) => Math.round(n * 10) / 10;

/** Quantité de matière principale de la recette du modèle (même calcul que l'atelier), et cette matière. */
function mainMaterial(m: GearModel, content: Content): { item: string; qty: number } | null {
  const c = content.gearCrafting;
  const profession = c?.families[m.family];
  const list = profession ? c!.materials[profession] : undefined;
  if (!c || !list) return null;
  const qty = (c.slotQty[m.slot] ?? 8) * interpolate(c.tierMultiplier, m.tier) * (c.rarityMultiplier[m.rarity] ?? 1);
  return { item: materialAt(list, m.tier).item, qty };
}

/** Or d'un service : base × palier × rareté × croissance^(services déjà faits). */
function goldOf(m: GearModel, content: Content, base: number, growth: number, done: number): number {
  const c = content.gearCrafting!;
  return Math.round(base * interpolate(c.tierMultiplier, m.tier) * (c.rarityMultiplier[m.rarity] ?? 1) * growth ** done);
}

/** Cette pièce peut-elle monter en rang ? */
export function canRankUp(m: GearModel, content: Content): boolean {
  const r = content.gearCrafting?.refine?.rank;
  return !!r && !m.starter && m.tier >= r.minTier && RARITIES.indexOf(m.rarity) >= RARITIES.indexOf(r.minRarity);
}

/** Coût du prochain rang d'un exemplaire, ou null s'il ne peut pas monter. */
export function rankCost(g: GearInstance, content: Content): RefineCost | null {
  const m = content.gearModels[g.model];
  const r = content.gearCrafting?.refine?.rank;
  if (!m || !r || !canRankUp(m, content)) return null;
  const rank = g.rank ?? 0;
  const mat = mainMaterial(m, content);
  return {
    gold: goldOf(m, content, r.gold, r.goldGrowth, rank),
    items: mat ? [{ item: mat.item, qty: Math.max(1, Math.round(mat.qty * r.materialShare * r.materialGrowth ** rank)) }] : [],
  };
}

/** Lignes qu'on peut encore affûter (tirées, pas la ligne bonus, sous leur maximum). */
export const honeableLines = (g: GearInstance): number[] => g.lines.flatMap((l, i) => (!l.bonus && l.value < l.max ? [i] : []));

/** Coût du prochain affûtage d'un exemplaire, ou null si aucune ligne ne peut monter. */
export function honeCost(g: GearInstance, content: Content): RefineCost | null {
  const m = content.gearModels[g.model];
  const h = content.gearCrafting?.refine?.hone;
  if (!m || !h || m.starter || !honeableLines(g).length) return null;
  const mat = mainMaterial(m, content);
  return {
    gold: goldOf(m, content, h.gold, h.goldGrowth, g.hones ?? 0),
    items: mat ? [{ item: mat.item, qty: Math.max(1, Math.round(mat.qty * h.materialShare)) }] : [],
  };
}

function pay(input: CharacterState, cost: RefineCost, content: Content): CharacterState {
  if (input.gold < cost.gold) throw new GameError('gold', `Il faut ${cost.gold} or.`);
  for (const i of cost.items) {
    if ((input.inventory[i.item] ?? 0) < i.qty) throw new GameError('missing', `Il faut ${i.qty} × ${content.items[i.item]?.name ?? i.item}.`);
  }
  const state = cloneState(input);
  state.gold -= cost.gold;
  for (const i of cost.items) addStack(state.inventory, i.item, -i.qty);
  return state;
}

/** Monter un exemplaire d'un rang : renvoie l'état payé et l'exemplaire modifié. */
export function rankUp(input: CharacterState, g: GearInstance, content: Content): { state: CharacterState; gear: GearInstance; cost: RefineCost } {
  const cost = rankCost(g, content);
  if (!cost) throw new GameError('no_rank', 'L’Affineur ne travaille que les belles pièces : Épiques ou Légendaires, palier 40 et plus.');
  if (g.price != null) throw new GameError('listed', 'Retirez d’abord la pièce de la vitrine.');
  return { state: pay(input, cost, content), gear: { ...g, rank: (g.rank ?? 0) + 1 }, cost };
}

/** Affûter une ligne tirée d'un exemplaire (+step de sa plage, au plus son maximum). */
export function honeLine(input: CharacterState, g: GearInstance, lineIndex: number, content: Content): { state: CharacterState; gear: GearInstance; cost: RefineCost } {
  const h = content.gearCrafting?.refine?.hone;
  const cost = honeCost(g, content);
  if (!h || !cost) throw new GameError('no_hone', 'Aucune ligne de cette pièce ne peut encore monter.');
  if (!honeableLines(g).includes(lineIndex)) throw new GameError('line_max', 'Cette ligne est déjà à son maximum.');
  if (g.price != null) throw new GameError('listed', 'Retirez d’abord la pièce de la vitrine.');
  const lines = g.lines.map((l, i) => (i === lineIndex ? { ...l, value: Math.min(l.max, round1(l.value + h.step * (l.max - l.min))) } : l));
  return { state: pay(input, cost, content), gear: { ...g, lines, hones: (g.hones ?? 0) + 1 }, cost };
}

/** Lignes fixes d'une pièce à son rang. */
export function rankedStats(m: GearModel, rank: number | undefined, content: Content): GearModel['stats'] {
  const per = content.gearCrafting?.refine?.rank.statPerRank ?? 0;
  if (!rank || !per) return m.stats;
  return m.stats.map((s) => ({ ...s, value: Math.round(s.value * (1 + rank * per)) }));
}

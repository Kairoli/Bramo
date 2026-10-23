/**
 * L'Affineur du bourg : le perfectionnement de l'équipement (data/gear_crafting.yaml, `refine` ; docs/design/combat-items.md §5.6).
 *
 * - **Rang d'affinage** [Décidé par Louis, 23 octobre : sans plafond] : +1, +2… ; chaque rang ajoute `statPerRank` aux
 *   lignes fixes de la pièce (le combat le lit dans `CharacterState.equipment[].rank`). Pièces de `minRarity` et plus, palier
 *   `minTier` et plus.
 * - **Affûtage** [Décidé par Louis : jusqu'au maximum, jamais au-delà, jamais un chef-d'œuvre] : une ligne tirée monte de
 *   `step` de sa plage. La ligne bonus du chef-d'œuvre ne s'affûte pas.
 *
 * - **Démontage** [Décidé par Louis, 23 octobre] : une pièce du sac disparaît et donne de la poussière (docs/design/eclats.md §3).
 * - **Retaille** [Décidé par Louis : prix exponentiel] : une ligne tirée reçoit des propositions (une ligne possible de
 *   l'emplacement, tirée dans sa plage), on garde l'une d'elles ou l'actuelle ; ensuite seule cette ligne se retaille (§4).
 *
 * L'or est détruit (un puits) ; la matière est celle de la pièce : la matière principale de sa famille à son palier, que les
 * artisans produisent. Chaque service coûte plus que le précédent sur le même exemplaire. Tout est pur (le hasard est injecté).
 */
import type { Content } from '../schemas/content.js';
import type { GearInstance, GearModel, Rarity, RolledLine } from '../schemas/gear.js';
import { type CharacterState, GameError, addStack, cloneState } from './state.js';
import { interpolate, materialAt } from './gearCraft.js';
import { lineRange, type Rng } from './equipment.js';

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

/** Poussière que donne le démontage d'un exemplaire, ou null s'il ne peut pas l'être (porté, en vitrine, de départ). */
export function salvageYield(g: GearInstance, content: Content): { item: string; qty: number } | null {
  const m = content.gearModels[g.model];
  const s = content.gearCrafting?.refine?.salvage;
  if (!m || !s || m.starter || g.equipped || g.price != null) return null;
  const worked = g.masterpiece || (g.rank ?? 0) > 0 || (g.hones ?? 0) > 0 || (g.rerolls ?? 0) > 0;
  const qty = (s.perRarity[m.rarity] ?? 0) * interpolate(content.gearCrafting!.tierMultiplier, m.tier) * (worked ? 1 + s.workedBonus : 1);
  return { item: s.item, qty: Math.max(1, Math.round(qty)) };
}

/** Démonter des exemplaires : ils disparaissent (le serveur les efface) et leur poussière va au sac. */
export function salvageGear(input: CharacterState, pieces: GearInstance[], content: Content): { state: CharacterState; item: string; qty: number } {
  if (!pieces.length) throw new GameError('no_salvage', 'Aucune pièce à démonter.');
  const state = cloneState(input);
  let item = '';
  let qty = 0;
  for (const g of pieces) {
    const y = salvageYield(g, content);
    const name = content.gearModels[g.model]?.name ?? 'Cette pièce';
    if (!y) throw new GameError('no_salvage', g.equipped ? `${name} est portée : rangez-la d’abord.` : g.price != null ? `${name} est en vitrine : retirez-la d’abord.` : `${name} ne se démonte pas.`);
    if (g.rerollOffer?.length) throw new GameError('reroll_pending', `${name} attend votre choix de retaille.`);
    item = y.item;
    qty += y.qty;
  }
  addStack(state.inventory, item, qty);
  return { state, item, qty };
}

/** Lignes qu'on peut retailler : toutes les lignes tirées avant la première retaille, puis seulement celle-là. */
export function rerollableLines(g: GearInstance, content: Content): number[] {
  const m = content.gearModels[g.model];
  if (!m || m.starter || g.masterpiece || !content.gearCrafting?.refine?.reroll) return [];
  if (g.rerollLine != null) return g.lines[g.rerollLine] && !g.lines[g.rerollLine]!.bonus ? [g.rerollLine] : [];
  return g.lines.flatMap((l, i) => (l.bonus ? [] : [i]));
}

/** Coût de la prochaine retaille d'un exemplaire, ou null s'il ne peut pas être retaillé. */
export function rerollCost(g: GearInstance, content: Content): RefineCost | null {
  const m = content.gearModels[g.model];
  const r = content.gearCrafting?.refine?.reroll;
  const s = content.gearCrafting?.refine?.salvage;
  if (!m || !r || !s || !rerollableLines(g, content).length) return null;
  const done = g.rerolls ?? 0;
  const tier = interpolate(content.gearCrafting!.tierMultiplier, m.tier);
  return {
    gold: goldOf(m, content, r.gold, r.growth, done),
    items: [{ item: s.item, qty: Math.max(1, Math.round((r.perRarity[m.rarity] ?? 1) * tier * r.growth ** done)) }],
  };
}

/**
 * Retailler une ligne : on paie, l'Affineur tire `offers` propositions parmi les lignes de l'emplacement que la pièce n'a pas
 * déjà ailleurs (la même ligne peut revenir, avec une autre valeur), chacune dans sa plage. Elles attendent le choix du joueur
 * (`chooseReroll`). La ligne retaillée devient la seule retaillable de la pièce.
 */
export function rerollLine(input: CharacterState, g: GearInstance, lineIndex: number, content: Content, rand: Rng): { state: CharacterState; gear: GearInstance; cost: RefineCost } {
  const m = content.gearModels[g.model];
  const r = content.gearCrafting?.refine?.reroll;
  const cost = rerollCost(g, content);
  if (!m || !r || !cost) throw new GameError('no_reroll', g.masterpiece ? 'Les lignes d’un chef-d’œuvre sont le choix de son artisan : elles ne se retaillent pas.' : 'Cette pièce ne peut pas être retaillée.');
  if (g.rerollOffer?.length) throw new GameError('reroll_pending', 'Choisissez d’abord parmi les propositions de l’Affineur.');
  if (!rerollableLines(g, content).includes(lineIndex)) throw new GameError('reroll_line', 'Seule la ligne déjà retaillée peut l’être encore.');
  if (g.price != null) throw new GameError('listed', 'Retirez d’abord la pièce de la vitrine.');
  const others = new Set(g.lines.flatMap((l, i) => (i === lineIndex ? [] : [l.name])));
  const left = lineRange(m, content).filter((l) => !others.has(l.name));
  const offer: RolledLine[] = [];
  for (let n = 0; n < r.offers && left.length; n++) {
    const l = left.splice(Math.floor(rand() * left.length), 1)[0]!;
    offer.push({ name: l.name, min: l.min, max: l.max, value: round1(l.min + rand() * (l.max - l.min)) });
  }
  return { state: pay(input, cost, content), gear: { ...g, rerollLine: lineIndex, rerolls: (g.rerolls ?? 0) + 1, rerollOffer: offer }, cost };
}

/** Garder une proposition de retaille (son index), ou la ligne actuelle (null). */
export function chooseReroll(g: GearInstance, pick: number | null): GearInstance {
  const offer = g.rerollOffer;
  if (!offer?.length || g.rerollLine == null) throw new GameError('no_offer', 'Aucune proposition en attente pour cette pièce.');
  if (pick === null) return { ...g, rerollOffer: null };
  const line = offer[pick];
  if (!line) throw new GameError('bad_pick', 'Proposition inconnue.');
  return { ...g, lines: g.lines.map((l, i) => (i === g.rerollLine ? line : l)), rerollOffer: null };
}

/** Lignes fixes d'une pièce à son rang. */
export function rankedStats(m: GearModel, rank: number | undefined, content: Content): GearModel['stats'] {
  const per = content.gearCrafting?.refine?.rank.statPerRank ?? 0;
  if (!rank || !per) return m.stats;
  return m.stats.map((s) => ({ ...s, value: Math.round(s.value * (1 + rank * per)) }));
}

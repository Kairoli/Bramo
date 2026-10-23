/**
 * Fabrication de l'équipement de combat (data/gear_crafting.yaml ; docs/design/contenu/butin-et-recettes.md §3).
 *
 * Chaque modèle fabricable (source « craft », ni ensemble, ni nommé, ni de départ) a une recette calculée : le métier de sa
 * famille, la matière principale de ce métier à son palier, une matière d'appoint de bas palier, des quantités selon
 * l'emplacement, le palier et la rareté. On choisit le modèle ; les lignes se tirent à la fabrication, avec une chance de
 * chef-d'œuvre qui grandit avec l'avance de l'artisan sur la recette. La fabrication est immédiate : le temps est déjà
 * dans les matières (récolte, raffinage), elle donne l'XP de sa durée.
 */
import type { Content } from '../schemas/content.js';
import type { GearInstance, GearModel } from '../schemas/gear.js';
import { type CharacterState, GameError, addStack, cloneState } from './state.js';
import { type Rng, masterpieceChance, newInstance } from './equipment.js';
import { skillLevel } from './trials.js';

export interface GearRecipe {
  model: string;
  profession: string;
  level: number;
  durationSec: number;
  xp: number;
  inputs: { item: string; qty: number }[];
}

export const interpolate = (points: { tier: number; mul: number }[], tier: number) => {
  const p = [...points].sort((a, b) => a.tier - b.tier);
  if (tier <= p[0]!.tier) return p[0]!.mul;
  for (let i = 1; i < p.length; i++) {
    const a = p[i - 1]!;
    const b = p[i]!;
    if (tier <= b.tier) return a.mul + ((b.mul - a.mul) * (tier - a.tier)) / (b.tier - a.tier);
  }
  return p.at(-1)!.mul;
};

export const materialAt = (list: { tier: number; item: string }[], tier: number) => [...list].sort((a, b) => b.tier - a.tier).find((m) => m.tier <= tier) ?? list[0]!;

/** Ce modèle se fabrique-t-il ? */
export const isCraftable = (m: GearModel, content: Content): boolean =>
  !!content.gearCrafting && m.source.includes('craft') && !m.set && !m.named && !m.talent && !m.starter && !!content.gearCrafting.families[m.family];

const recipes = new WeakMap<object, Map<string, GearRecipe | null>>();

/** Recette d'un modèle, ou null s'il ne se fabrique pas. */
export function gearRecipe(modelId: string, content: Content): GearRecipe | null {
  let memo = recipes.get(content.gearModels);
  if (!memo) recipes.set(content.gearModels, (memo = new Map()));
  if (memo.has(modelId)) return memo.get(modelId)!;
  const m = content.gearModels[modelId];
  const c = content.gearCrafting;
  let out: GearRecipe | null = null;
  if (m && c && isCraftable(m, content)) {
    const profession = c.families[m.family]!;
    const mul = interpolate(c.tierMultiplier, m.tier) * (c.rarityMultiplier[m.rarity] ?? 1);
    const base = c.slotQty[m.slot] ?? 8;
    const qty = Math.max(1, Math.round(base * mul));
    const inputs = [{ item: materialAt(c.materials[profession]!, m.tier).item, qty }];
    const sec = c.secondary[m.family];
    if (sec && c.materials[sec.profession]) {
      const item = materialAt(c.materials[sec.profession]!, Math.min(m.tier, 20)).item;
      const q = Math.max(1, Math.round(qty * sec.share));
      const same = inputs.find((i) => i.item === item);
      if (same) same.qty += q;
      else inputs.push({ item, qty: q });
    }
    const level = Math.max(1, Math.min(content.settings.xp.maxLevel, Math.round(m.tier * c.levelPerTier)));
    const durationSec = Math.round((c.slotMinutes[m.slot] ?? 4) * 60 * interpolate(c.tierMultiplier, m.tier) * Math.sqrt(c.rarityMultiplier[m.rarity] ?? 1));
    const xp = Math.round((durationSec / 3600) * c.xp.perHourAtLevel1 * 2 ** ((level - 1) / c.xp.doubling) * 10) / 10;
    out = { model: m.id, profession, level, durationSec, xp, inputs };
  }
  memo.set(modelId, out);
  return out;
}

/** Les modèles qu'un métier sait fabriquer (pour l'atelier), du palier le plus bas au plus haut. */
export function craftableModels(profession: string, content: Content): GearModel[] {
  return Object.values(content.gearModels)
    .filter((m) => isCraftable(m, content) && content.gearCrafting!.families[m.family] === profession)
    .sort((a, b) => a.tier - b.tier || a.slot.localeCompare(b.slot) || a.id.localeCompare(b.id));
}

/**
 * Fabriquer une pièce : il faut le niveau et les matières. Renvoie l'état (matières prises, XP gagnée) et la pièce créée
 * (sans identifiant : le serveur la range) ; `masterpiece` dit si c'est un chef-d'œuvre, signé par l'artisan.
 */
export function craftGear(input: CharacterState, modelId: string, content: Content, rand: Rng, signedBy: string | null = null): { state: CharacterState; gear: GearInstance; masterpiece: boolean } {
  const recipe = gearRecipe(modelId, content);
  const model = content.gearModels[modelId];
  if (!recipe || !model) throw new GameError('not_craftable', 'Cette pièce ne se fabrique pas.');
  const level = skillLevel(input, recipe.profession, content);
  const name = content.professions.find((p) => p.id === recipe.profession)?.name ?? recipe.profession;
  if (level < recipe.level) throw new GameError('level', `${name} niveau ${recipe.level} requis.`);
  const missing = recipe.inputs.find((i) => (input.inventory[i.item] ?? 0) < i.qty);
  if (missing) throw new GameError('missing', `Il manque ${missing.qty - (input.inventory[missing.item] ?? 0)} × ${content.items[missing.item]?.name ?? missing.item}.`);
  const state = cloneState(input);
  for (const i of recipe.inputs) addStack(state.inventory, i.item, -i.qty);
  state.skills[recipe.profession] = (state.skills[recipe.profession] ?? 0) + recipe.xp;
  const masterpiece = rand() < masterpieceChance(level, recipe.level, content);
  const gear = newInstance(model, content, rand, { masterpiece, signedBy: masterpiece ? signedBy : null });
  return { state, gear, masterpiece };
}

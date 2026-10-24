/**
 * Commandes entre joueurs (docs/design/social.md §3 ; décidé par Louis le 24 octobre). Ce qui se calcule sans la base : ce
 * qu'on peut commander à un artisan, le temps que ça lui prendra, les trois délais proposés et le prix conseillé.
 *
 * - Un objet d'une recette de métier (en unités d'objet), ou une pièce d'équipement de l'atelier.
 * - Le temps : la recette × le nombre de fabrications, plus les intermédiaires qui lui manquent et qu'il sait faire (un
 *   niveau), moins ce que le client fournit.
 * - Le prix conseillé : la valeur de référence de ce qu'on commande (matières et temps compris), moins celle des matériaux
 *   fournis (au moins le cinquième : le temps de l'artisan reste à payer), × le facteur du délai.
 */
import type { Content, Recipe } from '../schemas/content.js';
import { type GearRecipe, craftableModels, gearRecipe } from './gearCraft.js';
import { skillLevel } from './trials.js';
import type { CharacterState } from './state.js';

export type OrderKind = 'item' | 'gear';
export type OrderDelay = 'rush' | 'normal' | 'relaxed';

/** Ce qu'on peut commander : une recette de métier (son objet) ou un modèle d'équipement. */
export interface OrderTarget {
  kind: OrderKind;
  /** L'objet (recette de métier) ou le modèle d'équipement. */
  id: string;
  name: string;
  profession: string;
  level: number;
  /** Secondes par fabrication, et ce qu'une fabrication donne (1 pour l'équipement). */
  durationSec: number;
  perCraft: number;
  inputs: { item: string; qty: number }[];
  /** Valeur de référence d'une unité (pièce d'équipement : 40 % de plus que ses matières). */
  value: number;
  /** Pièce d'équipement : de quoi dessiner son icône. */
  gear: { slot: string; family: string; tier: number; rarity: string } | null;
}

const recipeOf = (itemId: string, content: Content): Recipe | undefined =>
  Object.values(content.recipes).find((r) => r.outputs.some((o) => o.item === itemId) && r.category !== 'masterwork');

export function orderTarget(kind: OrderKind, id: string, content: Content): OrderTarget | null {
  if (kind === 'item') {
    const r = recipeOf(id, content);
    const item = content.items[id];
    if (!r || !item) return null;
    return { kind, id, name: item.name, profession: r.profession, level: r.level, durationSec: r.durationSec, perCraft: r.outputs.find((o) => o.item === id)!.qty, inputs: r.inputs, value: item.value, gear: null };
  }
  const m = content.gearModels[id];
  const g: GearRecipe | null = m ? gearRecipe(id, content) : null;
  if (!m || !g) return null;
  const value = Math.round(g.inputs.reduce((s, i) => s + (content.items[i.item]?.value ?? 0) * i.qty, 0) * 1.4);
  return { kind, id, name: m.name, profession: g.profession, level: g.level, durationSec: g.durationSec, perCraft: 1, inputs: g.inputs, value, gear: { slot: m.slot, family: m.family, tier: m.tier, rarity: m.rarity } };
}

/** Tout ce qu'un artisan sait faire à ses niveaux (recettes de métier et pièces de l'atelier). */
export function orderCatalog(state: CharacterState, content: Content): OrderTarget[] {
  const out: OrderTarget[] = [];
  const seen = new Set<string>();
  for (const r of Object.values(content.recipes)) {
    if (r.category === 'masterwork' || skillLevel(state, r.profession, content) < r.level) continue;
    if (content.professions.find((p) => p.id === r.profession)?.status !== 'playable') continue;
    for (const o of r.outputs) {
      if (seen.has(o.item)) continue;
      const t = orderTarget('item', o.item, content);
      if (t) (seen.add(o.item), out.push(t));
    }
  }
  for (const p of new Set(Object.values(content.gearCrafting?.families ?? {})))
    for (const m of craftableModels(p, content)) {
      const t = orderTarget('gear', m.id, content);
      if (t && skillLevel(state, p, content) >= t.level) out.push(t);
    }
  return out.sort((a, b) => a.profession.localeCompare(b.profession) || a.level - b.level || a.name.localeCompare(b.name));
}

/** Les matériaux d'une commande (toutes fabrications comprises). */
export function orderMaterials(t: OrderTarget, qty: number): { item: string; qty: number }[] {
  const crafts = Math.ceil(qty / t.perCraft);
  return t.inputs.map((i) => ({ item: i.item, qty: i.qty * crafts }));
}

export interface OrderQuote {
  /** Temps de fabrication estimé (secondes). */
  workSec: number;
  /** Les trois délais : heures, prix conseillé, plafond. */
  delays: { id: OrderDelay; hours: number; advised: number; cap: number }[];
}

/**
 * Le devis d'une commande : `supplied` = ce que le client fournit (déduit du temps et du prix) ; `stock` = ce que l'artisan
 * a déjà (seulement pour le temps : on ne le montre pas au client).
 */
export function quoteOrder(t: OrderTarget, qty: number, supplied: { item: string; qty: number }[], stock: Record<string, number>, artisan: CharacterState, content: Content): OrderQuote {
  const rules = content.settings.orders;
  const crafts = Math.ceil(qty / t.perCraft);
  let workSec = t.durationSec * crafts;
  let suppliedValue = 0;
  for (const need of orderMaterials(t, qty)) {
    const given = supplied.find((s) => s.item === need.item)?.qty ?? 0;
    suppliedValue += Math.min(given, need.qty) * (content.items[need.item]?.value ?? 0);
    const missing = need.qty - given - (stock[need.item] ?? 0);
    if (missing <= 0) continue;
    // Un intermédiaire qu'il sait faire (ou récolter) : son temps s'ajoute ; sinon il l'achètera.
    const r = recipeOf(need.item, content);
    if (r && skillLevel(artisan, r.profession, content) >= r.level) workSec += r.durationSec * Math.ceil(missing / r.outputs.find((o) => o.item === need.item)!.qty);
  }
  const full = t.value * qty;
  const base = Math.max(Math.round(full / 5), full - suppliedValue);
  const hours = workSec / 3600;
  const delays = (['rush', 'normal', 'relaxed'] as const).map((id) => {
    const d = rules.delays[id];
    const advised = Math.max(0, Math.round(base * d.price));
    return { id, hours: Math.ceil(Math.max(d.minHours, d.factor * hours)), advised, cap: Math.max(1, Math.round(advised * rules.capFactor)) };
  });
  return { workSec, delays };
}

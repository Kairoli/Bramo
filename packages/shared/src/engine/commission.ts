import type { Content, Recipe } from '../schemas/content.js';
import { dayKey } from '../formulas/rates.js';
import { type CharacterState, GameError, addStack, addTo, cloneState } from './state.js';
import { isDurable, takeCopy } from './gear.js';
import { skillLevel } from './trials.js';

/** Unités déjà primées pendant le jour de jeu `dayKey`. */
export interface PrimeProgress {
  dayKey: string;
  units: number;
}

/** La recette qui fabrique un objet (un seul résultat, au moins un ingrédient, hors chef-d'œuvre d'épreuve). */
export function recipeFor(itemId: string, content: Content): Recipe | undefined {
  return Object.values(content.recipes).find(
    (r) => !r.trial && r.inputs.length > 0 && r.outputs.length === 1 && r.outputs[0]!.item === itemId,
  );
}

export const levelIn = (state: CharacterState, profession: string, content: Content): number =>
  skillLevel(state, profession, content);

/**
 * Prime de commande : livrer `units` exemplaires d'un objet qu'on sait fabriquer à un ordre d'achat rapporte un peu d'XP
 * en plus, dans la limite de `commissions.primeUnitsPerDay` unités par jour de jeu.
 */
export function primeFor(
  state: CharacterState,
  itemId: string,
  units: number,
  now: number,
  content: Content,
): { units: number; xp: number; profession: string } | null {
  const recipe = recipeFor(itemId, content);
  if (!recipe || levelIn(state, recipe.profession, content) < recipe.level) return null;
  const key = dayKey(now, content.settings);
  const used = state.prime.dayKey === key ? state.prime.units : 0;
  const n = Math.min(units, Math.max(0, content.settings.commissions.primeUnitsPerDay - used));
  if (n <= 0) return null;
  const xp = (recipe.xp * (n / recipe.outputs[0]!.qty)) * content.settings.commissions.primeShare;
  return { units: n, xp, profession: recipe.profession };
}

/** Applique une prime calculée par `primeFor` (modifie `state`). */
export function applyPrime(state: CharacterState, prime: { units: number; xp: number; profession: string }, now: number, content: Content): void {
  const key = dayKey(now, content.settings);
  state.prime = { dayKey: key, units: (state.prime.dayKey === key ? state.prime.units : 0) + prime.units };
  addTo(state.skills, prime.profession, prime.xp);
}

/** XP d'une réparation par matériaux. */
export function repairXp(itemId: string, content: Content): number {
  const recipe = recipeFor(itemId, content);
  return recipe ? recipe.xp * content.settings.wear.repairXpShare : 0;
}

/** Les matériaux manquent-ils pour réparer cet objet ? Renvoie une erreur affichable, ou null si tout est prêt. */
export function repairProblem(state: CharacterState, itemId: string, content: Content): string | null {
  const item = content.items[itemId];
  const repair = item?.repair;
  if (!item || !repair || !isDurable(item)) return 'Cet objet ne se répare pas par matériaux.';
  if (levelIn(state, repair.profession, content) < repair.level) {
    const profession = content.professions.find((p) => p.id === repair.profession)?.name ?? repair.profession;
    return `${profession} niveau ${repair.level} requis pour réparer cet objet.`;
  }
  for (const m of repair.materials) {
    if ((state.inventory[m.item] ?? 0) < m.qty) return 'Il vous manque des matériaux pour cette réparation.';
  }
  return null;
}

/** Consomme les matériaux de réparation et gagne l'XP : à appeler après `repairProblem`. */
export function spendRepairMaterials(state: CharacterState, itemId: string, content: Content): void {
  const item = content.items[itemId]!;
  for (const m of item.repair!.materials) addStack(state.inventory, m.item, -m.qty);
  addTo(state.skills, item.repair!.profession, repairXp(itemId, content));
}

/** Réparer soi-même l'exemplaire le plus usé, avec des matériaux (≈ 30 % de ceux de l'objet) : sans or, avec un peu d'XP. */
export function repairWithMaterials(input: CharacterState, itemId: string, content: Content): CharacterState {
  if ((input.inventory[itemId] ?? 0) < 1) throw new GameError('missing', 'Vous n’en avez pas.');
  const problem = repairProblem(input, itemId, content);
  if (problem) throw new GameError('repair', problem);
  const worn = (input.wear[itemId] ?? [])[0] ?? 0;
  if (worn <= 0) throw new GameError('not_worn', 'Cet objet est comme neuf.');
  const state = cloneState(input);
  spendRepairMaterials(state, itemId, content);
  takeCopy(state, itemId, 0);
  return state;
}

/** Niveau de chaque bâtiment d'un clan (absent = pas construit). */
export type BuildingLevels = Record<string, number>;

/** Bonus de production par métier (« all » = toute production) selon les bâtiments construits. Le plafond `bonusCaps.clan` s'applique ensuite, sur la somme. */
export function clanBonuses(levels: BuildingLevels, content: Pick<Content, 'buildings'>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [id, level] of Object.entries(levels)) {
    const b = content.buildings[id];
    if (!b || level <= 0) continue;
    for (const p of b.boost.professions) out[p] = (out[p] ?? 0) + Math.min(level, b.maxLevel) * b.boost.perLevel;
  }
  return out;
}

/**
 * Bonus de production d'un joueur : la Guilde du bourg (`townGuildBonus`, pour tous) plus ceux des bâtiments de son clan
 * (`levels`, absent sans clan). Le plafond `bonusCaps.clan` s'applique ensuite sur la somme.
 */
export function memberBonuses(levels: BuildingLevels | null, content: Pick<Content, 'buildings' | 'settings'>): Record<string, number> {
  const out = { all: content.settings.clan.townGuildBonus } as Record<string, number>;
  if (levels) for (const [k, v] of Object.entries(clanBonuses(levels, content))) out[k] = (out[k] ?? 0) + v;
  return out;
}

/**
 * Ce que demande le niveau `level` d'un bâtiment : or et objets, proportionnels à `level` et au nombre de membres actifs
 * (au moins `minMembersForCost`, qui sert de référence aux chiffres de data/buildings.yaml). Arrondi au supérieur.
 */
export function buildingNeeds(
  buildingId: string,
  level: number,
  activeMembers: number,
  content: Pick<Content, 'buildings' | 'settings'>,
): { gold: number; items: { item: string; qty: number }[] } {
  const b = content.buildings[buildingId];
  if (!b) return { gold: 0, items: [] };
  const ref = content.settings.clan.minMembersForCost;
  const factor = (level * Math.max(ref, activeMembers)) / ref;
  return { gold: Math.ceil(b.base.gold * factor), items: b.base.items.filter((s) => (s.fromLevel ?? 1) <= level).map((s) => ({ item: s.item, qty: Math.ceil(s.qty * factor) })) };
}

/** L'ouvrage du niveau `level` (1 = le premier) : la liste de data/clan_works.yaml tourne sans fin. */
export function workAt(level: number, content: Pick<Content, 'clanWorks'>) {
  const works = content.clanWorks?.works ?? [];
  return works.length ? works[(Math.max(1, level) - 1) % works.length]! : null;
}

/**
 * Ce que demande le niveau `level` des ouvrages : ceux de son ouvrage, proportionnels aux membres actifs (comme les
 * bâtiments), × min(1 + growth.perLevel × (level − 1), growth.max) : il monte un peu, puis reste stable.
 */
export function worksNeeds(level: number, activeMembers: number, content: Pick<Content, 'clanWorks' | 'settings'>): { gold: number; items: { item: string; qty: number }[] } {
  const w = workAt(level, content);
  const c = content.clanWorks;
  if (!w || !c) return { gold: 0, items: [] };
  const ref = content.settings.clan.minMembersForCost;
  const factor = (Math.max(ref, activeMembers) / ref) * Math.min(1 + c.growth.perLevel * (level - 1), c.growth.max);
  return { gold: Math.ceil(w.gold * factor), items: w.items.map((s) => ({ item: s.item, qty: Math.ceil(s.qty * factor) })) };
}

/** Rang de prestige d'un clan selon son Renom (settings.clan.renown), et le rang suivant. */
export function renownRank(renown: number, content: Pick<Content, 'settings'>): { rank: string; next: { name: string; at: number } | null } {
  const ranks = [...(content.settings.clan.renown?.ranks ?? [{ name: 'Hameau', at: 0 }])].sort((a, b) => a.at - b.at);
  const reached = [...ranks].reverse().find((r) => renown >= r.at) ?? ranks[0]!;
  const next = ranks.find((r) => r.at > renown) ?? null;
  return { rank: reached.name, next: next ? { name: next.name, at: next.at } : null };
}

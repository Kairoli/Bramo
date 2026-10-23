import { z } from 'zod';
import {
  type Content,
  itemsFileSchema,
  professionsFileSchema,
  recipesFileSchema,
  buildingsFileSchema,
  npcOrdersFileSchema,
  ornamentsFileSchema,
  settingsSchema,
  trialsFileSchema,
} from './schemas/content.js';
import { classesFileSchema, cosmeticsFileSchema } from './schemas/art.js';
import { gearFileSchema, gearPoolsFileSchema, gearSetsFileSchema, gearSlotsFileSchema } from './schemas/gear.js';
import { buildXpTable } from './formulas/xp.js';
import { type RawCombat, buildCombatContent } from './combat/content.js';

export class ContentError extends Error {}

export interface RawContent {
  settings: unknown;
  professions: unknown;
  items: unknown;
  classes: unknown;
  cosmetics: unknown;
  trials: unknown;
  npcOrders: unknown;
  buildings?: unknown;
  ornaments?: unknown;
  /** Équipement : modèles, emplacements, lignes aléatoires, ensembles (optionnels pour les propositions du simulateur). */
  gear?: unknown;
  gearSlots?: unknown;
  gearPools?: unknown;
  gearSets?: unknown;
  /** Combat automatique : data/combat/ (optionnel pour les propositions du simulateur). */
  combat?: RawCombat;
  /** Un fichier de recettes par entrée : [nom du fichier, contenu]. */
  recipes: [string, unknown][];
}

function parse<T>(schema: z.ZodType<T>, data: unknown, file: string): T {
  const result = schema.safeParse(data);
  if (!result.success) throw new ContentError(`${file} invalide :\n${z.prettifyError(result.error)}`);
  return result.data;
}

/** Valide les fichiers de données et vérifie les références croisées. */
export function buildContent(raw: RawContent): Content {
  const settings = parse(settingsSchema, raw.settings, 'settings.yaml');
  const professions = parse(professionsFileSchema, raw.professions, 'professions.yaml');
  const itemList = parse(itemsFileSchema, raw.items, 'items.yaml');
  const classList = parse(classesFileSchema, raw.classes, 'classes.yaml');
  const cosmetics = parse(cosmeticsFileSchema, raw.cosmetics, 'cosmetics.yaml');
  const trialList = parse(trialsFileSchema, raw.trials, 'trials.yaml');
  const npcOrderList = parse(npcOrdersFileSchema, raw.npcOrders ?? [], 'npc_orders.yaml');
  const buildingList = parse(buildingsFileSchema, raw.buildings ?? [], 'buildings.yaml');
  const ornamentList = parse(ornamentsFileSchema, raw.ornaments ?? [], 'ornaments.yaml');
  const gearSlotList = parse(gearSlotsFileSchema, raw.gearSlots ?? [], 'gear_slots.yaml');
  const gearPools = parse(gearPoolsFileSchema.default({ tierScale: {}, pools: {} }), raw.gearPools ?? undefined, 'gear_pools.yaml');
  const gearList = parse(gearFileSchema, raw.gear ?? [], 'gear.yaml');
  const gearSetList = parse(gearSetsFileSchema, raw.gearSets ?? [], 'gear_sets.yaml');
  const errors: string[] = [];

  const unique = <T extends { id: string }>(list: T[], file: string) => {
    const map: Record<string, T> = {};
    for (const x of list) {
      if (map[x.id]) errors.push(`${file} : identifiant en double « ${x.id} »`);
      map[x.id] = x;
    }
    return map;
  };
  const professionMap = unique(professions, 'professions.yaml');
  const items = unique(itemList, 'items.yaml');
  const recipes = unique(
    raw.recipes.flatMap(([file, data]) => parse(recipesFileSchema, data, file)),
    'recipes/',
  );

  for (const item of itemList) {
    if (item.tool && !professionMap[item.tool.profession]) {
      errors.push(`items.yaml : ${item.id} est l'outil d'un métier inconnu « ${item.tool.profession} »`);
    }
  }
  for (const item of itemList) {
    if (!item.repair) continue;
    if (!item.tool?.durabilityHours) errors.push(`items.yaml : ${item.id} a une réparation mais ne s'use pas`);
    if (!professionMap[item.repair.profession]) errors.push(`items.yaml : réparation de ${item.id} : métier inconnu « ${item.repair.profession} »`);
    for (const m of item.repair.materials) if (!items[m.item]) errors.push(`items.yaml : réparation de ${item.id} : objet inconnu « ${m.item} »`);
  }
  for (const r of Object.values(recipes)) {
    const profession = professionMap[r.profession];
    if (!profession) errors.push(`recette ${r.id} : métier inconnu « ${r.profession} »`);
    else if (!profession.categories.some((c) => c.id === r.category)) {
      errors.push(`recette ${r.id} : catégorie « ${r.category} » absente du métier ${r.profession}`);
    }
    if (r.level > settings.xp.maxLevel) errors.push(`recette ${r.id} : niveau au-delà du maximum`);
    for (const s of [...r.inputs, ...r.outputs]) {
      if (!items[s.item]) errors.push(`recette ${r.id} : objet inconnu « ${s.item} »`);
    }
  }

  // Épreuves : triées par métier puis par palier, une seule par palier.
  const trials = unique(
    [...trialList].sort((a, b) => a.profession.localeCompare(b.profession) || a.rank - b.rank),
    'trials.yaml',
  );
  const ranks = new Set<string>();
  for (const t of trialList) {
    if (!professionMap[t.profession]) errors.push(`épreuve ${t.id} : métier inconnu « ${t.profession} »`);
    if (!settings.ranks.levels.includes(t.rank)) {
      errors.push(`commande ${t.id} : le niveau ${t.rank} n'est pas un palier de rang (settings.ranks.levels)`);
    }
    const key = `${t.profession}/${t.rank}`;
    if (ranks.has(key)) errors.push(`épreuve ${t.id} : deux épreuves pour ${key}`);
    ranks.add(key);
    for (const s of t.tasks) if (!items[s.item]) errors.push(`épreuve ${t.id} : objet inconnu « ${s.item} »`);
  }
  for (const r of Object.values(recipes)) {
    if (!r.trial) continue;
    const t = trials[r.trial];
    if (!t) errors.push(`recette ${r.id} : épreuve inconnue « ${r.trial} »`);
    else if (t.profession !== r.profession) errors.push(`recette ${r.id} : l'épreuve ${t.id} est d'un autre métier`);
  }
  const npcOrders = unique(npcOrderList, 'npc_orders.yaml');
  for (const o of npcOrderList) {
    if (!professionMap[o.profession]) errors.push(`npc_orders.yaml : ${o.id} est d'un métier inconnu « ${o.profession} »`);
    for (const s of o.items) if (!items[s.item]) errors.push(`npc_orders.yaml : ${o.id} demande un objet inconnu « ${s.item} »`);
  }
  const buildings = unique(buildingList, 'buildings.yaml');
  for (const b of buildingList) {
    for (const p of b.boost.professions) if (p !== 'all' && !professionMap[p]) errors.push(`buildings.yaml : ${b.id} améliore un métier inconnu « ${p} »`);
    for (const s of b.base.items) if (!items[s.item]) errors.push(`buildings.yaml : ${b.id} demande un objet inconnu « ${s.item} »`);
  }
  const ornaments = unique(
    [...ornamentList].sort((a, b) => a.profession.localeCompare(b.profession) || a.rank - b.rank),
    'ornaments.yaml',
  );
  for (const o of ornamentList) {
    if (!professionMap[o.profession]) errors.push(`ornaments.yaml : ${o.id} est d'un métier inconnu « ${o.profession} »`);
    if (o.reserved !== !o.trial) errors.push(`ornaments.yaml : ${o.id} doit avoir soit une commande (trial), soit reserved: true`);
    const t = o.trial ? trials[o.trial] : undefined;
    if (o.trial && !t) errors.push(`ornaments.yaml : ${o.id} : commande inconnue « ${o.trial} »`);
    else if (t && (t.profession !== o.profession || t.rank !== o.rank)) errors.push(`ornaments.yaml : ${o.id} : la commande ${t.id} est d'un autre métier ou palier`);
  }
  const classes = unique(classList, 'classes.yaml');
  unique(cosmetics.outfits, 'cosmetics.yaml');
  for (const c of classList) {
    if (!professionMap[c.profession]) errors.push(`classes.yaml : ${c.id} est liée à un métier inconnu « ${c.profession} »`);
    if (!cosmetics.outfits.some((o) => o.id === c.startingOutfit)) {
      errors.push(`classes.yaml : tenue de départ inconnue « ${c.startingOutfit} » pour ${c.id}`);
    }
  }
  if (!classes[cosmetics.default.class]) errors.push(`cosmetics.yaml : classe par défaut inconnue « ${cosmetics.default.class} »`);
  if (!cosmetics.outfits.some((o) => o.id === cosmetics.default.outfit)) {
    errors.push(`cosmetics.yaml : tenue par défaut inconnue « ${cosmetics.default.outfit} »`);
  }
  const gearSlots = unique(gearSlotList, 'gear_slots.yaml');
  const gearSets = unique(gearSetList, 'gear_sets.yaml');
  const gearModels = unique(gearList, 'gear.yaml');
  for (const m of gearList) {
    const slot = gearSlots[m.slot];
    if (!slot) errors.push(`gear.yaml : ${m.id} est sur un emplacement inconnu « ${m.slot} »`);
    else if (slot.kind !== m.kind) errors.push(`gear.yaml : ${m.id} est « ${m.kind} » mais l'emplacement ${m.slot} est « ${slot.kind} »`);
    for (const c of m.classes) if (!classes[c]) errors.push(`gear.yaml : ${m.id} est réservé à une classe inconnue « ${c} »`);
    if (m.set && !gearSets[m.set]) errors.push(`gear.yaml : ${m.id} appartient à un ensemble inconnu « ${m.set} »`);
    if (m.rolls[0] > m.rolls[1]) errors.push(`gear.yaml : ${m.id} : rolls min > max`);
    const pool = gearPools.pools[m.slot];
    if (!pool) errors.push(`gear.yaml : ${m.id} : pas de lignes aléatoires pour l'emplacement ${m.slot} (gear_pools.yaml)`);
    else if (m.rolls[1] + 1 > pool.length) errors.push(`gear.yaml : ${m.id} : ${m.rolls[1]} lignes tirées (+1 de chef-d'œuvre) mais l'emplacement ${m.slot} n'en propose que ${pool.length}`);
    if (!(String(m.tier) in gearPools.tierScale)) errors.push(`gear.yaml : ${m.id} : palier ${m.tier} absent de gear_pools.yaml (tierScale)`);
  }
  for (const s of gearSetList) {
    if (s.class && !classes[s.class]) errors.push(`gear_sets.yaml : ${s.id} : classe inconnue « ${s.class} »`);
    if (gearList.filter((m) => m.set === s.id).length < 4) errors.push(`gear_sets.yaml : l'ensemble ${s.id} a moins de 4 pièces`);
  }
  if (gearList.length) {
    for (const c of classList) {
      const set = gearList.filter((m) => m.starter && m.classes.includes(c.id));
      if (!set.some((m) => m.slot === 'weapon') || !set.some((m) => m.slot === 'torso')) errors.push(`gear.yaml : la classe ${c.id} n'a pas de set de départ (au moins une arme et un torse)`);
    }
    for (const m of gearList.filter((x) => x.starter)) {
      if (m.rarity !== 'common' || m.rolls[1] !== 0) errors.push(`gear.yaml : ${m.id} : une pièce de départ est Commune, sans ligne aléatoire`);
      if (!m.bound) errors.push(`gear.yaml : ${m.id} : une pièce de départ est liée au personnage`);
    }
  }
  let combat: Content['combat'] = null;
  if (raw.combat) {
    const built = buildCombatContent(raw.combat, Object.keys(classes));
    errors.push(...built.errors);
    combat = built.combat;
    const tide = combat?.tide;
    if (tide) {
      if (!items[tide.shards.item]) errors.push(`combat/tide.yaml : objet des éclats inconnu « ${tide.shards.item} » (items.yaml)`);
      for (const t of tide.tides) for (const w of t.work.items) if (!items[w.item]) errors.push(`combat/tide.yaml : ${t.id} : objet demandé inconnu « ${w.item} »`);
      for (const x of tide.shop) if (!cosmetics.outfits.some((o) => o.id === x.outfit)) errors.push(`combat/tide.yaml : ${x.id} : tenue inconnue « ${x.outfit} »`);
    }
    for (const e of Object.values(combat?.encounters ?? {})) {
      if (e.loot?.vestige && !items[e.loot.vestige]) errors.push(`combat/encounters.yaml : ${e.id} : vestige inconnu « ${e.loot.vestige} » (items.yaml)`);
    }
    for (const m of gearList) if (m.talent && !combat?.talents?.named.some((n) => n.id === m.talent)) errors.push(`gear.yaml : ${m.id} : talent nommé inconnu « ${m.talent} »`);
    for (const it of itemList) if (it.gem && !combat?.tools.some((t) => t.id === it.gem && t.rank === 'gem')) errors.push(`items.yaml : ${it.id} : gemme inconnue « ${it.gem} » (combat/tools.yaml, rang gem)`);
  }
  if (errors.length) throw new ContentError(`Données incohérentes :\n- ${errors.join('\n- ')}`);

  return { settings, professions, items, recipes, trials, npcOrders, buildings, ornaments, classes, cosmetics, gearSlots, gearPools, gearModels, gearSets, combat, xpTable: buildXpTable(settings.xp.maxLevel) };
}

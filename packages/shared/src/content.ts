import { z } from 'zod';
import {
  type Content,
  itemsFileSchema,
  professionsFileSchema,
  recipesFileSchema,
  npcOrdersFileSchema,
  settingsSchema,
  trialsFileSchema,
} from './schemas/content.js';
import { classesFileSchema, cosmeticsFileSchema } from './schemas/art.js';
import { buildXpTable } from './formulas/xp.js';

export class ContentError extends Error {}

export interface RawContent {
  settings: unknown;
  professions: unknown;
  items: unknown;
  classes: unknown;
  cosmetics: unknown;
  trials: unknown;
  npcOrders: unknown;
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
    if (!settings.titles.some((title) => title.level === t.rank)) {
      errors.push(`épreuve ${t.id} : le niveau ${t.rank} n'est pas un palier de titre`);
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
  if (errors.length) throw new ContentError(`Données incohérentes :\n- ${errors.join('\n- ')}`);

  return { settings, professions, items, recipes, trials, npcOrders, classes, cosmetics, xpTable: buildXpTable(settings.xp.maxLevel) };
}

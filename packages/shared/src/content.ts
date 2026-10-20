import { z } from 'zod';
import {
  type Content,
  itemsFileSchema,
  professionsFileSchema,
  recipesFileSchema,
  settingsSchema,
} from './schemas/content.js';
import { buildXpTable } from './formulas/xp.js';

export class ContentError extends Error {}

export interface RawContent {
  settings: unknown;
  professions: unknown;
  items: unknown;
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
  if (errors.length) throw new ContentError(`Données incohérentes :\n- ${errors.join('\n- ')}`);

  return { settings, professions, items, recipes, xpTable: buildXpTable(settings.xp.maxLevel) };
}

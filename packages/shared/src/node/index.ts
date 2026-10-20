import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { buildContent } from '../content.js';
import type { Content } from '../schemas/content.js';

/** Charge et valide `data/` (serveur, simulateur, tests). Lève une ContentError lisible. */
export function loadContent(dataDir: string): Content {
  const read = (file: string): unknown => parse(readFileSync(join(dataDir, file), 'utf8'));
  const recipeFiles = readdirSync(join(dataDir, 'recipes'))
    .filter((f) => f.endsWith('.yaml'))
    .sort();
  return buildContent({
    settings: read('settings.yaml'),
    professions: read('professions.yaml'),
    items: read('items.yaml'),
    recipes: recipeFiles.map((f) => [`recipes/${f}`, read(join('recipes', f))]),
  });
}

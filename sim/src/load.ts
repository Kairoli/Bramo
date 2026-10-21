import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import { type Content, type RawContent, buildContent } from '@bramo/shared';
import { readRawContent } from '@bramo/shared/node';

export const ROOT = fileURLToPath(new URL('../..', import.meta.url));
export const DATA_DIR = join(ROOT, 'data');
export const PROPOSALS_DIR = join(ROOT, 'sim', 'proposals');

/** Copie profonde + fusion d'objets (les tableaux sont remplacés, pas fusionnés). */
export function deepMerge<T>(base: T, patch: unknown): T {
  if (patch === undefined) return structuredClone(base);
  if (typeof base !== 'object' || base === null || Array.isArray(base) || typeof patch !== 'object' || patch === null || Array.isArray(patch)) {
    return structuredClone(patch) as T;
  }
  const out: Record<string, unknown> = structuredClone(base) as Record<string, unknown>;
  for (const [k, v] of Object.entries(patch)) out[k] = deepMerge(out[k], v);
  return out as T;
}

/**
 * Une proposition est un dossier de `sim/proposals/` qui remplace tout ou partie de `data/` :
 * - `settings.yaml` est fusionné avec celui de `data/` (on n'écrit que ce qui change) ;
 * - `professions.yaml`, `items.yaml`, `trials.yaml` remplacent ceux de `data/` s'ils existent ;
 * - un dossier `recipes/` remplace toutes les recettes.
 * Le résultat passe par la même validation que le serveur (`buildContent`).
 */
export function readProposalRaw(name: string): RawContent {
  const dir = join(PROPOSALS_DIR, name);
  if (!existsSync(dir)) throw new Error(`Proposition inconnue : ${name}`);
  const raw = readRawContent(DATA_DIR);
  const read = (file: string): unknown => parse(readFileSync(join(dir, file), 'utf8'));
  if (existsSync(join(dir, 'settings.yaml'))) raw.settings = deepMerge(raw.settings, read('settings.yaml'));
  for (const key of ['professions', 'items', 'trials'] as const) {
    if (existsSync(join(dir, `${key}.yaml`))) raw[key] = read(`${key}.yaml`);
  }
  if (existsSync(join(dir, 'recipes'))) {
    raw.recipes = readdirSync(join(dir, 'recipes'))
      .filter((f) => f.endsWith('.yaml'))
      .sort()
      .map((f) => [`${name}/recipes/${f}`, read(join('recipes', f))]);
  }
  return raw;
}

/** Données du jeu actuelles, ou une proposition, avec d'éventuels réglages modifiés en plus. */
export function loadVariant(proposal?: string, settingsPatch?: unknown): Content {
  const raw = proposal ? readProposalRaw(proposal) : readRawContent(DATA_DIR);
  if (settingsPatch) raw.settings = deepMerge(raw.settings, settingsPatch);
  return buildContent(raw);
}

/** Paramètres propres au simulateur (usure, demande…) qui n'existent pas encore dans le jeu. */
export function readProposalFile<T = unknown>(proposal: string, file: string): T {
  return parse(readFileSync(join(PROPOSALS_DIR, proposal, file), 'utf8')) as T;
}

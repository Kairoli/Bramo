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
  // Les commandes PNJ de data/ parlent d'objets que la proposition peut ne pas avoir : le simulateur n'en a pas besoin.
  raw.npcOrders = [];
  raw.buildings = [];
  // Les ornements de data/ renvoient aux commandes des maîtres de data/, que la proposition peut remplacer.
  raw.ornaments = [];
  const read = (file: string): unknown => parse(readFileSync(join(dir, file), 'utf8'));
  if (existsSync(join(dir, 'settings.yaml'))) raw.settings = deepMerge(raw.settings, read('settings.yaml'));
  // Les vestiges (butin de combat) restent ceux de data/ : les rencontres y renvoient et aucune recette ne les produit.
  const vestiges = (raw.items as { category?: string }[]).filter((i) => i.category === 'vestige');
  for (const key of ['professions', 'items', 'trials', 'gear'] as const) {
    if (existsSync(join(dir, `${key}.yaml`))) raw[key] = read(`${key}.yaml`);
  }
  const items = raw.items as { id: string }[];
  for (const v of vestiges as { id: string }[]) if (!items.some((i) => i.id === v.id)) items.push(v);
  if (existsSync(join(dir, 'gear_pools.yaml'))) raw.gearPools = read('gear_pools.yaml');
  if (existsSync(join(dir, 'gear_sets.yaml'))) raw.gearSets = read('gear_sets.yaml');
  if (existsSync(join(dir, 'combat.yaml'))) raw.combat = patchCombat(raw.combat, read('combat.yaml') as CombatPatch);
  // Une proposition qui remplace les objets ou les rencontres ne connaît pas ceux de la Marée du soir : elle se joue sans.
  if ((existsSync(join(dir, 'items.yaml')) || existsSync(join(dir, 'combat.yaml'))) && raw.combat) delete (raw.combat as { tide?: unknown }).tide;
  // De même pour la fabrication de l'équipement, qui nomme des matières de data/.
  if (existsSync(join(dir, 'items.yaml'))) delete raw.gearCrafting;
  // Et pour les ouvrages du clan.
  if (existsSync(join(dir, 'items.yaml'))) delete raw.clanWorks;
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

/**
 * Modifications d'une proposition sur `data/combat/` (fichier `combat.yaml` d'une proposition) : on n'écrit que ce qui change.
 * - `rules` : fusionné avec rules.yaml ;
 * - `classes.<id>.params` et `paths.<id>.params` : paramètres de mécanique ou de passif fusionnés ;
 * - `spells.<id>` : champs d'un sort fusionnés ;
 * - `plans.<id>.levels.<niveau>` : répertoire du plan remplacé pour ce niveau.
 */
export interface CombatPatch {
  note?: string;
  rules?: Record<string, unknown>;
  classes?: Record<string, { params?: Record<string, number> }>;
  paths?: Record<string, { params?: Record<string, number> }>;
  spells?: Record<string, Record<string, unknown>>;
  plans?: Record<string, { levels?: Record<string, unknown[]> }>;
  /** Plans ajoutés (même format que plans.yaml), par exemple les plans conseillés trouvés par `sim combat-search`. */
  addPlans?: unknown[];
  /** Rencontres : `encounters` remplace toute la liste, `addEncounters` en ajoute. */
  encounters?: unknown[];
  addEncounters?: unknown[];
}

type RawCombatFiles = NonNullable<RawContent['combat']>;
interface RawKit {
  id: string;
  params: Record<string, number>;
  paths: { id: string; params: Record<string, number> }[];
}

export function patchCombat(base: RawCombatFiles | undefined, patch: CombatPatch): RawCombatFiles {
  if (!base) throw new Error('data/combat/ absent : rien à modifier');
  const out = structuredClone(base);
  const fail = (what: string): never => {
    throw new Error(`combat.yaml : ${what} inconnu`);
  };
  if (patch.rules) out.rules = deepMerge(out.rules, patch.rules);
  const kits = (out.kits as { classes: RawKit[] }).classes;
  for (const [id, p] of Object.entries(patch.classes ?? {})) {
    const k = kits.find((x) => x.id === id) ?? fail(`classe « ${id} »`);
    k.params = { ...k.params, ...p.params };
  }
  for (const [id, p] of Object.entries(patch.paths ?? {})) {
    const path = kits.flatMap((k) => k.paths).find((x) => x.id === id) ?? fail(`voie « ${id} »`);
    path.params = { ...path.params, ...p.params };
  }
  const spells = out.spells as { id: string }[];
  for (const [id, p] of Object.entries(patch.spells ?? {})) Object.assign(spells.find((s) => s.id === id) ?? fail(`sort « ${id} »`), p);
  const plans = (out.plans ?? []) as { id: string; levels: Record<string, unknown[]> }[];
  for (const [id, p] of Object.entries(patch.plans ?? {})) {
    const plan = plans.find((x) => x.id === id) ?? fail(`plan « ${id} »`);
    plan.levels = { ...plan.levels, ...p.levels };
  }
  if (patch.addPlans) out.plans = [...plans, ...structuredClone(patch.addPlans)];
  if (patch.encounters) out.encounters = structuredClone(patch.encounters);
  if (patch.addEncounters) out.encounters = [...((out.encounters ?? []) as unknown[]), ...structuredClone(patch.addEncounters)];
  return out;
}

/** Paramètres propres au simulateur (usure, demande…) qui n'existent pas encore dans le jeu. */
export function readProposalFile<T = unknown>(proposal: string, file: string): T {
  return parse(readFileSync(join(PROPOSALS_DIR, proposal, file), 'utf8')) as T;
}

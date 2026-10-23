import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { z } from 'zod';
import { ContentError, type RawContent, buildContent } from '../content.js';
import type { Content } from '../schemas/content.js';
import {
  type Animation,
  type PartManifest,
  type Pose,
  type Rig,
  animationSchema,
  partManifestSchema,
  poseSchema,
  rigSchema,
  slots,
} from '../schemas/art.js';

/** Lit les fichiers YAML de `data/` sans les valider (le simulateur les modifie avant `buildContent`). */
export function readRawContent(dataDir: string): RawContent {
  const read = (file: string): unknown => parse(readFileSync(join(dataDir, file), 'utf8'));
  const recipeFiles = readdirSync(join(dataDir, 'recipes'))
    .filter((f) => f.endsWith('.yaml'))
    .sort();
  return {
    settings: read('settings.yaml'),
    professions: read('professions.yaml'),
    items: read('items.yaml'),
    classes: read('classes.yaml'),
    cosmetics: read('cosmetics.yaml'),
    trials: read('trials.yaml'),
    buildings: existsSync(join(dataDir, 'buildings.yaml')) ? read('buildings.yaml') : [],
    ...(existsSync(join(dataDir, 'clan_works.yaml')) ? { clanWorks: read('clan_works.yaml') } : {}),
    ornaments: existsSync(join(dataDir, 'ornaments.yaml')) ? read('ornaments.yaml') : [],
    npcOrders: existsSync(join(dataDir, 'npc_orders.yaml')) ? read('npc_orders.yaml') : [],
    gear: existsSync(join(dataDir, 'gear.yaml')) ? read('gear.yaml') : [],
    gearSlots: existsSync(join(dataDir, 'gear_slots.yaml')) ? read('gear_slots.yaml') : [],
    gearPools: existsSync(join(dataDir, 'gear_pools.yaml')) ? read('gear_pools.yaml') : undefined,
    gearSets: existsSync(join(dataDir, 'gear_sets.yaml')) ? read('gear_sets.yaml') : [],
    ...(existsSync(join(dataDir, 'gear_crafting.yaml')) ? { gearCrafting: read('gear_crafting.yaml') } : {}),
    combat: existsSync(join(dataDir, 'combat', 'rules.yaml'))
      ? {
          rules: read('combat/rules.yaml'),
          kits: read('combat/kits.yaml'),
          spells: read('combat/spells.yaml'),
          plans: existsSync(join(dataDir, 'combat', 'plans.yaml')) ? read('combat/plans.yaml') : [],
          encounters: existsSync(join(dataDir, 'combat', 'encounters.yaml')) ? read('combat/encounters.yaml') : [],
          ...(existsSync(join(dataDir, 'combat', 'talents.yaml')) ? { talents: read('combat/talents.yaml') } : {}),
          tools: existsSync(join(dataDir, 'combat', 'tools.yaml')) ? read('combat/tools.yaml') : [],
          ...(existsSync(join(dataDir, 'combat', 'tide.yaml')) ? { tide: read('combat/tide.yaml') } : {}),
        }
      : undefined,
    recipes: recipeFiles.map((f) => [`recipes/${f}`, read(join('recipes', f))]),
  };
}

/** Charge et valide `data/` (serveur, simulateur, tests). Lève une ContentError lisible. */
export function loadContent(dataDir: string, artDir?: string): Content {
  const content = buildContent(readRawContent(dataDir));
  if (artDir) checkArtReferences(content, loadArt(artDir));
  return content;
}

export interface ArtBundle {
  rig: Rig;
  parts: PartManifest[];
  animations: Animation[];
  poses: Pose[];
}

function parseJson<T>(schema: z.ZodType<T>, file: string): T {
  const result = schema.safeParse(JSON.parse(readFileSync(file, 'utf8')));
  if (!result.success) throw new ContentError(`${file} invalide :\n${z.prettifyError(result.error)}`);
  return result.data;
}

/** Charge et valide `art/` : gabarit, manifestes de pièces, animations. */
export function loadArt(artDir: string): ArtBundle {
  const rig = parseJson(rigSchema, join(artDir, 'rig', 'humanoid.json'));
  const bones = new Set(rig.bones.map((b) => b.id));
  const errors: string[] = [];
  for (const b of rig.bones) if (b.parent && !bones.has(b.parent)) errors.push(`os ${b.id} : parent inconnu ${b.parent}`);

  const parts: PartManifest[] = [];
  for (const slot of slots) {
    const dir = join(artDir, 'parts', slot);
    if (!existsSync(dir)) continue;
    for (const file of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
      const part = parseJson(partManifestSchema, join(dir, file));
      if (part.slot !== slot) errors.push(`parts/${slot}/${file} : emplacement déclaré « ${part.slot} »`);
      if (`${part.id}.json` !== file) errors.push(`parts/${slot}/${file} : identifiant « ${part.id} »`);
      const svgPath = join(dir, `${part.id}.svg`);
      if (!existsSync(svgPath)) errors.push(`parts/${slot}/${part.id}.svg manquant`);
      else {
        const svg = readFileSync(svgPath, 'utf8');
        for (const l of part.layers) {
          if (!svg.includes(`<g id="${l.id}"`)) errors.push(`parts/${slot}/${part.id}.svg : calque « ${l.id} » absent`);
        }
        // « -- » est interdit dans un commentaire XML : le navigateur refuserait tout le fichier.
        for (const c of svg.match(/<!--([\s\S]*?)-->/g) ?? []) {
          if (c.slice(4, -3).includes('--')) errors.push(`parts/${slot}/${part.id}.svg : « -- » dans un commentaire`);
        }
      }
      for (const l of part.layers) if (!bones.has(l.bone)) errors.push(`parts/${slot}/${file} : os inconnu « ${l.bone} »`);
      parts.push(part);
    }
  }

  const animDir = join(artDir, 'rig', 'animations');
  const animations = readdirSync(animDir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => parseJson(animationSchema, join(animDir, f)));
  for (const a of animations) {
    for (const b of Object.keys(a.bones)) if (!bones.has(b)) errors.push(`animation ${a.id} : os inconnu « ${b} »`);
  }

  const poseDir = join(artDir, 'rig', 'poses');
  const poses = readdirSync(poseDir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => parseJson(poseSchema, join(poseDir, f)));
  for (const p of poses) {
    for (const b of Object.keys(p.bones)) if (!bones.has(b)) errors.push(`pose ${p.id} : os inconnu « ${b} »`);
    if (!animations.some((a) => a.id === p.animation)) errors.push(`pose ${p.id} : animation inconnue « ${p.animation} »`);
    if (!parts.some((part) => part.slot === 'body' && part.id === p.body)) errors.push(`pose ${p.id} : corps inconnu « ${p.body} »`);
  }
  if (errors.length) throw new ContentError(`art/ incohérent :\n- ${errors.join('\n- ')}`);
  return { rig, parts, animations, poses };
}

/** Vérifie que les tenues et classes de data/ pointent vers des pièces existantes. */
function checkArtReferences(content: Content, art: ArtBundle): void {
  const has = (slot: string, id: string) => art.parts.some((p) => p.slot === slot && p.id === id);
  const errors: string[] = [];
  for (const o of content.cosmetics.outfits) {
    for (const [slot, id] of Object.entries(o.parts)) {
      if (!has(slot, id)) errors.push(`tenue ${o.id} : pièce introuvable art/parts/${slot}/${id}`);
    }
  }
  for (const c of Object.values(content.classes)) {
    if (c.weapon && !has('weapon', c.weapon)) errors.push(`classe ${c.id} : arme introuvable « ${c.weapon} »`);
    if (c.effect && !has('effect', c.effect)) errors.push(`classe ${c.id} : effet introuvable « ${c.effect} »`);
    if (!art.poses.some((p) => p.id === c.pose)) errors.push(`classe ${c.id} : pose introuvable art/rig/poses/${c.pose}`);
  }
  if (errors.length) throw new ContentError(`Références vers art/ cassées :\n- ${errors.join('\n- ')}`);
}

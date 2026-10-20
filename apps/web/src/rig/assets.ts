import { type Animation, type PartManifest, animationSchema, partManifestSchema, rigSchema } from '@bramo/shared';
import rigJson from '../../../../art/rig/humanoid.json';

/**
 * Pièces et gabarit des personnages, lus depuis art/ au moment du build (Vite).
 * Chaque pièce : un manifeste JSON (os, ordre, détail) + un SVG dont les <g id> sont les calques.
 */

const manifestFiles = import.meta.glob('../../../../art/parts/*/*.json', { eager: true, import: 'default' });
const svgFiles = import.meta.glob('../../../../art/parts/*/*.svg', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;
const animationFiles = import.meta.glob('../../../../art/rig/animations/*.json', { eager: true, import: 'default' });

export const rig = rigSchema.parse(rigJson);

export interface LoadedPart extends PartManifest {
  /** Contenu SVG de chaque calque, indexé par l'id du <g>. */
  markup: Record<string, string>;
}

function parseLayers(svg: string): Record<string, string> {
  const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
  const error = doc.querySelector('parsererror');
  if (error) throw new Error(`SVG invalide : ${error.textContent}`);
  const layers: Record<string, string> = {};
  for (const g of Array.from(doc.documentElement.children)) {
    if (g.tagName === 'g' && g.id) layers[g.id] = g.innerHTML;
  }
  return layers;
}

/** Pièces indexées par « emplacement/id ». */
export const parts: Record<string, LoadedPart> = {};
for (const [path, json] of Object.entries(manifestFiles)) {
  const manifest = partManifestSchema.parse(json);
  const svg = svgFiles[path.replace(/\.json$/, '.svg')];
  if (!svg) throw new Error(`SVG manquant pour ${path}`);
  const markup = parseLayers(svg);
  for (const layer of manifest.layers) {
    if (!(layer.id in markup)) throw new Error(`${path} : calque « ${layer.id} » absent du SVG`);
  }
  parts[`${manifest.slot}/${manifest.id}`] = { ...manifest, markup };
}

export const animations: Record<string, Animation> = {};
for (const json of Object.values(animationFiles)) {
  const anim = animationSchema.parse(json);
  animations[anim.id] = anim;
}

export function partsInSlot(slot: string): LoadedPart[] {
  return Object.values(parts).filter((p) => p.slot === slot);
}

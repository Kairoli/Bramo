import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { loadArt, loadContent } from '../src/node/index.js';

const dataDir = fileURLToPath(new URL('../../../data', import.meta.url));
const artDir = fileURLToPath(new URL('../../../art', import.meta.url));

describe('data/', () => {
  const content = loadContent(dataDir, artDir);

  it('se charge et se valide', () => {
    expect(content.professions).toHaveLength(14);
  });

  it('chaque métier jouable a 5 à 6 recettes', () => {
    for (const p of content.professions.filter((p) => p.status === 'playable')) {
      const count = Object.values(content.recipes).filter((r) => r.profession === p.id).length;
      expect(count, p.id).toBeGreaterThanOrEqual(5);
      expect(count, p.id).toBeLessThanOrEqual(6);
    }
  });

  it('art/ est cohérent et les tenues pointent vers des pièces existantes', () => {
    const art = loadArt(artDir);
    expect(art.rig.bones.length).toBeGreaterThan(15);
    expect(art.animations.map((a) => a.id)).toContain('idle');
    // Au moins une tenue change de forme, pas seulement de couleurs.
    const shapes = new Set(content.cosmetics.outfits.map((o) => JSON.stringify(o.parts)));
    expect(shapes.size).toBeGreaterThan(1);
  });

  it('chaque ingrédient peut être obtenu (recette ou marchand)', () => {
    const produced = new Set(Object.values(content.recipes).flatMap((r) => r.outputs.map((o) => o.item)));
    for (const r of Object.values(content.recipes)) {
      for (const i of r.inputs) {
        expect(produced.has(i.item) || content.items[i.item]?.shopPrice !== undefined, `${r.id} → ${i.item}`).toBe(true);
      }
    }
  });
});

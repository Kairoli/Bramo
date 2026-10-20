import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/node/index.js';

const dataDir = fileURLToPath(new URL('../../../data', import.meta.url));

describe('data/', () => {
  const content = loadContent(dataDir);

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

  it('chaque ingrédient peut être obtenu (recette ou marchand)', () => {
    const produced = new Set(Object.values(content.recipes).flatMap((r) => r.outputs.map((o) => o.item)));
    for (const r of Object.values(content.recipes)) {
      for (const i of r.inputs) {
        expect(produced.has(i.item) || content.items[i.item]?.shopPrice !== undefined, `${r.id} → ${i.item}`).toBe(true);
      }
    }
  });
});

import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { loadArt, loadContent } from '../src/node/index.js';

const dataDir = fileURLToPath(new URL('../../../data', import.meta.url));
const artDir = fileURLToPath(new URL('../../../art', import.meta.url));

describe('data/', () => {
  const content = loadContent(dataDir, artDir);

  it('se charge et se valide', () => {
    expect(content.professions).toHaveLength(17);
  });

  it('chaque métier jouable a au moins 5 recettes (hors chefs-d’œuvre) et ses épreuves de maître', () => {
    for (const p of content.professions.filter((p) => p.status === 'playable')) {
      const count = Object.values(content.recipes).filter((r) => r.profession === p.id && !r.trial).length;
      expect(Object.values(content.trials).filter((t) => t.profession === p.id).length, p.id).toBeGreaterThanOrEqual(2);
      expect(count, p.id).toBeGreaterThanOrEqual(5);
    }
  });

  it('chaque métier jouable a un outil, et les recettes ne visent que des métiers jouables', () => {
    const playable = new Set(content.professions.filter((p) => p.status === 'playable').map((p) => p.id));
    for (const id of playable) expect(Object.values(content.items).some((i) => i.tool?.profession === id), id).toBe(true);
    for (const r of Object.values(content.recipes)) expect(playable.has(r.profession), r.id).toBe(true);
  });

  it('art/ est cohérent et les tenues pointent vers des pièces existantes', () => {
    const art = loadArt(artDir);
    expect(art.rig.bones.length).toBeGreaterThan(15);
    expect(art.animations.map((a) => a.id)).toContain('idle');
    // Au moins une tenue change de forme, pas seulement de couleurs.
    const shapes = new Set(content.cosmetics.outfits.map((o) => JSON.stringify(o.parts)));
    expect(shapes.size).toBeGreaterThan(1);
  });

  it('chaque classe peut porter sa tenue de départ, et chaque tenue a une classe valide', () => {
    for (const c of Object.values(content.classes)) {
      const outfit = content.cosmetics.outfits.find((o) => o.id === c.startingOutfit);
      expect(outfit, `${c.id} → ${c.startingOutfit}`).toBeDefined();
      expect(outfit!.classes, c.startingOutfit).toContain(c.id);
      expect(outfit!.locked, c.startingOutfit).toBeUndefined();
    }
    for (const o of content.cosmetics.outfits) for (const cl of o.classes) expect(content.classes[cl], `${o.id} → ${cl}`).toBeDefined();
  });

  it('chaque ingrédient et chaque objet d’épreuve peut être obtenu (recette)', () => {
    const produced = new Set(Object.values(content.recipes).flatMap((r) => r.outputs.map((o) => o.item)));
    const obtainable = (item: string) => produced.has(item);
    for (const r of Object.values(content.recipes)) {
      for (const i of r.inputs) expect(obtainable(i.item), `${r.id} → ${i.item}`).toBe(true);
    }
    for (const t of Object.values(content.trials)) {
      for (const i of t.tasks) expect(obtainable(i.item), `${t.id} → ${i.item}`).toBe(true);
    }
  });

  it('chaque classe a sa pose, sa tenue de départ et une animation de repos', () => {
    const art = loadArt(artDir);
    for (const c of Object.values(content.classes)) {
      const pose = art.poses.find((p) => p.id === c.pose);
      expect(pose, c.id).toBeDefined();
      expect(art.animations.some((a) => a.id === pose!.animation), c.id).toBe(true);
    }
    // Les classes terminées ne se ressemblent pas au départ : tenue et pose différentes.
    const finished = Object.values(content.classes).filter((c) => c.weapon);
    expect(new Set(finished.map((c) => c.startingOutfit)).size).toBe(finished.length);
    expect(new Set(finished.map((c) => c.pose)).size).toBe(finished.length);
  });
});

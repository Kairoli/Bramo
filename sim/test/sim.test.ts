import { describe, expect, it } from 'vitest';
import { gatherer, runBot } from '../src/bot.js';
import { calibrate } from '../src/calibrate.js';
import { bundleCost, consumableRatios, unitCost } from '../src/chains.js';
import { loadVariant } from '../src/load.js';
import { profile } from '../src/profiles.js';
import { proposalOptions } from '../src/scenarios/chains.js';
import { presenceMatrix } from '../src/scenarios/presence.js';

describe('données du jeu (data/)', () => {
  const content = loadVariant();

  it('la progression est bien plus lente que le prototype (Minage 60 en ~1 jour, 90 en 18 jours)', () => {
    const r = runBot(content, profile('regular2h'), gatherer('mining'), { days: 40, track: { skill: 'mining', levels: [30, 60] } });
    expect(r.levelDay[30]).toBeLessThan(3);
    expect(r.levelDay[60]).toBeGreaterThan(10);
    expect(r.levelDay[60]).toBeLessThan(30);
  });

  it('suit les règles d’équilibrage (calibrate ne change rien)', () => {
    expect(calibrate(null, false)).toEqual([]);
  });

  it('chaque repas rapporte entre 1,5 et 2,5 fois son coût de chaîne', () => {
    for (const r of consumableRatios(content)) {
      expect(r.payback, r.item).toBeGreaterThan(1.5);
      expect(r.payback, r.item).toBeLessThan(2.5);
    }
  });
});

describe('présence', () => {
  const m = Object.fromEntries(presenceMatrix(4).map((r) => [r.id, r.eff]));

  it('à 100 % avec 16 h d’autonomie, le téléphone et l’onglet visible font jeu égal', () => {
    expect(m.decided!.mobile).toBeCloseTo(m.decided!.tab16h!, 1);
    expect(m.decided!.tab24h! / m.decided!.casu20!).toBeLessThan(1.6);
  });

  it('les coups de fouet ajoutent une demi-heure effective par jour', () => {
    expect(m.decided!.regular2h! - m.h100_16!.regular2h!).toBeCloseTo(0.5, 1);
  });
});

describe('proposition boucle-v0', () => {
  const content = loadVariant('boucle-v0');
  const opts = proposalOptions('boucle-v0');

  it('se valide comme des données du jeu', () => {
    expect(Object.keys(content.recipes).length).toBeGreaterThan(80);
  });

  it('les XP, valeurs et durées de repas suivent les règles (calibrate ne change rien)', () => {
    expect(calibrate('boucle-v0', false)).toEqual([]);
  });

  it('tout objet fabriqué a une chaîne complète, sans dépendance circulaire', () => {
    for (const r of Object.values(content.recipes)) for (const o of r.outputs) expect(() => unitCost(o.item, content, opts)).not.toThrow();
  });

  it('les outils de départ ne demandent que des métiers au niveau 1 à 5 (on démarre seul)', () => {
    const c = bundleCost({ bronze_pickaxe: 1, bronze_axe: 1 }, content, opts);
    for (const level of Object.values(c.levels)) expect(level).toBeLessThanOrEqual(5);
  });

  it('chaque repas rapporte entre 1,5 et 2,5 fois son coût de chaîne', () => {
    for (const r of consumableRatios(content, opts)) {
      expect(r.payback, r.item).toBeGreaterThan(1.5);
      expect(r.payback, r.item).toBeLessThan(2.5);
    }
  });
});

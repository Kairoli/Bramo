import { describe, expect, it } from 'vitest';
import { gatherer, runBot } from '../src/bot.js';
import { calibrate } from '../src/calibrate.js';
import { bundleCost, consumableRatios, unitCost } from '../src/chains.js';
import { loadVariant } from '../src/load.js';
import { profile } from '../src/profiles.js';
import { proposalOptions } from '../src/scenarios/chains.js';
import { presenceMatrix } from '../src/scenarios/presence.js';

describe('données actuelles (data/)', () => {
  const content = loadVariant();

  it('reproduit la mesure : Minage 60 en ~1 jour et 90 en ~18 jours avec 2 h de présence', () => {
    const r = runBot(content, profile('block2h'), gatherer('mining'), { days: 25, track: { skill: 'mining', levels: [60, 90] } });
    expect(r.levelDay[60]).toBeGreaterThan(0.5);
    expect(r.levelDay[60]).toBeLessThan(2);
    expect(r.levelDay[90]).toBeGreaterThan(15);
    expect(r.levelDay[90]).toBeLessThan(21);
  });

  it('les repas actuels donnent plus de 300 h de bonus par heure de cuisson', () => {
    const feast = consumableRatios(content).find((c) => c.item === 'frost_feast')!;
    expect(feast.bonusHoursPerCraftHour).toBe(360);
  });
});

describe('présence', () => {
  const m = Object.fromEntries(presenceMatrix(4).map((r) => [r.id, r.eff]));

  it('le prototype donne environ ×7 entre un onglet ouvert jour et nuit et 20 min par jour', () => {
    expect(m.actuel!.tab24h! / m.actuel!.casu20!).toBeGreaterThan(6);
  });

  it('à 100 % avec 16 h d’autonomie, le téléphone et l’onglet visible font jeu égal', () => {
    expect(m.h100_16!.mobile).toBeCloseTo(m.h100_16!.tab16h!, 1);
    expect(m.h100_16!.tab24h! / m.h100_16!.casu20!).toBeLessThan(1.6);
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

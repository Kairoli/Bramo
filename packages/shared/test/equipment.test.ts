import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { dropMismatched, equipGear, gearTotals, isWorn, lineRange, masterpieceChance, newInstance, rollLines, unequipGear, viewGear } from '../src/engine/equipment.js';
import type { GearInstance } from '../src/schemas/gear.js';
import { loadArt, loadContent } from '../src/node/index.js';

const dataDir = fileURLToPath(new URL('../../../data', import.meta.url));
const artDir = fileURLToPath(new URL('../../../art', import.meta.url));
const content = loadContent(dataDir, artDir);
const models = Object.values(content.gearModels);

/** Suite pseudo-aléatoire reproductible. */
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}
const model = (f: (m: (typeof models)[number]) => boolean) => models.find(f)!;
const owned = (ids: string[], rand = seeded(7)): GearInstance[] => ids.map((m, i) => newInstance(content.gearModels[m]!, content, rand, { id: i + 1 }));

describe('catalogue d’équipement', () => {
  it('contient les 4 raretés à chaque palier et respecte les lignes par rareté', () => {
    for (const tier of [1, 10, 20]) {
      for (const rarity of ['common', 'rare', 'epic', 'legendary']) {
        expect(models.some((m) => m.tier === tier && m.rarity === rarity), `${tier} ${rarity}`).toBe(true);
      }
    }
    const expectRolls: Record<string, [number, number]> = { common: [0, 1], rare: [1, 2], epic: [2, 3], legendary: [3, 4] };
    for (const m of models.filter((x) => !x.starter)) {
      expect(m.rolls, m.id).toEqual(expectRolls[m.rarity]);
      expect(m.stats.length, m.id).toBe(m.rarity === 'common' ? 1 : 2);
    }
  });

  it('un ensemble a au moins 4 pièces et des bonus à 2, 3 et 4', () => {
    for (const set of Object.values(content.gearSets)) {
      expect(models.filter((m) => m.set === set.id).length, set.id).toBeGreaterThanOrEqual(4);
      expect(set.bonuses).toHaveLength(3);
    }
  });

  it('les plages de lignes grandissent avec le palier', () => {
    const t1 = model((m) => m.slot === 'torso' && m.tier === 1);
    const t20 = model((m) => m.slot === 'torso' && m.tier === 20);
    expect(lineRange(t20, content)[0]!.max).toBeGreaterThan(lineRange(t1, content)[0]!.max);
  });
});

describe('set de départ', () => {
  it('chaque classe a un set de départ faible, commun, lié, sans ligne aléatoire', () => {
    for (const cls of Object.keys(content.classes)) {
      const set = models.filter((m) => m.starter && m.classes.includes(cls));
      expect(set.map((m) => m.slot).sort(), cls).toEqual(['feet', 'head', 'legs', 'torso', 'weapon']);
      for (const m of set) {
        expect(m.rarity).toBe('common');
        expect(m.bound).toBe(true);
        expect(m.rolls).toEqual([0, 0]);
        expect(rollLines(m, content, seeded(1))).toEqual([]);
        // Bien plus faible que le même emplacement en Commun palier 1 hors set de départ.
        const normal = models.find((x) => !x.starter && x.slot === m.slot && x.tier === 1 && x.rarity === 'common' && x.classes.includes(cls));
        if (normal) expect(m.stats[0]!.value).toBeLessThan(normal.stats[0]!.value + 1);
      }
    }
  });
});

describe('tirage des lignes', () => {
  it('donne un nombre de lignes dans la plage de la rareté, valeurs dans la plage du palier, sans doublon', () => {
    const rand = seeded(1);
    for (const m of models.filter((x) => !x.named).slice(0, 200)) {
      const lines = rollLines(m, content, rand);
      expect(lines.length).toBeGreaterThanOrEqual(m.rolls[0]);
      expect(lines.length).toBeLessThanOrEqual(m.rolls[1]);
      expect(new Set(lines.map((l) => l.name)).size).toBe(lines.length);
      for (const l of lines) {
        expect(l.value).toBeGreaterThanOrEqual(l.min);
        expect(l.value).toBeLessThanOrEqual(l.max);
      }
    }
  });

  it('un chef-d’œuvre a le maximum de lignes, toutes au jet max, plus une ligne bonus, et respecte le choix de l’artisan', () => {
    const m = model((x) => x.rarity === 'legendary' && x.slot === 'torso' && x.tier === 20 && !x.named);
    const pool = lineRange(m, content).map((l) => l.name);
    const lines = rollLines(m, content, seeded(3), { masterpiece: true, chosen: [pool[3]!, pool[0]!] });
    const normal = lines.filter((l) => !l.bonus);
    expect(normal).toHaveLength(m.rolls[1]);
    expect(normal[0]!.name).toBe(pool[3]);
    expect(normal[1]!.name).toBe(pool[0]);
    for (const l of lines) expect(l.value).toBe(l.max);
    expect(lines.filter((l) => l.bonus)).toHaveLength(1);
    expect(new Set(lines.map((l) => l.name)).size).toBe(lines.length);
  });

  it('la chance de chef-d’œuvre monte avec l’avance de l’artisan, bornée', () => {
    expect(masterpieceChance(20, 20, content)).toBeCloseTo(0.02);
    expect(masterpieceChance(40, 20, content)).toBeGreaterThan(0.02);
    expect(masterpieceChance(99, 20, content)).toBeCloseTo(0.05);
    expect(masterpieceChance(5, 20, content)).toBeCloseTo(0.02);
  });
});

describe('équipement', () => {
  const torso = model((m) => m.classes.length === 1 && m.classes[0] === 'forgefire' && m.slot === 'torso' && m.tier === 1);
  const ring = model((m) => m.slot === 'ring' && m.tier === 1);
  const rings = models.filter((m) => m.slot === 'ring' && m.tier === 1);

  it('s’équipe selon la classe, et change de pièce dans un même emplacement', () => {
    const torso2 = model((m) => m.classes[0] === 'forgefire' && m.classes.length === 1 && m.slot === 'torso' && m.tier === 10);
    const bag = owned([torso.id, torso2.id]);
    expect(() => equipGear(bag, 1, 'runist', content)).toThrow('style de votre classe');
    expect(() => equipGear(bag, 99, 'forgefire', content)).toThrow('introuvable');
    const a = equipGear(bag, 1, 'forgefire', content);
    expect(a.find((g) => g.id === 1)!.equipped).toBe('torso');
    const b = equipGear(a, 2, 'forgefire', content);
    expect(b.find((g) => g.id === 1)!.equipped).toBeNull();
    expect(b.find((g) => g.id === 2)!.equipped).toBe('torso');
    expect(unequipGear(b, 2).find((g) => g.id === 2)!.equipped).toBeNull();
    // Les objets d'origine ne sont pas modifiés.
    expect(bag.every((g) => g.equipped === null)).toBe(true);
  });

  it('porte deux anneaux, le troisième remplace le premier', () => {
    const bag = owned([rings[0]!.id, rings[1]!.id, rings[2]!.id]);
    let s = equipGear(bag, 1, 'runist', content);
    s = equipGear(s, 2, 'runist', content);
    expect(s.filter((g) => g.equipped === 'ring')).toHaveLength(2);
    s = equipGear(s, 3, 'runist', content);
    expect(s.filter((g) => g.equipped === 'ring').map((g) => g.id).sort()).toEqual([2, 3]);
    expect(ring.classes).toHaveLength(3);
  });

  it('additionne les lignes des pièces portées, et une pièce usée ne compte plus', () => {
    const bag = owned([torso.id], seeded(11));
    const worn = equipGear(bag, 1, 'forgefire', content);
    const totals = gearTotals(worn, content);
    for (const s of torso.stats) expect(totals.stats[s.stat]).toBe(s.value);
    const broken = worn.map((g) => ({ ...g, wear: content.settings.gear.lifeHours * 3_600_000 }));
    expect(isWorn(broken[0]!, content)).toBe(true);
    expect(gearTotals(broken, content).stats).toEqual({});
    expect(gearTotals(bag, content).stats).toEqual({});
  });

  it('active les bonus d’ensemble à 2, 3 et 4 pièces portées', () => {
    const set = content.gearSets.cendres!;
    const pieces = models.filter((m) => m.set === 'cendres');
    const bag = owned(pieces.map((p) => p.id));
    let s = bag;
    for (let i = 0; i < 4; i++) s = equipGear(s, i + 1, 'forgefire', content);
    const totals = gearTotals(s, content);
    expect(totals.sets[0]!.pieces).toBe(4);
    expect(totals.sets[0]!.active.map((a) => a.pieces)).toEqual([2, 3, 4]);
    expect(totals.sets[0]!.active[2]!.text).toBe(set.bonuses[2]);
    expect(gearTotals(unequipGear(unequipGear(s, 1), 2), content).sets[0]!.active.map((a) => a.pieces)).toEqual([2]);
  });

  it('une pièce portée retourne au sac quand la classe change', () => {
    const bag = equipGear(owned([torso.id]), 1, 'forgefire', content);
    expect(dropMismatched(bag, 'runist', content)[0]!.equipped).toBeNull();
    expect(dropMismatched(bag, 'forgefire', content)[0]!.equipped).toBe('torso');
  });

  it('la vue donne le nom, la rareté, l’usure et si la classe peut le porter', () => {
    const bag = equipGear(owned([torso.id]), 1, 'forgefire', content);
    const v = viewGear(bag, 'runist', content);
    expect(v.items[0]).toMatchObject({ name: torso.name, rarity: torso.rarity, equipped: 'torso', wearable: false, worn: false, wearShare: 0 });
  });
});

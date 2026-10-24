import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { gearEffects, statRows } from '../src/combat/sheet.js';
import { newInstance } from '../src/engine/equipment.js';
import type { GearInstance } from '../src/schemas/gear.js';
import { loadContent } from '../src/node/index.js';

const content = loadContent(fileURLToPath(new URL('../../../data', import.meta.url)), fileURLToPath(new URL('../../../art', import.meta.url)));
const rand = () => 0.5;
const piece = (id: number, model: string, equipped: string | null): GearInstance => ({ ...newInstance(content.gearModels[model]!, content, rand, { id }), equipped });

describe('fiche du personnage', () => {
  it('écrit les statistiques comme un joueur les lit : Puissance en nombre, critique et défense en %', () => {
    const rows = statRows({ power: 132.4, maxHp: 3120, damageReduction: 0.243, critChance: 0.185, critMultiplier: 1.6, haste: 0.12 }).flatMap((g) => g.stats);
    const v = (k: string) => rows.find((r) => r.key === k)!.value;
    expect(v('power')).toBe('132');
    expect(v('critChance')).toBe('18,5 %');
    expect(v('critMultiplier')).toBe('160 %');
    expect(v('damageReduction')).toBe('24,3 %');
    expect(v('haste')).toBe('+12 %');
    // La Puissance se traduit en dégâts : « 0,6 × Puissance » devient un nombre.
    expect(rows.find((r) => r.key === 'power')!.hint).toContain('79');
  });

  it('dit ce que chaque statistique fixe d’une pièce change vraiment (portée, ou à la place de celle de son emplacement)', () => {
    const crit = Object.values(content.gearModels).find((m) => m.slot === 'necklace' && m.tier === 20 && m.stats.some((s) => s.stat === 'crit') && !m.starter)!;
    const def = Object.values(content.gearModels).find((m) => m.slot === 'torso' && m.tier === 20 && m.stats.some((s) => s.stat === 'defense') && !m.starter)!;
    const items = [piece(1, crit.id, 'necklace'), piece(2, def.id, null)];
    const fx = gearEffects(items, content);
    expect(fx[1]!.find((e) => e.stat === 'crit')!.text).toMatch(/^≈ \+\d+(,\d)? % de chance de critique$/);
    expect(fx[2]!.find((e) => e.stat === 'defense')!.text).toMatch(/% de dégâts reçus en moins/);
  });
});

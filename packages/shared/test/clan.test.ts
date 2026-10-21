import { describe, expect, it } from 'vitest';
import { advance } from '../src/engine/advance.js';
import { buildingNeeds, clanBonuses, memberBonuses } from '../src/engine/commission.js';
import { SEC, T0, content, makeState, mining } from './fixture.js';

describe('bâtiments de clan', () => {
  it('chaque niveau ajoute son bonus au métier ou à tout, borné au niveau maximal', () => {
    expect(clanBonuses({}, content)).toEqual({});
    // Un bâtiment accélère tout un groupe de métiers voisins.
    expect(clanBonuses({ hall: 2, mine_gallery: 1 }, content)).toEqual({ all: 0.02, mining: 0.02, smithing: 0.02 });
    expect(clanBonuses({ mine_gallery: 9 }, content).mining).toBeCloseTo(0.06); // maxLevel 3
    expect(clanBonuses({ inconnu: 2 }, content)).toEqual({});
  });

  it('un joueur reçoit toujours la Guilde du bourg, les bâtiments de son clan s’y ajoutent', () => {
    expect(memberBonuses(null, content)).toEqual({ all: 0.03 });
    expect(memberBonuses({ hall: 1, mine_gallery: 2 }, content)).toEqual({ all: 0.04, mining: 0.04, smithing: 0.04 });
  });

  it('le coût du niveau N vaut N fois la base, proportionnel aux membres actifs au-delà du minimum', () => {
    // Fixture : référence de 2 membres ; base de la halle = 100 or + 10 minerais.
    expect(buildingNeeds('hall', 1, 1, content)).toEqual({ gold: 100, items: [{ item: 'ore', qty: 10 }] });
    expect(buildingNeeds('hall', 2, 2, content)).toEqual({ gold: 200, items: [{ item: 'ore', qty: 20 }] });
    expect(buildingNeeds('hall', 1, 6, content)).toEqual({ gold: 300, items: [{ item: 'ore', qty: 30 }] });
    expect(buildingNeeds('inconnu', 1, 6, content)).toEqual({ gold: 0, items: [] });
  });

  it('le bonus de clan accélère la production du métier concerné, et seulement lui', () => {
    const base = advance(makeState({ activity: mining() }), T0 + 100 * SEC, content).state;
    const boosted = advance(makeState({ activity: mining(), clanBonuses: { mining: 0.1 } }), T0 + 100 * SEC, content).state;
    const other = advance(makeState({ activity: mining(), clanBonuses: { smithing: 0.1 } }), T0 + 100 * SEC, content).state;
    expect(base.inventory.ore).toBe(10);
    expect(boosted.inventory.ore).toBe(11); // 100 s × 1,1 / 10 s
    expect(other.inventory.ore).toBe(10);
    // Le plafond de clan (+10 %) borne la somme « tout » + « métier ».
    const capped = advance(makeState({ activity: mining(), clanBonuses: { all: 0.1, mining: 0.1 } }), T0 + 100 * SEC, content).state;
    expect(capped.inventory.ore).toBe(11);
  });
});

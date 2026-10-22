import { describe, expect, it } from 'vitest';
import { buildCombatContent, planErrors } from '../src/combat/content.js';
import { type CombatantSetup, fight } from '../src/combat/engine.js';
import type { Encounter } from '../src/schemas/combat.js';

/** Contenu de combat figé : les tests ne dépendent pas de l'équilibrage de data/combat/. */
const rules = {
  tick: 0.25,
  gcd: 1,
  fightLimit: 60,
  opening: 'independent',
  maxFirstUse: 10,
  secondaryShare: 0.55,
  firstBasicAt: 1,
  basicAttack: { coefficient: 0, referencePeriod: 2 },
  weaponPeriods: { hammer: 2, longbow: 2, staff: 2 },
  referenceStats: { power: 100, maxHp: 1000, damageReduction: 0, critChance: 0, critMultiplier: 1.5, haste: 0 },
  caps: { critChance: 0.5, vulnerability: 0.1, bossSlow: 0.15, hardControl: 1.5, totalShield: 4.5, secondaryShield: 1.6, afflictionsPerType: 3 },
  enemy: { defense: 0, firstAttackAt: 2, attackStagger: 0.5, damageSpread: 0 },
  stability: { max: 80, stunPressurePerSecond: 15, breakDuration: 6, recovery: 8, breakDamageTaken: 0.08, breakNextHitReduction: 0.25 },
  cleanse: { auraImmunity: 6 },
  dotTick: 1,
  progression: { xpPerHour: 400, xpDoubling: 55, catchUpBonus: 0.5, catchUpBelow: 0.8, rest: 5, lossXpShare: 0.5, maxConsecutiveLosses: 3, training: { xpShare: 0.4, maxLevel: 40 } },
};
const path = (id: string, role: string, params: Record<string, number> = {}) => ({ id, name: id, role, passive: id, params });
const kits = {
  slots: { beforePath: 4, fromPath: 5 },
  pathLevel: 30,
  classes: [
    {
      id: 'forgefire', mechanic: 'heat', label: 'Forge', state: '', params: { cap: 3, temperPerHeat: 0.15 }, elements: ['physical', 'fire'], weapons: ['hammer'],
      paths: [path('red_temper', 'damage', { perHeat: 0.12, hits: 3, duration: 8 }), path('anvil', 'control'), path('whetter', 'support', { shieldPerHeat: 0.16, duration: 6, ripostePerHeat: 0.12 })],
    },
    {
      id: 'tracker', mechanic: 'angle', label: 'Poursuite', state: '', params: { duration: 6, bonus: 0.3, carryOnKill: 3 }, elements: ['physical'], weapons: ['longbow'],
      paths: [path('beastslayer', 'damage'), path('trapper', 'control'), path('packleader', 'support')],
    },
    {
      id: 'runist', mechanic: 'rune', label: 'Phrase', state: '', params: { trait: 0.16, circle: 0.08, circleTargets: 2, circleSlow: 0.1, circleSlowDuration: 2, seal: 0.2, sealDuration: 4 }, elements: ['fire'], weapons: ['staff'],
      paths: [path('fulgurant', 'damage'), path('sigilbinder', 'control'), path('glyphkeeper', 'support', { cap: 0.65 })],
    },
  ],
};
const spell = (id: string, cls: string, cooldown: number, extra: Record<string, unknown> = {}) => ({ id, name: id, class: cls, level: 1, cooldown, element: 'physical', damage: 0, targets: 1, tags: [], ...extra });
const spells = [
  spell('a', 'forgefire', 8),
  spell('b', 'forgefire', 12),
  spell('c', 'forgefire', 20),
  spell('chauffe', 'forgefire', 1, { tags: ['heat'], heat: 1 }),
  spell('trempe', 'forgefire', 5, { tags: ['temper'], damage: 1 }),
  spell('frein', 'forgefire', 30, { slow: 0.5, duration: 30 }),
  spell('assomme', 'forgefire', 30, { stun: 1, pressure: 10 }),
  spell('cogne', 'forgefire', 1, { pressure: 40 }),
  spell('garde', 'forgefire', 6, { shield: 2 }),
  spell('frappe', 'forgefire', 1, { damage: 1 }),
  spell('purge', 'forgefire', 1, { cleanse: true }),
  spell('zone', 'forgefire', 1, { damage: 1, targets: 5 }),
  spell('piq', 'forgefire', 1, { damage: 0.7 }),
  spell('repli', 'tracker', 18, { selfPool: { maxHpFraction: 0.12, duration: 8 } }),
  spell('repere', 'tracker', 30, { tags: ['setup'] }),
  spell('poursuite', 'tracker', 1, { tags: ['exploit'], damage: 1 }),
  spell('trait', 'runist', 1, { form: 'trait', element: 'fire', damage: 1 }),
  spell('ultime', 'runist', 60, { form: 'circle', level: 75, tags: ['ultimate'] }),
  spell('ultime2', 'runist', 60, { form: 'seal', level: 75, tags: ['ultimate'] }),
  { ...spell('voie', 'runist', 10, { form: 'seal' }), path: 'glyphkeeper', level: 30 },
];
const built = buildCombatContent({ rules, kits, spells }, ['forgefire', 'tracker', 'runist']);
const combat = built.combat!;
const dummy = (over: Partial<Encounter> = {}): Encounter => ({ id: 'dummy', name: 'Mannequin', enemies: 1, hp: 1e9, attack: { damage: 0, period: 100 }, ...over });
const solo = (classId: string, plan: [string, number][], over: Partial<CombatantSetup> = {}): CombatantSetup => ({
  id: 'p1', classId, pathId: null, weapon: classId === 'forgefire' ? 'hammer' : classId === 'tracker' ? 'longbow' : 'staff', plan: plan.map(([s, at]) => ({ spell: s, at })), ...over,
});
const casts = (r: ReturnType<typeof fight>, name?: string) => r.trace!.filter((x) => x.kind === 'cast' && (!name || x.text.startsWith(`${name} `))).map((x) => [x.t, x.text.split(' ')[0]] as const);

describe('contenu de combat', () => {
  it('se valide', () => expect(built.errors).toEqual([]));

  it('refuse un plan hors règles : voie d’une autre classe, niveau, places, deux ultimes', () => {
    expect(planErrors(combat, 'runist', 'fulgurant', 80, [{ spell: 'voie', at: 0 }])).toEqual(['voie est réservé à la voie glyphkeeper']);
    expect(planErrors(combat, 'runist', null, 10, [{ spell: 'ultime', at: 0 }])).toEqual(['ultime demande le niveau 75']);
    expect(planErrors(combat, 'runist', 'glyphkeeper', 80, [{ spell: 'ultime', at: 0 }, { spell: 'ultime2', at: 0 }])).toEqual(['un seul ultime par plan']);
    expect(planErrors(combat, 'forgefire', null, 10, ['a', 'b', 'c', 'chauffe', 'trempe'].map((s) => ({ spell: s, at: 0 })))).toEqual(['5 sorts pour 4 places au niveau 10']);
    expect(planErrors(combat, 'forgefire', null, 10, [{ spell: 'trait', at: 0 }])).toEqual(['trait est un sort de runist']);
    expect(planErrors(combat, 'forgefire', null, 10, [{ spell: 'a', at: 12 }])).toEqual(['a : première utilisation à 12 s (au plus 10 s)']);
  });
});

describe('plan et cooldowns', () => {
  const plan: [string, number][] = [['a', 0], ['b', 4], ['c', 10]];

  it('ouverture « séquence » : l’exemple du dossier §3 (A 0, B 4, C 10, A 11, B 16, A 19)', () => {
    const r = fight(combat, [solo('forgefire', plan)], dummy(), { seed: 1, opening: 'sequence', trace: true });
    expect(casts(r).slice(0, 6)).toEqual([[0, 'a'], [4, 'b'], [10, 'c'], [11, 'a'], [16, 'b'], [19, 'a']]);
  });

  it('ouverture « indépendante » : chaque sort part à son horaire puis suit son cooldown ; 1 s entre deux compétences', () => {
    const r = fight(combat, [solo('forgefire', plan)], dummy(), { seed: 1, opening: 'independent', trace: true });
    expect(casts(r).slice(0, 6)).toEqual([[0, 'a'], [4, 'b'], [8, 'a'], [10, 'c'], [16, 'a'], [17, 'b']]);
  });

  it('est déterministe pour une graine', () => {
    const run = (seed: number) => fight(combat, [solo('forgefire', [['trempe', 0], ['chauffe', 1]])], dummy({ hp: 3000 }), { seed });
    expect(run(7)).toEqual(run(7));
  });
});

describe('mécaniques de classe', () => {
  it('Forgefeu : les Chauffes donnent au plus 3 Braises, la Trempe les dépense toutes (+0,15 P chacune)', () => {
    // Quatre Chauffes (0, 1, 2, 3 s) puis une Trempe à 4 s : 3 Braises seulement.
    const r = fight(combat, [solo('forgefire', [['chauffe', 0], ['trempe', 4]])], dummy(), { seed: 1, trace: true });
    expect(r.trace!.find((x) => x.text.startsWith('trempe'))!.text).toContain('3 Braises dépensées');
    // Sans Braise, la Trempe frappe quand même.
    const plain = fight(combat, [solo('forgefire', [['trempe', 0]])], dummy({ hp: 100 }), { seed: 1 });
    expect(plain.win).toBe(true);
  });

  it('Traqueur : une Poursuite n’exploite qu’un Angle ouvert par un Repérage', () => {
    const without = fight(combat, [solo('tracker', [['poursuite', 0]])], dummy({ hp: 1000 }), { seed: 1 });
    expect(without.team[0]!.metrics.anglesConsumed ?? 0).toBe(0);
    const withAngle = fight(combat, [solo('tracker', [['repere', 0], ['poursuite', 1]])], dummy({ hp: 1000 }), { seed: 1 });
    // L'Angle (6 s) est exploité une fois, puis il faut un nouveau Repérage (cooldown 30 s).
    expect(withAngle.team[0]!.metrics.anglesConsumed).toBe(1);
  });

  it('Runiste : chaque sort lit la rune du précédent, le premier n’en lit aucune', () => {
    const r = fight(combat, [solo('runist', [['trait', 0]])], dummy({ hp: 1e9 }), { seed: 1, trace: true });
    const n = casts(r).length;
    expect(r.team[0]!.metrics.runesRead).toBe(n - 1);
  });
});

describe('contrôle et phases', () => {
  it('un boss n’est ralenti qu’à 15 % sur ses attaques ordinaires ; ses phases gardent leur horaire', () => {
    const boss = dummy({ attack: { damage: 1, period: 2 }, charge: { damage: 1, period: 10 } });
    const r = fight(combat, [solo('forgefire', [['frein', 0]])], boss, { seed: 1, trace: true });
    const at = (kind: string) => r.trace!.filter((x) => x.kind === kind).map((x) => x.t);
    expect(at('charge').slice(0, 3)).toEqual([10, 20, 30]);
    // Attaques ordinaires : 2 s, puis 2 / (1 − 0,15) ≈ 2,35 s, arrondies au pas de 0,25 s.
    const hits = at('attack');
    expect(hits[1]! - hits[0]!).toBeCloseTo(2.5, 5);
  });

  it('sur un boss, l’étourdissement devient de la Pression (15 par seconde)', () => {
    const r = fight(combat, [solo('forgefire', [['assomme', 0]])], dummy(), { seed: 1, trace: true });
    // 1 s d'étourdissement = 15, plus les 10 inscrits sur le sort, à chaque lancement.
    expect(r.team[0]!.contributions.pressure).toBe(25 * casts(r).length);
  });

  it('à zéro de Stabilité, Rupture ; puis 8 s de récupération sans Pression', () => {
    // 40 de Pression par seconde : Rupture à 1 s, rien de 2 à 8 s, puis Rupture à 10 s, 19 s… jusqu'à 55 s (7 en 60 s).
    const r = fight(combat, [solo('forgefire', [['cogne', 0]])], dummy(), { seed: 1 });
    expect(r.team[0]!.contributions.breaks).toBe(7);
    expect(r.team[0]!.contributions.pressure).toBe(7 * 80);
  });
});

describe('protections et groupe', () => {
  it('une protection vise un seul bénéficiaire : l’allié en première ligne, et l’absorption revient à celui qui l’a posée', () => {
    const hitter = dummy({ attack: { damage: 20, period: 1 } });
    const tank = solo('tracker', [], { id: 'front' });
    const support = solo('forgefire', [['garde', 0]], { id: 'soutien', beneficiary: 'lowest' });
    const r = fight(combat, [tank, support], hitter, { seed: 1 });
    const [front, sup] = r.team;
    expect(sup!.contributions.absorbed).toBeGreaterThan(0);
    expect(front!.contributions.absorbed).toBe(0);
    // Le soutien n'est jamais frappé : seul l'allié de tête prend les coups.
    expect(sup!.hpRatio).toBe(1);
  });

  it('en solo, la garde protège le porteur', () => {
    const r = fight(combat, [solo('forgefire', [['garde', 0]])], dummy({ attack: { damage: 50, period: 1 } }), { seed: 1 });
    expect(r.team[0]!.contributions.absorbed).toBeGreaterThan(0);
  });
});

describe('mécaniques de rencontre (zones, donjons, groupes)', () => {
  const casts = (r: ReturnType<typeof fight>, kind: string) => r.trace!.filter((x) => x.kind === kind).map((x) => x.t);

  it('un renfort arrive à son heure, et vaincre le groupe principal termine la rencontre', () => {
    const enc = dummy({ hp: 100_000, adds: [{ name: 'Renfort', count: 1, hp: 1e9, attack: { damage: 0, period: 100 }, arrive: 10 }] });
    // Avant 10 s, seul le chef est là ; le renfort, immortel ici, n'empêche pas la victoire sur le chef.
    const r = fight(combat, [solo('forgefire', [['zone', 0]])], { ...enc, hp: 300 }, { seed: 1 });
    expect(r.win).toBe(true);
    const long = fight(combat, [solo('forgefire', [['frappe', 0]])], enc, { seed: 1, trace: true });
    expect(long.win).toBe(false);
  });

  it('un coup sur trois est lourd', () => {
    const enc = dummy({ attack: { damage: 4, period: 1, heavyEvery: 3, heavyMultiplier: 5 } });
    const r = fight(combat, [solo('forgefire', [])], enc, { seed: 1 });
    // 60 s : 59 coups, dont un tiers à 20 au lieu de 4 : (2 × 4 + 20) / 3 ≈ 9,3 par coup en moyenne.
    const lost = r.team[0]!.metrics.hpLost!;
    expect(lost / 59).toBeGreaterThan(8.5);
    expect(lost / 59).toBeLessThan(10);
  });

  it('un soin ennemi limité à trois utilisations, et seulement tant que son auxiliaire vit', () => {
    const enc = dummy({ hp: 1e9, regen: { period: 5, amount: 1, uses: 3 } });
    const r = fight(combat, [solo('forgefire', [])], enc, { seed: 1, trace: true });
    expect(casts(r, 'regen')).toHaveLength(3);
    const aux = dummy({ hp: 1e9, regen: { period: 5, amount: 1, requiresAdds: true }, adds: [{ name: 'Auxiliaire', count: 1, hp: 50, attack: { damage: 0, period: 100 }, arrive: 0 }] });
    // Le premier coup (au premier lancement) vise le chef ; une frappe de zone tue l'auxiliaire tout de suite.
    const killed = fight(combat, [solo('forgefire', [['zone', 0]])], aux, { seed: 1, trace: true });
    expect(casts(killed, 'regen')).toHaveLength(0);
  });

  it('l’érosion s’accumule et une purification la retire', () => {
    const enc = dummy({ erosion: { period: 5, damage: 2, maxStacks: 3 } });
    const none = fight(combat, [solo('forgefire', [])], enc, { seed: 1 });
    const purged = fight(combat, [solo('forgefire', [['purge', 0]])], enc, { seed: 1 });
    expect(none.team[0]!.metrics.erosionDamage).toBeGreaterThan(300);
    expect(purged.team[0]!.metrics.erosionDamage ?? 0).toBeLessThan(none.team[0]!.metrics.erosionDamage! / 3);
    expect(purged.team[0]!.contributions.cleanses).toBeGreaterThan(0);
  });

  it('hors des fenêtres ouvertes, le groupe principal subit moins de dégâts', () => {
    const open = fight(combat, [solo('forgefire', [['frappe', 0]])], dummy({ hp: 1e9 }), { seed: 1 });
    const windows = fight(combat, [solo('forgefire', [['frappe', 0]])], dummy({ hp: 1e9, windows: { period: 10, open: 5, closedReduction: 0.5 } }), { seed: 1 });
    expect(windows.team[0]!.contributions.damage / open.team[0]!.contributions.damage).toBeCloseTo(0.75, 1);
  });

  it('en groupe, les coups peuvent viser chacun à tour de rôle ; PV et cadence s’adaptent à l’effectif', () => {
    const hitter = dummy({ attack: { damage: 4, period: 1 } });
    const team = [solo('forgefire', [], { id: 'a' }), solo('forgefire', [], { id: 'b' })];
    const front = fight(combat, team, hitter, { seed: 1 });
    const rotate = fight(combat, team, hitter, { seed: 1, targeting: 'rotate' });
    expect(front.team[1]!.hpRatio).toBe(1);
    expect(rotate.team[0]!.metrics.hpLost).toBeCloseTo(rotate.team[1]!.metrics.hpLost!, -1);
    const faster = fight(combat, [solo('forgefire', [])], hitter, { seed: 1, enemyAttackRateScale: 2 });
    expect(faster.team[0]!.metrics.hpLost! / front.team[0]!.metrics.hpLost!).toBeCloseTo(2, 0);
    const tougher = fight(combat, [solo('forgefire', [['frappe', 0]])], dummy({ hp: 1000 }), { seed: 1, enemyHpScale: 2 });
    const normal = fight(combat, [solo('forgefire', [['frappe', 0]])], dummy({ hp: 1000 }), { seed: 1 });
    expect(tougher.time / normal.time).toBeCloseTo(2, 0);
  });

  it('une potion de secours se boit sous le seuil, une fois par délai, dans la limite du stock', () => {
    const hitter = dummy({ attack: { damage: 20, period: 1 } });
    const r = fight(combat, [solo('forgefire', [], { potions: { count: 2, heal: 0.1, below: 0.5, cooldown: 10 } })], hitter, { seed: 1, trace: true });
    const drunk = r.trace!.filter((x) => x.kind === 'potion').map((x) => x.t);
    expect(drunk).toHaveLength(2);
    expect(drunk[1]! - drunk[0]!).toBeGreaterThanOrEqual(10);
    expect(r.team[0]!.metrics.potions).toBe(2);
  });

  it('fureur : passé le temps prévu, les coups montent chaque seconde', () => {
    const calm = fight(combat, [solo('forgefire', [])], dummy({ attack: { damage: 2, period: 1 } }), { seed: 1 });
    const angry = fight(combat, [solo('forgefire', [])], dummy({ attack: { damage: 2, period: 1 }, enrage: { after: 30, perSecond: 0.1 } }), { seed: 1 });
    // Avant 30 s, rien ne change ; ensuite +10 % par seconde.
    // 30 s de fureur : Σ 2 × (1 + 0,1 k) pour k de 1 à 30, soit environ 153 au lieu de 60.
    expect(angry.team[0]!.metrics.hpLost! - calm.team[0]!.metrics.hpLost!).toBeCloseTo(93, -1);
  });

  it('la Puissance de soutien multiplie les soins et protections produits, et l’aide aux alliés est comptée à part', () => {
    const sup = { ...combat, paths: { ...combat.paths, whetter: { ...combat.paths.whetter!, params: { ...combat.paths.whetter!.params, supportPower: 1 } } } };
    const hitter = dummy({ attack: { damage: 20, period: 1 } });
    const team = (c: typeof combat) => fight(c, [solo('tracker', [], { id: 'front' }), solo('forgefire', [['garde', 0]], { id: 'soutien', pathId: 'whetter', beneficiary: 'lowest' })], hitter, { seed: 1 });
    const base = team(combat).team[1]!.metrics;
    const doubled = team(sup).team[1]!.metrics;
    expect(base.absorbedAllies).toBeGreaterThan(0);
    expect(doubled.shieldProduced! / base.shieldProduced!).toBeCloseTo(2, 1);
  });

  it('les PV de départ se gardent d’une salle à l’autre', () => {
    const r = fight(combat, [solo('forgefire', [], { startHp: 400 })], dummy(), { seed: 1 });
    expect(r.team[0]!.hp).toBe(400);
  });

  it('un affaiblissement « une attaque » peut être gardé pour le coup lourd', () => {
    // Coups lourds à 6, 12, 18 s… ; la Rupture (vers 1 s, puis toutes les 9 s) laisse 6 s d'affaiblissement.
    const enc = dummy({ attack: { damage: 100, period: 2, heavyEvery: 3, heavyMultiplier: 10 } });
    const heavyRules = { ...combat, rules: { ...combat.rules, enemy: { ...combat.rules.enemy, onceWeakenTarget: 'heavy' as const } } };
    // cogne : 40 de Pression par seconde, donc une Rupture (prochaine attaque −25 %) peu après le début.
    const next = fight(combat, [solo('forgefire', [['cogne', 0]])], enc, { seed: 1 });
    const kept = fight(heavyRules, [solo('forgefire', [['cogne', 0]])], enc, { seed: 1 });
    expect(kept.team[0]!.contributions.mitigated).toBeGreaterThan(next.team[0]!.contributions.mitigated * 2);
  });

  it('danger et fureur s’appliquent une fois à l’aura et à l’érosion', () => {
    const aura = dummy({ aura: { damage: 10 } });
    const base = fight(combat, [solo('forgefire', [])], aura, { seed: 1 }).team[0]!.metrics.auraDamage!;
    expect(fight(combat, [solo('forgefire', [], { stats: { maxHp: 1e6 } })], aura, { seed: 1, enemyDamageScale: 2 }).team[0]!.metrics.auraDamage! / base).toBeCloseTo(2, 5);
    const angry = fight(combat, [solo('forgefire', [], { stats: { maxHp: 1e6 } })], dummy({ aura: { damage: 10 }, enrage: { after: 30, perSecond: 0.1 } }), { seed: 1 });
    // 30 s de fureur : Σ 10 × 0,1 k pour k de 1 à 30 = 465 de plus.
    expect(angry.team[0]!.metrics.auraDamage! - base).toBeCloseTo(465, -1);
    const erosion = dummy({ erosion: { period: 5, damage: 2, maxStacks: 3 } });
    const e1 = fight(combat, [solo('forgefire', [])], erosion, { seed: 1 }).team[0]!.metrics.erosionDamage!;
    expect(fight(combat, [solo('forgefire', [])], erosion, { seed: 1, enemyDamageScale: 1.5 }).team[0]!.metrics.erosionDamage! / e1).toBeCloseTo(1.5, 5);
  });
});

describe('outils de situation (dossier PvE v2)', () => {
  const tool = (family: string, extra: Record<string, unknown>, rank = 'set4') => ({ id: `${family}_${rank}`, name: family, rank, cooldown: 0, family, ...extra }) as unknown as NonNullable<CombatantSetup['tools']>[number];
  const piq = solo('forgefire', [['piq', 0]]);

  it('Fracture : le supplément ne frappe que la garde, jamais les PV', () => {
    // Garde 100 à chaque période ; un coup de 70 sur la garde pleine la détruit (70 + 30 de supplément) sans un seul PV de débordement.
    const enc = dummy({ guard: { period: 5, amount: 100, duration: 4 } });
    const without = fight(combat, [piq], enc, { seed: 1 }).team[0]!;
    const withTool = fight(combat, [{ ...piq, tools: [tool('fracture', { multiplier: 2 })] }], enc, { seed: 1 }).team[0]!;
    const bonus = withTool.metrics.guardDamageBonus!;
    expect(bonus).toBeGreaterThan(0);
    expect(bonus % 30).toBeCloseTo(0, 5);
    expect(withTool.contributions.damage - without.contributions.damage).toBeCloseTo(bonus, 5);
    // Sans garde, l'outil ne change rien.
    expect(fight(combat, [{ ...piq, tools: [tool('fracture', { multiplier: 2 })] }], dummy(), { seed: 1 })).toEqual(fight(combat, [piq], dummy(), { seed: 1 }));
  });

  it('Battue : plus de dégâts contre un renfort, aucun contre le chef ; la priorité « renforts d’abord » les vise', () => {
    const enc = dummy({ adds: [{ name: 'Renfort', count: 1, hp: 300, attack: { damage: 0, period: 100 }, arrive: 10 }] });
    const chief = fight(combat, [piq], enc, { seed: 1 }).team[0]!;
    expect(chief.metrics.kills ?? 0).toBe(0);
    const addsFirst = fight(combat, [{ ...piq, targetPriority: 'adds_first' }], enc, { seed: 1, trace: true });
    expect(addsFirst.team[0]!.metrics.kills).toBe(1);
    // 300 PV à 70 par coup : 5 coups (10 à 14 s) ; avec ×1,8 (126 par coup), 3 coups.
    const kill = (r: ReturnType<typeof fight>) => r.trace!.find((x) => x.kind === 'kill')!.t;
    expect(kill(addsFirst)).toBe(14);
    expect(kill(fight(combat, [{ ...piq, targetPriority: 'adds_first', tools: [tool('beat', { multiplier: 1.8 })] }], enc, { seed: 1, trace: true }))).toBe(12);
    // Contre le chef seul, rien ne change.
    expect(fight(combat, [{ ...piq, tools: [tool('beat', { multiplier: 1.8 })] }], dummy(), { seed: 1 })).toEqual(fight(combat, [piq], dummy(), { seed: 1 }));
  });

  it('Impact : atténue lourds et charges selon la part du coup et la part des PV, avec un délai par porteur', () => {
    // Coup lourd de 500 toutes les 3 attaques ; 65 % du coup, au plus 25 % de 1 200 PV = 300.
    const enc = dummy({ attack: { damage: 10, period: 1, heavyEvery: 3, heavyMultiplier: 50 } });
    const r = fight(combat, [solo('forgefire', [], { stats: { maxHp: 1200 }, tools: [tool('impact', { incoming: 0.65, maxHp: 0.25, cooldown: 6 })] })], enc, { seed: 1 }).team[0]!;
    expect(r.metrics.impactAvoided! % 300).toBeCloseTo(0, 5);
    expect(r.metrics.impactAvoided).toBeGreaterThan(0);
    // PV très hauts : la part du coup limite (325).
    const big = fight(combat, [solo('forgefire', [], { stats: { maxHp: 1e6 }, tools: [tool('impact', { incoming: 0.65, maxHp: 0.25, cooldown: 6 })] })], enc, { seed: 1 }).team[0]!;
    // Un lourd toutes les 3 s, délai 6 s : un sur deux, de 3 s à 57 s (10 activations).
    expect(big.metrics.impactAvoided).toBeCloseTo(10 * 325, 5);
    // Les coups ordinaires ne le déclenchent pas.
    expect(fight(combat, [solo('forgefire', [], { tools: [tool('impact', { incoming: 0.65, maxHp: 0.25, cooldown: 6 })] })], dummy({ attack: { damage: 10, period: 1 } }), { seed: 1 }).team[0]!.metrics.impactAvoided).toBeUndefined();
  });

  it('Pluie : retire des charges d’érosion avec un délai ; une préparation à usages limités', () => {
    const enc = dummy({ erosion: { period: 5, damage: 2, maxStacks: 3 } });
    const none = fight(combat, [solo('forgefire', [])], enc, { seed: 1 }).team[0]!;
    const set = fight(combat, [solo('forgefire', [], { tools: [tool('rain', { remove: 2, atLeast: 2, cooldown: 10 })] })], enc, { seed: 1 }).team[0]!;
    expect(set.metrics.erosionDamage!).toBeLessThan(none.metrics.erosionDamage! * 0.6);
    const prep = fight(combat, [solo('forgefire', [], { tools: [tool('rain', { remove: 2, atLeast: 2, cooldown: 24, charges: 1 }, 'prep')] })], enc, { seed: 1 }).team[0]!;
    expect(prep.metrics.erosionRemoved).toBe(2);
  });

  it('Reprise : rend une part de l’aura prise, plafonnée, jamais sur l’érosion', () => {
    const breath = tool('breath', { recover: 0.75, pulse: 0.08, rolling: 0.3, window: 30, cooldown: 6 });
    const r = fight(combat, [solo('forgefire', [], { tools: [breath] })], dummy({ aura: { damage: 10 } }), { seed: 1 }).team[0]!;
    expect(r.metrics.breathHealed).toBeGreaterThan(0);
    expect(r.metrics.breathHealed!).toBeLessThanOrEqual(0.75 * r.metrics.auraDamage! + 1e-6);
    expect(r.hp).toBeCloseTo(1000 - r.metrics.auraDamage! + r.metrics.breathHealed!, 5);
    expect(fight(combat, [solo('forgefire', [], { tools: [breath] })], dummy({ erosion: { period: 5, damage: 2, maxStacks: 3 } }), { seed: 1 }).team[0]!.metrics.breathHealed).toBeUndefined();
  });

  it('Interstice : stocke la perte due à la fenêtre fermée et la rend une fois à l’ouverture, sans dépasser la réserve', () => {
    const enc = dummy({ windows: { period: 10, open: 5, closedReduction: 0.5 } });
    const open = fight(combat, [solo('forgefire', [['frappe', 0]])], dummy(), { seed: 1 }).team[0]!;
    const plain = fight(combat, [solo('forgefire', [['frappe', 0]])], enc, { seed: 1 }).team[0]!;
    const full = fight(combat, [solo('forgefire', [['frappe', 0]], { tools: [tool('interstice', { store: 1, bankCap: 12 })] })], enc, { seed: 1 }).team[0]!;
    expect(full.metrics.releasedDamage!).toBeLessThanOrEqual(full.metrics.bankedDamage! + 1e-6);
    expect(full.contributions.damage).toBeGreaterThan(plain.contributions.damage);
    expect(full.contributions.damage).toBeLessThanOrEqual(open.contributions.damage + 1e-6);
    // Réserve plafonnée à 2 P par cycle.
    const capped = fight(combat, [solo('forgefire', [['frappe', 0]], { tools: [tool('interstice', { store: 1, bankCap: 2 })] })], enc, { seed: 1 }).team[0]!;
    expect(capped.metrics.bankedDamage!).toBeLessThanOrEqual(200 * 7);
  });

  it('une seule variante par famille : la mieux classée (set 4 avant la gemme, la gemme avant le set 3)', () => {
    const enc = dummy({ guard: { period: 5, amount: 100, duration: 4 } });
    const run = (...tools: ReturnType<typeof tool>[]) => fight(combat, [{ ...piq, tools }], enc, { seed: 1 }).team[0]!.metrics.guardDamageBonus;
    expect(run(tool('fracture', { multiplier: 1.25 }, 'set2'), tool('fracture', { multiplier: 2 }, 'set4'))).toBe(run(tool('fracture', { multiplier: 2 })));
    expect(run(tool('fracture', { multiplier: 1.5 }, 'set3'), tool('fracture', { multiplier: 1.65 }, 'gem'))).toBe(run(tool('fracture', { multiplier: 1.65 }, 'gem')));
  });

  it('Repli couvert : réserve personnelle en part des PV maximum, contre les coups, pas contre l’aura', () => {
    const hitter = dummy({ attack: { damage: 10, period: 1 } });
    const at = (maxHp: number) => fight(combat, [solo('tracker', [['repli', 0]], { stats: { maxHp } })], hitter, { seed: 1 }).team[0]!.metrics;
    // 18 s de cooldown : lancers à 0, 18, 36, 54 s.
    expect(at(2800).coverGranted).toBeCloseTo(4 * 336, 5);
    expect(at(5600).coverGranted).toBeCloseTo(4 * 672, 5);
    expect(at(2800).coverAbsorbed).toBeGreaterThan(0);
    expect(fight(combat, [solo('tracker', [['repli', 0]])], dummy({ aura: { damage: 10 } }), { seed: 1 }).team[0]!.metrics.coverAbsorbed).toBeUndefined();
  });
});

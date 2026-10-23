import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/node/index.js';
import { offerTide, patronDay, patronPrice, readTide, tideShards, tideTitles, tideWindow } from '../src/combat/tide.js';
import { worksNeeds, workAt } from '../src/engine/commission.js';
import { canRankUp, chooseReroll, honeCost, honeLine, rankCost, rankUp, rankedStats, rerollCost, rerollLine, rerollableLines, salvageGear, salvageYield } from '../src/engine/refine.js';
import { newInstance } from '../src/engine/equipment.js';
import { advance } from '../src/engine/advance.js';
import { startActivity } from '../src/engine/actions.js';
import { equipmentSetup } from '../src/combat/progress.js';
import { HOUR, T0, makeState } from './fixture.js';

// Les puits d'or retenus par Louis le 23 octobre : Mécène de la Marée, Ouvrages du clan (Banquet), Affineur du bourg.
const content = loadContent(fileURLToPath(new URL('../../../data', import.meta.url)));
const tide = content.combat!.tide!;

describe('Mécène de la Marée', () => {
  it('le prix suit la taille du serveur, avec un minimum', () => {
    expect(patronPrice(0, content)).toBe(tide.patron!.minPrice);
    expect(patronPrice(120, content)).toBe(120 * tide.patron!.perParticipant);
  });

  it('une offre finance la Marée de ce soir tant qu’elle n’est pas finie, sinon celle de demain', () => {
    const day = 20_000;
    const w = tideWindow(day, tide);
    expect(patronDay(w.start - HOUR, tide)).toBe(day);
    expect(patronDay(w.start + 10 * 60_000, tide)).toBe(day);
    expect(patronDay(w.end + 1, tide)).toBe(day + 1);
  });

  it('offrir coûte l’or, compte les soirs offerts et donne des titres', () => {
    let s = makeState({ gold: 10_000 });
    expect(() => offerTide(makeState({ gold: 10 }), 500, content)).toThrow(/Il faut 500 or/);
    for (let i = 0; i < 5; i++) s = offerTide(s, 1_000, content);
    expect(s.gold).toBe(5_000);
    expect(readTide(s.combat.tide).patron).toBe(5);
    const titles = tideTitles(s, content);
    expect(titles).toContain(tide.patron!.titles[0]!.title);
    expect(titles).toContain(tide.patron!.titles[1]!.title);
    expect(titles).not.toContain(tide.patron!.titles[2]!.title);
  });

  it('chaque mécène ajoute des éclats à tous les participants, jusqu’au maximum du soir', () => {
    const base = tideShards(60, 0, 100, content).shards;
    expect(tideShards(60, 0, 100, content, 1).shards).toBe(Math.round(base * (1 + tide.patron!.shardBonus)));
    const capped = tideShards(60, 0, 100, content, tide.patron!.maxPerNight);
    expect(tideShards(60, 0, 100, content, tide.patron!.maxPerNight + 2).shards).toBe(capped.shards);
  });
});

describe('Ouvrages du clan', () => {
  it('la suite des ouvrages tourne sans fin', () => {
    const n = content.clanWorks!.works.length;
    expect(workAt(1, content)!.id).toBe(content.clanWorks!.works[0]!.id);
    expect(workAt(n + 1, content)!.id).toBe(workAt(1, content)!.id);
    expect(workAt(10 * n + 3, content)!.id).toBe(workAt(3, content)!.id);
  });

  it('le coût suit les membres actifs, monte un peu puis se stabilise', () => {
    const ref = content.settings.clan.minMembersForCost;
    const n = content.clanWorks!.works.length;
    const g = (level: number, members: number) => worksNeeds(level, members, content).gold;
    expect(g(1, ref * 2)).toBe(2 * g(1, ref));
    expect(g(1 + n, ref)).toBeGreaterThan(g(1, ref));
    // Au-delà du plafond de croissance, deux tours plus loin coûtent pareil.
    expect(g(1 + 30 * n, ref)).toBe(g(1 + 40 * n, ref));
    expect(g(1 + 40 * n, ref)).toBe(Math.ceil(workAt(1, content)!.gold * content.clanWorks!.growth.max));
  });

  it('le Banquet donne son bonus d’XP pendant ses heures seulement, en ligne comme hors ligne', () => {
    const recipe = Object.values(content.recipes).find((r) => r.inputs.length === 0 && r.level === 1)!;
    const s0 = startActivity(makeState({}), recipe.id, 10_000, 'replace', T0, content);
    const plain = advance(s0, T0 + 4 * HOUR, content).state.skills[recipe.profession]!;
    const bonus = content.clanWorks!.banquet.xpBonus;
    const fed = advance({ ...s0, banquet: { from: T0 + HOUR, until: T0 + 3 * HOUR, bonus } }, T0 + 4 * HOUR, content).state.skills[recipe.profession]!;
    // Deux heures sur quatre au bonus : +bonus / 2 en tout (à une fabrication près).
    expect(fed / plain).toBeGreaterThan(1 + bonus / 2 - 0.02);
    expect(fed / plain).toBeLessThan(1 + bonus / 2 + 0.02);
  });
});

describe('l’Affineur du bourg', () => {
  const rand = () => 0.3;
  const epic = Object.values(content.gearModels).find((m) => m.rarity === 'epic' && m.tier === 60 && !m.set && !m.talent && m.slot === 'torso')!;
  const rare = Object.values(content.gearModels).find((m) => m.rarity === 'rare' && m.tier === 60 && !m.set && !m.talent && m.slot === 'torso')!;

  it('les rangs ne vont qu’aux belles pièces, et chacun coûte plus que le précédent, sans plafond', () => {
    expect(canRankUp(epic, content)).toBe(true);
    expect(canRankUp(rare, content)).toBe(false);
    let g = { ...newInstance(epic, content, rand), id: 1 };
    const c0 = rankCost(g, content)!;
    expect(c0.gold).toBeGreaterThan(0);
    expect(c0.items.length).toBe(1);
    let s = makeState({ gold: 10_000_000, inventory: { [c0.items[0]!.item]: 1_000_000 } });
    for (let i = 0; i < 40; i++) ({ state: s, gear: g } = rankUp(s, g, content));
    expect(g.rank).toBe(40);
    const c40 = rankCost(g, content)!;
    expect(c40.gold).toBeGreaterThan(c0.gold * 100);
    expect(c40.items[0]!.qty).toBeGreaterThan(c0.items[0]!.qty * 10);
    // Les lignes fixes montent avec le rang, et le combat le lit.
    const per = content.gearCrafting!.refine!.rank.statPerRank;
    expect(rankedStats(epic, 40, content)[0]!.value).toBe(Math.round(epic.stats[0]!.value * (1 + 40 * per)));
    const base = makeState({ classId: 'forgefire', combat: { ...makeState({}).combat, xp: { forgefire: content.xpTable[60]! } }, equipment: [{ model: epic.id, lines: [] }] });
    const up = { ...base, equipment: [{ model: epic.id, lines: [], rank: 40 }] };
    expect(equipmentSetup(up, content).stats?.power ?? 0).toBeGreaterThanOrEqual(equipmentSetup(base, content).stats?.power ?? 0);
  });

  it('l’affûtage monte une ligne vers son maximum, jamais au-delà, et chaque service coûte plus', () => {
    let g = { ...newInstance(epic, content, rand), id: 1 };
    expect(g.lines.length).toBeGreaterThan(0);
    const c0 = honeCost(g, content)!;
    let s = makeState({ gold: 10_000_000, inventory: { [c0.items[0]!.item]: 1_000_000 } });
    for (let i = 0; i < 30 && g.lines[0]!.value < g.lines[0]!.max; i++) ({ state: s, gear: g } = honeLine(s, g, 0, content));
    expect(g.lines[0]!.value).toBe(g.lines[0]!.max);
    expect(() => honeLine(s, g, 0, content)).toThrow(/maximum/);
    expect(honeCost(g, content)!.gold).toBeGreaterThan(c0.gold);
  });

  it('sans l’or ou la matière, rien ne se fait', () => {
    const g = { ...newInstance(epic, content, rand), id: 1 };
    expect(() => rankUp(makeState({ gold: 0 }), g, content)).toThrow(/or/);
    expect(() => rankUp(makeState({ gold: 10_000_000 }), g, content)).toThrow(/Il faut/);
  });
});

describe('démontage et retaille (docs/design/eclats.md)', () => {
  let n = 0;
  const rand = () => ((n = (n * 9301 + 49297) % 233280), n / 233280);
  const find = (rarity: string, tier: number) => Object.values(content.gearModels).find((m) => m.rarity === rarity && m.tier === tier && !m.set && !m.talent && !m.starter && m.slot === 'torso' && m.rolls[1] >= 2)!;
  const epic40 = find('epic', 40);
  const dust = content.gearCrafting!.refine!.salvage!.item;

  it('une pièce du sac se démonte en poussière, selon sa rareté et son palier ; portée ou en vitrine, non', () => {
    const g = { ...newInstance(epic40, content, rand), id: 1 };
    expect(salvageYield(g, content)).toEqual({ item: dust, qty: 16 }); // 8 × palier 40 (×2)
    expect(salvageYield({ ...g, equipped: 'torso' }, content)).toBeNull();
    expect(salvageYield({ ...g, price: 100 }, content)).toBeNull();
    expect(salvageYield({ ...g, rank: 1 }, content)!.qty).toBe(24); // pièce travaillée : +50 %
    const c1 = Object.values(content.gearModels).find((m) => m.rarity === 'common' && m.tier === 1 && !m.starter)!;
    const common1 = { ...newInstance(c1, content, rand), id: 2 };
    const r = salvageGear(makeState({}), [g, common1], content);
    expect(r.state.inventory[dust]).toBe(17);
    expect(r.state.gold).toBe(makeState({}).gold); // ni or ni matière en retour
    expect(() => salvageGear(makeState({}), [{ ...g, equipped: 'torso' }], content)).toThrow(/portée/);
  });

  it('la retaille propose deux lignes, on garde l’une ou l’actuelle, et seule cette ligne se retaille ensuite', () => {
    let g = { ...newInstance(epic40, content, rand), id: 1 };
    expect(rerollableLines(g, content).length).toBe(g.lines.length);
    const c0 = rerollCost(g, content)!;
    expect(c0.items).toEqual([{ item: dust, qty: 80 }]); // 40 × palier 40 (×2)
    let s = makeState({ gold: 10_000_000, inventory: { [dust]: 100_000 } });
    ({ state: s, gear: g } = rerollLine(s, g, 1, content, rand));
    expect(s.inventory[dust]).toBe(100_000 - 80);
    expect(g.rerollOffer!.length).toBe(2);
    const others = g.lines.filter((_, i) => i !== 1).map((l) => l.name);
    for (const o of g.rerollOffer!) {
      expect(others).not.toContain(o.name); // jamais une ligne que la pièce a déjà ailleurs
      expect(o.value).toBeGreaterThanOrEqual(o.min);
      expect(o.value).toBeLessThanOrEqual(o.max);
    }
    // Il faut choisir avant de retailler encore.
    expect(() => rerollLine(s, g, 1, content, rand)).toThrow(/Choisissez/);
    const picked = g.rerollOffer![0]!;
    g = chooseReroll(g, 0);
    expect(g.lines[1]).toEqual(picked);
    expect(g.rerollOffer).toBeNull();
    // Désormais, seule la ligne 1 se retaille, et elle coûte ×1,5.
    expect(rerollableLines(g, content)).toEqual([1]);
    expect(() => rerollLine(s, g, 0, content, rand)).toThrow(/Seule la ligne/);
    expect(rerollCost(g, content)!.items[0]!.qty).toBe(120);
    expect(rerollCost(g, content)!.gold).toBeGreaterThan(c0.gold);
    // Garder l'actuelle : la ligne ne change pas.
    ({ state: s, gear: g } = rerollLine(s, g, 1, content, rand));
    const before = g.lines[1];
    expect(chooseReroll(g, null).lines[1]).toEqual(before);
  });

  it('les lignes d’un chef-d’œuvre et les pièces de départ ne se retaillent pas', () => {
    const mp = { ...newInstance(epic40, content, rand, { masterpiece: true }), id: 1 };
    expect(rerollCost(mp, content)).toBeNull();
    expect(() => rerollLine(makeState({ gold: 1e7, inventory: { [dust]: 1e5 } }), mp, 0, content, rand)).toThrow(/chef-d’œuvre/);
    const starter = Object.values(content.gearModels).find((m) => m.starter)!;
    expect(rerollCost({ ...newInstance(starter, content, rand), id: 2 }, content)).toBeNull();
  });
});

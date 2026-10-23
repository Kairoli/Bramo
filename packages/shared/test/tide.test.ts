import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { loadContent } from '../src/node/index.js';
import { emptyCombat } from '../src/combat/progress.js';
import {
  tideRanking,
  tideRecap,
  buyTideItem,
  claimWeeklyChests,
  deliverTideWork,
  joinTideLive,
  isRegistered,
  registerTide,
  registrationWindow,
  readTide,
  recordTideNight,
  tideDay,
  tideOf,
  tideOpen,
  tideScore,
  tideShards,
  tideTitles,
  tideWeek,
  tideWindow,
} from '../src/combat/tide.js';
import { chooseOutfit, unlockedOutfits } from '../src/engine/actions.js';
import { makeState } from './fixture.js';

const content = loadContent(fileURLToPath(new URL('../../../data', import.meta.url)));
const tide = content.combat!.tide!;
const DAY = 86_400_000;

const fighter = (classId: string, level: number) =>
  makeState({
    classId,
    combat: { ...emptyCombat(), xp: { [classId]: content.xpTable[level]! } },
    equipment: Object.values(content.gearModels)
      .filter((m) => m.starter && m.classes.includes(classId))
      .map((m) => ({ model: m.id, lines: [] })),
  });

describe('la Marée du soir', () => {
  it('monte chaque soir à son heure, pendant une heure, et la Marée tourne d’un soir à l’autre', () => {
    const day = 20_000;
    const w = tideWindow(day, tide);
    expect(w.end - w.start).toBe(tide.durationMin * 60_000);
    expect(tideOpen(w.start + 1000, tide)).toBe(true);
    expect(tideOpen(w.start - 1000, tide)).toBe(false);
    expect(tideOpen(w.end, tide)).toBe(false);
    const ids = [0, 1, 2, 3].map((k) => tideOf(day + k, tide).id);
    expect(new Set(ids.slice(0, 3)).size).toBe(3);
    expect(ids[3]).toBe(ids[0]);
    expect(tideDay(w.start)).toBe(day);
  });

  it('20 h à Paris, en heure d’hiver comme d’été', () => {
    const winter = tideWindow(Math.floor(Date.UTC(2026, 0, 15) / DAY), tide).start;
    const summer = tideWindow(Math.floor(Date.UTC(2026, 6, 15) / DAY), tide).start;
    expect(new Date(winter).getUTCHours()).toBe(19);
    expect(new Date(summer).getUTCHours()).toBe(18);
  });

  it('un build moyen marque environ 60 points, jamais moins que le plancher, un peu plus quand on est là', () => {
    for (const classId of ['forgefire', 'tracker', 'runist']) {
      const s = fighter(classId, 30);
      for (let day = 20_000; day < 20_003; day++) {
        const r = tideScore(s, day, content, false);
        expect(r.points).toBeGreaterThanOrEqual(Math.round(60 * tide.points.minRatio));
        expect(r.points).toBeLessThanOrEqual(60 * tide.points.maxRatio);
        const live = tideScore(s, day, content, true);
        expect(live.points).toBeGreaterThanOrEqual(r.points);
        expect(live.points).toBeLessThanOrEqual(Math.ceil(r.points * (1 + tide.points.liveBonus)) + 1);
      }
    }
  });

  it('canal travail : la part de ce que la digue demande, livrée le soir même', () => {
    const day = 20_000;
    const def = tideOf(day, tide);
    const now = tideWindow(day, tide).start + 60_000;
    const s = makeState({ classId: 'runist', inventory: Object.fromEntries(def.work.items.map((w) => [w.item, Math.ceil(w.qty / 2)])) });
    const { state, delivered } = deliverTideWork(s, now, content);
    expect(Object.keys(delivered).length).toBe(def.work.items.length);
    expect(readTide(state.combat.tide).channel).toBe('work');
    const r = tideScore(state, day, content, false);
    expect(r.channel).toBe('work');
    const half = 60 * tide.points.workMultiplier * 0.5;
    expect(r.points).toBeGreaterThan(half - 6);
    expect(r.points).toBeLessThanOrEqual(half + 1);
    // Le lendemain, la livraison ne compte plus : il repart au combat.
    expect(tideScore(state, day + 1, content, false).channel).toBe('combat');
  });

  it('les seuils du serveur donnent un bonus à tout le monde', () => {
    const none = tideShards(60, 0, 10, content);
    const all = tideShards(60, 10_000, 10, content);
    expect(none.thresholds).toBe(0);
    expect(all.thresholds).toBe(tide.shards.thresholds.length);
    expect(all.shards - none.shards).toBe(tide.shards.thresholds.reduce((s, t) => s + t.bonus, 0));
  });

  it('on s’inscrit pendant l’heure qui précède la Marée, et on ne la rejoint en direct qu’inscrit et pendant la Marée', () => {
    const day = 20_000;
    const w = tideWindow(day, tide);
    const reg = registrationWindow(day, tide);
    expect(reg.end).toBe(w.start);
    expect(reg.end - reg.start).toBe(tide.registrationMin * 60_000);
    // Trop tôt, trop tard : refusé.
    expect(() => registerTide(fighter('runist', 5), reg.start - 60_000, content)).toThrow(/19 h/);
    expect(() => registerTide(fighter('runist', 5), w.start + 60_000, content)).toThrow(/19 h/);
    const registered = registerTide(fighter('runist', 5), reg.start + 60_000, content);
    expect(isRegistered(registered, day)).toBe(true);
    expect(isRegistered(registered, day + 1)).toBe(false);
    // En direct : seulement inscrit, et seulement pendant la Marée.
    expect(() => joinTideLive(fighter('runist', 5), w.start + 60_000, content)).toThrow(/inscrire/);
    expect(() => joinTideLive(registered, w.start - 60_000, content)).toThrow(/20 h/);
    expect(readTide(joinTideLive(registered, w.start + 60_000, content).combat.tide).liveDay).toBe(day);
  });

  it('le coffre de la semaine compte les meilleurs soirs, une seule fois ; les éclats débloquent une tenue de sa classe', () => {
    const s = fighter('forgefire', 25);
    const monday = 20_003; // un lundi : (jour + 3) est un multiple de 7
    expect(tideWeek(monday)).toBe(tideWeek(monday + 6));
    expect(tideWeek(monday + 7)).toBe(tideWeek(monday) + 1);
    for (let k = 0; k < 6; k++) recordTideNight(s, { day: monday + k, tide: tideOf(monday + k, tide).id, points: 60 + k, shards: 70, live: false, channel: 'combat' }, content);
    expect(s.inventory[tide.shards.item]).toBe(420);
    const now = (monday + 8) * DAY;
    const chests = claimWeeklyChests(s, now, content);
    expect(chests).toHaveLength(1);
    expect(chests[0]!.nights).toBe(tide.weekly.bestNights);
    expect(chests[0]!.points).toBe(65 + 64 + 63 + 62);
    expect(chests[0]!.materials!.qty).toBeGreaterThan(0);
    expect(claimWeeklyChests(s, now, content)).toHaveLength(0);
    const offer = tide.shop.find((o) => content.cosmetics.outfits.find((x) => x.id === o.outfit)!.classes.includes('forgefire'))!;
    expect(unlockedOutfits(s, content)).not.toContain(offer.outfit);
    s.inventory[tide.shards.item] = offer.cost;
    const bought = buyTideItem(s, offer.id, content);
    expect(bought.inventory[tide.shards.item] ?? 0).toBe(0);
    expect(unlockedOutfits(bought, content)).toContain(offer.outfit);
    expect(chooseOutfit(bought, offer.outfit, content).outfit).toBe(offer.outfit);
    expect(() => buyTideItem(bought, offer.id, content)).toThrow();
  });

  it('les titres viennent du nombre de soirs', () => {
    const s = fighter('runist', 10);
    const t = tide.titles[0]!;
    for (let k = 0; k < t.nights; k++) recordTideNight(s, { day: 30_000 + k * 3, tide: t.tide, points: 50, shards: 50, live: false, channel: 'combat' }, content);
    expect(tideTitles(s, content)).toContain(t.title);
  });
});

describe('récapitulatif de fin de soirée', () => {
  it('cite le meilleur de chaque rôle, jamais quelqu’un pour zéro', () => {
    const recap = tideRecap([
      { characterId: 1, name: 'Forge', points: 90, channel: 'combat', stats: { damage: 50_000, healing: 0, shielding: 8000, control: 100 } },
      { characterId: 2, name: 'Rune', points: 70, channel: 'combat', stats: { damage: 30_000, healing: 6000, shielding: 0, control: 4000 } },
      { characterId: 3, name: 'Pelle', points: 84, channel: 'work' },
    ]);
    const by = Object.fromEntries(recap.map((a) => [a.key, a.name]));
    expect(by).toEqual({ mvp: 'Forge', damage: 'Forge', healing: 'Rune', shielding: 'Forge', control: 'Rune', work: 'Pelle' });
    expect(tideRecap([{ characterId: 1, name: 'Seul', points: 60, channel: 'combat', stats: { damage: 10, healing: 0, shielding: 0, control: 0 } }]).map((a) => a.key)).toEqual(['mvp', 'damage']);
  });
});

describe('classement d’un soir', () => {
  it('trie chaque catégorie, partage les ex æquo, donne le rang du joueur et garde dix lignes', () => {
    const entries = Array.from({ length: 14 }, (_, i) => ({ characterId: i + 1, name: 'J' + (i + 1), points: 100 - i, channel: 'combat', stats: { damage: i === 1 ? 5000 : 1000 * (14 - i), healing: 0, shielding: 0, control: 0 } }));
    entries.push({ characterId: 99, name: 'Ouvrier', points: 84, channel: 'work', stats: null } as never);
    const r = tideRanking(entries, 12);
    const points = r.find((c) => c.key === 'mvp')!;
    expect(points.top.length).toBe(10);
    expect(points.top[0]!.entry.name).toBe('J1');
    expect(points.me).toEqual({ rank: 12, value: 89 });
    expect(points.count).toBe(15);
    const damage = r.find((c) => c.key === 'damage')!;
    expect(damage.count).toBe(14); // l'ouvrier ne compte pas aux dégâts
    expect(damage.top[0]!.value).toBe(14000);
    expect(r.find((c) => c.key === 'healing')!.count).toBe(0); // personne pour zéro
    const tie = tideRanking([{ characterId: 1, name: 'A', points: 50, channel: 'combat' }, { characterId: 2, name: 'B', points: 50, channel: 'combat' }], null)[0]!;
    expect(tie.top.map((x) => x.rank)).toEqual([1, 1]);
  });
});

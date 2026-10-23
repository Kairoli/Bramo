/**
 * La Marée du soir côté serveur (moteur : packages/shared/src/combat/tide.ts).
 *
 * - Règlement : à la première requête après la fin d'une Marée, le serveur règle ce soir-là une fois pour tous les
 *   participants (les absents qui ont gardé « Rejoindre chaque soir », ceux qui l'ont rejointe en direct ou qui ont livré
 *   la digue) : points, total du serveur, seuils franchis, éclats de chacun.
 * - Les éclats, le coffre de la semaine et sa cache d'équipement arrivent à la prochaine visite du joueur (`claimTide`).
 */
import { and, eq, gte, isNotNull } from 'drizzle-orm';
import {
  type CharacterState,
  type Content,
  type TideNight,
  type TideView,
  claimWeeklyChests,
  lastFinishedTide,
  readTide,
  recordTideNight,
  stream,
  tideDay,
  tideOf,
  tideOpen,
  tideScore,
  tideShards,
  tideTitles,
  tideWeek,
  tideWindow,
} from '@bramo/shared';
import type { Db, Tx } from './db/index.js';
import { characters, tideDays, tideEntries } from './db/schema.js';
import { loadCharacterById } from './characters.js';
import { grantGear } from './gear.js';

const DAY = 86_400_000;
/** Un personnage qui n'est pas venu depuis une semaine ne part plus à la Marée (comptes oubliés). */
const ACTIVE_DAYS = 7;

/** Dernier soir déjà réglé, par base (évite une requête à chaque appel). */
const settled = new WeakMap<object, number>();

export async function settleTide(db: Db, content: Content, now: number): Promise<void> {
  const rules = content.combat?.tide;
  if (!rules) return;
  const day = lastFinishedTide(now, rules);
  if ((settled.get(db) ?? -1) >= day) return;
  await db.transaction(async (tx) => {
    const claimed = await tx.insert(tideDays).values({ day, tide: tideOf(day, rules).id, settledAt: new Date(now) }).onConflictDoNothing().returning();
    if (!claimed.length) return;
    const since = new Date(tideWindow(day, rules).start - ACTIVE_DAYS * DAY);
    const rows = await tx
      .select({ id: characters.id })
      .from(characters)
      .where(and(isNotNull(characters.classId), gte(characters.lastSeenAt, since)));
    const entries: (typeof tideEntries.$inferInsert)[] = [];
    for (const { id } of rows) {
      const loaded = await loadCharacterById(tx, id, content);
      if (!loaded) continue;
      const t = readTide(loaded.state.combat.tide);
      const live = t.liveDay === day;
      if (!t.auto && !live && t.work?.day !== day) continue;
      const r = tideScore(loaded.state, day, content, live);
      entries.push({ day, characterId: id, tide: tideOf(day, rules).id, points: r.points, ratio: r.ratio, channel: r.channel, live, shards: 0 });
    }
    const points = entries.reduce((s, e) => s + e.points, 0);
    let thresholds = 0;
    for (const e of entries) {
      const s = tideShards(e.points, points, entries.length, content);
      e.shards = s.shards;
      thresholds = s.thresholds;
    }
    for (let i = 0; i < entries.length; i += 200) await tx.insert(tideEntries).values(entries.slice(i, i + 200)).onConflictDoNothing();
    await tx.update(tideDays).set({ participants: entries.length, points, thresholds }).where(eq(tideDays.day, day));
  });
  settled.set(db, day);
}

/** Éclats des soirs réglés et coffres des semaines finies : versés au joueur, racontés au journal. */
export async function claimTide(tx: Tx, characterId: number, state: CharacterState, content: Content, now: number): Promise<string[]> {
  const rules = content.combat?.tide;
  if (!rules) return [];
  const lines: string[] = [];
  const rows = await tx.select().from(tideEntries).where(and(eq(tideEntries.characterId, characterId), eq(tideEntries.claimed, false)));
  for (const r of rows.sort((a, b) => a.day - b.day)) {
    const def = rules.tides.find((t) => t.id === r.tide);
    const night: TideNight = { day: r.day, tide: r.tide, points: r.points, shards: r.shards, live: r.live, channel: r.channel === 'work' ? 'work' : 'combat' };
    recordTideNight(state, night, content);
    lines.push(`Marée du soir (${def?.name ?? r.tide}) : ${r.points} points${r.live ? ' (en direct)' : ''}, ${r.shards} éclats de marée.`);
    await tx.update(tideEntries).set({ claimed: true }).where(and(eq(tideEntries.day, r.day), eq(tideEntries.characterId, characterId)));
  }
  const rand = stream(characterId, `tide-cache:${now}`);
  for (const chest of claimWeeklyChests(state, now, content)) {
    const parts = [`${chest.points} points sur ${chest.nights} soir${chest.nights > 1 ? 's' : ''}`];
    if (chest.materials) parts.push(`${chest.materials.qty} × ${content.items[chest.materials.item]?.name ?? chest.materials.item}`);
    if (chest.shards) parts.push(`${chest.shards} éclats en plus`);
    if (chest.cache) {
      await grantGear(tx, characterId, chest.cache, content, rand);
      parts.push(`une cache : ${content.gearModels[chest.cache]?.name ?? chest.cache}`);
    }
    lines.push(`Coffre de la semaine de la Marée : ${parts.join(', ')}.`);
  }
  return lines;
}


export async function tideView(tx: Tx, state: CharacterState, content: Content, now: number): Promise<TideView | null> {
  const rules = content.combat?.tide;
  if (!rules) return null;
  const day = tideDay(now);
  const def = tideOf(day, rules);
  const w = tideWindow(day, rules);
  const t = readTide(state.combat.tide);
  const delivered = t.work?.day === day ? t.work.items : {};
  const [last] = await tx.select().from(tideDays).where(eq(tideDays.day, lastFinishedTide(now, rules)));
  const week = t.nights.filter((n) => tideWeek(n.day) === tideWeek(day)).sort((a, b) => b.points - a.points).slice(0, rules.weekly.bestNights);
  return {
    tonight: {
      day,
      id: def.id,
      name: def.name,
      blurb: def.blurb,
      shines: def.shines,
      start: w.start,
      end: w.end,
      open: tideOpen(now, rules),
      work: { text: def.work.text, items: def.work.items.map((x) => ({ item: x.item, name: content.items[x.item]?.name ?? x.item, qty: x.qty, have: state.inventory[x.item] ?? 0, delivered: delivered[x.item] ?? 0 })) },
    },
    prefs: { auto: t.auto, channel: t.channel },
    joinedLive: t.liveDay === day,
    shards: state.inventory[rules.shards.item] ?? 0,
    nights: t.nights,
    week: { points: week.reduce((s, n) => s + n.points, 0), nights: week.length, bestNights: rules.weekly.bestNights, bonusAbove: rules.weekly.bonusAbove },
    shop: rules.shop.map((o) => ({ ...o, owned: t.unlocked.includes(o.outfit), forClass: !!state.classId && !!content.cosmetics.outfits.find((x) => x.id === o.outfit)?.classes.includes(state.classId) })),
    titles: tideTitles(state, content),
    counts: t.counts,
    last: last
      ? { day: last.day, name: rules.tides.find((x) => x.id === last.tide)?.name ?? last.tide, participants: last.participants, points: last.points, objective: rules.shards.objectivePerParticipant * Math.max(1, last.participants), thresholds: last.thresholds, of: rules.shards.thresholds.length }
      : null,
  };
}

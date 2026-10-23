/**
 * La Marée du soir côté serveur (moteur : packages/shared/src/combat/tide.ts).
 *
 * - Règlement : à la première requête après la fin d'une Marée, le serveur règle ce soir-là une fois pour tous les
 *   participants (les absents qui ont gardé « Rejoindre chaque soir », ceux qui l'ont rejointe en direct ou qui ont livré
 *   la digue) : points, total du serveur, seuils franchis, éclats de chacun.
 * - Les éclats, le coffre de la semaine et sa cache d'équipement arrivent à la prochaine visite du joueur (`claimTide`).
 */
import { and, asc, count, desc, eq, gte, inArray, isNotNull } from 'drizzle-orm';
import {
  type CharacterState,
  type Content,
  GameError,
  type TideNight,
  type TideView,
  type TideLiveFighter,
  type TideLiveView,
  type CharacterState as State,
  viewAppearance,
  hash32,
  claimWeeklyChests,
  lastFinishedTide,
  offerTide,
  patronDay,
  patronPrice,
  readTide,
  registrationOpen,
  registrationWindow,
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
import { characters, clanMembers, tideDays, tideEntries, tidePatrons, tideSignups } from './db/schema.js';
import { addRenown } from './clans.js';
import { loadCharacterById } from './characters.js';
import { grantGear } from './gear.js';
import { type NewServerEvent, recordEvents } from './town.js';

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
      // Seuls les inscrits participent (inscription de 19 h à 20 h) ; inscrits, ils combattent même déconnectés.
      if (t.registered !== day) continue;
      const r = tideScore(loaded.state, day, content, live);
      entries.push({ day, characterId: id, tide: tideOf(day, rules).id, points: r.points, ratio: r.ratio, channel: r.channel, live, shards: 0 });
    }
    const points = entries.reduce((s, e) => s + e.points, 0);
    // Mécènes de ce soir : chacun ajoute des éclats à tous les participants.
    const patrons = await tx.select().from(tidePatrons).where(eq(tidePatrons.day, day)).orderBy(asc(tidePatrons.slot));
    let thresholds = 0;
    for (const e of entries) {
      const s = tideShards(e.points, points, entries.length, content, patrons.length);
      e.shards = s.shards;
      thresholds = s.thresholds;
    }
    for (let i = 0; i < entries.length; i += 200) await tx.insert(tideEntries).values(entries.slice(i, i + 200)).onConflictDoNothing();
    await tx.update(tideDays).set({ participants: entries.length, points, thresholds }).where(eq(tideDays.day, day));
    // Renom : chaque clan gagne un peu par membre qui a vraiment tenu la digue.
    const renown = content.settings.clan.renown;
    const events: { kind: 'clan'; text: string }[] = [];
    if (renown && entries.length) {
      const ids = new Set(entries.filter((e) => e.points >= renown.tideMinPoints).map((e) => e.characterId));
      const byClan = new Map<number, number>();
      for (const m of await tx.select().from(clanMembers)) if (ids.has(m.characterId)) byClan.set(m.clanId, (byClan.get(m.clanId) ?? 0) + 1);
      for (const [clanId, n] of byClan) {
        const ev = await addRenown(tx, clanId, Math.min(renown.tideMaxPerNight, n) * renown.tideMember, now, content, 'la Marée du soir');
        if (ev) events.push(ev as { kind: 'clan'; text: string });
      }
    }
    if (events.length) await recordEvents(tx, now, events);
    // Le fil du serveur raconte le soir : combien sont venus, combien de lanternes la digue a allumées.
    if (entries.length) {
      const def = tideOf(day, rules);
      const of = rules.shards.thresholds.length;
      const offered = patrons.length ? ` Marée offerte par ${patrons.map((p) => p.characterName).join(', ')}.` : '';
      await recordEvents(tx, now, [{ kind: 'tide', text: `${def.name} : ${entries.length} à la digue, ${thresholds} lanterne${thresholds > 1 ? 's' : ''} sur ${of} allumée${thresholds > 1 ? 's' : ''}.${offered}` }]);
    }
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
  // Inscrit avant que la liste des inscrits existe (ou par un autre chemin) : on l'y rattrape, pour la scène en direct.
  if (t.registered === day && state.seed) await recordSignup(tx, day, state.seed);
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
    prefs: { channel: t.channel },
    registration: { ...registrationWindow(day, rules), open: registrationOpen(now, rules), registered: t.registered === day },
    joinedLive: t.liveDay === day,
    shards: state.inventory[rules.shards.item] ?? 0,
    nights: t.nights,
    week: { points: week.reduce((s, n) => s + n.points, 0), nights: week.length, bestNights: rules.weekly.bestNights, bonusAbove: rules.weekly.bonusAbove },
    shop: rules.shop.map((o) => ({ ...o, owned: t.unlocked.includes(o.outfit), forClass: !!state.classId && !!content.cosmetics.outfits.find((x) => x.id === o.outfit)?.classes.includes(state.classId) })),
    titles: tideTitles(state, content),
    rules: {
      fullPoints: rules.points.perMinute * rules.durationMin,
      minRatio: rules.points.minRatio,
      maxRatio: rules.points.maxRatio,
      workMultiplier: rules.points.workMultiplier,
      liveBonus: rules.points.liveBonus,
      perPoint: rules.shards.perPoint,
      thresholds: rules.shards.thresholds.map((x) => ({ share: x.share, bonus: x.bonus })),
      bestNights: rules.weekly.bestNights,
    },
    counts: t.counts,
    patron: await patronView(tx, state, content, now),
    last: last
      ? { day: last.day, name: rules.tides.find((x) => x.id === last.tide)?.name ?? last.tide, participants: last.participants, points: last.points, objective: rules.shards.objectivePerParticipant * Math.max(1, last.participants), thresholds: last.thresholds, of: rules.shards.thresholds.length }
      : null,
  };
}

// --- La Marée en direct (demande de Louis, 23 octobre : « voir le combat de la Marée, tous les gens qui ont rejoint à
// gauche, ce qu'ils affrontent à droite ») ---

/** Inscription d'un soir, pour la scène en direct. */
export async function recordSignup(tx: Tx, day: number, characterId: number): Promise<void> {
  await tx.insert(tideSignups).values({ day, characterId }).onConflictDoNothing();
}

/** Points de chaque inscrit ce soir (calculés une fois : quelques combats simulés chacun). */
const scoreCache = new Map<string, number>();
/** Combattants montrés dans la scène (les autres sont comptés). */
const SHOWN = 28;

/** La scène de la Marée en direct : inscrits, phase, avancée estimée de la digue (réglée après la fin). */
export async function tideLive(tx: Tx, content: Content, now: number, meId: number): Promise<TideLiveView | null> {
  const rules = content.combat?.tide;
  if (!rules) return null;
  const day = tideDay(now);
  const def = tideOf(day, rules);
  const w = tideWindow(day, rules);
  const reg = registrationWindow(day, rules);
  const phase: TideLiveView['phase'] = now < reg.start ? 'idle' : now < w.start ? 'gathering' : now < w.end ? 'battle' : 'done';
  const n = (await tx.select({ n: count() }).from(tideSignups).where(eq(tideSignups.day, day)))[0]?.n ?? 0;
  const signups = await tx.select().from(tideSignups).where(eq(tideSignups.day, day)).orderBy(asc(tideSignups.at)).limit(400);
  const ids = signups.map((s) => s.characterId);
  const rows = ids.length ? await tx.select({ id: characters.id, name: characters.name, classId: characters.classId, outfit: characters.outfit, look: characters.look, combat: characters.combat }).from(characters).where(inArray(characters.id, ids)) : [];
  const byId = new Map(rows.map((r) => [r.id, r]));
  const fighters: (TideLiveFighter & { at: number })[] = [];
  for (const s of signups) {
    const r = byId.get(s.characterId);
    if (!r) continue;
    const appearance = viewAppearance({ classId: r.classId, outfit: r.outfit, look: r.look } as unknown as State, content);
    if (!appearance) continue;
    fighters.push({ id: r.id, name: r.name, appearance, live: readTide((r.combat as State['combat'] | undefined)?.tide).liveDay === day, me: r.id === meId, at: s.at.getTime() });
  }
  // Le joueur d'abord, puis ceux qui tiennent la digue en direct, puis les premiers inscrits.
  fighters.sort((a, b) => Number(b.me) - Number(a.me) || Number(b.live) - Number(a.live) || a.at - b.at);
  const total = Number(n);
  const objective = rules.shards.objectivePerParticipant * Math.max(1, total);
  let points = 0;
  if (phase === 'done') {
    const [settledDay] = await tx.select().from(tideDays).where(eq(tideDays.day, day));
    points = settledDay?.points ?? 0;
  }
  if (phase === 'battle' || (phase === 'done' && !points)) {
    // Chaque inscrit marque au fil de l'heure ; ses points du soir sont calculés une fois (pour 40 de plus par appel au plus).
    let computed = 0;
    let known = 0;
    let sum = 0;
    for (const id of ids) {
      const key = `${day}:${id}`;
      if (!scoreCache.has(key) && computed < SHOWN) {
        const loaded = await loadCharacterById(tx, id, content);
        if (loaded) scoreCache.set(key, tideScore(loaded.state, day, content, readTide(loaded.state.combat.tide).liveDay === day).points);
        computed++;
      }
      const v = scoreCache.get(key);
      if (v !== undefined) (known++, (sum += v));
    }
    const average = known ? sum / known : rules.points.perMinute * rules.durationMin;
    const f = phase === 'done' ? 1 : Math.min(1, Math.max(0, (now - w.start) / (w.end - w.start)));
    points = Math.round((sum + average * (total - known)) * f);
  }
  const shares = rules.shards.thresholds.map((t) => t.share);
  return {
    day,
    tide: def.id,
    name: def.name,
    phase,
    registrationStart: reg.start,
    start: w.start,
    end: w.end,
    serverTime: now,
    fighters: fighters.slice(0, SHOWN).map(({ at: _at, ...f }) => f),
    total,
    progress: { points, objective, shares, lit: shares.filter((s) => points >= s * objective).length },
    demo: false,
  };
}

/**
 * Démonstration de la scène (développement, pour la voir à toute heure) : une foule d'essai tirée du jour, toutes les
 * tenues (de départ, de saison, Marée haute), quelques pièces d'Halloween ; la Marée monte sur dix minutes, puis recommence.
 */
export function tideLiveDemo(content: Content, now: number, tideId?: string): TideLiveView | null {
  const rules = content.combat?.tide;
  if (!rules) return null;
  const day = tideDay(now);
  // Les trois Marées se suivent, une par cycle de dix minutes, pour toutes les voir.
  const def = rules.tides.find((x) => x.id === tideId) ?? rules.tides[Math.floor(now / (10 * 60_000)) % rules.tides.length]!;
  const names = ['Brume', 'Tisonne', 'Aulne', 'Grésil', 'Ferrand', 'Lysandre', 'Pétrel', 'Marne', 'Sorbe', 'Cendrine', 'Galet', 'Ronce', 'Vireo', 'Halle', 'Ombeline', 'Tarn', 'Écume', 'Bastide', 'Saule', 'Fauve', 'Lanterne', 'Corvin', 'Ysolde', 'Rocaille', 'Varech', 'Bruyère', 'Héron', 'Molène'];
  const classes = Object.keys(content.classes);
  const pieces = (content.cosmetics.pieces ?? []).filter((p) => p.slot !== 'weapon');
  const fighters: TideLiveFighter[] = names.map((name, i) => {
    const r = hash32(`demo:${day}:${i}`);
    const classId = classes[r % classes.length]!;
    const outfits = content.cosmetics.outfits.filter((o) => o.classes.includes(classId) && (!o.id.startsWith('sketch_') || o.id.startsWith('sketch_season_')));
    const outfit = outfits[(r >>> 4) % outfits.length]!.id;
    const extra = (r >>> 9) % 5 === 0 ? pieces[(r >>> 12) % Math.max(1, pieces.length)] : undefined;
    return { id: -1 - i, name, appearance: { classId, outfit, ...(extra ? { overrides: { [extra.slot]: extra.id } } : {}) }, live: (r >>> 15) % 3 === 0, me: false };
  });
  const cycle = 10 * 60_000;
  const start = now - (now % cycle);
  const total = 128;
  const objective = rules.shards.objectivePerParticipant * total;
  const f = (now - start) / cycle;
  const points = Math.round(total * rules.points.perMinute * rules.durationMin * 1.05 * f);
  const shares = rules.shards.thresholds.map((t) => t.share);
  return {
    day,
    tide: def.id,
    name: def.name,
    phase: 'battle',
    registrationStart: start - cycle,
    start,
    end: start + cycle,
    serverTime: now,
    fighters,
    total,
    progress: { points, objective, shares, lit: shares.filter((s) => points >= s * objective).length },
    demo: true,
  };
}

/** Participants du dernier soir réglé (le prix du mécène suit la taille du serveur). */
async function lastParticipants(tx: Tx): Promise<number> {
  const [last] = await tx.select({ participants: tideDays.participants }).from(tideDays).orderBy(desc(tideDays.day)).limit(1);
  return last?.participants ?? 0;
}

/**
 * Mécène de la Marée : le joueur offre la prochaine Marée au serveur. Son or est détruit, son nom est inscrit (une place
 * par `slot`, `patron.maxPerNight` au plus : deux offres simultanées pour la dernière place, l'une échoue), le fil le raconte.
 */
export async function offerPatron(
  tx: Tx,
  characterId: number,
  characterName: string,
  state: CharacterState,
  content: Content,
  now: number,
): Promise<{ state: CharacterState; log: string; serverEvents: NewServerEvent[] }> {
  const rules = content.combat?.tide;
  if (!rules?.patron) throw new GameError('no_patron', 'On ne peut pas encore offrir la Marée.');
  const day = patronDay(now, rules);
  const taken = await tx.select().from(tidePatrons).where(eq(tidePatrons.day, day));
  if (taken.some((p) => p.characterId === characterId)) throw new GameError('already_patron', 'Vous offrez déjà cette Marée.');
  if (taken.length >= rules.patron.maxPerNight) throw new GameError('patrons_full', `Cette Marée a déjà ${rules.patron.maxPerNight} mécènes : revenez demain.`);
  const price = patronPrice(await lastParticipants(tx), content);
  const next = offerTide(state, price, content);
  const inserted = await tx
    .insert(tidePatrons)
    .values({ day, slot: taken.length + 1, characterId, characterName, gold: price, at: new Date(now) })
    .onConflictDoNothing()
    .returning();
  if (!inserted.length) throw new GameError('patrons_full', 'Quelqu’un vient de prendre cette place : réessayez.');
  const def = tideOf(day, rules);
  const when = day === tideDay(now) ? 'de ce soir' : 'de demain soir';
  const bonus = Math.round(rules.patron.shardBonus * 100);
  return {
    state: next,
    log: `Vous offrez ${def.name} ${when} au serveur (${price} or) : +${bonus} % d’éclats pour tous les participants.`,
    serverEvents: [{ kind: 'tide', text: `${characterName} offre ${def.name} ${when} au serveur : +${bonus} % d’éclats pour tous.` }],
  };
}

/** Ce que la Marée montre du mécénat : la prochaine Marée finançable, son prix, ses mécènes, et les titres du joueur. */
async function patronView(tx: Tx, state: CharacterState, content: Content, now: number): Promise<TideView['patron']> {
  const rules = content.combat?.tide;
  if (!rules?.patron) return null;
  const day = patronDay(now, rules);
  const names = (await tx.select().from(tidePatrons).where(eq(tidePatrons.day, day)).orderBy(asc(tidePatrons.slot))).map((p) => p.characterName);
  const offered = readTide(state.combat.tide).patron;
  return {
    day,
    tonight: day === tideDay(now),
    price: patronPrice(await lastParticipants(tx), content),
    names,
    max: rules.patron.maxPerNight,
    shardBonus: rules.patron.shardBonus,
    offered,
    next: rules.patron.titles.find((t) => t.offered > offered) ?? null,
  };
}

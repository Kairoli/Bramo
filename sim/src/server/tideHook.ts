/**
 * La Marée du soir dans le simulateur de serveur : mêmes règles que le serveur (packages/shared/src/combat/tide.ts).
 * Chaque soir, tous les joueurs inscrits (tout le monde, par défaut) marquent ; ceux qui sont connectés pendant l'heure
 * la rejoignent en direct ; les artisans et récolteurs livrent la digue s'ils ont de quoi.
 */
import {
  claimWeeklyChests,
  deliverTideWork,
  readTide,
  recordTideNight,
  setTidePrefs,
  tideDay,
  tideOf,
  tideScore,
  tideShards,
  tideWindow,
  buyTideItem,
  GameError,
} from '@bramo/shared';
import { SIM_START } from '../bot.js';
import type { Bot, HookContext, ServerHook } from './world.js';

const DAY = 86_400_000;

export interface TideStats {
  nights: { day: number; tide: string; participants: number; live: number; work: number; points: number; thresholds: number }[];
  /** Points par soir et par joueur, pour les moyennes par façon de jouer, classe et voie. */
  rows: { bot: number; persona: string; classId: string; path: string | null; tide: string; points: number; ratio: number; live: boolean; channel: string }[];
  outfits: number;
  chests: { caches: number; total: number };
}

export function tideHook(stats: TideStats): ServerHook {
  return {
    name: 'Marée du soir',
    onDayEnd(ctx: HookContext, simDay: number) {
      const tide = ctx.content.combat?.tide;
      if (!tide) return;
      const dayStart = SIM_START + simDay * DAY;
      const day = tideDay(dayStart);
      const def = tideOf(day, tide);
      const w = tideWindow(day, tide);
      const startH = (w.start - dayStart) / 3_600_000;
      const endH = (w.end - dayStart) / 3_600_000;
      const scored: { b: Bot; points: number; ratio: number; live: boolean; channel: string }[] = [];
      for (const b of ctx.bots) {
        if (!b.started || !b.state.classId) continue;
        const online = b.presence.sessions.some((s) => s.at < endH && s.at + s.minutes / 60 > startH);
        const live = online && b.persona.skill >= 0.3;
        // Artisans et récolteurs livrent la digue s'ils ont de quoi ; sinon ils combattent.
        let state = b.state;
        if (b.persona.goal === 'gold' && b.persona.id !== 'speculator') {
          try {
            state = deliverTideWork(state, w.start + 60_000, ctx.content).state;
          } catch (e) {
            if (!(e instanceof GameError)) throw e;
            state = setTidePrefs(state, { channel: 'combat' }, ctx.content);
          }
        }
        b.state = state;
        const r = tideScore(b.state, day, ctx.content, live);
        scored.push({ b, points: r.points, ratio: r.ratio, live, channel: r.channel });
      }
      const total = scored.reduce((s, x) => s + x.points, 0);
      let thresholds = 0;
      for (const x of scored) {
        const s = tideShards(x.points, total, scored.length, ctx.content);
        thresholds = s.thresholds;
        recordTideNight(x.b.state, { day, tide: def.id, points: x.points, shards: s.shards, live: x.live, channel: x.channel as 'combat' | 'work' }, ctx.content);
        ctx.ledger.produced[tide.shards.item] = (ctx.ledger.produced[tide.shards.item] ?? 0) + s.shards;
        stats.rows.push({ bot: x.b.id, persona: x.b.persona.id, classId: x.b.state.classId!, path: x.b.state.combat.paths[x.b.state.classId!] ?? null, tide: def.id, points: x.points, ratio: Math.round(x.ratio * 100) / 100, live: x.live, channel: x.channel });
        // Coffres des semaines finies, et une tenue dès qu'on a de quoi.
        for (const chest of claimWeeklyChests(x.b.state, dayStart + DAY, ctx.content)) {
          stats.chests.total++;
          if (chest.cache) {
            stats.chests.caches++;
            ctx.grantGear(x.b, chest.cache, 'coffre de la Marée');
          }
        }
        const offer = tide.shop.find((o) => {
          const outfit = ctx.content.cosmetics.outfits.find((c) => c.id === o.outfit);
          return outfit?.classes.includes(x.b.state.classId!) && !readTide(x.b.state.combat.tide).unlocked.includes(o.outfit);
        });
        if (offer && (x.b.state.inventory[tide.shards.item] ?? 0) >= offer.cost) {
          x.b.state = buyTideItem(x.b.state, offer.id, ctx.content);
          stats.outfits++;
        }
      }
      stats.nights.push({ day: simDay, tide: def.id, participants: scored.length, live: scored.filter((x) => x.live).length, work: scored.filter((x) => x.channel === 'work').length, points: total, thresholds });
    },
  };
}

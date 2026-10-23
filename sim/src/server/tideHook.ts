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
        // Le canal : celui qui rapporte le plus. Un joueur qui calcule compare son combat à une livraison complète, et livre
        // la digue si c'est mieux, en achetant au marché ce qui lui manque (raisonnablement) ; les autres combattent.
        b.state = setTidePrefs(b.state, { channel: 'combat' }, ctx.content);
        const combat = tideScore(b.state, day, ctx.content, live);
        const workFull = 60 * tide.points.workMultiplier * (live ? 1 + tide.points.liveBonus : 1);
        if (b.persona.skill >= 0.3 && b.persona.id !== 'speculator' && combat.points < workFull * 0.95) {
          let cost = 0;
          for (const it of def.work.items) {
            const need = it.qty - (b.state.inventory[it.item] ?? 0);
            if (need <= 0) continue;
            const asks = ctx.exchange.asks(it.item, b.id);
            const avail = asks.reduce((n, x) => n + x.qty, 0);
            if (avail < need) continue;
            const top = asks.reduce((p, x) => (p.n < need ? { n: p.n + x.qty, price: x.price } : p), { n: 0, price: 0 }).price;
            if (top * need + cost > b.state.gold * 0.3) continue;
            const r = ctx.exchange.buy(b, it.item, need, top, false);
            cost += r.gold;
          }
          // Il ne livre que s'il a tout : une livraison partielle vaut moins que son combat.
          if (def.work.items.some((it) => (b.state.inventory[it.item] ?? 0) < it.qty)) {
            scored.push({ b, points: combat.points, ratio: combat.ratio, live, channel: combat.channel });
            continue;
          }
          try {
            b.state = deliverTideWork(b.state, w.start + 60_000, ctx.content).state;
            for (const it of def.work.items) ctx.ledger.delivered[it.item] = (ctx.ledger.delivered[it.item] ?? 0) + (readTide(b.state.combat.tide).work?.items[it.item] ?? 0);
          } catch (e) {
            if (!(e instanceof GameError)) throw e;
          }
        }
        const r = readTide(b.state.combat.tide).work?.day === day ? tideScore(b.state, day, ctx.content, live) : combat;
        // Une livraison partielle qui vaut moins que le combat : il combat quand même.
        if (r.channel === 'work' && r.points < combat.points) {
          b.state = setTidePrefs(b.state, { channel: 'combat' }, ctx.content);
          b.state.combat.tide = { ...readTide(b.state.combat.tide), work: null };
        }
        const best = r.points >= combat.points ? r : combat;
        scored.push({ b, points: best.points, ratio: best.ratio, live, channel: best.channel });
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
      // Renom : un peu par membre qui a vraiment tenu la digue.
      const rn = ctx.content.settings.clan.renown;
      if (rn) {
        const byClan = new Map<object, number>();
        for (const x of scored) if (x.b.clan && x.points >= rn.tideMinPoints) byClan.set(x.b.clan, (byClan.get(x.b.clan) ?? 0) + 1);
        for (const [clan, n] of byClan) (clan as { renown: number }).renown += Math.min(rn.tideMaxPerNight, n) * rn.tideMember;
      }
      stats.nights.push({ day: simDay, tide: def.id, participants: scored.length, live: scored.filter((x) => x.live).length, work: scored.filter((x) => x.channel === 'work').length, points: total, thresholds });
    },
  };
}

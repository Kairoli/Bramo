/**
 * Lecture d'une simulation de serveur : les chiffres qui disent si le jeu tient (progression, buts, or, marché, butin,
 * ensembles, classes et voies, contenu PvE, clans). Rend un objet (JSON) et un texte Markdown.
 */
import { type Content, renownRank, routeStage, routeStages } from '@bramo/shared';
import type { Bot, ServerResult } from './world.js';
import type { TideStats } from './tideHook.js';

const median = (xs: number[]) => {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
};
const pct = (x: number) => `${Math.round(x * 100)} %`;
const r1 = (x: number) => Math.round(x * 10) / 10;

/** Valeur d'une série au jour `d` depuis l'arrivée du joueur (null s'il n'y est pas encore). */
const at = (b: Bot, key: keyof Bot['history'], d: number) => {
  const i = d;
  const s = b.history[key];
  return i < s.length ? s[i]! : null;
};
/** Premier jour (depuis l'arrivée) où la série atteint `v`. */
const dayReach = (b: Bot, key: keyof Bot['history'], v: number) => {
  const s = b.history[key];
  for (let i = 0; i < s.length; i++) if (s[i]! >= v) return i;
  return null;
};

/** Marée du soir : qui marque quoi (moyennes par façon de jouer, classe, voie, Marée), éclats, tenues. */
function tideSummary(t: TideStats | undefined, r: ServerResult) {
  if (!t || !t.rows.length) return null;
  const mean = (xs: number[]) => (xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10 : 0);
  const group = (key: (x: TideStats['rows'][number]) => string) => {
    const m = new Map<string, number[]>();
    for (const x of t.rows) m.set(key(x), [...(m.get(key(x)) ?? []), x.points]);
    return Object.fromEntries([...m].map(([k, v]) => [k, mean(v)]));
  };
  const days = r.options.days;
  const shards = r.ledger.produced.tide_shard ?? 0;
  return {
    nights: t.nights.length,
    participation: mean(t.nights.map((n) => n.participants)),
    liveShare: mean(t.nights.map((n) => n.live / Math.max(1, n.participants))),
    workShare: mean(t.nights.map((n) => n.work / Math.max(1, n.participants))),
    thresholds: mean(t.nights.map((n) => n.thresholds)),
    byPersona: group((x) => x.persona),
    byClass: group((x) => x.classId),
    byPath: group((x) => `${x.classId}/${x.path ?? 'avant voie'}`),
    byTidePath: group((x) => `${x.tide}:${x.path ?? x.classId}`),
    live: group((x) => (x.live ? 'en direct' : 'absent')),
    shardsPerPlayerWeek: Math.round((shards / Math.max(1, r.bots.filter((b) => b.started).length) / days) * 7),
    // Inscription de 19 h à 20 h : ce que gagne un soir joué, et la part des joueurs qui viennent.
    shardsPerNight: Math.round(shards / Math.max(1, t.rows.length)),
    participationShare: r1(mean(t.nights.map((n) => n.participants)) / Math.max(1, r.bots.filter((b) => b.started).length)),
    outfits: t.outfits,
    chests: t.chests,
  };
}

export function analyze(r: ServerResult, content: Content, tide?: TideStats) {
  const combat = content.combat!;
  const stages = routeStages(combat);
  const days = r.options.days;
  const bots = r.bots.filter((b) => b.started);
  const personas = [...new Set(bots.map((b) => b.persona.id))];
  const marks = [7, 30, 60, 90, 120, 180].filter((d) => d < days);
  marks.push(days - 1);

  // --- Progression par façon de jouer ---
  const progression = personas.map((p) => {
    const group = bots.filter((b) => b.persona.id === p);
    const row: Record<string, unknown> = { persona: p, label: group[0]!.persona.label, n: group.length };
    for (const d of marks) {
      const vals = (k: keyof Bot['history']) => group.map((b) => at(b, k, d)).filter((x): x is number => x !== null);
      row[`j${d}`] = { classe: median(vals('classLevel')), route: median(vals('best')), metier: median(vals('topLevel')), niveaux: median(vals('totalLevels')), or: Math.round(median(vals('gold'))), equipement: r1(median(vals('gearScore'))), force: Math.round(median(vals('force'))) };
    }
    return row;
  });

  // --- Jalons : jour médian où un joueur y arrive (part qui y arrive) ---
  const milestone = (key: keyof Bot['history'], v: number, group: Bot[]) => {
    const ds = group.map((b) => dayReach(b, key, v));
    const got = ds.filter((x): x is number => x !== null);
    return { share: group.length ? got.length / group.length : 0, day: got.length ? median(got) : null };
  };
  const milestones = personas.map((p) => {
    const g = bots.filter((b) => b.persona.id === p);
    return {
      persona: p,
      route: Object.fromEntries([10, 30, 60, 90, 120, 150].map((s) => [`étape ${s}`, milestone('best', s, g)])),
      classe: Object.fromEntries([30, 50, 75, 90].map((l) => [`niv ${l}`, milestone('classLevel', l, g)])),
      metier: Object.fromEntries([40, 60, 80, 99].map((l) => [`niv ${l}`, milestone('topLevel', l, g)])),
    };
  });

  // --- Buts : qui n'a plus rien qui avance ? ---
  const last = days - 1;
  const goals = bots.map((b) => {
    const since = (key: keyof Bot['history']) => {
      const s = b.history[key];
      let i = s.length - 1;
      while (i > 0 && s[i - 1]! >= s[s.length - 1]!) i--;
      return s.length - 1 - i;
    };
    return {
      bot: b.id,
      persona: b.persona.id,
      // La route ne finit jamais : « premier cycle fini » à la place.
      routeDone: b.state.combat.route.best >= stages.length,
      routeIdle: since('best'),
      gearIdle: since('gearScore'),
      classIdle: since('classLevel'),
      metierIdle: since('topLevel'),
    };
  });
  const idle = (g: (typeof goals)[number]) => g.routeIdle >= 14 && g.gearIdle >= 14 && g.metierIdle >= 14;
  const goalSummary = personas.map((p) => {
    const g = goals.filter((x) => x.persona === p);
    return { persona: p, n: g.length, routeDone: g.filter((x) => x.routeDone).length / g.length, noProgress14d: g.filter(idle).length / g.length, routeStuck14d: g.filter((x) => !x.routeDone && x.routeIdle >= 14).length / g.length };
  });

  // --- Or ---
  const gold = r.days.map((d) => ({ day: d.day, perPlayer: Math.round(d.gold / Math.max(1, d.players)), total: d.gold }));
  const faucet = Object.values(r.ledger.faucet).reduce((s, x) => s + x, 0);
  // Le serveur installé : les 30 derniers jours (les récompenses uniques et les premiers bâtiments de clan sont passés).
  const late = r.days.slice(-30);
  const lateRatio = late.reduce((s, d) => s + d.faucet, 0) / Math.max(1, late.reduce((s, d) => s + d.sink, 0));
  const sink = Object.values(r.ledger.sink).reduce((s, x) => s + x, 0);
  const startGold = content.settings.character.startingGold * bots.length;
  const golds = bots.map((b) => b.state.gold).sort((a, b) => a - b);
  const sum = golds.reduce((s, g) => s + g, 0);
  const gini = sum ? golds.reduce((acc, g, i) => acc + (2 * (i + 1) - golds.length - 1) * g, 0) / (golds.length * sum) : 0;
  const richest = [...bots].sort((a, b) => b.state.gold - a.state.gold).slice(0, 5).map((b) => ({ persona: b.persona.id, gold: b.state.gold, metiers: b.professions }));

  // --- Activité du marché (30 derniers jours) : le marché est-il le réflexe des joueurs ? ---
  const act = r.activity.slice(-30);
  const sumA = (k: 'buyers' | 'purchases' | 'units' | 'gold' | 'bulk' | 'noGold' | 'players') => act.reduce((t, d) => t + d[k], 0);
  const activity = {
    buyersShare: r1((sumA('buyers') / Math.max(1, sumA('players'))) * 100) / 100,
    purchasesPerPlayerDay: r1(sumA('purchases') / Math.max(1, sumA('players'))),
    unitsPerPlayerDay: Math.round(sumA('units') / Math.max(1, sumA('players'))),
    goldPerPlayerDay: Math.round(sumA('gold') / Math.max(1, sumA('players'))),
    bulkPerDay: r1(sumA('bulk') / Math.max(1, act.length)),
    noGoldShare: r1((sumA('noGold') / Math.max(1, sumA('players'))) * 100) / 100,
    weekly: Array.from({ length: Math.ceil(r.activity.length / 7) }, (_, w) => {
      const xs = r.activity.slice(w * 7, w * 7 + 7);
      const p = xs.reduce((t, d) => t + d.players, 0);
      return { buyersShare: Math.round((xs.reduce((t, d) => t + d.buyers, 0) / Math.max(1, p)) * 100), unitsPerPlayerDay: Math.round(xs.reduce((t, d) => t + d.units, 0) / Math.max(1, p)) };
    }),
  };

  // --- Prix : indice pondéré par les volumes, semaine par semaine, et objets bradés ---
  const weeks = Math.ceil(days / 7);
  const index: number[] = [];
  for (let w = 0; w < weeks; w++) {
    let num = 0;
    let den = 0;
    for (const [, p] of Object.entries(r.prices)) {
      const q = p.qty[w]!;
      if (!q || !p.weekly[w]) continue;
      num += (p.weekly[w]! / p.ref) * q * p.ref;
      den += q * p.ref;
    }
    index.push(den ? r1((num / den) * 100) : 0);
  }
  const traded = Object.entries(r.prices)
    .map(([id, p]) => ({ id, name: content.items[id]?.name ?? id, ref: p.ref, qty: p.qty.reduce((s, x) => s + x, 0), last: p.weekly.filter((x) => x > 0).at(-1) ?? 0, first: p.weekly.find((x) => x > 0) ?? 0 }))
    .sort((a, b) => b.qty * b.ref - a.qty * a.ref);
  const crashed = traded.filter((t) => t.qty > 50 && t.last < t.ref * 0.4);
  const soared = traded.filter((t) => t.qty > 20 && t.last > t.ref * 2.5);

  // --- Flux d'objets : produits sans débouché, demandés sans source ---
  const flows = Object.keys(content.items)
    .map((id) => {
      const produced = r.ledger.produced[id] ?? 0;
      const used = (r.ledger.consumed[id] ?? 0) + (r.ledger.delivered[id] ?? 0);
      const sold = r.prices[id]?.qty.reduce((s, x) => s + x, 0) ?? 0;
      return { id, name: content.items[id]!.name, category: content.items[id]!.category, produced, used, sold, stock: bots.reduce((s, b) => s + (b.state.inventory[id] ?? 0), 0) };
    })
    .filter((f) => f.produced > 0 || f.used > 0);
  const deadEnds = flows.filter((f) => f.produced > 100 && f.used < f.produced * 0.05).sort((a, b) => b.produced - a.produced);
  const neverMade = Object.values(content.items).filter((i) => !(r.ledger.produced[i.id] ?? 0) && i.category !== 'vestige').map((i) => i.name);
  // Matières premières (sorties de récolte) qui passent par le marché : produites, utilisées (fabrication, commandes,
  // bâtiments, digue), en valeur de référence. Les objets sans débouché (onglets oubliés) sont à part, dans deadEnds.
  const rawIds = new Set(Object.values(content.recipes).filter((x) => !x.inputs.length).flatMap((x) => x.outputs.map((o) => o.item)));
  const rawFlows = flows.filter((x) => rawIds.has(x.id) && x.sold > 0);
  const rawBalance = {
    produced: Math.round(rawFlows.reduce((t, x) => t + x.produced * (r.refs[x.id] ?? 1), 0)),
    used: Math.round(rawFlows.reduce((t, x) => t + x.used * (r.refs[x.id] ?? 1), 0)),
    sold: Math.round(rawFlows.reduce((t, x) => t + x.sold * (r.refs[x.id] ?? 1), 0)),
  };

  // --- Butin d'équipement ---
  const perBotDay = r.ledger.drops.total / Math.max(1, bots.reduce((s, b) => s + (days - b.joinDay), 0));
  const rarity: Record<string, number> = {};
  for (const [k, v] of Object.entries(r.ledger.drops.classic)) {
    const [rar] = k.split(':');
    rarity[rar!] = (rarity[rar!] ?? 0) + v;
  }
  const allSets = Object.keys(content.gearSets);
  const setWear = Object.fromEntries(allSets.map((s) => [s, 0]));
  const namedWear: Record<string, number> = {};
  for (const b of bots) {
    const counts: Record<string, number> = {};
    for (const g of b.gear) {
      if (!g.equipped) continue;
      const m = content.gearModels[g.model]!;
      if (m.set) counts[m.set] = (counts[m.set] ?? 0) + 1;
      if (m.talent) namedWear[m.talent] = (namedWear[m.talent] ?? 0) + 1;
    }
    for (const [s, n] of Object.entries(counts)) if (n >= 2) setWear[s] = (setWear[s] ?? 0) + 1;
  }
  const sets = allSets.map((s) => ({ set: s, name: content.gearSets[s]!.name, dropped: r.ledger.drops.sets[s] ?? 0, worn2plus: setWear[s] ?? 0 }));
  const allNamed = [...new Set(Object.values(content.gearModels).filter((m) => m.talent && m.named).map((m) => m.talent!))];
  const named = allNamed.map((n) => ({ named: n, dropped: r.ledger.drops.named[n] ?? 0, worn: namedWear[n] ?? 0 }));
  const gearOwned = median(bots.map((b) => b.gear.length));

  // --- Classes et voies ---
  const byClass = Object.keys(combat.kits).map((c) => {
    const g = bots.filter((b) => b.state.classId === c);
    const meta = g.filter((b) => b.persona.classPick === 'meta');
    return { classId: c, n: g.length, share: g.length / bots.length, routeMedian: median(g.map((b) => b.state.combat.route.best)), metaRouteMedian: median(meta.map((b) => b.state.combat.route.best)), levelMedian: median(g.map((b) => b.history.classLevel.at(-1)!)) };
  });
  const byPath = Object.values(combat.paths).map((p) => {
    const g = bots.filter((b) => b.state.classId === p.class && b.state.combat.paths[p.class] === p.id);
    return { path: p.id, name: p.name, classId: p.class, role: p.role, n: g.length, routeMedian: median(g.map((b) => b.state.combat.route.best)) };
  });
  // Même présence, même façon de jouer : la classe change-t-elle quelque chose ? (route à 30 jours depuis l'arrivée, casus
  // seuls : ils tirent leur classe au hasard. Les casus méta prennent la classe en tête et vont plus loin : mélangés, ils
  // gonflaient la médiane de la classe qu'ils choisissent.)
  const classFair = Object.keys(combat.kits).map((c) => {
    const g = bots.filter((b) => b.state.classId === c && b.classSwitches === 0 && b.persona.id === 'casual');
    return { classId: c, n: g.length, route30: median(g.map((b) => at(b, 'best', 30)).filter((x): x is number => x !== null)), route7: median(g.map((b) => at(b, 'best', 7)).filter((x): x is number => x !== null)) };
  });

  // --- Contenu PvE : où les joueurs restent bloqués ---
  const stuck: Record<number, number> = {};
  for (const b of bots) for (const [s, n] of Object.entries(b.stuck)) stuck[Number(s)] = (stuck[Number(s)] ?? 0) + n;
  const walls = Object.entries(stuck)
    .map(([s, n]) => ({ stage: routeStage(combat, Number(s)).label, encounter: combat.encounters[routeStage(combat, Number(s)).encounter]!.name, botDays: n, done: false }))
    .sort((a, b) => b.botDays - a.botDays)
    .slice(0, 12);

  // --- Gardiens : combien de jours on y reste (parmi ceux qui l'ont atteint), et qui passe ---
  const reachedMax = Math.max(0, ...bots.map((b) => b.state.combat.route.best));
  const guardians = Array.from({ length: Math.floor(reachedMax / 10) + 1 }, (_, c) => routeStage(combat, c * 10 + 9))
    .filter((st) => st.guardian)
    .map((st) => {
      const reached = bots.filter((b) => b.state.combat.route.best >= st.index);
      const passed = reached.filter((b) => b.state.combat.route.best > st.index);
      const days = reached.map((b) => b.stuck[st.index] ?? 0);
      return { stage: st.label, name: combat.encounters[st.encounter]!.name, reached: reached.length, passed: passed.length, medianDays: median(days), p90Days: [...days].sort((a, b) => a - b)[Math.floor(days.length * 0.9)] ?? 0 };
    })
    .filter((g) => g.reached > 0);

  // --- Clans ---
  const clans = r.clans.map((c) => ({ id: c.id, members: c.members.filter((m) => m.started).length, levels: Object.values(c.levels).reduce((s, l) => s + l, 0), detail: c.levels, renown: c.renown, rank: renownRank(c.renown, content).rank }));
  const maxLevels = Object.values(content.buildings).reduce((s, b) => s + b.maxLevel, 0);

  // --- Commandes du maître ---
  const trials: Record<string, number> = {};
  for (const t of r.ledger.trials) {
    const rank = content.trials[t.id]!.rank;
    trials[rank] = (trials[rank] ?? 0) + 1;
  }

  // --- Marchands : qui gagne quoi ---
  const traders = personas.map((p) => {
    const g = bots.filter((b) => b.persona.id === p);
    return { persona: p, sales: Math.round(median(g.map((b) => b.totals.salesNet))), purchases: Math.round(median(g.map((b) => b.totals.purchases))), npc: Math.round(median(g.map((b) => b.totals.npcGold))), gold: Math.round(median(g.map((b) => b.state.gold))) };
  });

  return {
    options: r.options,
    runtimeSec: r.runtimeSec,
    fightCache: r.fightCache,
    progression,
    milestones,
    goalSummary,
    economy: { faucet: r.ledger.faucet, sink: r.ledger.sink, faucetTotal: faucet, sinkTotal: sink, lateRatio: r1(lateRatio), sinks: { ...r.ledger.sinks, worksLevels: r.clans.map((c) => c.works.level).sort((a, b) => b - a) }, startGold, gini: r1(gini), gold: gold.filter((_, i) => i % 7 === 0 || i === gold.length - 1), richest },
    market: { activity, index, top: traded.slice(0, 25), crashed: crashed.slice(0, 20), soared: soared.slice(0, 20), lastDay: r.days.at(-1), traders },
    flows: { rawBalance, deadEnds: deadEnds.slice(0, 30), neverMade },
    loot: { perBotDay: r1(perBotDay), total: r.ledger.drops.total, rarity, sets, named, gearOwnedMedian: gearOwned, gems: r.ledger.gemsSocketed, bySource: r.ledger.drops.bySource },
    // Gemmes de talent (24 octobre) : production, achats, butin, sertissage, rythme, prix au marché.
    talent: (() => {
      const items = Object.values(content.items).filter((i) => i.gem && content.combat?.talents?.gems.some((g) => g.id === i.gem));
      const produced = items.reduce((n, i) => n + (r.ledger.produced[i.id] ?? 0), 0);
      const prices = items
        .map((i) => ({ name: i.name, price: r.prices[i.id]?.weekly.filter((x) => x > 0).at(-1) ?? 0, ref: i.value }))
        .filter((x) => x.price > 0)
        .sort((x, y) => y.price - x.price);
      const days = [...r.ledger.talent.firstDays].sort((x, y) => x - y);
      const users = r.bots.filter((b) => b.persona.gems).length;
      const pd = [...r.ledger.talent.pairDays].sort((x, y) => x - y);
      return { ...r.ledger.talent, pairDayMedian: median(pd), pairDayP25: pd[Math.floor(pd.length / 4)] ?? null, crafted: produced - r.ledger.talent.dropped, users, withGem: days.length, firstDayMedian: median(days), firstDayP25: days[Math.floor(days.length / 4)] ?? null, prices: prices.slice(0, 12) };
    })(),
    vitrine: { listed: r.vitrine.listed, sold: r.vitrine.sales.length, medianPrice: median(r.vitrine.sales.map((x) => x.price)), crafted: r.ledger.drops.bySource['fabrication'] ?? 0 },
    supplies: Object.values(content.items)
      .filter((i) => i.potion || i.prep)
      .map((i) => ({ id: i.id, name: i.name, produced: r.ledger.produced[i.id] ?? 0, bought: r.ledger.delivered[i.id] ?? 0, price: r.prices[i.id]?.weekly.filter((x) => x > 0).at(-1) ?? 0 })),
    classes: { byClass, byPath, classFair },
    walls,
    guardians,
    clans: { list: clans, maxLevels },
    trials,
    tide: tideSummary(tide, r),
    notes: r.ledger.notes.slice(0, 60),
  };
}

export type Analysis = ReturnType<typeof analyze>;

export function toMarkdown(a: Analysis): string {
  const L: string[] = [];
  const o = a.options;
  L.push(`# Simulation de serveur : ${o.players} joueurs, ${o.days} jours, composition « ${o.mix} », graine ${o.seed}`);
  L.push('', `Durée du calcul : ${a.runtimeSec} s. Extensions : ${o.hooks.join(', ') || 'aucune'}.`, '');
  L.push('## Progression (médianes par façon de jouer)', '');
  const marks = Object.keys(a.progression[0] ?? {}).filter((k) => k.startsWith('j'));
  L.push(`| Façon de jouer | n | ${marks.map((m) => `${m} : classe · route · métier · or`).join(' | ')} |`);
  L.push(`|---|---|${marks.map(() => '---').join('|')}|`);
  for (const p of a.progression) {
    L.push(`| ${p.label} | ${p.n} | ${marks.map((m) => { const x = p[m] as Record<string, number>; return `${x.classe} · ${x.route} · ${x.metier} · ${x.or}`; }).join(' | ')} |`);

  }
  // La Force (moteur de Puissance), médiane par façon de jouer.
  const force = (n: number) => (!n ? '—' : n >= 1e6 ? `${(n / 1e6).toFixed(1).replace('.', ',')} M` : `${Math.round(n / 1000)} k`);
  L.push('', '**La Force** (moteur de Puissance), médiane :', '');
  L.push(`| Façon de jouer | n | ${marks.map((m) => `${m} : Force`).join(' | ')} |`);
  L.push(`|---|---|${marks.map(() => '---').join('|')}|`);
  for (const p of a.progression) {
    L.push(`| ${p.label} | ${p.n} | ${marks.map((m) => force((p[m] as Record<string, number>).force ?? 0)).join(' | ')} |`);
  }
  L.push('', '## Jalons (jour médian depuis l’arrivée ; part des joueurs qui y arrivent)', '');
  for (const m of a.milestones) {
    const f = (o: Record<string, { share: number; day: number | null }>) => Object.entries(o).map(([k, v]) => `${k} : ${v.day ?? '—'} j (${pct(v.share)})`).join(', ');
    L.push(`- **${m.persona}** — route : ${f(m.route)} ; classe : ${f(m.classe)} ; métier : ${f(m.metier)}`);
  }
  L.push('', '## Buts : qui n’avance plus ?', '');
  L.push('| Façon de jouer | premier cycle fini | route bloquée 14 j | plus rien n’avance depuis 14 j |', '|---|---|---|---|');
  for (const g of a.goalSummary) L.push(`| ${g.persona} | ${pct(g.routeDone)} | ${pct(g.routeStuck14d)} | ${pct(g.noProgress14d)} |`);
  L.push('', '## Or', '');
  L.push(`Robinets : ${Object.entries(a.economy.faucet).map(([k, v]) => `${k} ${v}`).join(', ')} (total ${a.economy.faucetTotal}, plus ${a.economy.startGold} d’or de départ).`);
  L.push(`Puits : ${Object.entries(a.economy.sink).map(([k, v]) => `${k} ${v}`).join(', ')} (total ${a.economy.sinkTotal}). Sur les 30 derniers jours, or créé / détruit : ${a.economy.lateRatio}.`);
  L.push(`Or par joueur : ${a.economy.gold.map((g) => `j${g.day} ${g.perPlayer}`).join(' · ')}. Gini ${a.economy.gini}.`);
  const k = a.economy.sinks;
  L.push(`Puits voulus : ${k.patrons} Marées offertes par des mécènes, ${k.works} ouvrages de clan achevés (niveaux des clans : ${k.worksLevels.join(', ') || 'aucun'}), ${k.banquets} banquets lancés, ${k.ranks} rangs d’affinage achetés (au plus +${k.maxRank}).`);
  L.push(`Plus riches : ${a.economy.richest.map((r) => `${r.persona} ${r.gold} (${r.metiers.join('/')})`).join(' ; ')}.`);
  L.push('', '## Marché', '');
  L.push(`Indice des prix (100 = prix de référence), par semaine : ${a.market.index.join(' · ')}.`);
  const ma = a.market.activity;
  L.push('', `Activité d'achat (30 derniers jours) : ${Math.round(ma.buyersShare * 100)} % des joueurs achètent chaque jour, ${ma.purchasesPerPlayerDay} achats et ${ma.unitsPerPlayerDay} unités (${ma.goldPerPlayerDay} or) par joueur et par jour, ${ma.bulkPerDay} achats en gros (100 unités et plus) par jour ; ${Math.round(ma.noGoldShare * 100)} % des joueurs-jours renoncent à un achat faute d'or. Par semaine (acheteurs du jour, unités) : ${ma.weekly.map((w) => `${w.buyersShare} % / ${w.unitsPerPlayerDay}`).join(' · ')}.`);
  L.push('', '| Objet | réf. | échangés | prix 1re sem. | prix dernière sem. |', '|---|---|---|---|---|');
  for (const t of a.market.top.slice(0, 15)) L.push(`| ${t.name} | ${t.ref} | ${t.qty} | ${t.first} | ${t.last} |`);
  L.push('', `Effondrés (sous 40 % de la référence) : ${a.market.crashed.map((t) => `${t.name} ${t.last}/${t.ref}`).join(', ') || 'aucun'}.`);
  L.push(`Envolés (au-dessus de 250 %) : ${a.market.soared.map((t) => `${t.name} ${t.last}/${t.ref}`).join(', ') || 'aucun'}.`);
  L.push('', '| Façon de jouer | ventes nettes | achats | commandes PNJ | or final |', '|---|---|---|---|---|');
  for (const t of a.market.traders) L.push(`| ${t.persona} | ${t.sales} | ${t.purchases} | ${t.npc} | ${t.gold} |`);
  L.push('', '## Objets sans débouché (produits, presque jamais utilisés)', '');
  L.push(a.flows.deadEnds.map((f) => `${f.name} (${f.produced} produits, ${f.used} utilisés, ${f.sold} vendus, ${f.stock} en stock)`).join(' ; ') || 'aucun');
  L.push('', `Matières premières passées par le marché (en valeur de référence) : ${a.flows.rawBalance.produced} produites, ${a.flows.rawBalance.used} utilisées, ${a.flows.rawBalance.sold} vendues.`);
  L.push('', `Jamais produits : ${a.flows.neverMade.length} objets (${a.flows.neverMade.slice(0, 40).join(', ')}).`);
  L.push('', '## Butin d’équipement', '');
  L.push(`${a.loot.total} pièces tombées, ${a.loot.perBotDay} par joueur et par jour ; un joueur en possède ${a.loot.gearOwnedMedian} (médiane). Raretés : ${Object.entries(a.loot.rarity).map(([k, v]) => `${k} ${v}`).join(', ')}.`);
  L.push('', '| Ensemble | pièces tombées | joueurs qui en portent 2+ |', '|---|---|---|');
  for (const s of a.loot.sets) L.push(`| ${s.name} | ${s.dropped} | ${s.worn2plus} |`);
  L.push('', `Nommés (tombés / portés) : ${a.loot.named.map((n) => `${n.named} ${n.dropped}/${n.worn}`).join(', ')}.`);
  L.push(`Gemmes serties : ${Object.entries(a.loot.gems).map(([k, v]) => `${k} ${v}`).join(', ') || 'aucune'}.`);
  const tg = a.talent;
  L.push(`Gemmes de talent : ${tg.crafted} taillées, ${tg.dropped} trouvées en combat, ${tg.bought} achetées, ${tg.socketed} serties ; ${tg.withGem} joueurs sur ${tg.users} qui sertissent ont une gemme de talent (première : ${tg.firstDayP25 ?? '—'} j pour le premier quart, ${tg.firstDayMedian ?? '—'} j en médiane). Démontage : ${tg.salvaged} pièces, ${tg.dust.made} poussières. Prix (dernier / référence) : ${tg.prices.map((x) => `${x.name} ${x.price}/${x.ref}`).join(', ') || 'aucun échange'}.`);
  L.push(`Atelier et vitrine : ${a.vitrine.crafted} pièces fabriquées, ${a.vitrine.sold} vendues à la vitrine (prix médian ${a.vitrine.medianPrice} or), ${a.vitrine.listed} encore en vente. Sources : ${Object.entries(a.loot.bySource).filter(([k]) => !k.startsWith('z') && !k.startsWith('b')).map(([k, v]) => `${k} ${v}`).join(', ')}.`);
  L.push(`Fournitures (produites / achetées pour la route / dernier prix) : ${a.supplies.map((x) => `${x.name} ${x.produced}/${x.bought}/${x.price}`).join(', ')}.`);
  L.push('', '## Classes et voies', '');
  L.push('| Classe | joueurs | part | route médiane | route (méta) | niveau |', '|---|---|---|---|---|---|');
  for (const c of a.classes.byClass) L.push(`| ${c.classId} | ${c.n} | ${pct(c.share)} | ${c.routeMedian} | ${c.metaRouteMedian} | ${c.levelMedian} |`);
  L.push('', `À façon de jouer égale (casus seuls, sans changement de classe) — route à 7 j / 30 j : ${a.classes.classFair.map((c) => `${c.classId} ${c.route7} / ${c.route30} (n ${c.n})`).join(' ; ')}.`);
  L.push('', '| Voie | classe | rôle | joueurs | route médiane |', '|---|---|---|---|---|');
  for (const p of a.classes.byPath) L.push(`| ${p.name} | ${p.classId} | ${p.role} | ${p.n} | ${p.routeMedian} |`);
  L.push('', '## Où les joueurs restent bloqués (jours-joueurs à la même étape)', '');
  for (const w of a.walls) L.push(`- ${w.done ? 'route finie' : `${w.stage} ${w.encounter}`} : ${w.botDays}`);
  L.push('', '## Gardiens : jours passés devant (médiane, 90 % des joueurs), parmi ceux qui l’ont atteint', '');
  L.push('| Étape | gardien | atteint | passé | jours (médiane) | jours (90 %) |', '|---|---|---|---|---|---|');
  for (const g of a.guardians) L.push(`| ${g.stage} | ${g.name} | ${g.reached} | ${g.passed} | ${g.medianDays} | ${g.p90Days} |`);
  L.push('', '## Clans', '');
  L.push(`${a.clans.list.length} clans ; niveaux de bâtiments construits (sur ${a.clans.maxLevels} possibles) : ${a.clans.list.map((c) => `${c.levels} (${c.members} m.)`).join(', ')}.`);
  L.push(`Renom : ${a.clans.list.map((c) => `${c.renown} (${c.rank}, ${c.members} m.)`).join(', ')}.`);
  if (a.tide) {
    const t = a.tide;
    L.push('', '## Marée du soir', '');
    L.push(`${t.nights} soirs, ${t.participation} participants en moyenne (${Math.round(t.liveShare * 100)} % en direct, ${Math.round(t.workShare * 100)} % au travail), ${t.thresholds} seuils du serveur franchis en moyenne.`);
    L.push(`Points moyens — en direct / absent : ${Object.entries(t.live).map(([k, v]) => `${k} ${v}`).join(', ')} ; par façon de jouer : ${Object.entries(t.byPersona).map(([k, v]) => `${k} ${v}`).join(', ')}.`);
    L.push(`Par classe : ${Object.entries(t.byClass).map(([k, v]) => `${k} ${v}`).join(', ')} ; par voie : ${Object.entries(t.byPath).map(([k, v]) => `${k} ${v}`).join(', ')}.`);
    L.push(`Par Marée et voie : ${Object.entries(t.byTidePath).sort().map(([k, v]) => `${k} ${v}`).join(', ')}.`);
    L.push(`Éclats : ${t.shardsPerNight} par soir joué, ${t.shardsPerPlayerWeek} par joueur et par semaine (tous les joueurs, inscrits ou non) ; part des joueurs inscrits chaque soir : ${Math.round(t.participationShare * 100)} % ; ${t.outfits} tenues Marée haute achetées ; ${t.chests.total} coffres de la semaine, ${t.chests.caches} caches d’équipement.`);
  }
  L.push('', `## Commandes du maître réussies par rang : ${Object.entries(a.trials).map(([k, v]) => `${k} : ${v}`).join(', ') || 'aucune'}.`);
  return L.join('\n');
}

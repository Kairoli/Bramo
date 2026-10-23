import type { WorldResult } from './world.js';

/** Chiffres résumés d'une simulation (fenêtre : les 30 derniers jours). */
export interface Summary {
  players: number;
  days: number;
  goldPerPlayer: number;
  inflowNpc: number;
  outflowTax: number;
  outflowPnj: number;
  outflowStall: number;
  outflowClan: number;
  goldClan: number;
  goldAlone: number;
  clans: number;
  levelsPerClan: number;
  netPerPlayerDay: number;
  noToolShare: number;
  idleShare: number;
  forgeShare: number;
  volumePerPlayerDay: number;
  unsoldDays: number;
  priceRatio: number;
  gini: number;
  newcomers: number;
  firstToolDays: number | null;
  noToolEver: number;
  day500: number | null;
  pnjRepairs: number;
  artisanRepairs: number;
  pnjRepairPrice: number;
  artisanFloor: number;
}

const mean = (xs: number[]) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0);
const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length ? s[Math.floor(s.length / 2)]! : 0;
};

export function summarize(r: WorldResult): Summary {
  const win = r.days.slice(-30);
  const per = (f: (d: (typeof win)[number]) => number) => mean(win.map((d) => f(d) / Math.max(1, d.players)));
  const inflow = per((d) => d.gold.npc);
  const tax = per((d) => d.gold.tax);
  const pnj = per((d) => d.gold.pnjRepair);
  const stall = per((d) => d.gold.stall);
  const clanSink = per((d) => d.gold.clan);
  const played = r.bots.filter((b) => b.level > 0);
  const avgGold = (list: typeof played) => (list.length ? mean(list.map((b) => b.gold)) : 0);
  const liveClans = r.clans.filter((c) => c.members.length > 0);
  const totalWork = (d: (typeof win)[number]) => Object.values(d.workMin).reduce((s, x) => s + x, 0) || 1;
  const top = r.items.slice(0, 10);
  const ratios = top
    .map((i) => {
      const last = i.weekly.slice(-5, -1).filter((w) => w.qty > 0);
      return last.length ? mean(last.map((w) => w.price)) / i.ref : null;
    })
    .filter((x): x is number => x !== null);
  const newbies = r.bots.filter((b) => b.joinDay > 0 && b.level > 0);
  const withTool = newbies.filter((b) => b.firstToolDay !== null);
  const with500 = newbies.filter((b) => b.day500 !== null);
  const volume = per((d) => d.volume);
  const unsold = mean(win.map((d) => d.unsoldValue));
  const dayVolume = mean(win.map((d) => d.volume));
  return {
    players: r.options.players,
    days: r.options.days,
    goldPerPlayer: Math.round(r.days.at(-1)!.goldSupply / r.days.at(-1)!.players),
    inflowNpc: inflow,
    outflowTax: tax,
    outflowPnj: pnj,
    outflowStall: stall,
    outflowClan: clanSink,
    goldClan: avgGold(played.filter((b) => b.clanId !== null)),
    goldAlone: avgGold(played.filter((b) => b.clanId === null)),
    clans: liveClans.length,
    levelsPerClan: liveClans.length ? mean(liveClans.map((c) => Object.values(c.levels).reduce((a, l) => a + l, 0))) : 0,
    netPerPlayerDay: inflow - tax - pnj - stall - clanSink,
    noToolShare: mean(win.map((d) => d.idleNoTool / Math.max(1, d.players))),
    idleShare: mean(win.map((d) => d.idle / Math.max(1, d.players))),
    forgeShare: mean(win.map((d) => (d.workMin.smithing ?? 0) / totalWork(d))),
    volumePerPlayerDay: volume,
    unsoldDays: dayVolume ? unsold / dayVolume : 0,
    priceRatio: median(ratios),
    gini: r.gini,
    newcomers: newbies.length,
    firstToolDays: withTool.length ? mean(withTool.map((b) => b.firstToolDay! - b.joinDay)) : null,
    noToolEver: newbies.length - withTool.length,
    day500: with500.length ? mean(with500.map((b) => b.day500! - b.joinDay)) : null,
    pnjRepairs: r.repairs.pnj,
    artisanRepairs: r.repairs.self,
    pnjRepairPrice: r.repairs.pnjPriceAvg,
    artisanFloor: r.repairs.artisanFeeFloor,
  };
}

export interface DashboardInput {
  main: WorldResult;
  scales: { label: string; summary: Summary }[];
  generatedOn: string;
  professionNames: Record<string, string>;
  presenceNames: Record<string, string>;
  findings: { title: string; text: string; level: 'alerte' | 'attention' | 'bon' }[];
}

/** Page HTML autonome (graphiques en SVG tracés par un petit script, aucune bibliothèque). */
export function dashboardHtml(input: DashboardInput): string {
  const data = JSON.stringify({ ...input, summary: summarize(input.main) }).replace(/</g, '\\u003c');
  return `<title>Marché de Bramo, simulation</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap">
<style>
/* Mise en page : bandeau de chiffres, puis des panneaux larges (graphique + lecture) ; anthracite et cuivre comme le jeu. */
:root {
  --bg: #20262a; --panel: #2a3135; --sunken: #1a1f22; --border: #3c464a;
  --text: #f1f0ec; --muted: #a9b3b5; --copper: #f08a4b; --teal: #4cc9d6; --gold: #e3c770;
  --good: #7ed6a2; --alert: #ff7c7c; --market: #8db4e2; --magic: #b39df5;
  --display: 'Bricolage Grotesque', 'Segoe UI', sans-serif;
  --body: 'IBM Plex Sans', 'Segoe UI', sans-serif;
  --mono: 'IBM Plex Mono', Consolas, monospace;
  color-scheme: dark;
}
@media (prefers-color-scheme: light) {
  :root:not([data-theme="dark"]) {
    --bg: #f3f4f2; --panel: #ffffff; --sunken: #e8ebea; --border: #cdd4d4;
    --text: #1d2326; --muted: #566266; --copper: #c4561b; --teal: #0b7f8c; --gold: #8a6d12;
    --good: #1f8a52; --alert: #c23a3a; --market: #3d6aa3; --magic: #6b4fc4; color-scheme: light;
  }
}
:root[data-theme="light"] {
  --bg: #f3f4f2; --panel: #ffffff; --sunken: #e8ebea; --border: #cdd4d4;
  --text: #1d2326; --muted: #566266; --copper: #c4561b; --teal: #0b7f8c; --gold: #8a6d12;
  --good: #1f8a52; --alert: #c23a3a; --market: #3d6aa3; --magic: #6b4fc4; color-scheme: light;
}
* { box-sizing: border-box; }
body { background: var(--bg); color: var(--text); font: 15px/1.5 var(--body); padding-block: 24px 48px; padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); }
.wrap { max-width: 1120px; margin: 0 auto; display: grid; gap: 20px; }
h1, h2, h3 { font-family: var(--display); line-height: 1.1; margin: 0; text-wrap: balance; }
h1 { font-size: clamp(28px, 5vw, 40px); font-weight: 800; }
h2 { font-size: 22px; font-weight: 700; }
h3 { font-size: 16px; font-weight: 700; }
p { margin: 0; max-width: 68ch; }
.muted { color: var(--muted); }
.small { font-size: 13px; }
.eyebrow { font-size: 12px; letter-spacing: .08em; text-transform: uppercase; color: var(--muted); font-weight: 600; }
.mono { font-family: var(--mono); font-variant-numeric: tabular-nums; }
header { display: grid; gap: 8px; }
.kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 10px; }
.kpi { background: var(--panel); border: 1px solid var(--border); border-radius: 10px; padding: 12px 14px; display: grid; gap: 2px; min-width: 0; }
.kpi b { font: 700 24px/1.1 var(--mono); }
.kpi span { font-size: 13px; color: var(--muted); }
.kpi.alert b { color: var(--alert); } .kpi.warn b { color: var(--gold); } .kpi.good b { color: var(--good); }
section.panel { background: var(--panel); border: 1px solid var(--border); border-radius: 12px; padding: 18px; display: grid; gap: 14px; min-width: 0; }
.cols { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 18px; }
.cols > * { min-width: 0; }
.legend { display: flex; flex-wrap: wrap; gap: 6px 14px; font-size: 13px; color: var(--muted); }
.legend i { display: inline-block; width: 10px; height: 10px; border-radius: 3px; margin-right: 6px; vertical-align: -1px; }
svg { width: 100%; height: auto; display: block; overflow: visible; }
svg text { fill: var(--muted); font: 11px var(--mono); }
.grid line { stroke: var(--border); stroke-width: 1; }
.finding { display: grid; gap: 4px; padding: 12px 14px; border-radius: 10px; background: var(--sunken); border-left: 4px solid var(--muted); }
.finding.alerte { border-left-color: var(--alert); } .finding.attention { border-left-color: var(--gold); } .finding.bon { border-left-color: var(--good); }
.scroll { overflow-x: auto; }
table { border-collapse: collapse; width: 100%; font-size: 13px; }
th { text-align: left; font-weight: 600; color: var(--muted); padding: 6px 10px; border-bottom: 1px solid var(--border); white-space: nowrap; }
td { padding: 6px 10px; border-bottom: 1px solid var(--border); white-space: nowrap; }
td.wrap { white-space: normal; min-width: 220px; }
td.num, th.num { text-align: right; font-family: var(--mono); font-variant-numeric: tabular-nums; }
.pill { display: inline-block; padding: 1px 8px; border-radius: 99px; font-size: 12px; border: 1px solid var(--border); }
.pill.neuf { color: var(--good); border-color: var(--good); } .pill.entamé { color: var(--gold); border-color: var(--gold); }
.pill.usé, .pill.aucun { color: var(--alert); border-color: var(--alert); }
select { background: var(--sunken); color: var(--text); border: 1px solid var(--border); border-radius: 8px; padding: 6px 10px; font: inherit; }
.bar { display: grid; grid-template-columns: 110px 1fr auto; gap: 8px; align-items: center; font-size: 13px; }
.bar .track { height: 10px; background: var(--sunken); border-radius: 5px; overflow: hidden; }
.bar .fill { height: 100%; background: var(--copper); border-radius: 5px; }
.how { display: grid; gap: 8px; }
.how li { margin-left: 18px; }
footer { color: var(--muted); font-size: 13px; }
a { color: var(--market); }
@media (prefers-reduced-motion: no-preference) { .fill { transition: width .4s; } }
</style>

<div class="wrap" id="app">
  <header>
    <span class="eyebrow" id="stamp"></span>
    <h1>Marché de Bramo, simulation</h1>
    <p class="muted" id="intro"></p>
  </header>
  <div class="kpis" id="kpis"></div>
  <section class="panel" id="findings"><h2>Ce que la simulation montre</h2></section>
  <section class="panel">
    <h2>Qui sont les bots</h2>
    <div class="cols">
      <div class="how">
        <p>Chaque bot est un joueur qui utilise <b>le vrai moteur du jeu</b> (production, usure, repas, commandes PNJ, prime) et le même marché que le serveur, avec ces habitudes :</p>
        <ul class="how small muted" style="padding:0;margin:0">
          <li><b>Récolteur « XP »</b> : prend toujours la récolte qui rapporte le plus d’XP, vend ce qu’il a, répond aux commandes PNJ de son métier.</li>
          <li><b>Récolteur « marchand »</b> (3 sur 10) : choisit la récolte qui se vendrait le mieux à la seconde.</li>
          <li><b>Artisan</b> (Forge, Menuiserie, Cuisine) : prend la fabrication qui rapporte le plus d’XP sans perdre la moitié de sa mise, achète ses ingrédients au marché, récolte en attendant.</li>
          <li><b>Clans</b> : 7 joueurs sur 10 sont dans un clan (par groupes de 5 à 10) et apportent chaque jour la moitié de leur or au-dessus de 300, plus leurs matériaux, aux bâtiments (le leur d’abord, puis la halle) ; ils achètent au marché les matériaux qui manquent.</li>
          <li>Tous : achètent ou entretiennent leur outil, mangent des repas s’ils valent leur prix, ajustent leurs prix chaque jour (vendu en entier : +6 %, presque rien : −12 %), recyclent un stock invendable.</li>
          <li>60 % sont là au jour 0, les autres arrivent au fil des deux premiers mois : on mesure leurs débuts.</li>
        </ul>
      </div>
      <div style="display:grid;gap:14px">
        <div><h3>Par métier</h3><div id="mixProfession" style="display:grid;gap:6px;margin-top:8px"></div></div>
        <div><h3>Par présence</h3><div id="mixPresence" style="display:grid;gap:6px;margin-top:8px"></div></div>
      </div>
    </div>
    <h3>État actuel des joueurs</h3>
    <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
      <label for="filter" class="small muted">Métier</label>
      <select id="filter"></select>
      <span class="small muted" id="rosterCount"></span>
    </div>
    <div class="scroll"><table id="roster"></table></div>
  </section>
  <section class="panel">
    <h2>D’où vient l’or, où il part</h2>
    <p class="muted">Moyenne mobile sur 7 jours, par joueur et par jour. Les commandes PNJ sont la seule entrée d’or ; la taxe, les réparations du PNJ et l’étal sont les sorties.</p>
    <div class="cols"><div><div id="chFlows"></div><div class="legend" id="lgFlows"></div></div><div><div id="chSupply"></div><div class="legend" id="lgSupply"></div></div></div>
  </section>
  <section class="panel">
    <h2>Prix et échanges</h2>
    <p class="muted">Prix moyen des transactions rapporté au prix de référence (100 or la minute de travail, qui croît avec le niveau). À 1, le marché paie le travail à sa valeur ; sous 0,5, l’objet se vend à perte.</p>
    <div class="cols"><div><div id="chPrices"></div><div class="legend" id="lgPrices"></div></div><div><div id="chVolume"></div><div class="legend" id="lgVolume"></div></div></div>
  </section>
  <section class="panel">
    <h2>Progression et richesse</h2>
    <div class="cols"><div><h3>Niveau de chaque joueur, semaine par semaine</h3><div id="heat" class="scroll"></div></div><div><h3>Or par joueur à la fin</h3><div id="chGold"></div></div></div>
  </section>
  <section class="panel">
    <h2>Les débuts d’un nouveau joueur</h2>
    <div class="kpis" id="newKpis"></div>
  </section>
  <section class="panel">
    <h2>Selon la taille du serveur</h2>
    <div class="scroll"><table id="scales"></table></div>
  </section>
  <section class="panel">
    <h2>Limites de ce modèle</h2>
    <ul class="how small muted" style="padding:0;margin:0">
      <li>Les bots ne dépensent presque rien : ils n’ont ni clan, ni construction, ni cosmétiques à acheter. L’or qui s’accumule est donc plus élevé que dans un vrai serveur, mais le déséquilibre entrées/sorties est réel.</li>
      <li>Les prix de référence viennent du temps de travail ; aucun joueur réel ne les connaît. Les bots ajustent leurs prix chaque jour avec des règles simples.</li>
      <li>Le combat, l’Agriculture et les autres métiers ne sont pas dans le moteur : la demande d’équipement, de potions et de flèches manque.</li>
      <li>Les bots n’utilisent jamais la réparation par un artisan : ils prennent le moins cher, qui est le PNJ.</li>
      <li>Les bots valident les commandes du maître (rangs) sans délai : leur progression n’est jamais bloquée au palier.</li>
      <li>Une simulation avec une autre graine donne des chiffres voisins, pas identiques.</li>
    </ul>
  </section>
  <footer id="foot"></footer>
</div>
<script>
const D = ${data};
const S = D.summary;
const $ = (id) => document.getElementById(id);
const nf = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });
const nf1 = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });
const nf2 = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 });
const n = (x) => nf.format(x);
const pct = (x) => nf1.format(x * 100) + ' %';
const PROF = D.professionNames, PRES = D.presenceNames;
const COLORS = ['var(--copper)', 'var(--teal)', 'var(--gold)', 'var(--good)', 'var(--market)', 'var(--magic)', 'var(--alert)', 'var(--muted)'];
const el = (tag, attrs = {}, html = '') => { const e = document.createElement(tag); for (const k in attrs) e.setAttribute(k, attrs[k]); e.innerHTML = html; return e; };

function niceMax(v) { if (v <= 0) return 1; const p = 10 ** Math.floor(Math.log10(v)); const m = v / p; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * p; }
function movAvg(a, w) { return a.map((_, i) => { const s = a.slice(Math.max(0, i - w + 1), i + 1); return s.reduce((x, y) => x + y, 0) / s.length; }); }

/** Graphique en lignes : une seule échelle pour les repères, les graduations et les tracés. */
function lines(target, series, o = {}) {
  const W = 520, H = 230, L = 46, R = 12, T = 12, B = 26;
  const len = Math.max(...series.map((s) => s.values.length));
  const maxV = niceMax(Math.max(o.min0 ?? 0, ...series.flatMap((s) => s.values)) * 1.05);
  const minV = o.zero === false ? Math.min(...series.flatMap((s) => s.values)) : 0;
  const x = (i) => L + (i / Math.max(1, len - 1)) * (W - L - R);
  const y = (v) => T + (1 - (v - minV) / (maxV - minV || 1)) * (H - T - B);
  let g = '';
  for (let k = 0; k <= 4; k++) { const v = minV + ((maxV - minV) * k) / 4; g += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y(v) + '" y2="' + y(v) + '"/><text x="' + (L - 6) + '" y="' + (y(v) + 4) + '" text-anchor="end">' + (o.fmt ? o.fmt(v) : n(v)) + '</text>'; }
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(f * (len - 1)));
  let xs = ticks.map((i) => '<text x="' + x(i) + '" y="' + (H - 6) + '" text-anchor="middle">j' + (i + 1) + '</text>').join('');
  let ref = '';
  if (o.ref !== undefined) ref = '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y(o.ref) + '" y2="' + y(o.ref) + '" style="stroke:var(--muted);stroke-dasharray:4 4"/><text x="' + (W - R) + '" y="' + (y(o.ref) - 4) + '" text-anchor="end">' + o.refLabel + '</text>';
  let paths = '';
  series.forEach((s, k) => {
    const pts = s.values.map((v, i) => [x(i), y(v)]);
    const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('');
    const c = s.color || COLORS[k % COLORS.length];
    if (s.area) paths += '<path d="' + d + 'L' + x(s.values.length - 1) + ' ' + y(minV) + 'L' + x(0) + ' ' + y(minV) + 'Z" style="fill:' + c + ';opacity:.15"/>';
    paths += '<path d="' + d + '" style="fill:none;stroke:' + c + ';stroke-width:2;stroke-linejoin:round"/>';
    const last = pts[pts.length - 1];
    if (last) paths += '<circle cx="' + last[0] + '" cy="' + last[1] + '" r="3.5" style="fill:' + c + '"/>';
  });
  $(target).innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + (o.label || '') + '"><g class="grid">' + g + '</g>' + ref + xs + paths + '</svg>';
  const lg = $(o.legend);
  if (lg) lg.innerHTML = series.map((s, k) => '<span><i style="background:' + (s.color || COLORS[k % COLORS.length]) + '"></i>' + s.name + '</span>').join('');
}

// --- En-tête et chiffres clés ---
$('stamp').textContent = 'Simulation du ' + D.generatedOn + ' · ' + S.players + ' joueurs · ' + S.days + ' jours · graine ' + D.main.options.seed;
$('intro').textContent = 'Des joueurs simulés jouent chaque jour avec les règles actuelles du jeu : marché entre joueurs, commandes PNJ par joueur, étal de la guilde, usure et réparations. Les chiffres ci-dessous portent sur les 30 derniers jours.';
const kpi = (cls, value, label) => '<div class="kpi ' + cls + '"><b>' + value + '</b><span>' + label + '</span></div>';
$('kpis').innerHTML = [
  kpi(S.netPerPlayerDay > 50 ? 'alert' : '', n(S.netPerPlayerDay), 'or créé par joueur et par jour (entrées moins sorties)'),
  kpi('', n(S.goldClan), 'or d’un membre de clan à la fin (sans clan : ' + n(S.goldAlone) + ')'),
  kpi(S.inflowNpc > 10 * (S.outflowTax + S.outflowPnj + S.outflowStall) ? 'alert' : 'warn', pct(S.inflowNpc / (S.inflowNpc + S.outflowTax)), 'de l’or du marché vient des commandes PNJ, pas des joueurs'),
  kpi(S.priceRatio < 0.5 ? 'alert' : 'good', nf2.format(S.priceRatio), 'prix moyen / prix de référence (médiane des 10 objets les plus échangés)'),
  kpi(S.noToolShare > 0.15 ? 'warn' : 'good', pct(S.noToolShare), 'des joueurs sans outil en état en fin de journée'),
  kpi('', pct(S.forgeShare), 'du temps de travail passé en Forge'),
].join('');

// --- Constats ---
const f = $('findings');
D.findings.forEach((x) => f.appendChild(el('div', { class: 'finding ' + x.level }, '<h3>' + x.title + '</h3><p class="small muted">' + x.text + '</p>')));

// --- Composition des bots ---
function mix(target, counts, names) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
  const max = Math.max(...Object.values(counts));
  $(target).innerHTML = Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([k, c]) => '<div class="bar"><span>' + (names[k] || k) + '</span><div class="track"><div class="fill" style="width:' + (c / max) * 100 + '%"></div></div><span class="mono">' + c + ' · ' + Math.round((c / total) * 100) + ' %</span></div>').join('');
}
const bots = D.main.bots.filter((b) => b.level > 0);
const count = (key) => bots.reduce((m, b) => ((m[b[key]] = (m[b[key]] || 0) + 1), m), {});
mix('mixProfession', count('profession'), PROF);
mix('mixPresence', count('presence'), PRES);

// --- Tableau des joueurs ---
const filter = $('filter');
filter.innerHTML = '<option value="">Tous</option>' + Object.keys(count('profession')).map((p) => '<option value="' + p + '">' + (PROF[p] || p) + '</option>').join('');
function spark(values) {
  const w = 90, h = 22, max = Math.max(1, ...values);
  const pts = values.map((v, i) => (i / Math.max(1, values.length - 1)) * w + ',' + (h - (v / max) * h)).join(' ');
  return '<svg viewBox="0 0 ' + w + ' ' + h + '" width="90" height="22" style="display:inline-block;width:90px"><polyline points="' + pts + '" style="fill:none;stroke:var(--copper);stroke-width:1.5"/></svg>';
}
function roster() {
  const p = filter.value;
  const rows = bots.filter((b) => !p || b.profession === p);
  $('rosterCount').textContent = rows.length + ' joueurs';
  $('roster').innerHTML = '<tr><th>Joueur</th><th>Métier</th><th>Présence</th><th class="num">Niveau</th><th class="num">Or</th><th>Outil</th><th>Évolution de l’or</th><th>Fait en ce moment</th></tr>' +
    rows.map((b) => '<tr><td>' + b.name + (b.joinDay ? ' <span class="muted small">(arrivé j' + (b.joinDay + 1) + ')</span>' : '') + '</td><td>' + (PROF[b.profession] || b.profession) + '</td><td>' + (PRES[b.presence] || b.presence) + '</td><td class="num">' + b.level + '</td><td class="num">' + n(b.gold) + '</td><td><span class="pill ' + b.toolState + '">' + (b.tool ? b.tool + ' · ' : '') + b.toolState + '</span></td><td>' + spark(b.goldHistory) + '</td><td class="wrap">' + b.status + '</td></tr>').join('');
}
filter.addEventListener('change', roster);
roster();

// --- Flux d'or ---
const days = D.main.days;
const perP = (fn) => movAvg(days.map((d) => fn(d) / Math.max(1, d.players)), 7);
lines('chFlows', [
  { name: 'Entrée : commandes PNJ', values: perP((d) => d.gold.npc), color: 'var(--good)' },
  { name: 'Sortie : taxe du marché', values: perP((d) => d.gold.tax), color: 'var(--copper)' },
  { name: 'Sortie : réparations PNJ et étal', values: perP((d) => d.gold.pnjRepair + d.gold.stall), color: 'var(--alert)' },
  { name: 'Sortie : bâtiments de clan', values: perP((d) => d.gold.clan), color: 'var(--clan)' },
], { legend: 'lgFlows', label: 'Flux d’or par joueur et par jour' });
lines('chSupply', [{ name: 'Or en circulation par joueur', values: days.map((d) => d.goldSupply / Math.max(1, d.players)), color: 'var(--gold)', area: true }], { legend: 'lgSupply', label: 'Or par joueur' });

// --- Prix et volumes ---
const topItems = D.main.items.slice(0, 6);
lines('chPrices', topItems.map((i, k) => ({ name: i.name + ' (réf. ' + i.ref + ' or)', values: i.weekly.map((w) => (w.qty ? w.price / i.ref : 0)), color: COLORS[k % COLORS.length] })), { legend: 'lgPrices', label: 'Prix sur prix de référence', ref: 1, refLabel: 'prix de référence', fmt: (v) => nf1.format(v), min0: 1.2 });
lines('chVolume', [
  { name: 'Or échangé par jour', values: movAvg(days.map((d) => d.volume), 7), color: 'var(--teal)' },
  { name: 'Valeur des offres invendues (÷ 100)', values: days.map((d) => d.unsoldValue / 100), color: 'var(--magic)' },
], { legend: 'lgVolume', label: 'Échanges et invendus' });

// --- Niveaux par semaine ---
(function heat() {
  const weeks = Math.ceil(S.days / 7);
  const cw = 18, ch = 14, left = 150, top = 4;
  const maxL = Math.max(...bots.map((b) => b.level), 1);
  const sorted = [...bots].sort((a, b) => a.profession.localeCompare(b.profession) || b.level - a.level);
  let svg = '';
  sorted.forEach((b, r) => {
    svg += '<text x="' + (left - 6) + '" y="' + (top + r * ch + 11) + '" text-anchor="end">' + b.name.split(' ')[0] + ' · ' + (PROF[b.profession] || b.profession).slice(0, 5) + '</text>';
    for (let w = 0; w < weeks; w++) {
      const lv = b.levelHistory[Math.min(b.levelHistory.length - 1, w * 7 + 6)] || 0;
      svg += '<rect x="' + (left + w * cw) + '" y="' + (top + r * ch) + '" width="' + (cw - 2) + '" height="' + (ch - 2) + '" rx="2" style="fill:' + (lv ? 'var(--copper)' : 'var(--sunken)') + ';opacity:' + (lv ? 0.15 + 0.85 * (lv / maxL) : 1) + '"><title>' + b.name + ' · semaine ' + (w + 1) + ' · niveau ' + lv + '</title></rect>';
    }
  });
  const Wd = left + weeks * cw, Hd = top + sorted.length * ch + 18;
  svg += '<text x="' + left + '" y="' + (Hd - 4) + '">sem. 1</text><text x="' + (Wd - 6) + '" y="' + (Hd - 4) + '" text-anchor="end">sem. ' + weeks + ' · niveau max ' + maxL + '</text>';
  $('heat').innerHTML = '<svg viewBox="0 0 ' + Wd + ' ' + Hd + '" style="min-width:' + Math.min(Wd, 420) + 'px" role="img" aria-label="Niveau par semaine">' + svg + '</svg>';
})();

// --- Distribution de l'or ---
(function hist() {
  const vals = bots.map((b) => b.gold);
  const max = niceMax(Math.max(...vals, 1));
  const bins = 8, counts = Array(bins).fill(0);
  vals.forEach((v) => (counts[Math.min(bins - 1, Math.floor((v / max) * bins))]++));
  const W = 520, H = 230, L = 36, B = 30, T = 12, bw = (W - L - 8) / bins;
  const top = Math.max(...counts, 1);
  let svg = '<g class="grid">';
  for (let k = 0; k <= 4; k++) { const yy = T + (1 - k / 4) * (H - T - B); svg += '<line x1="' + L + '" x2="' + (W - 8) + '" y1="' + yy + '" y2="' + yy + '"/><text x="' + (L - 6) + '" y="' + (yy + 4) + '" text-anchor="end">' + Math.round((top * k) / 4) + '</text>'; }
  svg += '</g>';
  counts.forEach((c, i) => { const h = (c / top) * (H - T - B); svg += '<rect x="' + (L + i * bw + 3) + '" y="' + (H - B - h) + '" width="' + (bw - 6) + '" height="' + h + '" rx="3" style="fill:var(--gold)"/><text x="' + (L + i * bw + bw / 2) + '" y="' + (H - 12) + '" text-anchor="middle">' + n((max / bins) * i) + '</text>'; });
  $('chGold').innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Répartition de l’or">' + svg + '</svg><p class="small muted">Nombre de joueurs par tranche d’or (début de tranche en abscisse). Écart de richesse (Gini) : ' + nf2.format(S.gini) + '.</p>';
})();

// --- Nouveaux joueurs ---
$('newKpis').innerHTML = [
  kpi('', String(S.newcomers), 'joueurs arrivés après le jour 1'),
  kpi(S.firstToolDays === null ? 'alert' : S.firstToolDays > 3 ? 'warn' : 'good', S.firstToolDays === null ? '—' : nf1.format(S.firstToolDays) + ' j', 'avant le premier outil en état'),
  kpi(S.noToolEver ? 'warn' : 'good', String(S.noToolEver), 'jamais équipés'),
  kpi('', S.day500 === null ? '—' : nf1.format(S.day500) + ' j', 'pour avoir gagné 500 or (commandes et ventes)'),
].join('');

// --- Taille du serveur ---
$('scales').innerHTML = '<tr><th>Simulation</th><th class="num">Or créé / joueur / jour</th><th class="num">Or / joueur à la fin</th><th class="num">Prix / référence</th><th class="num">Sans outil</th><th class="num">Jours d’invendus</th><th class="num">Forge</th><th class="num">Écart de richesse</th></tr>' +
  D.scales.map((s) => '<tr><td>' + s.label + '</td><td class="num">' + n(s.summary.netPerPlayerDay) + '</td><td class="num">' + n(s.summary.goldPerPlayer) + '</td><td class="num">' + nf2.format(s.summary.priceRatio) + '</td><td class="num">' + pct(s.summary.noToolShare) + '</td><td class="num">' + nf1.format(s.summary.unsoldDays) + '</td><td class="num">' + pct(s.summary.forgeShare) + '</td><td class="num">' + nf2.format(s.summary.gini) + '</td></tr>').join('');
$('foot').textContent = 'Généré par pnpm --filter @bramo/sim sim market. Les données brutes sont dans sim/reports/marche.json.';
</script>
`;
}

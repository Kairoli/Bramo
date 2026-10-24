/**
 * Test de charge de Bramo. Lance le vrai serveur dans un processus à part, sur une base neuve (jamais celle du
 * développement), puis fait jouer des joueurs virtuels par HTTP, comme le client :
 *
 *  1. inscription (mot de passe haché compris), classe, une récolte lancée ;
 *  2. paliers de joueurs connectés en même temps : chacun interroge le serveur au rythme de l'accueil (état 30 s,
 *     discussion 8 s, journal, bourg et amis 20 s, premiers pas et Marée 60 s) et agit de temps en temps (message, marché,
 *     nouvelle récolte) ;
 *  3. retour après 16 h d'absence : l'horloge du serveur avance de 16 h et tout le monde revient en même temps (le serveur
 *     rejoue 16 h de métier et de route pour chacun) ;
 *  4. Marée du soir : tout le monde s'inscrit, puis le premier passage après 21 h règle la soirée.
 *
 * pnpm --filter @bramo/server exec tsx src/scripts/stress/stress.ts [joueurs=400] [paliers=50,100,200,400] [secondes=60]
 * Base : PostgreSQL si DATABASE_URL est donné (une base de test vide !), sinon PGlite dans un dossier temporaire.
 * Résultat : tableau dans la console et JSON dans STRESS_OUT (par défaut stress-<date>.json dans le dossier courant).
 */
import { fork } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { registrationWindow, tideDay, tideWindow } from '@bramo/shared';
import { loadContent } from '@bramo/shared/node';

const players = Number(process.argv[2] ?? 400);
const stages = (process.argv[3] ?? '50,100,200,400').split(',').map(Number).filter((n) => n <= players);
const stageSec = Number(process.argv[4] ?? 60);
const port = Number(process.env.STRESS_PORT ?? 3199);
const base = `http://127.0.0.1:${port}`;
const root = fileURLToPath(new URL('../../../../../', import.meta.url));
const tide = loadContent(`${root}data`, `${root}art`).combat!.tide!;

// --- Le serveur, à part ---
const dir = process.env.DATABASE_URL ? null : mkdtempSync(join(tmpdir(), 'bramo-stress-'));
const server = fork(fileURLToPath(new URL('./server.ts', import.meta.url)), [], {
  // STRESS_PROF=<dossier> : profil du processeur du serveur (.cpuprofile), pour voir où part le temps.
  execArgv: ['--import', 'tsx', ...(process.env.STRESS_PROF ? ['--cpu-prof', `--cpu-prof-dir=${process.env.STRESS_PROF}`] : [])],
  env: { ...process.env, PORT: String(port), ...(dir ? { PGLITE_DIR: dir } : {}) },
});
const ask = <T>(msg: object, type: string) =>
  new Promise<T>((resolve) => {
    const on = (m: { type: string }) => {
      if (m.type === type) {
        server.off('message', on);
        resolve(m as T);
      }
    };
    server.on('message', on);
    if (Object.keys(msg).length) server.send(msg);
  });
type Stats = { cpu: number; rssMb: number; lagP50: number; lagP99: number; lagMax: number };
const stats = () => ask<Stats>({ type: 'stats' }, 'stats');
let offset = 0;
const setClock = (t: number) => {
  offset = t - Date.now();
  return ask({ type: 'clock', offset }, 'clock');
};
await ask({}, 'ready');

// --- Mesures ---
type Sample = { route: string; ms: number; status: number; bytes: number };
let samples: Sample[] = [];
const pct = (xs: number[], p: number) => (xs.length ? xs[Math.min(xs.length - 1, Math.floor((p / 100) * xs.length))]! : 0);
function summarize(list: Sample[], seconds: number) {
  const byRoute = new Map<string, Sample[]>();
  for (const s of list) byRoute.set(s.route, [...(byRoute.get(s.route) ?? []), s]);
  const row = (l: Sample[]) => {
    const ms = l.map((s) => s.ms).sort((a, b) => a - b);
    return { n: l.length, rps: +(l.length / seconds).toFixed(1), p50: +pct(ms, 50).toFixed(1), p95: +pct(ms, 95).toFixed(1), p99: +pct(ms, 99).toFixed(1), max: +(ms.at(-1) ?? 0).toFixed(1), errors: l.filter((s) => s.status >= 400 && s.status !== 429).length, kb: +(l.reduce((a, s) => a + s.bytes, 0) / l.length / 1000).toFixed(1), limited: l.filter((s) => s.status === 429).length };
  };
  return { all: row(list), routes: Object.fromEntries([...byRoute].map(([r, l]) => [r, row(l)])) };
}

// --- Un joueur virtuel ---
class Bot {
  cookie = '';
  constructor(readonly i: number) {}
  get ip() {
    return `10.${(this.i >> 16) & 255}.${(this.i >> 8) & 255}.${this.i & 255}`;
  }
  async call(method: 'GET' | 'POST', path: string, body?: object, route = path) {
    const t = performance.now();
    let status = 0;
    let bytes = 0;
    try {
      const res = await fetch(base + path, {
        method,
        headers: { 'content-type': 'application/json', cookie: this.cookie, 'x-forwarded-for': this.ip },
        body: body ? JSON.stringify(body) : undefined,
      });
      status = res.status;
      const set = res.headers.get('set-cookie');
      if (set) this.cookie = set.split(';')[0]!;
      bytes = (await res.arrayBuffer()).byteLength;
    } catch {
      status = 599;
    }
    samples.push({ route, ms: performance.now() - t, status, bytes });
    return status;
  }
}
const pool = async <T>(items: T[], width: number, fn: (x: T) => Promise<unknown>) => {
  let next = 0;
  await Promise.all(Array.from({ length: width }, async () => {
    while (next < items.length) await fn(items[next++]!);
  }));
};
const CLASSES = ['runist', 'forgefire', 'tracker'];
const GATHER = ['mine_copper', 'mine_tin', 'cut_pine', 'pick_mint'];
const bots = Array.from({ length: players }, (_, i) => new Bot(i + 1));
const report: Record<string, unknown> = { players, stages, stageSec, db: process.env.DATABASE_URL ? 'postgres' : 'pglite', machine: process.env.STRESS_MACHINE ?? null };

// 1. Inscriptions
let t0 = performance.now();
await stats();
await pool(bots, 16, async (b) => {
  await b.call('POST', '/api/auth/register', { username: `${process.env.STRESS_PREFIX ?? 'charge'}${b.i}`, password: 'charge-test-mdp' }, 'register');
  await b.call('POST', '/api/character/class', { classId: CLASSES[b.i % 3] }, 'class');
  await b.call('POST', '/api/activity/start', { recipeId: GATHER[b.i % 4], quantity: 5000, mode: 'replace' }, 'activity');
});
let secs = (performance.now() - t0) / 1000;
report.register = { seconds: +secs.toFixed(1), ...summarize(samples, secs), server: await stats() };
console.log(`Inscriptions : ${players} joueurs en ${secs.toFixed(1)} s`);
samples = [];

// 2. Joueurs connectés, palier par palier
const POLLS: [string, number][] = [['/api/state', 30], ['/api/chat?channel=server', 8], ['/api/journal', 20], ['/api/town', 20], ['/api/friends', 20], ['/api/first-steps', 60], ['/api/tide', 60]];
const LINES = ['Quelqu’un vend du cuivre ?', 'Bonne soirée à tous', 'La Marée ce soir, on y va ?', 'Je cherche un clan', 'gg'];
async function online(b: Bot, until: number) {
  const next = POLLS.map(([, every]) => performance.now() + Math.random() * every * 1000);
  let act = performance.now() + Math.random() * 120_000;
  while (performance.now() < until) {
    const now = performance.now();
    const k = next.indexOf(Math.min(...next));
    const due = Math.min(next[k]!, act);
    if (due > now) {
      await new Promise((r) => setTimeout(r, Math.min(due - now, until - now)));
      continue;
    }
    if (act <= next[k]!) {
      const roll = Math.random();
      if (roll < 0.3) await b.call('POST', '/api/chat', { channel: 'server', text: LINES[b.i % LINES.length]! }, 'chat:post');
      else if (roll < 0.7) await b.call('GET', '/api/market', undefined, 'market');
      else await b.call('POST', '/api/activity/start', { recipeId: GATHER[(b.i + Math.floor(roll * 10)) % 4], quantity: 5000, mode: 'replace' }, 'activity');
      act = performance.now() + 60_000 + Math.random() * 120_000;
    } else {
      const [path, every] = POLLS[k]!;
      await b.call('GET', path, undefined, path.split('?')[0]);
      next[k] = performance.now() + every * 1000;
    }
  }
}
const online_: Record<string, unknown>[] = [];
for (const n of stages) {
  samples = [];
  await stats();
  const until = performance.now() + stageSec * 1000;
  await Promise.all(bots.slice(0, n).map((b) => online(b, until)));
  const row = { online: n, ...summarize(samples, stageSec), server: await stats() };
  online_.push(row);
  console.log(`${n} connectés : ${row.all.rps} req/s, p50 ${row.all.p50} ms, p95 ${row.all.p95} ms, p99 ${row.all.p99} ms, erreurs ${row.all.errors}, processeur ${(row.server.cpu * 100).toFixed(0)} %, retard de boucle p99 ${row.server.lagP99.toFixed(0)} ms`);
}
report.online = online_;

// STRESS_ONLY=online : seulement les inscriptions et les paliers de joueurs connectés.
const full = process.env.STRESS_ONLY !== 'online';
if (full) {
// 3. Retour après 16 h d'absence, tout le monde en même temps (sur une minute)
const absent = (bots.length ? Date.now() : 0) + offset + 16 * 3_600_000;
await setClock(absent);
samples = [];
await stats();
t0 = performance.now();
await Promise.all(bots.map(async (b) => {
  await new Promise((r) => setTimeout(r, Math.random() * 60_000));
  await b.call('GET', '/api/state', undefined, 'return-16h');
}));
secs = (performance.now() - t0) / 1000;
report.return16h = { seconds: +secs.toFixed(1), ...summarize(samples, secs), server: await stats() };
const r16 = (report.return16h as { all: { p50: number; p95: number; max: number }; server: Stats });
console.log(`Retour après 16 h : ${players} joueurs en ${secs.toFixed(0)} s, p50 ${r16.all.p50} ms, p95 ${r16.all.p95} ms, max ${r16.all.max} ms, processeur ${(r16.server.cpu * 100).toFixed(0)} %`);

// 4. Marée du soir : inscriptions entre 19 h et 20 h, puis le règlement au premier passage après la fin
const now = Date.now() + offset;
let day = tideDay(now);
if (registrationWindow(day, tide).start <= now) day += 1;
await setClock(registrationWindow(day, tide).start + 10 * 60_000);
// Chacun revient d'abord (le serveur rattrape son absence), pour mesurer l'inscription seule.
await pool(bots, 16, (b) => b.call('GET', '/api/state', undefined, 'return'));
samples = [];
await pool(bots, 16, (b) => b.call('POST', '/api/tide/register', {}, 'tide:register'));
const reg = summarize(samples, 1).all;
await setClock(tideWindow(day, tide).end + 60_000);
samples = [];
await stats();
t0 = performance.now();
await bots[0]!.call('GET', '/api/state', undefined, 'tide:settle');
const settleMs = performance.now() - t0;
report.tide = { registerP95: reg.p95, registerErrors: reg.errors, settleMs: Math.round(settleMs), server: await stats() };
console.log(`Marée : ${players} inscrits (p95 ${reg.p95} ms, erreurs ${reg.errors}), règlement de la soirée ${Math.round(settleMs)} ms`);

}
const out = process.env.STRESS_OUT ?? `stress-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')}.json`;
writeFileSync(out, JSON.stringify(report, null, 2));
console.log(`Détail : ${out}`);
server.send({ type: 'stop' });
await new Promise((r) => server.once('exit', r));
if (dir) rmSync(dir, { recursive: true, force: true });

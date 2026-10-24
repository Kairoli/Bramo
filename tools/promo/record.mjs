// Filme une page de promotion du jeu image par image, en temps virtuel, puis l'encode en MP4 vertical (1080 × 1920).
// Le temps de la page (performance.now, Date.now, requestAnimationFrame, setTimeout, setInterval, animations CSS) est
// remplacé par une horloge qu'on avance de 1/30 s entre deux photos : chaque image est exacte, quelle que soit la vitesse
// de la machine. Il faut le client de développement lancé (pnpm dev) et ffmpeg.
// Usage : node tools/promo/record.mjs [url=http://localhost:5176/#promo] [sortie=promo/pilote.mp4] [fps=30]
import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';

const url = process.argv[2] ?? 'http://localhost:5176/#promo';
const out = resolve(process.argv[3] ?? 'promo/pilote.mp4');
const fps = Number(process.argv[4] ?? 30);
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const FFMPEG = process.env.FFMPEG ?? findFfmpeg();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function findFfmpeg() {
  const probe = spawnSync('ffmpeg', ['-version']);
  if (probe.status === 0) return 'ffmpeg';
  const base = join(process.env.LOCALAPPDATA ?? '', 'Microsoft', 'WinGet', 'Packages');
  for (const d of existsSync(base) ? readdirSync(base) : []) {
    if (!d.startsWith('Gyan.FFmpeg')) continue;
    for (const v of readdirSync(join(base, d))) {
      const exe = join(base, d, v, 'bin', 'ffmpeg.exe');
      if (existsSync(exe)) return exe;
    }
  }
  throw new Error('ffmpeg introuvable (winget install Gyan.FFmpeg)');
}

// L'horloge virtuelle, injectée avant tout script de la page ; inactive tant qu'on n'appelle pas __vt.start().
const SHIM = `(() => {
  const realPerf = performance.now.bind(performance), realDate = Date.now;
  const realRAF = window.requestAnimationFrame.bind(window), realCAF = window.cancelAnimationFrame.bind(window);
  const realST = window.setTimeout.bind(window), realCT = window.clearTimeout.bind(window);
  const realSI = window.setInterval.bind(window), realCI = window.clearInterval.bind(window);
  const vt = { started: false, now: 0, base: 0 };
  const timers = new Map(), rafs = new Map(), seen = new Map();
  let ids = 1e7;
  performance.now = () => (vt.started ? vt.now : realPerf());
  Date.now = () => (vt.started ? vt.base + vt.now : realDate());
  window.requestAnimationFrame = (cb) => { if (!vt.started) return realRAF(cb); const id = ++ids; rafs.set(id, cb); return id; };
  window.cancelAnimationFrame = (id) => { if (!rafs.delete(id)) realCAF(id); };
  const add = (cb, ms, args, every) => { const id = ++ids; timers.set(id, { at: vt.now + Math.max(0, ms || 0), every, cb: () => (typeof cb === 'function' ? cb(...args) : 0) }); return id; };
  window.setTimeout = (cb, ms, ...args) => (vt.started ? add(cb, ms, args, 0) : realST(cb, ms, ...args));
  window.setInterval = (cb, ms, ...args) => (vt.started ? add(cb, ms, args, Math.max(1, ms || 0)) : realSI(cb, ms, ...args));
  window.clearTimeout = (id) => { if (!timers.delete(id)) realCT(id); };
  window.clearInterval = (id) => { if (!timers.delete(id)) realCI(id); };
  const tickReal = () => new Promise((r) => realST(r, 0));
  window.__vt = {
    get started() { return vt.started; },
    start() { vt.now = realPerf(); vt.base = realDate() - vt.now; vt.started = true; },
    async advance(ms) {
      const target = vt.now + ms;
      for (let guard = 0; guard < 10000; guard++) {
        let best = null;
        for (const [id, t] of timers) if (t.at <= target && (!best || t.at < best[1].at)) best = [id, t];
        if (!best) break;
        const [id, t] = best;
        vt.now = Math.max(vt.now, t.at);
        if (t.every) t.at += t.every; else timers.delete(id);
        try { t.cb(); } catch (e) { console.error(e); }
      }
      vt.now = target;
      await tickReal();
      const list = [...rafs.values()];
      rafs.clear();
      for (const cb of list) { try { cb(vt.now); } catch (e) { console.error(e); } }
      for (const a of document.getAnimations()) {
        if (!seen.has(a)) { seen.set(a, vt.now - (a.currentTime ?? 0)); a.pause(); }
        a.currentTime = vt.now - seen.get(a);
      }
      await tickReal();
      await tickReal();
    },
  };
})();`;

const port = 9500 + Math.floor(Math.random() * 90);
const edge = spawn(EDGE, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'bramo-promo-'))}`, '--window-size=540,960', '--hide-scrollbars', '--no-first-run', '--autoplay-policy=no-user-gesture-required', 'about:blank'], { stdio: 'ignore' });
let target;
for (let i = 0; i < 50 && !target; i++) {
  await sleep(200);
  try {
    target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === 'page');
  } catch {}
}
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r, { once: true }));
let seq = 0;
const pending = new Map();
ws.addEventListener('message', (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) pending.get(m.id)(m), pending.delete(m.id);
  if (m.method === 'Runtime.exceptionThrown') console.error('page :', m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text);
});
const call = (method, params = {}) => new Promise((r) => { const id = ++seq; pending.set(id, r); ws.send(JSON.stringify({ id, method, params })); });
const evaluate = async (expression) => (await call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result?.result?.value;

await call('Runtime.enable');
await call('Page.enable');
await call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
await call('Emulation.setDeviceMetricsOverride', { width: 540, height: 960, deviceScaleFactor: 2, mobile: false });
await call('Page.addScriptToEvaluateOnNewDocument', { source: SHIM });
await call('Page.navigate', { url });
await sleep(4000);
// Polices et décors chargés avant de lancer l'horloge.
await evaluate(`(async () => { await document.fonts.ready; for (const s of ['town', 'smithing']) await new Promise((r) => { const i = new Image(); i.onload = i.onerror = r; i.src = '/scenes/' + s + '.webp'; }); return true; })()`);
await sleep(800);
const duration = Number(await evaluate(`document.querySelector('.promo-meta')?.dataset.duration ?? 15000`));
await evaluate('window.__vt.start()');

// Mode photos (STILLS=0,1500,4000…) : quelques images à ces instants, en PNG dans le dossier de sortie, sans vidéo.
if (process.env.STILLS) {
  const times = process.env.STILLS.split(',').map(Number).sort((x, y) => x - y);
  let at = 0;
  mkdirSync(dirname(out), { recursive: true });
  for (const time of times) {
    while (at + 1000 / fps <= time) {
      await evaluate(`window.__vt.advance(${1000 / fps})`);
      at += 1000 / fps;
    }
    const shot = await call('Page.captureScreenshot', { format: 'png' });
    const file = join(dirname(out), `still-${String(time).padStart(5, '0')}.png`);
    writeFileSync(file, Buffer.from(shot.result.data, 'base64'));
    console.log(file);
    if (process.env.EVAL) console.log('  ', JSON.stringify(await evaluate(process.env.EVAL)));
  }
  ws.close();
  edge.kill();
  process.exit(0);
}
const frames = mkdtempSync(join(tmpdir(), 'bramo-frames-'));
const count = Math.ceil((duration / 1000) * fps);
const step = 1000 / fps;
const started = Date.now();
for (let i = 0; i < count; i++) {
  await evaluate(`window.__vt.advance(${step})`);
  const shot = await call('Page.captureScreenshot', { format: 'jpeg', quality: 92 });
  writeFileSync(join(frames, `${String(i).padStart(5, '0')}.jpg`), Buffer.from(shot.result.data, 'base64'));
  if (i % 60 === 0) console.log(`image ${i}/${count} (${Math.round((Date.now() - started) / 1000)} s)`);
}
ws.close();
edge.kill();

mkdirSync(dirname(out), { recursive: true });
const ff = spawnSync(FFMPEG, ['-y', '-framerate', String(fps), '-i', join(frames, '%05d.jpg'), '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out], { stdio: 'inherit' });
rmSync(frames, { recursive: true, force: true });
if (ff.status !== 0) throw new Error('ffmpeg a échoué');
console.log(`vidéo : ${out}`);

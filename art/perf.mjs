// Coût d'affichage des tenues (23 octobre) : ouvre la page de développement /#perf (20 personnages animés à la taille
// du bourg) dans Edge sans fenêtre, et mesure les images par seconde de chaque tenue, avec le nombre d'éléments SVG et de
// filtres de lueur par personnage. Les chiffres comparent les tenues entre elles (rendu logiciel, sans carte graphique).
// Lancer (client de développement démarré) : node art/perf.mjs [adresse du client] [tenue:classe ...]
import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const EDGE = process.env.EDGE ?? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const base = process.argv[2] ?? 'http://localhost:5176';
const cases = process.argv.length > 3 ? process.argv.slice(3) : ['ashes:runist', 'embers:forgefire', 'thicket:tracker'];
const port = 9300 + Math.floor(Math.random() * 500);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const edge = spawn(EDGE, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'bramo-perf-'))}`, '--window-size=1440,900', '--no-first-run', 'about:blank'], { stdio: 'ignore' });
let target;
for (let i = 0; i < 50 && !target; i++) {
  await sleep(200);
  try {
    target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === 'page');
  } catch {
    // Edge démarre.
  }
}
if (!target) throw new Error('Edge ne répond pas.');
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r, { once: true }));
let seq = 0;
const pending = new Map();
ws.addEventListener('message', (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) {
    pending.get(m.id)(m);
    pending.delete(m.id);
  }
});
const send = (method, params = {}) =>
  new Promise((r) => {
    const id = ++seq;
    pending.set(id, r);
    ws.send(JSON.stringify({ id, method, params }));
  });
const evaluate = async (expression) => (await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result?.result?.value;

const measure = `(async () => {
  await new Promise((r) => setTimeout(r, 1500));
  let frames = 0;
  const t0 = performance.now();
  await new Promise((r) => { const tick = () => { frames++; if (performance.now() - t0 < 4000) requestAnimationFrame(tick); else r(); }; requestAnimationFrame(tick); });
  const rigs = document.querySelectorAll('.rig');
  const n = Math.max(1, rigs.length);
  return { fps: Math.round((frames / (performance.now() - t0)) * 1000 * 10) / 10, elements: Math.round(document.querySelectorAll('.rig *').length / n), glows: Math.round(document.querySelectorAll('.rig [filter]').length / n), n: rigs.length };
})()`;

console.log('tenue:classe'.padEnd(36), 'img/s', ' éléments', ' lueurs');
for (const c of cases) {
  // tenue:classe[:option] — option : nofx (sans lueurs), nopat (sans matières), still (figés).
  const [outfit, cls, opt] = c.split(':');
  await send('Page.navigate', { url: `${base}/?outfit=${outfit}&class=${cls}${opt?.includes('n=') ? '' : '&n=20'}${opt ? opt.split('+').map((o) => (o.includes('=') ? `&${o}` : `&${o}=1`)).join('') : ''}#perf` });
  await sleep(2500);
  const r = await evaluate(measure);
  console.log(c.padEnd(36), String(r?.fps ?? '?').padStart(5), String(r?.elements ?? '?').padStart(9), String(r?.glows ?? '?').padStart(7));
}
ws.close();
edge.kill();

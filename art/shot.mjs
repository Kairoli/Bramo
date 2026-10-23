// Capture d'une page de développement dans Edge sans fenêtre, animations actives même si Windows les réduit
// (« réduire les animations » coupe les effets des pièces) : node art/shot.mjs <adresse> <fichier.png> [largeur] [hauteur] [attente ms]
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const EDGE = process.env.EDGE ?? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const [url, out, width = '1440', height = '1000', wait = '3500'] = process.argv.slice(2);
const port = 9800 + Math.floor(Math.random() * 400);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const edge = spawn(EDGE, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'bramo-shot-'))}`, `--window-size=${width},${height}`, '--hide-scrollbars', '--no-first-run', 'about:blank'], { stdio: 'ignore' });
let target;
for (let i = 0; i < 50 && !target; i++) {
  await sleep(200);
  try {
    target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === 'page');
  } catch {
    // Edge démarre.
  }
}
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r, { once: true }));
let seq = 0;
const pending = new Map();
ws.addEventListener('message', (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) pending.get(m.id)(m), pending.delete(m.id);
});
const send = (method, params = {}) => new Promise((r) => (pending.set(++seq, r), ws.send(JSON.stringify({ id: seq, method, params }))));
await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
await send('Emulation.setDeviceMetricsOverride', { width: Number(width), height: Number(height), deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url });
await sleep(Number(wait));
const shot = await send('Page.captureScreenshot', { format: 'png' });
writeFileSync(out, Buffer.from(shot.result.data, 'base64'));
console.log(out);
ws.close();
edge.kill();

// Détoure une illustration peinte sur fond sombre (armes d'essai livrées par ChatGPT, fond noir et halo) et l'enregistre
// en WebP transparent, recadré au plus juste. Le fond est ce qu'on atteint depuis les bords sans franchir de contour net
// (le halo est un dégradé doux, le dessin a un trait) ; le halo peut être gardé, en transparence, ou retiré.
// Le traitement se fait dans Edge sans fenêtre (canvas), aucune dépendance à installer.
// Usage : node art/cutout.mjs <entrée.png> <sortie.webp> [hauteur=720] [halo=0.45] [seuil=9]
import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const [input, output, height = '720', halo = '0.45', threshold = '9'] = process.argv.slice(2);
if (!input || !output) throw new Error('usage : node art/cutout.mjs <entrée.png> <sortie.webp> [hauteur] [halo] [seuil]');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const port = 9600 + Math.floor(Math.random() * 90);
const edge = spawn(EDGE, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'bramo-cutout-'))}`, '--no-first-run', 'about:blank'], { stdio: 'ignore' });
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
});
const call = (method, params = {}) => new Promise((r) => { const id = ++seq; pending.set(id, r); ws.send(JSON.stringify({ id, method, params })); });

const src = `data:image/png;base64,${readFileSync(input).toString('base64')}`;
const job = `(async () => {
  const img = new Image();
  img.src = ${JSON.stringify(src)};
  await img.decode();
  const W = img.width, H = img.height;
  const c = new OffscreenCanvas(W, H), g = c.getContext('2d');
  g.drawImage(img, 0, 0);
  const d = g.getImageData(0, 0, W, H).data;
  const T = ${Number(threshold)}, HALO = ${Number(halo)};
  // Contour : écart le plus fort avec les voisins (sur le canal qui varie le plus).
  const edge = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x; let m = 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= W || Y >= H) continue;
      const j = Y * W + X;
      for (let k = 0; k < 3; k++) m = Math.max(m, Math.abs(d[i * 4 + k] - d[j * 4 + k]));
    }
    edge[i] = m;
  }
  // Fond : remplissage depuis les bords, sans franchir de contour.
  const bg = new Uint8Array(W * H), stack = [];
  const push = (i) => { if (!bg[i] && edge[i] <= T) { bg[i] = 1; stack.push(i); } };
  for (let x = 0; x < W; x++) { push(x); push((H - 1) * W + x); }
  for (let y = 0; y < H; y++) { push(y * W); push(y * W + W - 1); }
  while (stack.length) {
    const i = stack.pop(), x = i % W, y = (i / W) | 0;
    if (x > 0) push(i - 1); if (x < W - 1) push(i + 1); if (y > 0) push(i - W); if (y < H - 1) push(i + W);
  }
  // Petites îles (grain du halo) rendues au fond : on ne garde que les morceaux du dessin assez grands.
  const comp = new Int32Array(W * H).fill(-1); const sizes = [];
  for (let s = 0; s < W * H; s++) {
    if (bg[s] || comp[s] >= 0) continue;
    const id = sizes.length; let n = 0; const st = [s]; comp[s] = id;
    while (st.length) {
      const i = st.pop(), x = i % W, y = (i / W) | 0; n++;
      for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, y > 0 ? i - W : -1, y < H - 1 ? i + W : -1])
        if (j >= 0 && !bg[j] && comp[j] < 0) { comp[j] = id; st.push(j); }
    }
    sizes.push(n);
  }
  const minSize = W * H * 0.0004;
  for (let i = 0; i < W * H; i++) if (!bg[i] && sizes[comp[i]] < minSize) bg[i] = 1;
  // Alpha : le dessin plein, un bord adouci sur un pixel, le halo en transparence (couleur rendue à pleine intensité).
  const out = new ImageData(W, H), o = out.data;
  let x0 = W, y0 = H, x1 = 0, y1 = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x, p = i * 4;
    let a, near = 0;
    if (!bg[i]) a = 1;
    else {
      for (const j of [i - 1, i + 1, i - W, i + W]) if (j >= 0 && j < W * H && !bg[j]) near = 1;
      const m = Math.max(d[p], d[p + 1], d[p + 2]) / 255;
      a = Math.max(near ? 0.5 : 0, Math.min(1, m * 1.6) * HALO);
    }
    // Le bord adouci garde sa couleur (sinon une frange vive) ; seul le halo est rendu à pleine intensité.
    if (bg[i] && !near && a > 0 && a < 1) {
      const m = Math.max(d[p], d[p + 1], d[p + 2]) || 1;
      for (let k = 0; k < 3; k++) o[p + k] = Math.min(255, d[p + k] * 255 / m);
    } else for (let k = 0; k < 3; k++) o[p + k] = d[p + k];
    o[p + 3] = Math.round(a * 255);
    if (a > 0.06) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  }
  g.putImageData(out, 0, 0);
  const cw = x1 - x0 + 1, ch = y1 - y0 + 1, H2 = Math.min(${Number(height)}, ch), W2 = Math.round(cw * H2 / ch);
  const c2 = new OffscreenCanvas(W2, H2), g2 = c2.getContext('2d');
  g2.imageSmoothingQuality = 'high';
  g2.drawImage(c, x0, y0, cw, ch, 0, 0, W2, H2);
  const blob = await c2.convertToBlob({ type: 'image/webp', quality: 0.9 });
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return JSON.stringify({ data: btoa(s), crop: [x0, y0, cw, ch], size: [W2, H2], scale: H2 / ch });
})()`;
const res = await call('Runtime.evaluate', { expression: job, awaitPromise: true, returnByValue: true });
ws.close();
edge.kill();
if (res.result?.exceptionDetails) throw new Error(res.result.exceptionDetails.exception?.description ?? 'échec du détourage');
const r = JSON.parse(res.result.result.value);
writeFileSync(output, Buffer.from(r.data, 'base64'));
// Le recadrage (dans l'image d'origine) et l'échelle servent à placer l'arme dans la main (repères mesurés sur l'original).
console.log(JSON.stringify({ output, crop: r.crop, size: r.size, scale: +r.scale.toFixed(4) }));

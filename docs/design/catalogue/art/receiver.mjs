// Petit récepteur local : reçoit en POST le SVG d'un personnage capturé dans l'Atelier et l'écrit dans ce dossier. Outil de dev, à arrêter après usage.
import { createServer } from 'node:http';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') return res.end();
  const name = decodeURIComponent((req.url ?? '/x').slice(1)).replace(/[^a-z0-9_-]/gi, '');
  let body = '';
  req.on('data', (d) => (body += d));
  req.on('end', () => {
    if (name) writeFileSync(join(here, `${name}.svg`), body);
    res.end('ok');
  });
}).listen(8765, '127.0.0.1');

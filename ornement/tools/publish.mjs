// Publie les ornements livrés dans ornement/ vers le jeu :
// - les quatre PNG utiles de chaque ornement → apps/web/public/ornaments/<métier>/<rang>/<pièce>.png
// - le catalogue → data/ornaments.yaml (le titre vient de data/trials.yaml, jamais recopié ici).
// Usage : node ornement/tools/publish.mjs
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const manifest = JSON.parse(readFileSync(join(root, 'ornement', 'manifest.json'), 'utf8'));
const parts = ['left', 'right', 'center', 'badge'];

const entries = Object.entries(manifest.entries).sort(
  ([, a], [, b]) => a.profession.localeCompare(b.profession) || a.rank - b.rank,
);
const lines = [
  '# Ornements de métier (cadre autour du pseudo et du titre). Généré par ornement/tools/publish.mjs depuis',
  '# ornement/manifest.json : ne pas modifier à la main. Images : apps/web/public/ornaments/<métier>/<rang>/.',
  '# trial : la commande du maître qui le débloque (son surnom est le titre affiché).',
  '# reserved : variante sans déblocage ni titre (palier 90, en réserve) ; visible seulement avec settings.ornaments.unlockAll.',
];
for (const [key, e] of entries) {
  const out = join(root, 'apps', 'web', 'public', 'ornaments', e.profession, String(e.rank));
  mkdirSync(out, { recursive: true });
  for (const part of parts) copyFileSync(join(root, 'ornement', e.files[part]), join(out, `${part}.png`));
  lines.push(`- id: ${key}`, `  profession: ${e.profession}`, `  rank: ${e.rank}`);
  if (e.trialId) lines.push(`  trial: ${e.trialId}`);
  if (!e.enabled) lines.push('  reserved: true');
}
writeFileSync(join(root, 'data', 'ornaments.yaml'), lines.join('\n') + '\n');
console.log(`${entries.length} ornements publiés.`);

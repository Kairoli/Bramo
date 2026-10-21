// Contrôle une livraison de pièces dessinées par un illustrateur (voir docs/design/brief-art/brief.md).
// Usage : node art/validate_delivery.mjs <dossier contenant armor_helm.svg, armor_cuirass.svg…>
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { basename, join } from 'node:path';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), 'parts');

/** Pièce livrée → emplacement et pièce d'esquisse dont on reprend les calques, os et ordre. */
const PIECES = {
  armor_helm: ['headwear', 'plate_helm'],
  armor_cuirass: ['top', 'plate_cuirass'],
  armor_gauntlets: ['gloves', 'plate_gauntlets'],
  armor_greaves: ['legs', 'plate_greaves'],
  armor_sabatons: ['boots', 'plate_sabatons'],
  armor_girdle: ['belt', 'plate_girdle'],
  armor_cloak: ['cape', 'battle_cloak'],
  armor_pauldron_near: ['shoulder_near', 'plate_pauldron_near'],
  armor_pauldron_far: ['shoulder_far', 'forge_pauldron'],
};
const ALLOWED_HEX = new Set(['#000', '#000000', '#fff', '#ffffff', '#f1f0ec', '#16130f', '#ff8a3c', '#ffc15a', '#ff6a2b']);
const MAX_PATHS = 150;
const MAX_BYTES = 60 * 1024;

const dir = process.argv[2];
if (!dir) {
  console.error('Usage : node art/validate_delivery.mjs <dossier>');
  process.exit(2);
}

let errors = 0;
let warnings = 0;
const fail = (file, msg) => { errors++; console.log(`  ERREUR  ${file} : ${msg}`); };
const warn = (file, msg) => { warnings++; console.log(`  avertissement  ${file} : ${msg}`); };

const files = readdirSync(dir).filter((f) => f.endsWith('.svg')).sort();
const expected = new Set(Object.keys(PIECES));
for (const f of files) {
  const id = basename(f, '.svg');
  if (!expected.has(id)) {
    console.log(`  ${f} : nom inconnu, ignoré (attendus : ${[...expected].join(', ')})`);
    continue;
  }
  const [slot, partId] = PIECES[id];
  const manifest = JSON.parse(readFileSync(join(root, slot, `${partId}.json`), 'utf8'));
  const text = readFileSync(join(dir, f), 'utf8');
  const size = statSync(join(dir, f)).size;
  console.log(`${f} (${slot}, ${(size / 1024).toFixed(1)} Ko)`);

  if (size > MAX_BYTES) fail(f, `${(size / 1024).toFixed(0)} Ko, maximum ${MAX_BYTES / 1024} Ko`);
  if (!/<svg[^>]*xmlns="http:\/\/www\.w3\.org\/2000\/svg"/.test(text)) fail(f, 'balise <svg> sans xmlns');
  if (!/viewBox="0 0 480 760"/.test(text)) fail(f, 'viewBox doit être exactement "0 0 480 760"');
  for (const bad of ['<image', '<filter', '<script', '<foreignObject', '<use ', 'href="http', 'xlink:href']) {
    if (text.includes(bad)) fail(f, `interdit : ${bad}`);
  }
  for (const c of text.match(/<!--[\s\S]*?-->/g) ?? []) if (c.slice(4, -3).includes('--')) fail(f, 'un commentaire contient « -- » (le fichier serait refusé)');

  // Calques : exactement ceux attendus, en <g id> de premier niveau, sans transform.
  const top = [...text.matchAll(/^ {0,4}<g id="([a-z][a-z0-9_]*)"([^>]*)>/gm)];
  const ids = top.map((m) => m[1]);
  for (const l of manifest.layers) if (!ids.includes(l.id)) fail(f, `calque « ${l.id} » absent`);
  for (const i of ids) if (!manifest.layers.some((l) => l.id === i)) warn(f, `calque « ${i} » inattendu (sera ignoré)`);
  for (const m of top) if (/transform=/.test(m[2])) fail(f, `le calque « ${m[1]} » ne doit pas avoir de transform`);

  // Couleurs : variables du jeu, hex seulement pour les ombrages et effets autorisés.
  const hexes = new Set((text.match(/#[0-9a-fA-F]{3,6}\b/g) ?? []).map((h) => h.toLowerCase()));
  const defsIds = [...text.matchAll(/id="((?:linear|radial)?[a-zA-Z0-9_-]*)"/g)].map((m) => m[1]).filter((i) => !ids.includes(i));
  for (const h of hexes) {
    // les couleurs d'ancres d'id comme #rig-light ne sont pas des hex : on ne garde que ceux qui sont dans un attribut de couleur
  }
  const colorAttrs = [...text.matchAll(/(?:fill|stroke|stop-color|flood-color)="(#[0-9a-fA-F]{3,6})"/g)].map((m) => m[1].toLowerCase());
  const loose = [...new Set(colorAttrs.filter((h) => !ALLOWED_HEX.has(h)))];
  if (loose.length) fail(f, `couleurs en dur interdites (utiliser var(--c-…)) : ${loose.slice(0, 8).join(', ')}`);
  for (const i of defsIds) if (!i.startsWith('rig-')) warn(f, `id « ${i} » : les dégradés doivent s'appeler rig-…`);

  const paths = (text.match(/<(path|circle|ellipse|rect|polygon|polyline|line)\b/g) ?? []).length;
  if (paths > MAX_PATHS) fail(f, `${paths} formes, maximum ${MAX_PATHS}`);
  else console.log(`  ${paths} formes, ${ids.length} calques`);
}
const missing = [...expected].filter((e) => !files.includes(`${e}.svg`));
if (missing.length) console.log(`Pièces non livrées dans ce lot : ${missing.join(', ')}`);
console.log(errors ? `${errors} erreur(s), ${warnings} avertissement(s)` : `OK, ${warnings} avertissement(s)`);
process.exit(errors ? 1 : 0);

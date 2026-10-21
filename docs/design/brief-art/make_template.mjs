// Génère les gabarits à donner à l'illustrateur (ChatGPT) : gabarit_corps.svg (corps nu, os, grille) et
// gabarit_exemple.svg (le même avec l'Armure d'esquisse par-dessus). Usage : node docs/design/brief-art/make_template.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const art = join(here, '..', '..', '..', 'art');
const rig = JSON.parse(readFileSync(join(art, 'rig', 'humanoid.json'), 'utf8'));

const COLORS = {
  '--c-skin': '#C99A78', '--c-skin-dark': '#8A6248', '--c-legs': '#2E3438', '--c-legs-dark': '#252A2D', '--c-boots': '#2B2320', '--c-leather': '#3A2C24',
  '--c-wood': '#4A3528', '--c-wood-light': '#7A5A44', '--c-shadow': '#0B0D10', '--c-stone': '#232A2E',
  '--c-coat': '#5A4630', '--c-coat-dark': '#3E3022', '--c-mantle': '#7A2E2A', '--c-under': '#3A302A', '--c-trim': '#E0A55C', '--c-metal': '#8C9497', '--c-beard': '#6B321F',
  '--c-glow': '#F08A4B', '--c-glow-light': '#F8C49E',
};
const style = Object.entries(COLORS).map(([k, v]) => `${k}:${v}`).join(';');

const layersOf = (slot, id) => {
  const dir = join(art, 'parts', slot);
  const manifest = JSON.parse(readFileSync(join(dir, `${id}.json`), 'utf8'));
  const svg = readFileSync(join(dir, `${id}.svg`), 'utf8');
  return manifest.layers.map((l) => {
    const m = svg.match(new RegExp(`<g id="${l.id}">([\\s\\S]*?)\\n  </g>`));
    return { z: l.z, markup: m ? m[1] : '' };
  });
};

const defs = `<defs>
  <linearGradient id="rig-shade" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity=".35"/><stop offset=".55" stop-color="#000" stop-opacity="0"/></linearGradient>
  <linearGradient id="rig-light" x1="0" x2="1"><stop offset=".45" stop-color="var(--c-glow)" stop-opacity="0"/><stop offset="1" stop-color="var(--c-glow)" stop-opacity=".22"/></linearGradient>
</defs>`;

const grid = (() => {
  let s = '';
  for (let x = 0; x <= 480; x += 40) s += `<line x1="${x}" y1="0" x2="${x}" y2="760" stroke="${x % 200 === 0 ? '#7a8' : '#456'}" stroke-opacity=".35" stroke-width="${x % 200 === 0 ? 1.2 : .6}"/><text x="${x + 2}" y="10" font-size="9" fill="#8aa" font-family="monospace">${x}</text>`;
  for (let y = 0; y <= 760; y += 40) s += `<line x1="0" y1="${y}" x2="480" y2="${y}" stroke="${y % 200 === 0 ? '#7a8' : '#456'}" stroke-opacity=".35" stroke-width="${y % 200 === 0 ? 1.2 : .6}"/><text x="2" y="${y - 2}" font-size="9" fill="#8aa" font-family="monospace">${y}</text>`;
  s += '<line x1="0" y1="700" x2="480" y2="700" stroke="#e55" stroke-width="1.5" stroke-dasharray="6 4"/><text x="380" y="694" font-size="10" fill="#e88" font-family="monospace">sol y=700</text>';
  return s;
})();

const bones = (() => {
  const byId = Object.fromEntries(rig.bones.map((b) => [b.id, b]));
  let s = '';
  for (const b of rig.bones) {
    if (b.parent) {
      const p = byId[b.parent];
      s += `<line x1="${p.pivot[0]}" y1="${p.pivot[1]}" x2="${b.pivot[0]}" y2="${b.pivot[1]}" stroke="#4cc9d6" stroke-width="1.6" stroke-opacity=".8"/>`;
    }
  }
  for (const b of rig.bones) s += `<circle cx="${b.pivot[0]}" cy="${b.pivot[1]}" r="3.6" fill="#4cc9d6"/><text x="${b.pivot[0] + 6}" y="${b.pivot[1] - 4}" font-size="9" fill="#9ee" font-family="monospace">${b.id} (${b.pivot[0]},${b.pivot[1]})</text>`;
  return s;
})();

const compose = (withExample) => {
  const items = layersOf('body', 'base').filter((l) => !/ellipse/.test(l.markup) || true);
  if (withExample) {
    for (const [slot, id] of [['headwear', 'plate_helm'], ['face', 'forge_beard'], ['top', 'plate_cuirass'], ['gloves', 'plate_gauntlets'], ['legs', 'plate_greaves'], ['boots', 'plate_sabatons'], ['belt', 'plate_girdle'], ['cape', 'battle_cloak'], ['shoulder_far', 'forge_pauldron'], ['shoulder_near', 'plate_pauldron_near']]) {
      items.push(...layersOf(slot, id));
    }
  }
  items.sort((a, b) => a.z - b.z);
  return items.map((i) => i.markup).join('\n');
};

const make = (withExample, title) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 760" width="960" height="1520" style="${style};background:#20262a">
  <title>${title}</title>
  ${defs}
  <rect width="480" height="760" fill="#20262a"/>
  <g id="grille">${grid}</g>
  <g id="personnage">
${compose(withExample)}
  </g>
  <g id="os">${bones}</g>
</svg>
`;

writeFileSync(join(here, 'gabarit_corps.svg'), make(false, 'Gabarit : corps nu, os et grille (pose de repos)'));
writeFileSync(join(here, 'gabarit_exemple.svg'), make(true, 'Exemple : pièces d’Armure d’esquisse sur le gabarit'));
console.log('gabarits écrits');

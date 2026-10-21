// Détails de la famille Armure : enrichit les pièces de base (make_plate.mjs) et génère les variantes Épique, Légendaire
// et les pièces des ensembles Cendres persistantes et L'Enclume patiente. À lancer APRÈS make_plate.mjs :
//   node art/make_plate.mjs && node art/make_plate_variants.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), 'parts');
const read = (slot, id) => ({
  svg: readFileSync(join(root, slot, `${id}.svg`), 'utf8'),
  json: JSON.parse(readFileSync(join(root, slot, `${id}.json`), 'utf8')),
});

// --- petits motifs réutilisables ---
const EMBER = '#FF8A3C';
const EMBER_HOT = '#FFC15A';
const FLAME = '#FF6A2B';
const rivets = (pts, color = 'var(--c-trim)', r = 2.4) => pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${color}"/>`).join('');
const trim = (d, w = 1.6) => `<path d="${d}" stroke="var(--c-trim)" stroke-width="${w}" fill="none" stroke-linecap="round"/>`;
const rune = (d, w = 2) => `<path d="${d}" stroke="var(--c-glow)" stroke-width="${w}" fill="none" stroke-linecap="round" class="fx-pulse"/>`;
const crack = (d, w = 2.2, c = EMBER) => `<path d="${d}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linejoin="round" class="fx-pulse"/>`;
const edge = (d) => `<path d="${d}" stroke="#F1F0EC" stroke-opacity=".28" stroke-width="2" fill="none" stroke-linecap="round"/>`;
const scratch = (d) => `<path d="${d}" stroke="#000" stroke-opacity=".3" stroke-width="1.4" fill="none"/>`;

/** extras[slot/id][layer] = { base, epic, legendary, cendres, enclume } */
const X = {
  'headwear/plate_helm': {
    back: {
      epic: `<path d="M194 62 Q166 38 146 76 Q170 66 190 80 Z" fill="var(--c-mantle)"/>${trim('M194 62 Q166 38 146 76')}`,
      legendary: `<path d="M196 60 Q160 24 138 80 Q166 66 190 82 Z" fill="var(--c-mantle)"/>${trim('M190 64 Q168 44 154 76', 2)}${rune('M200 58 Q176 30 160 60')}`,
      cendres: `<path d="M196 62 Q170 36 148 70 Q172 60 190 78 Z" fill="#2A1F1C"/>${crack('M196 62 Q170 36 148 70')}`,
    },
    front: {
      base: edge('M184 100 Q192 72 214 62') + scratch('M200 66 L204 96'),
      epic: trim('M200 72 Q222 62 244 76 M204 84 Q224 76 246 86') + rivets([[230, 70]]),
      legendary: `<path d="M184 96 L158 78 L168 100 L162 114 L186 108 Z" fill="var(--c-metal)"/><path d="M184 96 L158 78 L168 100 L162 114 L186 108 Z" fill="#000" opacity=".3"/>${trim('M184 96 L158 78', 2.2)}<circle cx="226" cy="76" r="4" fill="var(--c-glow)" class="fx-pulse"/>${rune('M200 72 Q222 62 244 76', 1.6)}`,
      cendres: `${crack('M204 76 L212 86 L206 94 M224 68 L230 80 L240 84')}<path d="M202 60 Q206 34 214 50 Q218 28 226 52 Q232 38 236 62 Z" fill="${FLAME}" class="fx-pulse"/><path d="M210 60 Q214 46 218 56 Q222 44 226 60 Z" fill="${EMBER_HOT}"/>`,
      enclume: `<path d="M200 56 L238 56 L244 62 L234 64 L234 70 L206 70 L206 64 L196 62 Z" fill="var(--c-metal)"/><path d="M200 56 L238 56 L244 62 L234 64 L234 70 L206 70 L206 64 L196 62 Z" fill="#000" opacity=".25"/>${trim('M200 56 L238 56', 2)}<path d="M183 96 Q214 86 249 92 L249 100 Q214 94 185 104 Z" fill="var(--c-metal)"/><path d="M183 96 Q214 86 249 92 L249 100 Q214 94 185 104 Z" fill="#000" opacity=".3"/>${rivets([[196, 98], [214, 92], [232, 92]], 'var(--c-trim)', 2)}`,
    },
  },
  'top/plate_cuirass': {
    torso: {
      base: edge('M152 180 Q200 160 252 170') + scratch('M178 250 L190 262 M236 270 L246 282 M170 214 L176 224') + rivets([[170, 190], [244, 192]], '#F1F0EC', 2),
      epic: trim('M158 190 Q180 200 206 200 M258 192 Q236 204 220 204 M162 292 Q206 304 256 292', 1.8) + `<circle cx="212" cy="214" r="12" fill="var(--c-coat-dark)"/><circle cx="212" cy="214" r="12" fill="none" stroke="var(--c-trim)" stroke-width="2.4"/><path d="M212 206 L218 214 L212 222 L206 214 Z" fill="var(--c-trim)"/>`,
      legendary: trim('M158 190 Q180 200 206 200 M258 192 Q236 204 220 204', 1.8) + `<circle cx="212" cy="214" r="13" fill="var(--c-coat-dark)"/><circle cx="212" cy="214" r="13" fill="none" stroke="var(--c-trim)" stroke-width="2.6"/><path d="M212 204 L220 214 L212 224 L204 214 Z" fill="var(--c-glow)" class="fx-pulse"/>${rune('M212 196 L212 188 M230 214 L238 214 M194 214 L186 214')}${rune('M160 232 Q186 246 206 240 M258 230 Q236 244 220 240')}`,
      cendres: `${crack('M166 200 L178 218 L170 232 L186 246 L180 262')}${crack('M244 188 L236 208 L248 224 L238 240')}${crack('M200 252 L210 266 L204 280 L216 292', 2, EMBER_HOT)}<path d="M168 228 Q176 222 184 230 L176 242 Z" fill="#000" opacity=".3"/><path d="M212 200 Q224 212 212 228 Q200 212 212 200 Z" fill="${FLAME}" class="fx-pulse"/><path d="M212 208 Q218 216 212 224 Q206 216 212 208 Z" fill="${EMBER_HOT}"/>`,
      enclume: `<path d="M196 204 L232 204 L238 210 L228 212 L226 222 L236 226 L236 232 L188 232 L188 226 L198 222 L198 212 L190 210 Z" fill="var(--c-coat-dark)"/><path d="M196 204 L232 204 L238 210 L228 212 L226 222 L236 226 L236 232 L188 232 L188 226 L198 222 L198 212 L190 210 Z" fill="none" stroke="var(--c-trim)" stroke-width="2"/>${trim('M154 250 Q206 266 260 250', 2.4)}${rivets([[168, 196], [188, 198], [238, 190], [168, 256], [244, 252]], 'var(--c-trim)', 2.6)}`,
    },
    sleeve_near_upper: {
      base: edge('M146 190 Q152 180 166 178'),
      epic: trim('M146 214 Q158 220 170 216'),
      legendary: trim('M146 214 Q158 220 170 216') + rune('M150 238 Q160 244 170 240'),
      cendres: crack('M150 200 L160 222 L152 240'),
      enclume: rivets([[150, 196], [166, 192], [152, 250]], 'var(--c-trim)', 2.2),
    },
    sleeve_far_upper: {
      epic: trim('M262 214 L294 206'),
      legendary: trim('M262 214 L294 206') + rune('M264 240 L296 232'),
      cendres: crack('M268 196 L276 214 L270 232'),
      enclume: rivets([[262, 196], [286, 188], [272, 264]], 'var(--c-trim)', 2.2),
    },
    forearm_near: {
      base: scratch('M140 340 L150 348'),
      epic: trim('M135 322 L166 328'),
      legendary: trim('M135 322 L166 328') + rune('M133 342 L164 348'),
      cendres: crack('M142 304 L150 320 L144 336'),
      enclume: rivets([[140, 300], [160, 304], [146, 360]], 'var(--c-trim)', 2.2),
    },
    forearm_far: {
      epic: trim('M296 270 L318 258'),
      legendary: trim('M296 270 L318 258') + rune('M300 284 L322 272'),
      cendres: crack('M294 280 L304 270 L312 276 L322 262'),
      enclume: rivets([[290, 288], [334, 246]], 'var(--c-trim)', 2.2),
    },
  },
  'gloves/plate_gauntlets': {
    near: {
      epic: trim('M126 372 L156 376'),
      legendary: trim('M126 372 L156 376') + rune('M128 390 L152 389', 1.8),
      cendres: crack('M130 380 L140 388 L134 396 M146 372 L152 382'),
      enclume: rivets([[128, 360], [154, 362], [141, 372]], 'var(--c-trim)', 2),
    },
    far: {
      epic: trim('M313 244 L337 224'),
      legendary: trim('M313 244 L337 224') + rune('M319 252 L341 232', 1.8),
      cendres: crack('M316 240 L326 246 L322 254'),
      enclume: rivets([[316, 232], [340, 250]], 'var(--c-trim)', 2),
    },
  },
  'legs/plate_greaves': {
    thigh_near: {
      base: edge('M164 340 L168 552') + scratch('M178 420 L186 432 M170 494 L178 504'),
      epic: trim('M176 340 Q172 440 176 548', 1.6),
      legendary: trim('M176 340 Q172 440 176 548', 1.6) + rune('M190 348 Q186 440 188 548'),
      cendres: crack('M172 360 L182 392 L174 420 L186 452 L178 484'),
      enclume: rivets([[168, 350], [200, 350], [170, 540], [196, 540]], 'var(--c-trim)', 2.4),
    },
    thigh_far: {
      epic: trim('M226 340 Q224 440 228 548', 1.6),
      legendary: trim('M226 340 Q224 440 228 548', 1.6) + rune('M238 348 Q236 440 240 548'),
      cendres: crack('M222 360 L232 392 L224 420 L236 452'),
      enclume: rivets([[216, 350], [240, 350], [222, 544], [244, 544]], 'var(--c-trim)', 2.4),
    },
    shin_near: {
      epic: trim('M176 586 L182 646', 1.6),
      legendary: trim('M176 586 L182 646', 1.6) + rune('M188 584 L186 644', 1.8),
      cendres: crack('M174 590 L184 606 L176 624 L186 640'),
      enclume: rivets([[170, 584], [194, 586], [172, 640], [188, 642]], 'var(--c-trim)', 2.2),
    },
    shin_far: {
      epic: trim('M232 576 L236 628', 1.6),
      legendary: trim('M232 576 L236 628', 1.6) + rune('M242 576 L244 628', 1.8),
      cendres: crack('M230 580 L240 596 L232 616'),
      enclume: rivets([[224, 574], [246, 574], [228, 628]], 'var(--c-trim)', 2.2),
    },
  },
  'boots/plate_sabatons': {
    near: {
      epic: trim('M172 664 Q196 676 222 674', 1.6),
      legendary: trim('M172 664 Q196 676 222 674', 1.6) + rune('M170 650 L196 652', 1.8),
      cendres: crack('M200 668 L212 678 L206 688'),
      enclume: rivets([[172, 644], [192, 644], [210, 676]], 'var(--c-trim)', 2),
    },
    far: {
      epic: trim('M228 660 Q256 672 280 672', 1.6),
      legendary: trim('M228 660 Q256 672 280 672', 1.6) + rune('M226 644 L250 646', 1.8),
      cendres: crack('M256 664 L266 674 L260 684'),
      enclume: rivets([[226, 640], [246, 640]], 'var(--c-trim)', 2),
    },
  },
  'belt/plate_girdle': {
    belt: {
      base: scratch('M160 304 L170 308 M240 306 L252 302') + rivets([[168, 298], [186, 304], [238, 304], [252, 298]], '#F1F0EC', 1.8),
      epic: rivets([[168, 298], [186, 304], [238, 304], [252, 298]], 'var(--c-trim)', 2.2),
      legendary: `<path d="M203 296 L221 297 L221 314 L203 313 Z" fill="var(--c-glow)" opacity=".8" class="fx-pulse"/>` + rivets([[168, 298], [186, 304], [238, 304], [252, 298]], 'var(--c-trim)', 2.2),
      cendres: `<path d="M203 296 L221 297 L221 314 L203 313 Z" fill="${FLAME}" class="fx-pulse"/>`,
      enclume: `<path d="M200 300 L224 300 L228 305 L220 306 L220 312 L204 312 L204 306 L196 305 Z" fill="var(--c-trim)"/>`,
    },
    tassets: {
      epic: trim('M158 328 L190 336 M232 336 L264 328'),
      legendary: trim('M158 328 L190 336 M232 336 L264 328') + rune('M160 346 L188 352 M236 352 L264 344', 1.8),
      cendres: crack('M162 330 L174 342 L168 354 M246 330 L254 344'),
      enclume: rivets([[160, 322], [186, 328], [238, 330], [260, 322]], 'var(--c-trim)', 2.2),
    },
  },
  'cape/battle_cloak': {
    back: {
      base: `<path d="M176 200 Q168 300 164 410" stroke="#F1F0EC" stroke-opacity=".08" stroke-width="3" fill="none"/>`,
      epic: trim('M142 408 Q172 428 210 420 M152 380 Q176 396 206 390', 1.6),
      legendary: trim('M142 408 Q172 428 210 420', 1.8) + rune('M156 330 Q176 346 204 340 M160 290 Q178 304 202 300', 1.8),
      cendres: `<path d="M138 424 L148 410 L156 428 L166 414 L176 434 L188 416 L200 436 L212 420 L224 430 L236 410 L246 416 L246 336 L138 424 Z" fill="#1E1512"/>${crack('M148 410 L156 428 L166 414 L176 434', 1.8)}`,
    },
  },
  'shoulder_near/plate_pauldron_near': {
    pauldron: {
      base: edge('M136 192 Q146 168 174 168') + rivets([[148, 182], [168, 176]], '#F1F0EC', 1.8),
      epic: trim('M140 212 Q160 202 184 212') + rivets([[150, 182], [168, 176]]),
      legendary: `<path d="M150 170 L142 140 L162 164 Z" fill="var(--c-metal)"/><path d="M168 166 L170 134 L180 168 Z" fill="var(--c-metal)"/>${trim('M150 170 L142 140', 1.6)}${rune('M140 214 Q160 204 184 214', 1.8)}`,
      cendres: crack('M138 194 L150 208 L146 224'),
      enclume: `<path d="M132 190 Q142 160 176 164 L176 156 L134 162 Z" fill="var(--c-metal)"/>${rivets([[148, 180], [166, 174], [150, 214], [170, 216]], 'var(--c-trim)', 2.4)}`,
    },
  },
};

const VARIANTS = {
  epic: { label: 'ouvrage épique', only: null },
  legendary: { label: 'ouvrage légendaire', only: null },
  cendres: { label: 'Cendres persistantes', only: new Set(['headwear/plate_helm', 'top/plate_cuirass', 'gloves/plate_gauntlets', 'legs/plate_greaves']) },
  enclume: { label: 'L\'Enclume patiente', only: new Set(['top/plate_cuirass', 'legs/plate_greaves', 'boots/plate_sabatons', 'belt/plate_girdle']) },
};

const inject = (svg, layer, extra) => {
  const re = new RegExp(`(<g id="${layer}">[\\s\\S]*?)(\\n  </g>)`);
  if (!re.test(svg)) throw new Error(`calque ${layer} introuvable`);
  return svg.replace(re, (_, a, b) => `${a}\n    ${extra}${b}`);
};

for (const [key, layersMap] of Object.entries(X)) {
  const [slot, id] = key.split('/');
  const { svg: pristine, json } = read(slot, id);
  // 1. enrichir la pièce de base
  let base = pristine;
  for (const [layer, v] of Object.entries(layersMap)) if (v.base) base = inject(base, layer, v.base);
  writeFileSync(join(root, slot, `${id}.svg`), base);
  // 2. variantes
  for (const [variant, cfg] of Object.entries(VARIANTS)) {
    if (cfg.only && !cfg.only.has(key)) continue;
    let out = base;
    const kinds = variant === 'legendary' ? ['epic', 'legendary'] : [variant];
    // le légendaire garde l'épique en dessous, mais remplace ses gemmes/runes : on injecte les deux jeux d'extras
    for (const [layer, v] of Object.entries(layersMap)) {
      const extra = kinds.map((k) => (k === 'epic' && variant === 'legendary' ? '' : v[k] ?? '')).join('');
      if (extra) out = inject(out, layer, extra);
    }
    const vid = `${id}_${variant}`;
    writeFileSync(join(root, slot, `${vid}.svg`), out.replace(/<!--[\s\S]*?-->/, (c) => c.replace(' -->', ` (${cfg.label}). -->`)));
    writeFileSync(join(root, slot, `${vid}.json`), JSON.stringify({ ...json, id: vid, name: `${json.name} (${cfg.label})` }, null, 2) + '\n');
  }
}
console.log('variantes écrites');

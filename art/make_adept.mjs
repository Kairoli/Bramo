// Génère le jeu de base « Robe » du Runiste (tissu, capuchon, jupe longue, broderies runiques).
// Usage : node art/make_adept.mjs
import { cloth, edge, fill, glint, layer, leather, light, line, rivets, shade, trim, write } from './draw.mjs';

const COAT = 'var(--c-coat)';
const DARK = 'var(--c-coat-dark)';

/** Petite broderie runique : trois traits angulaires dans la couleur d'affinité. */
const rune = (x, y, s = 1, op = 0.8) =>
  line(`M${x} ${y} L${x + 4 * s} ${y - 8 * s} L${x + 8 * s} ${y} M${x + 2 * s} ${y - 4 * s} L${x + 7 * s} ${y - 4 * s}`, 'var(--c-glow)', 1.5, { 'stroke-opacity': op });

// --- Capuchon de novice : tissu souple, rune brodée au front ---
write('headwear', 'adept_cowl', 'Capuchon d\'adepte', ['coat', 'coatDark', 'trim', 'glow'],
  [{ id: 'back', bone: 'head', z: 52 }, { id: 'front', bone: 'head', z: 78 }],
  'Capuchon d\'adepte : tissu souple, rabat sur la nuque, galon, rune brodée sur le front. Le visage reste dégagé.',
  layer('back',
    cloth('M184 98 Q162 134 168 176 L208 176 L206 120 Z', DARK),
    shade('M184 134 Q172 158 176 174 L196 176 Z', 0.25),
    line('M180 140 Q186 160 184 174', '#000', 1.2, { 'stroke-opacity': 0.3 }),
  ) +
  layer('front',
    cloth('M176 116 Q166 62 212 48 Q256 52 258 94 Q259 93 251 93 Q228 82 204 92 Q196 110 199 146 Q188 154 180 142 Z', COAT),
    // plis du tissu
    shade('M176 116 Q166 62 212 48 L206 100 L199 146 Q188 154 180 142 Z', 0.22),
    line('M196 62 Q200 90 198 118 M226 54 Q238 70 240 92', '#000', 1.6, { 'stroke-opacity': 0.25 }),
    glint('M184 104 Q188 74 210 58', 0.28, 1.8),
    // galon de bordure et ombre sur le front
    shade('M200 92 Q226 82 252 94 L252 100 Q226 91 204 102 Z', 0.3),
    trim('M176 116 Q166 62 212 48', 2),
    trim('M199 146 Q196 110 204 92 Q228 82 251 93', 2.2),
    // rune au front
    rune(222, 72, 1.2, 0.9),
    line('M214 78 Q230 74 246 80', 'var(--c-trim)', 1.2, { 'stroke-opacity': 0.7 }),
    line('M230 50 Q250 60 258 92', 'var(--c-glow)', 1.8, { 'stroke-opacity': 0.5 }),
  ));

// --- Tunique : large, brodée au col et aux poignets, manches évasées ---
write('top', 'adept_tunic', 'Tunique d\'adepte', ['coat', 'coatDark', 'under', 'trim', 'glow'],
  [
    { id: 'sleeve_far_upper', bone: 'upperarm_far', z: 24 },
    { id: 'sleeve_far_lower', bone: 'forearm_far', z: 25 },
    { id: 'torso', bone: 'torso', z: 36 },
    { id: 'under', bone: 'torso', z: 38 },
    { id: 'sleeve_near_upper', bone: 'upperarm_near', z: 66 },
    { id: 'sleeve_near_lower', bone: 'forearm_near', z: 67 },
  ],
  'Tunique d\'adepte : tissu ample, plis, col et poignets brodés de runes, manches évasées.',
  layer('sleeve_far_upper',
    cloth('M240 182 L280 177 L308 282 L272 298 Z', COAT),
    fill('M240 182 L280 177 L308 282 L272 298 Z', 'url(#rig-light)'),
    shade('M240 182 L256 180 L280 290 L272 298 Z', 0.18),
    line('M258 214 Q276 230 284 262 M268 200 Q290 236 296 268', '#000', 1.5, { 'stroke-opacity': 0.22 }),
    trim('M280 177 L308 282', 1.8),
  ) +
  layer('sleeve_far_lower',
    cloth('M274 292 L304 278 L346 236 L324 220 Z', DARK),
    shade('M274 292 L304 278 L346 236 L335 228 Z', 0.15),
    fill('M320 218 L350 238 L342 250 L314 230 Z', 'var(--c-trim)'),
    rune(322, 240, 0.7, 0.85),
    line('M280 286 L310 272 M290 274 L318 254', '#000', 1.3, { 'stroke-opacity': 0.25 }),
  ) +
  layer('torso',
    cloth('M156 172 Q200 156 250 166 Q262 214 256 304 Q206 320 158 304 Q148 240 156 172 Z', COAT),
    fill('M156 172 Q200 156 250 166 Q262 214 256 304 Q206 320 158 304 Q148 240 156 172 Z', 'url(#rig-light)'),
    shade('M156 172 Q148 240 158 304 L180 308 Q170 240 184 168 Z', 0.28),
    // plis verticaux
    line('M186 190 Q182 250 190 308 M206 186 Q204 250 208 314 M230 190 Q234 250 236 310', '#000', 1.6, { 'stroke-opacity': 0.2 }),
    line('M192 190 Q188 250 196 308 M212 186 Q210 250 214 314', '#F1F0EC', 1.2, { 'stroke-opacity': 0.08 }),
    // empiècement d'épaule et broderie de poitrine
    trim('M158 176 Q200 160 248 170', 2.2),
    fill('M170 200 Q200 214 236 202 L232 214 Q200 228 172 214 Z', 'var(--c-trim)', { opacity: 0.35 }),
    rune(180, 232, 1.1, 0.7),
    rune(206, 244, 1.1, 0.7),
    rune(232, 232, 1.1, 0.7),
    line('M250 168 Q262 214 256 304', 'var(--c-glow)', 2, { 'stroke-opacity': 0.5 }),
  ) +
  layer('under',
    // col boutonné
    cloth('M204 154 L236 156 L226 240 L216 252 L208 238 Z', 'var(--c-under)'),
    line('M219 160 L217 248', '#000', 1.4, { 'stroke-opacity': 0.3 }),
    trim('M204 154 L216 252 L236 156', 1.8),
    rivets([[218, 180], [218, 204], [218, 228]], 1.6, 'var(--c-trim)', 0.9),
  ) +
  layer('sleeve_near_upper',
    cloth('M142 178 L180 188 L172 302 L136 296 Z', COAT),
    shade('M142 178 L180 188 L172 302 L136 296 Z', 0.18),
    line('M150 210 Q158 250 156 292 M166 200 Q168 250 164 296', '#000', 1.6, { 'stroke-opacity': 0.22 }),
    trim('M142 178 L136 296', 1.8),
  ) +
  layer('sleeve_near_lower',
    cloth('M138 288 L170 294 L156 368 L128 364 Z', DARK),
    shade('M138 288 L170 294 L156 368 L128 364 Z', 0.15),
    fill('M126 358 L158 362 L156 376 L124 372 Z', 'var(--c-trim)'),
    rune(132, 372, 0.7, 0.85),
    line('M142 300 L136 350', '#000', 1.3, { 'stroke-opacity': 0.25 }),
  ));

// --- Jupe longue (os de tissu) : plis, ourlet brodé, fentes ---
write('robe', 'adept_skirt', 'Jupe d\'adepte', ['coat', 'coatDark', 'trim', 'glow'],
  [
    { id: 'back', bone: 'cloth_back', z: 10 },
    { id: 'flap_far', bone: 'cloth_far', z: 30 },
    { id: 'flap_near', bone: 'cloth_near', z: 32 },
  ],
  'Jupe d\'adepte : longs plis de tissu, ourlet galonné brodé de runes, fente de marche.',
  layer('back',
    cloth('M150 316 L258 316 L312 636 Q206 656 100 636 Z', DARK),
    line('M170 330 L140 630 M206 330 L204 642 M242 330 L272 630', '#000', 2, { 'stroke-opacity': 0.25 }),
    trim('M100 636 Q206 656 312 636', 2.4),
  ) +
  layer('flap_far',
    cloth('M250 298 L210 310 L234 624 Q284 640 326 614 Q296 450 250 298 Z', COAT),
    fill('M250 298 L210 310 L234 624 Q284 640 326 614 Q296 450 250 298 Z', 'url(#rig-light)'),
    line('M240 330 L248 618 M262 340 L284 620 M276 400 L308 612', '#000', 1.8, { 'stroke-opacity': 0.22 }),
    line('M246 330 L254 618 M268 340 L290 618', '#F1F0EC', 1.2, { 'stroke-opacity': 0.08 }),
    trim('M234 624 Q284 640 326 614', 2.6),
    line('M326 612 Q296 450 252 304', 'var(--c-glow)', 1.8, { 'stroke-opacity': 0.55 }),
    rune(246, 598, 1.1, 0.85), rune(276, 604, 1.1, 0.85), rune(304, 594, 1.1, 0.85),
  ) +
  layer('flap_near',
    cloth('M160 298 L202 310 L182 628 Q140 636 98 618 Q120 450 160 298 Z', COAT),
    fill('M160 298 L202 310 L182 628 Q140 636 98 618 Q120 450 160 298 Z', 'url(#rig-shade)'),
    line('M172 330 L130 612 M186 336 L160 622 M146 380 L112 604', '#000', 1.8, { 'stroke-opacity': 0.24 }),
    trim('M202 310 L182 628 Q140 636 98 618', 2.6),
    line('M196 330 L180 620', '#000', 2, { 'stroke-opacity': 0.3 }),
    rune(112, 596, 1.1, 0.85), rune(140, 606, 1.1, 0.85), rune(164, 608, 1.1, 0.85),
  ));

// --- Cordon à sceaux ---
write('belt', 'adept_sash', 'Cordon d\'adepte', ['leather', 'metal', 'trim', 'stone'],
  [{ id: 'belt', bone: 'pelvis', z: 40 }, { id: 'stones', bone: 'pelvis', z: 41, detail: 2 }],
  'Cordon d\'adepte : large ceinture de tissu nouée, sceaux de pierre qui pendent.',
  layer('belt',
    cloth('M152 292 Q206 306 260 292 L260 316 Q206 330 152 316 Z', 'var(--c-under)'),
    line('M154 300 Q206 314 258 300', '#000', 1.2, { 'stroke-opacity': 0.25 }),
    trim('M152 292 Q206 306 260 292', 1.6),
    // nœud
    cloth('M200 296 L226 298 L222 322 L204 320 Z', DARK),
    shade('M200 296 L226 298 L222 322 L204 320 Z', 0.15),
    fill('M208 304 L218 305 L216 316 L209 315 Z', 'var(--c-trim)'),
  ) +
  layer('stones',
    line('M232 318 L240 372 M246 316 L254 366', 'var(--c-leather)', 2.2),
    `<rect x="233" y="366" width="14" height="18" rx="3" fill="var(--c-stone)"/><rect x="233" y="366" width="14" height="18" rx="3" fill="url(#rig-sheen)"/>`,
    rune(236, 380, 0.8, 0.9),
    `<rect x="248" y="360" width="12" height="16" rx="3" fill="var(--c-stone)"/><rect x="248" y="360" width="12" height="16" rx="3" fill="url(#rig-sheen)"/>`,
    rune(250, 373, 0.7, 0.9),
  ));

// --- Bandes de poignet ---
write('gloves', 'adept_wraps', 'Bandes d\'adepte', ['leather', 'trim'],
  [{ id: 'far', bone: 'hand_far', z: 28 }, { id: 'near', bone: 'hand_near', z: 71 }],
  'Bandes d\'adepte : bandes de tissu enroulées au poignet, nœud et rune.',
  layer('far',
    cloth('M310 236 L325 220 L350 243 L335 260 Z', 'var(--c-under)'),
    line('M316 242 L331 227 M322 249 L337 234', '#000', 1.2, { 'stroke-opacity': 0.3 }),
    rune(322, 246, 0.6, 0.9),
  ) +
  layer('near',
    cloth('M124 350 L160 355 L158 378 L121 372 Z', 'var(--c-under)'),
    line('M126 358 L158 363 M125 366 L157 371', '#000', 1.2, { 'stroke-opacity': 0.3 }),
    cloth('M126 371 Q120 388 130 396 L152 395 Q159 385 156 371 Z', 'var(--c-under)'),
    line('M128 380 L154 379 M129 388 L153 387', '#000', 1.2, { 'stroke-opacity': 0.3 }),
    rune(133, 375, 0.6, 0.9),
  ));

// --- Chaussons de feutre ---
write('boots', 'adept_shoes', 'Chaussons d\'adepte', ['boots', 'trim'],
  [{ id: 'far', bone: 'shin_far', z: 18 }, { id: 'near', bone: 'shin_near', z: 23 }],
  'Chaussons d\'adepte : feutre souple, bout relevé, bord galonné.',
  layer('far',
    cloth('M218 644 L254 644 L258 664 L286 676 Q254 692 214 688 L218 664 Z', 'var(--c-boots)'),
    trim('M218 644 L254 644', 2),
    line('M214 688 Q254 694 286 676', '#16130F', 4.5),
  ) +
  layer('near',
    cloth('M161 646 L199 646 L201 664 L232 680 Q194 698 156 692 L160 666 Z', 'var(--c-boots)'),
    shade('M161 646 L171 646 L166 670 L160 666 Z', 0.2),
    trim('M161 646 L199 646', 2),
    line('M156 692 Q194 700 232 680', '#16130F', 4.5),
  ));

// --- Mantelet : grand col de tissu sur les épaules, fermoir à gemme ---
write('cape', 'adept_mantle', 'Mantelet d\'adepte', ['mantle', 'trim', 'metal', 'glow'],
  [{ id: 'front', bone: 'cape', z: 74 }],
  'Mantelet d\'adepte : demi-cape de tissu sur les épaules, bord galonné, fermoir à gemme.',
  layer('front',
    cloth('M236 148 Q254 160 250 190 L226 238 L208 268 L184 300 L160 326 L146 302 L134 264 Q122 212 138 172 Q158 150 188 146 Z', 'var(--c-mantle)'),
    shade('M138 172 Q122 212 134 264 L146 302 Q150 230 170 170 Z', 0.28),
    line('M146 200 Q172 184 208 190 M150 238 Q172 226 198 232 M160 280 Q178 268 200 272', '#000', 1.8, { 'stroke-opacity': 0.24 }),
    trim('M250 190 L226 238 L208 268 L184 300 L160 326 L146 302 L134 264', 3),
    `<circle cx="224" cy="170" r="8" fill="var(--c-metal)"/><circle cx="224" cy="170" r="8" fill="url(#rig-sheen)"/><circle cx="224" cy="170" r="3.5" fill="var(--c-glow)" class="fx-pulse"/>`,
  ));
console.log('Robe d\'adepte écrite');

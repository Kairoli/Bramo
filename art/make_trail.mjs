// Génère le jeu de base « Tenue de piste » du Traqueur (cuir léger, capuche, brassards, bottes souples).
// Usage : node art/make_trail.mjs
import { cloth, edge, fill, glint, layer, leather, light, line, rivets, shade, trim, write } from './draw.mjs';

const COAT = 'var(--c-coat)';
const DARK = 'var(--c-coat-dark)';
const LEATHER = 'var(--c-leather)';

// --- Capuche à bec, rabattue sur le front, queue qui pend dans le dos ---
write('headwear', 'trail_hood', 'Capuche de piste', ['coat', 'coatDark', 'leather', 'trim', 'beard'],
  [{ id: 'back', bone: 'head', z: 52 }, { id: 'front', bone: 'head', z: 78 }],
  'Capuche de piste : calotte de tissu, bord rabattu, bec pointu, queue dans le dos, plume à la ganse. Le visage reste dégagé.',
  layer('back',
    cloth('M184 100 Q166 130 172 168 L206 170 L204 120 Z', DARK),
    shade('M184 130 Q176 150 180 166 L196 168 Z', 0.25),
  ) +
  layer('front',
    cloth('M178 114 Q168 64 212 50 Q254 52 256 92 Q258 90 250 91 Q228 79 204 90 Q196 108 199 142 Q190 150 182 140 Z', COAT),
    // bec pointu qui retombe
    cloth('M212 50 Q236 26 270 38 Q250 48 246 74 Q228 60 212 62 Z', COAT),
    line('M214 56 Q236 36 262 40', 'var(--c-trim)', 1.6, { 'stroke-opacity': 0.8 }),
    // ombre du bord sur le front
    shade('M200 90 Q226 79 252 91 L252 97 Q226 88 204 99 Z', 0.3),
    // ganse de cuir et plume
    leather('M182 92 Q214 80 254 88 L254 95 Q214 88 184 100 Z'),
    trim('M182 92 Q214 80 254 88', 1.6),
    fill('M214 84 Q206 62 224 44 Q222 66 230 84 Z', 'var(--c-beard)'),
    line('M222 82 Q216 66 224 48', '#F1F0EC', 1, { 'stroke-opacity': 0.4 }),
    // coutures et plis
    line('M186 112 Q190 84 206 66 M232 58 Q246 68 250 88', '#000', 1.3, { 'stroke-opacity': 0.3, 'stroke-dasharray': '3 3' }),
    glint('M186 108 Q190 76 212 58', 0.3, 1.8),
    line('M232 56 Q250 66 256 90', 'var(--c-glow)', 1.8, { 'stroke-opacity': 0.5 }),
  ));

// --- Pourpoint de cuir sur chemise, sangle de carquois, lacets, brassards ---
write('top', 'trail_jerkin', 'Pourpoint de piste', ['coat', 'coatDark', 'under', 'leather', 'trim'],
  [
    { id: 'quiver', bone: 'torso', z: 30 },
    { id: 'sleeve_far_upper', bone: 'upperarm_far', z: 24 },
    { id: 'forearm_far', bone: 'forearm_far', z: 25 },
    { id: 'torso', bone: 'torso', z: 36 },
    { id: 'under', bone: 'torso', z: 38 },
    { id: 'sleeve_near_upper', bone: 'upperarm_near', z: 66 },
    { id: 'forearm_near', bone: 'forearm_near', z: 67 },
  ],
  'Pourpoint de piste : gilet de cuir lacé sur chemise, bandoulière, poches, brassards lacés, carquois dans le dos.',
  layer('quiver',
    leather('M176 178 L196 170 L214 168 L212 262 L184 266 Z', 'var(--c-wood)'),
    line('M184 178 L204 172 M184 200 L206 196 M184 222 L206 220', '#000', 1.2, { 'stroke-opacity': 0.3 }),
    fill('M186 150 L190 172 M198 146 L201 170 M208 148 L210 168', 'none', {}),
    line('M188 170 L184 140 M199 170 L198 136 M210 168 L214 140', 'var(--c-wood-light)', 2.4),
    fill('M180 140 L188 132 L190 144 Z', 'var(--c-trim)'),
    fill('M193 132 L201 124 L203 136 Z', 'var(--c-trim)'),
    fill('M209 136 L217 128 L219 140 Z', 'var(--c-trim)'),
  ) +
  layer('sleeve_far_upper',
    cloth('M240 182 L280 175 L306 276 L272 292 Z', 'var(--c-under)'),
    shade('M240 182 L256 180 L280 280 L272 292 Z', 0.2),
    line('M262 220 L292 214 M266 250 L296 244', '#000', 1.3, { 'stroke-opacity': 0.25 }),
    leather('M268 274 L306 260 L312 282 L276 298 Z'),
    rivets([[280, 284], [300, 270]], 1.5),
  ) +
  layer('forearm_far',
    cloth('M278 292 L306 280 L343 240 L325 225 Z', 'var(--c-under)'),
    leather('M290 284 L316 270 L338 246 L326 232 L304 254 L284 270 Z'),
    line('M296 282 L318 266 M304 272 L324 254 M312 262 L331 242', 'var(--c-trim)', 1.2, { 'stroke-opacity': 0.8 }),
    shade('M278 292 L306 280 L343 240 L325 225 Z', 0.08),
  ) +
  layer('torso',
    // chemise visible aux flancs, gilet de cuir
    cloth('M148 180 Q144 250 152 312 L260 316 Q270 250 266 172 Z', 'var(--c-under)'),
    leather('M154 176 Q200 158 252 168 Q264 216 256 304 Q206 320 158 304 Q148 240 154 176 Z', COAT),
    fill('M154 176 Q200 158 252 168 Q264 216 256 304 Q206 320 158 304 Q148 240 154 176 Z', 'url(#rig-light)'),
    // épaulettes cousues, dos du gilet
    line('M160 180 Q200 164 248 172', '#000', 1.2, { 'stroke-opacity': 0.3, 'stroke-dasharray': '3 3' }),
    // ouverture lacée devant (côté droit)
    leather('M222 174 L246 170 L252 296 L232 300 Z', DARK),
    line('M228 186 L246 192 M228 204 L248 210 M229 222 L249 228 M230 240 L250 246 M231 258 L251 264 M232 276 L252 282', LEATHER, 1.8),
    line('M240 176 L242 296', 'var(--c-trim)', 1.2, { 'stroke-opacity': 0.7 }),
    // bandoulière en biais, poches
    leather('M158 184 L174 178 L256 282 L238 292 Z', LEATHER),
    rivets([[176, 190], [206, 224], [236, 262]], 1.6, 'var(--c-trim)', 0.9),
    leather('M166 252 L196 258 L194 288 L164 282 Z', DARK),
    line('M166 262 L195 267', '#000', 1.2, { 'stroke-opacity': 0.3 }),
    rivets([[170, 258], [192, 262]], 1.4),
    line('M254 168 Q266 216 256 304', 'var(--c-glow)', 2, { 'stroke-opacity': 0.5 }),
    // coutures du bas
    line('M160 298 Q206 312 254 298', '#000', 1.2, { 'stroke-opacity': 0.3, 'stroke-dasharray': '3 3' }),
  ) +
  layer('under',
    // foulard noué
    cloth('M196 152 Q216 144 240 154 L244 170 Q216 184 192 168 Z', 'var(--c-under)'),
    fill('M208 168 L226 168 L220 196 Z', 'var(--c-trim)', { opacity: 0.9 }),
    shade('M208 168 L226 168 L222 180 L212 180 Z', 0.2),
    line('M196 160 Q216 170 240 160', '#000', 1.2, { 'stroke-opacity': 0.3 }),
  ) +
  layer('sleeve_near_upper',
    cloth('M148 176 Q166 170 184 186 L176 282 L136 278 L138 196 Q140 182 148 176 Z', 'var(--c-under)'),
    shade('M148 176 L170 172 L184 186 L176 282 L160 280 Z', 0.12),
    line('M142 220 L174 226 M142 250 L173 256', '#000', 1.3, { 'stroke-opacity': 0.25 }),
    leather('M146 178 Q162 172 180 184 L176 214 Q158 204 144 210 Z', COAT),
    rivets([[160, 184], [170, 192]], 1.5, 'var(--c-trim)', 0.9),
    leather('M133 270 L178 278 L177 298 L131 292 Z'),
    line('M136 276 L176 284', 'var(--c-trim)', 1.2, { 'stroke-opacity': 0.8 }),
  ) +
  layer('forearm_near',
    cloth('M136 288 L170 294 L158 370 L127 366 Z', 'var(--c-under)'),
    leather('M133 304 L168 310 L160 360 L130 354 Z'),
    line('M136 312 L162 318 M135 324 L161 330 M134 336 L159 342 M133 348 L158 354', 'var(--c-trim)', 1.2, { 'stroke-opacity': 0.8 }),
    rivets([[140, 308], [164, 314]], 1.4),
  ));

// --- Gants sans doigts ---
write('gloves', 'trail_gloves', 'Mitaines de piste', ['leather', 'trim'],
  [{ id: 'far', bone: 'hand_far', z: 28 }, { id: 'near', bone: 'hand_near', z: 71 }],
  'Mitaines de piste : manchette de cuir lacée, dos de main renforcé.',
  layer('far',
    leather('M309 236 L325 220 L351 243 L335 261 Z'),
    line('M316 242 L330 227 M324 250 L338 235', 'var(--c-trim)', 1.2, { 'stroke-opacity': 0.8 }),
    rivets([[337, 246]], 1.5),
  ) +
  layer('near',
    leather('M124 350 L160 355 L158 378 L121 372 Z'),
    line('M126 360 L158 365 M125 368 L157 373', 'var(--c-trim)', 1.2, { 'stroke-opacity': 0.8 }),
    leather('M126 371 Q120 388 130 398 L152 397 Q160 386 156 371 Z', DARK),
    line('M128 380 L154 379 M128 388 L153 387', '#000', 1.3, { 'stroke-opacity': 0.35 }),
    rivets([[141, 365], [135, 378]], 1.4),
  ));

// --- Pantalon de cuir : genouillères cousues, cuisse sanglée, lacets de côté ---
write('legs', 'trail_trousers', 'Pantalon de piste', ['coat', 'coatDark', 'leather', 'trim'],
  [
    { id: 'thigh_far', bone: 'thigh_far', z: 16 },
    { id: 'shin_far', bone: 'shin_far', z: 17 },
    { id: 'thigh_near', bone: 'thigh_near', z: 21 },
    { id: 'shin_near', bone: 'shin_near', z: 22 },
  ],
  'Pantalon de piste : cuir souple, genouillères cousues, sangle de cuisse, lacets de côté.',
  layer('thigh_far',
    cloth('M208 330 L250 330 L254 562 L216 562 Z', DARK),
    shade('M208 330 L250 330 L254 562 L216 562 Z', 0.2),
    leather('M209 410 L252 408 L252 422 L210 424 Z'),
    line('M212 336 L216 556', '#000', 1.2, { 'stroke-opacity': 0.25, 'stroke-dasharray': '3 3' }),
  ) +
  layer('shin_far',
    cloth('M214 552 L258 552 L260 612 L220 612 Z', DARK),
    leather('M212 548 Q234 536 258 548 L256 580 Q234 590 214 580 Z'),
    rivets([[222, 556], [248, 556]], 1.5),
  ) +
  layer('thigh_near',
    cloth('M154 332 L210 332 L204 564 L162 564 Z', COAT),
    shade('M154 332 L172 332 L170 564 L162 564 Z', 0.24),
    fill('M154 332 L210 332 L204 564 L162 564 Z', 'url(#rig-light)'),
    leather('M154 408 L209 406 L208 422 L156 424 Z'),
    rivets([[162, 414], [200, 412]], 1.5, 'var(--c-trim)', 0.9),
    line('M200 338 L196 556', LEATHER, 1.6, { 'stroke-dasharray': '4 3' }),
    line('M160 338 L166 556', '#000', 1.2, { 'stroke-opacity': 0.22 }),
  ) +
  layer('shin_near',
    // genouillère de cuir cousue
    leather('M152 546 Q180 530 210 546 L206 584 Q180 596 156 584 Z', LEATHER),
    line('M158 552 Q180 540 204 552', '#000', 1.2, { 'stroke-opacity': 0.3, 'stroke-dasharray': '3 3' }),
    rivets([[166, 560], [194, 560]], 1.5, 'var(--c-trim)', 0.9),
    cloth('M158 584 L208 586 L204 650 L164 648 Z', COAT),
    shade('M158 584 L170 584 L168 650 L164 648 Z', 0.2),
  ));

// --- Bottes souples : tige à revers, lacets, semelle ---
write('boots', 'trail_boots', 'Bottes de piste', ['leather', 'coatDark', 'trim'],
  [{ id: 'far', bone: 'shin_far', z: 18 }, { id: 'near', bone: 'shin_near', z: 23 }],
  'Bottes de piste : cuir souple, revers de tige, lacets, semelle épaisse.',
  layer('far',
    leather('M217 612 L258 612 L262 660 L292 676 Q258 694 212 690 L216 664 Z'),
    leather('M215 610 L260 610 L260 626 L216 628 Z', DARK),
    line('M222 636 L254 640 M222 644 L254 648', 'var(--c-trim)', 1.2, { 'stroke-opacity': 0.8 }),
    line('M214 690 Q258 696 292 676', '#16130F', 5),
  ) +
  layer('near',
    leather('M158 614 L204 614 L206 660 L240 680 Q198 700 152 694 L156 664 Z'),
    leather('M156 612 L206 612 L206 628 L157 630 Z', DARK),
    line('M164 638 L198 642 M164 646 L198 650', 'var(--c-trim)', 1.2, { 'stroke-opacity': 0.8 }),
    shade('M156 664 Q198 672 236 682 L240 680 L206 660 Z', 0.15),
    line('M152 694 Q198 702 240 680', '#16130F', 5),
  ));

// --- Ceinture : sangle, bourses, fourreau de couteau ---
write('belt', 'trail_belt', 'Ceinture de piste', ['leather', 'metal', 'trim'],
  [{ id: 'belt', bone: 'pelvis', z: 40 }, { id: 'pouches', bone: 'pelvis', z: 41, detail: 2 }],
  'Ceinture de piste : sangle large, boucle ronde, bourses et fourreau de couteau.',
  layer('belt',
    leather('M150 290 Q206 304 262 290 L262 316 Q206 330 150 316 Z'),
    line('M152 298 Q206 312 260 298', '#000', 1.2, { 'stroke-opacity': 0.3, 'stroke-dasharray': '3 3' }),
    `<circle cx="214" cy="306" r="10" fill="var(--c-metal)"/><circle cx="214" cy="306" r="10" fill="url(#rig-sheen)"/><circle cx="214" cy="306" r="5" fill="none" stroke="#000" stroke-opacity=".4" stroke-width="1.5"/>`,
  ) +
  layer('pouches',
    leather('M156 314 L184 318 L182 352 Q168 358 156 350 Z', DARK),
    line('M156 326 L183 330', '#000', 1.2, { 'stroke-opacity': 0.3 }),
    rivets([[170, 330]], 1.6, 'var(--c-trim)', 0.9),
    leather('M234 316 L246 316 L250 372 L238 374 Z', LEATHER),
    fill('M233 312 L247 312 L248 320 L234 320 Z', 'var(--c-metal)'),
    leather('M190 318 L208 322 L204 344 L188 340 Z', DARK),
  ));

// --- Cape courte déchiquetée, attachée à la capuche ---
write('cape', 'trail_cloak', 'Cape de piste', ['mantle', 'leather', 'trim'],
  [{ id: 'back', bone: 'cape', z: 6 }, { id: 'front', bone: 'cape', z: 74, detail: 2 }],
  'Cape de piste : tissu épais déchiqueté, plis, lanière de cuir à l\'épaule.',
  layer('back',
    cloth('M166 160 Q146 230 138 330 L150 318 L156 350 L170 328 L182 360 L196 334 L210 362 L224 336 L238 352 L246 320 L248 168 Z', 'var(--c-mantle)'),
    shade('M166 160 Q146 230 138 330 L150 318 L156 350 Q150 270 184 190 Z', 0.28),
    line('M178 210 Q170 280 166 340 M208 196 Q204 280 208 350 M232 220 Q230 290 236 340', '#000', 1.8, { 'stroke-opacity': 0.24 }),
    line('M138 330 L150 318 L156 350 L170 328 L182 360 L196 334 L210 362 L224 336 L238 352 L246 320', 'var(--c-trim)', 1.2, { 'stroke-opacity': 0.55 }),
  ) +
  layer('front',
    leather('M170 164 L246 174 L246 182 L170 172 Z'),
    `<circle cx="178" cy="170" r="5" fill="var(--c-metal)"/><circle cx="178" cy="170" r="2" fill="var(--c-trim)"/>`,
    rivets([[200, 172], [224, 176]], 1.4),
  ));

// --- Épaulière de cuir ---
write('shoulder_near', 'trail_mantlet', 'Épaulette de piste', ['leather', 'trim'],
  [{ id: 'pad', bone: 'upperarm_near', z: 75 }],
  'Épaulette de piste : deux lames de cuir cousues.',
  layer('pad',
    leather('M132 194 Q142 162 178 164 Q194 176 188 204 Q160 192 136 208 Z'),
    leather('M134 208 Q162 194 190 206 L186 230 Q160 216 140 230 Z', LEATHER),
    line('M140 196 Q150 174 174 172 M142 214 Q162 204 184 212', '#000', 1.2, { 'stroke-opacity': 0.3, 'stroke-dasharray': '3 3' }),
    trim('M132 194 Q142 162 178 164', 1.8),
    rivets([[156, 182], [168, 178], [158, 218]], 1.5, 'var(--c-trim)', 0.9),
  ));
console.log('Tenue de piste écrite');

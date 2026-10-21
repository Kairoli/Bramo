// Génère les pièces de la famille « Armure » du Forgefeu (deuxième passe : plus de volume, de matières et de détails).
// À lancer avant make_plate_variants.mjs :  node art/make_plate.mjs && node art/make_plate_variants.mjs
import { cloth, edge, fill, glint, layer, leather, light, line, mail, plate, rivets, shade, trim, write } from './draw.mjs';

// --- Heaume : calotte à crête, joue, nasal, camail ---
write('headwear', 'plate_helm', 'Heaume de fantassin', ['metal', 'trim', 'coatDark'],
  [{ id: 'back', bone: 'head', z: 52 }, { id: 'front', bone: 'head', z: 60 }],
  'Heaume de fantassin : calotte à crête, joue articulée, nasal, camail de mailles. Le visage reste dégagé à droite.',
  layer('back',
    mail('M183 108 Q172 134 184 158 L206 154 L202 116 Z'),
    shade('M183 138 Q190 150 198 154 L206 154 L204 130 Z', 0.25),
  ) +
  layer('front',
    plate('M180 114 Q170 66 212 54 Q252 54 253 92 L251 99 Q228 90 204 102 L200 130 Q190 140 184 130 Z'),
    glint('M186 104 Q190 74 214 62', 0.5, 2),
    shade('M200 102 Q226 92 251 100 L251 106 Q226 99 204 110 Z', 0.35),
    plate('M184 104 L205 99 L207 144 Q197 154 188 147 Z', { color: 'var(--c-metal)' }),
    shade('M184 104 L205 99 L207 144 Q197 154 188 147 Z', 0.18),
    line('M190 112 L200 110 M190 122 L200 120 M191 132 L201 130', '#000', 1.3, { 'stroke-opacity': 0.35 }),
    plate('M196 60 Q222 46 248 66 L246 72 Q222 54 200 68 Z'),
    trim('M196 60 Q222 46 248 66', 2.4),
    trim('M182 98 Q214 86 251 93', 2.8),
    plate('M238 94 L244 94 L246 120 L240 120 Z', { color: 'var(--c-metal)' }),
    rivets([[194, 100], [212, 92], [230, 91], [196, 126], [200, 138]], 1.9),
    line('M228 60 Q246 68 252 90', 'var(--c-glow)', 1.8, { 'stroke-opacity': 0.5 }),
  ));

// --- Plastron : cuirasse bombée, lames de ventre, gorgerin, brassards articulés ---
const bandPaths = ['M153 252 Q206 270 262 252 L262 262 Q206 280 154 262 Z', 'M154 268 Q206 286 262 268 L261 278 Q206 296 155 278 Z', 'M155 284 Q206 302 261 284 L260 294 Q206 312 156 294 Z'];
write('top', 'plate_cuirass', 'Plastron de plates', ['metal', 'coatDark', 'trim', 'coat'],
  [
    { id: 'sleeve_far_upper', bone: 'upperarm_far', z: 24 },
    { id: 'forearm_far', bone: 'forearm_far', z: 25 },
    { id: 'torso', bone: 'torso', z: 36 },
    { id: 'under', bone: 'torso', z: 38 },
    { id: 'sleeve_near_upper', bone: 'upperarm_near', z: 66 },
    { id: 'forearm_near', bone: 'forearm_near', z: 67 },
  ],
  'Plastron de plates : cuirasse bombée à arête et pectoraux, lames de ventre, gorgerin, brassards articulés sur rembourrage.',
  layer('sleeve_far_upper',
    cloth('M240 182 L280 175 L306 276 L272 292 Z', 'var(--c-coat-dark)'),
    plate('M250 184 L284 180 L304 262 L276 276 Z'),
    glint('M254 188 L282 184', 0.4),
    shade('M262 232 L296 222 L300 244 L268 254 Z', 0.2),
    plate('M268 274 L306 260 L312 282 L276 298 Z'),
    trim('M268 274 L306 260', 2),
    rivets([[272, 196], [290, 190], [280, 284]], 1.8),
  ) +
  layer('forearm_far',
    leather('M278 292 L306 280 L343 240 L325 225 Z', 'var(--c-coat-dark)'),
    plate('M281 290 L305 281 L340 243 L327 230 Z'),
    shade('M296 276 L318 286 L312 298 L290 290 Z', 0.22),
    line('M288 284 L312 296 M300 272 L322 284 M312 258 L334 270', '#000', 1.5, { 'stroke-opacity': 0.35 }),
    trim('M280 292 L306 281 L342 241', 2),
    rivets([[292, 286], [320, 266]], 1.7),
  ) +
  layer('torso',
    // dessous de tissu aux flancs
    cloth('M146 184 Q144 250 152 312 L260 316 Q270 250 266 172 Z', 'var(--c-coat-dark)'),
    plate('M150 176 Q200 156 254 166 Q268 216 260 306 Q206 324 154 306 Q142 240 150 176 Z'),
    // pectoraux bombés
    shade('M156 206 Q184 222 214 214 L214 250 Q180 256 158 244 Z', 0.16),
    glint('M160 198 Q186 214 210 208', 0.42, 2),
    glint('M222 208 Q246 214 258 198', 0.3, 1.8),
    // arête centrale
    line('M214 168 Q224 242 218 318', '#000', 2.6, { 'stroke-opacity': 0.34 }),
    line('M217 168 Q227 242 221 318', '#F1F0EC', 1.4, { 'stroke-opacity': 0.26 }),
    // lames de ventre
    bandPaths.map((d) => plate(d, { edge: 0.42 })).join('\n    '),
    bandPaths.map((d) => shade(d, 0.1)).join('\n    '),
    trim('M150 176 Q200 156 254 166', 2.6),
    trim('M154 226 Q198 240 262 224', 2),
    // sangles de cuir
    leather('M150 214 L168 216 L166 232 L148 230 Z'),
    leather('M246 212 L262 210 L262 226 L246 228 Z'),
    rivets([[170, 194], [244, 194], [152, 304], [256, 304], [160, 240]], 2),
    line('M176 232 L188 244 M236 268 L246 280 M170 270 L178 280', '#000', 1.3, { 'stroke-opacity': 0.28 }),
    line('M254 166 Q268 216 260 306', 'var(--c-glow)', 2, { 'stroke-opacity': 0.5 }),
  ) +
  layer('under',
    // gorgerin : deux anneaux articulés
    plate('M190 150 Q212 140 240 152 L246 168 Q214 182 188 168 Z'),
    plate('M188 164 Q214 178 246 164 L248 176 Q214 192 187 177 Z', { edge: 0.45 }),
    trim('M190 160 Q214 172 244 160', 2),
    rivets([[200, 156], [226, 156]], 1.6),
  ) +
  layer('sleeve_near_upper',
    cloth('M148 176 Q166 170 184 186 L176 282 L136 278 L138 196 Q140 182 148 176 Z', 'var(--c-coat-dark)'),
    plate('M142 196 Q148 180 168 177 Q182 190 174 262 L141 258 Z'),
    shade('M142 226 L174 232 L173 262 L141 258 Z', 0.2),
    glint('M146 190 Q154 182 166 181', 0.42, 1.8),
    line('M144 226 L174 230', '#000', 1.5, { 'stroke-opacity': 0.35 }),
    plate('M132 268 L178 276 L177 298 L130 292 Z'),
    trim('M132 268 L178 276', 2),
    rivets([[150, 196], [166, 192], [150, 282]], 1.8),
  ) +
  layer('forearm_near',
    leather('M136 288 L170 294 L158 370 L127 366 Z', 'var(--c-coat-dark)'),
    plate('M134 292 L168 297 L157 368 L129 363 Z'),
    shade('M132 320 L164 326 L160 346 L131 340 Z', 0.2),
    line('M133 310 L166 316 M131 332 L162 338 M129 350 L160 356', '#000', 1.5, { 'stroke-opacity': 0.35 }),
    trim('M135 291 L169 296', 2),
    rivets([[144, 300], [160, 304], [146, 358]], 1.7),
  ));

// --- Gantelets : manchettes évasées, dos de main articulé côté proche ---
write('gloves', 'plate_gauntlets', 'Gantelets de plates', ['metal', 'trim', 'leather'],
  [{ id: 'far', bone: 'hand_far', z: 28 }, { id: 'near', bone: 'hand_near', z: 71 }],
  'Gantelets de plates : manchettes évasées, dos de main articulé côté proche, phalanges.',
  layer('far',
    plate('M308 236 L325 218 L352 243 L336 262 Z'),
    shade('M318 246 L334 262 L330 266 L314 250 Z', 0.2),
    trim('M308 236 L325 218', 2.6),
    line('M316 243 L331 227 M324 251 L340 235', '#000', 1.4, { 'stroke-opacity': 0.32 }),
    rivets([[338, 246], [330, 232]], 1.7),
  ) +
  layer('near',
    plate('M122 349 L161 355 L159 379 L119 372 Z'),
    trim('M122 349 L161 355', 2.6),
    shade('M120 366 L159 372 L159 379 L119 373 Z', 0.25),
    // dos de main : plaques articulées et phalanges
    leather('M126 371 Q120 388 130 399 L152 398 Q160 386 156 371 Z', 'var(--c-leather)'),
    plate('M126 372 Q121 386 129 392 L153 391 Q159 384 156 372 Z', { edge: 0.4 }),
    line('M127 380 L156 379 M127 386 L155 385 M129 392 L153 391', '#000', 1.4, { 'stroke-opacity': 0.4 }),
    plate('M128 394 Q130 402 138 402 L148 401 Q154 399 153 393 Z', { edge: 0.4 }),
    glint('M130 374 Q128 384 133 390', 0.4, 1.5),
    rivets([[140, 364], [133, 377], [149, 377]], 1.6),
  ));

// --- Jambières : cuissots, genouillères en éventail, grèves sanglées ---
write('legs', 'plate_greaves', 'Jambières de plates', ['metal', 'trim', 'leather'],
  [
    { id: 'thigh_far', bone: 'thigh_far', z: 16 },
    { id: 'shin_far', bone: 'shin_far', z: 17 },
    { id: 'thigh_near', bone: 'thigh_near', z: 21 },
    { id: 'shin_near', bone: 'shin_near', z: 22 },
  ],
  'Jambières de plates : cuissots bombés, genouillères en éventail, grèves à arête, sangles de cuir.',
  layer('thigh_far',
    plate('M206 330 L252 330 L256 562 L214 562 Z', { color: 'var(--c-metal)' }),
    shade('M206 330 L252 330 L256 562 L214 562 Z', 0.3),
    glint('M250 336 L254 552', 0.3, 1.6),
    line('M213 398 L249 396 M215 468 L251 466', '#000', 1.6, { 'stroke-opacity': 0.34 }),
    leather('M212 392 L250 390 L250 400 L212 402 Z'),
    rivets([[218, 340], [244, 340]], 1.8),
  ) +
  layer('shin_far',
    plate('M208 552 Q234 534 260 552 L258 578 Q234 590 210 578 Z'),
    plate('M212 578 L256 578 L260 646 L218 648 Z'),
    shade('M212 578 L256 578 L260 646 L218 648 Z', 0.3),
    line('M236 576 L238 642', '#000', 2, { 'stroke-opacity': 0.3 }),
    leather('M219 600 L252 600 L252 610 L220 611 Z'),
    trim('M218 574 L250 574', 2),
    rivets([[234, 556], [226, 626], [246, 626]], 1.7),
  ) +
  layer('thigh_near',
    plate('M150 332 L212 332 L206 566 L158 566 Z'),
    shade('M150 332 L170 332 L168 566 L158 566 Z', 0.24),
    glint('M172 338 L174 552', 0.4, 2),
    line('M160 404 L206 402 M163 476 L204 474', '#000', 1.6, { 'stroke-opacity': 0.34 }),
    leather('M160 398 L207 396 L207 408 L161 410 Z'),
    trim('M158 332 L208 332', 2.4),
    rivets([[166, 342], [200, 342], [170, 552], [198, 552]], 2),
  ) +
  layer('shin_near',
    // genouillère en éventail
    plate('M152 556 Q180 534 210 556 L207 584 Q180 598 156 584 Z'),
    fill('M162 562 Q180 550 202 562 L200 578 Q180 588 164 578 Z', 'url(#rig-sheen)'),
    trim('M152 556 Q180 534 210 556', 2.2),
    rivets([[182, 560]], 2.6, 'var(--c-trim)', 0.9),
    // grève à arête centrale
    plate('M156 586 L208 588 L200 660 L164 658 Z'),
    line('M183 584 L182 654', '#000', 2.2, { 'stroke-opacity': 0.3 }),
    line('M185 584 L184 654', '#F1F0EC', 1.2, { 'stroke-opacity': 0.3 }),
    leather('M158 610 L206 612 L205 622 L160 621 Z'),
    leather('M162 636 L202 638 L201 647 L163 646 Z'),
    trim('M156 586 L208 588', 2.2),
    rivets([[170, 590], [196, 592]], 1.7),
  ));

// --- Solerets : cheville articulée, lames sur le pied, bout pointu ---
write('boots', 'plate_sabatons', 'Solerets de plates', ['metal', 'trim', 'leather'],
  [{ id: 'far', bone: 'shin_far', z: 18 }, { id: 'near', bone: 'shin_near', z: 23 }],
  'Solerets : cheville articulée, empeigne à lames, bout pointu, talon.',
  layer('far',
    leather('M219 630 L254 630 L257 654 L220 656 Z'),
    plate('M221 640 L254 640 L258 662 L290 676 Q256 694 214 690 L218 664 Z'),
    shade('M221 640 L254 640 L258 662 L290 676 Q256 694 214 690 L218 664 Z', 0.28),
    line('M234 668 Q238 680 236 690 M248 666 Q254 678 252 690 M264 668 Q272 680 270 690', '#000', 1.6, { 'stroke-opacity': 0.4 }),
    trim('M221 640 L254 640', 2),
    line('M214 690 Q256 696 290 676', '#16130F', 5),
  ) +
  layer('near',
    leather('M162 632 L200 632 L202 658 L163 660 Z'),
    plate('M164 642 L201 642 L204 664 L238 682 Q196 702 154 696 L160 666 Z'),
    shade('M164 642 L176 642 L170 668 L160 666 Z', 0.2),
    fill('M170 670 Q190 662 214 672 L210 680 Q190 674 172 680 Z', 'url(#rig-sheen)'),
    line('M176 674 Q180 686 178 694 M191 670 Q196 684 194 696 M210 672 Q220 686 217 696', '#000', 1.7, { 'stroke-opacity': 0.42 }),
    trim('M164 642 L201 642', 2.2),
    rivets([[172, 650], [194, 650], [204, 676]], 1.8),
    line('M154 696 Q196 704 238 682', '#16130F', 5),
  ));

// --- Ceinturon : sangle large, boucle de plaque, tassettes en lames ---
write('belt', 'plate_girdle', 'Ceinturon d\'armes', ['leather', 'metal', 'trim'],
  [{ id: 'belt', bone: 'pelvis', z: 40 }, { id: 'tassets', bone: 'pelvis', z: 41, detail: 2 }],
  'Ceinturon d\'armes : sangle large cousue, boucle de plaque, tassettes en lames.',
  layer('belt',
    leather('M150 288 Q206 304 262 288 L262 318 Q206 334 150 318 Z'),
    line('M152 296 Q206 312 260 296 M152 311 Q206 327 260 311', '#000', 1.2, { 'stroke-opacity': 0.3, 'stroke-dasharray': '3 3' }),
    plate('M194 286 L230 288 L230 324 L194 322 Z'),
    plate('M201 294 L223 295 L223 316 L201 315 Z', { color: 'var(--c-trim)' }),
    shade('M201 294 L223 295 L223 316 L201 315 Z', 0.2),
    rivets([[160, 300], [250, 300], [196, 290], [228, 292]], 1.8),
  ) +
  layer('tassets',
    plate('M152 316 L198 324 L194 352 L150 342 Z'),
    plate('M150 340 L194 350 L190 378 L148 366 Z'),
    shade('M150 340 L194 350 L192 358 L149 348 Z', 0.25),
    plate('M148 364 L190 376 L186 408 L145 394 Z'),
    shade('M148 364 L190 376 L189 384 L147 372 Z', 0.25),
    plate('M228 324 L264 316 L270 342 L232 352 Z'),
    plate('M232 350 L270 340 L274 366 L236 378 Z'),
    shade('M232 350 L270 340 L271 348 L233 358 Z', 0.25),
    plate('M236 376 L274 364 L278 392 L240 406 Z'),
    shade('M236 376 L274 364 L275 372 L237 384 Z', 0.25),
    trim('M152 316 L198 324 M228 324 L264 316', 2),
    rivets([[160, 326], [186, 332], [240, 332], [258, 326]], 1.7),
  ));

// --- Tabard d'armes : grand manteau cousu, bord galonné, agrafe à chaînette ---
write('cape', 'battle_cloak', 'Tabard d\'armes', ['mantle', 'trim', 'metal'],
  [{ id: 'back', bone: 'cape', z: 8 }, { id: 'front', bone: 'cape', z: 74, detail: 2 }],
  'Tabard d\'armes : grand manteau dans le dos, plis, bord galonné, agrafe à chaînette sur le torse.',
  layer('back',
    cloth('M164 162 Q144 250 134 426 Q170 450 214 438 Q238 418 248 336 L248 168 Z', 'var(--c-mantle)'),
    shade('M164 162 Q144 250 134 426 Q148 432 160 432 Q160 300 188 190 Z', 0.28),
    line('M176 200 Q168 300 162 416 M206 190 Q202 300 206 428 M228 220 Q226 320 232 424', '#000', 2, { 'stroke-opacity': 0.24 }),
    line('M184 200 Q176 300 170 418 M214 190 Q210 300 214 430', '#F1F0EC', 1.4, { 'stroke-opacity': 0.1 }),
    trim('M134 426 Q170 450 214 438 Q238 418 248 336', 3),
    line('M142 414 Q172 436 212 426', 'var(--c-trim)', 1.4, { 'stroke-opacity': 0.6, 'stroke-dasharray': '4 3' }),
  ) +
  layer('front',
    line('M176 168 Q210 186 246 172', 'var(--c-metal)', 3.4, { 'stroke-dasharray': '6 3' }),
    plate('M170 160 L186 160 L186 176 L170 176 Z', { color: 'var(--c-metal)' }),
    plate('M238 162 L254 164 L254 180 L238 178 Z', { color: 'var(--c-metal)' }),
    rivets([[178, 168], [246, 171]], 2, 'var(--c-trim)', 0.9),
  ));

// --- Épaulière proche : trois lames bombées, bord galonné ---
write('shoulder_near', 'plate_pauldron_near', 'Épaulière de plates', ['metal', 'trim'],
  [{ id: 'pauldron', bone: 'upperarm_near', z: 75 }],
  'Épaulière proche : trois lames bombées qui se recouvrent, bord galonné, rivets.',
  layer('pauldron',
    plate('M128 192 Q138 156 178 160 Q194 174 190 202 Q160 190 134 208 Z'),
    glint('M134 190 Q144 168 172 166', 0.5, 2),
    plate('M130 206 Q160 192 192 204 Q192 222 185 230 Q160 216 136 228 Z', { edge: 0.45 }),
    shade('M130 206 Q160 192 192 204 L190 212 Q160 200 131 214 Z', 0.3),
    plate('M133 226 Q160 212 186 228 L182 244 Q160 232 139 244 Z', { edge: 0.45 }),
    shade('M133 226 Q160 212 186 228 L184 236 Q160 224 135 235 Z', 0.3),
    trim('M128 192 Q138 156 178 160', 2.4),
    rivets([[152, 178], [170, 172], [160, 220]], 1.9),
  ));
console.log('pièces de l\'Armure écrites');

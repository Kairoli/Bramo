// Génère les pièces de l'ensemble « Armure » (esquisse du 21 octobre) dans art/parts/. Les fichiers générés sont ensuite retouchables à la main.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), 'parts');
const svg = (comment, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 760">\n  <!-- ${comment} -->\n${body}</svg>\n`;
const write = (slot, id, name, roles, layers, comment, body) => {
  mkdirSync(join(root, slot), { recursive: true });
  writeFileSync(join(root, slot, `${id}.svg`), svg(comment, body));
  writeFileSync(join(root, slot, `${id}.json`), JSON.stringify({ id, slot, name, colorRoles: roles, anchor: [0, 0], layers }, null, 2) + '\n');
};

// --- Heaume ---
write('headwear', 'plate_helm', 'Heaume de fantassin', ['metal', 'trim'],
  [{ id: 'back', bone: 'head', z: 52 }, { id: 'front', bone: 'head', z: 60 }],
  'Heaume de fantassin : calotte à crête, jugulaire côté proche, nasal. Le visage reste dégagé à droite.',
  `  <g id="back">
    <path d="M184 104 Q176 128 188 150 L204 146 L200 112 Z" fill="var(--c-metal)"/>
    <path d="M184 104 Q176 128 188 150 L204 146 L200 112 Z" fill="#000" opacity=".4"/>
    <path d="M186 124 L202 126 M186 136 L202 138" stroke="#000" stroke-opacity=".35" stroke-width="1.5"/>
  </g>
  <g id="front">
    <path d="M181 112 Q176 70 212 58 Q248 58 250 92 L248 99 Q226 90 203 101 L199 128 Q190 134 185 128 Z" fill="var(--c-metal)"/>
    <path d="M181 112 Q176 70 212 58 Q248 58 250 92 L248 99 Q226 90 203 101 L199 128 Q190 134 185 128 Z" fill="url(#rig-light)"/>
    <path d="M181 112 Q176 70 212 58 L208 104 L199 128 Q190 134 185 128 Z" fill="url(#rig-shade)"/>
    <path d="M196 62 Q220 50 244 66" stroke="var(--c-trim)" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path d="M183 98 Q214 88 249 94" stroke="var(--c-trim)" stroke-width="2.4" fill="none"/>
    <path d="M239 94 L243 114" stroke="var(--c-metal)" stroke-width="5" stroke-linecap="round"/>
    <path d="M239 94 L243 114" stroke="#000" stroke-opacity=".3" stroke-width="1.4"/>
    <path d="M232 62 Q246 70 250 90" stroke="var(--c-glow)" stroke-opacity=".5" stroke-width="1.8" fill="none"/>
    <circle cx="196" cy="100" r="2" fill="#F1F0EC" opacity=".5"/>
    <circle cx="222" cy="92" r="2" fill="#F1F0EC" opacity=".5"/>
  </g>
`);

// --- Plastron et brassards ---
write('top', 'plate_cuirass', 'Plastron de plates', ['metal', 'coatDark', 'trim'],
  [
    { id: 'sleeve_far_upper', bone: 'upperarm_far', z: 24 },
    { id: 'forearm_far', bone: 'forearm_far', z: 25 },
    { id: 'torso', bone: 'torso', z: 36 },
    { id: 'under', bone: 'torso', z: 38 },
    { id: 'sleeve_near_upper', bone: 'upperarm_near', z: 66 },
    { id: 'forearm_near', bone: 'forearm_near', z: 67 },
  ],
  'Plastron de plates : cuirasse bombée à arête centrale, lames de ventre, brassards articulés, gorgerin.',
  `  <g id="sleeve_far_upper">
    <path d="M240 182 L278 175 L304 276 L272 290 Z" fill="var(--c-coat-dark)"/>
    <path d="M250 184 L282 180 L302 262 L276 274 Z" fill="var(--c-metal)"/>
    <path d="M250 184 L282 180 L302 262 L276 274 Z" fill="url(#rig-light)"/>
    <path d="M268 274 L304 260 L310 280 L276 296 Z" fill="var(--c-metal)"/>
    <path d="M268 274 L304 260" stroke="var(--c-trim)" stroke-width="2"/>
    <path d="M262 232 L292 224" stroke="#000" stroke-opacity=".3" stroke-width="1.6"/>
  </g>
  <g id="forearm_far">
    <path d="M278 292 L306 280 L343 240 L325 225 Z" fill="var(--c-metal)"/>
    <path d="M278 292 L306 280 L343 240 L325 225 Z" fill="url(#rig-light)"/>
    <path d="M288 284 L312 296 M300 272 L322 284 M312 258 L334 270" stroke="#000" stroke-opacity=".3" stroke-width="1.6" fill="none"/>
    <path d="M278 292 L306 280 L343 240" stroke="var(--c-trim)" stroke-width="2" fill="none"/>
  </g>
  <g id="torso">
    <path d="M150 176 Q200 156 254 166 Q266 216 258 306 Q206 322 156 306 Q144 240 150 176 Z" fill="var(--c-metal)"/>
    <path d="M150 176 Q200 156 254 166 Q266 216 258 306 Q206 322 156 306 Q144 240 150 176 Z" fill="url(#rig-light)"/>
    <path d="M150 176 Q144 240 156 306 Q176 312 196 314 Q184 240 190 170 Z" fill="url(#rig-shade)"/>
    <path d="M214 168 Q222 240 216 316" stroke="#000" stroke-opacity=".32" stroke-width="2.4" fill="none"/>
    <path d="M216 168 Q224 240 218 316" stroke="#F1F0EC" stroke-opacity=".22" stroke-width="1.4" fill="none"/>
    <path d="M154 262 Q206 278 260 262 M155 280 Q206 296 259 280" stroke="#000" stroke-opacity=".34" stroke-width="2" fill="none"/>
    <path d="M154 226 Q198 240 262 224" stroke="var(--c-trim)" stroke-width="2.4" fill="none"/>
    <path d="M150 176 Q200 156 254 166" stroke="var(--c-trim)" stroke-width="2.6" fill="none"/>
    <path d="M254 166 Q266 216 258 306" stroke="var(--c-glow)" stroke-opacity=".5" stroke-width="2" fill="none"/>
    <circle cx="176" cy="238" r="2.2" fill="#F1F0EC" opacity=".5"/>
    <circle cx="240" cy="236" r="2.2" fill="#F1F0EC" opacity=".5"/>
  </g>
  <g id="under">
    <path d="M192 150 Q210 142 238 152 L246 176 Q214 190 188 176 Z" fill="var(--c-metal)"/>
    <path d="M192 150 Q210 142 238 152 L246 176 Q214 190 188 176 Z" fill="#000" opacity=".28"/>
    <path d="M190 164 Q214 176 244 164" stroke="var(--c-trim)" stroke-width="2.2" fill="none"/>
  </g>
  <g id="sleeve_near_upper">
    <path d="M148 176 Q166 170 182 186 L174 280 L136 276 L138 196 Q140 182 148 176 Z" fill="var(--c-coat-dark)"/>
    <path d="M144 194 Q150 180 166 178 Q178 190 172 262 L142 258 Z" fill="var(--c-metal)"/>
    <path d="M144 194 Q150 180 166 178 Q178 190 172 262 L142 258 Z" fill="url(#rig-shade)"/>
    <path d="M133 270 L176 276 L175 296 L131 290 Z" fill="var(--c-metal)"/>
    <path d="M133 270 L176 276" stroke="var(--c-trim)" stroke-width="2"/>
    <path d="M144 226 L172 230" stroke="#000" stroke-opacity=".3" stroke-width="1.6"/>
  </g>
  <g id="forearm_near">
    <path d="M136 288 L170 294 L158 370 L127 366 Z" fill="var(--c-metal)"/>
    <path d="M136 288 L170 294 L158 370 L127 366 Z" fill="url(#rig-shade)"/>
    <path d="M134 310 L166 316 M131 332 L162 338 M129 350 L160 356" stroke="#000" stroke-opacity=".3" stroke-width="1.6" fill="none"/>
    <path d="M136 288 L170 294" stroke="var(--c-trim)" stroke-width="2"/>
  </g>
`);

// --- Gantelets ---
write('gloves', 'plate_gauntlets', 'Gantelets de plates', ['metal', 'trim'],
  [{ id: 'far', bone: 'hand_far', z: 28 }, { id: 'near', bone: 'hand_near', z: 71 }],
  'Gantelets de plates : manchettes évasées, plaque de dos de main côté proche, phalanges.',
  `  <g id="far">
    <path d="M309 235 L325 219 L351 243 L335 261 Z" fill="var(--c-metal)"/>
    <path d="M309 235 L325 219 L351 243 L335 261 Z" fill="url(#rig-light)"/>
    <path d="M309 235 L325 219" stroke="var(--c-trim)" stroke-width="2.6"/>
    <path d="M317 242 L331 227 M325 250 L339 235" stroke="#000" stroke-opacity=".3" stroke-width="1.5"/>
    <circle cx="337" cy="247" r="2.5" fill="#F1F0EC" opacity=".5"/>
  </g>
  <g id="near">
    <path d="M124 350 L160 355 L158 378 L121 372 Z" fill="var(--c-metal)"/>
    <path d="M124 350 L160 355 L158 378 L121 372 Z" fill="url(#rig-shade)"/>
    <path d="M124 350 L160 355" stroke="var(--c-trim)" stroke-width="2.6"/>
    <path d="M125 366 Q119 386 129 397 L151 396 Q159 385 155 366 Z" fill="var(--c-metal)"/>
    <path d="M125 366 Q119 386 129 397 L151 396 Q159 385 155 366 Z" fill="#000" opacity=".2"/>
    <path d="M127 378 L154 377 M127 386 L154 385 M128 392 L152 391" stroke="#000" stroke-opacity=".4" stroke-width="1.5"/>
    <circle cx="141" cy="365" r="2.5" fill="#F1F0EC" opacity=".5"/>
  </g>
`);

// --- Jambières (nouvel emplacement « legs ») ---
write('legs', 'plate_greaves', 'Jambières de plates', ['metal', 'trim'],
  [
    { id: 'thigh_far', bone: 'thigh_far', z: 16 },
    { id: 'shin_far', bone: 'shin_far', z: 17 },
    { id: 'thigh_near', bone: 'thigh_near', z: 21 },
    { id: 'shin_near', bone: 'shin_near', z: 22 },
  ],
  'Jambières de plates : cuissots, genouillères en coupole, grèves.',
  `  <g id="thigh_far">
    <path d="M212 330 L244 330 L248 556 L219 556 Z" fill="var(--c-metal)"/>
    <path d="M212 330 L244 330 L248 556 L219 556 Z" fill="#000" opacity=".3"/>
    <path d="M214 400 L246 398 M216 470 L248 468" stroke="#000" stroke-opacity=".35" stroke-width="1.6"/>
    <path d="M244 330 L248 556" stroke="var(--c-glow)" stroke-opacity=".4" stroke-width="2"/>
  </g>
  <g id="shin_far">
    <ellipse cx="234" cy="556" rx="17" ry="14" fill="var(--c-metal)"/>
    <ellipse cx="234" cy="556" rx="17" ry="14" fill="#000" opacity=".28"/>
    <circle cx="234" cy="556" r="3" fill="var(--c-trim)"/>
    <path d="M220 568 L248 568 L252 634 L226 634 Z" fill="var(--c-metal)"/>
    <path d="M220 568 L248 568 L252 634 L226 634 Z" fill="#000" opacity=".3"/>
    <path d="M222 590 L250 590" stroke="var(--c-trim)" stroke-width="2"/>
  </g>
  <g id="thigh_near">
    <path d="M162 332 L204 332 L198 562 L166 562 Z" fill="var(--c-metal)"/>
    <path d="M162 332 L204 332 L198 562 L166 562 Z" fill="url(#rig-light)"/>
    <path d="M164 332 L168 562" stroke="#000" stroke-opacity=".25" stroke-width="3"/>
    <path d="M163 404 L202 402 M165 474 L200 472" stroke="#000" stroke-opacity=".35" stroke-width="1.8"/>
    <path d="M162 332 L204 332" stroke="var(--c-trim)" stroke-width="2.4"/>
  </g>
  <g id="shin_near">
    <ellipse cx="182" cy="562" rx="19" ry="16" fill="var(--c-metal)"/>
    <ellipse cx="182" cy="562" rx="19" ry="16" fill="url(#rig-light)"/>
    <circle cx="182" cy="562" r="3.4" fill="var(--c-trim)"/>
    <path d="M165 576 L198 578 L192 650 L168 648 Z" fill="var(--c-metal)"/>
    <path d="M165 576 L198 578 L192 650 L168 648 Z" fill="url(#rig-shade)"/>
    <path d="M167 600 L196 602 M168 626 L194 628" stroke="#000" stroke-opacity=".35" stroke-width="1.6"/>
    <path d="M165 576 L198 578" stroke="var(--c-trim)" stroke-width="2.2"/>
  </g>
`);

// --- Solerets ---
write('boots', 'plate_sabatons', 'Solerets de plates', ['metal', 'trim'],
  [{ id: 'far', bone: 'shin_far', z: 18 }, { id: 'near', bone: 'shin_near', z: 23 }],
  'Solerets : cheville articulée, pied à lames, bout pointu.',
  `  <g id="far">
    <path d="M220 628 L252 628 L255 656 L284 674 Q252 690 216 686 L220 658 Z" fill="var(--c-metal)"/>
    <path d="M220 628 L252 628 L255 656 L284 674 Q252 690 216 686 L220 658 Z" fill="#000" opacity=".38"/>
    <path d="M232 668 L236 686 M246 664 L250 684 M262 666 Q270 678 268 688" stroke="#000" stroke-opacity=".4" stroke-width="1.6" fill="none"/>
    <path d="M216 686 Q252 690 284 674" stroke="#16130F" stroke-width="5" fill="none"/>
  </g>
  <g id="near">
    <path d="M165 632 L199 632 L201 658 L228 678 Q194 694 158 690 L163 660 Z" fill="var(--c-metal)"/>
    <path d="M165 632 L199 632 L201 658 L228 678 Q194 694 158 690 L163 660 Z" fill="url(#rig-light)"/>
    <path d="M176 672 L180 690 M190 668 L194 688 M208 670 Q216 682 214 692" stroke="#000" stroke-opacity=".4" stroke-width="1.6" fill="none"/>
    <path d="M165 632 L199 632" stroke="var(--c-trim)" stroke-width="2.4"/>
    <path d="M158 690 Q194 694 228 678" stroke="#16130F" stroke-width="5" fill="none"/>
  </g>
`);

// --- Ceinturon ---
write('belt', 'plate_girdle', 'Ceinturon d\'armes', ['leather', 'metal', 'trim'],
  [{ id: 'belt', bone: 'pelvis', z: 40 }, { id: 'tassets', bone: 'pelvis', z: 41, detail: 2 }],
  'Ceinturon d\'armes : sangle large à boucle de plaque, tassettes pendantes.',
  `  <g id="belt">
    <path d="M152 290 Q206 304 260 290 L260 316 Q206 330 152 316 Z" fill="var(--c-leather)"/>
    <path d="M152 290 Q206 304 260 290" stroke="var(--c-metal)" stroke-width="3" fill="none"/>
    <path d="M196 288 L228 290 L228 322 L196 320 Z" fill="var(--c-metal)"/>
    <path d="M196 288 L228 290 L228 322 L196 320 Z" fill="url(#rig-light)"/>
    <path d="M203 296 L221 297 L221 314 L203 313 Z" fill="none" stroke="var(--c-trim)" stroke-width="2.4"/>
  </g>
  <g id="tassets">
    <path d="M154 314 L196 322 L190 372 L152 360 Z" fill="var(--c-metal)"/>
    <path d="M154 314 L196 322 L190 372 L152 360 Z" fill="url(#rig-shade)"/>
    <path d="M153 338 L193 346" stroke="#000" stroke-opacity=".35" stroke-width="1.6"/>
    <path d="M230 322 L262 314 L268 364 L234 372 Z" fill="var(--c-metal)"/>
    <path d="M230 322 L262 314 L268 364 L234 372 Z" fill="#000" opacity=".25"/>
    <path d="M231 346 L265 338" stroke="#000" stroke-opacity=".35" stroke-width="1.6"/>
    <path d="M154 314 L196 322 M230 322 L262 314" stroke="var(--c-trim)" stroke-width="2"/>
  </g>
`);

// --- Tabard d'armes (cape) ---
write('cape', 'battle_cloak', 'Tabard d\'armes', ['mantle', 'trim', 'metal'],
  [{ id: 'back', bone: 'cape', z: 8 }, { id: 'front', bone: 'cape', z: 74, detail: 2 }],
  'Tabard d\'armes : grand manteau dans le dos, bord galonné, agrafe à chaînette sur le torse.',
  `  <g id="back">
    <path d="M166 162 Q146 250 138 424 Q172 446 212 436 Q236 416 246 336 L246 168 Z" fill="var(--c-mantle)"/>
    <path d="M166 162 Q146 250 138 424 Q172 446 212 436 Q236 416 246 336 L246 168 Z" fill="url(#rig-shade)"/>
    <path d="M138 424 Q172 446 212 436 Q236 416 246 336" stroke="var(--c-trim)" stroke-width="3" fill="none"/>
    <path d="M176 200 Q168 300 164 410 M206 190 Q202 300 204 420" stroke="#000" stroke-opacity=".22" stroke-width="2" fill="none"/>
  </g>
  <g id="front">
    <path d="M176 168 Q210 182 244 170" stroke="var(--c-metal)" stroke-width="3.5" fill="none" stroke-dasharray="6 3"/>
    <circle cx="178" cy="168" r="6" fill="var(--c-metal)"/>
    <circle cx="178" cy="168" r="2.6" fill="var(--c-trim)"/>
    <circle cx="244" cy="170" r="6" fill="var(--c-metal)"/>
    <circle cx="244" cy="170" r="2.6" fill="var(--c-trim)"/>
  </g>
`);

// --- Épaulière proche ---
write('shoulder_near', 'plate_pauldron_near', 'Épaulière de plates', ['metal', 'trim'],
  [{ id: 'pauldron', bone: 'upperarm_near', z: 75 }],
  'Épaulière proche : trois lames bombées, bord galonné.',
  `  <g id="pauldron">
    <path d="M132 190 Q142 160 176 164 Q190 176 186 200 Q160 190 138 204 Z" fill="var(--c-metal)"/>
    <path d="M132 190 Q142 160 176 164 Q190 176 186 200 Q160 190 138 204 Z" fill="url(#rig-light)"/>
    <path d="M134 204 Q160 192 188 202 Q188 218 182 226 Q158 214 138 224 Z" fill="var(--c-metal)"/>
    <path d="M134 204 Q160 192 188 202 Q188 218 182 226 Q158 214 138 224 Z" fill="#000" opacity=".34"/>
    <path d="M136 222 Q158 210 182 224 L178 238 Q158 228 140 238 Z" fill="var(--c-metal)"/>
    <path d="M136 222 Q158 210 182 224 L178 238 Q158 228 140 238 Z" fill="#000" opacity=".48"/>
    <path d="M132 190 Q142 160 176 164" stroke="var(--c-trim)" stroke-width="2.4" fill="none"/>
    <circle cx="156" cy="180" r="2" fill="#F1F0EC" opacity=".5"/>
  </g>
`);
console.log('pièces écrites');

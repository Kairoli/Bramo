// Essais d'apparences de saison (demande de Louis du 23 octobre : « fais des tests, des pièces, des tenues complètes, en lien
// avec des types de saisons »). Quatre thèmes : Givre, Moissons, Carnaval des Masques, Abysses. Tenues `sketch_season_*`
// dans data/cosmetics.yaml, jamais proposées au joueur ; planche : /#saisons (développement).
// Lancer : node art/make_seasons.mjs (réécrit les pièces ; les retouches se font ici, pas dans les fichiers générés).
import { edge, fill, glint, layer, line, plate, shade, light, write } from './draw.mjs';

const r1 = (n) => Math.round(n * 10) / 10;

// --- Outils de forme ---------------------------------------------------------------------------------------------------

/** Points régulièrement espacés le long d'une ligne brisée. */
function resample(pts, step) {
  const out = [pts[0]];
  let carry = 0;
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1];
    const [bx, by] = pts[i];
    const len = Math.hypot(bx - ax, by - ay);
    let t = step - carry;
    while (t <= len) {
      out.push([ax + ((bx - ax) * t) / len, ay + ((by - ay) * t) / len]);
      t += step;
    }
    carry = len - (t - step);
  }
  const last = pts[pts.length - 1];
  if (Math.hypot(out[out.length - 1][0] - last[0], out[out.length - 1][1] - last[1]) > step / 3) out.push(last);
  return out;
}

/** Normale unitaire (à gauche du sens de marche) en chaque point. */
function normals(pts) {
  return pts.map((p, i) => {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const l = Math.hypot(dx, dy) || 1;
    return [-dy / l, dx / l];
  });
}

/**
 * Bande de fourrure le long d'une ligne : bords festonnés (touffes) des deux côtés. `w` largeur (un nombre, ou une
 * fonction de la position 0..1), `bump` hauteur des touffes.
 */
function furPath(center, w, { step = 9, bump = 4.5 } = {}) {
  const pts = resample(center, step);
  const ns = normals(pts);
  const width = (i) => (typeof w === 'function' ? w(i / (pts.length - 1)) : w);
  const side = (sgn) => pts.map((p, i) => [p[0] + ns[i][0] * sgn * width(i) / 2, p[1] + ns[i][1] * sgn * width(i) / 2]);
  const left = side(1);
  const right = side(-1).reverse();
  const nsr = [...ns].reverse();
  const scallop = (edgePts, nrm, sgn) => {
    let d = '';
    for (let i = 1; i < edgePts.length; i++) {
      const [ax, ay] = edgePts[i - 1];
      const [bx, by] = edgePts[i];
      const n = nrm[i];
      const k = bump * (0.7 + 0.6 * (((i * 7) % 5) / 4));
      d += ` Q${r1((ax + bx) / 2 + n[0] * sgn * k)} ${r1((ay + by) / 2 + n[1] * sgn * k)} ${r1(bx)} ${r1(by)}`;
    }
    return d;
  };
  return `M${r1(left[0][0])} ${r1(left[0][1])}${scallop(left, ns, 1)} L${r1(right[0][0])} ${r1(right[0][1])}${scallop(right, nsr, -1)} Z`;
}

/** Mèches de fourrure : petits traits clairs et sombres le long de la bande. */
function furStrands(center, w, step = 12) {
  const pts = resample(center, step);
  const ns = normals(pts);
  let dark = '';
  let lite = '';
  pts.forEach((p, i) => {
    const k = ((i * 5) % 3) - 1;
    const len = (typeof w === 'function' ? w(i / (pts.length - 1)) : w) * 0.32;
    const [nx, ny] = ns[i];
    const x = p[0] + nx * k * 2.5;
    const y = p[1] + ny * k * 2.5;
    const seg = `M${r1(x - nx * len)} ${r1(y - ny * len)} Q${r1(x + 2)} ${r1(y + 1)} ${r1(x + nx * len * 0.7)} ${r1(y + ny * len * 0.7)} `;
    if (i % 2) dark += seg;
    else lite += seg;
  });
  return line(dark, '#000', 1.2, { 'stroke-opacity': 0.16 }) + line(lite, '#FFFFFF', 1.1, { 'stroke-opacity': 0.4 });
}

/** Fourrure complète : aplat (couleur de mantelet), ombre du côté proche, mèches, contour doux. */
function fur(center, w, o = {}) {
  // Budget d'affichage (art/perf.mjs, 23 octobre) : un bord festonné coûte cher à chaque image ; pas de touffe plus
  // serrée que tous les 12 px, et pas d'ombre par-dessus (les mèches suffisent).
  o = { ...o, step: Math.max(o.step ?? 12, 12) };
  const d = furPath(center, w, o);
  return fill(d, o.color ?? 'var(--c-mantle)') + furStrands(center, w) + edge(d, 0.28, 1.2);
}

/** Éclat de glace (cristal facetté) planté en (x, y), de hauteur h, incliné de `deg` degrés. */
function shard(x, y, h, wd, deg, o = {}) {
  const t = `transform="rotate(${deg} ${x} ${y})"`;
  const body = `M${x - wd / 2} ${y} L${x - wd * 0.35} ${y - h * 0.62} L${x} ${y - h} L${x + wd * 0.42} ${y - h * 0.58} L${x + wd / 2} ${y} Z`;
  const facet = `M${x} ${y - h} L${x + wd * 0.42} ${y - h * 0.58} L${x + wd / 2} ${y} L${x + wd * 0.05} ${y} Z`;
  const ridge = `M${x} ${y - h} L${x + wd * 0.05} ${y}`;
  return `<g ${t}>${fill(body, o.color ?? 'var(--c-trim)', { opacity: o.opacity ?? 0.92 })}${fill(facet, '#FFFFFF', { opacity: 0.32 })}${fill(body, 'url(#rig-shade)')}${line(ridge, '#FFFFFF', 1, { 'stroke-opacity': 0.75 })}${edge(body, 0.35, 1)}</g>`;
}

/** Flocon à six branches. */
function snowflake(cx, cy, r, o = {}) {
  let d = '';
  for (let k = 0; k < 6; k++) {
    const a = (Math.PI / 3) * k;
    const ex = cx + Math.cos(a) * r;
    const ey = cy + Math.sin(a) * r;
    d += `M${r1(cx)} ${r1(cy)} L${r1(ex)} ${r1(ey)} `;
    const mx = cx + Math.cos(a) * r * 0.55;
    const my = cy + Math.sin(a) * r * 0.55;
    for (const s of [-1, 1]) d += `M${r1(mx)} ${r1(my)} L${r1(mx + Math.cos(a + s * 0.8) * r * 0.35)} ${r1(my + Math.sin(a + s * 0.8) * r * 0.35)} `;
  }
  return line(d, o.color ?? 'var(--c-trim)', o.w ?? 1.2, { 'stroke-opacity': o.op ?? 0.8 });
}

/** Particules qui tombent (classe fx-fall du moteur) : [x, y, taille, retard en s, dérive]. */
const fallers = (list, draw) =>
  list.map(([x, y, s, d, dx]) => `<g class="fx-fall" style="--d:${d}s;--dx:${dx}px">${draw(x, y, s)}</g>`).join('');

/** Particules qui montent (classe fx-rise du moteur). */
const risers = (list, draw) => list.map(([x, y, s, d]) => `<g class="fx-rise" style="animation-delay:${d}s">${draw(x, y, s)}</g>`).join('');

// --- Givre --------------------------------------------------------------------------------------------------------------

function frost() {
  // Capuche fourrée : coque matelassée, fourrure épaisse autour du visage, couronne de trois éclats de glace.
  const shell = 'M214 12 Q258 20 270 70 Q270 86 258 96 Q246 70 216 64 Q194 66 186 96 Q180 126 186 164 L154 172 Q124 128 134 78 Q150 24 214 12 Z';
  const ruff = [[256, 96], [246, 76], [226, 64], [204, 66], [190, 80], [184, 104], [183, 132], [188, 160], [202, 176], [222, 180]];
  write(
    'headwear',
    'frost_hood',
    'Capuche du Givre',
    ['coat', 'coatDark', 'mantle', 'trim', 'metal'],
    [
      { id: 'back', bone: 'head', z: 52 },
      { id: 'shadow', bone: 'head', z: 57 },
      { id: 'front', bone: 'head', z: 80 },
      { id: 'crown', bone: 'head', z: 81 },
    ],
    'Capuche du Givre : coque matelassée, fourrure épaisse autour du visage, couronne de trois éclats de glace qui luisent.',
    layer('back', fill('M264 74 Q276 116 262 156 L240 170 Q252 130 250 96 Z', 'var(--c-coat-dark)'), fur([[262, 92], [266, 120], [258, 150]], 12, { bump: 3.5 }), fill('M188 96 Q198 66 216 62 Q238 66 250 96 L248 158 L184 160 Z', 'var(--c-shadow)')) +
      layer('shadow', fill('M186 92 Q194 66 214 64 Q237 66 248 92 L248 106 Q216 96 188 110 Z', 'url(#rig-hood)')) +
      layer(
        'front',
        fill(shell, 'var(--c-coat)'),
        fill(shell, 'url(#rig-weave)'),
        fill('M214 12 Q150 24 134 78 Q124 128 154 172 L186 164 Q180 126 186 96 Q190 80 200 70 Z', 'url(#rig-shade)'),
        // Matelassage : coutures en losanges.
        line('M150 50 Q176 66 186 96 M170 26 Q206 40 222 64 M196 16 Q232 30 250 56 M140 84 Q158 104 168 138 M142 120 Q160 140 172 168', 'var(--c-coat-dark)', 2, { 'stroke-opacity': 0.8 }),
        line('M146 102 Q170 70 206 46 M150 140 Q176 98 220 66 M176 30 Q200 22 236 30', 'var(--c-coat-dark)', 1.6, { 'stroke-opacity': 0.55 }),
        line('M214 12 Q258 20 270 70 Q270 86 258 96', 'var(--c-glow)', 2, { 'stroke-opacity': 0.5 }),
        fur(ruff, (t) => 15 + 6 * Math.sin(t * Math.PI), { bump: 4.5 }),
        // Fermoir d'argent sous le menton.
        plate('M212 172 L226 168 L230 180 L216 186 Z'),
        `<circle cx="221" cy="177" r="3" fill="var(--c-trim)" class="fx-pulse" filter="url(#rig-glow)"/>`,
      ) +
      layer(
        'crown',
        shard(196, 26, 30, 12, -28),
        shard(214, 16, 40, 15, -10),
        shard(234, 22, 28, 11, 12),
        `<circle cx="214" cy="-6" r="3" fill="#FFFFFF" class="fx-pulse" filter="url(#rig-glow)" opacity=".85"/>`,
      ),
  );

  // Mantelet de fourrure et grande cape brodée de flocons, ourlet de glaçons, neige qui tombe.
  const cloak = 'M168 160 Q118 300 100 560 L120 586 L136 566 L152 600 L170 572 L190 606 L208 576 L226 604 L244 572 L262 596 L274 560 L280 440 Q274 300 254 164 Z';
  const hem = [[104, 556], [140, 568], [180, 574], [220, 572], [256, 566], [278, 552]];
  const icicles = [[112, 572, 22], [130, 584, 16], [148, 594, 26], [166, 586, 18], [186, 598, 30], [204, 588, 18], [222, 596, 26], [240, 586, 16], [258, 590, 22], [272, 572, 14]]
    .map(([x, y, h]) => `M${x - 4} ${y - 6} L${x} ${y + h} L${x + 4} ${y - 6} Z`)
    .join(' ');
  const flakes = [[150, 330, 9], [196, 300, 7], [232, 360, 10], [160, 440, 8], [214, 470, 11], [252, 470, 7], [132, 520, 7], [186, 530, 8], [238, 530, 9]];
  write(
    'cape',
    'frost_mantle',
    'Mantelet du Givre',
    ['coat', 'coatDark', 'mantle', 'trim', 'metal'],
    [
      { id: 'back', bone: 'cape', z: 6 },
      { id: 'collar', bone: 'torso', z: 74 },
      { id: 'snow', bone: 'root', z: 91, detail: 2 },
    ],
    'Mantelet du Givre : grande cape brodée de flocons, ourlet de glaçons, col de fourrure sur les épaules, neige qui tombe.',
    layer(
      'back',
      fill(cloak, 'var(--c-coat-dark)'),
      fill(cloak, 'url(#rig-weave)'),
      fill('M168 160 Q118 300 100 560 L120 586 L136 566 L152 600 L170 572 L190 606 L198 590 L200 160 Z', 'url(#rig-shade)'),
      line('M150 230 Q176 248 200 236 M136 330 Q170 350 198 334 M126 430 Q164 452 196 432', '#000', 2, { 'stroke-opacity': 0.2 }),
      ...flakes.map(([x, y, r]) => snowflake(x, y, r, { op: 0.55 })),
      line('M108 540 Q190 560 276 540', 'var(--c-trim)', 2.4, { 'stroke-opacity': 0.8 }),
      fill(icicles, 'var(--c-trim)', { opacity: 0.85 }),
      line(icicles, '#FFFFFF', 0.8, { 'stroke-opacity': 0.6 }),
      fur(hem, 10, { bump: 3 }),
      line('M254 164 Q274 300 280 440 L274 560', 'var(--c-glow)', 2, { 'stroke-opacity': 0.45 }),
    ) +
      layer(
        'collar',
        fur([[124, 204], [140, 182], [166, 168], [196, 170], [226, 168], [254, 170], [274, 190]], (t) => 30 + 16 * Math.sin(t * Math.PI), { bump: 7, step: 10 }),
        plate('M204 186 L222 182 L228 202 L210 208 Z'),
        `<path d="M216 190 L222 196 L216 202 L210 196 Z" fill="var(--c-trim)" class="fx-pulse" filter="url(#rig-glow)"/>`,
      ) +
      layer(
        'snow',
        fallers(
          [
            [120, 60, 3, 0, 14],
            [300, 20, 2.4, 0.8, -10],
            [180, 0, 2, 1.6, 20],
            [340, 120, 3, 2.3, -16],
            [90, 200, 2.2, 3.1, 12],
            [260, 80, 2.6, 3.9, 18],
            [150, 260, 2, 4.4, -8],
            [320, 300, 2.4, 1.2, 10],
            [60, 340, 2.8, 2.7, 14],
          ],
          (x, y, s) => `<circle cx="${x}" cy="${y}" r="${s}" fill="#FFFFFF" opacity=".9"/>`,
        ),
      ),
  );

  // Épaulière de givre : deux lames d'argent, bordure de fourrure, trois éclats dressés.
  write(
    'shoulder_near',
    'frost_pauldron',
    'Épaulière de givre',
    ['metal', 'mantle', 'trim'],
    [{ id: 'pauldron', bone: 'upperarm_near', z: 76 }],
    'Épaulière de givre : deux lames d’argent, bordure de fourrure, trois éclats de glace dressés.',
    layer(
      'pauldron',
      shard(142, 176, 34, 12, -40),
      shard(156, 168, 46, 15, -22),
      shard(172, 166, 30, 11, -6),
      plate('M126 186 Q150 158 184 166 Q194 188 182 210 Q156 198 130 210 Z'),
      plate('M128 206 Q154 194 182 206 L180 222 Q156 212 132 224 Z'),
      fur([[126, 222], [146, 216], [166, 214], [184, 220]], 9, { bump: 2.6, step: 7 }),
      glint('M130 186 Q152 164 182 168', 0.5),
      `<circle cx="158" cy="186" r="4" fill="var(--c-trim)" class="fx-pulse" filter="url(#rig-glow)"/>`,
    ),
  );

  // Bottes fourrées : revers de fourrure, coque de cuir, pointe ferrée.
  const boot = (x0) => `M${x0} 598 L${x0 + 34} 598 L${x0 + 36} 652 L${x0 + 60} 672 Q${x0 + 62} 684 ${x0 + 52} 686 Q${x0 + 24} 690 ${x0 - 4} 688 L${x0} 650 Z`;
  const bootLayer = (x0, op = 1) => [
    fill(boot(x0), 'var(--c-boots)', { opacity: op }),
    fill(boot(x0), 'url(#rig-grain)'),
    fill(boot(x0), 'url(#rig-shade)'),
    plate(`M${x0 + 38} 662 L${x0 + 60} 672 Q${x0 + 62} 684 ${x0 + 52} 686 L${x0 + 36} 684 Z`),
    line(`M${x0 + 6} 632 L${x0 + 30} 628 M${x0 + 6} 644 L${x0 + 32} 640`, 'var(--c-leather)', 3),
    line(`M${x0 - 4} 688 Q${x0 + 26} 690 ${x0 + 58} 680`, '#16130F', 4),
  ];
  write(
    'boots',
    'frost_boots',
    'Bottes fourrées du Givre',
    ['boots', 'mantle', 'metal', 'leather'],
    [
      { id: 'far', bone: 'shin_far', z: 16 },
      { id: 'near', bone: 'shin_near', z: 20 },
      // Le revers de fourrure passe par-dessus le pantalon (jambières z 16-22).
      { id: 'cuff_far', bone: 'shin_far', z: 18 },
      { id: 'cuff_near', bone: 'shin_near', z: 23 },
    ],
    'Bottes fourrées du Givre : revers de fourrure, sangles, pointe ferrée.',
    layer('far', ...bootLayer(220, 0.92)) +
      layer('near', ...bootLayer(164)) +
      layer('cuff_far', fur([[212, 596], [238, 591], [262, 596]], 20, { bump: 3.6, step: 7 })) +
      layer('cuff_near', fur([[156, 598], [182, 593], [206, 598]], 20, { bump: 3.6, step: 7 })),
  );
}

/** Points d'une demi-ellipse (ou d'un arc) inclinée de `deg` degrés, de l'angle a0 à a1 (radians). */
function arc(cx, cy, rx, ry, deg, a0, a1, n = 24) {
  const t = (deg * Math.PI) / 180;
  return Array.from({ length: n + 1 }, (_, i) => {
    const a = a0 + ((a1 - a0) * i) / n;
    const x = Math.cos(a) * rx;
    const y = Math.sin(a) * ry;
    return [cx + x * Math.cos(t) - y * Math.sin(t), cy + x * Math.sin(t) + y * Math.cos(t)];
  });
}
const poly = (pts, close = true) => `M${pts.map(([x, y]) => `${r1(x)} ${r1(y)}`).join(' L')}${close ? ' Z' : ''}`;

/** Épi de blé : tige et grains en chevrons, de (x0, y0) à (x1, y1). */
function wheatEar(x0, y0, x1, y1, o = {}) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const l = Math.hypot(dx, dy);
  const ux = dx / l;
  const uy = dy / l;
  let grains = '';
  const n = o.grains ?? 6;
  for (let i = 0; i < n; i++) {
    const t = 0.35 + (0.6 * i) / n;
    const cx = x0 + dx * t;
    const cy = y0 + dy * t;
    for (const s of [-1, 1]) {
      const ex = cx + (ux * 5 - uy * 4 * s);
      const ey = cy + (uy * 5 + ux * 4 * s);
      grains += `<ellipse cx="${r1((cx + ex) / 2)}" cy="${r1((cy + ey) / 2)}" rx="3.4" ry="1.7" transform="rotate(${r1((Math.atan2(ey - cy, ex - cx) * 180) / Math.PI)} ${r1((cx + ex) / 2)} ${r1((cy + ey) / 2)})" fill="var(--c-trim)"/>`;
    }
  }
  return line(`M${x0} ${y0} L${x1} ${y1}`, 'var(--c-mantle)', 1.6) + grains + line(`M${r1(x1)} ${r1(y1)} l${r1(ux * 9)} ${r1(uy * 9)}`, 'var(--c-trim)', 0.8);
}

/** Feuille d'automne (qui tombe). */
const leaf = (x, y, s, color) =>
  `<path d="M${x} ${y - s} Q${x + s} ${y - s * 0.2} ${x} ${y + s} Q${x - s} ${y - s * 0.2} ${x} ${y - s} Z" fill="${color}"/><path d="M${x} ${y - s} L${x} ${y + s}" stroke="#000" stroke-opacity=".25" stroke-width=".8"/>`;

// --- Moissons -----------------------------------------------------------------------------------------------------------

function harvest() {
  // Chapeau de paille à large bord : bord arrière derrière la tête, calotte et bord avant devant ; bandeau rouille,
  // brin de blé et plume de corneille.
  const brimBack = arc(214, 80, 96, 18, -6, Math.PI, 2 * Math.PI);
  const brimFront = arc(214, 80, 96, 18, -6, 0, Math.PI);
  const crown = 'M176 84 Q170 50 194 36 Q216 26 240 36 Q258 50 252 82 Q214 92 176 84 Z';
  const weave = Array.from({ length: 13 }, (_, i) => {
    const a = Math.PI + (Math.PI * i) / 12;
    const [x, y] = arc(214, 80, 96, 18, -6, a, a, 1)[0];
    const [x2, y2] = arc(214, 80, 58, 11, -6, a, a, 1)[0];
    return `M${r1(x2)} ${r1(y2)} L${r1(x)} ${r1(y)}`;
  }).join(' ');
  const weaveFront = Array.from({ length: 13 }, (_, i) => {
    const a = (Math.PI * i) / 12;
    const [x, y] = arc(214, 80, 96, 18, -6, a, a, 1)[0];
    const [x2, y2] = arc(214, 80, 60, 11, -6, a, a, 1)[0];
    return `M${r1(x2)} ${r1(y2)} L${r1(x)} ${r1(y)}`;
  }).join(' ');
  write(
    'headwear',
    'harvest_hat',
    'Chapeau des Moissons',
    ['mantle', 'under', 'trim', 'coatDark', 'beard'],
    [
      { id: 'back', bone: 'head', z: 52 },
      { id: 'shadow', bone: 'head', z: 57 },
      { id: 'front', bone: 'head', z: 80 },
    ],
    'Chapeau des Moissons : paille tressée à large bord, bandeau rouille, brin de blé et plume de corneille.',
    layer(
      'back',
      fill('M186 108 Q178 136 194 152 L202 132 Z', 'var(--c-beard)'),
      fill(`${poly(brimBack, false)} Z`, 'var(--c-mantle)'),
      fill(`${poly(brimBack, false)} Z`, 'url(#rig-weave)'),
      fill(`${poly(brimBack, false)} Z`, '#000', { opacity: 0.22 }),
      line(weave, '#000', 1, { 'stroke-opacity': 0.18 }),
    ) +
      layer('shadow', fill('M182 88 Q214 80 250 88 L250 112 Q214 100 184 116 Z', '#000', { opacity: 0.35 })) +
      layer(
        'front',
        // Brin de blé et plume, glissés dans le bandeau côté proche (derrière la calotte).
        wheatEar(186, 70, 150, 30),
        wheatEar(190, 70, 162, 22, { grains: 5 }),
        wheatEar(184, 74, 140, 46, { grains: 5 }),
        fill('M190 72 Q160 50 132 20 Q150 30 166 42 Q150 26 146 14 Q172 40 196 66 Z', 'var(--c-shadow)'),
        line('M192 70 Q160 44 136 18', '#FFFFFF', 0.8, { 'stroke-opacity': 0.35 }),
        fill(crown, 'var(--c-mantle)'),
        fill(crown, 'url(#rig-weave)'),
        fill('M176 84 Q170 50 194 36 Q204 32 212 30 Q196 50 198 88 Z', 'url(#rig-shade)'),
        line('M180 70 Q214 60 250 68 M178 58 Q214 46 248 54 M184 46 Q214 34 242 42', '#000', 1.2, { 'stroke-opacity': 0.2 }),
        line('M240 36 Q258 50 252 82', 'var(--c-glow)', 1.8, { 'stroke-opacity': 0.45 }),
        fill('M177 72 Q214 82 252 70 L252 82 Q214 92 177 84 Z', 'var(--c-under)'),
        line('M177 78 Q214 88 252 76', 'var(--c-trim)', 1, { 'stroke-dasharray': '3 3', 'stroke-opacity': 0.8 }),
        fill(`${poly(brimFront, false)} Z`, 'var(--c-mantle)'),
        fill(`${poly(brimFront, false)} Z`, 'url(#rig-weave)'),
        fill(`${poly(brimFront, false)} Z`, 'url(#rig-shade)'),
        line(weaveFront, '#000', 1, { 'stroke-opacity': 0.16 }),
        line(poly(brimFront, false), '#000', 1.4, { 'stroke-opacity': 0.3 }),
        // Bord effiloché : quelques brins qui dépassent.
        line('M124 84 l-8 3 M146 94 l-5 6 M300 70 l9 -2 M282 88 l6 5 M206 98 l-1 7', 'var(--c-mantle)', 1.6),
        glint(poly(arc(214, 80, 96, 18, -6, 0.15, 1.2, 8), false), 0.35),
      ),
  );

  // Gerbe de blé portée en travers du dos, nouée d'un ruban ; foulard noué au cou ; feuilles qui tombent.
  const tie = [178, 176];
  const stalks = Array.from({ length: 13 }, (_, i) => {
    const t = i / 12;
    const a = ((-104 - t * 58) * Math.PI) / 180;
    const len = 78 + ((i * 37) % 5) * 9;
    const bx = 202 + (t - 0.5) * 16;
    const by = 262 + ((i * 3) % 4) * 3;
    const tx = tie[0] + Math.cos(a) * len;
    const ty = tie[1] + Math.sin(a) * len;
    // Le haut de la tige ploie sous l'épi (vers l'extérieur et le bas).
    const cx = tie[0] + Math.cos(a) * len * 0.6 + (t - 0.5) * 10;
    const cy = tie[1] + Math.sin(a) * len * 0.6 - 4;
    const da = a - 0.35 * (t - 0.5) * 2 + 0.25;
    return { bx, by, tx, ty, cx, cy, ex: tx + Math.cos(da) * 26, ey: ty + Math.sin(da) * 26 };
  });
  write(
    'cape',
    'harvest_sheaf',
    'Gerbe des Moissons',
    ['mantle', 'under', 'trim'],
    [
      { id: 'sheaf', bone: 'torso', z: 5 },
      { id: 'scarf', bone: 'torso', z: 74 },
      { id: 'leaves', bone: 'root', z: 91, detail: 2 },
    ],
    'Gerbe des Moissons : une gerbe de blé portée en travers du dos, un ruban rouille, un foulard noué au cou, des feuilles qui tombent.',
    layer(
      'sheaf',
      line(stalks.map((k) => `M${r1(k.bx)} ${r1(k.by)} L${tie[0]} ${tie[1]} Q${r1(k.cx)} ${r1(k.cy)} ${r1(k.tx)} ${r1(k.ty)}`).join(' '), 'var(--c-mantle)', 3),
      line(stalks.map((k, i) => (i % 2 ? `M${r1(k.bx)} ${r1(k.by)} L${tie[0]} ${tie[1]} Q${r1(k.cx)} ${r1(k.cy)} ${r1(k.tx)} ${r1(k.ty)}` : '')).join(' '), '#000', 1, { 'stroke-opacity': 0.25 }),
      ...stalks.map((k) => wheatEar(r1(k.tx), r1(k.ty), r1(k.ex), r1(k.ey), { grains: 5 })),
      // Ruban noué : deux tours, un nœud, deux pans.
      fill('M166 168 Q180 160 194 170 L190 186 Q178 178 164 184 Z', 'var(--c-under)'),
      fill('M166 168 Q180 160 194 170 L190 186 Q178 178 164 184 Z', 'url(#rig-shade)'),
      fill('M170 182 Q156 204 160 224 L172 206 Z M186 184 Q192 206 184 224 L196 206 Z', 'var(--c-under)'),
      `<circle cx="178" cy="176" r="6.5" fill="var(--c-under)"/>`,
      line('M166 174 Q180 168 192 176', 'var(--c-trim)', 1, { 'stroke-opacity': 0.7 }),
    ) +
      layer(
        'scarf',
        fill('M180 162 Q212 182 246 164 L250 184 Q214 204 178 184 Z', 'var(--c-under)'),
        fill('M180 162 Q212 182 246 164 L250 184 Q214 204 178 184 Z', 'url(#rig-shade)'),
        fill('M206 190 L224 192 L230 232 L214 238 L204 226 Z', 'var(--c-under)'),
        fill('M206 190 L224 192 L230 232 L214 238 L204 226 Z', '#000', { opacity: 0.18 }),
        line('M184 172 l-10 -6 M182 178 l-12 0 M246 172 l10 -7 M248 178 l12 -2 M212 236 l-3 10 M220 236 l3 9', 'var(--c-mantle)', 2.2),
        `<circle cx="214" cy="190" r="7" fill="var(--c-under)"/>`,
        ...[[190, 176], [204, 184], [226, 184], [240, 174], [212, 210], [220, 224]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.8" fill="var(--c-trim)" opacity=".8"/>`),
      ) +
      layer(
        'leaves',
        fallers(
          [
            [110, 70, 6, 0, 30, '#D9782F'],
            [300, 30, 5, 1, -20, '#C9472A'],
            [190, 10, 5, 2.1, 24, '#E8B04A'],
            [340, 140, 6, 2.9, -26, '#D9782F'],
            [80, 220, 5, 3.6, 18, '#E8B04A'],
            [260, 110, 4, 4.4, 22, '#C9472A'],
          ].map(([x, y, s, d, dx]) => [x, y, s, d, dx]),
          (x, y, s) => leaf(x, y, s, ['#D9782F', '#C9472A', '#E8B04A'][(x + y) % 3]),
        ),
      ),
  );

  // Ceinture de corde : nœud et pans côté proche, faucille, lanterne-courge qui luit côté éloigné.
  const rope = 'M150 296 Q206 310 262 296';
  write(
    'belt',
    'harvest_belt',
    'Ceinture des Moissons',
    ['mantle', 'under', 'trim', 'metal', 'wood'],
    [
      { id: 'belt', bone: 'pelvis', z: 40 },
      { id: 'gear', bone: 'pelvis', z: 41 },
    ],
    'Ceinture des Moissons : corde tressée nouée, faucille côté proche, lanterne-courge sculptée qui luit côté éloigné.',
    layer(
      'belt',
      line(rope, 'var(--c-mantle)', 11),
      line(rope, '#000', 11, { 'stroke-opacity': 0.12, 'stroke-dasharray': '2 5' }),
      line('M156 298 l6 -6 M168 301 l6 -6 M180 303 l6 -6 M192 304 l6 -6 M204 305 l6 -6 M216 305 l6 -6 M228 304 l6 -6 M240 302 l6 -6 M252 299 l6 -6', '#000', 1.4, { 'stroke-opacity': 0.3 }),
      `<circle cx="172" cy="304" r="8" fill="var(--c-mantle)"/>`,
      line('M168 308 Q162 330 170 352 M176 308 Q182 326 178 344', 'var(--c-mantle)', 4.5),
      line('M168 308 Q162 330 170 352 M176 308 Q182 326 178 344', '#000', 4.5, { 'stroke-opacity': 0.15 }),
    ) +
      layer(
        'gear',
        // Faucille.
        line('M150 304 L146 344', 'var(--c-wood)', 5),
        fill('M146 344 Q122 350 118 376 Q132 360 150 354 Z', 'var(--c-metal)'),
        fill('M146 344 Q122 350 118 376 Q132 360 150 354 Z', 'url(#rig-sheen)'),
        // Lanterne-courge.
        line('M250 304 L254 326', '#2B2320', 1.6),
        fill('M236 334 Q236 324 254 324 Q272 324 272 336 Q274 352 254 354 Q234 352 236 334 Z', 'var(--c-under)'),
        fill('M236 334 Q236 324 254 324 Q272 324 272 336 Q274 352 254 354 Q234 352 236 334 Z', 'url(#rig-shade)'),
        line('M248 325 Q244 340 248 353 M260 325 Q264 340 260 353', '#000', 1.2, { 'stroke-opacity': 0.25 }),
        fill('M251 320 L257 320 L256 326 L252 326 Z', '#4A5A2A'),
        `<g class="fx-pulse">${fill('M244 334 l5 -4 l2 5 Z M258 330 l5 4 l-6 2 Z M244 344 Q254 350 264 343 L262 347 Q254 352 246 347 Z', 'var(--c-trim)', { filter: 'url(#rig-glow)' })}</g>`,
      ),
  );
}

// --- Carnaval des Masques -----------------------------------------------------------------------------------------------

/** Plume : rachis courbe et barbes, d'une base (x0, y0) à une pointe (x1, y1), courbée vers (cx, cy). */
function feather(x0, y0, cx, cy, x1, y1, w, color) {
  const pts = Array.from({ length: 13 }, (_, i) => {
    const t = i / 12;
    return [(1 - t) ** 2 * x0 + 2 * (1 - t) * t * cx + t * t * x1, (1 - t) ** 2 * y0 + 2 * (1 - t) * t * cy + t * t * y1];
  });
  const ns = normals(pts);
  const width = (i) => w * Math.sin((Math.min(i, 11) / 12) * Math.PI) * (0.6 + 0.4 * (i / 12));
  const left = pts.map((p, i) => [p[0] + ns[i][0] * width(i), p[1] + ns[i][1] * width(i)]);
  const right = pts.map((p, i) => [p[0] - ns[i][0] * width(i) * 0.8, p[1] - ns[i][1] * width(i) * 0.8]).reverse();
  const d = poly([...left, ...right]);
  const barbs = pts.slice(2, 11).map((p, i) => `M${r1(p[0])} ${r1(p[1])} L${r1(left[i + 2][0])} ${r1(left[i + 2][1])}`).join(' ');
  return fill(d, color) + fill(d, 'url(#rig-shade)') + line(barbs, '#000', 0.8, { 'stroke-opacity': 0.25 }) + line(`M${x0} ${y0} Q${cx} ${cy} ${x1} ${y1}`, '#FFFFFF', 1, { 'stroke-opacity': 0.6 });
}

function carnival() {
  // Masque à bec : ivoire, losanges cramoisis, volutes d'or, bijou au front ; ruban noué derrière la tête.
  const mask = 'M194 88 Q210 74 238 78 Q254 84 252 98 L302 124 Q306 132 298 136 L250 122 Q240 130 222 126 Q204 122 196 112 Q190 100 194 88 Z';
  write(
    'face',
    'carnival_mask',
    'Masque du Carnaval',
    ['under', 'mantle', 'trim', 'skinDark'],
    [
      { id: 'ribbon', bone: 'head', z: 52 },
      { id: 'features', bone: 'head', z: 56 },
      { id: 'mask', bone: 'head', z: 58 },
      { id: 'eyes', bone: 'head', z: 59 },
    ],
    'Masque du Carnaval : demi-masque à long bec, ivoire et or, losanges cramoisis, ruban noué derrière la tête.',
    layer('ribbon', fill('M196 96 Q180 98 172 108 Q164 130 156 156 L166 158 Q172 132 182 114 Q188 106 198 104 Z M186 106 Q178 134 180 166 L190 162 Q188 136 194 110 Z', 'var(--c-mantle)'), fill('M196 96 Q180 98 172 108 L176 112 Q186 102 198 102 Z', '#000', { opacity: 0.25 })) +
      layer('features', line('M234 134 Q240 136 245 133', 'var(--c-skin-dark)', 1.6), fill('M200 128 Q214 146 222 150 Q212 150 200 140 Z', 'var(--c-skin-dark)', { opacity: 0.35 })) +
      layer(
        'mask',
        fill(mask, 'var(--c-under)'),
        fill(mask, 'url(#rig-sheen)'),
        fill('M194 88 Q190 100 196 112 Q204 122 222 126 L218 112 Q206 104 206 90 Z', 'url(#rig-shade)'),
        fill('M226 82 l5 -6 l5 6 l-5 6 Z M212 84 l4 -5 l4 5 l-4 5 Z M240 86 l4 -4 l4 4 l-4 4 Z', 'var(--c-mantle)'),
        line('M198 110 Q206 118 222 120 Q238 120 246 112 M254 104 Q276 114 298 128', 'var(--c-trim)', 1.6),
        line('M200 96 Q196 88 204 84 M246 92 Q250 86 246 82', 'var(--c-trim)', 1.2),
        `<ellipse cx="219" cy="101" rx="7" ry="4.6" fill="#0B0D10"/>`,
        `<ellipse cx="237" cy="100" rx="4.6" ry="3.8" fill="#0B0D10"/>`,
        line('M211 96 Q219 92 227 96 M233 95 Q237 92 242 95', 'var(--c-trim)', 1.4),
        `<path d="M231 72 l4 -7 l4 7 l-4 5 Z" fill="var(--c-trim)" class="fx-pulse" filter="url(#rig-glow)"/>`,
        edge(mask, 0.35, 1.2),
      ) +
      layer(
        'eyes',
        `<ellipse class="fx-pulse" cx="219" cy="101" rx="3" ry="1.5" fill="var(--c-glow-light)" filter="url(#rig-glow)"/>`,
        `<ellipse class="fx-pulse" cx="237" cy="100" rx="2.2" ry="1.3" fill="var(--c-glow-light)" filter="url(#rig-glow)"/>`,
      ),
  );

  // Tricorne à plumes : feutre, galon d'or, rosette à bijou, trois plumes qui ondulent.
  const hat = 'M150 80 Q156 62 180 66 Q206 40 244 54 Q262 58 282 82 Q262 92 240 88 Q212 98 186 92 Q162 92 150 80 Z';
  write(
    'headwear',
    'carnival_tricorn',
    'Tricorne du Carnaval',
    ['coat', 'coatDark', 'mantle', 'trim', 'under', 'beard'],
    [
      { id: 'back', bone: 'head', z: 52 },
      { id: 'front', bone: 'head', z: 80 },
      { id: 'plume', bone: 'head', z: 81 },
    ],
    'Tricorne du Carnaval : feutre aux trois bords relevés, galon d’or, rosette à bijou et trois grandes plumes qui ondulent.',
    layer('back', fill('M186 100 Q176 126 186 150 Q192 158 200 150 L198 120 Z', 'var(--c-beard)'), fill('M184 84 Q206 70 232 74 L230 84 Z', 'var(--c-coat-dark)')) +
      layer(
        'front',
        fill('M182 86 Q180 52 212 44 Q242 44 250 84 Z', 'var(--c-coat-dark)'),
        fill(hat, 'var(--c-coat)'),
        fill(hat, 'url(#rig-weave)'),
        fill('M150 80 Q156 62 180 66 Q190 78 196 92 Q186 92 172 90 Q158 88 150 80 Z', '#000', { opacity: 0.28 }),
        fill('M180 66 Q206 40 244 54 Q220 56 204 66 Q192 70 180 66 Z', '#FFFFFF', { opacity: 0.08 }),
        line('M150 80 Q156 62 180 66 Q206 40 244 54 Q262 58 282 82', 'var(--c-trim)', 2.6),
        line('M282 82 Q262 92 240 88 Q212 98 186 92 Q162 92 150 80', '#000', 1.6, { 'stroke-opacity': 0.4 }),
        line('M244 54 Q262 58 282 82', 'var(--c-glow)', 1.6, { 'stroke-opacity': 0.5 }),
      ) +
      layer(
        'plume',
        `<g class="fx-sway" style="--d:0s">${feather(196, 66, 170, 20, 120, 8, 9, 'var(--c-mantle)')}</g>`,
        `<g class="fx-sway" style="--d:-1.2s">${feather(198, 64, 184, 10, 150, -14, 7, 'var(--c-trim)')}</g>`,
        `<g class="fx-sway" style="--d:-2.4s">${feather(194, 68, 156, 44, 112, 46, 7, 'var(--c-under)')}</g>`,
        `<circle cx="196" cy="68" r="9" fill="var(--c-mantle)"/>`,
        line('M188 64 Q196 58 204 64 M188 72 Q196 78 204 72', 'var(--c-trim)', 1.2),
        `<circle cx="196" cy="68" r="3.8" fill="var(--c-trim)" class="fx-pulse" filter="url(#rig-glow)"/>`,
      ),
  );

  // Cape d'arlequin : losanges, ourlet festonné à grelots ; collerette plissée ; confettis.
  const cape = 'M168 160 Q128 260 120 404 Q134 420 148 406 Q160 424 176 410 Q190 428 206 412 Q220 428 236 410 Q250 426 264 406 Q278 418 286 400 Q276 270 254 164 Z';
  const ruffOuter = arc(212, 170, 52, 18, -4, 0, 2 * Math.PI, 36);
  // Collerette : un pli arrondi entre deux points du bord.
  const ruffD = `M${r1(ruffOuter[0][0])} ${r1(ruffOuter[0][1])}${ruffOuter.map(([x, y], i) => {
    const [nx, ny] = ruffOuter[(i + 1) % ruffOuter.length];
    return ` Q${r1((x + nx) / 2 + (x + nx - 424) * 0.12)} ${r1((y + ny) / 2 + (y + ny - 340) * 0.3)} ${r1(nx)} ${r1(ny)}`;
  }).join('')} Z`;
  const pleats = ruffOuter.map(([x, y]) => `M212 170 L${r1(x)} ${r1(y)}`).join(' ');
  write(
    'cape',
    'carnival_cape',
    'Cape du Carnaval',
    ['coat', 'mantle', 'trim', 'under'],
    [
      { id: 'back', bone: 'cape', z: 6 },
      { id: 'ruff', bone: 'torso', z: 74 },
      { id: 'confetti', bone: 'root', z: 91, detail: 2 },
    ],
    'Cape du Carnaval : losanges d’arlequin, ourlet festonné à grelots, collerette plissée, confettis.',
    layer(
      'back',
      `<defs><pattern id="rig-harlequin" width="28" height="40" patternUnits="userSpaceOnUse" patternTransform="rotate(-4)"><rect width="28" height="40" fill="var(--c-mantle)"/><path d="M14 0 L28 20 L14 40 L0 20 Z" fill="var(--c-coat)"/><path d="M14 0 L28 20 L14 40 L0 20 Z" fill="none" stroke="var(--c-trim)" stroke-width=".8" stroke-opacity=".7"/></pattern></defs>`,
      fill(cape, 'url(#rig-harlequin)'),
      fill(cape, 'url(#rig-fold)'),
      fill('M168 160 Q128 260 120 404 Q134 420 148 406 Q160 424 176 410 Q190 428 200 418 L200 160 Z', 'url(#rig-shade)'),
      line('M120 404 Q134 420 148 406 Q160 424 176 410 Q190 428 206 412 Q220 428 236 410 Q250 426 264 406 Q278 418 286 400', 'var(--c-trim)', 3),
      ...[[134, 416], [162, 420], [190, 424], [220, 424], [250, 420], [278, 412]].map(([x, y]) => `<circle cx="${x}" cy="${y + 7}" r="5" fill="var(--c-trim)"/><circle cx="${x - 1.5}" cy="${y + 5.5}" r="1.6" fill="#FFFFFF" opacity=".7"/><path d="M${x - 3} ${y + 9} h6" stroke="#000" stroke-opacity=".4"/>`),
      line('M254 164 Q276 270 286 400', 'var(--c-glow)', 2, { 'stroke-opacity': 0.45 }),
    ) +
      layer('ruff', fill(ruffD, 'var(--c-under)'), fill(ruffD, 'url(#rig-shade)'), line(pleats, '#000', 1, { 'stroke-opacity': 0.18 }), line(ruffD, 'var(--c-trim)', 1.2, { 'stroke-opacity': 0.8 })) +
      layer(
        'confetti',
        fallers(
          [
            [120, 40, 4, 0, 24],
            [300, 20, 4, 0.7, -18],
            [190, 0, 3, 1.4, 20],
            [340, 110, 4, 2.1, -22],
            [80, 180, 3, 2.8, 16],
            [260, 70, 4, 3.5, 14],
            [150, 230, 3, 4.2, -12],
            [320, 260, 4, 4.8, 12],
          ],
          (x, y, s) => `<rect x="${x}" y="${y}" width="${s * 1.6}" height="${s}" rx=".6" fill="${['var(--c-trim)', 'var(--c-mantle)', 'var(--c-under)', 'var(--c-glow)'][(x + y) % 4]}"/>`,
        ),
      ),
  );

  // Pourpoint à crevés : losanges sur le buste, manches bouffantes fendues sur la doublure.
  const torso = 'M150 176 Q200 156 254 166 Q266 216 258 306 Q206 322 156 306 Q144 240 150 176 Z';
  const puffFar = 'M240 180 Q262 166 284 178 Q300 220 300 262 Q284 280 268 280 Q250 230 240 180 Z';
  const puffNear = 'M146 176 Q170 166 186 186 Q186 232 178 272 Q156 282 134 272 Q130 220 146 176 Z';
  write(
    'top',
    'carnival_doublet',
    'Pourpoint du Carnaval',
    ['coat', 'coatDark', 'mantle', 'under', 'trim'],
    [
      { id: 'sleeve_far_upper', bone: 'upperarm_far', z: 24 },
      { id: 'forearm_far', bone: 'forearm_far', z: 25 },
      { id: 'torso', bone: 'torso', z: 36 },
      { id: 'under', bone: 'torso', z: 38 },
      { id: 'sleeve_near_upper', bone: 'upperarm_near', z: 66 },
      { id: 'forearm_near', bone: 'forearm_near', z: 67 },
    ],
    'Pourpoint du Carnaval : losanges d’arlequin sur le buste, manches bouffantes fendues qui laissent voir la doublure d’or.',
    layer(
      'sleeve_far_upper',
      fill(puffFar, 'var(--c-coat)'),
      line('M252 186 Q266 230 274 276 M266 178 Q282 224 288 272', 'var(--c-under)', 5),
      fill(puffFar, 'url(#rig-light)'),
      edge(puffFar, 0.4, 1.2),
      fill('M266 272 L302 258 L308 280 L274 296 Z', 'var(--c-coat-dark)'),
      line('M266 272 L302 258', 'var(--c-trim)', 2),
    ) +
      layer('forearm_far', fill('M278 292 L306 280 L343 240 L325 225 Z', 'var(--c-coat)'), line('M286 286 L332 236', 'var(--c-trim)', 1.2, { 'stroke-dasharray': '4 4' })) +
      layer(
        'torso',
        `<defs><pattern id="rig-doublet" width="24" height="34" patternUnits="userSpaceOnUse"><rect width="24" height="34" fill="var(--c-coat)"/><path d="M12 0 L24 17 L12 34 L0 17 Z" fill="var(--c-mantle)"/><path d="M12 0 L24 17 L12 34 L0 17 Z" fill="none" stroke="var(--c-trim)" stroke-width=".7" stroke-opacity=".6"/></pattern></defs>`,
        fill(torso, 'url(#rig-doublet)'),
        fill(torso, 'url(#rig-light)'),
        fill('M150 176 Q144 240 156 306 Q176 312 196 314 Q184 240 190 170 Z', 'url(#rig-shade)'),
        line('M254 166 Q266 216 258 306', 'var(--c-glow)', 2, { 'stroke-opacity': 0.5 }),
        line('M156 302 Q206 318 258 302', 'var(--c-trim)', 3),
      ) +
      layer(
        'under',
        fill('M198 160 L238 162 L222 206 Z', 'var(--c-under)'),
        line('M208 196 L208 300', 'var(--c-trim)', 1.4),
        ...[208, 228, 248, 268, 288].map((y) => `<circle cx="208" cy="${y}" r="2.6" fill="var(--c-trim)"/>`),
      ) +
      layer(
        'sleeve_near_upper',
        fill(puffNear, 'var(--c-coat)'),
        line('M152 184 Q146 230 146 272 M168 180 Q168 228 162 276', 'var(--c-under)', 5),
        fill(puffNear, 'url(#rig-shade)'),
        edge(puffNear, 0.4, 1.2),
        fill('M133 270 L176 276 L175 296 L131 290 Z', 'var(--c-coat-dark)'),
        line('M133 270 L176 276', 'var(--c-trim)', 2),
      ) +
      layer('forearm_near', fill('M136 288 L170 294 L158 370 L127 366 Z', 'var(--c-coat)'), fill('M136 288 L170 294 L158 370 L127 366 Z', 'url(#rig-shade)'), line('M150 300 L142 362', 'var(--c-trim)', 1.2, { 'stroke-dasharray': '4 4' })),
  );
}

// --- Abysses ------------------------------------------------------------------------------------------------------------

/** Spirale (nautile) centrée en (cx, cy). */
function spiral(cx, cy, r0, turns, start = 0) {
  const pts = [];
  for (let i = 0; i <= turns * 40; i++) {
    const a = start + (i / 40) * Math.PI * 2;
    const r = r0 * Math.exp(-0.28 * (a - start));
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.9]);
  }
  return pts;
}

function abyss() {
  // Couronne de corail : cheveux mouillés, diadème de nacre, branches de corail aux pointes lumineuses.
  const branches = [
    'M198 82 Q194 60 182 48 M190 62 Q176 60 170 50 M184 52 Q186 38 180 28',
    'M214 78 Q212 52 216 30 M214 56 Q226 46 232 36 M216 40 Q206 30 206 18 M216 32 Q220 18 218 8',
    'M234 82 Q242 62 256 52 M246 64 Q256 66 264 60 M252 56 Q254 42 262 34',
  ];
  const tips = [[182, 48], [170, 50], [180, 28], [232, 36], [206, 18], [218, 8], [264, 60], [262, 34]];
  write(
    'headwear',
    'abyss_crown',
    'Couronne des Abysses',
    ['beard', 'metal', 'under', 'trim'],
    [
      { id: 'back', bone: 'head', z: 52 },
      { id: 'front', bone: 'head', z: 58 },
      { id: 'crown', bone: 'head', z: 81 },
    ],
    'Couronne des Abysses : cheveux mouillés, diadème de nacre et de perles, branches de corail aux pointes qui luisent.',
    layer('back', fill('M192 88 Q168 118 170 178 Q172 214 160 244 L180 240 Q190 206 190 172 Q194 128 208 100 Z', 'var(--c-beard)'), line('M184 120 Q176 170 170 230', '#FFFFFF', 1, { 'stroke-opacity': 0.25 })) +
      layer(
        'front',
        fill('M183 112 Q176 82 200 68 Q228 58 248 82 Q236 76 222 78 Q204 80 197 98 Q193 112 191 128 Q185 122 183 112 Z', 'var(--c-beard)'),
        fill('M183 112 Q176 82 200 68 L208 72 Q198 84 197 98 Q193 112 191 128 Q185 122 183 112 Z', 'url(#rig-shade)'),
        line('M200 70 Q222 64 244 80', '#FFFFFF', 1.2, { 'stroke-opacity': 0.3 }),
      ) +
      layer(
        'crown',
        line(branches.join(' '), 'var(--c-under)', 6),
        line(branches.join(' '), '#000', 6, { 'stroke-opacity': 0.12, 'stroke-dasharray': '1 7' }),
        line(branches.join(' '), '#FFFFFF', 1.4, { 'stroke-opacity': 0.3 }),
        ...tips.map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="3.4" fill="var(--c-trim)" class="fx-pulse" style="animation-delay:${-i * 0.3}s" filter="url(#rig-glow)"/>`),
        plate('M184 84 Q214 72 248 82 L248 90 Q214 80 186 93 Z'),
        ...[[192, 86], [204, 82], [216, 80], [228, 80], [240, 83]].map(([x, y]) => `<circle cx="${x}" cy="${y + 3}" r="2.6" fill="#FFFFFF" opacity=".85"/>`),
        `<path d="M222 76 l4 -6 l4 6 l-4 5 Z" fill="var(--c-trim)" class="fx-pulse" filter="url(#rig-glow)"/>`,
      ),
  );

  // Cape d'algues : lanières de varech qui ondulent, vésicules, bernacles ; bulles qui montent.
  const strands = [
    [146, 172, 108, 560, 24, 'var(--c-mantle)', 0],
    [166, 168, 140, 620, 20, 'var(--c-coat-dark)', -0.6],
    [184, 166, 172, 590, 26, 'var(--c-mantle)', -1.4],
    [202, 166, 204, 646, 20, 'var(--c-coat-dark)', -2],
    [220, 166, 236, 604, 25, 'var(--c-mantle)', -1.1],
    [238, 168, 266, 632, 20, 'var(--c-coat-dark)', -2.6],
    [256, 170, 292, 566, 22, 'var(--c-mantle)', -1.8],
  ];
  const kelp = ([x0, y0, x1, y1, w, color, d]) => {
    const pts = Array.from({ length: 16 }, (_, i) => {
      const t = i / 15;
      return [x0 + (x1 - x0) * t + Math.sin(t * Math.PI * 3 + x0) * 9 * t, y0 + (y1 - y0) * t];
    });
    const ns = normals(pts);
    const wd = (i) => w * (0.55 + 0.45 * Math.sin((i / 15) * Math.PI * 0.9 + 0.3));
    const left = pts.map((p, i) => [p[0] + ns[i][0] * wd(i) / 2, p[1] + ns[i][1] * wd(i) / 2]);
    const right = pts.map((p, i) => [p[0] - ns[i][0] * wd(i) / 2, p[1] - ns[i][1] * wd(i) / 2]).reverse();
    const body = poly([...left, ...right]);
    const bladders = [5, 9, 13].map((i) => `<ellipse cx="${r1(pts[i][0] + wd(i) * 0.6)}" cy="${r1(pts[i][1])}" rx="4" ry="5.5" fill="${color}"/><ellipse cx="${r1(pts[i][0] + wd(i) * 0.6 - 1)}" cy="${r1(pts[i][1] - 2)}" rx="1.4" ry="2" fill="#FFFFFF" opacity=".35"/>`);
    // Frondes : petites feuilles de part et d'autre de la lanière.
    const fronds = [3, 6, 8, 11, 13].map((i) => {
      const [x, y] = pts[i];
      const s = i % 2 ? 1 : -1;
      return `M${r1(x)} ${r1(y)} q${r1(s * 14)} 4 ${r1(s * 16)} 16 q${r1(-s * 8)} -2 ${r1(-s * 16)} -16 Z`;
    }).join(' ');
    return `<g class="fx-sway" style="--d:${d}s">${fill(fronds, color)}${fill(body, color)}${fill(body, 'url(#rig-fold)')}${line(poly(pts, false), '#FFFFFF', 1, { 'stroke-opacity': 0.18 })}${bladders.join('')}</g>`;
  };
  write(
    'cape',
    'abyss_kelp',
    'Cape d’algues des Abysses',
    ['mantle', 'coatDark', 'metal', 'trim'],
    [
      { id: 'back', bone: 'cape', z: 6 },
      { id: 'drape', bone: 'torso', z: 75 },
      { id: 'bubbles', bone: 'root', z: 91, detail: 2 },
    ],
    'Cape d’algues des Abysses : lanières de varech qui ondulent, vésicules, bernacles et bulles qui montent.',
    layer(
      'back',
      fill('M164 160 Q140 210 136 262 Q206 280 276 262 Q270 210 254 164 Z', 'var(--c-coat-dark)'),
      ...strands.map(kelp),
      fill('M164 160 Q140 210 136 262 Q170 272 200 274 L200 160 Z', 'url(#rig-shade)'),
      ...[[160, 214], [176, 236], [240, 220], [228, 246], [196, 252]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.2" fill="var(--c-metal)"/><circle cx="${x}" cy="${y}" r="1.2" fill="#0B0D10" opacity=".5"/>`),
      line('M254 164 Q270 210 276 262', 'var(--c-glow)', 2, { 'stroke-opacity': 0.45 }),
    ) +
      layer(
        'drape',
        kelp([176, 166, 148, 262, 18, 'var(--c-mantle)', -0.4]),
        kelp([196, 164, 182, 250, 14, 'var(--c-coat-dark)', -1.6]),
        `<circle cx="186" cy="170" r="6" fill="var(--c-metal)"/><circle cx="186" cy="170" r="2.4" fill="var(--c-trim)" class="fx-pulse" filter="url(#rig-glow)"/>`,
      ) +
      layer(
        'bubbles',
        risers(
          [
            [130, 600, 4, 0],
            [280, 560, 3, 0.9],
            [200, 640, 5, 1.6],
            [96, 480, 3, 2.3],
            [320, 420, 4, 2.9],
            [250, 660, 3, 0.4],
            [160, 520, 3, 3.3],
          ],
          (x, y, s) => `<circle cx="${x}" cy="${y}" r="${s}" fill="none" stroke="var(--c-trim)" stroke-opacity=".8" stroke-width="1.2"/><circle cx="${x - s * 0.35}" cy="${y - s * 0.35}" r="${s * 0.25}" fill="#FFFFFF" opacity=".7"/>`,
        ),
      ),
  );

  // Épaulière en nautile : coquille de nacre enroulée, chambres, perle qui luit à l'ouverture.
  const sp = spiral(158, 190, 34, 2.2, -0.4);
  write(
    'shoulder_near',
    'abyss_shell',
    'Épaulière en nautile',
    ['metal', 'under', 'trim'],
    [{ id: 'pauldron', bone: 'upperarm_near', z: 76 }],
    'Épaulière en nautile : coquille de nacre enroulée, chambres striées, perle qui luit à l’ouverture.',
    layer(
      'pauldron',
      fill('M124 196 Q122 160 158 154 Q194 156 196 190 Q194 222 160 226 Q126 224 124 196 Z', 'var(--c-metal)'),
      fill('M124 196 Q122 160 158 154 Q194 156 196 190 Q194 222 160 226 Q126 224 124 196 Z', 'url(#rig-sheen)'),
      line(Array.from({ length: 9 }, (_, i) => {
        const a = -0.4 + i * 0.7;
        return `M${r1(158 + Math.cos(a) * 8)} ${r1(190 + Math.sin(a) * 7)} L${r1(158 + Math.cos(a) * 34)} ${r1(190 + Math.sin(a) * 31)}`;
      }).join(' '), 'var(--c-under)', 1.4, { 'stroke-opacity': 0.55 }),
      line(poly(sp, false), '#000', 2, { 'stroke-opacity': 0.4 }),
      line(poly(sp, false), '#FFFFFF', 0.8, { 'stroke-opacity': 0.5, transform: 'translate(-1 -1)' }),
      edge('M124 196 Q122 160 158 154 Q194 156 196 190 Q194 222 160 226 Q126 224 124 196 Z', 0.4, 1.4),
      fill('M126 206 Q140 230 168 226 Q150 214 146 200 Z', '#0B0D10', { opacity: 0.6 }),
      `<circle cx="146" cy="214" r="4.4" fill="var(--c-trim)" class="fx-pulse" filter="url(#rig-glow)"/>`,
    ),
  );

  // Ceinture de filet : corde, filet drapé côté proche, coquillages, étoile de mer à la boucle.
  const net = 'M154 304 L206 316 L188 372 Z';
  let mesh = '';
  for (let i = 1; i < 6; i++) mesh += `M${r1(154 + (206 - 154) * (i / 6))} ${r1(304 + 12 * (i / 6))} L${r1(154 + (188 - 154) * (i / 6) * 1.1)} ${r1(304 + (372 - 304) * (i / 6))} `;
  for (let i = 1; i < 6; i++) mesh += `M${r1(154 + (188 - 154) * (i / 6))} ${r1(304 + (372 - 304) * (i / 6))} L${r1(206 - (206 - 188) * (i / 6))} ${r1(316 + (372 - 316) * (i / 6))} `;
  const star = (cx, cy, r) => poly(Array.from({ length: 10 }, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.42 : r;
    return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr];
  }));
  write(
    'belt',
    'abyss_net',
    'Ceinture de filet des Abysses',
    ['mantle', 'metal', 'under', 'trim'],
    [
      { id: 'belt', bone: 'pelvis', z: 40 },
      { id: 'gear', bone: 'pelvis', z: 41 },
    ],
    'Ceinture de filet des Abysses : corde, filet drapé, coquillages et étoile de mer à la boucle.',
    layer('belt', line('M150 298 Q206 312 262 298', 'var(--c-coat-dark)', 10), line('M150 298 Q206 312 262 298', 'var(--c-mantle)', 3, { 'stroke-dasharray': '6 4' })) +
      layer(
        'gear',
        line(mesh + 'M154 304 L206 316 L188 372 Z', 'var(--c-metal)', 1, { 'stroke-opacity': 0.75 }),
        fill(star(212, 306, 11), 'var(--c-under)'),
        fill(star(212, 306, 11), 'url(#rig-shade)'),
        `<circle cx="212" cy="306" r="2.4" fill="var(--c-trim)" class="fx-pulse" filter="url(#rig-glow)"/>`,
        ...[[176, 340], [246, 318]].map(([x, y]) => `${fill(`M${x - 8} ${y} Q${x} ${y - 12} ${x + 8} ${y} Q${x} ${y + 6} ${x - 8} ${y} Z`, 'var(--c-metal)')}${line(`M${x} ${y + 4} L${x - 5} ${y - 6} M${x} ${y + 4} L${x} ${y - 9} M${x} ${y + 4} L${x + 5} ${y - 6}`, '#000', 0.8, { 'stroke-opacity': 0.3 })}`),
      ),
  );
}

// --- Versions par classe [demande de Louis, 23 octobre : « reconnaître les classes hors pose »] -----------------------
// Signature de chaque classe, gardée dans toutes les tenues : le Forgefeu montre son visage et sa barbe tressée, ses
// avant-bras nus et son tablier ; le Runiste a une capuche profonde (visage dans l'ombre) et une robe jusqu'aux pieds ;
// le Traqueur a un capuchon court à plume ou à crête, un carquois et une cape courte.

/** Robe longue du Runiste (géométrie de long_robe), ornée selon la saison. */
function longRobe(id, name, comment, deco) {
  const back = 'M150 316 L258 316 L310 634 Q206 652 102 634 Z';
  const far = 'M250 298 L210 310 L234 622 Q282 636 324 612 Q294 450 250 298 Z';
  const near = 'M160 298 L202 310 L182 626 Q140 634 100 618 Q120 450 160 298 Z';
  const cloth = deco.fill ?? 'var(--c-coat)';
  write(
    'robe',
    id,
    name,
    ['coat', 'coatDark', 'trim', 'mantle', 'under'],
    [
      { id: 'back', bone: 'cloth_back', z: 10 },
      { id: 'flap_far', bone: 'cloth_far', z: 30 },
      { id: 'flap_near', bone: 'cloth_near', z: 32 },
    ],
    comment,
    layer('back', deco.defs ?? '', fill(back, 'var(--c-coat-dark)'), ...(deco.back ?? [])) +
      layer(
        'flap_far',
        fill(far, cloth),
        fill(far, 'url(#rig-fold)'),
        fill(far, 'url(#rig-light)'),
        ...(deco.far ?? []),
        line('M210 310 L234 622 Q282 636 324 612', 'var(--c-trim)', 3),
        line('M322 608 Q294 450 252 304', 'var(--c-glow)', 2, { 'stroke-opacity': 0.6 }),
        ...(deco.hemFar ?? []),
      ) +
      layer(
        'flap_near',
        fill(near, cloth),
        fill(near, 'url(#rig-fold)'),
        fill(near, 'url(#rig-shade)'),
        ...(deco.near ?? []),
        line('M202 310 L182 626 Q140 634 100 618', 'var(--c-trim)', 3),
        ...(deco.hemNear ?? []),
      ),
  );
}

/** Capuchon court du Traqueur (géométrie de ranger_hood), avec une crête ou une plume selon la saison. */
function cowl(id, name, comment, deco) {
  const shell = 'M222 32 Q258 40 264 78 Q264 90 254 98 Q240 72 216 70 Q196 72 190 98 Q184 126 190 154 L160 174 Q128 134 142 84 Q160 38 222 32 Z';
  write(
    'headwear',
    id,
    name,
    ['coat', 'coatDark', 'mantle', 'leather', 'trim'],
    [
      { id: 'back', bone: 'head', z: 52 },
      { id: 'shadow', bone: 'head', z: 57 },
      { id: 'front', bone: 'head', z: 78 },
    ],
    comment,
    layer('back', fill('M188 96 Q198 66 218 62 Q240 66 248 92 L246 152 L186 154 Z', 'var(--c-shadow)'), fill('M190 112 Q160 124 150 178 L198 172 Z', 'var(--c-coat-dark)')) +
      layer('shadow', fill('M186 92 Q194 66 214 64 Q237 66 246 92 L246 104 Q216 95 188 109 Z', 'url(#rig-hood)')) +
      layer(
        'front',
        ...(deco.behind ?? []),
        fill('M148 100 Q124 128 118 164 Q138 152 156 146 Z', 'var(--c-coat-dark)'),
        fill(shell, deco.fill ?? 'var(--c-coat)'),
        fill(shell, 'url(#rig-weave)'),
        fill('M222 32 Q160 38 142 84 Q128 134 160 174 L190 154 Q184 126 190 98 Q194 78 204 70 Z', 'url(#rig-shade)'),
        line('M222 32 Q258 40 264 78 Q264 90 254 98', 'var(--c-glow)', 2, { 'stroke-opacity': 0.55 }),
        line('M190 98 Q196 72 216 70 Q240 72 254 98', 'var(--c-shadow)', 3),
        ...(deco.front ?? []),
      ),
  );
}

/** Capuche profonde du Runiste (géométrie de la capuche du Givre), visage dans l'ombre. */
function deepHood(id, name, comment, deco) {
  const shell = 'M214 12 Q258 20 270 70 Q270 86 258 96 Q246 70 216 64 Q194 66 186 96 Q180 126 186 164 L154 172 Q124 128 134 78 Q150 24 214 12 Z';
  write(
    'headwear',
    id,
    name,
    ['coat', 'coatDark', 'mantle', 'under', 'trim'],
    [
      { id: 'back', bone: 'head', z: 52 },
      { id: 'shadow', bone: 'head', z: 57 },
      { id: 'front', bone: 'head', z: 80 },
      { id: 'deco', bone: 'head', z: 81 },
    ],
    comment,
    layer('back', deco.defs ?? '', fill('M264 74 Q276 116 262 156 L240 170 Q252 130 250 96 Z', 'var(--c-coat-dark)'), fill('M188 96 Q198 66 216 62 Q238 66 250 96 L248 158 L184 160 Z', 'var(--c-shadow)'), ...(deco.back ?? [])) +
      layer('shadow', fill('M186 92 Q194 66 214 64 Q237 66 248 92 L248 110 Q216 98 188 114 Z', 'url(#rig-hood)')) +
      layer(
        'front',
        fill(shell, deco.fill ?? 'var(--c-coat)'),
        fill(shell, 'url(#rig-weave)'),
        fill('M214 12 Q150 24 134 78 Q124 128 154 172 L186 164 Q180 126 186 96 Q190 80 200 70 Z', 'url(#rig-shade)'),
        line('M214 12 Q258 20 270 70 Q270 86 258 96', 'var(--c-glow)', 2, { 'stroke-opacity': 0.5 }),
        line('M186 96 Q194 68 216 64 Q246 70 258 96', 'var(--c-shadow)', 3),
        ...(deco.front ?? []),
      ) +
      layer('deco', ...(deco.deco ?? [])),
  );
}

/** Lanière de varech (pour les capes d'algues), de (x0, y0) à (x1, y1). */
function kelpStrand([x0, y0, x1, y1, w, color, d]) {
  const pts = Array.from({ length: 16 }, (_, i) => {
    const t = i / 15;
    return [x0 + (x1 - x0) * t + Math.sin(t * Math.PI * 3 + x0) * 9 * t, y0 + (y1 - y0) * t];
  });
  const ns = normals(pts);
  const wd = (i) => w * (0.55 + 0.45 * Math.sin((i / 15) * Math.PI * 0.9 + 0.3));
  const left = pts.map((p, i) => [p[0] + (ns[i][0] * wd(i)) / 2, p[1] + (ns[i][1] * wd(i)) / 2]);
  const right = pts.map((p, i) => [p[0] - (ns[i][0] * wd(i)) / 2, p[1] - (ns[i][1] * wd(i)) / 2]).reverse();
  const body = poly([...left, ...right]);
  const fronds = [4, 8, 12].map((i) => {
    const [x, y] = pts[i];
    const s = i % 8 ? 1 : -1;
    return `M${r1(x)} ${r1(y)} q${r1(s * 12)} 4 ${r1(s * 14)} 14 q${r1(-s * 7)} -2 ${r1(-s * 14)} -14 Z`;
  }).join(' ');
  return `<g class="fx-sway" style="--d:${d}s">${fill(fronds, color)}${fill(body, color)}${fill(body, 'url(#rig-fold)')}${line(poly(pts, false), '#FFFFFF', 1, { 'stroke-opacity': 0.18 })}</g>`;
}

function classVersions() {
  // ---- Givre ----
  longRobe('frost_robe', 'Robe du Givre', 'Robe du Givre : longue, ourlet de fourrure, flocons-runes qui luisent sur les pans.', {
    far: [snowflake(268, 470, 12, { op: 0.9 }), snowflake(290, 560, 8, { op: 0.7 }), `<g class="fx-pulse">${snowflake(268, 470, 12, { w: 2.4, op: 0.35 })}</g>`],
    near: [snowflake(146, 500, 12, { op: 0.9 }), snowflake(130, 580, 8, { op: 0.7 }), line('M142 420 L180 418 M138 446 L178 444', 'var(--c-coat-dark)', 2)],
    hemFar: [fur([[232, 618], [280, 630], [324, 608]], 14, { bump: 3.4, step: 8 })],
    hemNear: [fur([[100, 614], [140, 628], [184, 622]], 14, { bump: 3.4, step: 8 })],
  });
  cowl('frost_cowl', 'Capuchon du Givre', 'Capuchon du Givre : capuchon de pisteur bordé de fourrure, plume blanche et petit éclat de glace.', {
    front: [
      fur([[254, 100], [242, 78], [218, 70], [198, 76], [190, 98], [188, 126], [192, 154]], 12, { bump: 3.4, step: 8 }),
      fill('M200 92 Q162 78 122 42 Q140 36 152 44 Q150 54 162 58 Q164 68 178 72 Q184 82 204 84 Z', 'var(--c-mantle)'),
      line('M200 90 Q160 76 124 44', '#000', 1, { 'stroke-opacity': 0.25 }),
      shard(206, 82, 18, 8, -50),
    ],
  });
  write(
    'headwear',
    'frost_cap',
    'Chapka du Givre',
    ['coat', 'coatDark', 'mantle', 'trim', 'beard'],
    [
      { id: 'back', bone: 'head', z: 52 },
      { id: 'front', bone: 'head', z: 80 },
    ],
    'Chapka du Givre : bonnet de fourrure à rabats noués, insigne d’éclat de glace ; le visage et la barbe restent découverts.',
    layer(
      'back',
      fill('M186 108 Q178 136 194 152 L202 132 Z', 'var(--c-beard)'),
      fur([[186, 96], [176, 116], [174, 138]], 18, { bump: 3.2, step: 7 }),
    ) +
      layer(
        'front',
        fill('M180 92 Q176 52 212 44 Q246 46 252 88 Z', 'var(--c-coat)'),
        fill('M180 92 Q176 52 212 44 Q246 46 252 88 Z', 'url(#rig-weave)'),
        fill('M180 92 Q176 52 212 44 Q198 60 198 90 Z', 'url(#rig-shade)'),
        line('M212 44 Q246 46 252 88', 'var(--c-glow)', 1.8, { 'stroke-opacity': 0.45 }),
        fur([[178, 96], [200, 86], [226, 82], [252, 88]], 18, { bump: 4, step: 8 }),
        // Rabat replié et noué sur le côté proche.
        fur([[176, 80], [168, 62], [178, 50]], 14, { bump: 3, step: 7 }),
        line('M176 52 Q190 44 200 50', 'var(--c-leather)', 2),
        shard(222, 86, 22, 10, 0),
        `<circle cx="222" cy="78" r="2.4" fill="#FFFFFF" class="fx-pulse" filter="url(#rig-glow)"/>`,
      ),
  );
  // Col de fourrure seul (Forgefeu : pas de grande cape, carrure dégagée), et cape courte du Traqueur.
  const collar = fur([[124, 204], [140, 182], [166, 168], [196, 170], [226, 168], [254, 170], [274, 190]], (t) => 30 + 16 * Math.sin(t * Math.PI), { bump: 7, step: 10 });
  const snow = fallers(
    [
      [120, 60, 3, 0, 14],
      [300, 20, 2.4, 0.8, -10],
      [180, 0, 2, 1.6, 20],
      [340, 120, 3, 2.3, -16],
      [90, 200, 2.2, 3.1, 12],
      [260, 80, 2.6, 3.9, 18],
    ],
    (x, y, s) => `<circle cx="${x}" cy="${y}" r="${s}" fill="#FFFFFF" opacity=".9"/>`,
  );
  write(
    'cape',
    'frost_shawl',
    'Col de fourrure du Givre',
    ['mantle', 'metal', 'trim'],
    [
      { id: 'collar', bone: 'torso', z: 74 },
      { id: 'snow', bone: 'root', z: 91, detail: 2 },
    ],
    'Col de fourrure du Givre : épais col de fourrure sur les épaules, fermoir à gemme de glace, neige qui tombe.',
    layer('collar', collar, plate('M204 186 L222 182 L228 202 L210 208 Z'), `<path d="M216 190 L222 196 L216 202 L210 196 Z" fill="var(--c-trim)" class="fx-pulse" filter="url(#rig-glow)"/>`) + layer('snow', snow),
  );
  const capelet = 'M170 160 Q128 280 116 410 L134 432 L150 412 L168 440 L188 414 L208 444 L228 414 L248 438 L264 410 L278 420 L276 330 Q272 250 252 164 Z';
  const capeletIcicles = [[134, 432, 14], [168, 440, 18], [208, 444, 20], [248, 438, 16]].map(([x, y, h]) => `M${x - 3} ${y - 4} L${x} ${y + h} L${x + 3} ${y - 4} Z`).join(' ');
  write(
    'cape',
    'frost_capelet',
    'Cape courte du Givre',
    ['coatDark', 'mantle', 'trim'],
    [
      { id: 'back', bone: 'cape', z: 6 },
      { id: 'collar', bone: 'torso', z: 74 },
      { id: 'snow', bone: 'root', z: 91, detail: 2 },
    ],
    'Cape courte du Givre : bord déchiqueté où pendent des glaçons, col de fourrure, neige qui tombe.',
    layer(
      'back',
      fill(capelet, 'var(--c-coat-dark)'),
      fill(capelet, 'url(#rig-weave)'),
      fill('M170 160 Q128 280 116 410 L134 432 L150 412 L168 440 L188 414 L200 430 L200 160 Z', 'url(#rig-shade)'),
      snowflake(160, 330, 9, { op: 0.5 }),
      snowflake(226, 360, 8, { op: 0.5 }),
      fill(capeletIcicles, 'var(--c-trim)', { opacity: 0.85 }),
      line('M252 164 Q272 250 276 330', 'var(--c-glow)', 2, { 'stroke-opacity': 0.45 }),
    ) +
      layer('collar', fur([[150, 188], [176, 172], [206, 172], [236, 170], [262, 180]], (t) => 22 + 10 * Math.sin(t * Math.PI), { bump: 5, step: 9 })) +
      layer('snow', snow),
  );

  // ---- Moissons ----
  longRobe('harvest_robe', 'Robe des Moissons', 'Robe des Moissons : pièces rapiécées, ourlet effiloché de paille, épis brodés.', {
    far: [
      fill('M252 380 L282 376 L288 412 L258 418 Z', 'var(--c-under)'),
      line('M252 380 L282 376 L288 412 L258 418 Z', 'var(--c-trim)', 1, { 'stroke-dasharray': '3 3' }),
      wheatEar(270, 560, 284, 500),
      wheatEar(280, 570, 300, 516, { grains: 5 }),
    ],
    near: [
      fill('M128 430 L162 428 L160 470 L126 470 Z', 'var(--c-mantle)'),
      fill('M128 430 L162 428 L160 470 L126 470 Z', 'url(#rig-weave)'),
      line('M128 430 L162 428 L160 470 L126 470 Z', 'var(--c-coat-dark)', 1, { 'stroke-dasharray': '3 3' }),
      fill('M146 520 L176 524 L172 548 L144 544 Z', 'var(--c-under)'),
    ],
    hemFar: [line('M240 622 l-2 16 M254 628 l1 18 M268 632 l-1 14 M282 632 l2 16 M296 628 l-1 14 M310 620 l3 14', 'var(--c-mantle)', 2.2)],
    hemNear: [line('M106 620 l-2 14 M120 626 l1 16 M134 630 l-1 14 M148 630 l2 15 M162 628 l-1 13 M176 626 l2 14', 'var(--c-mantle)', 2.2)],
  });
  deepHood('harvest_sackhood', 'Capuche de sac des Moissons', 'Capuche de sac des Moissons : toile de jute cousue à gros points, nouée d’une corde, paille qui dépasse.', {
    fill: 'var(--c-mantle)',
    front: [
      line('M214 12 Q186 60 186 96 M150 50 Q170 90 160 150', '#000', 1.6, { 'stroke-opacity': 0.3 }),
      line('M206 22 l10 6 M200 34 l10 6 M194 46 l10 6 M190 58 l10 6 M156 66 l10 -2 M156 84 l10 -2 M154 102 l10 -2 M154 120 l10 -2', 'var(--c-coat-dark)', 1.6),
      fill('M140 96 L162 92 L164 116 L142 120 Z', 'var(--c-under)', { opacity: 0.9 }),
      line('M140 96 L162 92 L164 116 L142 120 Z', 'var(--c-coat-dark)', 1, { 'stroke-dasharray': '2 3' }),
    ],
    deco: [
      fill('M186 160 Q214 172 244 160 L246 170 Q214 184 186 170 Z', 'var(--c-under)'),
      line('M206 172 Q198 194 204 210 M214 172 Q220 192 216 208', 'var(--c-under)', 3),
      line('M210 14 l-6 -14 M216 12 l2 -14 M222 14 l8 -12 M152 168 l-12 6 M160 170 l-6 12', 'var(--c-mantle)', 2.4),
      line('M210 14 l-6 -14 M216 12 l2 -14 M222 14 l8 -12', '#000', 2.4, { 'stroke-opacity': 0.15 }),
    ],
  });
  cowl('harvest_cowl', 'Capuchon des Moissons', 'Capuchon des Moissons : toile de jute, bandeau de corde et longue plume de faisan rayée.', {
    fill: 'var(--c-coat)',
    front: [
      fill('M190 88 Q216 76 252 92 L252 98 Q216 84 191 96 Z', 'var(--c-mantle)'),
      line('M194 88 l4 6 M204 85 l4 6 M214 83 l4 6 M224 83 l4 6 M234 84 l4 6 M244 87 l4 6', '#000', 1, { 'stroke-opacity': 0.3 }),
      fill('M200 90 Q150 70 104 30 Q118 30 132 40 Q150 58 204 84 Z', 'var(--c-under)'),
      line('M190 84 l-6 6 M176 76 l-6 6 M162 68 l-6 6 M148 58 l-6 6 M134 48 l-6 6 M120 38 l-6 6', 'var(--c-coat-dark)', 2.2),
      line('M200 88 Q150 68 106 32', '#FFFFFF', 0.9, { 'stroke-opacity': 0.5 }),
    ],
  });

  // ---- Carnaval ----
  longRobe('carnival_robe', 'Robe du Carnaval', 'Robe du Carnaval : losanges d’arlequin, galon d’or, grelots à l’ourlet.', {
    defs: `<defs><pattern id="rig-harlequin-robe" width="28" height="40" patternUnits="userSpaceOnUse"><rect width="28" height="40" fill="var(--c-coat)"/><path d="M14 0 L28 20 L14 40 L0 20 Z" fill="var(--c-mantle)"/><path d="M14 0 L28 20 L14 40 L0 20 Z" fill="none" stroke="var(--c-trim)" stroke-width=".8" stroke-opacity=".7"/></pattern></defs>`,
    fill: 'url(#rig-harlequin-robe)',
    hemFar: [...[[240, 630], [266, 638], [292, 632], [318, 620]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="var(--c-trim)"/><circle cx="${x - 1.5}" cy="${y - 1.5}" r="1.6" fill="#FFFFFF" opacity=".7"/>`)],
    hemNear: [...[[106, 626], [132, 634], [158, 636], [182, 632]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="var(--c-trim)"/><circle cx="${x - 1.5}" cy="${y - 1.5}" r="1.6" fill="#FFFFFF" opacity=".7"/>`)],
  });
  deepHood('carnival_hood', 'Capuche du Carnaval', 'Capuche du Carnaval : capuche d’arlequin dont la pointe retombe avec un grelot ; le masque luit dans l’ombre.', {
    defs: `<defs><pattern id="rig-harlequin-hood" width="22" height="30" patternUnits="userSpaceOnUse"><rect width="22" height="30" fill="var(--c-coat)"/><path d="M11 0 L22 15 L11 30 L0 15 Z" fill="var(--c-mantle)"/></pattern></defs>`,
    fill: 'url(#rig-harlequin-hood)',
    back: [`<defs><pattern id="rig-harlequin-hood" width="22" height="30" patternUnits="userSpaceOnUse"><rect width="22" height="30" fill="var(--c-coat)"/><path d="M11 0 L22 15 L11 30 L0 15 Z" fill="var(--c-mantle)"/></pattern></defs>`],
    front: [line('M214 12 Q258 20 270 70 Q270 86 258 96', 'var(--c-trim)', 2.4), line('M186 96 Q194 68 216 64 Q246 70 258 96', 'var(--c-trim)', 2)],
    deco: [
      `<g class="fx-sway" style="--d:-0.8s">${fill('M150 40 Q118 46 108 82 Q104 100 112 114 Q118 92 132 74 Q144 60 160 54 Z', 'var(--c-mantle)')}${line('M150 40 Q118 46 108 82 Q104 100 112 114', 'var(--c-trim)', 1.6)}<circle cx="112" cy="120" r="6" fill="var(--c-trim)"/><circle cx="110" cy="118" r="1.8" fill="#FFFFFF" opacity=".7"/></g>`,
    ],
  });
  // Masque du Carnaval porté par le Forgefeu : la barbe tressée reste visible sous le masque.
  write(
    'face',
    'carnival_mask_beard',
    'Masque du Carnaval (barbe)',
    ['under', 'mantle', 'trim', 'beard', 'metal'],
    [
      { id: 'ribbon', bone: 'head', z: 52 },
      { id: 'features', bone: 'head', z: 56 },
      { id: 'mask', bone: 'head', z: 58 },
      { id: 'eyes', bone: 'head', z: 59 },
    ],
    'Masque du Carnaval porté sur la barbe tressée du Forgefeu : le masque couvre le haut du visage, la barbe et sa bague restent visibles.',
    layer('ribbon', fill('M196 96 Q180 98 172 108 Q164 130 156 156 L166 158 Q172 132 182 114 Q188 106 198 104 Z', 'var(--c-mantle)')) +
      layer(
        'features',
        fill('M188 114 Q188 150 212 170 Q238 162 245 124 Q236 132 226 131 Q212 129 202 120 Z', 'var(--c-beard)'),
        fill('M188 114 Q188 150 212 170 L210 128 Q202 124 198 118 Z', 'url(#rig-shade)'),
        fill('M218 126 Q230 116 247 120 Q246 127 240 128 Q232 124 226 130 Z', 'var(--c-beard)'),
        line('M212 168 L214 190', 'var(--c-beard)', 7),
        `<rect x="207" y="176" width="13" height="6" rx="2" fill="var(--c-metal)" transform="rotate(4 213 179)"/>`,
      ) +
      layer(
        'mask',
        fill('M194 88 Q210 74 238 78 Q254 84 252 98 L302 124 Q306 132 298 136 L250 122 Q240 126 222 122 Q204 118 196 110 Q190 100 194 88 Z', 'var(--c-under)'),
        fill('M194 88 Q210 74 238 78 Q254 84 252 98 L302 124 Q306 132 298 136 L250 122 Q240 126 222 122 Q204 118 196 110 Q190 100 194 88 Z', 'url(#rig-sheen)'),
        fill('M226 82 l5 -6 l5 6 l-5 6 Z M212 84 l4 -5 l4 5 l-4 5 Z M240 86 l4 -4 l4 4 l-4 4 Z', 'var(--c-mantle)'),
        line('M198 108 Q206 116 222 118 Q238 118 246 110 M254 104 Q276 114 298 128', 'var(--c-trim)', 1.6),
        `<ellipse cx="219" cy="101" rx="7" ry="4.6" fill="#0B0D10"/><ellipse cx="237" cy="100" rx="4.6" ry="3.8" fill="#0B0D10"/>`,
        `<path d="M231 72 l4 -7 l4 7 l-4 5 Z" fill="var(--c-trim)" class="fx-pulse" filter="url(#rig-glow)"/>`,
      ) +
      layer('eyes', `<ellipse cx="219" cy="101" rx="3" ry="1.5" fill="var(--c-glow-light)" class="fx-pulse" filter="url(#rig-glow)"/><ellipse cx="237" cy="100" rx="2.2" ry="1.3" fill="var(--c-glow-light)" class="fx-pulse" filter="url(#rig-glow)"/>`),
  );

  // ---- Abysses ----
  const scales = `<defs><pattern id="rig-scales" width="12" height="9" patternUnits="userSpaceOnUse"><path d="M0 9 Q6 0 12 9" fill="none" stroke="#000" stroke-opacity=".28" stroke-width="1"/><path d="M-6 4.5 Q0 -4.5 6 4.5 M6 4.5 Q12 -4.5 18 4.5" fill="none" stroke="#FFFFFF" stroke-opacity=".12" stroke-width=".8"/></pattern></defs>`;
  longRobe('abyss_robe', 'Robe des Abysses', 'Robe des Abysses : écailles, points lumineux comme des lucioles des grands fonds, lanières d’algues à l’ourlet.', {
    defs: scales,
    far: [fill('M250 298 L210 310 L234 622 Q282 636 324 612 Q294 450 250 298 Z', 'url(#rig-scales)'), ...[[262, 400], [282, 470], [270, 540], [300, 580]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="2.6" fill="var(--c-trim)" class="fx-pulse" style="animation-delay:${-i * 0.6}s" filter="url(#rig-glow)"/>`)],
    near: [fill('M160 298 L202 310 L182 626 Q140 634 100 618 Q120 450 160 298 Z', 'url(#rig-scales)'), ...[[150, 420], [130, 500], [160, 570]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="2.4" fill="var(--c-trim)" class="fx-pulse" style="animation-delay:${-i * 0.7}s" filter="url(#rig-glow)"/>`)],
    hemFar: [kelpStrand([250, 626, 246, 690, 10, 'var(--c-mantle)', -0.5]), kelpStrand([300, 620, 310, 680, 9, 'var(--c-mantle)', -1.5])],
    hemNear: [kelpStrand([120, 622, 112, 684, 10, 'var(--c-mantle)', -1]), kelpStrand([164, 628, 160, 692, 9, 'var(--c-mantle)', -2])],
  });
  const coral = 'M196 30 Q190 10 176 2 M190 16 Q178 14 172 6 M216 18 Q216 0 222 -12 M216 4 Q226 -2 232 -8 M236 30 Q246 14 258 8 M248 18 Q256 20 262 14';
  deepHood('abyss_hood', 'Capuche des Abysses', 'Capuche des Abysses : écailles, corail qui pousse sur la capuche aux pointes qui luisent, rang de perles autour du visage.', {
    defs: scales,
    front: [fill('M214 12 Q258 20 270 70 Q270 86 258 96 Q246 70 216 64 Q194 66 186 96 Q180 126 186 164 L154 172 Q124 128 134 78 Q150 24 214 12 Z', 'url(#rig-scales)')],
    deco: [
      line(coral, 'var(--c-under)', 6),
      line(coral, '#FFFFFF', 1.4, { 'stroke-opacity': 0.3 }),
      ...[[176, 2], [172, 6], [222, -12], [232, -8], [258, 8], [262, 14]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="3.2" fill="var(--c-trim)" class="fx-pulse" style="animation-delay:${-i * 0.35}s" filter="url(#rig-glow)"/>`),
      ...resample([[252, 96], [240, 76], [218, 68], [198, 74], [190, 96], [188, 126], [192, 156]], 9).map(([x, y]) => `<circle cx="${r1(x)}" cy="${r1(y)}" r="2.8" fill="var(--c-metal)"/><circle cx="${r1(x - 0.8)}" cy="${r1(y - 0.8)}" r=".9" fill="#FFFFFF" opacity=".8"/>`),
    ],
  });
  cowl('abyss_cowl', 'Capuchon des Abysses', 'Capuchon des Abysses : écailles, crête de nageoire translucide, perle au bandeau.', {
    behind: [
      fill('M226 34 L214 2 L208 30 L196 4 L192 34 L178 12 L178 42 L160 26 L166 56 L150 46 L158 70 Z', 'var(--c-trim)', { opacity: 0.45 }),
      line('M214 2 L212 34 M196 4 L198 36 M178 12 L184 42 M160 26 L172 56 M150 46 L164 70', 'var(--c-coat-dark)', 2),
    ],
    front: [
      fill('M190 88 Q216 76 252 92 L252 98 Q216 84 191 96 Z', 'var(--c-coat-dark)'),
      `<circle cx="212" cy="86" r="4" fill="var(--c-metal)"/><circle cx="212" cy="86" r="1.8" fill="var(--c-trim)" class="fx-pulse" filter="url(#rig-glow)"/>`,
    ],
  });
  write(
    'cape',
    'abyss_kelp_short',
    'Cape courte d’algues des Abysses',
    ['mantle', 'coatDark', 'metal', 'trim'],
    [
      { id: 'back', bone: 'cape', z: 6 },
      { id: 'bubbles', bone: 'root', z: 91, detail: 2 },
    ],
    'Cape courte d’algues des Abysses : lanières de varech jusqu’aux hanches, bernacles, bulles qui montent.',
    layer(
      'back',
      fill('M164 160 Q140 210 136 262 Q206 280 276 262 Q270 210 254 164 Z', 'var(--c-coat-dark)'),
      ...[
        [150, 172, 128, 420, 22, 'var(--c-mantle)', 0],
        [174, 168, 162, 450, 20, 'var(--c-coat-dark)', -0.8],
        [198, 166, 196, 440, 24, 'var(--c-mantle)', -1.6],
        [222, 166, 232, 452, 20, 'var(--c-coat-dark)', -2.2],
        [246, 168, 266, 426, 22, 'var(--c-mantle)', -1.2],
      ].map(kelpStrand),
      ...[[164, 214], [236, 222], [200, 248]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.2" fill="var(--c-metal)"/>`),
    ) +
      layer(
        'bubbles',
        risers(
          [
            [130, 600, 4, 0],
            [280, 560, 3, 0.9],
            [200, 640, 5, 1.6],
            [320, 420, 4, 2.9],
          ],
          (x, y, s) => `<circle cx="${x}" cy="${y}" r="${s}" fill="none" stroke="var(--c-trim)" stroke-opacity=".8" stroke-width="1.2"/>`,
        ),
      ),
  );
}

// --- Halloween : « La Veillée des Courges » (essai, 23 octobre) ------------------------------------------------------
// Dessiné dans le budget d'affichage mesuré par art/perf.mjs : pas de flou (rig-glow) mais des halos en dégradé
// (rig-halo, rig-halo-trim, ou un dégradé propre à la pièce), peu de matières, des animations CSS légères.
// Les pièces emblématiques gardent leur couleur quelle que soit la tenue (citrouille orange, corbeau noir, loup gris, os) :
// une variable propre avec sa valeur par défaut, var(--c-pumpkin, #E8761E), qu'une tenue pourrait encore changer.

const PUMPKIN = 'var(--c-pumpkin, #E8761E)';
const PUMPKIN_DARK = 'var(--c-pumpkin-dark, #A8480E)';
const CARVED = 'var(--c-carved, #FFC24A)';
const CROW = 'var(--c-crow, #1D1F2A)';
const WOLF = 'var(--c-wolf, #6E6A72)';
const BONE = 'var(--c-bone, #DCD3BC)';
const GHOST = 'var(--c-ghost, #D6FFE6)';

/** Halo sans flou (fausse lueur). */
const halo = (cx, cy, r, kind = 'glow', o = {}) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#rig-halo${kind === 'trim' ? '-trim' : ''})"${o.cls ? ` class="${o.cls}"` : ''}/>`;
/** Dégradé de flamme de citrouille (propre à la pièce, rendu unique par le moteur). */
const carvedGlow = `<defs><radialGradient id="rig-carved"><stop offset="0" stop-color="${CARVED}" stop-opacity=".9"/><stop offset=".5" stop-color="${CARVED}" stop-opacity=".35"/><stop offset="1" stop-color="${CARVED}" stop-opacity="0"/></radialGradient></defs>`;

/** Citrouille sculptée centrée en (cx, cy), avec un visage tourné vers la droite. */
function pumpkin(cx, cy, rx, ry, face = true) {
  const body = `M${cx} ${cy - ry} C${cx + rx * 1.1} ${cy - ry} ${cx + rx * 1.1} ${cy + ry} ${cx} ${cy + ry} C${cx - rx * 1.1} ${cy + ry} ${cx - rx * 1.1} ${cy - ry} ${cx} ${cy - ry} Z`;
  const ribs = [-0.62, -0.25, 0.18, 0.55].map((k) => `M${r1(cx + rx * k * 0.5)} ${r1(cy - ry * 0.96)} Q${r1(cx + rx * k * 1.25)} ${cy} ${r1(cx + rx * k * 0.5)} ${r1(cy + ry * 0.96)}`).join(' ');
  const out = [fill(body, PUMPKIN), fill(`M${cx} ${cy - ry} C${cx - rx * 1.1} ${cy - ry} ${cx - rx * 1.1} ${cy + ry} ${cx} ${cy + ry} C${cx - rx * 0.5} ${cy + ry * 0.6} ${cx - rx * 0.5} ${cy - ry * 0.6} ${cx} ${cy - ry} Z`, PUMPKIN_DARK, { opacity: 0.55 }), line(ribs, PUMPKIN_DARK, 2.2, { 'stroke-opacity': 0.8 }), line(`M${r1(cx + rx * 0.35)} ${r1(cy - ry * 0.8)} Q${r1(cx + rx * 0.85)} ${r1(cy - ry * 0.4)} ${r1(cx + rx * 0.8)} ${r1(cy + ry * 0.1)}`, '#FFFFFF', 2, { 'stroke-opacity': 0.3 })];
  if (face) {
    const ex = (dx, dy, s) => `M${r1(cx + dx - s)} ${r1(cy + dy + s * 0.7)} L${r1(cx + dx)} ${r1(cy + dy - s)} L${r1(cx + dx + s)} ${r1(cy + dy + s * 0.7)} Z`;
    const carved = `${ex(rx * 0.12, -ry * 0.18, rx * 0.17)} ${ex(rx * 0.58, -ry * 0.2, rx * 0.12)} ${ex(rx * 0.42, ry * 0.12, rx * 0.08)} M${r1(cx - rx * 0.05)} ${r1(cy + ry * 0.36)} L${r1(cx + rx * 0.12)} ${r1(cy + ry * 0.5)} L${r1(cx + rx * 0.26)} ${r1(cy + ry * 0.38)} L${r1(cx + rx * 0.42)} ${r1(cy + ry * 0.54)} L${r1(cx + rx * 0.58)} ${r1(cy + ry * 0.36)} L${r1(cx + rx * 0.72)} ${r1(cy + ry * 0.42)} Q${r1(cx + rx * 0.4)} ${r1(cy + ry * 0.78)} ${r1(cx - rx * 0.05)} ${r1(cy + ry * 0.36)} Z`;
    out.push(fill(carved, '#1A0E06'), `<g class="fx-flicker">${fill(carved, CARVED, { opacity: 0.92 })}<circle cx="${r1(cx + rx * 0.35)}" cy="${r1(cy + ry * 0.1)}" r="${r1(rx * 0.95)}" fill="url(#rig-carved)"/></g>`);
  }
  return out;
}

/** Petite lanterne d'âme centrée en (x, y) : armature, verre, flamme spectrale. */
const lantern = (x, y, s = 1) =>
  [
    halo(x, y + 2 * s, 20 * s),
    fill(`M${x - 7 * s} ${y - 9 * s} L${x + 7 * s} ${y - 9 * s} L${x + 5 * s} ${y + 10 * s} L${x - 5 * s} ${y + 10 * s} Z`, '#0E1A14', { opacity: 0.55 }),
    `<path class="fx-flicker" d="M${x} ${y + 6 * s} Q${x - 5 * s} ${y} ${x} ${y - 6 * s} Q${x + 5 * s} ${y} ${x} ${y + 6 * s} Z" fill="var(--c-glow)"/>`,
    line(`M${x - 7 * s} ${y - 9 * s} L${x + 7 * s} ${y - 9 * s} L${x + 5 * s} ${y + 10 * s} L${x - 5 * s} ${y + 10 * s} Z M${x} ${y - 9 * s} L${x} ${y + 10 * s} M${x} ${y - 9 * s} Q${x} ${y - 16 * s} ${x + 4 * s} ${y - 16 * s}`, 'var(--c-metal)', 1.6 * s),
  ].join('');

/** Toile d'araignée dans un coin (x, y), de rayon r, ouverte vers (dx, dy). */
function cobweb(x, y, r, a0, a1) {
  let d = '';
  const n = 5;
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    d += `M${x} ${y} L${r1(x + Math.cos(a) * r)} ${r1(y + Math.sin(a) * r)} `;
  }
  for (const k of [0.35, 0.65, 0.95]) {
    const pts = Array.from({ length: n + 1 }, (_, i) => {
      const a = a0 + ((a1 - a0) * i) / n;
      return [x + Math.cos(a) * r * k, y + Math.sin(a) * r * k];
    });
    d += `M${r1(pts[0][0])} ${r1(pts[0][1])}` + pts.slice(1).map((p, i) => ` Q${r1((pts[i][0] + p[0]) / 2 - (p[0] - x) * 0.08)} ${r1((pts[i][1] + p[1]) / 2 - (p[1] - y) * 0.08)} ${r1(p[0])} ${r1(p[1])}`).join('') + ' ';
  }
  return line(d, '#F1F0EC', 0.7, { 'stroke-opacity': 0.55 });
}

function halloween() {
  // ---- Pièces à part, pour toutes les classes ----
  write(
    'headwear',
    'halloween_pumpkin',
    'Tête de citrouille',
    ['pumpkin', 'carved'],
    [{ id: 'head', bone: 'head', z: 82 }],
    'Tête de citrouille : elle remplace la tête ; visage sculpté qui flambe, tige et vrille.',
    layer(
      'head',
      carvedGlow,
      ...pumpkin(216, 106, 50, 46),
      fill('M212 62 Q210 48 220 38 Q228 34 230 40 Q222 46 222 62 Z', 'var(--c-stem, #4E5A2A)'),
      line('M222 44 Q238 34 236 22 Q230 16 226 24', 'var(--c-stem, #4E5A2A)', 2),
      fill('M226 52 Q246 40 254 52 Q240 60 226 56 Z', 'var(--c-stem, #5E6E30)'),
    ),
  );

  const brimBack = arc(214, 82, 76, 15, -6, Math.PI, 2 * Math.PI);
  const brimFront = arc(214, 82, 76, 15, -6, 0, Math.PI);
  const cone = 'M182 82 Q190 44 204 14 Q214 -8 234 -18 Q254 -24 266 -8 Q248 -12 236 0 Q224 16 228 42 Q234 62 248 80 Q214 90 182 82 Z';
  write(
    'headwear',
    'halloween_witch_hat',
    'Chapeau de sorcière',
    ['coatDark', 'under', 'metal', 'beard'],
    [
      { id: 'back', bone: 'head', z: 52 },
      { id: 'shadow', bone: 'head', z: 57 },
      { id: 'front', bone: 'head', z: 80 },
    ],
    'Chapeau de sorcière : grand bord, pointe tordue d’où pend une lune, bandeau à boucle ; mèches longues dans le dos.',
    layer('back', fill('M190 92 Q170 130 176 196 L192 190 Q190 140 204 104 Z', 'var(--c-beard)'), fill(`${poly(brimBack, false)} Z`, 'var(--c-coat-dark)'), fill(`${poly(brimBack, false)} Z`, '#000', { opacity: 0.3 })) +
      layer('shadow', fill('M184 90 Q214 84 248 90 L248 108 Q214 98 186 112 Z', '#000', { opacity: 0.35 })) +
      layer(
        'front',
        fill(cone, 'var(--c-coat-dark)'),
        fill('M182 82 Q190 44 204 14 Q214 -8 234 -18 Q214 0 206 30 Q198 58 200 86 Z', '#000', { opacity: 0.3 }),
        line('M234 -18 Q254 -24 266 -8 M228 42 Q234 62 248 80', 'var(--c-glow)', 1.6, { 'stroke-opacity': 0.5 }),
        line('M196 50 Q204 46 212 52 M220 30 l6 4', '#000', 1.4, { 'stroke-opacity': 0.4 }),
        fill('M183 72 Q214 80 248 70 L249 82 Q214 92 183 84 Z', 'var(--c-under)'),
        plate('M206 72 L222 74 L221 88 L205 86 Z'),
        fill('M210 76 L218 77 L217 84 L209 83 Z', 'var(--c-under)'),
        fill(`${poly(brimFront, false)} Z`, 'var(--c-coat-dark)'),
        line(poly(brimFront, false), '#000', 1.4, { 'stroke-opacity': 0.4 }),
        line(poly(arc(214, 82, 76, 15, -6, 0.2, 1.3, 8), false), '#FFFFFF', 1, { 'stroke-opacity': 0.2 }),
        `<g class="fx-sway" style="--d:-1s">${line('M266 -8 L268 14', '#C9C2B0', 0.8)}${fill('M268 14 A8 8 0 1 0 274 28 A6 6 0 1 1 268 14 Z', BONE)}${halo(270, 21, 12, 'glow')}</g>`,
      ),
  );

  write(
    'shoulder_near',
    'halloween_crow',
    'Corbeau sur l’épaule',
    ['crow'],
    [{ id: 'crow', bone: 'upperarm_near', z: 79 }],
    'Corbeau sur l’épaule : il penche la tête, cligne de l’œil et lisse ses plumes.',
    layer(
      'crow',
      '<g transform="translate(148 178) scale(1.35) translate(-148 -178)">',
      line('M144 168 L140 178 M152 168 L152 178', '#2A2016', 2.2),
      fill('M130 150 Q126 172 108 190 Q122 186 132 176 Q130 186 118 198 Q138 188 146 164 Z', CROW),
      fill('M130 150 Q140 136 158 142 Q166 154 156 166 Q140 172 130 162 Z', CROW),
      `<g class="fx-flap-r" style="animation-duration:6s">${fill('M134 150 Q150 144 160 156 Q148 168 128 168 Z', CROW)}${line('M138 156 Q148 152 156 158 M134 162 Q146 160 152 164', '#4A5A8A', 1, { 'stroke-opacity': 0.6 })}</g>`,
      line('M132 150 Q142 140 156 144 M130 160 Q120 176 110 188', '#7F95C8', 1.6, { 'stroke-opacity': 0.7 }),
      `<g class="fx-tilt">${fill('M150 140 Q152 124 166 124 Q176 128 174 140 Q166 148 152 146 Z', CROW)}${fill('M172 130 L190 136 L172 140 Z', '#3A3226')}${line('M172 135 L186 136', '#000', 0.8, { 'stroke-opacity': 0.5 })}<g class="fx-blink">${halo(166, 131, 7, 'trim')}<circle cx="166" cy="131" r="2.2" fill="var(--c-carved, #FFC24A)"/></g>${line('M152 128 Q160 122 170 124', '#7F95C8', 1.4, { 'stroke-opacity': 0.7 })}</g>`,
      '</g>',
    ),
  );

  const wingL = 'M204 172 Q160 168 118 196 Q92 214 70 262 Q90 254 102 268 Q104 300 120 330 Q132 312 148 316 Q154 352 176 380 Q186 356 204 356 Z';
  const wingR = 'M208 172 Q252 166 290 192 Q316 210 330 254 Q312 248 300 262 Q298 296 284 322 Q272 304 258 308 Q252 344 232 372 Q222 350 208 352 Z';
  write(
    'cape',
    'halloween_bat_cape',
    'Cape chauve-souris',
    ['coatDark', 'under', 'metal'],
    [
      { id: 'wings', bone: 'cape', z: 6 },
      { id: 'collar', bone: 'torso', z: 50 },
    ],
    'Cape chauve-souris : deux ailes à nervures qui battent doucement, haut col dressé doublé de rouge.',
    layer(
      'wings',
      `<g class="fx-flap-l">${fill(wingL, 'var(--c-coat-dark)')}${fill(wingL, 'var(--c-under)', { opacity: 0.45 })}${fill(wingL, 'url(#rig-shade)')}${line('M118 196 L70 262 M118 196 L102 268 M118 196 L120 330 M140 188 L148 316 M160 182 L176 380', '#F1F0EC', 1.4, { 'stroke-opacity': 0.35 })}${line('M204 172 Q160 168 118 196 Q92 214 70 262', '#FFFFFF', 1, { 'stroke-opacity': 0.18 })}</g>`,
      `<g class="fx-flap-r">${fill(wingR, 'var(--c-coat-dark)')}${fill(wingR, 'var(--c-under)', { opacity: 0.45 })}${line('M290 192 L330 254 M290 192 L300 262 M290 192 L284 322 M266 184 L258 308 M246 178 L232 372', '#F1F0EC', 1.4, { 'stroke-opacity': 0.35 })}${line('M208 172 Q252 166 290 192 Q316 210 330 254', 'var(--c-glow)', 1.6, { 'stroke-opacity': 0.45 })}</g>`,
    ) +
      layer(
        'collar',
        fill('M178 178 Q156 150 150 110 Q170 126 192 140 Z', 'var(--c-coat-dark)'),
        fill('M180 172 Q164 150 160 124 Q174 136 190 146 Z', 'var(--c-under)'),
        fill('M236 172 Q258 146 266 106 Q246 124 226 138 Z', 'var(--c-coat-dark)'),
        fill('M234 166 Q250 146 256 122 Q242 134 228 144 Z', 'var(--c-under)'),
        line('M150 110 Q156 150 178 178 M266 106 Q258 146 236 172', '#000', 1.2, { 'stroke-opacity': 0.4 }),
      ),
  );

  write(
    'effect',
    'halloween_mist',
    'Brume de la Veillée',
    ['ghost', 'glow'],
    [
      { id: 'floor', bone: 'root', z: 1, detail: 2 },
      { id: 'ghosts', bone: 'root', z: 91, detail: 2 },
    ],
    'Brume de la Veillée : une brume qui traîne au sol et deux petits fantômes qui montent.',
    layer(
      'floor',
      `<defs><radialGradient id="rig-mist"><stop offset="0" stop-color="${GHOST}" stop-opacity=".55"/><stop offset="1" stop-color="${GHOST}" stop-opacity="0"/></radialGradient></defs>`,
      `<ellipse class="fx-drift" cx="170" cy="690" rx="90" ry="18" fill="url(#rig-mist)"/>`,
      `<ellipse class="fx-drift" style="--d:-4s" cx="250" cy="696" rx="80" ry="14" fill="url(#rig-mist)"/>`,
      `<ellipse class="fx-drift" style="--d:-7s" cx="200" cy="704" rx="120" ry="12" fill="url(#rig-mist)"/>`,
    ) +
      layer(
        'ghosts',
        ...[[110, 640, 0], [300, 600, -3]].map(([x, y, d]) => `<g class="fx-ghost" style="--d:${d}s">${fill(`M${x - 10} ${y + 12} Q${x - 12} ${y - 14} ${x} ${y - 16} Q${x + 12} ${y - 14} ${x + 10} ${y + 12} Q${x + 6} ${y + 8} ${x + 3} ${y + 13} Q${x} ${y + 8} ${x - 3} ${y + 13} Q${x - 6} ${y + 8} ${x - 10} ${y + 12} Z`, GHOST, { opacity: 0.85 })}<ellipse cx="${x - 3}" cy="${y - 5}" rx="1.8" ry="2.6" fill="#1A2420"/><ellipse cx="${x + 4}" cy="${y - 5}" rx="1.8" ry="2.6" fill="#1A2420"/></g>`),
      ),
  );

  // ---- Runiste : Veilleur des Âmes ----
  deepHood('halloween_tatter_hood', 'Capuche du Veilleur des Âmes', 'Capuche du Veilleur des Âmes : en lambeaux, cousue de runes spectrales qui luisent.', {
    front: [
      fill('M154 172 L160 196 L168 174 L176 200 L184 170 Z M136 120 L122 132 L138 136 L126 150 L144 148 Z', 'var(--c-coat)'),
      line('M160 96 l8 -10 l4 12 l8 -10 M150 128 l10 -6 l2 10 l10 -6', 'var(--c-glow)', 2, { class: 'fx-pulse' }),
      halo(170, 92, 16),
      halo(162, 126, 14),
      line('M214 12 L222 4 L218 18 L232 10 L226 22', 'var(--c-coat-dark)', 2),
    ],
  });
  longRobe('halloween_robe', 'Robe du Veilleur des Âmes', 'Robe du Veilleur des Âmes : ourlet en lambeaux, déchirures, runes spectrales, toile d’araignée.', {
    far: [line('M262 420 l10 -12 l4 14 l10 -12 M276 520 l8 -10 l4 12', 'var(--c-glow)', 2.2, { class: 'fx-pulse' }), halo(272, 418, 18), halo(282, 518, 14), fill('M268 470 L276 476 L270 500 Z', '#000', { opacity: 0.45 })],
    near: [cobweb(162, 312, 46, 1.6, 2.9), line('M136 480 l10 -10 l2 12 l10 -10', 'var(--c-glow)', 2.2, { class: 'fx-pulse' }), halo(146, 478, 16), fill('M150 540 L156 544 L150 566 Z', '#000', { opacity: 0.45 })],
    hemFar: [fill('M234 620 L240 646 L250 626 L258 652 L268 630 L278 656 L288 630 L300 650 L306 624 L318 640 L324 612 Z', 'var(--c-coat-dark)')],
    hemNear: [fill('M100 618 L104 642 L114 624 L122 650 L132 628 L142 654 L152 630 L162 652 L170 628 L180 646 L182 626 Z', 'var(--c-coat-dark)')],
  });
  const tatter = 'M170 160 Q132 260 124 360 L136 382 L148 362 L158 396 L172 368 L186 404 L198 372 L212 398 L224 368 L238 394 L250 364 L262 384 L270 356 Q272 260 252 164 Z';
  write(
    'cape',
    'halloween_souls',
    'Mantelet aux lanternes d’âmes',
    ['mantle', 'metal', 'glow'],
    [
      { id: 'back', bone: 'cape', z: 6 },
      { id: 'souls', bone: 'root', z: 90, detail: 2 },
    ],
    'Mantelet aux lanternes d’âmes : mantelet en lambeaux, trois lanternes d’âmes qui tournent autour du Veilleur.',
    layer('back', fill(tatter, 'var(--c-mantle)'), fill('M170 160 Q132 260 124 360 L136 382 L148 362 L158 396 L172 368 L186 404 L198 372 L200 160 Z', 'url(#rig-shade)'), line('M252 164 Q272 260 270 356', 'var(--c-glow)', 2, { 'stroke-opacity': 0.45 })) +
      // Chaque lanterne a sa place de départ (si les animations sont réduites, elles ne s'empilent pas au centre).
      layer('souls', ...[[0, 'translate(-120px, 0) scale(0.9)'], [-2.33, 'translate(80px, -10px) scale(0.75)'], [-4.66, 'translate(40px, 12px) scale(1.05)']].map(([d, t]) => `<g class="fx-circle" style="--d:${d}s;transform:${t}">${lantern(206, 300, 1.5)}</g>`)),
  );
  write(
    'weapon',
    'halloween_staff',
    'Bâton à lanterne',
    ['wood', 'woodLight', 'metal', 'glow'],
    [{ id: 'staff', bone: 'hand_near', z: 64 }],
    'Bâton à lanterne : le bâton du Runiste, une lanterne d’âme pendue à sa crosse.',
    layer(
      'staff',
      line('M147 104 L122 696', 'var(--c-wood)', 9),
      line('M145 112 L121 690', 'var(--c-wood-light)', 2.5, { 'stroke-opacity': 0.7 }),
      line('M147 108 Q140 70 142 46 Q138 18 118 14 Q100 14 100 30', 'var(--c-wood)', 8),
      line('M100 30 L100 42', 'var(--c-metal)', 1.6),
      `<g class="fx-sway" style="--d:-0.5s">${lantern(100, 62, 1.5)}</g>`,
      cobweb(147, 108, 18, -2.6, -1.2),
    ),
  );

  // ---- Forgefeu : Forgeron des Cendres-Mortes ----
  write(
    'face',
    'halloween_beard',
    'Barbe aux toiles',
    ['beard', 'skinDark', 'metal'],
    [
      { id: 'features', bone: 'head', z: 56 },
      { id: 'eyes', bone: 'head', z: 59 },
    ],
    'Barbe tressée du Forgefeu, prise dans les toiles d’araignée, une araignée qui monte et descend au bout de la tresse.',
    layer(
      'features',
      line('M241 100 L249 112 L241 115', 'var(--c-skin-dark)', 1.8),
      line('M226 92 Q236 88 246 92', 'var(--c-beard)', 4),
      fill('M188 114 Q188 150 212 170 Q238 162 245 124 Q236 132 226 131 Q212 129 202 120 Z', 'var(--c-beard)'),
      fill('M188 114 Q188 150 212 170 L210 128 Q202 124 198 118 Z', 'url(#rig-shade)'),
      fill('M218 126 Q230 116 247 120 Q246 127 240 128 Q232 124 226 130 Z', 'var(--c-beard)'),
      line('M212 168 L214 190', 'var(--c-beard)', 7),
      `<rect x="207" y="176" width="13" height="6" rx="2" fill="var(--c-metal)" transform="rotate(4 213 179)"/>`,
      cobweb(190, 120, 30, 0.5, 1.6),
      `<g class="fx-bob">${line('M214 192 L214 214', '#F1F0EC', 0.7, { 'stroke-opacity': 0.6 })}<ellipse cx="214" cy="218" rx="3.4" ry="4.2" fill="#14181B"/>${line('M211 216 l-5 -3 M211 219 l-6 0 M211 222 l-5 3 M217 216 l5 -3 M217 219 l6 0 M217 222 l5 3', '#14181B', 1)}</g>`,
    ) +
      layer('eyes', `<ellipse cx="220" cy="101" rx="3.2" ry="1.7" fill="#14181B"/><ellipse cx="237" cy="100" rx="2.3" ry="1.4" fill="#14181B"/><circle class="fx-pulse" cx="238" cy="99.6" r="1" fill="var(--c-glow-light)"/>`),
  );
  write(
    'robe',
    'halloween_apron',
    'Tablier calciné',
    ['coatDark', 'glow', 'bone'],
    [
      { id: 'flap_far', bone: 'cloth_far', z: 30 },
      { id: 'flap_near', bone: 'cloth_near', z: 32 },
      { id: 'bib', bone: 'torso', z: 39 },
    ],
    'Tablier calciné : cuir noirci, fissures où couvent des braises spectrales, crâne marqué au fer.',
    layer(
      'bib',
      fill('M176 200 L236 194 L248 304 L166 304 Z', 'var(--c-coat-dark)'),
      fill('M176 200 L166 304 L192 304 L188 198 Z', 'url(#rig-shade)'),
      line('M178 202 L196 158 M234 196 L228 160', 'var(--c-leather)', 5),
      fill('M200 232 Q200 216 212 216 Q224 216 224 232 Q224 240 218 242 L218 248 L206 248 L206 242 Q200 240 200 232 Z', BONE, { opacity: 0.85 }),
      `<circle cx="207" cy="231" r="3" fill="#14181B"/><circle cx="217" cy="231" r="3" fill="#14181B"/>`,
      line('M209 248 L209 244 M212 248 L212 244 M215 248 L215 244', '#14181B', 1),
      line('M184 270 l10 6 l-4 8 l12 6 M232 262 l-6 10 l8 4', 'var(--c-glow)', 2, { class: 'fx-pulse' }),
      halo(196, 280, 16),
    ) +
      layer(
        'flap_far',
        fill('M206 304 L250 298 L262 526 L250 516 L240 534 L228 518 L216 536 L206 520 Z', 'var(--c-coat-dark)'),
        line('M222 380 l8 14 l-6 10 l10 16', 'var(--c-glow)', 2, { class: 'fx-pulse' }),
        halo(228, 400, 18),
      ) +
      layer(
        'flap_near',
        fill('M162 300 L208 304 L208 520 L196 534 L186 518 L174 536 L164 520 L156 528 Z', 'var(--c-coat-dark)'),
        fill('M162 300 L208 304 L208 520 L196 534 L186 518 L174 536 L164 520 L156 528 Z', 'url(#rig-shade)'),
        line('M176 420 l-6 12 l8 8 l-4 14', 'var(--c-glow)', 2, { class: 'fx-pulse' }),
        halo(174, 438, 16),
      ),
  );
  write(
    'weapon',
    'halloween_hammer',
    'Marteau-citrouille',
    ['wood', 'woodLight', 'leather', 'metal', 'pumpkin'],
    [{ id: 'hammer', bone: 'hand_far', z: 47 }],
    'Marteau-citrouille : le marteau du Forgefeu dont la masse est une citrouille sculptée qui flambe (même tenue en main que forge_hammer).',
    layer(
      'hammer',
      carvedGlow,
      `<g transform="matrix(0.9848 0.1736 -0.1736 0.9848 57.3613 -46.4738)"><g transform="translate(138 86) rotate(133.5) scale(0.7) translate(-374 -673)">`,
      line('M308 306 L370 648', 'var(--c-wood)', 12),
      line('M305 314 L366 646', 'var(--c-wood-light)', 3, { 'stroke-opacity': 0.55 }),
      `<g transform="rotate(-10.2 316 346)"><rect x="309" y="322" width="14" height="48" rx="2" fill="var(--c-leather)"/></g>`,
      ...pumpkin(374, 680, 44, 38),
      fill('M364 640 L380 640 L378 648 L366 648 Z', 'var(--c-metal)'),
      `</g></g>`,
    ),
  );

  // ---- Traqueur : Chasseur de Loups ----
  cowl('halloween_wolfhood', 'Capuchon de loup', 'Capuchon de loup : peau de loup aux oreilles dressées, mâchoire supérieure en visière, crocs.', {
    fill: WOLF,
    behind: [
      fill('M200 40 L190 8 L218 30 Z', WOLF),
      fill('M201 34 L195 16 L211 30 Z', '#C9A6A0', { opacity: 0.7 }),
      fill('M232 44 L244 12 L254 46 Z', WOLF),
      fill('M236 40 L243 22 L249 42 Z', '#C9A6A0', { opacity: 0.7 }),
    ],
    front: [
      line('M150 60 l-6 -4 M146 90 l-8 -2 M144 120 l-8 0 M150 150 l-8 4', '#000', 1.6, { 'stroke-opacity': 0.3 }),
      fill('M214 72 Q240 64 262 76 L296 92 Q298 100 290 102 L262 100 Q240 90 214 86 Z', WOLF),
      fill('M262 76 L296 92 Q298 100 290 102 L262 100 Z', '#FFFFFF', { opacity: 0.1 }),
      fill('M288 88 Q298 90 297 96 Q292 99 286 96 Z', '#14181B'),
      fill('M266 100 L270 112 L274 101 Z M280 101 L283 110 L286 101 Z', BONE),
      line('M220 78 Q240 72 258 80', '#000', 1.4, { 'stroke-opacity': 0.35 }),
      `<circle cx="248" cy="78" r="2" fill="var(--c-carved, #FFC24A)"/>`,
      halo(248, 78, 6, 'trim'),
    ],
  });
  const pelt = 'M168 160 Q140 240 134 330 Q150 322 160 340 Q172 326 184 346 Q196 330 208 348 Q220 330 232 344 Q244 326 256 338 Q266 324 274 330 Q270 240 252 164 Z';
  write(
    'cape',
    'halloween_wolfpelt',
    'Peau de loup',
    ['wolf', 'bone'],
    [
      { id: 'back', bone: 'cape', z: 6 },
      { id: 'paws', bone: 'torso', z: 74 },
    ],
    'Peau de loup : une peau grise jetée sur les épaules, la queue qui pend dans le dos, les pattes nouées sur la poitrine.',
    layer(
      'back',
      fill(pelt, WOLF),
      fill('M168 160 Q140 240 134 330 Q150 322 160 340 Q172 326 184 346 L200 160 Z', 'url(#rig-shade)'),
      line('M160 200 l-4 10 M176 240 l-4 10 M150 280 l-4 10 M236 210 l4 10 M246 260 l4 10 M200 300 l0 10', '#000', 1.4, { 'stroke-opacity': 0.3 }),
      `<g class="fx-sway" style="--d:-1.5s">${fur([[206, 330], [200, 380], [192, 430], [186, 470]], (t) => 30 - t * 18, { color: WOLF, bump: 4 })}</g>`,
      line('M252 164 Q270 240 274 330', 'var(--c-glow)', 2, { 'stroke-opacity': 0.4 }),
    ) +
      layer(
        'paws',
        fill('M168 176 Q156 200 162 226 Q170 232 178 226 Q180 202 182 180 Z', WOLF),
        fill('M244 172 Q256 196 252 222 Q244 228 236 222 Q234 200 232 176 Z', WOLF),
        fill('M162 226 l-2 6 l4 -2 Z M168 230 l0 7 l3 -6 Z M174 228 l2 6 l1 -6 Z M238 222 l-1 6 l3 -5 Z M244 226 l0 7 l3 -6 Z M250 222 l2 6 l1 -6 Z', BONE),
        line('M182 196 Q206 206 234 194', 'var(--c-leather)', 3),
      ),
  );
  write(
    'weapon',
    'halloween_bow',
    'Arc d’os',
    ['bone', 'leather', 'metal', 'glow'],
    [
      { id: 'bow', bone: 'hand_far', z: 26 },
      { id: 'string', bone: 'hand_far', z: 69 },
    ],
    'Arc d’os : branches en vertèbres, poignée de cuir, flèche à pointe d’argent qui luit (même tenue en main que ranger_bow).',
    layer(
      'bow',
      `<g transform="matrix(0.887 -0.4617 0.4617 0.887 -132.0098 245.1001)">`,
      line('M408 34 Q446 120 436 188 L436 222 Q446 290 408 376', BONE, 9),
      line(Array.from({ length: 14 }, (_, i) => {
        const t = (i + 1) / 15;
        const up = t < 0.5;
        const tt = up ? t * 2 : (t - 0.5) * 2;
        const x = up ? 408 + (436 - 408) * tt + Math.sin(tt * Math.PI) * 16 : 436 - (436 - 408) * tt + Math.sin(tt * Math.PI) * 16;
        const y = up ? 34 + (188 - 34) * tt : 222 + (376 - 222) * tt;
        return `M${r1(x - 5)} ${r1(y)} L${r1(x + 5)} ${r1(y)}`;
      }).join(' '), '#8A7E66', 1.6),
      `<rect x="430" y="188" width="12" height="34" rx="3" fill="var(--c-leather)"/>`,
      fill('M402 26 Q408 14 416 26 Q412 36 408 34 Q404 36 402 26 Z', BONE),
      fill('M402 384 Q408 396 416 384 Q412 374 408 376 Q404 374 402 384 Z', BONE),
      `</g>`,
    ) +
      layer(
        'string',
        `<g transform="matrix(0.887 -0.4617 0.4617 0.887 -132.0098 245.1001)">`,
        line('M408 34 L305 200 L408 376', '#E6DFC8', 1.6, { 'stroke-opacity': 0.9 }),
        line('M305 200 L458 196', 'var(--c-wood-light)', 3.2),
        fill('M310 200 L322 190 L340 190 L331 199 Z M310 200 L322 210 L340 210 L331 201 Z', '#2A2433'),
        halo(452, 196, 14),
        fill('M441 190 L460 196 L441 202 Z', 'var(--c-metal)'),
        line('M441 190 L460 196', 'var(--c-glow-light)', 1.4),
        `</g>`,
      ),
  );
}

frost();
harvest();
carnival();
abyss();
classVersions();
halloween();
console.log('Pièces de saison écrites.');

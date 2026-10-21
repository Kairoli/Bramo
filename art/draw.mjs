// Petites fonctions de dessin partagées par les générateurs de pièces (art/make_*.mjs).
// Tout passe par les variables de couleur du jeu et les matières partagées du moteur (rig-sheen, rig-grain, rig-weave, rig-mail).
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = join(dirname(fileURLToPath(import.meta.url)), 'parts');

const attr = (o) => Object.entries(o).map(([k, v]) => ` ${k}="${v}"`).join('');

/** Forme pleine. */
export const fill = (d, color, o = {}) => `<path d="${d}" fill="${color}"${attr(o)}/>`;
/** Trait. */
export const line = (d, color, w = 1.6, o = {}) => `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${attr(o)}/>`;

/** Ombre noire translucide. */
export const shade = (d, op = 0.3) => fill(d, '#000', { opacity: op });
/** Lumière blanche translucide. */
export const light = (d, op = 0.2) => fill(d, '#F1F0EC', { opacity: op });
/** Contour sombre, fin : donne du relief à une plaque. */
export const edge = (d, op = 0.5, w = 1.6) => line(d, '#000', w, { 'stroke-opacity': op });
/** Arête éclairée. */
export const glint = (d, op = 0.4, w = 1.6) => line(d, '#F1F0EC', w, { 'stroke-opacity': op });
/** Galon (couleur précieuse de la tenue). */
export const trim = (d, w = 2.2) => line(d, 'var(--c-trim)', w);
/** Rivets. */
export const rivets = (pts, r = 2, color = '#F1F0EC', op = 0.55) => pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${color}" opacity="${op}"/>`).join('');

/** Plaque de métal : aplat, reflet diagonal, ombre du côté proche, contour. */
export const plate = (d, o = {}) =>
  fill(d, o.color ?? 'var(--c-metal)') + fill(d, 'url(#rig-sheen)') + edge(d, o.edge ?? 0.5);
/** Cuir : aplat, grain, contour. */
export const leather = (d, color = 'var(--c-leather)') => fill(d, color) + fill(d, 'url(#rig-grain)') + edge(d, 0.4);
/** Tissu : aplat, tissage, plis (dégradé), contour. */
export const cloth = (d, color = 'var(--c-coat)') => fill(d, color) + fill(d, 'url(#rig-weave)') + fill(d, 'url(#rig-fold)') + edge(d, 0.35);
/** Mailles. */
export const mail = (d, color = 'var(--c-metal)') => fill(d, color) + fill(d, 'url(#rig-mail)') + fill(d, 'url(#rig-shade)', { opacity: 0.7 }) + edge(d, 0.45);

/** Un calque : <g id> de premier niveau, indenté comme les pièces existantes (les variantes s'y injectent). */
export const layer = (id, ...parts) => `  <g id="${id}">\n    ${parts.join('\n    ')}\n  </g>\n`;

/** Écrit une pièce : SVG et manifeste (ids de calques, os, profondeur). */
export function write(slot, id, name, roles, layers, comment, body) {
  mkdirSync(join(root, slot), { recursive: true });
  writeFileSync(join(root, slot, `${id}.svg`), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 760">\n  <!-- ${comment} -->\n${body}</svg>\n`);
  writeFileSync(join(root, slot, `${id}.json`), JSON.stringify({ id, slot, name, colorRoles: roles, anchor: [0, 0], layers }, null, 2) + '\n');
}

import type { Animation, Rig } from '@bramo/shared';

/** Matrice affine 2D [a, b, c, d, e, f], comme l'attribut SVG matrix(). */
export type Matrix = [number, number, number, number, number, number];

export const IDENTITY: Matrix = [1, 0, 0, 1, 0, 0];

export function multiply(m: Matrix, n: Matrix): Matrix {
  return [
    m[0] * n[0] + m[2] * n[1],
    m[1] * n[0] + m[3] * n[1],
    m[0] * n[2] + m[2] * n[3],
    m[1] * n[2] + m[3] * n[3],
    m[0] * n[4] + m[2] * n[5] + m[4],
    m[1] * n[4] + m[3] * n[5] + m[5],
  ];
}

/** Translation (dx, dy) puis rotation de `deg` degrés autour du pivot (coordonnées de repos). */
export function localMatrix(pivot: [number, number], deg: number, dx: number, dy: number): Matrix {
  const r = (deg * Math.PI) / 180;
  const cos = Math.cos(r);
  const sin = Math.sin(r);
  const [px, py] = pivot;
  return [cos, sin, -sin, cos, px - cos * px + sin * py + dx, py - sin * px - cos * py + dy];
}

export function apply(m: Matrix, [x, y]: [number, number]): [number, number] {
  return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
}

export const toSvg = (m: Matrix) => `matrix(${m.map((v) => +v.toFixed(4)).join(' ')})`;

/** Interpolation douce (cosinus) entre images clés, colonne par colonne. */
function sample(keys: number[][], t: number): number[] {
  const first = keys[0]!;
  if (t <= first[0]!) return first.slice(1);
  for (let i = 1; i < keys.length; i++) {
    const b = keys[i]!;
    if (t <= b[0]!) {
      const a = keys[i - 1]!;
      const u = (t - a[0]!) / (b[0]! - a[0]! || 1);
      const e = (1 - Math.cos(u * Math.PI)) / 2;
      return a.slice(1).map((v, j) => v + (b[j + 1]! - v) * e);
    }
  }
  return keys[keys.length - 1]!.slice(1);
}

/** Os triés parents d'abord. */
export function orderedBones(rig: Rig): Rig['bones'] {
  const done = new Set<string>();
  const out: Rig['bones'] = [];
  while (out.length < rig.bones.length) {
    const before = out.length;
    for (const b of rig.bones) {
      if (!done.has(b.id) && (!b.parent || done.has(b.parent))) {
        out.push(b);
        done.add(b.id);
      }
    }
    if (out.length === before) throw new Error('Gabarit : cycle dans la hiérarchie des os');
  }
  return out;
}

/**
 * Cinématique directe : matrice monde de chaque os à l'instant t de l'animation.
 * `pose` : degrés ajoutés à la pose de référence (pose de la classe), avant l'animation.
 * `gain` : amplitude de l'animation (1 = normale, moins avec « réduire les animations »).
 */
export function worldMatrices(
  bones: Rig['bones'],
  anim: Animation | null,
  t: number,
  pose: Record<string, number> = {},
  gain = 1,
): Record<string, Matrix> {
  const world: Record<string, Matrix> = {};
  const time = anim ? t % anim.duration : 0;
  for (const bone of bones) {
    const track = anim?.bones[bone.id];
    const [deg] = track?.rotate ? sample(track.rotate, time) : [0];
    const [dx, dy] = track?.translate ? sample(track.translate, time) : [0, 0];
    const local = localMatrix(bone.pivot, bone.rotation + (pose[bone.id] ?? 0) + deg! * gain, dx! * gain, dy! * gain);
    world[bone.id] = bone.parent ? multiply(world[bone.parent]!, local) : local;
  }
  return world;
}

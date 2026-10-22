import type { ReactNode } from 'react';
import type { SpellEffects, TimelineEvent } from '@bramo/shared';

/**
 * Boîte à outils des effets de combat : repères de la scène, instant d'un sort, tirages stables, formes et particules.
 * Tout se calcule à partir du temps : une même seconde du combat donne toujours la même image.
 */

export type Pt = [number, number];

/** La scène, en pixels, à cette image. */
export interface Stage {
  w: number;
  h: number;
  /** Pixels par unité du gabarit des personnages (760 unités de haut). */
  k: number;
  toPx: (p: Pt) => Pt;
  groundY: number;
  /** Centre du buste du personnage, ses pieds. */
  chest: Pt;
  feet: Pt;
  /** Ennemi principal : centre au sol, hauteur. */
  enemyX: number;
  enemyH: number;
  /** Point touché de chaque ennemi visible (le principal d'abord). */
  hits: Pt[];
  reduced: boolean;
  /** Horloge réelle (ms) : pour les petits mouvements continus (scintillement). */
  now: number;
}

/** Un sort (ou une attaque) à l'instant `c` de son déroulé. */
export interface Cast {
  /** Rang de l'événement : graine des tirages. */
  i: number;
  e: TimelineEvent;
  /** Horloge du combat. */
  c: number;
  /** Début du geste (s), instant du coup ou du lâcher (`release`), arrivée sur l'ennemi (`e.t`). */
  start: number;
  release: number;
  /** Temps depuis le début du geste, depuis le lâcher, depuis l'arrivée (négatif avant). */
  tau: number;
  sinceRelease: number;
  after: number;
  /** Échelle (critique, ultime). */
  s: number;
  crit: boolean;
  /** Couleurs : principale et éclat. */
  col: string;
  hot: string;
  /** Point d'où part l'effet, suivant le geste (main, masse, pointe de flèche…), à un instant du geste. */
  from: (tau?: number) => Pt;
  effects: SpellEffects | null;
}

export interface SpellFx {
  /** Animation du personnage (art/rig/animations). */
  gesture: string;
  /** Secondes entre le lâcher et l'arrivée sur l'ennemi. */
  travel: number;
  /** Durée de l'effet après l'arrivée. */
  after?: number;
  /** Couleurs propres au sort (sinon celles de la classe ou de l'élément). */
  col?: string;
  hot?: string;
  render: (st: Stage, cs: Cast) => ReactNode;
}

// --- Calcul ---------------------------------------------------------------------------------------------------

const fract = (x: number) => x - Math.floor(x);
/** Tirage stable dans [0, 1) pour l'événement `i`, la particule `j`. */
export const rnd = (i: number, j: number) => fract(Math.sin(i * 12.9898 + j * 78.233 + 0.5) * 43758.5453);
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
export const mix = (p: Pt, q: Pt, u: number): Pt => [lerp(p[0], q[0], u), lerp(p[1], q[1], u)];
export const easeOut = (u: number) => 1 - (1 - clamp01(u)) ** 3;
export const easeIn = (u: number) => clamp01(u) ** 2;
export const easeInOut = (u: number) => (u < 0.5 ? 2 * u * u : 1 - (-2 * u + 2) ** 2 / 2);
/** Part écoulée d'une fenêtre [a, b], bornée. */
export const span = (x: number, a: number, b: number) => clamp01((x - a) / (b - a));
/** Vaut 1 dans la fenêtre [a, b], monte et descend en `fade` secondes aux bords ; 0 dehors. */
export function window01(x: number, a: number, b: number, fadeIn = 0.08, fadeOut = 0.2): number {
  if (x < a || x > b) return 0;
  return Math.min(1, (x - a) / fadeIn, (b - x) / fadeOut);
}
export const inside = (x: number, a: number, b: number) => x >= a && x <= b;
/** Point sur un arc de `from` à `to`, levé de `lift` px au milieu. */
export function arc(from: Pt, to: Pt, u: number, lift: number): Pt {
  const p = mix(from, to, u);
  return [p[0], p[1] - Math.sin(Math.PI * u) * lift];
}
export const angle = (p: Pt, q: Pt) => Math.atan2(q[1] - p[1], q[0] - p[0]);
export const polar = (p: Pt, a: number, r: number): Pt => [p[0] + Math.cos(a) * r, p[1] + Math.sin(a) * r];
export const d = (pts: Pt[], close = false) => pts.map((p, j) => `${j ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ') + (close ? ' Z' : '');
/** Courbe lisse passant par les points (Catmull-Rom). */
export function smooth(pts: Pt[]): string {
  if (pts.length < 3) return d(pts);
  let out = `M${pts[0]![0].toFixed(1)} ${pts[0]![1].toFixed(1)}`;
  for (let j = 0; j < pts.length - 1; j++) {
    const p0 = pts[j - 1] ?? pts[j]!;
    const p1 = pts[j]!;
    const p2 = pts[j + 1]!;
    const p3 = pts[j + 2] ?? p2;
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    out += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return out;
}
/** Éclair : ligne brisée entre deux points, qui change d'allure `rate` fois par seconde. */
export function bolt(i: number, from: Pt, to: Pt, segments: number, jitter: number, phase = 0): Pt[] {
  const a = angle(from, to);
  const nx = -Math.sin(a);
  const ny = Math.cos(a);
  return Array.from({ length: segments + 1 }, (_, j) => {
    const p = mix(from, to, j / segments);
    if (j === 0 || j === segments) return p;
    const off = (rnd(i * 7 + Math.floor(phase), j) - 0.5) * 2 * jitter;
    return [p[0] + nx * off, p[1] + ny * off] as Pt;
  });
}

// --- Filtres et dégradés partagés (définis une fois dans la scène) -------------------------------------------------

export const GLOW = 'url(#fx-glow)';
export const SOFT = 'url(#fx-soft)';
export const BLUR = 'url(#fx-blur)';

export function FxDefs({ k }: { k: number }) {
  return (
    <defs>
      <filter id="fx-glow" x="-60%" y="-60%" width="220%" height="220%">
        <feGaussianBlur stdDeviation={Math.max(1.5, 5 * k)} result="b" />
        <feMerge>
          <feMergeNode in="b" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <filter id="fx-soft" x="-60%" y="-60%" width="220%" height="220%">
        <feGaussianBlur stdDeviation={Math.max(2, 9 * k)} />
      </filter>
      <filter id="fx-blur" x="-80%" y="-80%" width="260%" height="260%">
        <feGaussianBlur stdDeviation={Math.max(4, 20 * k)} />
      </filter>
      <radialGradient id="fx-flame" cx="50%" cy="88%" r="75%">
        <stop offset="0" stopColor="#FFF6D0" />
        <stop offset=".3" stopColor="#FFC060" />
        <stop offset=".7" stopColor="#F0602B" stopOpacity=".75" />
        <stop offset="1" stopColor="#B8301A" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="fx-ice" cx="50%" cy="40%" r="70%">
        <stop offset="0" stopColor="#FFFFFF" stopOpacity=".95" />
        <stop offset=".5" stopColor="#BFE8FF" stopOpacity=".75" />
        <stop offset="1" stopColor="#5FA8E0" stopOpacity=".35" />
      </radialGradient>
      <radialGradient id="fx-orb" cx="50%" cy="50%" r="50%">
        <stop offset="0" stopColor="#FFFFFF" />
        <stop offset=".35" stopColor="currentColor" />
        <stop offset="1" stopColor="currentColor" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="fx-steel" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#F4EEE2" />
        <stop offset=".5" stopColor="#9A9690" />
        <stop offset="1" stopColor="#4C4A47" />
      </linearGradient>
      <radialGradient id="fx-steam" cx="50%" cy="50%" r="50%">
        <stop offset="0" stopColor="#FFFFFF" stopOpacity=".9" />
        <stop offset=".6" stopColor="#E6EEF2" stopOpacity=".45" />
        <stop offset="1" stopColor="#E6EEF2" stopOpacity="0" />
      </radialGradient>
    </defs>
  );
}

// --- Particules ---------------------------------------------------------------------------------------------------

/** Éclats lancés depuis `p` dans un cône (angles en radians), qui retombent sous la gravité. */
export function sparks(
  i: number,
  p: Pt,
  u: number,
  o: { n: number; spread: [number, number]; dist: number; gravity?: number; size: number; col: string; hot?: string; seed?: number; streak?: boolean },
): ReactNode {
  if (u < 0 || u > 1) return null;
  const seed = o.seed ?? 0;
  return (
    <g opacity={1 - u * u}>
      {Array.from({ length: o.n }, (_, j) => {
        const a = lerp(o.spread[0], o.spread[1], rnd(i, j + seed));
        const r = o.dist * (0.4 + 0.6 * rnd(i, j + seed + 31)) * easeOut(u);
        const g = (o.gravity ?? 0) * u * u;
        const q: Pt = [p[0] + Math.cos(a) * r, p[1] + Math.sin(a) * r + g];
        const col = j % 3 === 0 && o.hot ? o.hot : o.col;
        if (o.streak) {
          const back = polar(q, a + Math.PI, o.size * 3);
          return <line key={j} x1={back[0]} y1={back[1]} x2={q[0]} y2={q[1]} stroke={col} strokeWidth={o.size * 0.7} strokeLinecap="round" />;
        }
        return <circle key={j} cx={q[0]} cy={q[1]} r={o.size * (0.5 + 0.7 * rnd(i, j + seed + 63)) * (1 - 0.5 * u)} fill={col} />;
      })}
    </g>
  );
}

/** Particules qui montent doucement autour de `p` (soins, braises, vapeur). */
export function motes(i: number, p: Pt, u: number, o: { n: number; w: number; rise: number; size: number; col: string; shape?: 'dot' | 'plus' | 'flake'; seed?: number }): ReactNode {
  if (u < 0 || u > 1) return null;
  const seed = o.seed ?? 0;
  return (
    <g>
      {Array.from({ length: o.n }, (_, j) => {
        const delay = rnd(i, j + seed + 5) * 0.4;
        const v = clamp01((u - delay) / (1 - delay));
        if (v <= 0) return null;
        const x = p[0] + (rnd(i, j + seed) - 0.5) * o.w + Math.sin(v * 6 + j) * o.size;
        const y = p[1] - o.rise * v * (0.6 + 0.6 * rnd(i, j + seed + 9));
        const op = Math.sin(Math.PI * v);
        const sz = o.size * (0.6 + 0.6 * rnd(i, j + seed + 13));
        if (o.shape === 'plus')
          return <path key={j} d={`M${x - sz} ${y}H${x + sz}M${x} ${y - sz}V${y + sz}`} stroke={o.col} strokeWidth={sz * 0.55} strokeLinecap="round" opacity={op} />;
        if (o.shape === 'flake') return <g key={j} opacity={op} transform={`translate(${x} ${y}) rotate(${v * 180 + j * 40})`}>{flake(sz, o.col)}</g>;
        return <circle key={j} cx={x} cy={y} r={sz} fill={o.col} opacity={op} />;
      })}
    </g>
  );
}

/** Anneau qui s'élargit (au sol si `flat`). */
export function ring(p: Pt, u: number, o: { r0: number; r1: number; col: string; width: number; flat?: number; dash?: string }): ReactNode {
  if (u < 0 || u > 1) return null;
  const r = lerp(o.r0, o.r1, easeOut(u));
  return <ellipse cx={p[0]} cy={p[1]} rx={r} ry={r * (o.flat ?? 1)} fill="none" stroke={o.col} strokeWidth={o.width * (1 - 0.6 * u)} opacity={1 - u} strokeDasharray={o.dash} filter={GLOW} />;
}

/** Éclair blanc bref au point touché. */
export function flash(p: Pt, u: number, r: number, col = '#FFFFFF'): ReactNode {
  if (u < 0 || u > 1) return null;
  return <circle cx={p[0]} cy={p[1]} r={r * (0.6 + 0.6 * easeOut(u))} fill={col} opacity={(1 - u) * 0.85} filter={SOFT} />;
}

/** Halo coloré (lueur). */
export function halo(p: Pt, r: number, col: string, op = 0.5): ReactNode {
  return <circle cx={p[0]} cy={p[1]} r={r} fill={col} opacity={op} filter={BLUR} />;
}

/** Sillage : segments de plus en plus fins le long des positions passées. */
export function trail(pts: Pt[], col: string, width: number, op = 0.7): ReactNode {
  return (
    <g strokeLinecap="round">
      {pts.slice(1).map((p, j) => {
        const v = (j + 1) / pts.length;
        return <line key={j} x1={pts[j]![0]} y1={pts[j]![1]} x2={p[0]} y2={p[1]} stroke={col} strokeWidth={width * v} opacity={op * v} />;
      })}
    </g>
  );
}

// --- Formes ---------------------------------------------------------------------------------------------------------

/** Langue de feu posée sur `base`, de hauteur `h` et largeur `w`, qui ondule. */
export function flame(base: Pt, h: number, w: number, phase: number, fill = 'url(#fx-flame)'): ReactNode {
  const [x, y] = base;
  const sway = Math.sin(phase) * w * 0.35;
  return (
    <path
      d={`M${x - w} ${y} C${x - w * 0.95} ${y - h * 0.45} ${x - w * 0.1 + sway} ${y - h * 0.6} ${x + sway * 1.6} ${y - h} C${x + w * 0.3 + sway} ${y - h * 0.62} ${x + w * 0.95} ${y - h * 0.4} ${x + w} ${y} Z`}
      fill={fill}
    />
  );
}

/** Flocon à six branches, centré. */
export function flake(r: number, col: string): ReactNode {
  return (
    <g stroke={col} strokeWidth={r * 0.22} strokeLinecap="round">
      {[0, 60, 120].map((a) => (
        <path key={a} d={`M${-r} 0H${r}M${-r * 0.55} ${-r * 0.3}L${-r * 0.75} 0L${-r * 0.55} ${r * 0.3}M${r * 0.55} ${-r * 0.3}L${r * 0.75} 0L${r * 0.55} ${r * 0.3}`} transform={`rotate(${a})`} />
      ))}
    </g>
  );
}

/** Cristal de glace (pointe), base au sol en `base`. */
export function crystal(base: Pt, h: number, w: number, tilt: number, col = 'url(#fx-ice)'): ReactNode {
  const [x, y] = base;
  return (
    <g transform={`rotate(${tilt} ${x} ${y})`}>
      <path d={`M${x - w} ${y} L${x - w * 0.45} ${y - h * 0.8} L${x} ${y - h} L${x + w * 0.5} ${y - h * 0.75} L${x + w} ${y} Z`} fill={col} stroke="#E8F7FF" strokeWidth={w * 0.12} strokeOpacity={0.8} />
      <path d={`M${x} ${y - h} L${x - w * 0.15} ${y}`} stroke="#FFFFFF" strokeOpacity={0.6} strokeWidth={w * 0.1} />
    </g>
  );
}

/** Feuille (Traqueur), centrée, pointe vers la droite. */
export function leaf(r: number, col: string): ReactNode {
  return (
    <g>
      <path d={`M${-r} 0 Q${-r * 0.1} ${-r * 0.75} ${r} 0 Q${-r * 0.1} ${r * 0.75} ${-r} 0 Z`} fill={col} />
      <path d={`M${-r * 0.9} 0 L${r * 0.8} 0`} stroke="#0B2A1C" strokeOpacity={0.45} strokeWidth={r * 0.12} />
    </g>
  );
}

/** Masse de marteau de forge vue de profil (tête à droite), centrée sur la tête. */
export function hammerShape(len: number, col: string): ReactNode {
  const h = len * 0.32;
  return (
    <g>
      <rect x={-len} y={-len * 0.045} width={len} height={len * 0.09} rx={len * 0.04} fill="#6B4A2E" />
      <rect x={-h * 0.55} y={-h * 0.7} width={h * 1.1} height={h * 1.4} rx={h * 0.12} fill="url(#fx-steel)" stroke={col} strokeWidth={len * 0.03} />
    </g>
  );
}

/** Enclume de profil, posée sur `base`, largeur `w`. */
export function anvilShape(base: Pt, w: number, col: string, op = 1): ReactNode {
  const [x, y] = base;
  const h = w * 0.62;
  return (
    <path
      opacity={op}
      d={`M${x - w * 0.5} ${y - h} L${x + w * 0.38} ${y - h} Q${x + w * 0.62} ${y - h} ${x + w * 0.62} ${y - h * 0.86} L${x + w * 0.2} ${y - h * 0.72} L${x + w * 0.16} ${y - h * 0.42} L${x + w * 0.32} ${y} L${x - w * 0.32} ${y} L${x - w * 0.16} ${y - h * 0.42} L${x - w * 0.2} ${y - h * 0.72} L${x - w * 0.5} ${y - h * 0.8} Z`}
      fill="url(#fx-steel)"
      stroke={col}
      strokeWidth={w * 0.03}
    />
  );
}

/** Plaque hexagonale (bouclier de forge), centrée. */
export function hexPlate(r: number, col: string, op = 1): ReactNode {
  const pts: Pt[] = Array.from({ length: 6 }, (_, j) => polar([0, 0], (Math.PI / 3) * j + Math.PI / 6, r));
  return (
    <g opacity={op}>
      <path d={d(pts, true)} fill={col} fillOpacity={0.18} stroke={col} strokeWidth={r * 0.12} strokeLinejoin="round" />
      <circle r={r * 0.12} fill={col} />
    </g>
  );
}

/** Rivet (tête bombée et tige), pointe vers la droite. */
export function rivetShape(r: number, col: string): ReactNode {
  return (
    <g>
      <rect x={-r * 0.2} y={-r * 0.22} width={r * 2.2} height={r * 0.44} fill="#B8B2A8" />
      <path d={`M0 ${-r} A${r} ${r} 0 0 0 0 ${r} Z`} fill={col} stroke="#FFF1CF" strokeWidth={r * 0.15} />
    </g>
  );
}

/** Loup spectral de profil (tourné vers la droite), pattes selon la phase de course. */
export function wolf(p: Pt, size: number, phase: number, col: string, op = 1, facing: 1 | -1 = 1): ReactNode {
  const leg = Math.sin(phase) * 0.35;
  // `size` = longueur du corps ; le dessin fait environ 170 unités de long sur 70 de haut.
  const s = (size / 100) * 1.45;
  return (
    <g opacity={op} transform={`translate(${p[0]} ${p[1]}) scale(${s * facing} ${s})`} filter={GLOW}>
      <g fill={col} fillOpacity={0.55} stroke={col} strokeWidth={2.5} strokeLinejoin="round">
        <path d="M-58 -38 C-40 -52 0 -54 28 -46 C40 -60 52 -66 64 -62 L70 -56 L84 -52 L80 -44 L66 -42 C60 -34 50 -28 40 -26 C20 -20 -20 -20 -44 -26 C-60 -20 -78 -26 -92 -44 C-78 -38 -66 -36 -58 -38 Z" />
        <path d={`M30 -30 L${36 + leg * 40} -2 L${42 + leg * 40} -2 L42 -28 Z`} />
        <path d={`M18 -28 L${10 - leg * 40} -2 L${16 - leg * 40} -2 L28 -28 Z`} />
        <path d={`M-38 -28 L${-48 + leg * 40} -2 L${-42 + leg * 40} -2 L-28 -28 Z`} />
        <path d={`M-48 -30 L${-60 - leg * 40} -4 L${-54 - leg * 40} -4 L-38 -30 Z`} />
        <path d="M56 -62 L58 -76 L66 -64 Z" />
      </g>
      <circle cx="68" cy="-54" r="3" fill="#FFFFFF" />
    </g>
  );
}

/** Mâchoire de piège à loup ouverte (0) ou fermée (1), base au sol. */
export function bearTrap(base: Pt, w: number, close: number, col: string): ReactNode {
  const [x, y] = base;
  const a = lerp(70, 6, easeIn(close));
  const jaw = (side: 1 | -1) => (
    <g transform={`translate(${x} ${y}) rotate(${-a * side})`}>
      <path
        d={`M0 0 L${side * w * 0.5} 0 ${Array.from({ length: 5 }, (_, j) => `L${side * w * (0.5 - j * 0.1 - 0.05)} ${-w * 0.14} L${side * w * (0.5 - (j + 1) * 0.1)} 0`).join(' ')}`}
        fill="none"
        stroke={col}
        strokeWidth={w * 0.05}
        strokeLinejoin="round"
      />
    </g>
  );
  return (
    <g>
      <ellipse cx={x} cy={y} rx={w * 0.55} ry={w * 0.1} fill="none" stroke="#7D7A74" strokeWidth={w * 0.04} />
      {jaw(1)}
      {jaw(-1)}
    </g>
  );
}

/** Chaîne de maillons entre deux points (mouvement : décalage `shift` de 0 à 1). */
export function chain(from: Pt, to: Pt, link: number, col: string, shift = 0, op = 1): ReactNode {
  const len = Math.hypot(to[0] - from[0], to[1] - from[1]);
  const n = Math.max(1, Math.floor(len / link));
  const a = (angle(from, to) * 180) / Math.PI;
  return (
    <g opacity={op}>
      {Array.from({ length: n }, (_, j) => {
        const p = mix(from, to, (j + shift) / n);
        // Un maillon sur deux vu de face (ellipse), l'autre de profil (trait épais).
        return j % 2 ? (
          <line key={j} x1={p[0] - Math.cos((a * Math.PI) / 180) * link * 0.5} y1={p[1] - Math.sin((a * Math.PI) / 180) * link * 0.5} x2={p[0] + Math.cos((a * Math.PI) / 180) * link * 0.5} y2={p[1] + Math.sin((a * Math.PI) / 180) * link * 0.5} stroke={col} strokeWidth={link * 0.22} strokeLinecap="round" />
        ) : (
          <ellipse key={j} cx={p[0]} cy={p[1]} rx={link * 0.55} ry={link * 0.3} fill="none" stroke={col} strokeWidth={link * 0.14} transform={`rotate(${a} ${p[0]} ${p[1]})`} />
        );
      })}
    </g>
  );
}

/** Glyphes du Runiste (centrés, rayon 1) : trait, cercle, sceau et signes propres à certains sorts. */
export const GLYPHS: Record<string, string> = {
  trait: 'M-.35 -.55 L.25 0 L-.35 .55 M.25 -.55 L.25 .55',
  circle: 'M-.5 0 A.5 .5 0 1 0 .5 0 A.5 .5 0 1 0 -.5 0 M0 -.5 L0 .5',
  seal: 'M-.45 -.45 L.45 .45 M.45 -.45 L-.45 .45 M0 -.62 L0 .62',
  eye: 'M-.7 0 Q0 -.55 .7 0 Q0 .55 -.7 0 Z M0 -.2 A.2 .2 0 1 0 0 .2 A.2 .2 0 1 0 0 -.2',
  knot: 'M-.6 0 C-.6 -.4 -.15 -.4 0 0 C.15 .4 .6 .4 .6 0 C.6 -.4 .15 -.4 0 0 C-.15 .4 -.6 .4 -.6 0 Z',
  interdict: 'M-.62 0 A.62 .62 0 1 0 .62 0 A.62 .62 0 1 0 -.62 0 M-.44 -.44 L.44 .44',
  hearth: 'M-.5 .45 L.5 .45 M0 .45 C-.4 .1 -.2 -.25 0 -.55 C.2 -.25 .4 .1 0 .45',
  stop: 'M-.5 -.5 L.5 -.5 L.5 .5 L-.5 .5 Z M-.25 -.25 L.25 .25 M.25 -.25 L-.25 .25',
  chain: 'M-.55 -.2 A.2 .2 0 1 0 -.15 -.2 L.15 .2 A.2 .2 0 1 0 .55 .2',
  refuge: 'M0 -.6 L.55 -.1 L.55 .5 L-.55 .5 L-.55 -.1 Z M-.2 .5 L-.2 .1 L.2 .1 L.2 .5',
  resonance: 'M0 -.15 A.15 .15 0 1 0 0 .15 A.15 .15 0 1 0 0 -.15 M-.4 -.4 A.56 .56 0 0 0 -.4 .4 M.4 -.4 A.56 .56 0 0 1 .4 .4',
  shard: 'M0 -.65 L.25 0 L0 .65 L-.25 0 Z',
  relay: 'M-.6 0 L.4 0 M.15 -.28 L.45 0 L.15 .28 M-.3 -.45 L-.3 .45',
  ash: 'M-.55 .3 Q0 -.6 .55 .3 M-.3 .3 Q0 -.2 .3 .3',
  burst: 'M0 -.65 L.15 -.15 L.65 0 L.15 .15 L0 .65 L-.15 .15 L-.65 0 L-.15 -.15 Z',
  silence: 'M-.5 -.1 Q0 -.5 .5 -.1 M-.5 .2 L.5 .2',
};

/** Glyphe tracé au trait, centré en `p`, rayon `r`, rotation `rot` (degrés), tracé jusqu'à `draw` (0 à 1). */
export function glyph(name: string, p: Pt, r: number, col: string, o: { rot?: number; draw?: number; width?: number; op?: number; ring?: boolean } = {}): ReactNode {
  const draw = o.draw ?? 1;
  const w = o.width ?? 0.09;
  return (
    <g transform={`translate(${p[0]} ${p[1]}) rotate(${o.rot ?? 0})`} opacity={o.op ?? 1} filter={GLOW}>
      {o.ring !== false && <circle r={r} fill="none" stroke={col} strokeWidth={r * w} pathLength={1} strokeDasharray={`${draw} 1`} transform="rotate(-90)" />}
      {draw > 0.35 && (
        <path d={GLYPHS[name] ?? GLYPHS.trait} transform={`scale(${r * 0.85})`} fill="none" stroke="#FFFFFF" strokeWidth={(w * 1.1) / 0.85} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={`${clamp01((draw - 0.35) / 0.65)} 1`} />
      )}
    </g>
  );
}

/** Texte flottant (dégâts, noms de sort, « Critique ! »). */
export function floatText(p: Pt, u: number, text: string, col: string, size: number, rise = 30): ReactNode {
  if (u < 0 || u > 1) return null;
  const pop = 1 + 0.35 * (1 - easeOut(u / 0.18));
  return (
    <text className="stage-text" x={p[0]} y={p[1] - rise * easeOut(u)} fill={col} opacity={u < 0.7 ? 1 : 1 - (u - 0.7) / 0.3} fontSize={size * pop}>
      {text}
    </text>
  );
}

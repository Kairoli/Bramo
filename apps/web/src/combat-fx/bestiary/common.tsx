import type { ReactNode } from 'react';

/**
 * Bestiaire : chaque ennemi est dessiné dans un repère de 200 × 260, pieds en (100, 260), tourné vers la gauche (vers le
 * personnage). Il s'anime avec le temps `t` (s) ; `strike` (0 à 1) monte quand il frappe, `hurt` (0 à 1) quand il est
 * touché. Les ids des dégradés sont préfixés par `u` pour être uniques dans la page.
 */
export interface CreatureProps {
  t: number;
  strike: number;
  hurt: number;
  u: string;
}

export interface Creature {
  name: string;
  draw: (p: CreatureProps) => ReactNode;
  /** Gardien : un peu plus grand. */
  scale?: number;
  /** Couleur de la lueur au sol et des volutes quand il disparaît. */
  glow: string;
}

export const sin = Math.sin;
export const wave = (t: number, speed: number, phase = 0) => Math.sin(t * speed + phase);

/** Ombre au sol, toujours sous les pieds. */
export function Ground({ w = 80, op = 0.5 }: { w?: number; op?: number }) {
  return <ellipse cx="100" cy="258" rx={w} ry={w * 0.11} fill="#000" opacity={op} />;
}

/** Lueur douce, centrée. */
export function Glow({ x, y, r, color, op = 0.5, u, id }: { x: number; y: number; r: number; color: string; op?: number; u: string; id: string }) {
  return (
    <>
      <defs>
        <radialGradient id={`${u}-${id}`}>
          <stop offset="0" stopColor={color} stopOpacity={op} />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx={x} cy={y} r={r} fill={`url(#${u}-${id})`} />
    </>
  );
}

/** Dégradé linéaire vertical réutilisable (haut → bas). */
export function VGrad({ u, id, stops }: { u: string; id: string; stops: [number, string, number?][] }) {
  return (
    <linearGradient id={`${u}-${id}`} x1="0" y1="0" x2="0" y2="1">
      {stops.map(([o, c, a], i) => (
        <stop key={i} offset={o} stopColor={c} stopOpacity={a ?? 1} />
      ))}
    </linearGradient>
  );
}

/** Dégradé radial réutilisable. */
export function RGrad({ u, id, stops, cx = '50%', cy = '50%', r = '50%' }: { u: string; id: string; stops: [number, string, number?][]; cx?: string; cy?: string; r?: string }) {
  return (
    <radialGradient id={`${u}-${id}`} cx={cx} cy={cy} r={r}>
      {stops.map(([o, c, a], i) => (
        <stop key={i} offset={o} stopColor={c} stopOpacity={a ?? 1} />
      ))}
    </radialGradient>
  );
}

export const url = (u: string, id: string) => `url(#${u}-${id})`;

/**
 * Volume commun à tous les ennemis : la lumière vient de la gauche (le personnage, les braseros), l'ombre tombe derrière.
 * `ShadeDefs` une fois par ennemi, puis `<Shaded d=… />` redessine une forme avec l'ombre et un reflet de contour.
 */
export function ShadeDefs({ u, rim = '#FFE2B8' }: { u: string; rim?: string }) {
  return (
    <defs>
      <linearGradient id={`${u}-shade`} x1="0" y1="0" x2="1" y2="0.25">
        <stop offset="0" stopColor="#FFFFFF" stopOpacity=".16" />
        <stop offset=".38" stopColor="#FFFFFF" stopOpacity="0" />
        <stop offset=".62" stopColor="#000000" stopOpacity=".12" />
        <stop offset="1" stopColor="#000000" stopOpacity=".5" />
      </linearGradient>
      <linearGradient id={`${u}-rim`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor={rim} stopOpacity=".85" />
        <stop offset=".3" stopColor={rim} stopOpacity="0" />
      </linearGradient>
      <linearGradient id={`${u}-ao`} x1="0" y1="0" x2="0" y2="1">
        <stop offset=".6" stopColor="#000000" stopOpacity="0" />
        <stop offset="1" stopColor="#000000" stopOpacity=".45" />
      </linearGradient>
    </defs>
  );
}

/** Une forme ombrée : l'ombre portée vers la droite, l'assombrissement en bas, le liseré de lumière à gauche. */
export function Shaded({ d, u, rim = true, ao = true, width = 2.5 }: { d: string; u: string; rim?: boolean; ao?: boolean; width?: number }) {
  return (
    <>
      <path d={d} fill={url(u, 'shade')} />
      {ao && <path d={d} fill={url(u, 'ao')} />}
      {rim && <path d={d} fill="none" stroke={url(u, 'rim')} strokeWidth={width} />}
    </>
  );
}

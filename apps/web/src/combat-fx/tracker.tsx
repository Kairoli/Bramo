import type { ReactNode } from 'react';
import {
  type Cast,
  type Pt,
  type SpellFx,
  type Stage,
  BLUR,
  GLOW,
  SOFT,
  angle,
  arc,
  bearTrap,
  bolt,
  clamp01,
  d,
  easeIn,
  easeOut,
  flash,
  glyph,
  halo,
  leaf,
  lerp,
  mix,
  motes,
  polar,
  ring,
  rnd,
  smooth,
  span,
  sparks,
  trail,
  window01,
  wolf,
} from './kit';

/**
 * Traqueur : la lisière et la meute. Jade et feuilles pour la chasse, pâle électrique pour la foudre, rouge sombre pour les
 * saignements, ambre pour la résine. La meute est faite de loups spectraux qui chargent et reviennent.
 */

const JADE = '#7ED6A2';
const PALE = '#E9FFF2';
const STORM = '#8FEFFF';
const BLOOD = '#D9443A';
const RESIN = '#E8A23A';

/** Flèche en vol : hampe, pointe, empennage, sillage. `pts` : positions récentes (la dernière en tête). */
function arrowAt(st: Stage, pts: Pt[], col: string, s = 1, barbs = false): ReactNode {
  const p = pts[pts.length - 1]!;
  const q = pts[Math.max(0, pts.length - 2)]!;
  const a = angle(q, p);
  const len = 100 * st.k * s;
  const tail = polar(p, a + Math.PI, len);
  const head = (sx: number) => polar(p, a + Math.PI + sx * 0.45, 20 * st.k * s);
  return (
    <g>
      <g filter={SOFT}>{trail(pts, col, 14 * st.k * s, 0.55)}</g>
      {trail(pts, col, 3 * st.k * s, 0.8)}
      <line x1={tail[0]} y1={tail[1]} x2={p[0]} y2={p[1]} stroke="#E9DFC4" strokeWidth={5 * st.k * s} strokeLinecap="round" />
      {[-1, 1].map((sx) => {
        const f = polar(tail, a + Math.PI + sx * 0.5, 16 * st.k * s);
        return <line key={sx} x1={tail[0]} y1={tail[1]} x2={f[0]} y2={f[1]} stroke={col} strokeWidth={4 * st.k * s} strokeLinecap="round" />;
      })}
      <path d={d([polar(p, a, 10 * st.k * s), head(-1), head(1)], true)} fill={PALE} stroke={col} strokeWidth={2 * st.k} filter={GLOW} />
      {barbs &&
        [0.25, 0.45].map((u) => {
          const b = mix(p, tail, u);
          return [-1, 1].map((sx) => {
            const e = polar(b, a + Math.PI + sx * 0.7, 12 * st.k * s);
            return <line key={`${u}${sx}`} x1={b[0]} y1={b[1]} x2={e[0]} y2={e[1]} stroke="#C9C2B0" strokeWidth={3 * st.k} strokeLinecap="round" />;
          });
        })}
    </g>
  );
}
/** Positions d'un projectile suivant `path(u)`, de `u - lag` à `u`. */
const recent = (path: (u: number) => Pt, u: number, lag = 0.25, n = 6): Pt[] => Array.from({ length: n }, (_, j) => path(Math.max(0, u - lag + (lag * j) / (n - 1))));

/** Impact d'une flèche : anneau, éclats, feuilles. */
function arrowHit(i: number, st: Stage, h: Pt, u: number, col: string, s = 1): ReactNode {
  if (u < 0 || u > 1) return null;
  return (
    <g>
      {ring(h, u, { r0: 10 * st.k, r1: 60 * st.k * s, col, width: 4 * st.k })}
      {sparks(i, h, u, { n: st.reduced ? 4 : 8, spread: [-Math.PI, Math.PI], dist: 70 * st.k * s, size: 3 * st.k, col, hot: PALE, streak: true })}
      {!st.reduced &&
        Array.from({ length: 4 }, (_, j) => {
          const x = h[0] + (rnd(i, j + 30) - 0.3) * 80 * st.k * u;
          const y = h[1] + (-20 + 80 * u * u) * st.k * (0.6 + rnd(i, j + 40));
          return <g key={j} opacity={1 - u} transform={`translate(${x} ${y}) rotate(${u * 300 + j * 50})`}>{leaf(7 * st.k, col)}</g>;
        })}
    </g>
  );
}
/** Loup spectral qui part de derrière le personnage, bondit sur `to` et revient (ou s'évanouit). */
function charge(st: Stage, cs: Cast, to: Pt, t0: number, dur: number, o: { col?: string; back?: boolean; seed?: number; size?: number; lane?: number } = {}): ReactNode {
  const col = o.col ?? JADE;
  const size = (o.size ?? 120) * st.k;
  const start: Pt = [st.feet[0] - 120 * st.k, st.groundY - (o.lane ?? 0) * st.k];
  const end: Pt = [to[0] - 60 * st.k, st.groundY - (o.lane ?? 0) * st.k];
  const v = (cs.c - (cs.e.t - t0)) / dur;
  if (v < 0) return null;
  if (v <= 1) {
    const u = easeIn(v);
    const p = arc(start, end, u, (v > 0.75 ? Math.sin(((v - 0.75) / 0.25) * Math.PI) * 90 : 0) * st.k);
    const tr = Array.from({ length: 5 }, (_, j) => arc(start, end, easeIn(Math.max(0, v - 0.05 * (j + 1))), 0));
    return (
      <g>
        {tr.map((q, j) => <g key={j}>{wolf(q, size, (cs.c + j) * 20, col, 0.12 * (5 - j))}</g>)}
        {wolf(p, size, cs.c * 22 + (o.seed ?? 0), col, Math.min(1, v * 4))}
      </g>
    );
  }
  if (!o.back) {
    const f = (v - 1) / 0.4;
    return f < 1 ? wolf(end, size, 0, col, 1 - f) : null;
  }
  const f = (v - 1) / 0.6;
  if (f > 1) return null;
  const p = mix(end, start, easeIn(f));
  return wolf(p, size, cs.c * 22, col, 1 - f * 0.7, -1);
}
/** Morsure : deux arcs de crocs qui se referment sur `h`. */
function bite(st: Stage, h: Pt, u: number, col: string, rot = 0): ReactNode {
  if (u < 0 || u > 1) return null;
  const close = easeOut(span(u, 0, 0.25));
  const r = 46 * st.k;
  return (
    <g opacity={1 - span(u, 0.5, 1)} transform={`translate(${h[0]} ${h[1]}) rotate(${rot})`} filter={GLOW} fill={col}>
      {[-1, 1].map((sy) => (
        <g key={sy} transform={`translate(0 ${sy * lerp(34, 6, close) * st.k})`}>
          {Array.from({ length: 4 }, (_, j) => {
            const x = (-1.2 + j * 0.8) * 22 * st.k;
            return <path key={j} d={`M${x - 8 * st.k} 0 L${x} ${-sy * 18 * st.k} L${x + 8 * st.k} 0 Z`} transform={`scale(1 ${-1})`} />;
          })}
          <path d={`M${-r} 0 Q0 ${sy * 22 * st.k} ${r} 0`} fill="none" stroke={col} strokeWidth={4 * st.k} />
        </g>
      ))}
    </g>
  );
}
/** Soin sur le personnage : feuilles et croix vertes qui montent. */
function heal(i: number, st: Stage, u: number, n = 8): ReactNode {
  return (
    <g>
      {motes(i, [st.chest[0], st.feet[1] - 30 * st.k], u, { n, w: 140 * st.k, rise: 320 * st.k, size: 5 * st.k, col: '#9BE8B4', shape: 'plus' })}
      {halo(st.chest, 110 * st.k, JADE, 0.25 * Math.sin(Math.PI * clamp01(u)))}
    </g>
  );
}

const shot = (st: Stage, cs: Cast, to: Pt, travel: number, o: { lift?: number; col?: string; s?: number; barbs?: boolean; wave?: number } = {}): ReactNode => {
  const from = cs.from();
  const col = o.col ?? cs.col;
  const path = (u: number): Pt => {
    const p = arc(from, to, u, (o.lift ?? 22) * st.k);
    if (!o.wave) return p;
    return [p[0], p[1] + Math.sin(u * Math.PI * 2) * o.wave * st.k * (1 - u)];
  };
  const v = cs.sinceRelease / travel;
  if (v < 0 || v > 1) return null;
  return arrowAt(st, recent(path, v), col, o.s ?? cs.s, o.barbs);
};

/** Attaque de base : la pointe s'illumine, la flèche file avec un sillage de jade, éclate en feuilles. */
const basic: SpellFx = {
  gesture: 'attack_tracker',
  travel: 0.24,
  render: (st, cs) => (
    <g>
      {cs.tau > 0.04 && cs.sinceRelease < 0 && <circle cx={cs.from(cs.tau)[0]} cy={cs.from(cs.tau)[1]} r={(3 + 9 * (cs.tau / 0.3)) * st.k * cs.s} fill={cs.col} opacity={0.6} filter={GLOW} />}
      {shot(st, cs, st.hits[0]!, 0.24)}
      {arrowHit(cs.i, st, st.hits[0]!, cs.after / 0.5, cs.col, cs.s)}
    </g>
  ),
};

export const TRACKER_BASIC = basic;

export const TRACKER: Record<string, SpellFx> = {
  /** Lecture de piste : des empreintes s'allument au sol jusqu'à l'ennemi, la flèche suit la piste et le marque. */
  tr_read: {
    gesture: 'tr_aim',
    travel: 0.28,
    render: (st, cs) => {
      const hit = st.hits[0]!;
      const n = 7;
      return (
        <g>
          {Array.from({ length: n }, (_, j) => {
            const x = lerp(st.feet[0] + 60 * st.k, st.enemyX - 50 * st.k, j / (n - 1));
            const op = window01(cs.tau - j * 0.05, 0.05, 1.6, 0.1, 0.5);
            if (op <= 0) return null;
            const y = st.groundY + (j % 2 ? -6 : 6) * st.k;
            return (
              <g key={j} opacity={op} fill={JADE} filter={GLOW}>
                <ellipse cx={x} cy={y} rx={9 * st.k} ry={5 * st.k} />
                {[-1, 0, 1].map((t) => <circle key={t} cx={x + 10 * st.k} cy={y + t * 5 * st.k} r={2.4 * st.k} />)}
              </g>
            );
          })}
          {shot(st, cs, hit, 0.28)}
          {arrowHit(cs.i, st, hit, cs.after / 0.5, JADE)}
        </g>
      );
    },
  },

  /** Trait de poursuite : une flèche qui ondule comme une bête qui traque, longue traînée, et frappe là où la marque l'attendait. */
  tr_pursuit: {
    gesture: 'tr_aim',
    travel: 0.42,
    render: (st, cs) => (
      <g>
        {cs.tau > 0.1 && cs.sinceRelease < 0 && halo(cs.from(cs.tau), 22 * st.k, JADE, 0.7)}
        {shot(st, cs, st.hits[0]!, 0.42, { lift: 50, wave: 70 })}
        {arrowHit(cs.i, st, st.hits[0]!, cs.after / 0.55, JADE, 1.3)}
        {flash(st.hits[0]!, cs.after / 0.15, 50 * st.k, PALE)}
      </g>
    ),
  },

  /** Collet vif : une boucle de corde lancée se pose sous l'ennemi et se resserre d'un coup sec sur ses jambes. */
  tr_snare: {
    gesture: 'tr_throw',
    travel: 0.36,
    after: 0.9,
    render: (st, cs) => {
      const g: Pt = [st.hits[0]![0], st.groundY - 10 * st.k];
      const from = cs.from(0.36);
      const v = clamp01(cs.sinceRelease / 0.36);
      const p = arc(from, g, v, 120 * st.k);
      const tight = easeOut(span(cs.after, 0, 0.18));
      const rx = lerp(70, 30, tight) * st.k;
      return (
        <g>
          {cs.sinceRelease >= 0 && cs.after < 0 && (
            <g filter={GLOW}>
              <path d={smooth([from, mix(from, p, 0.5), p])} stroke="#C9B48A" strokeWidth={2.5 * st.k} fill="none" />
              <ellipse cx={p[0]} cy={p[1]} rx={22 * st.k} ry={9 * st.k} fill="none" stroke="#E9D7A8" strokeWidth={4 * st.k} transform={`rotate(${v * 400} ${p[0]} ${p[1]})`} />
            </g>
          )}
          {cs.after >= 0 && cs.after < 0.9 && (
            <g opacity={1 - span(cs.after, 0.6, 0.9)} filter={GLOW}>
              <ellipse cx={g[0]} cy={g[1] - 20 * st.k * tight} rx={rx} ry={rx * 0.3} fill="none" stroke="#E9D7A8" strokeWidth={5 * st.k} />
              <ellipse cx={g[0]} cy={g[1] - 20 * st.k * tight} rx={rx} ry={rx * 0.3} fill="none" stroke={JADE} strokeWidth={2 * st.k} />
            </g>
          )}
          {sparks(cs.i, g, cs.after / 0.3, { n: 6, spread: [-Math.PI, 0], dist: 40 * st.k, size: 2.5 * st.k, col: JADE })}
        </g>
      );
    },
  },

  /** Sifflet bref : un coup de sifflet, un loup spectral surgit de derrière lui, mord et revient ; un peu de vie revient avec lui. */
  tr_whistle: {
    gesture: 'tr_whistle',
    travel: 0.5,
    after: 0.9,
    render: (st, cs) => (
      <g>
        {cs.tau > 0.2 && cs.tau < 0.7 && ring(cs.from(0.32), span(cs.tau, 0.25, 0.7), { r0: 6 * st.k, r1: 40 * st.k, col: PALE, width: 3 * st.k })}
        {charge(st, cs, st.hits[0]!, 0.5, 0.5, { back: true })}
        {bite(st, st.hits[0]!, cs.after / 0.45, JADE)}
        {heal(cs.i, st, span(cs.after, 0.3, 1.2), 6)}
      </g>
    ),
  },

  /** Tir de travers : trois flèches décochées d'un coup en éventail, une par ennemi. */
  tr_broadside: {
    gesture: 'attack_tracker',
    travel: 0.26,
    render: (st, cs) => {
      const targets = [0, 1, 2].map((j) => st.hits[j] ?? ([st.hits[0]![0] + (j - 1) * 30 * st.k, st.hits[0]![1] + (j - 1) * 70 * st.k] as Pt));
      return (
        <g>
          {targets.map((h, j) => (
            <g key={j}>
              {shot(st, cs, h, 0.26, { lift: 10 + j * 30 })}
              {arrowHit(cs.i + j, st, h, (cs.after - j * 0.03) / 0.45, JADE, 0.8)}
            </g>
          ))}
        </g>
      );
    },
  },

  /** Repli couvert : il bondit en arrière dans un nuage de feuilles qui forme un couvert ; ce qui le rongeait se dissipe. */
  tr_retreat: {
    gesture: 'tr_dodge',
    travel: 0.24,
    render: (st, cs) => {
      const c = st.chest;
      const leaves = span(cs.tau, 0.05, 1.5);
      return (
        <g>
          {leaves > 0 && leaves < 1 && !st.reduced &&
            Array.from({ length: 14 }, (_, j) => {
              const a = rnd(cs.i, j) * Math.PI * 2 + leaves * 3;
              const r = (40 + 110 * easeOut(leaves)) * st.k * (0.5 + rnd(cs.i, j + 5));
              const p: Pt = [c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r * 0.9 + leaves * 40 * st.k];
              return <g key={j} opacity={Math.sin(Math.PI * leaves)} transform={`translate(${p[0]} ${p[1]}) rotate(${a * 57 + leaves * 200})`}>{leaf(9 * st.k, j % 3 ? JADE : '#4FA874')}</g>;
            })}
          {sparks(cs.i + 9, c, span(cs.tau, 0.1, 0.8), { n: 8, spread: [-Math.PI, Math.PI], dist: 90 * st.k, size: 3 * st.k, col: '#E9FFF2' })}
          {shot(st, cs, st.hits[0]!, 0.24)}
          {arrowHit(cs.i, st, st.hits[0]!, cs.after / 0.45, JADE)}
        </g>
      );
    },
  },

  /** Flèche barbelée : une flèche aux barbes d'acier qui reste plantée dans l'ennemi et le fait saigner. */
  tr_barbed: {
    gesture: 'tr_aim',
    travel: 0.26,
    after: 1.2,
    render: (st, cs) => {
      const hit = st.hits[0]!;
      const a = angle(cs.from(), hit);
      return (
        <g>
          {shot(st, cs, hit, 0.26, { col: '#C9C2B0', barbs: true })}
          {cs.after >= 0 && cs.after < 1.2 && (
            <g opacity={1 - span(cs.after, 0.8, 1.2)}>
              <line x1={polar(hit, a + Math.PI, 70 * st.k)[0]} y1={polar(hit, a + Math.PI, 70 * st.k)[1]} x2={hit[0]} y2={hit[1]} stroke="#E9DFC4" strokeWidth={5 * st.k} strokeLinecap="round" />
              {[-1, 1].map((sx) => {
                const t = polar(hit, a + Math.PI, 70 * st.k);
                const f = polar(t, a + Math.PI + sx * 0.5, 16 * st.k);
                return <line key={sx} x1={t[0]} y1={t[1]} x2={f[0]} y2={f[1]} stroke={JADE} strokeWidth={4 * st.k} />;
              })}
            </g>
          )}
          {sparks(cs.i, hit, cs.after / 0.5, { n: 8, spread: [Math.PI * 0.1, Math.PI * 0.9], dist: 50 * st.k, gravity: 120 * st.k, size: 4 * st.k, col: BLOOD })}
        </g>
      );
    },
  },

  /** Piège de résine : un pot de résine part en cloche et éclate en une flaque d'ambre gluante qui colle à l'ennemi. */
  tr_resin: {
    gesture: 'tr_throw',
    travel: 0.4,
    after: 1,
    col: RESIN,
    render: (st, cs) => {
      const hit = st.hits[0]!;
      const v = clamp01(cs.sinceRelease / 0.4);
      const p = arc(cs.from(0.36), hit, v, 140 * st.k);
      return (
        <g>
          {cs.sinceRelease >= 0 && cs.after < 0 && (
            <g transform={`translate(${p[0]} ${p[1]}) rotate(${v * 500})`}>
              <path d={`M${-12 * st.k} ${-14 * st.k} L${12 * st.k} ${-14 * st.k} L${16 * st.k} ${10 * st.k} Q0 ${20 * st.k} ${-16 * st.k} ${10 * st.k} Z`} fill="#7A5634" stroke={RESIN} strokeWidth={2 * st.k} />
              <ellipse cy={-14 * st.k} rx={12 * st.k} ry={4 * st.k} fill={RESIN} />
            </g>
          )}
          {cs.after >= 0 && cs.after < 1 && (
            <g opacity={1 - span(cs.after, 0.6, 1)}>
              {Array.from({ length: 7 }, (_, j) => {
                const a = (j / 7) * Math.PI * 2;
                const r = 46 * st.k * easeOut(span(cs.after, 0, 0.2)) * (0.6 + 0.4 * rnd(cs.i, j));
                const q = polar(hit, a, r);
                return <circle key={j} cx={q[0]} cy={q[1]} r={(10 + 6 * rnd(cs.i, j + 3)) * st.k} fill={RESIN} opacity={0.85} />;
              })}
              <circle cx={hit[0]} cy={hit[1]} r={30 * st.k * easeOut(span(cs.after, 0, 0.2))} fill={RESIN} />
              {[0, 1, 2].map((j) => <path key={j} d={`M${hit[0] + (j - 1) * 18 * st.k} ${hit[1] + 20 * st.k} q${3 * st.k} ${10 * st.k} 0 ${(14 + 40 * cs.after) * st.k}`} stroke={RESIN} strokeWidth={6 * st.k} strokeLinecap="round" fill="none" />)}
            </g>
          )}
        </g>
      );
    },
  },

  /** Battement de meute : deux loups frappent en rythme, l'un après l'autre ; chaque battement soigne le Traqueur. */
  tr_packbeat: {
    gesture: 'tr_whistle',
    travel: 0.5,
    after: 1.1,
    render: (st, cs) => (
      <g>
        {charge(st, cs, st.hits[0]!, 0.5, 0.5, { back: true, lane: 18 })}
        {charge(st, cs, st.hits[0]!, 0.2, 0.5, { back: true, lane: -14, seed: 3, size: 105 })}
        {bite(st, st.hits[0]!, cs.after / 0.4, JADE, -15)}
        {bite(st, st.hits[0]!, (cs.after - 0.3) / 0.4, JADE, 15)}
        {[0, 0.3].map((t, j) => (
          <g key={j}>{ring(st.chest, (cs.after - t) / 0.4, { r0: 30 * st.k, r1: 120 * st.k, col: '#9BE8B4', width: 4 * st.k })}</g>
        ))}
        {heal(cs.i, st, span(cs.after, 0.1, 1.1))}
      </g>
    ),
  },

  /** Regard fixe : ses yeux s'allument, un fil de foudre verrouille la cible, puis une flèche d'orage brise sa garde. */
  tr_stare: {
    gesture: 'tr_aim',
    travel: 0.14,
    col: STORM,
    render: (st, cs) => {
      const hit = st.hits[0]!;
      const eye = st.toPx([228, 128]);
      const lock = window01(cs.tau, 0.12, 0.62, 0.1, 0.05);
      return (
        <g>
          {cs.tau > 0.05 && cs.after < 0.3 && <g opacity={window01(cs.tau, 0.05, 1.1, 0.1, 0.3)}>{halo(eye, 16 * st.k, STORM, 0.9)}<circle cx={eye[0]} cy={eye[1]} r={4 * st.k} fill="#FFFFFF" /></g>}
          {lock > 0 && <line x1={cs.from(cs.tau)[0]} y1={cs.from(cs.tau)[1]} x2={hit[0]} y2={hit[1]} stroke={STORM} strokeWidth={1.5 * st.k} strokeDasharray={`${6 * st.k} ${6 * st.k}`} opacity={lock * 0.8} />}
          {lock > 0 && glyph('eye', hit, 30 * st.k, STORM, { draw: span(cs.tau, 0.12, 0.5), rot: 0, op: lock })}
          {cs.sinceRelease >= 0 && cs.after < 0.15 && (
            <g opacity={cs.after > 0 ? 1 - cs.after / 0.15 : 1} filter={GLOW}>
              <path d={d(bolt(cs.i, cs.from(), hit, 8, 14 * st.k, cs.c * 30))} stroke={STORM} strokeWidth={5 * st.k} fill="none" />
              <path d={d(bolt(cs.i, cs.from(), hit, 8, 14 * st.k, cs.c * 30))} stroke="#FFFFFF" strokeWidth={2 * st.k} fill="none" />
            </g>
          )}
          {flash(hit, cs.after / 0.2, 80 * st.k, '#E8FBFF')}
          {sparks(cs.i, hit, cs.after / 0.6, { n: 10, spread: [-Math.PI, 0], dist: 100 * st.k, gravity: 150 * st.k, size: 6 * st.k, col: '#9FD8FF' })}
        </g>
      );
    },
  },

  /** Filet d'orage : un filet de foudre s'ouvre en l'air, retombe sur les ennemis et crépite autour d'eux. */
  tr_net: {
    gesture: 'tr_volley',
    travel: 0.48,
    after: 1,
    col: STORM,
    render: (st, cs) => {
      const hits = st.hits.slice(0, 2);
      const cx = (hits[0]![0] + hits[hits.length - 1]![0]) / 2;
      const v = clamp01(cs.sinceRelease / 0.48);
      const top = arc(cs.from(), [cx, st.groundY - st.enemyH * 0.95], v, 160 * st.k);
      const open = easeOut(v);
      const W = (90 + 70 * (hits.length - 1)) * st.k * open;
      const H = st.enemyH * 0.95;
      const net = (y0: number, h: number, op: number) => (
        <g opacity={op} stroke={STORM} strokeWidth={2 * st.k} filter={GLOW}>
          {Array.from({ length: 7 }, (_, j) => <line key={`v${j}`} x1={cx - W + (j / 6) * 2 * W} y1={y0} x2={cx - W * 0.8 + (j / 6) * 1.6 * W} y2={y0 + h} />)}
          {Array.from({ length: 5 }, (_, j) => {
            const y = y0 + (j / 4) * h;
            const w = lerp(W, W * 0.8, j / 4);
            return <path key={`h${j}`} d={`M${cx - w} ${y} Q${cx} ${y + 12 * st.k} ${cx + w} ${y}`} fill="none" />;
          })}
        </g>
      );
      return (
        <g>
          {cs.sinceRelease >= 0 && cs.after < 0 && net(top[1], 40 * st.k * open, 0.9)}
          {cs.after >= 0 && cs.after < 1 && net(st.groundY - H * (1 - 0.1 * easeOut(cs.after / 0.2)), H, 1 - span(cs.after, 0.6, 1))}
          {cs.after >= 0 && cs.after < 0.9 && hits.map((h, j) => (
            <g key={j} opacity={1 - span(cs.after, 0.5, 0.9)} filter={GLOW}>
              <path d={d(bolt(cs.i + j, [h[0] - 50 * st.k, h[1]], [h[0] + 50 * st.k, h[1] - 30 * st.k], 6, 14 * st.k, cs.c * 25))} stroke="#FFFFFF" strokeWidth={2 * st.k} fill="none" />
            </g>
          ))}
        </g>
      );
    },
  },

  /** Rappel au couvert : la meute tourne autour de lui dans un tourbillon de feuilles ; il se relève, lavé de ce qui le rongeait. */
  tr_cover: {
    gesture: 'tr_whistle',
    travel: 0.3,
    after: 1.2,
    render: (st, cs) => {
      const u = span(cs.tau, 0.3, 1.9);
      const c: Pt = [st.chest[0], st.groundY];
      return (
        <g>
          {u > 0 && u < 1 &&
            [0, 1, 2].map((j) => {
              const a = u * Math.PI * 4 + (j * Math.PI * 2) / 3;
              const p: Pt = [c[0] + Math.cos(a) * 150 * st.k, c[1] - 10 * st.k + Math.sin(a) * 18 * st.k];
              return <g key={j}>{wolf(p, 95 * st.k, cs.c * 22 + j, JADE, Math.sin(Math.PI * u) * (Math.sin(a) > 0 ? 1 : 0.45), Math.cos(a + Math.PI / 2) > 0 ? 1 : -1)}</g>;
            })}
          {u > 0 && u < 1 && !st.reduced &&
            Array.from({ length: 10 }, (_, j) => {
              const a = u * 9 + j * 0.63;
              const p: Pt = [st.chest[0] + Math.cos(a) * 110 * st.k, st.chest[1] + 100 * st.k - u * 260 * st.k * rnd(cs.i, j) + Math.sin(a) * 30 * st.k];
              return <g key={`l${j}`} opacity={Math.sin(Math.PI * u)} transform={`translate(${p[0]} ${p[1]}) rotate(${a * 60})`}>{leaf(8 * st.k, JADE)}</g>;
            })}
          {heal(cs.i, st, span(cs.tau, 0.5, 2))}
          {arrowHit(cs.i, st, st.hits[0]!, cs.after / 0.5, JADE, 0.7)}
        </g>
      );
    },
  },

  /** Tir à la couture : un trait d'aiguille presque invisible qui traverse l'ennemi de part en part et ressort derrière lui. */
  tr_seam: {
    gesture: 'tr_aim',
    travel: 0.16,
    col: PALE,
    render: (st, cs) => {
      const hit = st.hits[0]!;
      const from = cs.from();
      const out = polar(hit, angle(from, hit), st.w);
      const v = clamp01((cs.c - cs.release) / 0.3);
      const tip = mix(from, out, easeIn(v));
      const on = cs.sinceRelease >= 0 && cs.after < 0.6;
      return (
        <g>
          {cs.tau > 0.2 && cs.sinceRelease < 0 && <line x1={from[0]} y1={from[1]} x2={hit[0]} y2={hit[1]} stroke={PALE} strokeWidth={1 * st.k} opacity={0.35 * span(cs.tau, 0.2, 0.6)} />}
          {on && (
            <g opacity={cs.after > 0.2 ? 1 - (cs.after - 0.2) / 0.4 : 1} filter={GLOW}>
              <line x1={from[0]} y1={from[1]} x2={tip[0]} y2={tip[1]} stroke={JADE} strokeWidth={6 * st.k} strokeLinecap="round" opacity={0.5} />
              <line x1={from[0]} y1={from[1]} x2={tip[0]} y2={tip[1]} stroke="#FFFFFF" strokeWidth={2 * st.k} strokeLinecap="round" />
            </g>
          )}
          {/* Les points de couture restent un instant sur la trajectoire. */}
          {cs.after >= 0 && cs.after < 0.8 &&
            [-3, -2, -1, 1, 2, 3].map((j) => {
              const p = polar(hit, angle(from, hit), j * 26 * st.k);
              return <line key={j} x1={p[0] - 6 * st.k} y1={p[1] - 8 * st.k} x2={p[0] + 6 * st.k} y2={p[1] + 8 * st.k} stroke={PALE} strokeWidth={3 * st.k} opacity={1 - cs.after / 0.8} />;
            })}
          {flash(hit, cs.after / 0.12, 40 * st.k)}
        </g>
      );
    },
  },

  /** Morsure croisée : deux loups surgissent en haut et en bas et se croisent sur l'ennemi : une entaille en X qui saigne. */
  tr_crossbite: {
    gesture: 'tr_whistle',
    travel: 0.48,
    after: 1,
    col: BLOOD,
    render: (st, cs) => {
      const hit = st.hits[0]!;
      const leap = (sy: 1 | -1) => {
        const v = cs.sinceRelease / 0.48;
        if (v < 0 || cs.after > 0.25) return null;
        const start: Pt = [hit[0] - 260 * st.k, hit[1] - sy * 140 * st.k];
        const end: Pt = [hit[0] + 60 * st.k, hit[1] + sy * 60 * st.k];
        const p = mix(start, end, easeIn(Math.min(1, v + cs.after * 2)));
        return <g transform={`rotate(${sy * 24} ${p[0]} ${p[1]})`}>{wolf(p, 110 * st.k, cs.c * 20, JADE, cs.after > 0 ? 1 - cs.after / 0.25 : Math.min(1, v * 3))}</g>;
      };
      return (
        <g>
          {leap(1)}
          {leap(-1)}
          {cs.after >= 0 && cs.after < 1 && (
            <g opacity={1 - span(cs.after, 0.5, 1)} stroke={BLOOD} strokeLinecap="round" filter={GLOW}>
              {[-1, 1].map((sgn) => {
                const len = 60 * st.k * easeOut(span(cs.after, 0, 0.12));
                return <line key={sgn} x1={hit[0] - len} y1={hit[1] - len * sgn} x2={hit[0] + len} y2={hit[1] + len * sgn} strokeWidth={8 * st.k} />;
              })}
            </g>
          )}
          {sparks(cs.i, hit, cs.after / 0.6, { n: 10, spread: [Math.PI * 0.05, Math.PI * 0.95], dist: 60 * st.k, gravity: 150 * st.k, size: 4 * st.k, col: BLOOD })}
        </g>
      );
    },
  },

  /** Pas de côté : il esquive en laissant son image derrière lui, et sa flèche d'orage se dédouble en vol vers deux ennemis. */
  tr_sidestep: {
    gesture: 'tr_dodge',
    travel: 0.24,
    col: STORM,
    render: (st, cs) => {
      const hits = [st.hits[0]!, st.hits[1] ?? ([st.hits[0]![0] + 20 * st.k, st.hits[0]![1] - 80 * st.k] as Pt)];
      const from = cs.from();
      const v = clamp01(cs.sinceRelease / 0.24);
      const split = 0.4;
      return (
        <g>
          {cs.tau > 0 && cs.tau < 0.6 && <ellipse cx={st.chest[0] + 40 * st.k} cy={st.chest[1] + 60 * st.k} rx={60 * st.k} ry={260 * st.k} fill={STORM} opacity={0.18 * (1 - cs.tau / 0.6)} filter={BLUR} />}
          {cs.sinceRelease >= 0 && cs.after < 0 &&
            hits.map((h, j) => {
              const mid = mix(from, mix(h, hits[0]!, 0.5), split);
              const path = (u: number): Pt => (u < split ? mix(from, mid, u / split) : mix(mid, h, (u - split) / (1 - split)));
              if (j === 1 && v < split) return null;
              return (
                <g key={j} filter={GLOW}>
                  <path d={d(bolt(cs.i + j, path(Math.max(0, v - 0.3)), path(v), 4, 8 * st.k, cs.c * 30))} stroke={STORM} strokeWidth={5 * st.k} fill="none" />
                  <circle cx={path(v)[0]} cy={path(v)[1]} r={6 * st.k} fill="#FFFFFF" />
                </g>
              );
            })}
          {hits.map((h, j) => <g key={j}>{flash(h, cs.after / 0.18, 60 * st.k, '#E8FBFF')}{sparks(cs.i + j, h, cs.after / 0.5, { n: 8, spread: [-Math.PI, Math.PI], dist: 70 * st.k, size: 3 * st.k, col: STORM, streak: true })}</g>)}
        </g>
      );
    },
  },

  /** Dents de fer : un piège à loup lancé s'ouvre sous l'ennemi et se referme d'un claquement — il reste sonné. */
  tr_iron_teeth: {
    gesture: 'tr_throw',
    travel: 0.36,
    after: 1.1,
    col: '#C9C2B0',
    render: (st, cs) => {
      const g: Pt = [st.hits[0]![0] - 10 * st.k, st.groundY];
      const v = clamp01(cs.sinceRelease / 0.36);
      const p = arc(cs.from(0.36), g, v, 130 * st.k);
      const close = span(cs.after, 0, 0.1);
      return (
        <g>
          {cs.sinceRelease >= 0 && cs.after < 0 && <g transform={`rotate(${v * 360} ${p[0]} ${p[1]})`}>{bearTrap(p, 70 * st.k, 0.3, '#C9C2B0')}</g>}
          {cs.after >= 0 && cs.after < 1.1 && <g opacity={1 - span(cs.after, 0.7, 1.1)}>{bearTrap(g, 110 * st.k, close, '#D8D1C2')}</g>}
          {flash([g[0], g[1] - 20 * st.k], (cs.after - 0.08) / 0.15, 50 * st.k)}
          {sparks(cs.i, [g[0], g[1] - 20 * st.k], (cs.after - 0.08) / 0.4, { n: 10, spread: [-Math.PI * 0.9, -Math.PI * 0.1], dist: 70 * st.k, gravity: 60 * st.k, size: 3 * st.k, col: '#FFF1CF', streak: true })}
        </g>
      );
    },
  },

  /** Flèches de gêne : une pluie de petites flèches tirées en cloche s'abat sur l'ennemi et l'empêche de bien frapper. */
  tr_harass: {
    gesture: 'tr_volley',
    travel: 0.55,
    render: (st, cs) => {
      const hit = st.hits[0]!;
      const from = cs.from();
      return (
        <g>
          {Array.from({ length: st.reduced ? 3 : 6 }, (_, j) => {
            const delay = j * 0.05;
            const v = (cs.sinceRelease - delay) / 0.55;
            if (v < 0 || v > 1) return null;
            const to: Pt = [hit[0] + (rnd(cs.i, j) - 0.5) * 90 * st.k, hit[1] + (rnd(cs.i, j + 5) - 0.5) * 120 * st.k];
            const path = (u: number) => arc(from, to, u, 260 * st.k);
            return <g key={j}>{arrowAt(st, recent(path, v, 0.15, 4), JADE, 0.6)}</g>;
          })}
          {Array.from({ length: st.reduced ? 3 : 6 }, (_, j) => {
            const to: Pt = [hit[0] + (rnd(cs.i, j) - 0.5) * 90 * st.k, hit[1] + (rnd(cs.i, j + 5) - 0.5) * 120 * st.k];
            return <g key={`h${j}`}>{ring(to, (cs.after + 0.25 - j * 0.05) / 0.35, { r0: 5 * st.k, r1: 30 * st.k, col: JADE, width: 3 * st.k })}</g>;
          })}
        </g>
      );
    },
  },

  /** Laissé pour compte : un loup reste en arrière et hurle ; son hurlement d'orage enchaîne l'ennemi qui ralentit. */
  tr_leftbehind: {
    gesture: 'tr_whistle',
    travel: 0.45,
    after: 1.2,
    col: STORM,
    render: (st, cs) => {
      const hit = st.hits[0]!;
      const pos: Pt = [lerp(st.feet[0], st.enemyX, 0.45), st.groundY];
      const on = window01(cs.tau, 0.25, cs.e.t - cs.start + 1.2, 0.2, 0.4);
      const howl = cs.c - cs.release;
      return (
        <g>
          {on > 0 && <g transform={`rotate(-14 ${pos[0]} ${pos[1]})`}>{wolf(pos, 120 * st.k, 0, STORM, on)}</g>}
          {[0, 1, 2].map((j) => {
            const u = (howl - j * 0.12) / 0.5;
            if (u < 0 || u > 1) return null;
            const r = lerp(20, 140, u) * st.k;
            return <path key={j} d={`M${pos[0] + 70 * st.k} ${pos[1] - 120 * st.k - r} A${r * 0.5} ${r} 0 0 1 ${pos[0] + 70 * st.k} ${pos[1] - 120 * st.k + r}`} fill="none" stroke={STORM} strokeWidth={4 * st.k * (1 - u)} opacity={1 - u} filter={GLOW} />;
          })}
          {cs.after >= 0 && cs.after < 1.2 && (
            <g opacity={1 - span(cs.after, 0.8, 1.2)} filter={GLOW}>
              {[-1, 1].map((sy) => (
                <path key={sy} d={d(bolt(cs.i + sy, [hit[0] - 70 * st.k, st.groundY - 10 * st.k], [hit[0] + 70 * st.k, hit[1] + sy * 40 * st.k], 7, 10 * st.k, cs.c * 20))} stroke={STORM} strokeWidth={3 * st.k} fill="none" />
              ))}
            </g>
          )}
        </g>
      );
    },
  },

  /** Garde de meute : un grand loup vient se poster devant lui, crocs dehors ; un voile de jade le protège tant qu'il est là. */
  tr_packguard: {
    gesture: 'tr_whistle',
    travel: 0.3,
    after: 1,
    render: (st, cs) => {
      const pos: Pt = [st.feet[0] + 150 * st.k, st.groundY];
      const v = span(cs.tau, 0.3, 0.75);
      const p = mix([st.feet[0] - 150 * st.k, st.groundY], pos, easeOut(v));
      const op = window01(cs.tau, 0.3, cs.e.t - cs.start + 1.5, 0.15, 0.5);
      return (
        <g>
          {op > 0 && wolf(p, 140 * st.k, v < 1 ? cs.c * 22 : 0, JADE, op)}
          {v >= 1 && op > 0 && <path d={`M${pos[0] + 80 * st.k} ${st.groundY - 260 * st.k} Q${pos[0] + 140 * st.k} ${st.groundY - 130 * st.k} ${pos[0] + 80 * st.k} ${st.groundY}`} fill="none" stroke={JADE} strokeWidth={5 * st.k} opacity={op * 0.7} filter={GLOW} />}
          {arrowHit(cs.i, st, st.hits[0]!, cs.after / 0.45, JADE, 0.7)}
        </g>
      );
    },
  },

  /** Partage de chasse : le loup mord et rapporte une part de la proie — un orbe de jade qui revient soigner le Traqueur. */
  tr_share: {
    gesture: 'tr_whistle',
    travel: 0.5,
    after: 1.2,
    render: (st, cs) => {
      const hit = st.hits[0]!;
      const v = span(cs.after, 0.25, 0.85);
      const orb = arc(hit, st.chest, easeInOutSafe(v), 90 * st.k);
      return (
        <g>
          {charge(st, cs, hit, 0.5, 0.5, { back: true })}
          {bite(st, hit, cs.after / 0.4, JADE)}
          {v > 0 && v < 1 && (
            <g filter={GLOW}>
              {halo(orb, 24 * st.k, JADE, 0.8)}
              <circle cx={orb[0]} cy={orb[1]} r={9 * st.k} fill={PALE} />
            </g>
          )}
          {heal(cs.i, st, span(cs.after, 0.8, 1.6))}
        </g>
      );
    },
  },

  /** Retour de la meute : trois loups d'orage chargent ensemble dans un fracas de foudre, puis rentrent ; le Traqueur est soigné et lavé. */
  tr_packreturn: {
    gesture: 'tr_whistle',
    travel: 0.5,
    after: 1.2,
    col: STORM,
    render: (st, cs) => (
      <g>
        {[0, 1, 2].map((j) => (
          <g key={j}>{charge(st, cs, st.hits[0]!, 0.5 - j * 0.06, 0.5, { back: true, col: STORM, lane: (j - 1) * 22, seed: j, size: 100 + j * 10 })}</g>
        ))}
        {cs.after >= 0 && cs.after < 0.4 && (
          <g opacity={1 - cs.after / 0.4} filter={GLOW}>
            {[0, 1, 2].map((j) => <path key={j} d={d(bolt(cs.i + j, [st.hits[0]![0], 0], st.hits[0]!, 7, 22 * st.k, cs.c * 20))} stroke="#FFFFFF" strokeWidth={3 * st.k} fill="none" />)}
          </g>
        )}
        {flash(st.hits[0]!, cs.after / 0.2, 80 * st.k, '#E8FBFF')}
        {heal(cs.i, st, span(cs.after, 0.5, 1.4), 10)}
      </g>
    ),
  },

  /**
   * La Grande Battue (ultime) : un long appel, la meute entière déferle à travers la scène, le Traqueur décoche vers le ciel
   * et une pluie de flèches de jade s'abat ; chaque ennemi est marqué.
   */
  tr_grand_hunt: {
    gesture: 'tr_ultimate',
    travel: 0.55,
    after: 1.4,
    render: (st, cs) => {
      const hits = st.hits;
      const from = cs.from();
      return (
        <g>
          {cs.tau > 0.15 && cs.tau < 1 && [0, 1, 2].map((j) => <g key={j}>{ring(cs.from(0.32), span(cs.tau, 0.2 + j * 0.15, 0.7 + j * 0.15), { r0: 8 * st.k, r1: 120 * st.k, col: PALE, width: 3 * st.k })}</g>)}
          {cs.tau > 0.5 && cs.after < 1 &&
            Array.from({ length: st.reduced ? 3 : 5 }, (_, j) => {
              const v = (cs.tau - 0.5 - j * 0.12) / 1.3;
              if (v < 0 || v > 1) return null;
              const p: Pt = [lerp(-150 * st.k, st.w + 150 * st.k, easeIn(v)), st.groundY - ((j % 3) - 1) * 18 * st.k];
              return <g key={j}>{wolf(p, (110 + 15 * (j % 2)) * st.k, cs.c * 24 + j, JADE, Math.sin(Math.PI * v))}</g>;
            })}
          {Array.from({ length: st.reduced ? 5 : 12 }, (_, j) => {
            const v = (cs.sinceRelease - j * 0.03) / 0.55;
            if (v < 0 || v > 1) return null;
            const h = hits[j % hits.length]!;
            const to: Pt = [h[0] + (rnd(cs.i, j) - 0.5) * 120 * st.k, h[1] + (rnd(cs.i, j + 5) - 0.5) * 140 * st.k];
            return <g key={j}>{arrowAt(st, recent((u) => arc(from, to, u, 300 * st.k), v, 0.15, 4), JADE, 0.7)}</g>;
          })}
          {hits.map((h, j) => (
            <g key={j}>
              {arrowHit(cs.i + j, st, h, (cs.after - j * 0.05) / 0.6, JADE, 1.4)}
              {cs.after > 0.2 && cs.after < 1.4 && glyph('eye', [h[0], h[1] - st.enemyH * 0.62], 22 * st.k, JADE, { draw: span(cs.after, 0.2, 0.6), op: 1 - span(cs.after, 1, 1.4) })}
            </g>
          ))}
          {heal(cs.i, st, span(cs.after, 0.4, 1.4), 10)}
        </g>
      );
    },
  },
};

function easeInOutSafe(u: number) {
  const v = clamp01(u);
  return v < 0.5 ? 2 * v * v : 1 - (-2 * v + 2) ** 2 / 2;
}

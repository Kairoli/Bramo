import type { ReactNode } from 'react';
import {
  type Cast,
  type Pt,
  type SpellFx,
  type Stage,
  BLUR,
  GLOW,
  SOFT,
  anvilShape,
  arc,
  clamp01,
  d,
  easeIn,
  easeOut,
  flame,
  flash,
  halo,
  hammerShape,
  hexPlate,
  lerp,
  mix,
  motes,
  polar,
  ring,
  rivetShape,
  rnd,
  smooth,
  span,
  sparks,
  trail,
  window01,
} from './kit';

/**
 * Forgefeu : la forge au combat. Couleurs du métal chauffé (du rouge sombre au jaune blanc), vapeur des trempes, acier des
 * plaques et des rivets. Chaque sort a sa signature : rien n'est une simple recoloration.
 */

const FORGE = '#F08A4B';
const HOT = '#FFE2A8';
const FIRE = '#FF7A2E';
const WHITE_HOT = '#FFF4D6';
const STEEL = '#D9D2C5';

/** Sol sous un ennemi. */
const under = (st: Stage, j = 0): Pt => [st.hits[j]?.[0] ?? st.enemyX, st.groundY];
/** Faille de feu au sol de `a` à `b`, tracée jusqu'à `u`. */
function fissure(i: number, st: Stage, a: Pt, b: Pt, u: number, col: string, width: number): ReactNode {
  const n = 16;
  const pts: Pt[] = [];
  for (let j = 0; j <= n * u; j++) pts.push([lerp(a[0], b[0], j / n), st.groundY + (j % 2 ? -1 : 1) * (2 + 4 * rnd(i, j + 60)) * st.k]);
  pts.push([lerp(a[0], b[0], u), st.groundY]);
  return (
    <g>
      <path d={d(pts)} fill="none" stroke={col} strokeWidth={width * 2.6} opacity={0.55} filter={SOFT} />
      <path d={d(pts)} fill="none" stroke={col} strokeWidth={width} strokeLinejoin="round" />
      <path d={d(pts)} fill="none" stroke={WHITE_HOT} strokeWidth={width * 0.4} strokeLinejoin="round" />
      {u < 1 && <circle cx={lerp(a[0], b[0], u)} cy={st.groundY - 3 * st.k} r={width * 1.6} fill={WHITE_HOT} filter={GLOW} />}
    </g>
  );
}
/** Trois langues de feu qui jaillissent sous `p`. */
function geyser(i: number, st: Stage, p: Pt, u: number, height: number, s: number): ReactNode {
  if (u < 0 || u > 1) return null;
  const rise = easeOut(span(u, 0, 0.25));
  const w = 52 * st.k * s * (1 - 0.35 * u);
  const ph = u * 14;
  return (
    <g opacity={1 - u * u}>
      <ellipse cx={p[0]} cy={p[1]} rx={110 * st.k * s} ry={18 * st.k * s} fill={FIRE} opacity={0.4} filter={SOFT} />
      {flame([p[0] - 34 * st.k * s, p[1]], height * 0.62 * rise, w * 0.8, ph + 1.3)}
      {flame([p[0] + 36 * st.k * s, p[1]], height * 0.7 * rise, w * 0.85, ph + 2.6)}
      <g filter={GLOW}>{flame(p, height * rise, w, ph)}</g>
      {sparks(i, [p[0], p[1] - height * 0.3], u, { n: st.reduced ? 5 : 12, spread: [-Math.PI * 0.95, -Math.PI * 0.05], dist: height * 0.9, gravity: 40 * st.k, size: 3 * st.k, col: '#FFB054', hot: WHITE_HOT })}
    </g>
  );
}
/** Trace de la masse pendant un geste (les dernières 70 ms de sa course). */
function swingTrail(cs: Cast, from: number, to: number, col: string, width: number): ReactNode {
  if (cs.tau < from || cs.tau > to + 0.1) return null;
  const end = Math.min(to, cs.tau);
  const pts = Array.from({ length: 10 }, (_, j) => cs.from(Math.max(from, end - 0.07 + (j * 0.07) / 9)));
  const fade = cs.tau > to ? 1 - (cs.tau - to) / 0.1 : 1;
  return (
    <g opacity={fade}>
      {trail(pts, col, width * 2.2, 0.55)}
      {trail(pts.slice(4), WHITE_HOT, width * 0.8, 0.9)}
    </g>
  );
}
/** Bouclier de plaques hexagonales autour du personnage (`u` : 0 à 1 assemblage). */
function plates(i: number, st: Stage, u: number, col: string, n = 7, r = 30): ReactNode {
  const R = r * st.k;
  const c = st.chest;
  return (
    <g>
      {Array.from({ length: n }, (_, j) => {
        const a = -Math.PI / 2 + ((j - (n - 1) / 2) / n) * Math.PI * 1.1;
        const home = polar(c, a + Math.PI * 0.5 * 0, 150 * st.k);
        const start = polar(c, a, 420 * st.k);
        const v = easeOut(span(u, j * 0.05, j * 0.05 + 0.6));
        const p = mix(start, home, v);
        return (
          <g key={j} transform={`translate(${p[0]} ${p[1]}) rotate(${(1 - v) * 180 + j * 9})`} opacity={v}>
            {hexPlate(R, col)}
          </g>
        );
      })}
    </g>
  );
}

/** Attaque de base : la masse frappe le sol, une faille de feu court jusqu'à l'ennemi et jaillit sous lui. */
const basic: SpellFx = {
  gesture: 'attack_forgefire',
  travel: 0.34,
  render: (st, cs) => {
    const slam: Pt = [cs.from()[0], st.groundY];
    return (
      <g>
        {swingTrail(cs, 0.34, 0.46, cs.col, 6 * st.k * cs.s)}
        {ring(slam, cs.sinceRelease / 0.55, { r0: 20 * st.k, r1: 120 * st.k * cs.s, col: cs.col, width: 5 * st.k, flat: 0.24 })}
        {sparks(cs.i, slam, cs.sinceRelease / 0.55, { n: st.reduced ? 4 : 9, spread: [-Math.PI * 0.9, -Math.PI * 0.1], dist: 100 * st.k * cs.s, gravity: 80 * st.k, size: 3 * st.k, col: HOT })}
        {cs.sinceRelease >= 0 && cs.after < 0.7 && <g opacity={cs.after > 0 ? 1 - cs.after / 0.7 : 1}>{fissure(cs.i, st, slam, under(st), clamp01(cs.sinceRelease / 0.34), cs.col, 5 * st.k * cs.s)}</g>}
        {geyser(cs.i, st, under(st), cs.after / 0.75, st.enemyH * 0.95 * cs.s, cs.s)}
      </g>
    );
  },
};

export const FORGEFIRE_BASIC = basic;

export const FORGEFIRE: Record<string, SpellFx> = {
  /** Frappe d'atelier : un coup sur l'enclume. Gerbe d'étincelles blanches en éventail, une braise revient au marteau. */
  fg_workshop: {
    gesture: 'ff_sweep',
    travel: 0.14,
    col: FORGE,
    render: (st, cs) => {
      const hit = st.hits[0]!;
      const head = cs.from(0.42);
      return (
        <g>
          {swingTrail(cs, 0.3, 0.42, FORGE, 6 * st.k)}
          {cs.sinceRelease >= 0 && cs.after < 0 && <path d={smooth([head, mix(head, hit, 0.5), hit])} stroke={HOT} strokeWidth={4 * st.k} opacity={0.7} filter={GLOW} />}
          {flash(hit, cs.after / 0.18, 50 * st.k * cs.s, WHITE_HOT)}
          {sparks(cs.i, hit, cs.after / 0.6, { n: st.reduced ? 8 : 18, spread: [-Math.PI * 0.75, Math.PI * 0.2], dist: 150 * st.k * cs.s, gravity: 120 * st.k, size: 3.5 * st.k, col: HOT, hot: WHITE_HOT, streak: true })}
          {/* La braise gagnée revient au marteau. */}
          {cs.after > 0.15 && cs.after < 0.75 && (() => {
            const v = span(cs.after, 0.15, 0.75);
            const p = arc(hit, st.chest, easeIn(v), 60 * st.k);
            return (
              <g filter={GLOW}>
                <circle cx={p[0]} cy={p[1]} r={7 * st.k} fill={FIRE} />
                <circle cx={p[0]} cy={p[1]} r={3.5 * st.k} fill={WHITE_HOT} />
              </g>
            );
          })()}
        </g>
      );
    },
  },

  /** Trempe vive : les braises tournent autour de la masse, puis la trempe — une explosion de vapeur qui siffle sur l'ennemi. */
  fg_quench: {
    gesture: 'attack_forgefire',
    travel: 0.3,
    col: FIRE,
    render: (st, cs) => {
      const hit = st.hits[0]!;
      const slam: Pt = [cs.from()[0], st.groundY];
      const embers = cs.tau >= 0 && cs.tau < 0.46 ? cs.from(cs.tau) : null;
      return (
        <g>
          {embers &&
            Array.from({ length: 5 }, (_, j) => {
              const a = cs.tau * 12 + (j * Math.PI * 2) / 5;
              const p = polar(embers, a, 26 * st.k);
              return <circle key={j} cx={p[0]} cy={p[1]} r={5 * st.k} fill={FIRE} filter={GLOW} />;
            })}
          {swingTrail(cs, 0.34, 0.46, FIRE, 6 * st.k)}
          {cs.sinceRelease >= 0 && cs.after < 0 && (() => {
            const p = arc(slam, hit, span(cs.sinceRelease, 0, 0.3), 90 * st.k);
            return <g filter={GLOW}><circle cx={p[0]} cy={p[1]} r={14 * st.k} fill={FIRE} /><circle cx={p[0]} cy={p[1]} r={6 * st.k} fill={WHITE_HOT} /></g>;
          })()}
          {cs.after >= 0 && cs.after < 1.1 && (
            <g opacity={1 - span(cs.after, 0.4, 1.1)}>
              {Array.from({ length: st.reduced ? 4 : 8 }, (_, j) => {
                const v = easeOut(span(cs.after, 0, 0.9));
                const a = -Math.PI / 2 + (rnd(cs.i, j) - 0.5) * 2.4;
                const p = polar(hit, a, (30 + 90 * rnd(cs.i, j + 9)) * st.k * v * cs.s);
                return <circle key={j} cx={p[0]} cy={p[1] - 40 * st.k * v} r={(30 + 26 * rnd(cs.i, j + 3)) * st.k * (0.5 + v) * cs.s} fill="url(#fx-steam)" />;
              })}
            </g>
          )}
          {flash(hit, cs.after / 0.2, 60 * st.k * cs.s, '#FFFFFF')}
          {sparks(cs.i, hit, cs.after / 0.5, { n: 10, spread: [-Math.PI, 0], dist: 90 * st.k, gravity: 60 * st.k, size: 2.5 * st.k, col: FIRE, hot: WHITE_HOT })}
        </g>
      );
    },
  },

  /** Éclat du four : la gueule du four s'ouvre — un cône de flammes roule vers les ennemis et les embrase tous. */
  fg_furnace: {
    gesture: 'ff_upper',
    travel: 0.36,
    col: FIRE,
    render: (st, cs) => {
      const o = cs.from(0.44);
      const front = clamp01(cs.sinceRelease / 0.36);
      const far = st.hits[st.hits.length - 1]!;
      const reach = lerp(o[0], far[0] + 60 * st.k, front);
      return (
        <g>
          {swingTrail(cs, 0.3, 0.44, FIRE, 6 * st.k)}
          {cs.sinceRelease >= 0 && cs.after < 0.6 && (
            <g opacity={cs.after > 0 ? 1 - cs.after / 0.6 : 1}>
              {Array.from({ length: st.reduced ? 7 : 14 }, (_, j) => {
                const x = lerp(o[0], reach, rnd(cs.i, j) ** 0.7);
                const spread = ((x - o[0]) / Math.max(1, far[0] - o[0])) * 90 * st.k;
                const y = lerp(o[1], st.groundY - st.enemyH * 0.45, (x - o[0]) / Math.max(1, far[0] - o[0])) + (rnd(cs.i, j + 7) - 0.5) * spread;
                const r = (12 + 22 * rnd(cs.i, j + 3)) * st.k * (0.4 + (x - o[0]) / Math.max(1, far[0] - o[0]));
                return <circle key={j} cx={x} cy={y} r={r} fill={j % 3 ? FIRE : HOT} opacity={0.55} filter={SOFT} />;
              })}
              <path d={`M${o[0]} ${o[1]} L${reach} ${o[1] - 90 * st.k * front} L${reach} ${st.groundY - 20 * st.k} Z`} fill={FIRE} opacity={0.25} filter={BLUR} />
            </g>
          )}
          {st.hits.map((h, j) => (
            <g key={j}>{geyser(cs.i + j, st, [h[0], st.groundY], (cs.after - j * 0.06) / 0.6, st.enemyH * 0.5, 0.7)}</g>
          ))}
        </g>
      );
    },
  },

  /** Garde rouge : des plaques chauffées au rouge volent se verrouiller autour de lui. */
  fg_guard: {
    gesture: 'ff_brace',
    travel: 0.25,
    col: '#E2523A',
    render: (st, cs) => (
      <g>
        {cs.tau > 0.1 && cs.after < 0.9 && <g opacity={cs.after > 0.4 ? 1 - (cs.after - 0.4) / 0.5 : 1}>{plates(cs.i, st, span(cs.tau, 0.1, 0.7), '#E2523A')}</g>}
        {halo(st.chest, 120 * st.k, '#E2523A', 0.25 * window01(cs.tau, 0.2, 1.1))}
        {sparks(cs.i, st.hits[0]!, cs.after / 0.4, { n: 6, spread: [-Math.PI, 0], dist: 50 * st.k, size: 2.5 * st.k, col: HOT })}
      </g>
    ),
  },

  /** Coup de travers : un croissant d'onde de choc file en biais et laisse une entaille en X qui rougeoie. */
  fg_crosscut: {
    gesture: 'ff_sweep',
    travel: 0.3,
    col: FORGE,
    render: (st, cs) => {
      const o = cs.from(0.42);
      const hit = st.hits[0]!;
      const v = clamp01(cs.sinceRelease / 0.3);
      const p = mix(o, hit, easeIn(v));
      const R = 70 * st.k * cs.s;
      return (
        <g>
          {swingTrail(cs, 0.3, 0.42, FORGE, 6 * st.k)}
          {cs.sinceRelease >= 0 && cs.after < 0 && (
            <g transform={`translate(${p[0]} ${p[1]}) rotate(-28)`} filter={GLOW}>
              <path d={`M0 ${-R} A${R} ${R} 0 0 1 0 ${R} A${R * 0.7} ${R * 1.05} 0 0 0 0 ${-R} Z`} fill={HOT} opacity={0.85} />
            </g>
          )}
          {cs.after >= 0 && cs.after < 1.2 && (
            <g opacity={1 - span(cs.after, 0.5, 1.2)} stroke={FORGE} strokeLinecap="round" filter={GLOW}>
              {[-1, 1].map((sgn) => {
                const len = 60 * st.k * cs.s * easeOut(span(cs.after, sgn < 0 ? 0 : 0.08, sgn < 0 ? 0.12 : 0.2));
                return <line key={sgn} x1={hit[0] - len} y1={hit[1] - len * sgn} x2={hit[0] + len} y2={hit[1] + len * sgn} strokeWidth={7 * st.k} />;
              })}
            </g>
          )}
          {sparks(cs.i, hit, cs.after / 0.5, { n: 10, spread: [-Math.PI * 0.5, Math.PI * 0.5], dist: 110 * st.k, gravity: 70 * st.k, size: 3 * st.k, col: HOT, streak: true })}
        </g>
      );
    },
  },

  /** Refroidissement : il plonge le marteau — une spirale de vapeur fraîche monte autour de lui, le mal s'en va avec. */
  fg_cooling: {
    gesture: 'ff_brace',
    travel: 0.3,
    col: '#9FD8FF',
    render: (st, cs) => {
      const u = span(cs.tau, 0.15, 1.5);
      const c = st.chest;
      return (
        <g>
          {u > 0 && u < 1 && (
            <g opacity={Math.sin(Math.PI * u)}>
              {Array.from({ length: 12 }, (_, j) => {
                const a = u * 9 + j * 0.9;
                const y = st.feet[1] - (j / 12) * 420 * st.k - u * 60 * st.k;
                const x = c[0] + Math.cos(a) * 80 * st.k;
                return <circle key={j} cx={x} cy={y} r={(18 + 10 * rnd(cs.i, j)) * st.k} fill="url(#fx-steam)" />;
              })}
            </g>
          )}
          {motes(cs.i, [c[0], st.feet[1] - 40 * st.k], span(cs.tau, 0.3, 1.6), { n: 10, w: 140 * st.k, rise: 300 * st.k, size: 5 * st.k, col: '#8FE6C8', shape: 'plus' })}
          {cs.after >= 0 && cs.after < 0.6 && (
            <g opacity={1 - cs.after / 0.6}>
              <circle cx={st.hits[0]![0]} cy={st.hits[0]![1]} r={40 * st.k * easeOut(cs.after / 0.6)} fill="url(#fx-steam)" />
            </g>
          )}
        </g>
      );
    },
  },

  /** Poinçon du maître : le poing projette un poinçon d'acier qui frappe et laisse la marque du maître (une enclume) sur l'ennemi. */
  fg_punch: {
    gesture: 'ff_punch',
    travel: 0.24,
    col: FORGE,
    render: (st, cs) => {
      const o = cs.from(0.3);
      const hit = st.hits[0]!;
      const v = clamp01(cs.sinceRelease / 0.24);
      const p = mix(o, hit, easeIn(v));
      return (
        <g>
          {cs.sinceRelease >= 0 && cs.after < 0 && (
            <g transform={`translate(${p[0]} ${p[1]})`} filter={GLOW}>
              <rect x={-40 * st.k} y={-9 * st.k} width={48 * st.k} height={18 * st.k} rx={3 * st.k} fill="url(#fx-steel)" stroke={HOT} strokeWidth={2 * st.k} />
              <rect x={8 * st.k} y={-13 * st.k} width={14 * st.k} height={26 * st.k} rx={2 * st.k} fill={HOT} />
            </g>
          )}
          {ring(hit, cs.after / 0.4, { r0: 10 * st.k, r1: 70 * st.k, col: HOT, width: 6 * st.k })}
          {cs.after >= 0 && cs.after < 0.5 && <g opacity={1 - cs.after / 0.5}>{anvilShape([hit[0], hit[1] + 22 * st.k], 70 * st.k * easeOut(cs.after / 0.2), FORGE)}</g>}
        </g>
      );
    },
  },

  /** Marteau de retour : un marteau de braise tournoie jusqu'à l'ennemi et revient en boomerang. */
  fg_return: {
    gesture: 'ff_throw',
    travel: 0.36,
    after: 0.5,
    col: FORGE,
    render: (st, cs) => {
      const o = cs.from(0.42);
      const hit = st.hits[0]!;
      let p: Pt | null = null;
      let spin = 0;
      if (cs.sinceRelease >= 0 && cs.after < 0) {
        const v = cs.sinceRelease / 0.36;
        p = arc(o, hit, v, 50 * st.k);
        spin = v * 900;
      } else if (cs.after >= 0 && cs.after < 0.5) {
        const v = cs.after / 0.5;
        p = arc(hit, st.chest, v, -40 * st.k);
        spin = 900 + v * 700;
      }
      return (
        <g>
          {p && (
            <g filter={GLOW}>
              {halo(p, 40 * st.k, FIRE, 0.45)}
              <g transform={`translate(${p[0]} ${p[1]}) rotate(${spin})`} opacity={0.92}>
                {hammerShape(90 * st.k, FIRE)}
              </g>
            </g>
          )}
          {flash(hit, cs.after / 0.2, 55 * st.k * cs.s, WHITE_HOT)}
          {sparks(cs.i, hit, cs.after / 0.5, { n: 12, spread: [-Math.PI, Math.PI], dist: 100 * st.k, size: 3 * st.k, col: HOT, streak: true })}
        </g>
      );
    },
  },

  /** Grand soufflet : une bourrasque de forge — des volutes de vent brûlant balaient la scène et embrasent tous les ennemis. */
  fg_bellows: {
    gesture: 'ff_sweep',
    travel: 0.42,
    col: FIRE,
    render: (st, cs) => {
      const front = clamp01(cs.sinceRelease / 0.42);
      const x0 = st.chest[0] + 40 * st.k;
      const x1 = lerp(x0, st.w, front);
      return (
        <g>
          {swingTrail(cs, 0.3, 0.42, FIRE, 6 * st.k)}
          {cs.sinceRelease >= 0 && cs.after < 0.6 && (
            <g opacity={cs.after > 0 ? 1 - cs.after / 0.6 : 1} fill="none" strokeLinecap="round">
              {Array.from({ length: st.reduced ? 4 : 7 }, (_, j) => {
                const y = st.groundY - (40 + (j / 7) * 280) * st.k;
                const len = (120 + 120 * rnd(cs.i, j)) * st.k;
                const x = x1 - len * rnd(cs.i, j + 4);
                const curl = 26 * st.k;
                return (
                  <path
                    key={j}
                    d={`M${x - len} ${y} C${x - len * 0.4} ${y - curl} ${x - len * 0.2} ${y + curl} ${x} ${y} q${curl} ${-curl} 0 ${-curl * 1.6}`}
                    stroke={j % 2 ? FIRE : HOT}
                    strokeWidth={(3 + 3 * rnd(cs.i, j + 8)) * st.k}
                    opacity={0.75}
                    filter={GLOW}
                  />
                );
              })}
            </g>
          )}
          {st.hits.map((h, j) => (
            <g key={j}>
              {motes(cs.i + j, [h[0], st.groundY], (cs.after - j * 0.05) / 0.8, { n: 10, w: 90 * st.k, rise: 220 * st.k, size: 4 * st.k, col: FIRE })}
              {(cs.after - j * 0.05) >= 0 && (cs.after - j * 0.05) < 0.7 && <g opacity={1 - (cs.after - j * 0.05) / 0.7}>{flame([h[0], st.groundY], st.enemyH * 0.5, 40 * st.k, cs.after * 18 + j)}</g>}
            </g>
          ))}
        </g>
      );
    },
  },

  /** Rivet de garde : trois rivets chauffés clouent l'ennemi (il frappe moins fort) ; une plaque rivetée se pose devant lui. */
  fg_rivet: {
    gesture: 'ff_punch',
    travel: 0.2,
    col: HOT,
    render: (st, cs) => {
      const o = cs.from(0.3);
      const hit = st.hits[0]!;
      return (
        <g>
          {[0, 1, 2].map((j) => {
            const tgt: Pt = [hit[0] - 10 * st.k, hit[1] + (j - 1) * 34 * st.k];
            const v = clamp01((cs.sinceRelease - j * 0.04) / 0.2);
            const p = mix(o, tgt, easeIn(v));
            if (cs.sinceRelease - j * 0.04 < 0) return null;
            return (
              <g key={j} transform={`translate(${p[0]} ${p[1]})`} opacity={cs.after > 0.6 ? 1 - (cs.after - 0.6) / 0.4 : 1} filter={GLOW}>
                {rivetShape(8 * st.k, '#FF9A52')}
              </g>
            );
          })}
          {cs.after > 0 && cs.after < 1 && (
            <g transform={`translate(${st.chest[0] + 110 * st.k} ${st.chest[1]})`} opacity={window01(cs.after, 0, 1, 0.1, 0.4)}>
              <rect x={-14 * st.k} y={-90 * st.k} width={28 * st.k} height={180 * st.k} rx={8 * st.k} fill="url(#fx-steel)" opacity={0.85} stroke={FORGE} strokeWidth={3 * st.k} />
              {[-60, 0, 60].map((y) => <circle key={y} cx={0} cy={y * st.k} r={5 * st.k} fill={HOT} filter={GLOW} />)}
            </g>
          )}
        </g>
      );
    },
  },

  /** Décrassage : une meule de feu râpe l'ennemi, fait voler sa garde en éclats et laisse une suie qui empêche ses soins. */
  fg_scour: {
    gesture: 'ff_upper',
    travel: 0.3,
    after: 0.9,
    col: FIRE,
    render: (st, cs) => {
      const hit = st.hits[0]!;
      const o = cs.from(0.44);
      const v = clamp01(cs.sinceRelease / 0.3);
      const p = cs.after < 0 ? arc(o, hit, v, 70 * st.k) : hit;
      const on = cs.sinceRelease >= 0 && cs.after < 0.75;
      const R = 34 * st.k * cs.s;
      return (
        <g>
          {swingTrail(cs, 0.3, 0.44, FIRE, 6 * st.k)}
          {on && (
            <g transform={`translate(${p[0]} ${p[1]}) rotate(${cs.sinceRelease * 1400})`} opacity={cs.after > 0.5 ? 1 - (cs.after - 0.5) / 0.25 : 1} filter={GLOW}>
              <circle r={R} fill="none" stroke={FIRE} strokeWidth={6 * st.k} />
              {Array.from({ length: 10 }, (_, j) => <line key={j} x1={0} y1={-R} x2={0} y2={-R - 8 * st.k} stroke={HOT} strokeWidth={3 * st.k} transform={`rotate(${j * 36})`} />)}
            </g>
          )}
          {cs.after >= 0 && cs.after < 0.75 && sparks(cs.i + Math.floor(cs.after * 20), hit, (cs.after * 20) % 1, { n: 6, spread: [Math.PI * 0.05, Math.PI * 0.6], dist: 70 * st.k, gravity: 40 * st.k, size: 3 * st.k, col: HOT, streak: true })}
          {/* Garde dissipée : des éclats bleutés tombent. */}
          {sparks(cs.i + 3, hit, cs.after / 0.7, { n: 8, spread: [-Math.PI, 0], dist: 90 * st.k, gravity: 140 * st.k, size: 5 * st.k, col: '#9FD8FF' })}
        </g>
      );
    },
  },

  /** Contrepoids : une enclume spectrale tombe du ciel sur l'ennemi ; sa silhouette reste devant lui en rempart. */
  fg_counterweight: {
    gesture: 'attack_forgefire',
    travel: 0.4,
    col: STEEL,
    render: (st, cs) => {
      const g = under(st);
      const v = clamp01((cs.sinceRelease + 0.1) / 0.5);
      const y = lerp(-st.enemyH * 0.6, g[1], easeIn(v));
      return (
        <g>
          {swingTrail(cs, 0.34, 0.46, FORGE, 6 * st.k)}
          {cs.sinceRelease > -0.1 && cs.after < 0.25 && (
            <g filter={GLOW} opacity={cs.after > 0 ? 1 - cs.after / 0.25 : 1}>
              {trail([[g[0], y - 220 * st.k], [g[0], y - 120 * st.k], [g[0], y]], HOT, 30 * st.k, 0.25)}
              {anvilShape([g[0], y], 170 * st.k * cs.s, HOT)}
            </g>
          )}
          {ring(g, cs.after / 0.6, { r0: 30 * st.k, r1: 200 * st.k * cs.s, col: STEEL, width: 8 * st.k, flat: 0.22 })}
          {sparks(cs.i, g, cs.after / 0.7, { n: st.reduced ? 6 : 14, spread: [-Math.PI, 0], dist: 160 * st.k, gravity: 90 * st.k, size: 6 * st.k, col: '#8A8274' })}
          {cs.after >= 0 && cs.after < 0.12 && <rect x={0} y={0} width={st.w} height={st.h} fill="#FFFFFF" opacity={0.18 * (1 - cs.after / 0.12)} />}
          {cs.after > 0 && cs.after < 1.2 && <g opacity={0.5 * window01(cs.after, 0, 1.2, 0.2, 0.5)}>{anvilShape([st.chest[0] + 130 * st.k, st.groundY], 110 * st.k, FORGE)}</g>}
        </g>
      );
    },
  },

  /** Jet de scories : des gouttes de métal en fusion partent en cloche, éclaboussent l'ennemi et s'y accrochent. */
  fg_slag: {
    gesture: 'ff_sweep',
    travel: 0.46,
    col: FIRE,
    render: (st, cs) => {
      const o = cs.from(0.42);
      const hit = st.hits[0]!;
      return (
        <g>
          {swingTrail(cs, 0.3, 0.42, FIRE, 6 * st.k)}
          {[0, 1, 2, 3].map((j) => {
            const v = clamp01((cs.sinceRelease - j * 0.035) / 0.46);
            if (cs.sinceRelease - j * 0.035 < 0 || v >= 1) return null;
            const tgt: Pt = [hit[0] + (j - 1.5) * 18 * st.k, hit[1] + (j % 2 ? -20 : 15) * st.k];
            const p = arc(o, tgt, v, (110 + j * 25) * st.k);
            const q = arc(o, tgt, Math.max(0, v - 0.08), (110 + j * 25) * st.k);
            return (
              <g key={j} filter={GLOW}>
                <line x1={q[0]} y1={q[1]} x2={p[0]} y2={p[1]} stroke={FIRE} strokeWidth={9 * st.k} strokeLinecap="round" opacity={0.6} />
                <circle cx={p[0]} cy={p[1]} r={(8 + j) * st.k} fill={HOT} />
              </g>
            );
          })}
          {cs.after >= 0 && cs.after < 1.1 && (
            <g opacity={1 - span(cs.after, 0.5, 1.1)} filter={GLOW}>
              {[0, 1, 2, 3].map((j) => {
                const p: Pt = [hit[0] + (j - 1.5) * 18 * st.k, hit[1] + (j % 2 ? -20 : 15) * st.k];
                return <path key={j} d={`M${p[0]} ${p[1]} q${4 * st.k} ${10 * st.k} 0 ${(20 + 30 * cs.after) * st.k} q${-4 * st.k} ${-10 * st.k} 0 ${-(20 + 30 * cs.after) * st.k}`} fill={FIRE} stroke={HOT} strokeWidth={2 * st.k} />;
              })}
            </g>
          )}
          {sparks(cs.i, hit, cs.after / 0.45, { n: 10, spread: [-Math.PI, 0], dist: 80 * st.k, gravity: 120 * st.k, size: 4 * st.k, col: FIRE, hot: HOT })}
        </g>
      );
    },
  },

  /** Deuxième frappe : deux impacts coup sur coup, avec l'image rémanente du marteau ; la masse reste chauffée à blanc. */
  fg_second_strike: {
    gesture: 'attack_forgefire',
    travel: 0.3,
    after: 0.8,
    col: HOT,
    render: (st, cs) => {
      const hit = st.hits[0]!;
      const g = under(st);
      const ghost = (delay: number, op: number) => {
        const v = cs.after - delay;
        if (v < -0.22 || v > 0.15) return null;
        const y = lerp(hit[1] - 160 * st.k, hit[1], easeIn(clamp01((v + 0.22) / 0.22)));
        return (
          <g opacity={op * (v > 0 ? 1 - v / 0.15 : 1)} transform={`translate(${hit[0] - 30 * st.k} ${y}) rotate(${lerp(-80, 10, clamp01((v + 0.22) / 0.22))})`} filter={GLOW}>
            {hammerShape(110 * st.k, HOT)}
          </g>
        );
      };
      return (
        <g>
          {swingTrail(cs, 0.34, 0.46, HOT, 6 * st.k)}
          {ghost(0, 0.9)}
          {ghost(0.26, 0.7)}
          {flash(hit, cs.after / 0.16, 60 * st.k, WHITE_HOT)}
          {flash(hit, (cs.after - 0.26) / 0.16, 80 * st.k, WHITE_HOT)}
          {ring(g, cs.after / 0.4, { r0: 20 * st.k, r1: 120 * st.k, col: HOT, width: 6 * st.k, flat: 0.24 })}
          {ring(g, (cs.after - 0.26) / 0.45, { r0: 30 * st.k, r1: 170 * st.k, col: WHITE_HOT, width: 7 * st.k, flat: 0.24 })}
          {sparks(cs.i, hit, (cs.after - 0.26) / 0.5, { n: 14, spread: [-Math.PI, 0], dist: 130 * st.k, gravity: 90 * st.k, size: 3 * st.k, col: HOT, streak: true })}
          {/* La masse garde l'éclat blanc : la prochaine attaque de base est renforcée. */}
          {cs.after > 0.3 && halo(cs.from(0), 26 * st.k, WHITE_HOT, 0.6 * window01(cs.after, 0.3, 2.5, 0.2, 0.8))}
        </g>
      );
    },
  },

  /** Reprise au rouge : la masse rougit à blanc et décrit un large arc en fusion qui fauche deux ennemis. */
  fg_red_reprise: {
    gesture: 'ff_sweep',
    travel: 0.26,
    col: '#FF4A2A',
    render: (st, cs) => {
      const o = cs.from(0.42);
      const last = st.hits[Math.min(1, st.hits.length - 1)]!;
      const v = clamp01(cs.sinceRelease / 0.26);
      const R = (last[0] - o[0]) * 0.55;
      const c: Pt = [o[0] + R, o[1] + 40 * st.k];
      return (
        <g>
          {cs.tau > 0 && cs.tau < 0.5 && halo(cs.from(cs.tau), 34 * st.k, '#FF4A2A', 0.7)}
          {swingTrail(cs, 0.28, 0.42, '#FF4A2A', 9 * st.k)}
          {cs.sinceRelease >= 0 && cs.after < 0.5 && (
            <g opacity={cs.after > 0 ? 1 - cs.after / 0.5 : 1} filter={GLOW}>
              <path d={`M${c[0] - R} ${c[1]} A${R} ${R * 0.55} 0 0 1 ${c[0] - R * Math.cos(Math.PI * v)} ${c[1] - R * 0.55 * Math.sin(Math.PI * v)}`} fill="none" stroke="#FF4A2A" strokeWidth={22 * st.k} strokeLinecap="round" opacity={0.6} />
              <path d={`M${c[0] - R} ${c[1]} A${R} ${R * 0.55} 0 0 1 ${c[0] - R * Math.cos(Math.PI * v)} ${c[1] - R * 0.55 * Math.sin(Math.PI * v)}`} fill="none" stroke={WHITE_HOT} strokeWidth={6 * st.k} strokeLinecap="round" />
            </g>
          )}
          {st.hits.slice(0, 2).map((h, j) => (
            <g key={j}>
              {flash(h, (cs.after - j * 0.05) / 0.18, 60 * st.k, '#FFB080')}
              {sparks(cs.i + j, h, (cs.after - j * 0.05) / 0.5, { n: 10, spread: [-Math.PI * 0.6, Math.PI * 0.3], dist: 110 * st.k, gravity: 80 * st.k, size: 3.5 * st.k, col: '#FF4A2A', hot: WHITE_HOT, streak: true })}
            </g>
          ))}
        </g>
      );
    },
  },

  /** Faire sonner l'enclume : une enclume fantôme apparaît devant lui ; le coup la fait sonner, l'onde sonore assomme l'ennemi. */
  fg_ring_anvil: {
    gesture: 'attack_forgefire',
    travel: 0.4,
    col: STEEL,
    render: (st, cs) => {
      const slam = cs.from(0.46);
      const anvil: Pt = [slam[0], st.groundY];
      const hit = st.hits[0]!;
      return (
        <g>
          {cs.tau > 0.05 && cs.after < 0.6 && <g opacity={window01(cs.tau, 0.05, 1.3, 0.15, 0.3)} filter={GLOW}>{anvilShape(anvil, 120 * st.k, HOT, 0.75)}</g>}
          {swingTrail(cs, 0.34, 0.46, HOT, 6 * st.k)}
          {[0, 1, 2, 3].map((j) => {
            const v = (cs.sinceRelease - j * 0.08) / 0.5;
            if (v < 0 || v > 1) return null;
            const x = lerp(anvil[0], hit[0] + 40 * st.k, v);
            const r = lerp(40, 110, v) * st.k;
            return <path key={j} d={`M${x} ${hit[1] - r} A${r * 0.45} ${r} 0 0 1 ${x} ${hit[1] + r}`} fill="none" stroke={j % 2 ? STEEL : HOT} strokeWidth={6 * st.k * (1 - v * 0.5)} opacity={1 - v * 0.6} filter={GLOW} />;
          })}
          {flash(anvil, cs.sinceRelease / 0.2, 70 * st.k, '#FFFFFF')}
        </g>
      );
    },
  },

  /** Coins d'arrêt : des coins d'acier jaillissent du sol sous l'ennemi et le clouent sur place. */
  fg_wedges: {
    gesture: 'attack_forgefire',
    travel: 0.34,
    after: 1,
    col: STEEL,
    render: (st, cs) => {
      const slam: Pt = [cs.from()[0], st.groundY];
      const g = under(st);
      return (
        <g>
          {swingTrail(cs, 0.34, 0.46, FORGE, 6 * st.k)}
          {cs.sinceRelease >= 0 && cs.after < 0.6 && <g opacity={cs.after > 0 ? 1 - cs.after / 0.6 : 1}>{fissure(cs.i, st, slam, g, clamp01(cs.sinceRelease / 0.34), FORGE, 3 * st.k)}</g>}
          {cs.after >= 0 && cs.after < 1 &&
            [-1, 0, 1].map((j) => {
              const v = easeOut(span(cs.after, Math.abs(j) * 0.05, Math.abs(j) * 0.05 + 0.15));
              const x = g[0] + j * 46 * st.k;
              const h = (j === 0 ? 120 : 90) * st.k * v;
              return (
                <g key={j} opacity={1 - span(cs.after, 0.6, 1)} transform={`rotate(${j * 18} ${x} ${g[1]})`}>
                  <path d={`M${x - 18 * st.k} ${g[1]} L${x} ${g[1] - h} L${x + 18 * st.k} ${g[1]} Z`} fill="url(#fx-steel)" stroke={HOT} strokeWidth={2.5 * st.k} />
                </g>
              );
            })}
          {sparks(cs.i, g, cs.after / 0.4, { n: 8, spread: [-Math.PI * 0.9, -Math.PI * 0.1], dist: 80 * st.k, gravity: 60 * st.k, size: 3 * st.k, col: HOT })}
        </g>
      );
    },
  },

  /** Frappe de scellement : des bandes de métal en fusion s'enroulent autour de l'ennemi et se referment comme un scellé. */
  fg_sealing: {
    gesture: 'attack_forgefire',
    travel: 0.32,
    after: 1.1,
    col: FIRE,
    render: (st, cs) => {
      const hit = st.hits[0]!;
      const slam: Pt = [cs.from()[0], st.groundY];
      return (
        <g>
          {swingTrail(cs, 0.34, 0.46, FIRE, 7 * st.k)}
          {cs.sinceRelease >= 0 && cs.after < 0 && (() => {
            const p = mix(slam, hit, easeIn(cs.sinceRelease / 0.32));
            return <g filter={GLOW}><circle cx={p[0]} cy={p[1]} r={10 * st.k} fill={HOT} /></g>;
          })()}
          {cs.after >= 0 && cs.after < 1.1 &&
            [-1, 0, 1].map((j) => {
              const v = easeOut(span(cs.after, 0.05 * (j + 1), 0.05 * (j + 1) + 0.3));
              const y = hit[1] + j * 40 * st.k;
              const rx = 70 * st.k * (1.5 - 0.5 * v);
              return (
                <g key={j} opacity={1 - span(cs.after, 0.7, 1.1)} filter={GLOW}>
                  <ellipse cx={hit[0]} cy={y} rx={rx} ry={14 * st.k} fill="none" stroke={FIRE} strokeWidth={9 * st.k} pathLength={1} strokeDasharray={`${v} 1`} />
                  <ellipse cx={hit[0]} cy={y} rx={rx} ry={14 * st.k} fill="none" stroke={HOT} strokeWidth={3 * st.k} pathLength={1} strokeDasharray={`${v} 1`} />
                </g>
              );
            })}
          {cs.after > 0.35 && cs.after < 1 && <g opacity={window01(cs.after, 0.35, 1, 0.05, 0.3)}><g transform={`translate(${hit[0]} ${hit[1]})`}>{hexPlate(16 * st.k, HOT)}</g></g>}
        </g>
      );
    },
  },

  /** Pose de rivets : une rangée de rivets s'allume autour de lui, comme une armure qu'on rivète à chaud. */
  fg_lay_rivets: {
    gesture: 'ff_punch',
    travel: 0.2,
    col: HOT,
    render: (st, cs) => {
      const c = st.chest;
      const hit = st.hits[0]!;
      return (
        <g>
          {Array.from({ length: 9 }, (_, j) => {
            const a = -Math.PI * 0.85 + (j / 8) * Math.PI * 1.7;
            const p = polar(c, a, 135 * st.k);
            const v = window01(cs.tau - j * 0.04, 0.15, 1.6, 0.06, 0.4);
            if (v <= 0) return null;
            return (
              <g key={j} transform={`translate(${p[0]} ${p[1]}) rotate(${(a * 180) / Math.PI + 180})`} opacity={v} filter={GLOW}>
                {rivetShape(7 * st.k, '#FF9A52')}
              </g>
            );
          })}
          {cs.tau > 0.2 && cs.tau < 1.7 && <ellipse cx={c[0]} cy={c[1]} rx={135 * st.k} ry={135 * st.k} fill="none" stroke={FORGE} strokeWidth={3 * st.k} strokeDasharray={`${8 * st.k} ${10 * st.k}`} opacity={0.6 * window01(cs.tau, 0.2, 1.7, 0.2, 0.4)} />}
          {flash(hit, cs.after / 0.15, 40 * st.k, HOT)}
          {sparks(cs.i, hit, cs.after / 0.4, { n: 7, spread: [-Math.PI, 0], dist: 60 * st.k, size: 2.5 * st.k, col: HOT })}
        </g>
      );
    },
  },

  /** Recuit partagé : une lueur ambrée de four bas l'enveloppe ; des braises douces montent et le soignent. */
  fg_shared_anneal: {
    gesture: 'ff_brace',
    travel: 0.3,
    col: '#FFB04A',
    render: (st, cs) => {
      const c = st.chest;
      const glow = window01(cs.tau, 0.15, 1.7, 0.3, 0.5);
      return (
        <g>
          {glow > 0 && (
            <g opacity={glow}>
              <ellipse cx={c[0]} cy={st.feet[1]} rx={150 * st.k} ry={30 * st.k} fill="#FFB04A" opacity={0.4} filter={SOFT} />
              <ellipse cx={c[0]} cy={c[1] + 40 * st.k} rx={130 * st.k} ry={250 * st.k} fill="#FFB04A" opacity={0.16} filter={BLUR} />
            </g>
          )}
          {motes(cs.i, [c[0], st.feet[1]], span(cs.tau, 0.2, 1.8), { n: 14, w: 160 * st.k, rise: 380 * st.k, size: 4.5 * st.k, col: '#FFC870' })}
          {motes(cs.i + 50, [c[0], st.feet[1] - 60 * st.k], span(cs.tau, 0.4, 1.8), { n: 6, w: 120 * st.k, rise: 260 * st.k, size: 6 * st.k, col: '#9BE8B4', shape: 'plus' })}
          {cs.sinceRelease >= 0 && cs.after < 0 && (() => {
            const p = arc(cs.from(0.32), st.hits[0]!, cs.sinceRelease / 0.3, 60 * st.k);
            return <circle cx={p[0]} cy={p[1]} r={9 * st.k} fill="#FFB04A" filter={GLOW} />;
          })()}
          {flash(st.hits[0]!, cs.after / 0.2, 40 * st.k, '#FFB04A')}
        </g>
      );
    },
  },

  /** Plaque maîtresse : une grande plaque d'acier forgé s'abat dans le sol devant lui ; l'ennemi recule, affaibli. */
  fg_masterplate: {
    gesture: 'ff_brace',
    travel: 0.24,
    col: STEEL,
    render: (st, cs) => {
      const x = st.chest[0] + 150 * st.k;
      const v = easeIn(span(cs.tau, 0.05, 0.32));
      const top = lerp(-200 * st.k, st.groundY - 340 * st.k, v);
      const fade = window01(cs.tau, 0.05, 1.9, 0.05, 0.5);
      return (
        <g>
          {fade > 0 && (
            <g opacity={fade}>
              <path d={`M${x - 46 * st.k} ${top} L${x + 46 * st.k} ${top} L${x + 52 * st.k} ${top + 250 * st.k} L${x} ${top + 340 * st.k} L${x - 52 * st.k} ${top + 250 * st.k} Z`} fill="url(#fx-steel)" stroke={HOT} strokeWidth={4 * st.k} opacity={0.88} />
              <path d={`M${x} ${top + 30 * st.k} L${x} ${top + 300 * st.k}`} stroke={FORGE} strokeWidth={6 * st.k} opacity={0.6} filter={GLOW} />
              {[0.15, 0.85].map((u) => <circle key={u} cx={x - 30 * st.k} cy={top + u * 280 * st.k} r={5 * st.k} fill={HOT} />)}
              {[0.15, 0.85].map((u) => <circle key={`r${u}`} cx={x + 30 * st.k} cy={top + u * 280 * st.k} r={5 * st.k} fill={HOT} />)}
            </g>
          )}
          {ring([x, st.groundY], span(cs.tau, 0.32, 0.8), { r0: 20 * st.k, r1: 130 * st.k, col: STEEL, width: 6 * st.k, flat: 0.25 })}
          {sparks(cs.i, [x, st.groundY], span(cs.tau, 0.32, 0.8), { n: 10, spread: [-Math.PI, 0], dist: 90 * st.k, gravity: 70 * st.k, size: 3 * st.k, col: HOT })}
          {flash(st.hits[0]!, cs.after / 0.2, 40 * st.k, STEEL)}
        </g>
      );
    },
  },

  /**
   * La Grande Trempe (ultime) : un soleil de forge se forme au-dessus des ennemis pendant qu'il se campe, puis il abat le
   * marteau — le sol se fend en rivière de métal, des colonnes de vapeur et de feu jaillissent sous chaque ennemi, et de
   * grandes plaques le protègent.
   */
  fg_great_temper: {
    gesture: 'ff_ultimate',
    travel: 0.4,
    after: 1.4,
    col: FIRE,
    render: (st, cs) => {
      const center: Pt = [lerp(st.chest[0], st.enemyX, 0.55), st.h * 0.22];
      const grow = easeOut(span(cs.tau, 0.2, 1.2));
      const sunOn = cs.tau > 0.2 && cs.after < 0.2;
      const slam: Pt = [cs.from(1.3)[0], st.groundY];
      const far = st.hits[st.hits.length - 1]!;
      return (
        <g>
          {cs.tau > 0.1 && cs.after < 0.6 && <rect x={0} y={0} width={st.w} height={st.h} fill="#1A0A04" opacity={0.35 * window01(cs.tau, 0.1, 1.9, 0.4, 0.4)} />}
          {sunOn && (
            <g opacity={cs.after > 0 ? 1 - cs.after / 0.2 : 1}>
              {halo(center, 120 * st.k * grow, FIRE, 0.6)}
              <circle cx={center[0]} cy={center[1]} r={50 * st.k * grow} fill={HOT} filter={GLOW} />
              <circle cx={center[0]} cy={center[1]} r={28 * st.k * grow} fill="#FFFFFF" />
              {Array.from({ length: 12 }, (_, j) => {
                const a = (j / 12) * Math.PI * 2 + cs.tau * 1.5;
                return <line key={j} x1={polar(center, a, 60 * st.k * grow)[0]} y1={polar(center, a, 60 * st.k * grow)[1]} x2={polar(center, a, 95 * st.k * grow)[0]} y2={polar(center, a, 95 * st.k * grow)[1]} stroke={HOT} strokeWidth={4 * st.k} strokeLinecap="round" opacity={0.8} />;
              })}
              {/* Les braises du sol montent nourrir le soleil. */}
              {!st.reduced &&
                Array.from({ length: 10 }, (_, j) => {
                  const v = ((cs.tau * 0.9 + rnd(cs.i, j)) % 1) * grow;
                  const p = mix([lerp(st.chest[0], st.w, rnd(cs.i, j + 4)), st.groundY], center, v);
                  return <circle key={`e${j}`} cx={p[0]} cy={p[1]} r={4 * st.k} fill={FIRE} opacity={1 - v} />;
                })}
            </g>
          )}
          {swingTrail(cs, 1.18, 1.3, HOT, 9 * st.k)}
          {cs.sinceRelease >= 0 && cs.after < 1.2 && <g opacity={cs.after > 0.6 ? 1 - (cs.after - 0.6) / 0.6 : 1}>{fissure(cs.i, st, slam, [far[0] + 60 * st.k, st.groundY], clamp01(cs.sinceRelease / 0.4), FIRE, 10 * st.k)}</g>}
          {st.hits.map((h, j) => (
            <g key={j}>
              {geyser(cs.i + j, st, [h[0], st.groundY], (cs.after - j * 0.08) / 1.1, st.enemyH * 1.25, 1.4)}
              {(cs.after - j * 0.08) > 0.1 && (cs.after - j * 0.08) < 1.4 && <circle cx={h[0]} cy={h[1] - 80 * st.k} r={70 * st.k * easeOut(span(cs.after - j * 0.08, 0.1, 1.2))} fill="url(#fx-steam)" opacity={1 - span(cs.after - j * 0.08, 0.6, 1.4)} />}
            </g>
          ))}
          {cs.after >= 0 && cs.after < 0.15 && <rect x={0} y={0} width={st.w} height={st.h} fill="#FFE2A8" opacity={0.35 * (1 - cs.after / 0.15)} />}
          {cs.after > 0.1 && cs.after < 1.4 && <g opacity={1 - span(cs.after, 0.9, 1.4)}>{plates(cs.i, st, span(cs.after, 0.1, 0.6), FIRE, 9, 34)}</g>}
        </g>
      );
    },
  },
};

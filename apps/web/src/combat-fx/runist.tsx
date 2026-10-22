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
  bolt,
  chain,
  clamp01,
  crystal,
  d,
  easeIn,
  easeOut,
  flame,
  flash,
  glyph,
  halo,
  lerp,
  mix,
  motes,
  polar,
  ring,
  rnd,
  span,
  sparks,
  trail,
  window01,
} from './kit';

/**
 * Runiste : il écrit. Chaque sort est un signe tracé dans l'air ou au sol — Trait (une ligne qui part), Cercle (un cercle
 * qui s'ouvre au sol), Sceau (un signe posé sur soi ou sur l'ennemi) — dans la couleur de son élément.
 */

const VIOLET = '#B39DF5';
const FIRE = '#FF8A3D';
const FROST = '#9FD8FF';
const BOLT = '#E2CCFF';
const INK = '#FFFFFF';

/** Glyphe qui se trace dans la main pendant la préparation. */
function tracing(st: Stage, cs: Cast, name: string, col: string, r = 26, until?: number): ReactNode {
  const end = until ?? cs.release - cs.start;
  if (cs.tau < 0.02 || cs.tau > end) return null;
  return glyph(name, cs.from(cs.tau), r * st.k, col, { draw: span(cs.tau, 0.02, end), rot: cs.tau * 120 });
}
/** Cercle runique au sol (ellipse aplatie) qui se trace puis tourne. */
function groundCircle(st: Stage, p: Pt, R: number, u: number, col: string, op = 1, runes = 8): ReactNode {
  if (u < 0) return null;
  const draw = easeOut(span(u, 0, 0.35));
  return (
    <g opacity={op} filter={GLOW}>
      <ellipse cx={p[0]} cy={p[1]} rx={R} ry={R * 0.26} fill="none" stroke={col} strokeWidth={4 * st.k} pathLength={1} strokeDasharray={`${draw} 1`} />
      <ellipse cx={p[0]} cy={p[1]} rx={R * 0.78} ry={R * 0.2} fill="none" stroke={col} strokeWidth={2 * st.k} strokeDasharray={`${6 * st.k} ${5 * st.k}`} opacity={draw} />
      {draw > 0.6 &&
        Array.from({ length: runes }, (_, j) => {
          const a = (j / runes) * Math.PI * 2 + u * 1.5;
          const q: Pt = [p[0] + Math.cos(a) * R * 0.89, p[1] + Math.sin(a) * R * 0.23];
          return <path key={j} d={`M${q[0] - 4 * st.k} ${q[1] - 3 * st.k} L${q[0] + 4 * st.k} ${q[1] + 3 * st.k} M${q[0] + 4 * st.k} ${q[1] - 3 * st.k} L${q[0]} ${q[1] + 3 * st.k}`} stroke={INK} strokeWidth={2 * st.k} opacity={Math.sin(a) > 0 ? 1 : 0.5} />;
        })}
    </g>
  );
}
/** Dôme de sceau autour du personnage. */
function dome(st: Stage, u: number, col: string, op = 1, pattern: 'hex' | 'lines' | 'none' = 'lines'): ReactNode {
  if (u <= 0 || op <= 0) return null;
  const c: Pt = [st.chest[0], st.groundY];
  const R = 190 * st.k * easeOut(span(u, 0, 0.4));
  return (
    <g opacity={op}>
      <path d={`M${c[0] - R} ${c[1]} A${R} ${R * 1.6} 0 0 1 ${c[0] + R} ${c[1]}`} fill={col} fillOpacity={0.1} stroke={col} strokeWidth={3 * st.k} filter={GLOW} />
      {pattern === 'lines' &&
        [0.35, 0.65].map((f) => <path key={f} d={`M${c[0] - R * Math.sqrt(1 - f * f)} ${c[1] - R * 1.6 * f} A${R * Math.sqrt(1 - f * f)} ${R * 0.2} 0 0 0 ${c[0] + R * Math.sqrt(1 - f * f)} ${c[1] - R * 1.6 * f}`} fill="none" stroke={col} strokeWidth={1.5 * st.k} opacity={0.6} />)}
    </g>
  );
}

/** Attaque de base : la rune se trace dans la main, part en tournoyant et s'imprime en sceau sur l'ennemi. */
const basic: SpellFx = {
  gesture: 'attack_runist',
  travel: 0.32,
  render: (st, cs) => {
    const hit = st.hits[0]!;
    const from = cs.from();
    const v = cs.sinceRelease / 0.32;
    const path = (u: number): Pt => [lerp(from[0], hit[0], u), lerp(from[1], hit[1], u) + Math.sin(u * Math.PI * 2) * 14 * st.k];
    const r = 28 * st.k * cs.s;
    return (
      <g>
        {tracing(st, cs, ['trait', 'circle', 'seal'][cs.i % 3]!, cs.col, 28)}
        {v >= 0 && v <= 1 && (
          <g>
            {!st.reduced && Array.from({ length: 4 }, (_, j) => { const q = path(Math.max(0, v - 0.07 * (j + 1))); return <circle key={j} cx={q[0]} cy={q[1]} r={(13 - j * 2.5) * st.k * cs.s} fill={cs.col} opacity={0.5 - j * 0.1} />; })}
            {glyph(['trait', 'circle', 'seal'][cs.i % 3]!, path(v), r, cs.col, { rot: v * 540 })}
          </g>
        )}
        {cs.after >= 0 && cs.after < 0.65 && glyph(['trait', 'circle', 'seal'][cs.i % 3]!, hit, (46 + 70 * easeOut(cs.after / 0.65)) * st.k * cs.s, cs.col, { rot: cs.after * 40, op: 1 - cs.after / 0.65, width: 0.06 })}
        {sparks(cs.i, hit, cs.after / 0.6, { n: st.reduced ? 3 : 7, spread: [-Math.PI, Math.PI], dist: 120 * st.k * cs.s, size: 4 * st.k, col: cs.col })}
      </g>
    );
  },
};

export const RUNIST_BASIC = basic;

export const RUNIST: Record<string, SpellFx> = {
  /** Trait incandescent : le trait se tracé en feu dans l'air puis part comme une comète qui embrase l'ennemi. */
  rn_ember: {
    gesture: 'rn_slash',
    travel: 0.3,
    col: FIRE,
    render: (st, cs) => {
      const hit = st.hits[0]!;
      const from = cs.from();
      const v = cs.sinceRelease / 0.3;
      const path = (u: number) => arc(from, hit, easeIn(u), 30 * st.k);
      return (
        <g>
          {tracing(st, cs, 'trait', FIRE, 24)}
          {v >= 0 && v <= 1 && (
            <g filter={GLOW}>
              {trail(Array.from({ length: 8 }, (_, j) => path(Math.max(0, v - 0.35 + (0.35 * j) / 7))), FIRE, 26 * st.k, 0.7)}
              <circle cx={path(v)[0]} cy={path(v)[1]} r={14 * st.k} fill="#FFF1C4" />
            </g>
          )}
          {cs.after >= 0 && cs.after < 0.7 && <g opacity={1 - cs.after / 0.7}>{flame([hit[0], hit[1] + 50 * st.k], 150 * st.k * easeOut(cs.after / 0.2), 40 * st.k, cs.after * 20, 'url(#fx-flame)')}</g>}
          {sparks(cs.i, hit, cs.after / 0.5, { n: 10, spread: [-Math.PI, 0], dist: 90 * st.k, gravity: 40 * st.k, size: 3 * st.k, col: FIRE, hot: '#FFF1C4' })}
        </g>
      );
    },
  },

  /** Cercle de givre : le bâton frappe, un cercle de givre se trace sous les ennemis et des pics de glace en jaillissent. */
  rn_frost_circle: {
    gesture: 'rn_staff',
    travel: 0.24,
    after: 1,
    col: FROST,
    render: (st, cs) => (
      <g>
        {ring([cs.from()[0], st.groundY], cs.sinceRelease / 0.4, { r0: 10 * st.k, r1: 80 * st.k, col: FROST, width: 4 * st.k, flat: 0.25 })}
        {st.hits.slice(0, 2).map((h, j) => {
          const g: Pt = [h[0], st.groundY];
          const u = (cs.after - j * 0.05) / 1;
          return (
            <g key={j}>
              {groundCircle(st, g, 100 * st.k, (cs.sinceRelease - j * 0.05) / 0.9, FROST, 1 - span(u, 0.6, 1))}
              {u > 0 && u < 1 && (
                <g opacity={1 - span(u, 0.6, 1)}>
                  {[-1, 0, 1].map((t) => <g key={t}>{crystal([g[0] + t * 40 * st.k, g[1]], (t ? 70 : 110) * st.k * easeOut(span(u, 0.02 * (t + 1), 0.2)), 16 * st.k, t * 16)}</g>)}
                </g>
              )}
            </g>
          );
        })}
      </g>
    ),
  },

  /** Sceau de garde : le sceau se forme au-dessus de sa main et descend sur lui en un dôme crépitant. */
  rn_guard: {
    gesture: 'rn_seal',
    travel: 0.3,
    col: BOLT,
    render: (st, cs) => {
      const hand = cs.from(0.45);
      const fall = span(cs.tau, 0.45, 0.75);
      const p = mix(hand, [st.chest[0], st.chest[1] - 40 * st.k], easeIn(fall));
      return (
        <g>
          {cs.tau > 0.05 && fall < 1 && glyph('seal', fall > 0 ? p : hand, 34 * st.k * (1 + fall), BOLT, { draw: span(cs.tau, 0.05, 0.45), rot: cs.tau * 90 })}
          {dome(st, span(cs.tau, 0.7, 1.5), BOLT, window01(cs.tau, 0.7, 2.3, 0.05, 0.5))}
          {cs.tau > 0.7 && cs.tau < 2 && !st.reduced && (
            <path d={d(bolt(cs.i, [st.chest[0] - 120 * st.k, st.groundY - 200 * st.k], [st.chest[0] + 120 * st.k, st.groundY - 180 * st.k], 6, 16 * st.k, cs.c * 12))} stroke={INK} strokeWidth={1.5 * st.k} fill="none" opacity={0.6} filter={GLOW} />
          )}
          {flash(st.hits[0]!, cs.after / 0.15, 30 * st.k, BOLT)}
        </g>
      );
    },
  },

  /** Trait fulgurant : la main tendue, un éclair brisé relie sa paume à l'ennemi dans un flash. */
  rn_lightning: {
    gesture: 'rn_channel',
    travel: 0.06,
    col: BOLT,
    render: (st, cs) => {
      const hit = st.hits[0]!;
      const on = window01(cs.c, cs.release, cs.e.t + 0.32, 0.02, 0.15);
      return (
        <g>
          {cs.tau > 0.05 && cs.sinceRelease < 0 && halo(cs.from(cs.tau), 20 * st.k * span(cs.tau, 0.05, 0.28), BOLT, 0.8)}
          {on > 0 && (
            <g opacity={on} filter={GLOW}>
              <path d={d(bolt(cs.i, cs.from(), hit, 10, 26 * st.k, cs.c * 28))} stroke={BOLT} strokeWidth={9 * st.k} fill="none" opacity={0.6} />
              <path d={d(bolt(cs.i, cs.from(), hit, 10, 26 * st.k, cs.c * 28))} stroke={INK} strokeWidth={3 * st.k} fill="none" />
              <path d={d(bolt(cs.i + 3, mix(cs.from(), hit, 0.4), [hit[0] - 40 * st.k, hit[1] + 70 * st.k], 4, 12 * st.k, cs.c * 28))} stroke={BOLT} strokeWidth={2 * st.k} fill="none" />
            </g>
          )}
          {cs.after >= 0 && cs.after < 0.1 && <rect x={0} y={0} width={st.w} height={st.h} fill={BOLT} opacity={0.15} />}
          {flash(hit, cs.after / 0.2, 70 * st.k, '#F4EEFF')}
          {sparks(cs.i, hit, cs.after / 0.4, { n: 8, spread: [-Math.PI, Math.PI], dist: 80 * st.k, size: 3 * st.k, col: BOLT, streak: true })}
        </g>
      );
    },
  },

  /** Anneau de cendres : un anneau de feu part du bâton, court au sol jusqu'aux ennemis ; des cendres brûlantes retombent sur eux. */
  rn_ash_ring: {
    gesture: 'rn_staff',
    travel: 0.4,
    after: 1,
    col: FIRE,
    render: (st, cs) => {
      const o: Pt = [cs.from()[0], st.groundY];
      const far = st.hits[st.hits.length - 1]![0];
      const v = clamp01(cs.sinceRelease / 0.4);
      const R = lerp(20 * st.k, far - o[0] + 60 * st.k, easeOut(v));
      return (
        <g>
          {cs.sinceRelease >= 0 && cs.after < 0.5 && (
            <g opacity={cs.after > 0 ? 1 - cs.after / 0.5 : 1} filter={GLOW}>
              <ellipse cx={o[0]} cy={o[1]} rx={R} ry={R * 0.2} fill="none" stroke={FIRE} strokeWidth={10 * st.k} opacity={0.6} />
              <ellipse cx={o[0]} cy={o[1]} rx={R} ry={R * 0.2} fill="none" stroke="#FFF1C4" strokeWidth={3 * st.k} />
            </g>
          )}
          {st.hits.map((h, j) => (
            <g key={j}>
              {(cs.after - j * 0.04) >= 0 && (cs.after - j * 0.04) < 0.6 && <g opacity={1 - (cs.after - j * 0.04) / 0.6}>{flame([h[0], st.groundY], st.enemyH * 0.4, 30 * st.k, cs.after * 18 + j)}</g>}
              {motes(cs.i + j, [h[0], h[1] - 120 * st.k], (cs.after - j * 0.04) / 1, { n: 8, w: 100 * st.k, rise: -120 * st.k, size: 3 * st.k, col: j % 2 ? '#8C847A' : FIRE })}
            </g>
          ))}
        </g>
      );
    },
  },

  /** Sceau de répit : un sceau de neige se pose doucement sur lui ; des flocons fondent en le soignant. */
  rn_respite: {
    gesture: 'rn_seal',
    travel: 0.3,
    col: FROST,
    render: (st, cs) => {
      const hand = cs.from(0.45);
      return (
        <g>
          {cs.tau > 0.05 && cs.tau < 1.6 && glyph('seal', mix(hand, [st.chest[0], st.chest[1] - 80 * st.k], easeOut(span(cs.tau, 0.45, 1))), 40 * st.k, FROST, { draw: span(cs.tau, 0.05, 0.45), rot: cs.tau * 40, op: 1 - span(cs.tau, 1.2, 1.6) })}
          {motes(cs.i, [st.chest[0], st.chest[1] - 200 * st.k], span(cs.tau, 0.4, 1.9), { n: 12, w: 220 * st.k, rise: -260 * st.k, size: 7 * st.k, col: '#E8F7FF', shape: 'flake' })}
          {motes(cs.i + 9, [st.chest[0], st.feet[1]], span(cs.tau, 0.6, 1.9), { n: 7, w: 120 * st.k, rise: 280 * st.k, size: 5 * st.k, col: '#9BE8C8', shape: 'plus' })}
          {halo(st.chest, 120 * st.k, FROST, 0.25 * window01(cs.tau, 0.4, 1.9, 0.3, 0.4))}
          {flash(st.hits[0]!, cs.after / 0.2, 30 * st.k, FROST)}
        </g>
      );
    },
  },

  /** Trait de gel : la main fend l'air et une ligne de glace court au sol jusqu'à l'ennemi, hérissée de pics, qui lui gèle les pieds. */
  rn_frost_line: {
    gesture: 'rn_slash',
    travel: 0.34,
    after: 1,
    col: FROST,
    render: (st, cs) => {
      const x0 = st.chest[0] + 80 * st.k;
      const x1 = st.hits[0]![0];
      const v = clamp01(cs.sinceRelease / 0.34);
      const n = 9;
      const fade = cs.after > 0 ? 1 - span(cs.after, 0.5, 1) : 1;
      return (
        <g>
          {tracing(st, cs, 'trait', FROST, 22)}
          {cs.sinceRelease >= 0 && cs.after < 1 && (
            <g opacity={fade}>
              <line x1={x0} y1={st.groundY} x2={lerp(x0, x1, v)} y2={st.groundY} stroke={FROST} strokeWidth={6 * st.k} filter={GLOW} />
              {Array.from({ length: n }, (_, j) => {
                const u = j / (n - 1);
                if (u > v) return null;
                const grow = easeOut(clamp01((v - u) * 5));
                return <g key={j}>{crystal([lerp(x0, x1, u), st.groundY], (30 + 50 * u + 20 * rnd(cs.i, j)) * st.k * grow, (8 + 6 * u) * st.k, (rnd(cs.i, j + 3) - 0.5) * 30)}</g>;
              })}
            </g>
          )}
          {cs.after >= 0 && cs.after < 1 && <g opacity={fade}>{crystal([x1 - 20 * st.k, st.groundY], 120 * st.k * easeOut(span(cs.after, 0, 0.15)), 26 * st.k, -10)}{crystal([x1 + 30 * st.k, st.groundY], 90 * st.k * easeOut(span(cs.after, 0.03, 0.18)), 20 * st.k, 14)}</g>}
        </g>
      );
    },
  },

  /** Cercle révélateur : un œil de lumière s'ouvre au-dessus de l'ennemi, balaie ses défenses et le marque. */
  rn_reveal: {
    gesture: 'rn_seal',
    travel: 0.3,
    after: 1.1,
    col: BOLT,
    render: (st, cs) => {
      const hit = st.hits[0]!;
      const eye: Pt = [hit[0], hit[1] - st.enemyH * 0.55];
      const u = span(cs.c, cs.release, cs.e.t + 1.1);
      return (
        <g>
          {tracing(st, cs, 'eye', BOLT, 22)}
          {u > 0 && u < 1 && (
            <g opacity={1 - span(u, 0.75, 1)}>
              {glyph('eye', eye, 40 * st.k, BOLT, { draw: span(u, 0, 0.3) })}
              <path d={`M${eye[0]} ${eye[1]} L${hit[0] - 70 * st.k} ${st.groundY} L${hit[0] + 70 * st.k} ${st.groundY} Z`} fill={BOLT} opacity={0.15 * span(u, 0.2, 0.4)} filter={SOFT} />
              {[0, 1, 2].map((j) => {
                const y = lerp(eye[1] + 30 * st.k, st.groundY, (u * 2 + j / 3) % 1);
                return <line key={j} x1={hit[0] - 60 * st.k} y1={y} x2={hit[0] + 60 * st.k} y2={y} stroke={INK} strokeWidth={2 * st.k} opacity={0.6} filter={GLOW} />;
              })}
            </g>
          )}
          {sparks(cs.i, hit, cs.after / 0.6, { n: 8, spread: [-Math.PI, 0], dist: 90 * st.k, gravity: 150 * st.k, size: 5 * st.k, col: '#9FD8FF' })}
        </g>
      );
    },
  },

  /** Sceau du foyer : un âtre de flammes douces s'allume en cercle à ses pieds ; il réchauffe, soigne et protège. */
  rn_hearth: {
    gesture: 'rn_seal',
    travel: 0.3,
    col: FIRE,
    render: (st, cs) => {
      const c: Pt = [st.chest[0], st.groundY];
      const u = span(cs.tau, 0.45, 2.2);
      return (
        <g>
          {tracing(st, cs, 'hearth', FIRE, 26)}
          {groundCircle(st, c, 170 * st.k, span(cs.tau, 0.4, 2.2), FIRE, window01(cs.tau, 0.4, 2.2, 0.1, 0.4), 6)}
          {u > 0 && u < 1 && Array.from({ length: 7 }, (_, j) => {
            const a = (j / 7) * Math.PI * 2;
            const p: Pt = [c[0] + Math.cos(a) * 150 * st.k, c[1] + Math.sin(a) * 36 * st.k];
            return <g key={j} opacity={Math.sin(Math.PI * u) * (Math.sin(a) > 0 ? 1 : 0.6)}>{flame(p, (50 + 20 * Math.sin(cs.c * 7 + j)) * st.k, 14 * st.k, cs.c * 9 + j)}</g>;
          })}
          {motes(cs.i, [c[0], c[1] - 40 * st.k], u, { n: 8, w: 140 * st.k, rise: 280 * st.k, size: 5 * st.k, col: '#FFD08A', shape: 'plus' })}
          {flash(st.hits[0]!, cs.after / 0.2, 30 * st.k, FIRE)}
        </g>
      );
    },
  },

  /** Ligne de partage : la main tranche ; une ligne de givre horizontale coupe les ennemis, dont les moitiés luisent un instant. */
  rn_divide: {
    gesture: 'rn_slash',
    travel: 0.18,
    col: FROST,
    render: (st, cs) => {
      const y = st.hits[0]![1];
      const x0 = cs.from()[0];
      const x1 = st.w;
      const v = easeOut(clamp01(cs.sinceRelease / 0.3));
      return (
        <g>
          {tracing(st, cs, 'trait', FROST, 22)}
          {cs.sinceRelease >= 0 && cs.after < 0.6 && (
            <g opacity={cs.after > 0.15 ? 1 - (cs.after - 0.15) / 0.45 : 1} filter={GLOW}>
              <line x1={x0} y1={y} x2={lerp(x0, x1, v)} y2={y - 20 * st.k * v} stroke={FROST} strokeWidth={12 * st.k} opacity={0.5} />
              <line x1={x0} y1={y} x2={lerp(x0, x1, v)} y2={y - 20 * st.k * v} stroke={INK} strokeWidth={3 * st.k} />
            </g>
          )}
          {st.hits.slice(0, 2).map((h, j) => (
            <g key={j}>
              {cs.after >= 0 && cs.after < 0.5 && <rect x={h[0] - 70 * st.k} y={h[1] - 3 * st.k} width={140 * st.k} height={6 * st.k} fill={INK} opacity={1 - cs.after / 0.5} filter={GLOW} />}
              {motes(cs.i + j, h, cs.after / 0.8, { n: 6, w: 120 * st.k, rise: -40 * st.k, size: 6 * st.k, col: FROST, shape: 'flake' })}
            </g>
          ))}
        </g>
      );
    },
  },

  /** Anneau de silence : des runes muettes tournent autour de la tête de l'ennemi et étouffent sa force. */
  rn_silence: {
    gesture: 'rn_staff',
    travel: 0.34,
    after: 1.3,
    col: '#7FA8E8',
    render: (st, cs) => {
      const hit = st.hits[0]!;
      const head: Pt = [hit[0] - 20 * st.k, hit[1] - st.enemyH * 0.32];
      const u = span(cs.c, cs.release, cs.e.t + 1.3);
      return (
        <g>
          {u > 0 && u < 1 && (
            <g opacity={window01(u, 0, 1, 0.1, 0.25)} filter={GLOW}>
              <ellipse cx={head[0]} cy={head[1]} rx={90 * st.k * (1.4 - 0.4 * easeOut(span(u, 0, 0.3)))} ry={22 * st.k} fill="none" stroke="#7FA8E8" strokeWidth={3 * st.k} />
              {Array.from({ length: 6 }, (_, j) => {
                const a = (j / 6) * Math.PI * 2 + u * 6;
                const p: Pt = [head[0] + Math.cos(a) * 90 * st.k, head[1] + Math.sin(a) * 22 * st.k];
                return <g key={j} opacity={Math.sin(a) > 0 ? 1 : 0.4}>{glyph('silence', p, 12 * st.k, '#7FA8E8', { ring: false })}</g>;
              })}
            </g>
          )}
          {cs.after >= 0 && cs.after < 1 && <circle cx={hit[0]} cy={hit[1]} r={st.enemyH * 0.5} fill="#0A1430" opacity={0.25 * window01(cs.after, 0, 1, 0.1, 0.4)} filter={BLUR} />}
          {ring(hit, cs.after / 0.5, { r0: 20 * st.k, r1: 90 * st.k, col: '#7FA8E8', width: 4 * st.k })}
        </g>
      );
    },
  },

  /** Sceau de continuité : un nœud sans fin se trace et tourne autour de lui ; tant qu'il tourne, les coups glissent. */
  rn_continuity: {
    gesture: 'rn_seal',
    travel: 0.3,
    col: BOLT,
    render: (st, cs) => {
      const c = st.chest;
      const u = span(cs.tau, 0.3, 2.4);
      return (
        <g>
          {tracing(st, cs, 'knot', BOLT, 30)}
          {u > 0 && u < 1 && (
            <g opacity={window01(u, 0, 1, 0.08, 0.25)} filter={GLOW}>
              <g transform={`translate(${c[0]} ${c[1]}) rotate(${u * 200}) scale(${170 * st.k} ${120 * st.k})`}>
                <path d="M-1 0 C-1 -.7 -.25 -.7 0 0 C.25 .7 1 .7 1 0 C1 -.7 .25 -.7 0 0 C-.25 .7 -1 .7 -1 0 Z" fill="none" stroke={BOLT} strokeWidth={0.025} pathLength={1} strokeDasharray={`${easeOut(span(u, 0, 0.3))} 1`} />
              </g>
              {dome(st, span(u, 0.15, 0.6), BOLT, 0.6, 'none')}
            </g>
          )}
          {flash(st.hits[0]!, cs.after / 0.15, 30 * st.k, BOLT)}
        </g>
      );
    },
  },

  /** Rature ardente : deux traits de feu barrent l'ennemi d'une croix, comme on rature un mot ; les ratures brûlent. */
  rn_ardent_erasure: {
    gesture: 'rn_slash',
    travel: 0.22,
    after: 1.1,
    col: FIRE,
    render: (st, cs) => {
      const hit = st.hits[0]!;
      const L = 80 * st.k * cs.s;
      const stroke = (t0: number, sgn: number) => {
        const v = easeOut(span(cs.after, t0, t0 + 0.12));
        if (v <= 0) return null;
        const a: Pt = [hit[0] - L, hit[1] - L * sgn * 0.8];
        const b = mix(a, [hit[0] + L, hit[1] + L * sgn * 0.8], v);
        return (
          <g filter={GLOW}>
            <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={FIRE} strokeWidth={16 * st.k} strokeLinecap="round" opacity={0.6} />
            <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="#FFF1C4" strokeWidth={5 * st.k} strokeLinecap="round" />
          </g>
        );
      };
      return (
        <g>
          {tracing(st, cs, 'trait', FIRE, 22)}
          {cs.sinceRelease >= 0 && cs.after < 0 && <circle cx={mix(cs.from(), hit, cs.sinceRelease / 0.22)[0]} cy={mix(cs.from(), hit, cs.sinceRelease / 0.22)[1]} r={10 * st.k} fill={FIRE} filter={GLOW} />}
          {cs.after >= 0 && cs.after < 1.1 && <g opacity={1 - span(cs.after, 0.7, 1.1)}>{stroke(0, 1)}{stroke(0.14, -1)}</g>}
          {motes(cs.i, hit, cs.after / 1.1, { n: 8, w: 120 * st.k, rise: 100 * st.k, size: 3 * st.k, col: FIRE })}
        </g>
      );
    },
  },

  /** Trait des éclats : le bras tendu crache une rafale d'éclats de glace qui se brisent sur l'ennemi. */
  rn_shards: {
    gesture: 'rn_channel',
    travel: 0.3,
    col: FROST,
    render: (st, cs) => {
      const hit = st.hits[0]!;
      const from = cs.from();
      return (
        <g>
          {Array.from({ length: st.reduced ? 4 : 7 }, (_, j) => {
            const v = (cs.sinceRelease + 0.18 - j * 0.035) / 0.3;
            if (v < 0 || v > 1) return null;
            const to: Pt = [hit[0], hit[1] + (rnd(cs.i, j) - 0.5) * 80 * st.k];
            const p = mix(from, to, v);
            return (
              <g key={j} transform={`translate(${p[0]} ${p[1]}) rotate(${(angle(from, to) * 180) / Math.PI + 90})`} filter={GLOW}>
                <path d={`M0 ${-16 * st.k} L${5 * st.k} 0 L0 ${16 * st.k} L${-5 * st.k} 0 Z`} fill="url(#fx-ice)" stroke={INK} strokeWidth={1 * st.k} />
              </g>
            );
          })}
          {Array.from({ length: st.reduced ? 4 : 7 }, (_, j) => (
            <g key={`h${j}`}>{sparks(cs.i + j, [hit[0], hit[1] + (rnd(cs.i, j) - 0.5) * 80 * st.k], (cs.after + 0.18 - j * 0.035) / 0.35, { n: 4, spread: [-Math.PI, Math.PI], dist: 40 * st.k, size: 3 * st.k, col: FROST, streak: true })}</g>
          ))}
        </g>
      );
    },
  },

  /** Cercle de rupture : un cercle se trace sous tous les ennemis puis éclate en colonnes de foudre. */
  rn_burst_circle: {
    gesture: 'rn_staff',
    travel: 0.36,
    after: 0.9,
    col: BOLT,
    render: (st, cs) => (
      <g>
        {st.hits.map((h, j) => {
          const g: Pt = [h[0], st.groundY];
          const u = cs.after - j * 0.05;
          return (
            <g key={j}>
              {groundCircle(st, g, 90 * st.k, (cs.sinceRelease - j * 0.05) / 0.8, BOLT, u > 0 ? 1 - span(u, 0.2, 0.6) : 1)}
              {u >= 0 && u < 0.6 && (
                <g opacity={1 - u / 0.6} filter={GLOW}>
                  <rect x={g[0] - 30 * st.k * (1 - u)} y={0} width={60 * st.k * (1 - u)} height={g[1]} fill={BOLT} opacity={0.35} />
                  <path d={d(bolt(cs.i + j, [g[0], 0], g, 9, 18 * st.k, cs.c * 25))} stroke={INK} strokeWidth={4 * st.k} fill="none" />
                </g>
              )}
            </g>
          );
        })}
        {cs.after >= 0 && cs.after < 0.08 && <rect x={0} y={0} width={st.w} height={st.h} fill={BOLT} opacity={0.18} />}
      </g>
    ),
  },

  /** Sceau d'arrêt : le sceau tracé est lancé, s'abat sur l'ennemi et l'enferme un instant dans un bloc de glace. */
  rn_stop: {
    gesture: 'rn_seal',
    travel: 0.36,
    after: 1.2,
    col: FROST,
    render: (st, cs) => {
      const hit = st.hits[0]!;
      const v = clamp01(cs.sinceRelease / 0.36);
      const p = arc(cs.from(0.45), hit, easeIn(v), 80 * st.k);
      const ice = window01(cs.after, 0, 1.2, 0.08, 0.35);
      return (
        <g>
          {tracing(st, cs, 'stop', FROST, 28)}
          {cs.sinceRelease >= 0 && cs.after < 0 && glyph('stop', p, 34 * st.k, FROST, { rot: v * 360 })}
          {ice > 0 && (
            <g opacity={ice}>
              <path d={`M${hit[0] - 80 * st.k} ${st.groundY} L${hit[0] - 90 * st.k} ${st.groundY - st.enemyH * 0.8} L${hit[0] - 20 * st.k} ${st.groundY - st.enemyH * 1.05} L${hit[0] + 70 * st.k} ${st.groundY - st.enemyH * 0.9} L${hit[0] + 85 * st.k} ${st.groundY} Z`} fill="url(#fx-ice)" opacity={0.55} stroke={INK} strokeWidth={2 * st.k} />
              <path d={`M${hit[0] - 40 * st.k} ${st.groundY - st.enemyH * 0.9} L${hit[0] - 10 * st.k} ${st.groundY - 30 * st.k}`} stroke={INK} strokeWidth={2 * st.k} opacity={0.6} />
            </g>
          )}
          {sparks(cs.i, hit, (cs.after - 0.9) / 0.4, { n: 10, spread: [-Math.PI, 0], dist: 100 * st.k, gravity: 160 * st.k, size: 6 * st.k, col: FROST })}
        </g>
      );
    },
  },

  /** Cercle de l'entrave : un cercle s'ouvre sous l'ennemi et des chaînes de lumière en jaillissent pour l'entraver. */
  rn_bind: {
    gesture: 'rn_staff',
    travel: 0.34,
    after: 1.2,
    col: BOLT,
    render: (st, cs) => {
      const hit = st.hits[0]!;
      const g: Pt = [hit[0], st.groundY];
      const u = cs.after;
      return (
        <g>
          {groundCircle(st, g, 95 * st.k, cs.sinceRelease / 1.4, BOLT, cs.after > 0.9 ? 1 - (cs.after - 0.9) / 0.3 : 1)}
          {u >= 0 && u < 1.2 &&
            [-1, 1].map((sx) => {
              const v = easeOut(span(u, 0, 0.25));
              const a: Pt = [g[0] + sx * 85 * st.k, g[1]];
              const b = mix(a, [hit[0] - sx * 50 * st.k, hit[1] - 40 * st.k], v);
              return <g key={sx} filter={GLOW}>{chain(a, b, 16 * st.k, BOLT, (u * 3) % 1, 1 - span(u, 0.8, 1.2))}</g>;
            })}
        </g>
      );
    },
  },

  /** Trait d'interdit : le signe de l'interdit, un cercle barré de feu, se grave sur l'ennemi : il ne peut plus se soigner. */
  rn_interdict: {
    gesture: 'rn_slash',
    travel: 0.28,
    after: 1.2,
    col: FIRE,
    render: (st, cs) => {
      const hit = st.hits[0]!;
      const v = clamp01(cs.sinceRelease / 0.28);
      return (
        <g>
          {tracing(st, cs, 'interdict', FIRE, 24)}
          {cs.sinceRelease >= 0 && cs.after < 0 && glyph('interdict', mix(cs.from(), hit, easeIn(v)), 26 * st.k, FIRE, { rot: v * 180 })}
          {cs.after >= 0 && cs.after < 1.2 && glyph('interdict', hit, 70 * st.k * (1.3 - 0.3 * easeOut(span(cs.after, 0, 0.15))), FIRE, { op: 1 - span(cs.after, 0.8, 1.2), width: 0.12 })}
          {motes(cs.i, hit, cs.after / 1.2, { n: 6, w: 100 * st.k, rise: 90 * st.k, size: 3 * st.k, col: FIRE })}
        </g>
      );
    },
  },

  /** Sceau de résonance : des anneaux vibrent autour de lui comme un gong ; chaque coup reçu les fait résonner. */
  rn_resonant_guard: {
    gesture: 'rn_seal',
    travel: 0.3,
    col: BOLT,
    render: (st, cs) => {
      const c = st.chest;
      const u = span(cs.tau, 0.4, 2.2);
      return (
        <g>
          {tracing(st, cs, 'resonance', BOLT, 28)}
          {u > 0 && u < 1 &&
            [0, 1, 2].map((j) => {
              const r = (120 + j * 35 + Math.sin(cs.c * 18 + j) * 4) * st.k;
              return <ellipse key={j} cx={c[0]} cy={c[1]} rx={r} ry={r * 1.15} fill="none" stroke={BOLT} strokeWidth={(3 - j * 0.7) * st.k} opacity={window01(u, 0, 1, 0.1, 0.3) * (0.8 - j * 0.2)} filter={GLOW} />;
            })}
          {flash(st.hits[0]!, cs.after / 0.15, 30 * st.k, BOLT)}
        </g>
      );
    },
  },

  /** Cercle du refuge : un cercle s'ouvre sous ses pieds et des colonnes de lumière froide montent ; il s'y soigne. */
  rn_refuge: {
    gesture: 'rn_staff',
    travel: 0.3,
    col: FROST,
    render: (st, cs) => {
      const c: Pt = [st.chest[0], st.groundY];
      const u = span(cs.tau, 0.42, 2.2);
      return (
        <g>
          {groundCircle(st, c, 160 * st.k, u, FROST, window01(u, 0, 1, 0.05, 0.25), 8)}
          {u > 0.1 && u < 1 &&
            [-1, 0, 1].map((j) => (
              <rect key={j} x={c[0] + j * 90 * st.k - 14 * st.k} y={c[1] - 420 * st.k * easeOut(span(u, 0.1, 0.4))} width={28 * st.k} height={420 * st.k * easeOut(span(u, 0.1, 0.4))} fill={FROST} opacity={0.18 * window01(u, 0.1, 1, 0.1, 0.3)} filter={SOFT} />
            ))}
          {motes(cs.i, [c[0], c[1] - 40 * st.k], u, { n: 12, w: 220 * st.k, rise: 380 * st.k, size: 5 * st.k, col: '#BDF0FF', shape: 'plus' })}
          {flash(st.hits[0]!, cs.after / 0.2, 30 * st.k, FROST)}
        </g>
      );
    },
  },

  /** Trait de relève : un rayon de feu frappe l'ennemi, puis revient en arc vers lui et devient un bouclier. */
  rn_relay: {
    gesture: 'rn_channel',
    travel: 0.24,
    after: 0.9,
    col: FIRE,
    render: (st, cs) => {
      const hit = st.hits[0]!;
      const from = cs.from();
      const go = clamp01(cs.sinceRelease / 0.24);
      const back = span(cs.after, 0.15, 0.6);
      return (
        <g>
          {cs.sinceRelease >= 0 && cs.after < 0.25 && (
            <g opacity={cs.after > 0 ? 1 - cs.after / 0.25 : 1} filter={GLOW}>
              <line x1={from[0]} y1={from[1]} x2={lerp(from[0], hit[0], go)} y2={lerp(from[1], hit[1], go)} stroke={FIRE} strokeWidth={14 * st.k} strokeLinecap="round" opacity={0.6} />
              <line x1={from[0]} y1={from[1]} x2={lerp(from[0], hit[0], go)} y2={lerp(from[1], hit[1], go)} stroke="#FFF1C4" strokeWidth={4 * st.k} strokeLinecap="round" />
            </g>
          )}
          {back > 0 && back < 1 && (() => {
            const p = arc(hit, st.chest, easeIn(back), -120 * st.k);
            return <g filter={GLOW}>{halo(p, 26 * st.k, FIRE, 0.8)}{glyph('relay', p, 16 * st.k, FIRE, { ring: false })}</g>;
          })()}
          {dome(st, span(cs.after, 0.6, 1.2), FIRE, window01(cs.after, 0.6, 2, 0.05, 0.5))}
          {flash(hit, cs.after / 0.18, 60 * st.k, '#FFE2C4')}
        </g>
      );
    },
  },

  /**
   * La Phrase souveraine (ultime) : il écrit dans le ciel une phrase entière de runes, une à une ; quand il abaisse le
   * bâton, chaque rune tombe sur un ennemi et explose, et la dernière l'entoure de lumière (soin et bouclier).
   */
  rn_sovereign: {
    gesture: 'rn_ultimate',
    travel: 0.42,
    after: 1.4,
    col: VIOLET,
    render: (st, cs) => {
      const words = ['trait', 'circle', 'seal', 'knot', 'eye', 'burst', 'hearth'];
      const y = st.h * 0.2;
      const x0 = st.chest[0] + 40 * st.k;
      const x1 = st.w - 40 * st.k;
      return (
        <g>
          {cs.tau > 0.1 && cs.after < 0.5 && <rect x={0} y={0} width={st.w} height={st.h} fill="#0E0820" opacity={0.35 * window01(cs.tau, 0.1, 2, 0.3, 0.4)} />}
          {words.map((w, j) => {
            const p: Pt = [lerp(x0, x1, j / (words.length - 1)), y + Math.sin(j * 1.3) * 12 * st.k];
            const write = span(cs.tau, 0.3 + j * 0.1, 0.5 + j * 0.1);
            const tgt = st.hits[j % st.hits.length]!;
            const fall = clamp01((cs.sinceRelease - j * 0.03) / 0.42);
            if (write <= 0) return null;
            if (cs.sinceRelease < 0) return <g key={j}>{glyph(w, p, 22 * st.k, VIOLET, { draw: write, rot: Math.sin(cs.c * 2 + j) * 8 })}</g>;
            if (fall < 1) return <g key={j}>{glyph(w, mix(p, tgt, easeIn(fall)), 22 * st.k * (1 + fall), VIOLET, { rot: fall * 360 })}</g>;
            return null;
          })}
          {cs.tau > 0.3 && cs.sinceRelease < 0 && <path d={`M${x0} ${y + 30 * st.k} L${lerp(x0, x1, span(cs.tau, 0.3, 1.1))} ${y + 30 * st.k}`} stroke={VIOLET} strokeWidth={2 * st.k} opacity={0.6} filter={GLOW} />}
          {st.hits.map((h, j) => (
            <g key={j}>
              {flash(h, (cs.after - j * 0.06) / 0.25, 100 * st.k, '#F4EEFF')}
              {ring(h, (cs.after - j * 0.06) / 0.6, { r0: 20 * st.k, r1: 150 * st.k, col: VIOLET, width: 7 * st.k })}
              {sparks(cs.i + j, h, (cs.after - j * 0.06) / 0.8, { n: 12, spread: [-Math.PI, Math.PI], dist: 140 * st.k, size: 4 * st.k, col: VIOLET, hot: INK, streak: true })}
            </g>
          ))}
          {dome(st, span(cs.after, 0.3, 0.9), VIOLET, window01(cs.after, 0.3, 1.4, 0.1, 0.4), 'lines')}
          {motes(cs.i, [st.chest[0], st.feet[1] - 30 * st.k], span(cs.after, 0.3, 1.4), { n: 12, w: 160 * st.k, rise: 320 * st.k, size: 5 * st.k, col: '#D9C8FF', shape: 'plus' })}
        </g>
      );
    },
  },
};

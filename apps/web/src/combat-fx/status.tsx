import type { ReactNode } from 'react';
import type { SpellEffects, TimelineEvent } from '@bramo/shared';
import { type Pt, type Stage, GLOW, SOFT, anvilShape, chain, flake, flame, glyph, hexPlate, leaf, polar, rnd } from './kit';

/**
 * Effets qui durent : bouclier sur le personnage, brûlure ou saignement, marque, ralentissement, étourdissement,
 * affaiblissement et soins coupés sur l'ennemi. Chacun prend le style de la classe qui l'a posé ; seul le plus récent de
 * chaque sorte s'affiche.
 */

export interface StatusSource {
  e: TimelineEvent;
  classId: string;
  effects: SpellEffects;
  col: string;
}

type Kind = 'shield' | 'dot' | 'mark' | 'slow' | 'stun' | 'weaken' | 'antiheal';

/** Le plus récent de chaque sorte encore actif à l'instant `c`, avec sa part écoulée. */
function active(sources: StatusSource[], c: number): Partial<Record<Kind, { src: StatusSource; u: number; left: number; dur: number; type?: 'burn' | 'bleed' }>> {
  const out: Partial<Record<Kind, { src: StatusSource; u: number; left: number; dur: number; type?: 'burn' | 'bleed' }>> = {};
  for (const src of sources) {
    const t = src.e.t;
    if (t > c) continue;
    const f = src.effects;
    const put = (kind: Kind, dur: number | undefined, type?: 'burn' | 'bleed') => {
      if (!dur || c > t + dur) return;
      out[kind] = { src, u: (c - t) / dur, left: t + dur - c, dur, ...(type ? { type } : {}) };
    };
    put('shield', f.shield);
    put('dot', f.dot?.duration, f.dot?.type);
    put('mark', f.mark);
    put('slow', f.slow);
    put('stun', f.stun);
    put('weaken', f.weaken);
    put('antiheal', f.antiheal);
  }
  return out;
}

export function statusLayer(st: Stage, sources: StatusSource[], c: number, enemyAlive: boolean): { back: ReactNode; front: ReactNode } {
  const a = active(sources, c);
  const k = st.k;
  const hit = st.hits[0] ?? [st.enemyX, st.groundY - st.enemyH * 0.5];
  const ground: Pt = [hit[0], st.groundY];
  const t = st.now / 1000;
  // Apparaît en 0,25 s, s'efface dans ses 0,4 dernières secondes.
  const fade = (x: { u: number; left: number; dur: number }) => Math.max(0, Math.min(1, (x.u * x.dur) / 0.25, x.left / 0.4));
  const back: ReactNode[] = [];
  const front: ReactNode[] = [];

  // Bouclier sur le personnage.
  const sh = a.shield;
  if (sh) {
    const op = fade(sh) * 0.85;
    const c0 = st.chest;
    const cls = sh.src.classId;
    if (cls === 'forgefire') {
      back.push(
        <g key="shield" opacity={op}>
          {Array.from({ length: 6 }, (_, j) => {
            const ang = -Math.PI / 2 + ((j - 2.5) / 6) * Math.PI * 1.1 + Math.sin(t * 0.8) * 0.05;
            const p = polar(c0, ang, 150 * k);
            return <g key={j} transform={`translate(${p[0]} ${p[1]}) rotate(${j * 9})`}>{hexPlate(26 * k, sh.src.col, 0.7)}</g>;
          })}
        </g>,
      );
    } else if (cls === 'tracker') {
      back.push(
        <g key="shield" opacity={op}>
          <ellipse cx={c0[0]} cy={c0[1] + 40 * k} rx={150 * k} ry={260 * k} fill={sh.src.col} opacity={0.08} filter={SOFT} />
          {Array.from({ length: 9 }, (_, j) => {
            const ang = (j / 9) * Math.PI * 2 + t * 0.6;
            const p: Pt = [c0[0] + Math.cos(ang) * 140 * k, c0[1] + 40 * k + Math.sin(ang) * 240 * k];
            return <g key={j} transform={`translate(${p[0]} ${p[1]}) rotate(${(ang * 180) / Math.PI + 90})`} opacity={0.75}>{leaf(9 * k, sh.src.col)}</g>;
          })}
        </g>,
      );
    } else {
      back.push(
        <g key="shield" opacity={op}>
          <ellipse cx={c0[0]} cy={c0[1] + 40 * k} rx={160 * k} ry={270 * k} fill={sh.src.col} fillOpacity={0.07} stroke={sh.src.col} strokeWidth={2 * k} strokeOpacity={0.55} filter={GLOW} />
          {[0, 1, 2].map((j) => {
            const ang = t * (0.8 + j * 0.3) + j * 2;
            const p: Pt = [c0[0] + Math.cos(ang) * 160 * k, c0[1] + 40 * k + Math.sin(ang) * 270 * k];
            return <g key={j}>{glyph(['trait', 'circle', 'seal'][j]!, p, 10 * k, sh.src.col, { ring: false })}</g>;
          })}
        </g>,
      );
    }
  }
  if (!enemyAlive) return { back, front };

  // Brûlure ou saignement.
  const dot = a.dot;
  if (dot) {
    const op = fade(dot);
    if (dot.type === 'burn')
      front.push(
        <g key="dot" opacity={op * 0.9}>
          {[-1, 0, 1].map((j) => (
            <g key={j}>{flame([ground[0] + j * 34 * k, ground[1]], (40 + 18 * Math.sin(t * 9 + j * 2)) * k, 13 * k, t * 11 + j)}</g>
          ))}
        </g>,
      );
    else
      front.push(
        <g key="dot" opacity={op}>
          {[0, 1, 2].map((j) => {
            const v = (t * 1.3 + j / 3) % 1;
            const x = hit[0] + (rnd(j, 3) - 0.5) * 60 * k;
            return <path key={j} d={`M${x} ${hit[1] + v * 120 * k} q${3 * k} ${6 * k} 0 ${10 * k} q${-3 * k} ${-4 * k} 0 ${-10 * k}`} fill="#C2302A" opacity={1 - v} />;
          })}
        </g>,
      );
  }

  // Marque au-dessus de l'ennemi.
  const mark = a.mark;
  if (mark) {
    const op = fade(mark);
    const p: Pt = [hit[0], st.groundY - st.enemyH * 1.12];
    const cls = mark.src.classId;
    front.push(
      <g key="mark" opacity={op}>
        {cls === 'forgefire' ? (
          <g filter={GLOW}>{anvilShape([p[0], p[1] + 14 * k], 44 * k, mark.src.col)}</g>
        ) : cls === 'tracker' ? (
          <g transform={`translate(${p[0]} ${p[1]}) rotate(${t * 40})`} stroke={mark.src.col} strokeWidth={2.5 * k} fill="none" filter={GLOW}>
            <circle r={16 * k} />
            {[0, 90, 180, 270].map((r) => <line key={r} x1={0} y1={-10 * k} x2={0} y2={-24 * k} transform={`rotate(${r})`} />)}
          </g>
        ) : (
          glyph('eye', p, 18 * k, mark.src.col)
        )}
      </g>,
    );
  }

  // Ralentissement aux pieds.
  const slow = a.slow;
  if (slow) {
    const op = fade(slow);
    const cls = slow.src.classId;
    front.push(
      <g key="slow" opacity={op}>
        {cls === 'runist' ? (
          <g>
            <ellipse cx={ground[0]} cy={ground[1]} rx={80 * k} ry={16 * k} fill="#BFE8FF" opacity={0.3} filter={SOFT} />
            {[-1, 1].map((j) => <g key={j} transform={`translate(${ground[0] + j * 40 * k} ${ground[1] - 14 * k}) rotate(${t * 30 * j})`}>{flake(10 * k, '#E8F7FF')}</g>)}
          </g>
        ) : (
          <g>
            <ellipse cx={ground[0]} cy={ground[1] - 8 * k} rx={56 * k} ry={12 * k} fill="none" stroke={cls === 'tracker' ? '#C9B48A' : '#9A948A'} strokeWidth={5 * k} />
            {chain([ground[0] - 56 * k, ground[1] - 8 * k], [ground[0] - 130 * k, ground[1]], 12 * k, cls === 'tracker' ? '#C9B48A' : '#9A948A')}
          </g>
        )}
      </g>,
    );
  }

  // Étourdissement : des étoiles qui tournent autour de la tête.
  const stun = a.stun;
  if (stun) {
    const head: Pt = [hit[0] - 20 * k, st.groundY - st.enemyH * 0.95];
    front.push(
      <g key="stun" opacity={fade(stun)} filter={GLOW}>
        {[0, 1, 2].map((j) => {
          const ang = t * 6 + (j * Math.PI * 2) / 3;
          const p: Pt = [head[0] + Math.cos(ang) * 40 * k, head[1] + Math.sin(ang) * 10 * k];
          return <path key={j} d={`M${p[0]} ${p[1] - 8 * k} L${p[0] + 2.5 * k} ${p[1] - 2.5 * k} L${p[0] + 8 * k} ${p[1]} L${p[0] + 2.5 * k} ${p[1] + 2.5 * k} L${p[0]} ${p[1] + 8 * k} L${p[0] - 2.5 * k} ${p[1] + 2.5 * k} L${p[0] - 8 * k} ${p[1]} L${p[0] - 2.5 * k} ${p[1] - 2.5 * k} Z`} fill="#FFE27A" />;
        })}
      </g>,
    );
  }

  // Affaiblissement : chevrons qui descendent sur l'ennemi.
  const weak = a.weaken;
  if (weak) {
    const op = fade(weak) * 0.8;
    front.push(
      <g key="weaken" opacity={op} stroke="#A9B3C8" strokeWidth={4 * k} fill="none" strokeLinecap="round">
        {[0, 1].map((j) => {
          const v = (t * 0.9 + j / 2) % 1;
          const y = hit[1] - 60 * k + v * 80 * k;
          return <path key={j} d={`M${hit[0] + 50 * k} ${y} l${12 * k} ${12 * k} l${12 * k} ${-12 * k}`} opacity={Math.sin(Math.PI * v)} />;
        })}
      </g>,
    );
  }

  // Soins coupés : un cœur barré.
  const ah = a.antiheal;
  if (ah) {
    const p: Pt = [hit[0] + 60 * k, hit[1] - st.enemyH * 0.3];
    front.push(
      <g key="antiheal" opacity={fade(ah)}>
        <path d={`M${p[0]} ${p[1] + 8 * k} C${p[0] - 14 * k} ${p[1] - 2 * k} ${p[0] - 8 * k} ${p[1] - 14 * k} ${p[0]} ${p[1] - 6 * k} C${p[0] + 8 * k} ${p[1] - 14 * k} ${p[0] + 14 * k} ${p[1] - 2 * k} ${p[0]} ${p[1] + 8 * k} Z`} fill="#3A4A3E" stroke="#7ED6A2" strokeWidth={1.5 * k} />
        <line x1={p[0] - 12 * k} y1={p[1] - 12 * k} x2={p[0] + 12 * k} y2={p[1] + 10 * k} stroke="#FF7C7C" strokeWidth={3 * k} strokeLinecap="round" />
      </g>,
    );
  }
  return { back, front };
}

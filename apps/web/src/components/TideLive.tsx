import { type CSSProperties, memo, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { TideAward, TideLiveFighter, TideLiveView } from '@bramo/shared';
import { useContent } from '../game/ContentContext';
import { Character, colorVars } from '../rig/Character';
import { BESTIARY } from '../combat-fx/bestiary';
import { Shade } from '../combat-fx/enemy';
import { clock, num } from '../format';

/**
 * La Marée en direct (demande de Louis, 23 octobre : « à gauche tous les gens qui ont rejoint, qui attaquent avec leurs
 * skins, à droite ce qu'ils affrontent ») : les inscrits tiennent la digue en trois rangs, chacun frappe à son rythme et
 * envoie son coup vers la Marée ; la digue se remplit et ses lanternes s'allument aux seuils.
 *
 * Tout est dans un repère de 1000 × 420 (la scène garde ces proportions). Les personnages sont en mode foule (coût
 * d'affichage : art/perf.mjs) ; l'ennemi, les coups et les nombres sont dessinés dans un seul calque redessiné à chaque image.
 */

const W = 1000;
const H = 420;
/** Gestes par classe : l'attaque de base revient le plus souvent. */
const GESTURES: Record<string, string[]> = {
  forgefire: ['attack_forgefire', 'attack_forgefire', 'ff_sweep', 'ff_punch'],
  runist: ['attack_runist', 'attack_runist', 'rn_slash', 'rn_seal'],
  tracker: ['attack_tracker', 'attack_tracker', 'tr_volley', 'tr_aim'],
};
/** Rangs de la digue : pied, taille (en unités de la scène), étendue horizontale. */
const ROWS = [
  { foot: 286, h: 112, x0: 40, x1: 470 },
  { foot: 336, h: 132, x0: 20, x1: 500 },
  { foot: 396, h: 156, x0: 0, x1: 530 },
];
/** Lanternes de la digue (une par seuil). */
const LANTERN_X = [90, 210, 330, 450, 570];
/** Où les coups arrivent, et où se tient la Marée. */
const ENEMY_FOOT = 372;

interface Placed {
  f: TideLiveFighter;
  x: number;
  foot: number;
  h: number;
  row: number;
  color: string;
}

interface Shot {
  id: number;
  from: [number, number];
  to: [number, number];
  color: string;
  born: number;
  big: boolean;
}

interface Hit {
  id: number;
  at: [number, number];
  value: number;
  born: number;
  crit: boolean;
}

const rand = (seed: number) => {
  let s = seed >>> 0 || 1;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0), s / 4294967296);
};

export function TideLive({ view }: { view: TideLiveView }) {
  const content = useContent();
  // Placement : le joueur au premier rang, puis les autres répartis sur les trois rangs (le premier rang devant).
  const placed = useMemo<Placed[]>(() => {
    const list = view.fighters;
    const out: Placed[] = [];
    const perRow = Math.ceil(list.length / ROWS.length);
    const order = [...list].sort((a, b) => Number(a.me) - Number(b.me));
    order.forEach((f, i) => {
      const row = Math.min(ROWS.length - 1, Math.floor(i / Math.max(1, perRow)));
      const inRow = order.slice(row * perRow, (row + 1) * perRow).length;
      const k = i - row * perRow;
      const r = ROWS[row]!;
      const step = (r.x1 - r.x0 - r.h * 0.5) / Math.max(1, inRow);
      const jitter = (((f.id * 7919) % 13) - 6) * 1.5;
      const glow = fighterGlow(content, f);
      out.push({ f, x: r.x0 + step * (k + 0.5) + jitter, foot: r.foot + ((k % 2) * 6 - 3), h: r.h, row, color: glow });
    });
    return out;
  }, [view.fighters, content]);

  const shotsRef = useRef<Shot[]>([]);
  const hitsRef = useRef<Hit[]>([]);
  const idRef = useRef(0);
  const fight = view.phase === 'battle';

  // Un coup part du torse du combattant et file vers la Marée ; le nombre apparaît à l'arrivée.
  const fire = useCallback((p: Placed, strong: boolean) => {
    const from: [number, number] = [p.x + p.h * 0.36, p.foot - p.h * 0.62];
    const to: [number, number] = [720 + Math.random() * 150, ENEMY_FOOT - 90 - Math.random() * 110];
    shotsRef.current.push({ id: ++idRef.current, from, to, color: p.color, born: performance.now(), big: strong });
  }, []);

  const total = view.total;
  const shown = view.fighters.length;
  const pr = view.progress;
  const share = pr.objective ? Math.min(1, pr.points / pr.objective) : 0;
  const now = Date.now();

  return (
    <div className={`tide-live phase-${view.phase}`}>
      <svg className="tide-live-bg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" aria-hidden>
        <Backdrop lit={pr.lit} />
      </svg>
      <div className="tide-live-crowd">
        {placed.map((p, i) => (
          <Fighter key={p.f.id} p={p} fighting={fight} seed={p.f.id * 31 + i} onFire={fire} />
        ))}
      </div>
      <Overlay tide={view.tide} phase={view.phase} shotsRef={shotsRef} hitsRef={hitsRef} idRef={idRef} />
      <div className="tide-live-hud">
        <div className="tide-live-title">
          <span className={`tide-live-dot${fight ? ' on' : ''}`} />
          <strong>{view.name}</strong>
          <span className="muted small">
            {view.phase === 'battle'
              ? `en direct · jusqu’à ${clock(view.end)}`
              : view.phase === 'gathering'
                ? `on se rassemble · la Marée monte à ${clock(view.start)}`
                : view.phase === 'done'
                  ? 'terminée pour ce soir'
                  : `inscriptions à ${clock(view.registrationStart)}`}
            {view.demo ? ' · démonstration' : ''}
          </span>
        </div>
        <div className="tide-live-dike" title={`${num(pr.points)} points sur ${num(pr.objective)}`}>
          <div className="tide-live-bar">
            <span style={{ width: `${share * 100}%` }} />
            {pr.shares.map((s, i) => (
              <i key={i} className={i < pr.lit ? 'lit' : ''} style={{ left: `${Math.min(100, s * 100)}%` }} />
            ))}
          </div>
          <span className="small">
            {pr.lit} lanterne{pr.lit > 1 ? 's' : ''} sur {pr.shares.length} · {num(pr.points)} / {num(pr.objective)} points
          </span>
        </div>
        <span className="tide-live-count small">
          {num(total)} à la digue{total > shown ? ` · ${shown} ici` : ''}
        </span>
      </div>
      {view.phase === 'idle' && <div className="tide-live-banner">Inscriptions ce soir à {clock(view.registrationStart)} · la Marée monte à {clock(view.start)}</div>}
      {view.phase === 'gathering' && <div className="tide-live-banner">La Marée monte dans {Math.max(1, Math.round((view.start - now) / 60_000))} min</div>}
      {/* Le récapitulatif du soir : une fois la Marée finie (et, en démonstration, pendant la dernière minute). */}
      {(view.phase === 'done' || (view.demo && ((view.serverTime - view.start) / (view.end - view.start) > 0.88 || new URLSearchParams(location.search).has('recap')))) && view.recap.length > 0 && (
        <div className="tide-live-recap">
          <span className="eyebrow">Récap de la Marée</span>
          <TideRecap awards={view.recap} />
        </div>
      )}
      {view.phase === 'done' && total > 0 && <div className="tide-live-banner">La digue a tenu : {pr.lit} lanterne{pr.lit > 1 ? 's' : ''} allumée{pr.lit > 1 ? 's' : ''}</div>}
      {total === 0 && view.phase !== 'idle' && <div className="tide-live-banner">{view.phase === 'done' ? 'Personne ne s’était inscrit ce soir.' : 'Personne n’est encore inscrit ce soir.'}</div>}
    </div>
  );
}

/** Icône de chaque distinction du récapitulatif. */
const AWARD_ICON: Record<TideAward['key'], string> = {
  mvp: 'M12 2l2.9 6.3 6.9.7-5.2 4.6 1.5 6.8L12 17l-6.1 3.4 1.5-6.8L2.2 9l6.9-.7z',
  damage: 'M14.5 17.5L3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2',
  healing: 'M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 5a5.5 5.5 0 0 1 9.5 7c-2.5 4.5-9.5 9-9.5 9zM12 9v6M9 12h6',
  shielding: 'M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z',
  control: 'M12 3v4M12 17v4M3 12h4M17 12h4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
  work: 'M3 7h8v5H3zM13 7h8v5h-8zM7 12h10v5H7z',
};

/** Le meilleur de chaque rôle (dégâts, soins, boucliers, contrôle, travail), en tuiles. */
export function TideRecap({ awards }: { awards: TideAward[] }) {
  return (
    <ul className="tide-recap">
      {awards.map((a) => (
        <li key={a.key} className={`tide-award award-${a.key}`}>
          <svg viewBox="0 0 24 24" aria-hidden>
            <path d={AWARD_ICON[a.key]} />
          </svg>
          <span className="tide-award-text">
            <span className="muted small">{a.title}</span>
            <strong>{a.name}</strong>
            <span className="small">
              {num(a.value)} {a.unit}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Un combattant : son personnage (mode foule) qui frappe à son rythme pendant la Marée. */
const Fighter = memo(function Fighter({ p, fighting, seed, onFire }: { p: Placed; fighting: boolean; seed: number; onFire: (p: Placed, strong: boolean) => void }) {
  const [action, setAction] = useState<{ anim: string; at: number } | undefined>(undefined);
  useEffect(() => {
    if (!fighting) return;
    const r = rand(seed);
    const gestures = GESTURES[p.f.appearance.classId] ?? GESTURES.runist!;
    let timer = 0;
    const next = (first: boolean) => {
      // Ceux qui tiennent la digue en direct frappent un peu plus souvent.
      const wait = (first ? r() * 3000 : 2400 + r() * 3000) / (p.f.live ? 1.2 : 1);
      timer = window.setTimeout(() => {
        const anim = gestures[Math.floor(r() * gestures.length)]!;
        setAction({ anim, at: performance.now() });
        window.setTimeout(() => onFire(p, anim !== gestures[0]), 380);
        next(false);
      }, wait);
    };
    next(true);
    return () => window.clearTimeout(timer);
  }, [fighting, p, seed, onFire]);
  const style: CSSProperties = {
    left: `${(p.x / W) * 100}%`,
    top: `${((p.foot - p.h) / H) * 100}%`,
    height: `${(p.h / H) * 100}%`,
    zIndex: p.row * 100 + Math.round(p.x / 10),
    filter: p.row === 0 ? 'brightness(.72)' : p.row === 1 ? 'brightness(.86)' : undefined,
  };
  return (
    <div className={`tide-fighter${p.f.me ? ' me' : ''}${p.f.live ? ' live' : ''}`} style={style} title={`${p.f.name}${p.f.live ? ' · en direct' : ''}`}>
      {/* Immobile au repos, il ne bouge que pour frapper : 32 combattants qui respirent coûtaient trop (art/perf.mjs). */}
      <Character appearance={p.f.appearance} lod="scene" crowd animate={false} action={action} />
      {(p.f.me || p.row === 2) && <span className="tide-fighter-name">{p.f.name}</span>}
    </div>
  );
});

/** Le fond : ciel de nuit, lune, la digue de pierre et ses lanternes (allumées aux seuils franchis), la mer qui monte. */
function Backdrop({ lit }: { lit: number }) {
  const u = useId().replace(/[^a-zA-Z0-9]/g, '');
  return (
    <>
      <defs>
        <linearGradient id={`${u}sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0C1420" />
          <stop offset=".6" stopColor="#1B2A3A" />
          <stop offset="1" stopColor="#24384A" />
        </linearGradient>
        <linearGradient id={`${u}sea`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1C4652" />
          <stop offset="1" stopColor="#0B1E26" />
        </linearGradient>
        <linearGradient id={`${u}stone`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4A4E52" />
          <stop offset="1" stopColor="#24272A" />
        </linearGradient>
        <radialGradient id={`${u}lamp`}>
          <stop offset="0" stopColor="#FFD27A" stopOpacity=".9" />
          <stop offset=".4" stopColor="#FFB040" stopOpacity=".35" />
          <stop offset="1" stopColor="#FFB040" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${u}moon`}>
          <stop offset="0" stopColor="#E8F4FF" stopOpacity=".95" />
          <stop offset=".3" stopColor="#BFD8F0" stopOpacity=".35" />
          <stop offset="1" stopColor="#BFD8F0" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width={W} height={H} fill={`url(#${u}sky)`} />
      <circle cx="840" cy="70" r="90" fill={`url(#${u}moon)`} />
      <circle cx="840" cy="70" r="24" fill="#E8F2FA" opacity=".9" />
      <path d="M0 230 Q120 190 240 214 Q360 236 470 204 Q560 180 640 210 L640 260 L0 260 Z" fill="#16222C" />
      {/* La mer, à droite, qui vient battre la digue. */}
      <path d="M540 250 Q700 236 1000 244 L1000 420 L560 420 Z" fill={`url(#${u}sea)`} />
      <g className="tide-live-waves">
        <path d="M560 270 q30 -10 60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0" fill="none" stroke="#7FD6E0" strokeOpacity=".35" strokeWidth="3" />
        <path d="M600 320 q30 -10 60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0" fill="none" stroke="#7FD6E0" strokeOpacity=".25" strokeWidth="3" />
        <path d="M580 380 q30 -10 60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0" fill="none" stroke="#7FD6E0" strokeOpacity=".2" strokeWidth="3" />
      </g>
      {/* La digue : un long talus de pierre, les combattants dessus. */}
      <path d="M0 250 L600 244 L640 420 L0 420 Z" fill={`url(#${u}stone)`} />
      <path d="M0 250 L600 244" stroke="#8A9096" strokeOpacity=".5" strokeWidth="3" />
      <path d="M600 244 L640 420" stroke="#0B0D10" strokeOpacity=".6" strokeWidth="6" />
      <path d="M0 300 L612 296 M0 352 L624 348 M90 250 L96 420 M230 248 L240 420 M370 247 L384 420 M510 245 L528 420" stroke="#000" strokeOpacity=".22" strokeWidth="2" />
      <path d="M608 270 Q630 300 620 330 Q650 360 636 400" fill="none" stroke="#CFEFF4" strokeOpacity=".5" strokeWidth="5" className="tide-live-foam" />
      {LANTERN_X.map((x, i) => (
        <g key={x} transform={`translate(${x} 246)`}>
          <path d="M0 0 L0 -64" stroke="#2A2620" strokeWidth="4" />
          <path d="M0 -64 L14 -64" stroke="#2A2620" strokeWidth="3" />
          {i < lit && <circle cx="14" cy="-50" r="40" fill={`url(#${u}lamp)`} className="tide-live-lamp" />}
          <rect x="8" y="-60" width="12" height="16" rx="2" fill={i < lit ? '#FFD27A' : '#3A3A36'} stroke="#2A2620" strokeWidth="2" />
        </g>
      ))}
    </>
  );
}

/** Le calque qui bouge à chaque image : la Marée (ennemis), les coups qui filent, les nombres. */
function Overlay({
  tide,
  phase,
  shotsRef,
  hitsRef,
  idRef,
}: {
  tide: string;
  phase: TideLiveView['phase'];
  shotsRef: React.MutableRefObject<Shot[]>;
  hitsRef: React.MutableRefObject<Hit[]>;
  idRef: React.MutableRefObject<number>;
}) {
  const [now, setNow] = useState(() => performance.now());
  const u = useId().replace(/[^a-zA-Z0-9]/g, '');
  const lastHit = useRef(0);
  useEffect(() => {
    let id = 0;
    let slot = -1;
    const loop = (t: number) => {
      // 30 images par seconde suffisent à la Marée et aux coups (la moitié du coût d'affichage).
      if (Math.floor(t / 33) === slot) {
        id = requestAnimationFrame(loop);
        return;
      }
      slot = Math.floor(t / 33);
      // Les coups arrivés deviennent des nombres ; les vieux nombres s'effacent.
      const arrived = shotsRef.current.filter((s) => t - s.born >= 520);
      if (arrived.length) {
        lastHit.current = t;
        for (const s of arrived) {
          const crit = Math.random() < 0.12;
          hitsRef.current.push({ id: ++idRef.current, at: [s.to[0] + (Math.random() - 0.5) * 30, s.to[1]], value: Math.round((s.big ? 260 : 120) + Math.random() * 220) * (crit ? 2 : 1), born: t, crit });
        }
        shotsRef.current = shotsRef.current.filter((s) => t - s.born < 520);
      }
      hitsRef.current = hitsRef.current.filter((h) => t - h.born < 1100);
      setNow(t);
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [shotsRef, hitsRef, idRef]);
  const t = now / 1000;
  const hurt = Math.max(0, 1 - (now - lastHit.current) / 220);
  const strike = Math.max(0, Math.sin(t * 1.9)) ** 8;
  const hidden = phase === 'gathering' || phase === 'idle';
  const gone = phase === 'done';
  return (
    <svg className="tide-live-fx" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" aria-hidden>
      {!gone && (
        <g opacity={hidden ? 0.18 : 1}>
          <Tide tide={tide} t={t} hurt={hurt} strike={strike} u={u} />
        </g>
      )}
      {hidden && <rect x="560" y="120" width="440" height="300" fill="#9FB6C4" opacity=".14" className="tide-live-fog" />}
      {shotsRef.current.map((s) => {
        const k = Math.min(1, (now - s.born) / 520);
        const cx = (s.from[0] + s.to[0]) / 2;
        const cy = Math.min(s.from[1], s.to[1]) - 70;
        const x = (1 - k) ** 2 * s.from[0] + 2 * (1 - k) * k * cx + k * k * s.to[0];
        const y = (1 - k) ** 2 * s.from[1] + 2 * (1 - k) * k * cy + k * k * s.to[1];
        const k2 = Math.max(0, k - 0.12);
        const x2 = (1 - k2) ** 2 * s.from[0] + 2 * (1 - k2) * k2 * cx + k2 * k2 * s.to[0];
        const y2 = (1 - k2) ** 2 * s.from[1] + 2 * (1 - k2) * k2 * cy + k2 * k2 * s.to[1];
        return (
          <g key={s.id}>
            <path d={`M${x2} ${y2} L${x} ${y}`} stroke={s.color} strokeWidth={s.big ? 5 : 3} strokeLinecap="round" opacity=".7" />
            <circle cx={x} cy={y} r={s.big ? 9 : 6} fill={s.color} opacity=".35" />
            <circle cx={x} cy={y} r={s.big ? 4 : 2.6} fill="#FFFFFF" />
          </g>
        );
      })}
      {hitsRef.current.map((h) => {
        const k = (now - h.born) / 1100;
        return (
          <g key={h.id} opacity={1 - k}>
            {k < 0.25 && <circle cx={h.at[0]} cy={h.at[1]} r={10 + k * 60} fill="none" stroke="#FFFFFF" strokeOpacity={0.6 - k * 2} strokeWidth="3" />}
            <text x={h.at[0]} y={h.at[1] - 10 - k * 40} className={`tide-live-num${h.crit ? ' crit' : ''}`} textAnchor="middle">
              {h.value}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/** Ce que la Marée envoie ce soir : l'Ombre et la vase (Débâcle), les lanternes qui marchent (Nuit des Lanternes), un géant. */
function Tide({ tide, t, hurt, strike, u }: { tide: string; t: number; hurt: number; strike: number; u: string }) {
  const creature = (id: string, x: number, h: number, j: number, front = false) => {
    const c = BESTIARY[id];
    if (!c) return null;
    const sc = h / 260;
    const bob = Math.sin(t * 1.6 + j) * 3;
    const lunge = front ? strike * 26 : 0;
    return (
      <g key={`${id}${j}`} transform={`translate(${x - lunge} ${ENEMY_FOOT + bob}) scale(${sc})`}>
        <g transform="translate(-100 -260)">{c.draw({ t: t + j * 1.3, strike: front ? strike : 0, hurt: front ? hurt : hurt * 0.4, u: `${u}c${j}` })}</g>
      </g>
    );
  };
  if (tide === 'lanterns') {
    return (
      <>
        {creature('z01_lantern_road', 930, 150, 2)}
        {creature('z01_lantern_road', 830, 190, 1)}
        {creature('z01_lantern_road', 740, 230, 0, true)}
      </>
    );
  }
  if (tide === 'giants') return creature('b5_gardien_portes', 820, 330, 0, true);
  // La Débâcle : l'Ombre de la Marée, et la vase des fossés qu'elle charrie.
  return (
    <>
      <g transform={`translate(${850 - strike * 20} ${ENEMY_FOOT}) scale(1.35)`}>
        <Shade t={t} hurt={hurt} uid={`${u}s`} />
      </g>
      {creature('z02_gray_ditches', 720, 120, 1, true)}
      {creature('z02_gray_ditches', 960, 100, 2)}
    </>
  );
}

/** Une couleur de sort pour un personnage (tenue qui la change, sinon couleur d'affinité de la classe). */
export function fighterGlow(content: ReturnType<typeof useContent>, f: TideLiveFighter): string {
  const v = colorVars(content, f.appearance) as Record<string, string>;
  return v['--c-glow'] ?? '#B39DF5';
}

import type { ReactNode } from 'react';
import { GLYPHS } from '../combat-fx/kit';

/**
 * Icônes des sorts : un médaillon à la couleur de l'élément (ou de la classe pour le physique) et un symbole propre au
 * sort, qui reprend son effet à l'écran. Dessinées dans un carré de 48 ; un ultime a un cadre doré.
 */

const ELEMENT_BG: Record<string, [string, string]> = {
  fire: ['#FF9A4A', '#7A2210'],
  frost: ['#A8DCFF', '#1E4E7A'],
  lightning: ['#D9C6FF', '#3D2A78'],
};
const CLASS_BG: Record<string, [string, string]> = {
  forgefire: ['#E2B07A', '#5A3420'],
  tracker: ['#8FE0B0', '#164A33'],
  runist: ['#C6B4FF', '#33245E'],
};

const L = '#FFFFFF';
const S = { fill: 'none', stroke: L, strokeWidth: 3, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
const F = { fill: L } as const;

const glyph = (name: string, x = 24, y = 24, r = 12, w = 3) => <path d={GLYPHS[name]} transform={`translate(${x} ${y}) scale(${r})`} {...S} strokeWidth={w / r} />;
const anvil = (x: number, y: number, s = 1) => (
  <path transform={`translate(${x} ${y}) scale(${s})`} d="M-12 -8 H8 Q14 -8 14 -5 L5 -3 L4 2 L8 8 H-8 L-4 2 L-5 -3 L-12 -5 Z" {...F} />
);
const hammer = (x: number, y: number, rot = -40, s = 1) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <rect x="-2" y="-2" width="4" height="22" rx="2" fill={L} opacity=".85" />
    <rect x="-9" y="-8" width="18" height="10" rx="2" fill={L} />
  </g>
);
const flame = (x: number, y: number, h = 18, w = 7) => <path d={`M${x - w} ${y} C${x - w} ${y - h * 0.5} ${x - 1} ${y - h * 0.6} ${x} ${y - h} C${x + 1} ${y - h * 0.6} ${x + w} ${y - h * 0.5} ${x + w} ${y} Z`} {...F} />;
const arrow = (x1: number, y1: number, x2: number, y2: number, w = 3) => {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const hx = (s: number) => x2 - Math.cos(a + s * 0.5) * 7;
  const hy = (s: number) => y2 - Math.sin(a + s * 0.5) * 7;
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} {...S} strokeWidth={w} />
      <path d={`M${x2} ${y2} L${hx(1)} ${hy(1)} M${x2} ${y2} L${hx(-1)} ${hy(-1)}`} {...S} strokeWidth={w} />
    </g>
  );
};
const wolf = (x: number, y: number, s = 1, flip = false) => (
  <path
    transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}
    d="M-14 4 L-10 -4 L-4 -7 L2 -6 L6 -12 L8 -6 L12 -4 L15 0 L10 1 L7 4 L2 3 L-6 5 Z"
    {...F}
  />
);
const leaf = (x: number, y: number, rot = 0, s = 1) => <path transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} d="M-8 0 Q0 -7 8 0 Q0 7 -8 0 Z" {...F} />;
const bolt = (x: number, y: number, s = 1) => <path transform={`translate(${x} ${y}) scale(${s})`} d="M2 -14 L-7 2 L-1 2 L-3 14 L7 -3 L1 -3 Z" {...F} />;
const hex = (x: number, y: number, r: number) => <path d={Array.from({ length: 6 }, (_, j) => `${j ? 'L' : 'M'}${x + Math.cos((Math.PI / 3) * j + Math.PI / 6) * r} ${y + Math.sin((Math.PI / 3) * j + Math.PI / 6) * r}`).join(' ') + 'Z'} {...S} />;
const crystal = (x: number, y: number, h = 18, w = 6) => <path d={`M${x - w} ${y} L${x - w * 0.4} ${y - h * 0.8} L${x} ${y - h} L${x + w * 0.5} ${y - h * 0.75} L${x + w} ${y} Z`} {...F} />;
const flakeIcon = (x: number, y: number, r = 9) => (
  <g transform={`translate(${x} ${y})`} {...S} strokeWidth={2.4}>
    {[0, 60, 120].map((a) => <line key={a} x1={-r} y1={0} x2={r} y2={0} transform={`rotate(${a})`} />)}
  </g>
);
const drop = (x: number, y: number, s = 1) => <path transform={`translate(${x} ${y}) scale(${s})`} d="M0 -7 C3 -2 5 1 5 3 A5 5 0 0 1 -5 3 C-5 1 -3 -2 0 -7 Z" {...F} />;
const rivet = (x: number, y: number) => (
  <g>
    <circle cx={x} cy={y} r="4.5" fill={L} />
    <line x1={x} y1={y} x2={x + 9} y2={y} stroke={L} strokeWidth="2.5" />
  </g>
);
const fangs = (x: number, y: number, rot = 0) => (
  <path transform={`translate(${x} ${y}) rotate(${rot})`} d="M-12 -4 L-8 4 L-4 -4 L0 4 L4 -4 L8 4 L12 -4" {...S} />
);

const ICONS: Record<string, () => ReactNode> = {
  // --- Attaques de base ---
  basic_forgefire: () => <>{hammer(24, 22, -40, 1.1)}{flame(30, 42, 10, 5)}</>,
  basic_tracker: () => <>{arrow(10, 38, 38, 10)}{leaf(16, 18, -30, 0.8)}</>,
  basic_runist: () => glyph('trait', 24, 24, 15),
  // --- Forgefeu ---
  fg_workshop: () => <>{anvil(22, 30, 1.1)}{[0, 1, 2, 3].map((j) => <line key={j} x1={30 + j * 3} y1={18 - j * 2} x2={36 + j * 3} y2={10 - j * 3} {...S} strokeWidth={2} />)}</>,
  fg_quench: () => <>{hammer(18, 20, -30)}<path d="M28 40 C34 34 26 30 32 24 C38 18 30 14 36 8" {...S} /></>,
  fg_furnace: () => <>{flame(14, 40, 20, 6)}{flame(24, 40, 28, 7)}{flame(34, 40, 20, 6)}</>,
  fg_guard: () => <>{hex(24, 24, 15)}{hex(24, 24, 7)}</>,
  fg_crosscut: () => <path d="M10 38 Q14 12 40 10 Q22 18 10 38 Z" {...F} />,
  fg_cooling: () => <>{drop(24, 26, 2)}<path d="M8 38 C16 30 32 46 40 36" {...S} /></>,
  fg_punch: () => <><rect x="8" y="18" width="20" height="12" rx="3" fill={L} /><rect x="28" y="14" width="8" height="20" rx="2" fill={L} />{anvil(36, 40, 0.5)}</>,
  fg_return: () => <>{hammer(24, 24, 20, 0.9)}<path d="M8 30 A16 16 0 0 1 36 10" {...S} /><path d="M36 10 L30 8 M36 10 L35 16" {...S} /></>,
  fg_bellows: () => <><path d="M6 18 C16 10 26 26 36 16 M6 28 C16 20 26 36 36 26 M6 38 C16 30 26 46 36 36" {...S} strokeWidth={2.6} />{flame(40, 30, 14, 5)}</>,
  fg_rivet: () => <>{rivet(10, 14)}{rivet(10, 24)}{rivet(10, 34)}<rect x="26" y="8" width="12" height="32" rx="3" {...S} /></>,
  fg_scour: () => <><circle cx="24" cy="24" r="12" {...S} />{Array.from({ length: 8 }, (_, j) => <line key={j} x1={24} y1={9} x2={24} y2={5} {...S} strokeWidth={2.5} transform={`rotate(${j * 45} 24 24)`} />)}<circle cx="24" cy="24" r="3" fill={L} /></>,
  fg_counterweight: () => <>{anvil(24, 36, 1.2)}<path d="M18 6 V16 M24 4 V14 M30 6 V16" {...S} strokeWidth={2.4} /></>,
  fg_slag: () => <><path d="M8 36 Q20 4 40 28" {...S} strokeDasharray="2 5" />{drop(14, 22, 1)}{drop(28, 12, 1.2)}{drop(40, 30, 1.3)}</>,
  fg_second_strike: () => <>{hammer(18, 22, -50, 0.85)}<g opacity=".55">{hammer(30, 22, -10, 0.85)}</g></>,
  fg_red_reprise: () => <><path d="M6 34 A20 14 0 0 1 42 34" {...S} strokeWidth={6} /><path d="M6 34 A20 14 0 0 1 42 34" stroke="#7A2210" strokeWidth={2} fill="none" /></>,
  fg_ring_anvil: () => <>{anvil(16, 34, 0.9)}<path d="M30 16 A10 10 0 0 1 30 32 M35 11 A16 16 0 0 1 35 37 M40 6 A22 22 0 0 1 40 42" {...S} strokeWidth={2.5} /></>,
  fg_wedges: () => <><path d="M8 40 L14 18 L20 40 Z M18 40 L24 10 L30 40 Z M28 40 L34 18 L40 40 Z" {...F} /></>,
  fg_sealing: () => <><ellipse cx="24" cy="16" rx="16" ry="5" {...S} /><ellipse cx="24" cy="26" rx="16" ry="5" {...S} /><ellipse cx="24" cy="36" rx="16" ry="5" {...S} /></>,
  fg_lay_rivets: () => <>{Array.from({ length: 7 }, (_, j) => { const a = -Math.PI * 0.9 + (j / 6) * Math.PI * 1.8; return <circle key={j} cx={24 + Math.cos(a) * 14} cy={26 + Math.sin(a) * 14} r="3.5" fill={L} />; })}<circle cx="24" cy="26" r="5" fill={L} opacity=".6" /></>,
  fg_shared_anneal: () => <><path d="M24 40 C10 30 10 18 18 14 C22 12 24 16 24 18 C24 16 26 12 30 14 C38 18 38 30 24 40 Z" {...F} />{flame(24, 30, 10, 4)}</>,
  fg_masterplate: () => <path d="M14 8 H34 L36 30 L24 42 L12 30 Z M24 12 V36" {...S} strokeWidth={3.2} />,
  fg_great_temper: () => <><circle cx="24" cy="18" r="8" fill={L} />{Array.from({ length: 8 }, (_, j) => <line key={j} x1={24} y1={6} x2={24} y2={2} {...S} strokeWidth={2.4} transform={`rotate(${j * 45} 24 18)`} />)}{flame(14, 44, 12, 5)}{flame(24, 44, 16, 6)}{flame(34, 44, 12, 5)}</>,
  // --- Traqueur ---
  tr_read: () => <>{[0, 1, 2].map((j) => <g key={j} transform={`translate(${10 + j * 12} ${36 - j * 10})`}><ellipse rx="4" ry="2.6" fill={L} /><circle cx="5" cy="-2" r="1.3" fill={L} /><circle cx="5" cy="1" r="1.3" fill={L} /></g>)}</>,
  tr_pursuit: () => <><path d="M6 36 C14 20 20 40 28 22 C32 14 36 12 40 10" {...S} /><path d="M40 10 L33 10 M40 10 L38 17" {...S} /></>,
  tr_snare: () => <><ellipse cx="24" cy="34" rx="14" ry="5" {...S} /><path d="M24 29 C24 18 32 12 40 8" {...S} /></>,
  tr_whistle: () => <>{wolf(22, 30, 1.2)}<path d="M34 10 V18 M34 10 L39 12" {...S} strokeWidth={2.4} /><circle cx="33" cy="19" r="2.2" fill={L} /></>,
  tr_broadside: () => <>{arrow(8, 38, 38, 12, 2.6)}{arrow(8, 38, 40, 26, 2.6)}{arrow(8, 38, 34, 42, 2.6)}</>,
  tr_retreat: () => <>{leaf(28, 20, -20, 1.2)}{leaf(32, 32, 30, 1)}<path d="M20 26 H6 M6 26 L12 20 M6 26 L12 32" {...S} /></>,
  tr_barbed: () => <>{arrow(8, 40, 36, 12)}<path d="M18 30 L14 24 M24 24 L20 18" {...S} strokeWidth={2.4} />{drop(38, 30, 1)}</>,
  tr_resin: () => <><path d="M14 14 H30 L32 32 Q22 40 12 32 Z" {...F} /><path d="M18 34 V42 M26 34 V40" {...S} /></>,
  tr_packbeat: () => <>{wolf(16, 22, 0.9)}{wolf(32, 36, 0.9)}<path d="M36 8 l2 4 4 -8" {...S} strokeWidth={2.2} /></>,
  tr_stare: () => <>{glyph('eye', 24, 22, 15)}{bolt(36, 34, 0.6)}</>,
  tr_net: () => <><path d="M8 8 L40 8 L36 40 L12 40 Z" {...S} strokeWidth={2} /><path d="M16 8 L18 40 M24 8 V40 M32 8 L30 40 M10 18 H38 M11 28 H37" {...S} strokeWidth={1.8} />{bolt(36, 14, 0.5)}</>,
  tr_cover: () => <>{[0, 1, 2, 3, 4].map((j) => <g key={j}>{leaf(24 + Math.cos((j / 5) * Math.PI * 2) * 13, 24 + Math.sin((j / 5) * Math.PI * 2) * 13, j * 72 + 90, 0.9)}</g>)}<path d="M20 24 h8 M24 20 v8" {...S} /></>,
  tr_seam: () => <><circle cx="24" cy="24" r="11" {...S} strokeWidth={2.2} /><line x1="4" y1="34" x2="44" y2="14" {...S} strokeWidth={2} />{[-1, 0, 1].map((j) => <line key={j} x1={22 + j * 8} y1={20 - j * 4} x2={26 + j * 8} y2={28 - j * 4} {...S} strokeWidth={2} />)}</>,
  tr_crossbite: () => <><g transform="rotate(35 24 24)">{fangs(24, 18)}{fangs(24, 30, 180)}</g><path d="M12 12 L36 36 M36 12 L12 36" stroke={L} strokeWidth={2} opacity=".6" /></>,
  tr_sidestep: () => <>{arrow(8, 30, 24, 24, 2.6)}{arrow(24, 24, 40, 12, 2.6)}{arrow(24, 24, 40, 34, 2.6)}<g opacity=".5">{leaf(10, 16, 0, 0.8)}</g></>,
  tr_iron_teeth: () => <><path d="M6 32 L42 32" {...S} /><path d="M8 32 L12 22 L16 32 L20 22 L24 32 L28 22 L32 32 L36 22 L40 32" {...S} strokeWidth={2.4} /><circle cx="24" cy="36" r="3" fill={L} /></>,
  tr_harass: () => <>{[10, 20, 30, 38].map((x, j) => <g key={j}>{arrow(x - 4, 6 + (j % 2) * 4, x, 22 + (j % 2) * 8, 2.2)}</g>)}<path d="M8 42 H40" {...S} strokeWidth={2} /></>,
  tr_leftbehind: () => <>{wolf(18, 34, 1.1)}<path d="M28 14 A8 8 0 0 1 28 26 M32 10 A13 13 0 0 1 32 30" {...S} strokeWidth={2.4} />{bolt(40, 30, 0.45)}</>,
  tr_packguard: () => <>{wolf(18, 30, 1)}<path d="M32 10 H42 V24 Q37 32 32 24 Z" {...S} strokeWidth={2.4} /></>,
  tr_share: () => <>{wolf(18, 30, 1)}<circle cx="36" cy="14" r="6" fill={L} /><path d="M30 20 Q26 26 22 24" {...S} strokeWidth={2} strokeDasharray="2 3" /></>,
  tr_packreturn: () => <>{wolf(16, 18, 0.8)}{wolf(26, 30, 0.8)}{wolf(16, 42, 0.8)}{bolt(40, 22, 0.55)}</>,
  tr_grand_hunt: () => <><path d="M8 18 Q16 8 26 12 L30 22 Q18 20 8 18 Z" {...F} />{arrow(20, 40, 30, 30, 2.4)}{arrow(28, 44, 38, 34, 2.4)}{arrow(34, 34, 44, 24, 2.4)}</>,
  // --- Runiste ---
  rn_ember: () => <>{glyph('trait', 20, 22, 12)}{flame(36, 40, 16, 6)}</>,
  rn_frost_circle: () => <><ellipse cx="24" cy="34" rx="16" ry="6" {...S} />{crystal(18, 34, 16, 4)}{crystal(26, 34, 22, 5)}{crystal(34, 34, 14, 4)}</>,
  rn_guard: () => <><path d="M8 38 A16 20 0 0 1 40 38 Z" {...S} />{glyph('seal', 24, 28, 7, 2.4)}</>,
  rn_lightning: () => bolt(24, 24, 1.5),
  rn_ash_ring: () => <><ellipse cx="24" cy="32" rx="18" ry="7" {...S} strokeWidth={3.4} />{flame(12, 30, 10, 4)}{flame(36, 30, 10, 4)}{[16, 26, 32].map((x, j) => <circle key={j} cx={x} cy={10 + j * 4} r="2" fill={L} opacity=".7" />)}</>,
  rn_respite: () => <>{glyph('seal', 24, 20, 11, 2.6)}{flakeIcon(24, 38, 6)}</>,
  rn_frost_line: () => <><path d="M4 38 H44" {...S} />{crystal(12, 38, 10, 3)}{crystal(22, 38, 16, 4)}{crystal(32, 38, 22, 5)}{crystal(41, 38, 14, 4)}</>,
  rn_reveal: () => <>{glyph('eye', 24, 18, 14)}<path d="M16 34 H32 M18 40 H30" {...S} strokeWidth={2.2} /></>,
  rn_hearth: () => <>{glyph('hearth', 24, 24, 15)}</>,
  rn_divide: () => <><line x1="4" y1="24" x2="44" y2="20" {...S} strokeWidth={3.4} /><path d="M14 12 L14 18 M30 30 L30 36" {...S} strokeWidth={2} />{flakeIcon(38, 36, 5)}</>,
  rn_silence: () => <><ellipse cx="24" cy="22" rx="17" ry="6" {...S} />{glyph('silence', 24, 34, 9, 2.4)}<path d="M18 22 L30 22" {...S} strokeWidth={2} opacity=".6" /></>,
  rn_continuity: () => <path d="M6 24 C6 12 18 12 24 24 C30 36 42 36 42 24 C42 12 30 12 24 24 C18 36 6 36 6 24 Z" {...S} />,
  rn_ardent_erasure: () => <><path d="M10 12 L38 36 M38 12 L10 36" {...S} strokeWidth={4} />{flame(24, 46, 10, 4)}</>,
  rn_shards: () => <>{[[12, 30], [22, 22], [32, 14], [36, 30]].map(([x, y], j) => <path key={j} d={`M${x} ${y! - 7} L${x! + 3} ${y} L${x} ${y! + 7} L${x! - 3} ${y} Z`} fill={L} transform={`rotate(60 ${x} ${y})`} />)}</>,
  rn_burst_circle: () => <><ellipse cx="24" cy="38" rx="16" ry="5" {...S} />{bolt(16, 22, 0.7)}{bolt(32, 20, 0.8)}</>,
  rn_stop: () => <><rect x="10" y="10" width="28" height="28" rx="3" fill={L} opacity=".25" stroke={L} strokeWidth="2" />{glyph('stop', 24, 24, 12, 2.6)}</>,
  rn_bind: () => <><ellipse cx="24" cy="38" rx="16" ry="5" {...S} />{glyph('chain', 24, 20, 14, 2.8)}</>,
  rn_interdict: () => glyph('interdict', 24, 24, 16, 3.4),
  rn_resonant_guard: () => <>{glyph('resonance', 24, 24, 16)}<circle cx="24" cy="24" r="20" {...S} strokeWidth={1.6} opacity=".6" /></>,
  rn_refuge: () => <>{glyph('refuge', 24, 22, 14)}<ellipse cx="24" cy="40" rx="14" ry="4" {...S} strokeWidth={2} /></>,
  rn_relay: () => <>{glyph('relay', 24, 22, 15)}<path d="M8 38 A16 8 0 0 0 40 38" {...S} strokeWidth={2.2} /></>,
  rn_sovereign: () => <><path d="M10 34 L12 16 L18 24 L24 12 L30 24 L36 16 L38 34 Z" {...F} />{[14, 24, 34].map((x) => <circle key={x} cx={x} cy={42} r="2.5" fill={L} />)}</>,
};

export interface SpellIconProps {
  /** Identifiant du sort, ou `basic_<classe>` pour l'attaque de base. */
  id: string;
  classId: string;
  element?: string;
  ultimate?: boolean;
  size?: number;
  dim?: boolean;
  title?: string;
}

export function SpellIcon({ id, classId, element, ultimate, size = 44, dim, title }: SpellIconProps) {
  const [light, dark] = (element && ELEMENT_BG[element]) ?? CLASS_BG[classId] ?? CLASS_BG.runist!;
  const gid = `si-${id}`;
  return (
    <svg className={`spell-icon${dim ? ' dim' : ''}`} width={size} height={size} viewBox="0 0 48 48" role="img" aria-label={title ?? id}>
      {title && <title>{title}</title>}
      <defs>
        <radialGradient id={gid} cx="35%" cy="30%" r="85%">
          <stop offset="0" stopColor={light} />
          <stop offset="1" stopColor={dark} />
        </radialGradient>
      </defs>
      <rect x="1" y="1" width="46" height="46" rx="10" fill={`url(#${gid})`} stroke={ultimate ? '#F5D27A' : 'rgb(0 0 0 / .45)'} strokeWidth={ultimate ? 3 : 1.5} />
      <rect x="4" y="4" width="40" height="18" rx="7" fill="#FFFFFF" opacity=".12" />
      <g style={{ filter: 'drop-shadow(0 1.5px 1px rgb(0 0 0 / .45))' }}>{(ICONS[id] ?? (() => glyph('trait')))()}</g>
      {ultimate && <rect x="4.5" y="4.5" width="39" height="39" rx="8" fill="none" stroke="#F5D27A" strokeWidth="1" opacity=".6" />}
    </svg>
  );
}

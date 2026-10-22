import { useId, type CSSProperties, type ReactNode } from 'react';

/**
 * Icônes d'équipement dessinées : un dessin par emplacement et par famille (plaques, cuir, piste, tissu, bijoux, et une
 * par sorte d'arme), teinté par la matière de son palier (bronze → astralite, cuir bouilli → cuir astral…) et orné selon la
 * rareté : Commun nu, Rare un liseré d'argent, Épique un liseré d'or et une gemme, Légendaire en plus un halo et des
 * éclats. Repère 64 × 64, lumière en haut à gauche, contour sombre. Demande de Louis du 22 octobre.
 */

export type GearRarity = 'common' | 'rare' | 'epic' | 'legendary';
type Kind = 'metal' | 'leather' | 'cloth' | 'wood';
type Tone = [string, string, string];

/** Matière par palier : teinte principale, ombre, reflet. */
const MATERIALS: Record<Kind, Record<number, Tone>> = {
  metal: {
    1: ['#B47A45', '#6E4524', '#E8B98A'], // bronze
    10: ['#8D949A', '#4F555B', '#C9D0D5'], // fer
    20: ['#A9B5BE', '#5D6870', '#E6EEF3'], // acier
    30: ['#7D8C9C', '#3F4A57', '#C2CFDB'], // acier trempé
    40: ['#B9D6E6', '#5F8396', '#F1FAFF'], // mithril
    50: ['#9DBFD6', '#4D6E86', '#E2F1FA'], // mithril renforcé
    60: ['#D9A24A', '#8A5A1C', '#FFE0A0'], // orichalque
    70: ['#4F7FC4', '#253F6E', '#A9C8F2'], // azurite
    80: ['#4C505E', '#22242C', '#9096A8'], // sombracier
    90: ['#D9E4FF', '#7C8BC2', '#FFFFFF'], // astralite
  },
  leather: {
    1: ['#8A5A36', '#4E3019', '#BE8A5E'],
    10: ['#7A4E2E', '#432815', '#B07A50'],
    20: ['#6B4A34', '#3A2618', '#A07A5C'],
    30: ['#6E5A3A', '#3C301C', '#A69066'],
    40: ['#5E4A3E', '#30241C', '#9C8676'],
    50: ['#7D5B3A', '#45301C', '#B8936A'],
    60: ['#5A3F2E', '#2E1F16', '#94705A'],
    70: ['#4E5A64', '#262E35', '#8E9CA8'],
    80: ['#3A3440', '#1C1820', '#6E6478'],
    90: ['#6E7AA8', '#363E62', '#B8C2EC'],
  },
  cloth: {
    1: ['#7C8A6A', '#454E39', '#AEBC9A'],
    10: ['#6A7E8C', '#37444E', '#A2B4C2'],
    20: ['#7A5E86', '#41304A', '#B092BC'],
    30: ['#6E6A4A', '#3B3826', '#A6A27A'],
    40: ['#4E6E8C', '#283A4C', '#8EAECB'],
    50: ['#8C5A4A', '#4C2E24', '#C48E7C'],
    60: ['#5A4E8C', '#2E284C', '#968CCB'],
    70: ['#3E7A84', '#1E4046', '#7CBAC2'],
    80: ['#3A3448', '#1C1824', '#6E6488'],
    90: ['#C9D2F2', '#6A76A8', '#FFFFFF'],
  },
  wood: {
    1: ['#8A6240', '#4E3421', '#BE9470'],
    10: ['#7A5232', '#42291A', '#B08260'],
    20: ['#9A7650', '#56402A', '#CEAA82'],
    30: ['#6A3E2A', '#381F14', '#A06E58'],
    40: ['#8C8CA0', '#4A4A5C', '#C6C6D8'],
    50: ['#7A6A4A', '#423826', '#B2A07A'],
    60: ['#9A5A3A', '#52301E', '#D08E6C'],
    70: ['#3A2E2A', '#1C1614', '#6E5E58'],
    80: ['#3E3A4A', '#1E1C24', '#726C84'],
    90: ['#E2C9A0', '#9A7E58', '#FFF2D8'],
  },
};

const TRIM: Record<GearRarity, string | null> = { common: null, rare: '#CFE2F2', epic: '#E8C26A', legendary: '#FFD36A' };
const GEM: Record<GearRarity, string | null> = { common: null, rare: null, epic: '#B78CFF', legendary: '#FF7A59' };
const GLOW: Record<GearRarity, string> = { common: 'transparent', rare: '#6FA8FF', epic: '#B78CFF', legendary: '#F0B24B' };
const DARK = '#0b0907';

const tone = (kind: Kind, tier: number): Tone => {
  const keys = Object.keys(MATERIALS[kind]).map(Number).sort((a, b) => a - b);
  const k = [...keys].reverse().find((x) => x <= tier) ?? keys[0]!;
  return MATERIALS[kind][k]!;
};

interface Paint {
  m: string;
  d: string;
  l: string;
  /** Second matériau : manche de bois, ferrures, tissu sous l'armure. */
  s: Tone;
  trim: string | null;
  gem: string | null;
  u: string;
}

interface Design {
  main: Kind;
  second: Kind;
  draw: (p: Paint) => ReactNode;
}

const sheen = (p: Paint, d: string) => <path d={d} fill={`url(#${p.u}s)`} stroke="none" />;
/** Une forme pleine avec son reflet commun. */
const body = (p: Paint, d: string, fill = p.m) => (
  <>
    <path d={d} fill={fill} />
    {sheen(p, d)}
  </>
);
const gem = (p: Paint, x: number, y: number, r = 3.4) =>
  p.gem && (
    <g>
      <path d={`M${x} ${y - r} L${x + r} ${y} L${x} ${y + r} L${x - r} ${y} Z`} fill={p.gem} />
      <path d={`M${x} ${y - r} L${x + r * 0.5} ${y - r * 0.2} L${x - r * 0.4} ${y - r * 0.1} Z`} fill="#fff" fillOpacity=".7" stroke="none" />
    </g>
  );
const shine = (p: Paint, d: string, w = 2) => <path d={d} fill="none" stroke={p.l} strokeWidth={w} strokeOpacity=".85" />;
const edge = (p: Paint, d: string, w = 2.2) => p.trim && <path d={d} fill="none" stroke={p.trim} strokeWidth={w} />;

// --- Les dessins ---------------------------------------------------------------------------------------------------------

const HAND = 'M18 56 V36 L14 24 C13 19 19 18 21 22 L24 30 V15 C24 11 30 11 30 15 V28 L31 12 C31 8 37 8 37 12 V28 L39 16 C39 12 45 12 45 16 L43 34 L47 31 C51 29 54 33 51 37 L42 48 V56 Z';
const LEGS = 'M17 8 H47 V20 L45 56 H35 L33 26 H31 L29 56 H19 L17 20 Z';
const CAPE = 'M20 8 H44 L50 52 C44 49 38 56 32 52 C26 56 20 49 14 52 Z';

const DESIGNS: Record<string, Design> = {
  // Têtes
  'head:armor': {
    main: 'metal',
    second: 'leather',
    draw: (p) => (
      <>
        {body(p, 'M14 38 C14 20 22 10 32 10 C42 10 50 20 50 38 L50 50 L40 54 L40 42 L24 42 L24 54 L14 50 Z')}
        <path d="M18 30 H46 M30 30 V42 M34 30 V42" stroke={p.d} strokeWidth="2.6" />
        <path d="M22 34 H28 M36 34 H42" stroke={DARK} strokeWidth="3" />
        <path d="M32 10 V26" stroke={p.trim ?? p.l} strokeWidth={p.trim ? 3 : 2} />
        {edge(p, 'M14 50 L24 54 M40 54 L50 50 M14 38 C14 20 22 10 32 10')}
        {shine(p, 'M20 22 C22 17 26 14 30 13')}
        {gem(p, 32, 30)}
      </>
    ),
  },
  'head:cuirass': {
    main: 'leather',
    second: 'metal',
    draw: (p) => (
      <>
        {body(p, 'M16 36 C16 18 24 10 32 10 C40 10 48 18 48 36 L48 48 L41 52 L40 38 H24 L23 52 L16 48 Z')}
        <path d="M32 11 V36" stroke={p.d} strokeWidth="1.8" strokeDasharray="2.5 2.5" />
        <path d="M16 33 H48 V38 H16 Z" fill={p.d} />
        {[20, 26, 38, 44].map((x) => (
          <circle key={x} cx={x} cy="35.5" r="1.6" fill={p.trim ?? p.s[0]} stroke="none" />
        ))}
        {edge(p, 'M16 36 C16 18 24 10 32 10 C40 10 48 18 48 36')}
        {shine(p, 'M21 22 C23 16 27 13 31 12')}
        {gem(p, 32, 24)}
      </>
    ),
  },
  'head:trail': {
    main: 'leather',
    second: 'cloth',
    draw: (p) => (
      <>
        {body(p, 'M14 54 C11 32 18 12 33 8 C47 10 53 26 50 42 L48 54 Z')}
        <path d="M23 52 C21 38 27 26 35 26 C42 28 44 38 42 52 Z" fill={DARK} fillOpacity=".75" />
        <path d="M33 8 C38 4 44 6 46 2" fill="none" stroke={p.d} strokeWidth="3" />
        {edge(p, 'M23 52 C21 38 27 26 35 26 C42 28 44 38 42 52', 2.6)}
        {shine(p, 'M18 40 C18 28 22 18 30 13')}
        <path d="M30 54 L33 46 L36 54" fill={p.s[0]} />
        {gem(p, 33, 48, 2.8)}
      </>
    ),
  },
  'head:robe': {
    main: 'cloth',
    second: 'leather',
    draw: (p) => (
      <>
        {body(p, 'M8 46 C8 39 56 39 56 46 C56 53 8 53 8 46 Z')}
        {body(p, 'M18 44 C22 30 28 14 42 5 C39 16 41 30 46 44 Z')}
        <path d="M18 40 C26 43 38 43 46 40 L46 45 C38 48 26 48 18 45 Z" fill={p.trim ?? p.s[0]} />
        {shine(p, 'M24 36 C26 26 31 16 38 10')}
        {gem(p, 32, 43.5, 3)}
      </>
    ),
  },
  // Torses
  'torso:armor': {
    main: 'metal',
    second: 'cloth',
    draw: (p) => (
      <>
        {body(p, 'M14 16 L24 11 L32 15 L40 11 L50 16 L53 30 L46 32 L46 50 C40 56 24 56 18 50 L18 32 L11 30 Z')}
        <path d="M18 36 C26 39 38 39 46 36 M19 44 C26 47 38 47 45 44" fill="none" stroke={p.d} strokeWidth="2.4" />
        <path d="M11 30 L18 32 M53 30 L46 32" stroke={p.d} strokeWidth="2" />
        <path d="M32 16 V52" stroke={p.l} strokeWidth="1.6" strokeOpacity=".8" />
        <path d="M24 11 L32 15 L40 11" fill="none" stroke={p.trim ?? p.d} strokeWidth="2.4" />
        {edge(p, 'M14 16 L11 30 M50 16 L53 30 M18 50 C24 56 40 56 46 50')}
        {shine(p, 'M18 20 C20 18 22 17 24 16')}
        {gem(p, 32, 26)}
      </>
    ),
  },
  'torso:cuirass': {
    main: 'leather',
    second: 'metal',
    draw: (p) => (
      <>
        {body(p, 'M16 16 L26 12 C28 16 36 16 38 12 L48 16 L52 28 L46 30 L46 52 C40 56 24 56 18 52 L18 30 L12 28 Z')}
        <path d="M12 28 L18 30 M52 28 L46 30" stroke={p.d} strokeWidth="2" />
        <path d="M32 18 V52" stroke={p.d} strokeWidth="2" strokeDasharray="2 3" />
        <path d="M20 36 H44 M20 44 H44" stroke={p.d} strokeWidth="2.4" />
        <rect x="28" y="33" width="8" height="6" rx="1" fill={p.trim ?? p.s[0]} />
        <rect x="28" y="41" width="8" height="6" rx="1" fill={p.trim ?? p.s[0]} />
        {edge(p, 'M16 16 L26 12 C28 16 36 16 38 12 L48 16', 2.4)}
        {shine(p, 'M20 20 C22 18 24 17 26 16')}
        {gem(p, 32, 25)}
      </>
    ),
  },
  'torso:trail': {
    main: 'leather',
    second: 'cloth',
    draw: (p) => (
      <>
        {body(p, 'M18 14 L26 9 L32 18 L38 9 L46 14 L49 54 H15 Z')}
        <path d="M26 9 L32 18 L38 9 L36 32 H28 Z" fill={p.s[0]} />
        <path d="M29 21 L35 24 M35 21 L29 24 M29 26 L35 29 M35 26 L29 29" stroke={p.trim ?? p.s[2]} strokeWidth="1.4" />
        <path d="M18 40 H26 V48 H18 Z M38 40 H46 V48 H38 Z" fill={p.d} />
        <path d="M32 32 V54" stroke={p.d} strokeWidth="1.8" />
        {edge(p, 'M15 54 H49 M18 14 L26 9 M38 9 L46 14', 2.4)}
        {shine(p, 'M20 18 C19 26 18 34 18 38')}
        {gem(p, 32, 35, 2.8)}
      </>
    ),
  },
  'torso:robe': {
    main: 'cloth',
    second: 'leather',
    draw: (p) => (
      <>
        {body(p, 'M24 8 C28 4 36 4 40 8 L44 16 L52 22 L48 30 L44 26 L46 56 H18 L20 26 L16 30 L12 22 L20 16 Z')}
        <path d="M26 10 C28 16 36 16 38 10" fill={DARK} fillOpacity=".55" />
        <path d="M32 18 V56" stroke={p.d} strokeWidth="2" />
        <rect x="19" y="32" width="26" height="5" fill={p.s[0]} />
        <path d="M22 56 L26 40 M42 56 L38 40" stroke={p.d} strokeWidth="1.8" />
        {edge(p, 'M18 56 H46 M20 16 L24 8 M44 16 L40 8')}
        {shine(p, 'M22 20 C21 26 21 30 21 32')}
        {gem(p, 32, 34.5, 3)}
      </>
    ),
  },
  // Mains
  'hands:armor': {
    main: 'metal',
    second: 'leather',
    draw: (p) => (
      <>
        {body(p, HAND)}
        <path d="M24 22 H30 M31 20 H37 M39 24 H44 M24 30 H43" stroke={p.d} strokeWidth="2" />
        <path d="M16 46 H44 V58 H16 Z" fill={p.d} />
        <path d="M16 46 H44" stroke={p.trim ?? p.l} strokeWidth="2.4" />
        {shine(p, 'M26 16 V26 M33 14 V24')}
        {gem(p, 30, 52, 3)}
      </>
    ),
  },
  'hands:leather': {
    main: 'leather',
    second: 'metal',
    draw: (p) => (
      <>
        {body(p, HAND)}
        <path d="M18 44 C26 47 36 47 44 44 V56 H18 Z" fill={p.d} />
        <path d="M20 50 H42" stroke={p.l} strokeWidth="1.4" strokeDasharray="2 2" />
        <path d="M27 34 C30 36 34 36 37 34" fill="none" stroke={p.d} strokeWidth="1.8" />
        {edge(p, 'M18 44 C26 47 36 47 44 44')}
        {shine(p, 'M26 16 V24 M33 13 V22')}
        {gem(p, 31, 50, 2.8)}
      </>
    ),
  },
  'hands:robe': {
    main: 'cloth',
    second: 'leather',
    draw: (p) => (
      <>
        {body(p, HAND)}
        <path d="M18 52 L42 44 M18 46 L42 38 M18 40 L40 32" stroke={p.d} strokeWidth="2.2" />
        <path d="M24 18 H30 M31 16 H37" stroke={p.d} strokeWidth="1.8" />
        {edge(p, 'M18 56 H42')}
        {shine(p, 'M26 16 V24 M33 13 V22')}
        {gem(p, 30, 50, 2.8)}
      </>
    ),
  },
  // Jambes
  'legs:armor': {
    main: 'metal',
    second: 'cloth',
    draw: (p) => (
      <>
        {body(p, LEGS)}
        <path d="M17 8 H47 V14 H17 Z" fill={p.d} />
        <path d="M19.5 33 Q24 26 29 33 Q24 39 19.5 33 Z M35 33 Q40 26 44.5 33 Q40 39 35 33 Z" fill={p.l} />
        <path d="M18 24 H29 M35 24 H46" stroke={p.d} strokeWidth="2" />
        <path d="M19 44 H29 M35 44 H45" stroke={p.d} strokeWidth="2" />
        {edge(p, 'M17 8 H47 M19 56 H29 M35 56 H45', 2.4)}
        {gem(p, 32, 11, 2.6)}
      </>
    ),
  },
  'legs:leather': {
    main: 'leather',
    second: 'metal',
    draw: (p) => (
      <>
        {body(p, LEGS)}
        <path d="M17 8 H47 V14 H17 Z" fill={p.d} />
        <rect x="29" y="8" width="6" height="6" rx="1" fill={p.trim ?? p.s[0]} />
        <path d="M24 16 V54 M40 16 V54" stroke={p.d} strokeWidth="1.6" strokeDasharray="2 2.5" />
        <path d="M19 34 H29 M35 34 H45" stroke={p.d} strokeWidth="2.2" />
        {edge(p, 'M19 56 H29 M35 56 H45', 2.4)}
        {shine(p, 'M20 18 V40')}
        {gem(p, 32, 11, 2.4)}
      </>
    ),
  },
  'legs:robe': {
    main: 'cloth',
    second: 'leather',
    draw: (p) => (
      <>
        {body(p, 'M18 8 H46 L53 56 H11 Z')}
        <path d="M18 8 H46 V14 H18 Z" fill={p.s[0]} />
        <path d="M24 16 L20 56 M32 16 V56 M40 16 L44 56" stroke={p.d} strokeWidth="1.8" />
        {edge(p, 'M11 56 H53', 2.6)}
        {shine(p, 'M21 18 L17 46')}
        {gem(p, 32, 11, 2.6)}
      </>
    ),
  },
  // Pieds
  'feet:armor': {
    main: 'metal',
    second: 'leather',
    draw: (p) => (
      <>
        {body(p, 'M10 14 H24 L26 40 L38 44 C42 46 41 54 36 54 H10 Z')}
        {body(p, 'M30 18 H44 L46 42 L58 47 C62 49 61 56 56 56 H30 Z')}
        <path d="M30 28 H45 M30 36 H46 M10 24 H25 M10 32 H25" stroke={p.d} strokeWidth="2" />
        <path d="M46 42 L58 47" stroke={p.l} strokeWidth="2" />
        {edge(p, 'M30 18 H44 M10 14 H24 M30 56 H56', 2.4)}
        {gem(p, 37, 23, 2.6)}
      </>
    ),
  },
  'feet:leather': {
    main: 'leather',
    second: 'cloth',
    draw: (p) => (
      <>
        <path d="M12 14 H26 L28 42 L38 46 C42 48 42 54 38 54 H12 Z" fill={p.m} />
        {body(p, 'M30 18 H44 L46 44 L56 48 C60 50 60 56 56 56 H30 Z')}
        <path d="M30 18 H44 V24 H30 Z" fill={p.trim ?? p.d} />
        <path d="M12 14 H26 V20 H12 Z" fill={p.trim ?? p.d} />
        <path d="M30 52 H58" stroke={p.d} strokeWidth="3" />
        <path d="M33 30 H41 M33 36 H41" stroke={p.d} strokeWidth="2" />
        {shine(p, 'M33 24 C32 30 32 38 33 44')}
        {gem(p, 37, 21, 2.8)}
      </>
    ),
  },
  'feet:robe': {
    main: 'cloth',
    second: 'leather',
    draw: (p) => (
      <>
        <path d="M4 32 C4 21 18 19 26 26 L30 32 C38 34 40 42 32 44 H4 Z" fill={p.m} />
        {body(p, 'M20 46 C20 33 36 30 44 37 L48 43 C54 45 59 41 60 34 C64 41 61 57 50 57 H20 Z')}
        <path d="M20 51 H56 M4 38 H32" stroke={p.s[0]} strokeWidth="2.6" />
        {edge(p, 'M20 46 C20 33 36 30 44 37', 2.4)}
        {shine(p, 'M25 42 C28 37 34 35 39 37')}
        {gem(p, 40, 45, 2.8)}
      </>
    ),
  },
  // Capes et ceintures (toutes familles : la matière change)
  cape: {
    main: 'cloth',
    second: 'metal',
    draw: (p) => (
      <>
        {body(p, CAPE)}
        <path d="M20 8 C24 14 40 14 44 8" fill={p.d} />
        <path d="M24 16 L20 50 M32 16 V52 M40 16 L44 50" stroke={p.d} strokeWidth="1.8" />
        <circle cx="32" cy="12" r="4" fill={p.trim ?? p.s[0]} />
        {edge(p, 'M14 52 C20 49 26 56 32 52 C38 56 44 49 50 52', 2.4)}
        {shine(p, 'M22 18 L18 44')}
        {gem(p, 32, 12, 2.4)}
      </>
    ),
  },
  belt: {
    main: 'leather',
    second: 'metal',
    draw: (p) => (
      <>
        {body(p, 'M5 26 C20 22 44 22 59 26 L59 37 C44 33 20 33 5 37 Z')}
        <path d="M8 31 C22 28 42 28 56 31" stroke={p.l} strokeWidth="1.2" strokeDasharray="2 2" />
        <path d="M25 21 H39 V40 H25 Z" fill={p.trim ?? p.s[0]} />
        <path d="M29 25 H35 V36 H29 Z" fill={p.m} />
        <path d="M32 25 V32" stroke={p.s[1]} strokeWidth="2" />
        <path d="M42 34 H54 V48 C54 51 42 51 42 48 Z" fill={p.d} />
        {gem(p, 48, 41, 2.6)}
      </>
    ),
  },
  necklace: {
    main: 'metal',
    second: 'metal',
    draw: (p) => (
      <>
        <path d="M14 10 C14 32 50 32 50 10" fill="none" stroke={DARK} strokeWidth="5" />
        <path d="M14 10 C14 32 50 32 50 10" fill="none" stroke={p.m} strokeWidth="3" strokeDasharray="3 2" />
        {body(p, 'M32 30 C40 34 42 44 32 56 C22 44 24 34 32 30 Z')}
        <path d="M32 36 C36 38 36 46 32 50 C28 46 28 38 32 36 Z" fill={p.gem ?? (p.trim ? '#7FC4E8' : p.d)} />
        {edge(p, 'M32 30 C40 34 42 44 32 56 C22 44 24 34 32 30 Z', 1.6)}
      </>
    ),
  },
  ring: {
    main: 'metal',
    second: 'metal',
    draw: (p) => (
      <>
        <ellipse cx="32" cy="38" rx="17" ry="15" fill="none" stroke={DARK} strokeWidth="9" />
        <ellipse cx="32" cy="38" rx="17" ry="15" fill="none" stroke={p.m} strokeWidth="6" />
        {shine(p, 'M17 34 C19 27 24 24 30 23', 1.8)}
        {p.trim && <ellipse cx="32" cy="38" rx="17" ry="15" fill="none" stroke={p.trim} strokeWidth="1.2" strokeDasharray="3 3" />}
        <path d="M24 22 L32 12 L40 22 L32 28 Z" fill={p.gem ?? (p.trim ? '#7FC4E8' : '#8FA3A8')} />
        <path d="M24 22 L32 12 L33 20 Z" fill="#fff" fillOpacity=".6" stroke="none" />
      </>
    ),
  },
  // Armes
  hammer: {
    main: 'metal',
    second: 'wood',
    draw: (p) => (
      <>
        <path d="M30 26 L36 26 L40 58 L34 60 Z" fill={p.s[0]} />
        {body(p, 'M12 12 L40 6 L46 26 L18 32 Z')}
        <path d="M40 6 L52 10 L56 24 L46 26 Z" fill={p.d} />
        {shine(p, 'M16 15 L38 10')}
        {edge(p, 'M12 12 L18 32 M40 6 L46 26', 2.6)}
        <path d="M32 36 L38 35 M33 42 L38.6 41" stroke={p.trim ?? p.d} strokeWidth="2.2" />
        {gem(p, 29, 19)}
      </>
    ),
  },
  sword_shield: {
    main: 'metal',
    second: 'wood',
    draw: (p) => (
      <>
        <circle cx="24" cy="36" r="18" fill={p.s[0]} />
        <circle cx="24" cy="36" r="18" fill={`url(#${p.u}s)`} stroke="none" />
        <circle cx="24" cy="36" r="18" fill="none" stroke={p.trim ?? p.m} strokeWidth="3.4" />
        <circle cx="24" cy="36" r="5" fill={p.m} />
        {body(p, 'M36 44 L54 6 L59 9 L41 47 Z', p.l)}
        <path d="M37 45 L56 7" stroke={p.d} strokeWidth="1.2" />
        <path d="M31 42 L46 50" stroke={p.trim ?? p.m} strokeWidth="4" />
        <path d="M38 47 L34 56" stroke={p.s[1]} strokeWidth="4" />
        {gem(p, 24, 36, 3)}
      </>
    ),
  },
  axe: {
    main: 'metal',
    second: 'wood',
    draw: (p) => (
      <>
        <path d="M16 58 L40 10" stroke={DARK} strokeWidth="7" />
        <path d="M16 58 L40 10" stroke={p.s[0]} strokeWidth="4.4" />
        {body(p, 'M34 10 C44 6 56 12 58 26 C50 23 44 25 40 30 L36 26 Z')}
        <path d="M58 26 C50 23 44 25 40 30" fill="none" stroke={p.l} strokeWidth="2.2" />
        {edge(p, 'M34 10 C44 6 56 12 58 26', 2.4)}
        <path d="M30 26 L36 29" stroke={p.trim ?? p.d} strokeWidth="2.4" />
        {gem(p, 44, 16, 2.8)}
      </>
    ),
  },
  longbow: {
    main: 'wood',
    second: 'leather',
    draw: (p) => (
      <>
        <path d="M44 6 C20 14 14 34 18 58" fill="none" stroke={DARK} strokeWidth="7" />
        <path d="M44 6 C20 14 14 34 18 58" fill="none" stroke={p.m} strokeWidth="4.4" />
        <path d="M42 8 C24 16 18 30 19 44" fill="none" stroke={p.l} strokeWidth="1.4" strokeOpacity=".8" />
        <path d="M44 6 L18 58" stroke="#E8E2D2" strokeWidth="1.2" />
        <path d="M17 28 L23 31 L22 38 L16 35 Z" fill={p.trim ?? p.s[0]} />
        {p.trim && <path d="M44 6 L48 4 M18 58 L16 62" stroke={p.trim} strokeWidth="3" />}
        <path d="M22 33 L50 22" stroke="#C9C2B0" strokeWidth="2" />
        <path d="M50 22 L44 21 M50 22 L46 26.5" stroke="#E8E2D2" strokeWidth="2" />
        <path d="M22 33 L18 31 M22 33 L19 36" stroke={p.trim ?? '#9A7A58'} strokeWidth="2" />
        {gem(p, 19.6, 33, 2.6)}
      </>
    ),
  },
  crossbow: {
    main: 'wood',
    second: 'metal',
    draw: (p) => (
      <>
        <path d="M30 58 L34 14" stroke={DARK} strokeWidth="8" />
        <path d="M30 58 L34 14" stroke={p.m} strokeWidth="5" />
        <path d="M10 26 C20 16 46 16 56 26" fill="none" stroke={DARK} strokeWidth="6" />
        <path d="M10 26 C20 16 46 16 56 26" fill="none" stroke={p.s[0]} strokeWidth="3.6" />
        <path d="M10 26 L33 34 L56 26" fill="none" stroke="#E8E2D2" strokeWidth="1.2" />
        <path d="M33 34 L34.5 6" stroke="#C9C2B0" strokeWidth="2" />
        <path d="M34.5 6 L31.5 11 M34.5 6 L37 11" stroke="#E8E2D2" strokeWidth="2" />
        <path d="M28 44 H34" stroke={p.trim ?? p.s[1]} strokeWidth="3" />
        {shine(p, 'M31 54 L34 24', 1.4)}
        {gem(p, 33, 21, 2.6)}
      </>
    ),
  },
  daggers: {
    main: 'metal',
    second: 'leather',
    draw: (p) => (
      <>
        {body(p, 'M10 10 L14 8 L38 40 L34 43 Z', p.l)}
        <path d="M30 44 L42 36" stroke={p.trim ?? p.m} strokeWidth="3.4" />
        <path d="M38 42 L46 52" stroke={p.s[0]} strokeWidth="4.4" />
        {body(p, 'M54 10 L50 8 L26 40 L30 43 Z', p.l)}
        <path d="M34 44 L22 36" stroke={p.trim ?? p.m} strokeWidth="3.4" />
        <path d="M26 42 L18 52" stroke={p.s[0]} strokeWidth="4.4" />
        <path d="M12 10 L36 41 M52 10 L28 41" stroke={p.d} strokeWidth="1" />
        {gem(p, 32, 37, 2.8)}
      </>
    ),
  },
  staff: {
    main: 'wood',
    second: 'metal',
    draw: (p) => (
      <>
        <path d="M16 60 L42 16" stroke={DARK} strokeWidth="7" />
        <path d="M16 60 L42 16" stroke={p.m} strokeWidth="4.4" />
        {shine(p, 'M19 54 L40 18', 1.2)}
        <path d="M38 22 C34 14 40 6 46 8 C52 10 52 18 46 22" fill="none" stroke={p.s[0]} strokeWidth="3" />
        <path d="M45 8 L49 15 L45 21 L41 15 Z" fill={p.gem ?? (p.trim ? '#9FD8FF' : '#B8E8E0')} />
        <path d="M45 8 L47 14 L43 13 Z" fill="#fff" fillOpacity=".7" stroke="none" />
        <path d="M29 37 L33 40 M24 46 L28 49" stroke={p.trim ?? p.s[0]} strokeWidth="2.6" />
      </>
    ),
  },
  scepter: {
    main: 'metal',
    second: 'wood',
    draw: (p) => (
      <>
        <path d="M18 58 L36 26" stroke={DARK} strokeWidth="6.4" />
        <path d="M18 58 L36 26" stroke={p.m} strokeWidth="4" />
        <path d="M24 46 L28 49 M29 37 L33 40" stroke={p.trim ?? p.d} strokeWidth="2.6" />
        {body(p, 'M34 28 L30 18 L38 20 L42 10 L46 20 L54 18 L50 28 Z')}
        <circle cx="42" cy="24" r="5" fill={p.gem ?? (p.trim ? '#7FC4E8' : p.l)} />
        <circle cx="40.5" cy="22.5" r="1.6" fill="#fff" fillOpacity=".7" stroke="none" />
        {edge(p, 'M30 18 L38 20 L42 10 L46 20 L54 18', 1.8)}
      </>
    ),
  },
  grimoire: {
    main: 'leather',
    second: 'metal',
    draw: (p) => (
      <>
        <path d="M16 14 L46 8 L52 50 L22 56 Z" fill="#E8DFC6" />
        {body(p, 'M12 16 L42 10 L48 52 L18 58 Z')}
        <path d="M12 16 L18 58" stroke={p.d} strokeWidth="3" />
        <path d="M12 16 L18 15 L17 21 M42 10 L36 11 L37 16 M48 52 L42 53 L43 47 M18 58 L24 57 L23 51" fill="none" stroke={p.trim ?? p.s[0]} strokeWidth="2.2" />
        <path d="M27 26 L35 24 L37 34 L29 36 Z M31 25 L33 35" fill="none" stroke={p.trim ?? p.s[2]} strokeWidth="1.8" />
        <path d="M46 30 L52 29 L52 35 L47 36" fill={p.s[0]} />
        {gem(p, 32, 42, 3)}
      </>
    ),
  },
};

/** Le dessin d'une pièce : par sorte d'arme, par emplacement et famille, ou commun à l'emplacement. */
function designFor(slot: string, family: string): Design {
  if (slot === 'weapon') return DESIGNS[family] ?? DESIGNS.hammer!;
  if (slot === 'ring' || slot === 'necklace' || slot === 'cape' || slot === 'belt') {
    const d = DESIGNS[slot]!;
    // Capes et ceintures prennent la matière de leur famille.
    if (slot === 'cape') return { ...d, main: family === 'armor' ? 'cloth' : family === 'robe' ? 'cloth' : 'leather' };
    if (slot === 'belt') return { ...d, main: family === 'robe' ? 'cloth' : 'leather' };
    return d;
  }
  const fam = family === 'armor' || family === 'robe' ? family : slot === 'hands' || slot === 'legs' || slot === 'feet' ? 'leather' : family;
  return DESIGNS[`${slot}:${fam}`] ?? DESIGNS[`${slot}:cuirass`] ?? DESIGNS['torso:cuirass']!;
}

export function GearIcon({ slot, family, tier, rarity, size = 56 }: { slot: string; family: string; tier: number; rarity: string; size?: number }) {
  const u = useId().replace(/[^a-zA-Z0-9]/g, '');
  const r = (rarity in TRIM ? rarity : 'common') as GearRarity;
  const design = designFor(slot, family);
  const [m, d, l] = tone(design.main, tier);
  const p: Paint = { m, d, l, s: tone(design.second, tier), trim: TRIM[r], gem: GEM[r], u };
  const legendary = r === 'legendary';
  return (
    <svg className={`gear-icon gi-${r}`} viewBox="0 0 64 64" width={size} height={size} style={{ '--glow': GLOW[r] } as CSSProperties} aria-hidden>
      <defs>
        <linearGradient id={`${u}s`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".35" />
          <stop offset=".45" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity=".35" />
        </linearGradient>
        <radialGradient id={`${u}g`}>
          <stop offset="0" stopColor={GLOW[r]} stopOpacity=".55" />
          <stop offset="1" stopColor={GLOW[r]} stopOpacity="0" />
        </radialGradient>
      </defs>
      {(r === 'epic' || legendary) && <circle cx="32" cy="32" r="30" fill={`url(#${u}g)`} />}
      {legendary && <Rays />}
      <g stroke="#14100c" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round">
        {design.draw(p)}
      </g>
      {legendary && <Sparkles />}
    </svg>
  );
}

function Rays() {
  return (
    <g stroke="var(--glow)" strokeWidth="1.4" strokeLinecap="round" opacity=".6">
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2 + 0.2;
        return <line key={i} x1={32 + Math.cos(a) * 25} y1={32 + Math.sin(a) * 25} x2={32 + Math.cos(a) * 30} y2={32 + Math.sin(a) * 30} />;
      })}
    </g>
  );
}

function Sparkles() {
  const star = (x: number, y: number, r: number) => `M${x} ${y - r} L${x + r * 0.25} ${y - r * 0.25} L${x + r} ${y} L${x + r * 0.25} ${y + r * 0.25} L${x} ${y + r} L${x - r * 0.25} ${y + r * 0.25} L${x - r} ${y} L${x - r * 0.25} ${y - r * 0.25} Z`;
  return (
    <g fill="#FFF3C4" className="gi-sparkles">
      <path d={star(52, 12, 4.5)} />
      <path d={star(10, 46, 3.2)} />
      <path d={star(56, 50, 2.6)} />
    </g>
  );
}

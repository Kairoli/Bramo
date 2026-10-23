import { useId, type ReactNode } from 'react';
import type { Item } from '@bramo/shared';

/**
 * Icônes des objets (matières, outils, repas, vestiges), dessinées comme celles de l'équipement (demande de Louis du
 * 23 octobre) : un dessin par catégorie, ou par sorte d'outil, coloré selon l'objet (cuivre, fer, chêne, menthe…).
 * Une catégorie encore sans dessin (métiers à venir) prend une caisse à sa couleur : rien ne reste vide.
 * Repère 64 × 64, lumière en haut à gauche, contour sombre.
 */

type Tone = [string, string, string];

/** Couleur d'un objet d'après son identifiant : matière, essence de bois, plante, poisson. */
const TINTS: [RegExp, Tone][] = [
  // Gemmes de situation : une couleur par mécanique déjouée.
  [/gem_interstice/, ['#9FE8E0', '#3E8A82', '#E6FFFA']],
  [/gem_wash/, ['#E8F2F6', '#8AA2AE', '#FFFFFF']],
  [/gem_stop/, ['#6E4A52', '#2E1E22', '#B08A92']],
  [/gem_drive/, ['#C2302A', '#6A1410', '#F28A82']],
  [/gem_fault/, ['#B78CFF', '#5A3A8A', '#E2D2FF']],
  [/gem_recovery/, ['#E8A23A', '#8A5A1C', '#FFE0A0']],
  [/copper/, ['#C77B4A', '#7A4022', '#F0B08A']],
  [/tin/, ['#B9C2C6', '#6E777C', '#EEF3F5']],
  [/bronze/, ['#B47A45', '#6E4524', '#E8B98A']],
  [/steel/, ['#A9B5BE', '#5D6870', '#E6EEF3']],
  [/iron/, ['#8D949A', '#4F555B', '#C9D0D5']],
  [/silver/, ['#D7DEE4', '#8A939B', '#FFFFFF']],
  [/mithril/, ['#B9D6E6', '#5F8396', '#F1FAFF']],
  [/gold/, ['#E8B84A', '#8A6418', '#FFE7A0']],
  [/orichalcum/, ['#D9A24A', '#8A5A1C', '#FFE0A0']],
  [/azurite/, ['#4F7FC4', '#253F6E', '#A9C8F2']],
  [/umbral/, ['#4C505E', '#22242C', '#9096A8']],
  [/astralite/, ['#D9E4FF', '#7C8BC2', '#FFFFFF']],
  [/coal/, ['#3A3A40', '#141418', '#6E6E78']],
  [/pine/, ['#C9A06A', '#7A5A30', '#F0D2A0']],
  [/oak/, ['#9A6A3E', '#553A1E', '#C99A6A']],
  [/ash|stave|shaft/, ['#D2B48A', '#86684A', '#F2DCBA']],
  [/yew/, ['#8A4A32', '#4A2418', '#C07A60']],
  [/moonwood/, ['#A8A8C8', '#5E5E80', '#E2E2F6']],
  [/bark/, ['#7A5A3E', '#3E2C1C', '#A8845E']],
  [/mint/, ['#6FC48A', '#2E6E44', '#B6EAC4']],
  [/thyme/, ['#8FAE6A', '#4A6232', '#C8DCA6']],
  [/nettle/, ['#5E9A4E', '#2C5022', '#A2CC90']],
  [/sage/, ['#9A7AB8', '#54406C', '#CDB6E2']],
  [/lantern_lily|lantern/, ['#F2C14E', '#8A6418', '#FFF0B0']],
  [/frost/, ['#9FD8FF', '#3E7AA8', '#E6F6FF']],
  [/trout/, ['#B8A27A', '#6A5A3E', '#E2D2AA']],
  [/pike/, ['#7E9A6A', '#3E5232', '#B4CAA2']],
  [/abyss/, ['#4E5E9A', '#22284E', '#9CA8DA']],
  [/fish/, ['#9AB2C2', '#4E6474', '#D2E2EC']],
  [/amethyst/, ['#A87AE0', '#5A3A8A', '#DCC2FF']],
  [/rune_stone/, ['#7E8890', '#3E464C', '#B9C2C8']],
  [/small_hide|small_leather|strap/, ['#B88A5E', '#6E4E30', '#E2BC92']],
  [/boar|tough/, ['#6E5440', '#3A2A1E', '#A08470']],
  [/deer|thick/, ['#A06A3E', '#5A3A1E', '#D29A6A']],
  [/wolf/, ['#8A8A90', '#4A4A50', '#C2C2C8']],
  [/bear|heavy/, ['#5A3E2A', '#2E1E14', '#8E6E58']],
  [/elk/, ['#E2DAC8', '#9A927E', '#FFFFFF']],
  [/sand/, ['#E2C98E', '#9A8250', '#F8E8BE']],
  [/stone/, ['#8E8A84', '#4E4A46', '#C2BEB6']],
];
const tintOf = (id: string, fallback: Tone): Tone => TINTS.find(([re]) => re.test(id))?.[1] ?? fallback;

/** Couleur des catégories sans teinte propre (et de la caisse des catégories à venir). */
const CATEGORY_TONE: Record<string, Tone> = {
  meal: ['#D98A4A', '#7A4422', '#F6C08E'],
  vestige: ['#B9A27A', '#6A5A3E', '#E6D6B0'],
  dust: ['#9C8FD8', '#4A4078', '#E4DCFF'],
  hardware: ['#8D949A', '#4F555B', '#C9D0D5'],
  plank: ['#C9A06A', '#7A5A30', '#F0D2A0'],
};
const DEFAULT: Tone = ['#9A8A72', '#54483A', '#CEBEA2'];

interface P {
  m: string;
  d: string;
  l: string;
  u: string;
}

const sheen = (p: P, d: string) => <path d={d} fill={`url(#${p.u}s)`} stroke="none" />;
const body = (p: P, d: string, fill = p.m) => (
  <>
    <path d={d} fill={fill} />
    {sheen(p, d)}
  </>
);
const shine = (p: P, d: string, w = 2) => <path d={d} fill="none" stroke={p.l} strokeWidth={w} strokeOpacity=".85" />;

/** Outils : la lame ou la tête en métal, le manche en bois. */
const WOOD = '#8A6240';
const TOOLS: Record<string, (p: P) => ReactNode> = {
  pickaxe: (p) => (
    <>
      <path d="M34 22 L20 58" stroke="#14100c" strokeWidth="7" />
      <path d="M34 22 L20 58" stroke={WOOD} strokeWidth="4.4" />
      {body(p, 'M8 22 C18 10 46 8 58 20 L54 24 C44 16 22 16 12 26 Z')}
      {shine(p, 'M14 20 C24 13 40 12 50 16')}
    </>
  ),
  axe: (p) => (
    <>
      <path d="M18 58 L40 10" stroke="#14100c" strokeWidth="7" />
      <path d="M18 58 L40 10" stroke={WOOD} strokeWidth="4.4" />
      {body(p, 'M34 12 C44 8 56 14 58 28 C50 25 44 27 40 32 L36 28 Z')}
      {shine(p, 'M58 28 C50 25 44 27 40 32', 2.2)}
    </>
  ),
  sickle: (p) => (
    <>
      <path d="M22 58 L28 40" stroke="#14100c" strokeWidth="7" />
      <path d="M22 58 L28 40" stroke={WOOD} strokeWidth="4.4" />
      {body(p, 'M28 40 C14 30 18 8 40 8 C54 9 58 22 52 30 C50 18 40 14 32 18 C24 24 28 34 32 38 Z')}
      {shine(p, 'M24 22 C26 14 34 11 42 11')}
    </>
  ),
  rod: (p) => (
    <>
      <path d="M12 58 L50 8" stroke="#14100c" strokeWidth="6" />
      <path d="M12 58 L50 8" stroke={WOOD} strokeWidth="3.6" />
      <path d="M50 8 C56 20 54 36 46 44" fill="none" stroke="#E8E2D2" strokeWidth="1.2" />
      <circle cx="22" cy="45" r="5" fill={p.m} />
      <path d="M44 42 L48 48 L44 47" fill="none" stroke={p.l} strokeWidth="2" />
    </>
  ),
  hammer: (p) => (
    <>
      <path d="M30 26 L36 26 L40 58 L34 60 Z" fill={WOOD} />
      {body(p, 'M12 12 L40 6 L46 26 L18 32 Z')}
      <path d="M40 6 L52 10 L56 24 L46 26 Z" fill={p.d} />
      {shine(p, 'M16 15 L38 10')}
    </>
  ),
  saw: (p) => (
    <>
      {body(p, 'M10 40 L44 14 L50 22 L18 48 Z')}
      <path d="M18 48 L16 44 L20 45 L18 41 L23 42 L21 38 L26 39 L24 35 L29 36 L27 32 L32 33 L30 29 L35 30 L33 26 L38 27 L36 23 L41 24 L39 20 L44 21" fill="none" stroke={p.d} strokeWidth="1.4" />
      <path d="M44 14 L56 6 L60 14 L50 22 Z" fill={WOOD} />
      <path d="M52 10 L56 14" stroke="#14100c" strokeWidth="2" />
    </>
  ),
  spear: (p) => (
    <>
      <path d="M14 58 L46 14" stroke="#14100c" strokeWidth="6" />
      <path d="M14 58 L46 14" stroke={WOOD} strokeWidth="3.6" />
      {body(p, 'M42 18 L54 6 L50 22 Z')}
      <path d="M40 22 L46 26" stroke={p.d} strokeWidth="3" />
    </>
  ),
  hoe: (p) => (
    <>
      <path d="M20 58 L44 12" stroke="#14100c" strokeWidth="7" />
      <path d="M20 58 L44 12" stroke={WOOD} strokeWidth="4.4" />
      {body(p, 'M40 12 L56 16 L54 28 L44 22 Z')}
    </>
  ),
  scraper: (p) => (
    <>
      {body(p, 'M10 30 C20 22 44 22 54 30 L50 38 C40 32 24 32 14 38 Z')}
      <path d="M8 28 L14 38 M56 28 L50 38" stroke={WOOD} strokeWidth="6" />
      {shine(p, 'M16 28 C26 25 38 25 48 28')}
    </>
  ),
  shears: (p) => (
    <>
      {body(p, 'M30 30 L54 8 L56 12 L34 34 Z')}
      {body(p, 'M34 30 L10 8 L8 12 L30 34 Z')}
      <circle cx="22" cy="46" r="8" fill="none" stroke={WOOD} strokeWidth="4" />
      <circle cx="42" cy="46" r="8" fill="none" stroke={WOOD} strokeWidth="4" />
      <circle cx="32" cy="32" r="2.4" fill="#14100c" />
    </>
  ),
  pestle: (p) => (
    <>
      {body(p, 'M10 34 H54 C54 48 44 56 32 56 C20 56 10 48 10 34 Z', '#9A948A')}
      <ellipse cx="32" cy="34" rx="22" ry="5" fill="#6E6A62" />
      <path d="M36 32 L52 8" stroke="#14100c" strokeWidth="8" strokeLinecap="round" />
      <path d="M36 32 L52 8" stroke={p.m} strokeWidth="5" strokeLinecap="round" />
    </>
  ),
  graver: (p) => (
    <>
      <path d="M12 52 L34 30" stroke="#14100c" strokeWidth="9" strokeLinecap="round" />
      <path d="M12 52 L34 30" stroke={WOOD} strokeWidth="6" strokeLinecap="round" />
      {body(p, 'M32 28 L36 32 L56 12 L52 8 Z')}
    </>
  ),
  stylus: (p) => (
    <>
      {body(p, 'M14 54 L46 14 L52 12 L50 18 L18 58 Z')}
      <path d="M14 54 L18 58" stroke="#9FE8FF" strokeWidth="3" />
      <path d="M22 46 L28 52" stroke={WOOD} strokeWidth="4" />
    </>
  ),
  wrench: (p) => (
    <>
      <path d="M16 54 L40 26" stroke="#14100c" strokeWidth="9" strokeLinecap="round" />
      <path d="M16 54 L40 26" stroke={p.m} strokeWidth="6" strokeLinecap="round" />
      {body(p, 'M36 22 C34 12 42 6 50 8 L44 16 L48 22 L56 16 C58 24 50 32 42 30 Z')}
    </>
  ),
  trowel: (p) => (
    <>
      {body(p, 'M16 22 L46 14 L50 36 L22 46 Z')}
      <path d="M48 26 L54 30 L56 46" fill="none" stroke={p.d} strokeWidth="3" />
      <path d="M56 46 L58 58" stroke={WOOD} strokeWidth="5" />
    </>
  ),
  spyglass: (p) => (
    <>
      {body(p, 'M8 44 L30 26 L36 34 L14 52 Z', WOOD)}
      {body(p, 'M30 24 L46 12 L52 20 L36 34 Z')}
      {body(p, 'M46 10 L54 4 L60 12 L52 20 Z')}
      <ellipse cx="57" cy="8" rx="3" ry="4" transform="rotate(40 57 8)" fill="#9FD8FF" />
    </>
  ),
  knife: (p) => (
    <>
      {body(p, 'M10 54 L40 20 C44 16 50 14 52 16 C50 22 46 28 42 30 L14 58 Z')}
      {shine(p, 'M16 52 L42 22')}
      <path d="M38 30 L48 40" stroke="#14100c" strokeWidth="2" />
      <path d="M44 36 L56 50" stroke="#14100c" strokeWidth="7" />
      <path d="M44 36 L56 50" stroke={WOOD} strokeWidth="4.4" />
    </>
  ),
};

/** Un dessin par catégorie. `id` permet de distinguer quelques objets particuliers (sable, thé, festin…). */
const DRAW: Record<string, (p: P, id: string) => ReactNode> = {
  // Poussière de Lointain (démontage) : un petit tas qui scintille, avec des éclats d'équipement dedans.
  dust: (p) => (
    <>
      {body(p, 'M6 54 C10 40 22 32 32 32 C42 32 54 40 58 54 C46 58 18 58 6 54 Z')}
      <path d="M20 46 L24 42 L27 47 Z M36 40 L41 37 L42 43 Z M30 51 L35 48 L36 53 Z" fill={p.l} opacity=".9" />
      <path d="M44 48 L48 45 L50 50 Z M14 51 L17 48 L19 52 Z" fill="#C9D0D5" />
      {shine(p, 'M16 44 C22 38 28 35 32 35', 1.6)}
      <path d="M32 10 V20 M27 15 H37 M48 18 V24 M45 21 H51 M16 20 V25 M13.5 22.5 H18.5" stroke={p.l} strokeWidth="1.8" strokeLinecap="round" />
    </>
  ),
  ore: (p, id) =>
    id === 'coal' ? (
      <>
        {body(p, 'M10 44 L18 30 L30 32 L36 44 L24 52 Z')}
        {body(p, 'M30 30 L40 18 L54 22 L56 38 L42 42 Z')}
        {body(p, 'M34 48 L44 42 L54 46 L50 56 L38 56 Z')}
        {shine(p, 'M20 32 L28 34 M42 21 L52 24', 1.6)}
      </>
    ) : (
      <>
        {body(p, 'M8 44 L16 24 L34 14 L52 20 L58 38 L46 54 L22 56 Z', '#7A766E')}
        <path d="M15 30 L27 34 L19 46 Z M30 20 L46 18 L41 34 Z M36 38 L52 36 L45 50 Z M22 46 L33 42 L30 53 Z" fill={p.m} />
        <path d="M16 31 L25 34 M31 21 L44 19 M37 39 L50 37" stroke={p.l} strokeWidth="1.6" />
        {shine(p, 'M18 26 L32 18', 1.6)}
      </>
    ),
  stone: (p, id) =>
    id === 'sand' ? (
      <>
        {body(p, 'M6 52 C14 30 26 22 32 22 C38 22 50 30 58 52 Z')}
        <path d="M20 44 h1 M30 36 h1 M40 46 h1 M36 30 h1 M26 50 h1 M46 40 h1" stroke={p.d} strokeWidth="2.4" />
        {shine(p, 'M18 40 C22 32 28 26 32 25')}
      </>
    ) : (
      <>
        {body(p, 'M10 26 L32 16 L54 26 L54 46 L32 56 L10 46 Z')}
        <path d="M10 26 L32 36 L54 26 M32 36 V56" fill="none" stroke={p.d} strokeWidth="2" />
        <path d="M32 36 L54 26 L54 46 L32 56 Z" fill="#000" fillOpacity=".18" stroke="none" />
        {id === 'rune_stone' ? <path d="M18 34 L22 30 L22 44 M24 38 L28 36" fill="none" stroke="#9FE8FF" strokeWidth="2.4" /> : <path d="M16 34 L24 38 M40 40 L48 36" stroke={p.d} strokeWidth="1.4" />}
        {shine(p, 'M14 26 L32 18')}
      </>
    ),
  gem: (p, id) =>
    id.startsWith('gem_') ? (
      <>
        <circle cx="32" cy="32" r="24" fill={p.l} fillOpacity=".18" stroke="none" />
        {body(p, 'M20 14 H44 L56 28 L32 56 L8 28 Z')}
        <path d="M8 28 H56 M20 14 L26 28 L32 56 L38 28 L44 14 M26 28 L32 14 L38 28" fill="none" stroke={p.d} strokeWidth="1.4" />
        <path d="M20 14 L26 28 L8 28 Z" fill="#fff" fillOpacity=".35" stroke="none" />
      </>
    ) : (
    <>
      {body(p, 'M20 54 L14 30 L24 12 L30 30 Z')}
      {body(p, 'M30 56 L26 26 L38 6 L48 26 L42 56 Z')}
      {body(p, 'M46 54 L44 34 L52 20 L56 38 Z')}
      <path d="M38 6 L36 30 L42 56 M26 26 L36 30 L48 26" fill="none" stroke={p.d} strokeWidth="1.4" />
      {shine(p, 'M34 14 L30 28', 2.2)}
    </>
  ),
  log: (p, id) =>
    id === 'bark' ? (
      <>
        {body(p, 'M14 50 C10 30 20 12 40 10 C50 12 54 20 52 26 C40 22 28 28 26 52 Z')}
        <path d="M22 44 C22 32 28 22 38 18 M30 48 C32 38 36 30 44 26" fill="none" stroke={p.d} strokeWidth="1.8" />
      </>
    ) : (
      <>
        {body(p, 'M10 30 L44 14 C52 12 58 22 54 30 L20 48 Z')}
        <ellipse cx="15" cy="39" rx="9" ry="10" transform="rotate(-25 15 39)" fill={p.l} />
        <ellipse cx="15" cy="39" rx="5" ry="6" transform="rotate(-25 15 39)" fill="none" stroke={p.d} strokeWidth="1.4" />
        <path d="M24 30 L44 21 M28 38 L48 28" stroke={p.d} strokeWidth="1.6" />
        <path d="M40 18 L46 10 L48 14" fill="none" stroke="#5E9A4E" strokeWidth="2" />
      </>
    ),
  herb: (p, id) =>
    /lily|flower/.test(id) ? (
      <>
        <path d="M32 58 C32 46 30 38 32 30" fill="none" stroke="#4E7A3A" strokeWidth="3" />
        <path d="M32 46 C24 44 18 38 18 32 C26 34 30 40 32 46" fill="#5E9A4E" />
        {body(p, 'M32 30 C22 28 18 16 24 8 C28 14 30 16 32 18 C34 16 36 14 40 8 C46 16 42 28 32 30 Z')}
        <circle cx="32" cy="22" r="3" fill={p.l} />
        {id.includes('lantern') && <circle cx="32" cy="22" r="10" fill={p.l} fillOpacity=".25" stroke="none" />}
      </>
    ) : (
      <>
        <path d="M32 58 C32 42 30 28 34 10" fill="none" stroke={p.d} strokeWidth="3" />
        {[
          'M32 48 C22 48 14 42 14 36 C22 36 28 40 32 48',
          'M33 40 C42 40 50 34 50 28 C42 28 36 32 33 40',
          'M32 30 C24 30 18 24 18 18 C26 18 30 22 32 30',
          'M34 22 C40 20 44 14 44 8 C38 10 34 14 34 22',
        ].map((d) => (
          <g key={d}>{body(p, d)}</g>
        ))}
      </>
    ),
  fish: (p) => (
    <>
      {body(p, 'M8 32 C18 18 38 16 50 26 L60 18 L58 32 L60 46 L50 38 C38 48 18 46 8 32 Z')}
      <path d="M24 22 C26 28 26 36 24 42" fill="none" stroke={p.d} strokeWidth="1.8" />
      <circle cx="16" cy="30" r="2.4" fill="#14100c" />
      <path d="M30 34 C34 37 40 37 44 34" fill="none" stroke={p.l} strokeWidth="1.6" />
      {shine(p, 'M20 24 C28 20 38 20 44 24')}
    </>
  ),
  bar: (p) => (
    <>
      {body(p, 'M8 42 L18 26 H52 L56 42 Z')}
      <path d="M8 42 H56 L52 50 H12 Z" fill={p.d} />
      <path d="M18 26 L22 42 M52 26 L48 42" stroke={p.d} strokeWidth="1.4" />
      {shine(p, 'M20 30 H46')}
    </>
  ),
  tool_part: (p) => (
    <>
      {body(p, 'M8 30 C18 18 46 16 58 28 L54 34 C46 28 38 28 36 30 L36 46 H28 V30 C26 28 18 28 12 34 Z')}
      <circle cx="32" cy="38" r="3" fill="#14100c" />
      {shine(p, 'M14 26 C24 21 40 21 50 25')}
    </>
  ),
  hardware: (p, id) =>
    id.includes('arrowhead') ? (
      <>
        {[0, 1, 2].map((i) => (
          <g key={i} transform={`translate(${i * 14 - 14} ${i % 2 ? 6 : 0})`}>
            {body(p, 'M32 12 L42 32 L36 30 L36 44 H28 V30 L22 32 Z')}
          </g>
        ))}
      </>
    ) : (
      <>
        {[0, 1, 2, 3].map((i) => (
          <g key={i} transform={`translate(${(i % 2) * 18 - 9} ${Math.floor(i / 2) * 20 - 10}) rotate(${i * 25 - 30} 32 32)`}>
            <path d="M24 24 H40 V28 H34 V46 L32 50 L30 46 V28 H24 Z" fill={p.m} />
          </g>
        ))}
      </>
    ),
  weapon: (p) => (
    <>
      {body(p, 'M14 50 L46 12 L52 10 L50 16 L18 54 Z', p.l)}
      <path d="M12 40 L26 54" stroke={p.m} strokeWidth="4" />
      <path d="M16 52 L8 60" stroke={WOOD} strokeWidth="5" />
    </>
  ),
  plank: (p) => (
    <>
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(0 ${i * 10 - 10})`}>
          {body(p, 'M8 34 L50 24 L56 28 L14 40 Z')}
          <path d="M14 40 L56 28" stroke={p.d} strokeWidth="1.2" />
        </g>
      ))}
    </>
  ),
  handle: (p) => (
    <>
      <path d="M14 54 L50 10" stroke="#14100c" strokeWidth="9" strokeLinecap="round" />
      <path d="M14 54 L50 10" stroke={p.m} strokeWidth="6" strokeLinecap="round" />
      <path d="M18 46 L46 12" stroke={p.l} strokeWidth="1.6" />
      <path d="M20 46 L24 50 M24 41 L28 45" stroke={p.d} strokeWidth="1.6" />
    </>
  ),
  archery: (p, id) =>
    id.includes('stave') ? (
      <>
        <path d="M46 6 C24 16 18 36 22 58" fill="none" stroke="#14100c" strokeWidth="8" />
        <path d="M46 6 C24 16 18 36 22 58" fill="none" stroke={p.m} strokeWidth="5" />
        <path d="M44 8 C28 18 22 32 23 46" fill="none" stroke={p.l} strokeWidth="1.4" />
      </>
    ) : (
      <>
        {[0, 1, 2].map((i) => (
          <path key={i} d={`M${12 + i * 6} 56 L${46 + i * 6} 8`} stroke={p.m} strokeWidth="2.6" />
        ))}
        <path d="M18 50 L30 54 M14 46 L26 50" stroke="#C2302A" strokeWidth="2.4" />
      </>
    ),
  meal: (p, id) =>
    id.includes('tea') ? (
      <>
        {body(p, 'M14 26 H46 V40 C46 50 38 54 30 54 C22 54 14 50 14 40 Z', '#E8DFC6')}
        <path d="M46 30 C56 30 56 42 46 42" fill="none" stroke="#E8DFC6" strokeWidth="4" />
        <ellipse cx="30" cy="26" rx="16" ry="4" fill="#6FC48A" />
        <path d="M24 18 C22 14 26 12 24 8 M32 18 C30 14 34 12 32 8" fill="none" stroke="#E7E3DA" strokeWidth="1.8" strokeOpacity=".7" />
      </>
    ) : id.includes('fish') || id.includes('trout') ? (
      <>
        <ellipse cx="32" cy="42" rx="26" ry="10" fill="#E8DFC6" />
        <ellipse cx="32" cy="42" rx="20" ry="6" fill="none" stroke="#B9AE92" strokeWidth="1.4" />
        {body(p, 'M14 38 C20 28 36 28 44 34 L52 28 L50 38 L52 46 L44 42 C36 48 20 46 14 38 Z', '#C98A4A')}
        <path d="M26 32 L30 42 M34 31 L38 42" stroke="#7A4022" strokeWidth="2" />
      </>
    ) : (
      <>
        <ellipse cx="32" cy="30" rx="24" ry="8" fill={id.includes('frost') ? '#9FD8FF' : id.includes('lantern') ? '#F2C14E' : '#8FAE6A'} />
        {body(p, 'M8 30 H56 C56 46 46 54 32 54 C18 54 8 46 8 30 Z', '#A86A3E')}
        <path d="M14 36 C20 48 44 48 50 36" fill="none" stroke="#E8B98A" strokeWidth="1.4" />
        <path d="M24 22 C22 16 26 14 24 8 M34 22 C32 16 36 14 34 8" fill="none" stroke="#E7E3DA" strokeWidth="1.8" strokeOpacity=".7" />
      </>
    ),
  hide: (p, id) => (
    <>
      {body(p, 'M14 14 C20 18 26 12 32 14 C38 12 44 18 50 14 C52 24 46 28 48 36 C50 46 44 54 32 54 C20 54 14 46 16 36 C18 28 12 24 14 14 Z')}
      {id.includes('wolf') || id.includes('elk') || id.includes('bear') ? <path d="M22 26 l4 4 M30 22 l3 5 M38 26 l4 4 M24 38 l4 4 M36 38 l4 4" stroke={p.d} strokeWidth="1.6" /> : <path d="M24 30 C28 34 36 34 40 30" fill="none" stroke={p.d} strokeWidth="1.6" />}
      {shine(p, 'M20 20 C24 22 28 18 32 18')}
    </>
  ),
  meat: (p) => (
    <>
      {body(p, 'M12 34 C12 20 30 12 44 18 C56 24 54 44 40 50 C28 56 12 48 12 34 Z', '#B84A3E')}
      <path d="M22 30 C28 26 36 26 42 30" fill="none" stroke="#F0C8B8" strokeWidth="2.4" />
      <path d="M44 46 L56 58" stroke="#E8DFC6" strokeWidth="5" />
      <circle cx="57" cy="58" r="3.4" fill="#E8DFC6" />
    </>
  ),
  feather: (p) => (
    <>
      {body(p, 'M14 56 C16 36 30 14 52 8 C50 28 36 46 14 56 Z', '#C98A4A')}
      <path d="M14 56 L46 16" stroke="#5A3A20" strokeWidth="1.6" />
      <path d="M24 44 L30 46 M30 36 L36 38 M36 28 L42 30" stroke="#5A3A20" strokeWidth="1.4" />
    </>
  ),
  crop: (p, id) =>
    id.includes('carrot') ? (
      <>
        {body(p, 'M20 24 L30 22 L34 56 Z', '#E8803A')}
        {body(p, 'M34 26 L44 26 L42 56 Z', '#E8803A')}
        <path d="M24 22 C20 14 22 8 26 6 M28 22 C30 14 34 10 36 8 M38 26 C36 18 40 12 44 10" fill="none" stroke="#5E9A4E" strokeWidth="2.6" />
      </>
    ) : id.includes('cotton') ? (
      <>
        <path d="M32 58 V30" stroke="#6E5A3A" strokeWidth="3" />
        {[[22, 24], [42, 24], [32, 14]].map(([x, y]) => (
          <g key={x! * y!}>{body(p, `M${x! - 9} ${y} C${x! - 9} ${y! - 9} ${x! + 9} ${y! - 9} ${x! + 9} ${y} C${x! + 9} ${y! + 9} ${x! - 9} ${y! + 9} ${x! - 9} ${y} Z`, '#F2EEE2')}</g>
        ))}
      </>
    ) : (
      <>
        {[0, 1, 2, 3, 4].map((i) => (
          <path key={i} d={`M${22 + i * 5} 58 C${22 + i * 5} 40 ${18 + i * 7} 26 ${16 + i * 8} 12`} fill="none" stroke={id.includes('woad') ? '#4E7A8A' : id.includes('wheat') ? '#D9B45A' : '#8FAE6A'} strokeWidth="3" />
        ))}
        {id.includes('wheat') && [0, 1, 2, 3, 4].map((i) => <ellipse key={i} cx={16 + i * 8} cy={12} rx="3" ry="6" fill="#E8C66A" />)}
        <path d="M18 44 H46" stroke="#8A6240" strokeWidth="3" />
      </>
    ),
  fiber: (p) => (
    <>
      {body(p, 'M10 36 C18 24 30 30 36 24 C44 18 52 24 56 30 C48 34 44 42 34 42 C24 42 18 46 10 36 Z', '#E2D6B6')}
      <path d="M16 36 C26 32 38 34 50 28" fill="none" stroke="#B4A47E" strokeWidth="1.4" />
    </>
  ),
  grain: (p, id) => (
    <>
      {body(p, 'M16 22 C16 14 48 14 48 22 L52 50 C52 58 12 58 12 50 Z', '#C9A86A')}
      <path d="M16 22 C24 26 40 26 48 22" fill="none" stroke="#7A5A30" strokeWidth="2" />
      <path d="M26 18 L22 10 M38 18 L42 10" stroke="#7A5A30" strokeWidth="2" />
      {id === 'flour' ? <ellipse cx="32" cy="20" rx="12" ry="3" fill="#F6F2E8" /> : <path d="M26 36 h1 M34 40 h1 M30 46 h1 M38 34 h1" stroke="#7A5A30" strokeWidth="3" />}
    </>
  ),
  dye: () => (
    <>
      <path d="M12 30 H52 L48 52 C46 56 18 56 16 52 Z" fill="#8A6240" />
      <ellipse cx="32" cy="30" rx="20" ry="5" fill="#3E6A9A" />
      <path d="M40 30 C42 22 46 18 50 16" fill="none" stroke="#3E6A9A" strokeWidth="3" />
    </>
  ),
  leather: (p, id) =>
    id.includes('strap') ? (
      <>
        {[0, 1, 2].map((i) => (
          <path key={i} d={`M${12 + i * 4} ${16 + i * 12} C30 ${10 + i * 12} 40 ${26 + i * 12} 54 ${18 + i * 12}`} fill="none" stroke={p.m} strokeWidth="6" />
        ))}
      </>
    ) : (
      <>
        {body(p, 'M10 22 L50 14 L54 44 L14 52 Z')}
        <path d="M14 46 C24 40 40 38 52 40" fill="none" stroke={p.l} strokeWidth="1.4" />
        <path d="M50 14 C46 22 50 30 54 34" fill="none" stroke={p.d} strokeWidth="2" />
      </>
    ),
  thread: (p) => (
    <>
      {body(p, 'M20 14 H44 V20 H20 Z', '#8A6240')}
      {body(p, 'M20 44 H44 V50 H20 Z', '#8A6240')}
      {body(p, 'M24 20 H40 V44 H24 Z', '#E8DFC6')}
      <path d="M24 26 H40 M24 32 H40 M24 38 H40" stroke="#B4A47E" strokeWidth="1.4" />
      <path d="M40 40 C48 44 50 52 56 54" fill="none" stroke="#E8DFC6" strokeWidth="1.6" />
    </>
  ),
  cloth: (p, id) => (
    <>
      {body(p, 'M8 24 L44 16 C52 16 56 24 52 30 L16 38 Z', id.includes('blue') ? '#4E7AB8' : id.includes('cotton') ? '#F2EEE2' : '#D8CDB0')}
      <ellipse cx="13" cy="31" rx="6" ry="8" transform="rotate(-15 13 31)" fill={id.includes('blue') ? '#36598A' : '#B4A47E'} />
      {body(p, 'M16 38 L52 30 L54 46 L18 54 Z', id.includes('blue') ? '#4E7AB8' : id.includes('cotton') ? '#F2EEE2' : '#D8CDB0')}
    </>
  ),
  garment: (p, id) =>
    id.includes('satchel') ? (
      <>
        {body(p, 'M12 24 H52 V52 H12 Z', '#8A5A36')}
        <path d="M12 24 H52 L48 38 H16 Z" fill="#6E4524" />
        <path d="M20 24 C20 10 44 10 44 24" fill="none" stroke="#6E4524" strokeWidth="3" />
        <rect x="29" y="34" width="6" height="6" fill="#C9A86A" />
      </>
    ) : id.includes('hood') ? (
      <>
        {body(p, 'M14 54 C11 32 18 12 33 8 C47 10 53 26 50 42 L48 54 Z', '#D8CDB0')}
        <path d="M23 52 C21 38 27 26 35 26 C42 28 44 38 42 52 Z" fill="#0b0907" fillOpacity=".7" />
      </>
    ) : id.includes('gloves') ? (
      <>{body(p, 'M18 56 V36 L14 24 C13 19 19 18 21 22 L24 30 V15 C24 11 30 11 30 15 V28 L31 12 C31 8 37 8 37 12 V28 L39 16 C39 12 45 12 45 16 L43 34 L47 31 C51 29 54 33 51 37 L42 48 V56 Z', '#D8CDB0')}</>
    ) : id.includes('breeches') ? (
      <>
        {body(p, 'M17 8 H47 V20 L45 56 H35 L33 26 H31 L29 56 H19 L17 20 Z', '#D8CDB0')}
        <path d="M17 8 H47 V14 H17 Z" fill="#B4A47E" />
      </>
    ) : (
      <>
        {body(p, 'M22 10 L32 14 L42 10 L54 18 L48 28 L44 26 L46 56 H18 L20 26 L16 28 L10 18 Z', id.includes('jerkin') ? '#7A4E2E' : id.includes('adept') ? '#4E7AB8' : '#D8CDB0')}
        <path d="M32 14 V56" stroke="#14100c" strokeWidth="1.2" strokeOpacity=".5" />
        {id.includes('warded') && <path d="M26 34 L30 30 L30 44 M34 36 L38 34" fill="none" stroke="#9FE8FF" strokeWidth="2.4" />}
      </>
    ),
  vial: () => (
    <>
      {[0, 1].map((i) => (
        <g key={i} transform={`translate(${i * 18 - 9} ${i * 4})`}>
          <path d="M26 12 H38 V22 L44 34 V50 C44 54 20 54 20 50 V34 L26 22 Z" fill="#CFE6EE" fillOpacity=".55" />
          <path d="M26 10 H38 V14 H26 Z" fill="#8A6240" />
        </g>
      ))}
    </>
  ),
  potion: (p, id) => {
    const c = id.includes('frost') ? '#9FD8FF' : id.includes('lantern') ? '#F2C14E' : id.includes('miner') ? '#8FAE6A' : '#E5484D';
    return (
      <>
        <path d="M24 8 H40 V20 C52 26 54 36 50 46 C46 56 18 56 14 46 C10 36 12 26 24 20 Z" fill="#CFE6EE" fillOpacity=".4" />
        <path d="M14 38 C20 34 44 34 50 38 C50 48 44 54 32 54 C20 54 14 48 14 38 Z" fill={c} />
        <path d="M24 6 H40 V10 H24 Z" fill="#8A6240" />
        <path d="M20 30 C22 26 26 24 28 23" fill="none" stroke="#fff" strokeWidth="2" strokeOpacity=".6" />
      </>
    );
  },
  reagent: () => (
    <>
      <path d="M22 14 H42 V24 L48 32 V52 C48 56 16 56 16 52 V32 L22 24 Z" fill="#2E3A52" />
      <path d="M22 10 H42 V16 H22 Z" fill="#8A6240" />
      <path d="M24 38 L30 34 L30 46 M34 40 L40 36" fill="none" stroke="#9FE8FF" strokeWidth="2.4" />
    </>
  ),
  jewelry: (p, id) =>
    id.includes('chain') ? (
      <>
        <path d="M12 14 C12 40 52 40 52 14" fill="none" stroke="#14100c" strokeWidth="6" />
        <path d="M12 14 C12 40 52 40 52 14" fill="none" stroke="#E8B84A" strokeWidth="3.6" strokeDasharray="4 2" />
        {body(p, 'M32 36 L38 44 L32 54 L26 44 Z', '#E8B84A')}
      </>
    ) : id.includes('bead') ? (
      <>
        {[[22, 26], [38, 22], [30, 38], [44, 40], [18, 44]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="7" fill={['#9FD8FF', '#B78CFF', '#7FC4A8', '#F2C14E', '#E58AA8'][i]} />
        ))}
      </>
    ) : (
      <>
        <ellipse cx="32" cy="40" rx="16" ry="14" fill="none" stroke="#14100c" strokeWidth="9" />
        <ellipse cx="32" cy="40" rx="16" ry="14" fill="none" stroke={id.includes('copper') ? '#C77B4A' : '#D7DEE4'} strokeWidth="6" />
        {id.includes('amethyst') && <path d="M24 26 L32 14 L40 26 L32 32 Z" fill="#A87AE0" />}
      </>
    ),
  rune: (p, id) =>
    id.includes('dust') ? (
      <>
        {body(p, 'M8 52 C14 36 24 30 32 30 C40 30 50 36 56 52 Z', '#8A9AA8')}
        <path d="M22 44 h1 M32 38 h1 M42 44 h1 M28 48 h1" stroke="#9FE8FF" strokeWidth="3" />
      </>
    ) : (
      <>
        {body(p, 'M16 12 H48 L52 52 H12 Z', '#7E8890')}
        <path d="M26 20 L32 28 L26 36 M38 20 V44 M26 44 H38" fill="none" stroke="#9FE8FF" strokeWidth="3" />
      </>
    ),
  scroll: () => (
    <>
      <path d="M14 14 H48 V50 H14 Z" fill="#E8DFC6" />
      <ellipse cx="14" cy="32" rx="5" ry="18" fill="#C9B890" />
      <ellipse cx="48" cy="32" rx="5" ry="18" fill="#C9B890" />
      <path d="M24 24 L30 30 L24 36 M34 22 V40" fill="none" stroke="#3E6AA8" strokeWidth="2.4" />
    </>
  ),
  core: (p, id) => (
    <>
      <circle cx="32" cy="32" r="22" fill={id.includes('memory') ? '#F2C14E' : '#9FE8FF'} fillOpacity=".25" stroke="none" />
      {body(p, 'M32 10 L50 32 L32 54 L14 32 Z', id.includes('memory') ? '#E8A23A' : '#6E8AB8')}
      <path d="M32 18 L32 46 M22 32 H42" stroke="#FFF6DD" strokeWidth="2" />
    </>
  ),
  mechanism: (p, id) =>
    id.includes('spring') ? (
      <>
        <path d="M14 50 C10 44 54 42 50 36 C46 30 10 32 14 26 C18 20 54 22 50 16" fill="none" stroke="#14100c" strokeWidth="6" />
        <path d="M14 50 C10 44 54 42 50 36 C46 30 10 32 14 26 C18 20 54 22 50 16" fill="none" stroke={p.m} strokeWidth="3.6" />
      </>
    ) : (
      <>
        {[[24, 36, 14], [44, 22, 10]].map(([x, y, r], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r={r! + 3} fill={p.m} strokeDasharray="4 3" strokeWidth="6" stroke={p.m} />
            <circle cx={x} cy={y} r={r} fill={p.m} />
            <circle cx={x} cy={y} r={r! * 0.35} fill="#14100c" />
          </g>
        ))}
      </>
    ),
  powder: () => (
    <>
      <path d="M14 26 C14 18 50 18 50 26 L52 50 C52 58 12 58 12 50 Z" fill="#6E5A3E" />
      <path d="M22 24 L18 14 M42 24 L46 14 M18 14 C24 18 40 18 46 14" fill="none" stroke="#6E5A3E" strokeWidth="2.4" />
      <path d="M26 40 L30 32 L32 40 L38 30" fill="none" stroke="#FFE27A" strokeWidth="2.4" />
    </>
  ),
  device: (p, id) =>
    id.includes('lantern') ? (
      <>
        <path d="M22 18 H42 L44 48 H20 Z" fill="#F2C14E" fillOpacity=".5" />
        <path d="M20 14 H44 V18 H20 Z M20 48 H44 V52 H20 Z" fill={p.m} />
        <path d="M26 6 C26 2 38 2 38 6 V14" fill="none" stroke={p.m} strokeWidth="3" />
        <circle cx="32" cy="34" r="5" fill="#FFF0B0" />
      </>
    ) : id.includes('rocket') ? (
      <>
        {body(p, 'M24 20 C24 10 32 4 32 4 C32 4 40 10 40 20 V44 H24 Z', '#C2302A')}
        <path d="M32 44 V62" stroke="#8A6240" strokeWidth="3" />
        <path d="M24 34 L16 44 H24 M40 34 L48 44 H40" fill="#E8DFC6" />
      </>
    ) : (
      <>
        <path d="M10 44 C10 30 54 30 54 44" fill="none" stroke="#14100c" strokeWidth="6" />
        <path d="M10 44 C10 30 54 30 54 44" fill="none" stroke={p.m} strokeWidth="3.6" />
        <path d="M14 44 L22 36 L28 44 L34 36 L40 44 L46 36 L50 44" fill="none" stroke={p.l} strokeWidth="2" />
        <path d="M8 46 H56" stroke="#8A6240" strokeWidth="4" />
      </>
    ),
  element: (p, id) =>
    id.includes('frame') || id.includes('truss') || id.includes('stairs') ? (
      <>
        <path d={id.includes('stairs') ? 'M10 54 H22 V44 H34 V34 H46 V24 H56' : 'M8 52 L32 12 L56 52 Z M32 12 V52 M18 36 H46'} fill="none" stroke="#14100c" strokeWidth="7" />
        <path d={id.includes('stairs') ? 'M10 54 H22 V44 H34 V34 H46 V24 H56' : 'M8 52 L32 12 L56 52 Z M32 12 V52 M18 36 H46'} fill="none" stroke="#9A6A3E" strokeWidth="4.4" />
      </>
    ) : id.includes('mortar') ? (
      <>
        {body(p, 'M8 40 C8 30 56 30 56 40 L52 54 H12 Z', '#8A8478')}
        <ellipse cx="32" cy="36" rx="20" ry="5" fill="#C2BEB6" />
      </>
    ) : (
      <>
        {[0, 1, 2].map((row) =>
          [0, 1].map((col) => <rect key={`${row}${col}`} x={10 + col * 22 + (row % 2) * 10} y={14 + row * 14} width="20" height="12" fill="#8E8A84" />),
        )}
        {id.includes('arch') && <path d="M20 56 V40 C20 28 44 28 44 40 V56" fill="#22262A" />}
      </>
    ),
  map: (p, id) => (
    <>
      <path d="M8 14 L24 10 L40 16 L56 12 V50 L40 54 L24 48 L8 52 Z" fill="#E8DFC6" />
      <path d="M24 10 V48 M40 16 V54" stroke="#B4A47E" strokeWidth="1.4" />
      <path d={id.includes('vein') ? 'M14 40 L22 30 L30 36 L38 24 L48 30' : 'M12 36 C20 30 30 40 38 30 C44 24 50 30 52 26'} fill="none" stroke={id.includes('vein') ? '#C77B4A' : '#5E9A4E'} strokeWidth="2.4" strokeDasharray="4 3" />
      <path d="M44 38 L50 44 M50 38 L44 44" stroke="#C2302A" strokeWidth="2.4" />
    </>
  ),
  curio: (p, id) =>
    id.includes('coin') ? (
      <>
        {[[22, 40], [40, 36], [30, 26]].map(([x, y], i) => (
          <g key={i}>
            <ellipse cx={x} cy={y} rx="12" ry="8" fill="#B8963E" />
            <ellipse cx={x} cy={y! - 2} rx="12" ry="8" fill="#E8C66A" />
          </g>
        ))}
      </>
    ) : id.includes('relic') ? (
      <>
        {body(p, 'M20 54 L18 26 C18 14 46 14 46 26 L44 54 Z', '#5E8A8A')}
        <path d="M24 30 C28 34 36 34 40 30 M26 42 H38" fill="none" stroke="#9FE8E0" strokeWidth="2" />
      </>
    ) : (
      <>
        {body(p, 'M32 8 C46 16 52 34 44 50 C38 58 26 58 20 50 C12 34 18 16 32 8 Z', '#E8A23A')}
        <path d="M26 28 L32 36 L38 28" fill="none" stroke="#8A5A1C" strokeWidth="2" />
      </>
    ),
  vestige: (p, id) =>
    id.includes('encre') ? (
      <>
        {body(p, 'M22 24 H42 L46 34 V52 C46 56 18 56 18 52 V34 Z', '#2E3A52')}
        <path d="M24 14 H40 V24 H24 Z" fill="#8A6240" />
        <path d="M22 40 H42" stroke="#6E8AB8" strokeWidth="2" />
      </>
    ) : id.includes('ambre') ? (
      <>
        {body(p, 'M32 8 C46 16 52 34 44 50 C38 58 26 58 20 50 C12 34 18 16 32 8 Z', '#E8A23A')}
        <path d="M30 26 C32 32 30 38 34 42" fill="none" stroke="#8A5A1C" strokeWidth="1.6" />
        {shine({ ...p, l: '#FFE0A0' }, 'M24 24 C26 18 30 14 32 12', 2.4)}
      </>
    ) : id.includes('quartz') || id.includes('eclat') ? (
      <>
        {body(p, 'M30 58 L22 26 L34 4 L44 26 L38 58 Z', id.includes('quartz') ? '#C9E8F2' : '#E8D2A0')}
        {body(p, 'M16 54 L12 36 L20 24 L26 40 Z', id.includes('quartz') ? '#A6D2E2' : '#C9B07A')}
        <path d="M34 4 L32 30 L38 58" fill="none" stroke={p.d} strokeWidth="1.2" />
      </>
    ) : id.includes('scorie') ? (
      <>
        {body(p, 'M8 46 C8 30 20 20 34 22 C48 22 58 32 56 46 C50 56 16 56 8 46 Z', '#4A3E3A')}
        <circle cx="22" cy="38" r="3" fill="#FF8A3D" />
        <circle cx="38" cy="32" r="2.4" fill="#FF8A3D" />
        <circle cx="44" cy="44" r="2" fill="#FFB86A" />
      </>
    ) : (
      <>
        {body(p, 'M8 44 C8 34 18 30 26 34 C30 38 30 48 20 52 C12 52 8 50 8 44 Z', '#9AA6AA')}
        {body(p, 'M26 30 C28 20 40 16 48 22 C54 28 50 40 40 40 C32 40 26 38 26 30 Z', '#B8C2C6')}
        {body(p, 'M32 50 C34 44 42 42 48 46 C52 52 48 56 40 56 C34 56 32 54 32 50 Z', '#8A969A')}
      </>
    ),
};

/** Caisse marquée de l'initiale, pour une catégorie sans dessin. */
function Crate(p: P, name: string) {
  return (
    <>
      {body(p, 'M10 22 L32 12 L54 22 V46 L32 56 L10 46 Z')}
      <path d="M10 22 L32 32 L54 22 M32 32 V56" fill="none" stroke={p.d} strokeWidth="2" />
      <text x="21" y="44" fontSize="15" fontWeight="800" textAnchor="middle" fill={p.l} stroke="none">
        {name[0]}
      </text>
    </>
  );
}

export function ItemArt({ item, size = 40, dim }: { item: Item | undefined; size?: number; dim?: boolean }) {
  const u = useId().replace(/[^a-zA-Z0-9]/g, '');
  if (!item) return null;
  const cat = item.category;
  const [m, d, l] = tintOf(item.id, CATEGORY_TONE[cat] ?? DEFAULT);
  const p: P = { m, d, l, u };
  const tool = cat === 'tool' ? Object.keys(TOOLS).find((k) => item.id.includes(k)) : undefined;
  const draw = tool ? TOOLS[tool]!(p) : DRAW[cat] ? DRAW[cat]!(p, item.id) : Crate(p, item.name);
  return (
    <svg className={`item-art${dim ? ' dim' : ''}`} viewBox="0 0 64 64" width={size} height={size} aria-hidden>
      <defs>
        <linearGradient id={`${u}s`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".35" />
          <stop offset=".45" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity=".35" />
        </linearGradient>
      </defs>
      <g stroke="#14100c" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round">
        {draw}
      </g>
    </svg>
  );
}

/** Couleur et motif du clan, tirés de son nom (stables) : en attendant des blasons choisis par le chef. */
export function heraldry(name: string) {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const hues = [8, 28, 44, 140, 175, 205, 255, 290, 330];
  const hue = hues[h % hues.length]!;
  return { color: `hsl(${hue} 62% 52%)`, dark: `hsl(${hue} 45% 18%)`, motif: (h >> 4) % 4, letter: name.replace(/^(Clan|Les|La|Le|L’)\s+/i, '').charAt(0).toUpperCase() };
}

export function Crest({ name, size = 84 }: { name: string; size?: number }) {
  const h = heraldry(name);
  const motif = [
    <path key="m" d="M30 62 L50 30 L70 62" fill="none" stroke="#F3E3B5" strokeOpacity=".35" strokeWidth="3" />,
    <path key="m" d="M24 40 H76 M24 50 H76" stroke="#F3E3B5" strokeOpacity=".25" strokeWidth="4" />,
    <circle key="m" cx="50" cy="50" r="22" fill="none" stroke="#F3E3B5" strokeOpacity=".3" strokeWidth="3" />,
    <path key="m" d="M26 28 L74 76 M74 28 L26 76" stroke="#F3E3B5" strokeOpacity=".22" strokeWidth="4" />,
  ][h.motif];
  return (
    <svg className="clan-crest" viewBox="0 0 100 110" width={size} height={size * 1.1} aria-hidden>
      <path d="M50 4 L92 16 V52 C92 80 72 98 50 106 C28 98 8 80 8 52 V16 Z" fill={h.dark} stroke="#E8C77A" strokeWidth="4" />
      <path d="M50 12 L84 22 V52 C84 74 68 89 50 96 C32 89 16 74 16 52 V22 Z" fill={h.color} opacity=".9" />
      {motif}
      <text x="50" y="66" textAnchor="middle" fontSize="40" fontWeight="800" fill="#FFF6DD" stroke={h.dark} strokeWidth="1.5" fontFamily="inherit">
        {h.letter}
      </text>
      <path d="M38 4 L50 -2 L62 4" fill="none" stroke="#E8C77A" strokeWidth="3" />
    </svg>
  );
}

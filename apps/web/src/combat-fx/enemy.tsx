/**
 * Ennemis de la scène, dessinés dans un repère de 200 × 260, pieds en (0, 0), tournés vers la gauche (vers le personnage).
 * Provisoire en attendant les ennemis de chaque région : une Ombre de la Marée et le mannequin d'entraînement.
 */

/** Ombre de la Marée : corps sombre ombré, lueur de contour, yeux vifs, volutes à la base qui ondulent. `white` : éclair d'impact. */
export function Shade({ t, hurt = 0, uid }: { t: number; hurt?: number; uid: string }) {
  const breathe = 1 + Math.sin(t * 2.1) * 0.018;
  const squash = 1 - hurt * 0.05;
  const wisp = (j: number) => {
    const w = Math.sin(t * 2.4 + j * 1.7) * 6;
    const x = 70 + j * 32;
    return `M${x} 4 C${x - 10 + w} -18 ${x + 12 - w} -36 ${x + w} -58`;
  };
  return (
    <g transform={`scale(${(1 / squash) * 1} ${breathe * squash})`}>
      <defs>
        <linearGradient id={`${uid}-body`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2A3640" />
          <stop offset=".55" stopColor="#141A20" />
          <stop offset="1" stopColor="#07090C" />
        </linearGradient>
        <linearGradient id={`${uid}-rim`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#4CC9D6" stopOpacity=".15" />
          <stop offset="1" stopColor="#4CC9D6" stopOpacity=".85" />
        </linearGradient>
        <radialGradient id={`${uid}-eye`} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset=".4" stopColor="#8FF4F8" />
          <stop offset="1" stopColor="#4CC9D6" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g transform="translate(-100 -260)">
        <ellipse cx="104" cy="258" rx="80" ry="9" fill="#000" opacity=".5" />
        <g fill="none" stroke="#4CC9D6" strokeOpacity=".35" strokeWidth="5" strokeLinecap="round" transform="translate(0 250)">
          {[0, 1, 2].map((j) => <path key={j} d={wisp(j)} opacity={0.4 + 0.3 * Math.sin(t * 3 + j)} />)}
        </g>
        <g stroke={`url(#${uid}-rim)`} strokeWidth="3" strokeLinejoin="round" fill={`url(#${uid}-body)`}>
          {/* Dos et épines */}
          <path d="M150 104 C168 78 178 52 170 28 C190 50 192 88 174 118 Z" />
          <path d="M132 96 C142 74 146 58 142 42 C156 60 156 82 146 102 Z" />
          {/* Corps */}
          <path d="M56 258 C42 214 44 166 62 130 C74 104 100 90 128 92 C156 94 174 118 172 148 C186 174 184 216 170 258 C152 246 138 262 120 250 C104 262 86 246 70 258 Z" />
          {/* Tête */}
          <path d="M88 130 C64 128 44 112 44 92 C44 72 64 60 86 62 C108 64 120 82 116 102 C114 118 104 128 88 130 Z" />
          {/* Cornes */}
          <path d="M58 72 C44 54 44 34 56 18 C57 38 66 54 78 66 Z" />
          <path d="M90 64 C94 44 108 30 126 26 C112 40 106 54 104 70 Z" />
          {/* Bras griffu tendu vers le personnage */}
          <path d="M78 160 C56 170 40 190 32 210 L20 218 L36 216 L30 230 L44 218 L48 228 C54 204 72 186 94 176 Z" />
        </g>
        {/* Mâchoire, ombre du ventre */}
        <path d="M50 104 C60 114 76 118 92 114" fill="none" stroke="#4CC9D6" strokeOpacity=".5" strokeWidth="2" />
        <path d="M80 200 C96 230 130 236 150 214" fill="none" stroke="#000" strokeOpacity=".35" strokeWidth="10" />
        {/* Yeux */}
        <circle cx="60" cy="90" r={9 + Math.sin(t * 5) * 0.8} fill={`url(#${uid}-eye)`} />
        <circle cx="78" cy="88" r={8 + Math.sin(t * 5 + 1) * 0.8} fill={`url(#${uid}-eye)`} />
        <circle cx="60" cy="90" r="2.6" fill="#FFFFFF" />
        <circle cx="78" cy="88" r="2.4" fill="#FFFFFF" />
        {/* Éclair blanc quand un coup porte */}
        {hurt > 0 && (
          <g fill="#FFE9D6" opacity={hurt * 0.22} style={{ mixBlendMode: 'screen' }}>
            <path d="M56 258 C42 214 44 166 62 130 C74 104 100 90 128 92 C156 94 174 118 172 148 C186 174 184 216 170 258 Z" />
            <path d="M88 130 C64 128 44 112 44 92 C44 72 64 60 86 62 C108 64 120 82 116 102 C114 118 104 128 88 130 Z" />
          </g>
        )}
      </g>
    </g>
  );
}

/** Mannequin d'entraînement (Terrain d'entraînement). */
export function Dummy({ hurt = 0 }: { hurt?: number }) {
  return (
    <g transform={`translate(-100 -260) rotate(${-hurt * 6} 100 258)`}>
      <ellipse cx="100" cy="258" rx="60" ry="7" fill="#000" opacity=".45" />
      <rect x="94" y="120" width="12" height="140" rx="3" fill="#7A5634" />
      <rect x="52" y="140" width="96" height="11" rx="4" fill="#8C6640" />
      <path d="M70 128 C66 170 70 200 80 214 L120 214 C130 200 134 170 130 128 Z" fill="#C9A86A" stroke="#7A5634" strokeWidth="3" />
      <path d="M78 150 L122 150 M76 178 L124 178" stroke="#7A5634" strokeWidth="2.5" />
      <circle cx="100" cy="100" r="28" fill="#D8BC82" stroke="#7A5634" strokeWidth="3" />
      <path d="M86 92 L94 100 M94 92 L86 100" stroke="#5A3E24" strokeWidth="3" strokeLinecap="round" />
    </g>
  );
}

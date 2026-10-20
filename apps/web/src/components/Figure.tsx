/**
 * Personnage provisoire.
 * Règle de mise en scène : toujours à gauche de la scène, de face mais tourné et regardant
 * vers la droite, jamais retourné en miroir. Proportions réalistes (environ 7,5 têtes).
 */
export function Figure({ className, accent = 'var(--action)' }: { className?: string; accent?: string }) {
  return (
    <svg className={className} viewBox="0 0 140 400" role="img" aria-label="Personnage (provisoire)">
      <ellipse cx="70" cy="392" rx="46" ry="6" fill="var(--sunken)" opacity="0.8" />
      {/* Jambes */}
      <path d="M56 230 L50 384 L64 384 L70 250 Z" fill="var(--border)" />
      <path d="M72 232 L80 384 L94 384 L86 230 Z" fill="var(--border)" opacity="0.85" />
      {/* Manteau, de trois quarts */}
      <path
        d="M48 92 Q70 82 94 92 L100 170 L106 300 Q76 312 40 300 L46 170 Z"
        fill="var(--panel)"
        stroke="var(--text-muted)"
        strokeOpacity="0.35"
      />
      <path d="M78 96 L84 300" stroke={accent} strokeWidth="2.5" opacity="0.9" />
      <path d="M44 300 Q76 312 106 300" stroke={accent} strokeWidth="2.5" fill="none" />
      {/* Bras arrière et bras avant (côté droit, vers lequel il regarde) */}
      <path d="M50 98 Q38 150 42 212 L52 212 Q52 156 60 110 Z" fill="var(--border)" />
      <path d="M90 98 Q104 150 100 214 L90 214 Q90 158 82 112 Z" fill="var(--border)" opacity="0.9" />
      {/* Cou et tête, tournée vers la droite */}
      <rect x="64" y="68" width="14" height="20" rx="4" fill="#8a7a6c" />
      <ellipse cx="74" cy="48" rx="20" ry="25" fill="#8a7a6c" />
      <path d="M93 46 L99 54 L92 56 Z" fill="#8a7a6c" />
      <path d="M55 40 Q60 18 80 22 Q96 26 94 40 Q84 30 66 34 Q60 44 58 56 Z" fill="var(--sunken)" />
      <circle cx="86" cy="46" r="2" fill="var(--sunken)" />
    </svg>
  );
}

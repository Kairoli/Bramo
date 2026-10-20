import { useEffect, type CSSProperties, type ReactNode } from 'react';
import type { Item, ProfessionFamily } from '@bramo/shared';

export function Bar({ value, color, style }: { value: number; color?: string; style?: CSSProperties }) {
  return (
    <div className="bar" style={style}>
      <span style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%`, background: color }} />
    </div>
  );
}

export function Ring({ value, size = 128, stroke = 9, children }: { value: number; size?: number; stroke?: number; children?: ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--action)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - Math.max(0, Math.min(1, value)))}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="ring-center">{children}</div>
    </div>
  );
}

export function Modal({ onClose, children, className = '' }: { onClose: () => void; children: ReactNode; className?: string }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`panel modal ${className}`} role="dialog" aria-modal="true">
        {children}
      </div>
    </div>
  );
}

const CATEGORY_COLOR: Record<string, string> = {
  ore: 'var(--text-muted)',
  bar: 'var(--action)',
  weapon: 'var(--action)',
  tool: 'var(--clan)',
  herb: 'var(--good)',
  fish: 'var(--event)',
  meal: 'var(--clan)',
};

/** Icône provisoire : initiale dans un carré pointillé, couleur selon la catégorie. */
export function ItemIcon({ item, small, dim }: { item: Item | undefined; small?: boolean; dim?: boolean }) {
  return (
    <span
      className={`item-icon${small ? ' sm' : ''}`}
      style={{ color: dim ? 'var(--border)' : (CATEGORY_COLOR[item?.category ?? ''] ?? 'var(--text-muted)') }}
      aria-hidden
    >
      {item?.name[0] ?? '?'}
    </span>
  );
}

export const FAMILY_COLOR: Record<ProfessionFamily, string> = {
  gathering: 'var(--good)',
  crafting: 'var(--action)',
  world: 'var(--clan)',
};

export const FAMILY_NAME: Record<ProfessionFamily, string> = {
  gathering: 'Récolte',
  crafting: 'Artisanat',
  world: 'Monde et clan',
};

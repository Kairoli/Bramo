import type { CSSProperties } from 'react';
import { type StatusKind, type StatusSource, activeStatuses } from './status';

/**
 * Icônes d'état sous les barres de vie (demande de Louis du 22 octobre : « voir ce que subit le mob », en très bref) :
 * ce qui touche l'ennemi sous sa barre, la protection du personnage sous la sienne. Un anneau montre le temps qui reste ;
 * au survol (ou au toucher), le nom et une ligne d'explication.
 */

const INFO: Record<StatusKind | 'burn' | 'bleed', { name: string; text: string; color: string; icon: string }> = {
  burn: { name: 'Brûlure', text: 'Perd des PV chaque seconde.', color: '#FF8A3D', icon: 'M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-9z' },
  bleed: { name: 'Saignement', text: 'Perd des PV chaque seconde.', color: '#E5484D', icon: 'M12 3c3 5 6 8 6 11a6 6 0 0 1-12 0c0-3 3-6 6-11z' },
  dot: { name: 'Plaie', text: 'Perd des PV chaque seconde.', color: '#E5484D', icon: 'M12 3c3 5 6 8 6 11a6 6 0 0 1-12 0c0-3 3-6 6-11z' },
  mark: { name: 'Marqué', text: 'Les coups qui exploitent la marque frappent plus fort.', color: '#F2C14E', icon: 'M12 5a7 7 0 1 0 0 14 7 7 0 0 0 0-14zm0 4a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM12 1v4M12 19v4M1 12h4M19 12h4' },
  slow: { name: 'Ralenti', text: 'Attaque moins vite.', color: '#8FD3FF', icon: 'M7 3h10M7 21h10M8 3c0 5 8 5 8 9s-8 4-8 9M16 3c0 5-8 5-8 9' },
  stun: { name: 'Étourdi', text: 'Ne peut plus agir.', color: '#FFE27A', icon: 'M12 2l2.6 6.2L21 9l-5 4.3L17.5 20 12 16.6 6.5 20 8 13.3 3 9l6.4-.8z' },
  weaken: { name: 'Affaibli', text: 'Inflige moins de dégâts.', color: '#A9B3C8', icon: 'M6 6l6 6 6-6M6 13l6 6 6-6' },
  antiheal: { name: 'Soins coupés', text: 'Se soigne beaucoup moins.', color: '#7ED6A2', icon: 'M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10zM4 4l16 16' },
  shield: { name: 'Protection', text: 'Absorbe une partie des coups reçus.', color: '#9FD8FF', icon: 'M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z' },
};

const ENEMY: StatusKind[] = ['dot', 'mark', 'stun', 'slow', 'weaken', 'antiheal'];

export function StatusBadges({ sources, c, side, x, y, center }: { sources: StatusSource[]; c: number; side: 'enemy' | 'self'; x: number; y: number; center?: boolean }) {
  const a = activeStatuses(sources, c);
  const kinds = side === 'enemy' ? ENEMY.filter((k) => a[k]) : (['shield'] as StatusKind[]).filter((k) => a[k]);
  if (!kinds.length) return null;
  return (
    <div className={`stage-badges${center ? ' center' : ''}`} style={{ left: x, top: y }}>
      {kinds.map((k) => {
        const s = a[k]!;
        const info = INFO[k === 'dot' ? (s.type ?? 'dot') : k];
        const color = k === 'mark' || k === 'shield' ? s.src.col : info.color;
        return (
          <span key={k} className="stage-badge" style={{ '--bc': color, '--left': `${(1 - s.u) * 360}deg` } as CSSProperties}>
            <svg viewBox="0 0 24 24" aria-hidden>
              <path d={info.icon} />
            </svg>
            <span className="stage-badge-tip" role="tooltip">
              <strong>{info.name}</strong> · {Math.ceil(s.left)} s
              <span>{info.text}</span>
            </span>
          </span>
        );
      })}
    </div>
  );
}

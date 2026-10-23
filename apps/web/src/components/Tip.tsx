import { type CSSProperties, type ReactNode, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * Infobulle du jeu [demande de Louis, 23 octobre : « que tout ait un survol et son effet, même ce qui n'est pas
 * débloqué, de manière propre et visuelle »]. Une carte sombre au-dessus de ce qu'on survole (au-dessous s'il n'y a pas
 * la place), rendue dans <body> pour ne jamais être coupée par un panneau. Au survol, au focus clavier, et à l'appui
 * long sur écran tactile. Le contenu se compose avec TipHead / TipLine / TipFoot.
 */
export function Tip({ content, children, className, block, delay = 120, style }: { content: ReactNode; children: ReactNode; className?: string; block?: boolean; delay?: number; style?: CSSProperties }) {
  const anchor = useRef<HTMLSpanElement>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const show = useCallback(() => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => anchor.current && setRect(anchor.current.getBoundingClientRect()), delay);
  }, [delay]);
  const hide = useCallback(() => {
    window.clearTimeout(timer.current);
    setRect(null);
  }, []);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  // Un défilement ou un clic ailleurs referme la bulle (elle ne suit pas le contenu qui bouge).
  useEffect(() => {
    if (!rect) return;
    window.addEventListener('scroll', hide, true);
    window.addEventListener('pointerdown', hide, true);
    return () => {
      window.removeEventListener('scroll', hide, true);
      window.removeEventListener('pointerdown', hide, true);
    };
  }, [rect, hide]);
  if (!content) return <>{children}</>;
  return (
    <span
      ref={anchor}
      className={`tip-anchor${block ? ' block' : ''}${className ? ` ${className}` : ''}`}
      style={style}
      onPointerEnter={(e) => e.pointerType === 'mouse' && show()}
      onPointerLeave={hide}
      onFocus={show}
      onBlur={hide}
      onContextMenu={(e) => {
        // Appui long sur un écran tactile : montrer la bulle au lieu du menu.
        if (window.matchMedia('(pointer: coarse)').matches) {
          e.preventDefault();
          show();
        }
      }}
    >
      {children}
      {rect && <TipCard rect={rect}>{content}</TipCard>}
    </span>
  );
}

function TipCard({ rect, children }: { rect: DOMRect; children: ReactNode }) {
  const card = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<CSSProperties>({ left: -9999, top: -9999 });
  useLayoutEffect(() => {
    const el = card.current;
    if (!el) return;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const gap = 8;
    const left = Math.max(8, Math.min(window.innerWidth - w - 8, rect.left + rect.width / 2 - w / 2));
    const above = rect.top - h - gap;
    const top = above >= 8 ? above : Math.min(window.innerHeight - h - 8, rect.bottom + gap);
    setStyle({ left, top });
  }, [rect]);
  return createPortal(
    <div ref={card} className="tip-card" style={style} role="tooltip">
      {children}
    </div>,
    document.body,
  );
}

/** En-tête d'une bulle : une icône, un titre, une ligne dessous, des pastilles. */
export function TipHead({ icon, title, sub, color, chips }: { icon?: ReactNode; title: ReactNode; sub?: ReactNode; color?: string; chips?: ReactNode[] }) {
  return (
    <div className="tip-head" style={color ? ({ '--tc': color } as CSSProperties) : undefined}>
      {icon && <span className="tip-icon">{icon}</span>}
      <span className="tip-title">
        <strong>{title}</strong>
        {sub && <span>{sub}</span>}
      </span>
      {chips && chips.length > 0 && <span className="tip-chips">{chips}</span>}
    </div>
  );
}

/** Une ligne d'effet : un pictogramme coloré et une phrase simple. */
export function TipLine({ mark, color, children }: { mark?: ReactNode; color?: string; children: ReactNode }) {
  return (
    <div className="tip-line" style={color ? ({ '--tc': color } as CSSProperties) : undefined}>
      <span className="tip-mark">{mark ?? '•'}</span>
      <span>{children}</span>
    </div>
  );
}

/** Pied de bulle : ce qui manque pour le débloquer, ou un conseil. */
export function TipFoot({ tone = 'muted', children }: { tone?: 'muted' | 'locked' | 'good'; children: ReactNode }) {
  return <div className={`tip-foot ${tone}`}>{children}</div>;
}

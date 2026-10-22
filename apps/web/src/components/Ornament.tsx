import { useEffect, useLayoutEffect, useRef, type CSSProperties } from 'react';
import type { ContentResponse, Ornament, StateView } from '@bramo/shared';

/**
 * Ornements de métier (ornement/README_CLAUDE.md). Quatre PNG transparents en double résolution par ornement :
 * gauche et droite 192×256, centre 128×256 (période de 64 px), badge 128×128. On assemble d'abord la plaque à sa
 * résolution native, exactement comme ornement/tools/finalize.py (une seule surface par coordonnée : les 64 px
 * intérieurs des extrémités sont un raccord dupliqué du centre), puis on la réduit en une fois : aucun joint
 * entre les pièces, quel que soit le zoom. Le pseudo et le titre restent du texte HTML.
 */

const PARTS = ['left', 'right', 'center', 'badge'] as const;
type Parts = Record<(typeof PARTS)[number], HTMLImageElement>;

/** Hauteur de la plaque en px CSS (256 natifs ÷ 2). */
export const PLATE_HEIGHT = 128;

export function ornamentUrl(o: Pick<Ornament, 'profession' | 'rank'>, part: (typeof PARTS)[number]): string {
  return `/ornaments/${o.profession}/${o.rank}/${part}.png`;
}

/** Largeur CSS valide la plus proche par défaut : au moins 192, extrémités de 64 et centre par pas de 32. */
export function plateWidth(width: number): number {
  return Math.max(192, 128 + Math.floor((width - 128) / 32) * 32);
}

/** Titre écrit dans la plaque : le surnom de la commande ; pour une variante en réserve, le surnom affiché du métier. */
export function ornamentTitle(o: Ornament, content: ContentResponse, state?: StateView): string {
  const trial = o.trial ? content.trials[o.trial] : undefined;
  return trial?.nickname ?? state?.skills[o.profession]?.nickname ?? '';
}

const loaded = new Map<string, Promise<Parts>>();
function loadParts(o: Ornament): Promise<Parts> {
  let p = loaded.get(o.id);
  if (!p) {
    p = Promise.all(
      PARTS.map(
        (part) =>
          new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error(`ornement ${o.id} : ${part}.png introuvable`));
            img.src = ornamentUrl(o, part);
          }),
      ),
    ).then(([left, right, center, badge]) => ({ left: left!, right: right!, center: center!, badge: badge! }));
    p.catch(() => loaded.delete(o.id));
    loaded.set(o.id, p);
  }
  return p;
}

/** Assemble la plaque à la résolution native (largeur W, hauteur 256), sans texte. */
function composeNative(parts: Parts, w: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = 256;
  const ctx = c.getContext('2d')!;
  ctx.drawImage(parts.left, 0, 0, 128, 256, 0, 0, 128, 256);
  for (let x = 128; x < w - 128; x += 128) {
    const span = Math.min(128, w - 128 - x);
    ctx.drawImage(parts.center, 0, 0, span, 256, x, 0, span, 256);
  }
  ctx.drawImage(parts.right, 64, 0, 128, 256, w - 128, 0, 128, 256);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(parts.badge, w / 2 - 48, 0, 96, 96);
  return c;
}

/**
 * Plaque d'identité : cadre de l'ornement, pseudo et titre. `width` en px CSS (arrondie à une largeur valide) ;
 * la variable CSS `--plate-scale` réduit toute la plaque (petits écrans, cartes).
 */
export function OrnamentPlate({
  ornament,
  name,
  title,
  width = 320,
  className = '',
}: {
  ornament: Ornament;
  name: string;
  title: string;
  width?: number;
  className?: string;
}) {
  const w = plateWidth(width);
  const ref = useRef<HTMLCanvasElement>(null);
  const native = useRef<HTMLCanvasElement | null>(null);

  // Le rendu suit la taille réellement affichée (échelle CSS × densité de l'écran).
  const paint = () => {
    const canvas = ref.current;
    const src = native.current;
    if (!canvas || !src) return;
    const box = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.round(box.width * dpr));
    canvas.height = Math.max(1, Math.round(box.height * dpr));
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(src, 0, 0, canvas.width, canvas.height);
  };

  useEffect(() => {
    let alive = true;
    native.current = null;
    ref.current?.getContext('2d')?.clearRect(0, 0, ref.current.width, ref.current.height);
    loadParts(ornament)
      .then((parts) => {
        if (!alive) return;
        native.current = composeNative(parts, w * 2);
        paint();
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [ornament.id, w]);

  useLayoutEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => paint());
    ro.observe(canvas);
    const media = matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
    media.addEventListener('change', paint);
    return () => {
      ro.disconnect();
      media.removeEventListener('change', paint);
    };
  }, []);

  return (
    <div className={`ornament-plate ${className}`} style={{ '--plate-w': `${w}px` } as CSSProperties}>
      <canvas ref={ref} className="ornament-frame" aria-hidden="true" />
      <span className="ornament-name" title={name}>
        {name}
      </span>
      <span className="ornament-title" title={title}>
        {title}
      </span>
    </div>
  );
}

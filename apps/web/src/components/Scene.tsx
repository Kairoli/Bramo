import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';

/**
 * Décor d'une bande de salle : une illustration (`public/scenes/<id>.webp`, 3200 × 640), un léger mouvement
 * de parallaxe à la souris, une dérive lente et des particules propres au lieu (braises, brume, runes…).
 * Plusieurs identifiants : fondu enchaîné entre les décors (le quartier des artisans).
 * Placé en premier enfant d'un élément `.band` ; la souris est écoutée sur ce parent.
 */

type Motion = 'rise' | 'fall' | 'drift' | 'twinkle' | 'mist';
type Kind = { motion: Motion; count: number; color: string; size: [number, number]; time: [number, number]; blur?: number };

const EMBER: Kind = { motion: 'rise', count: 22, color: '#FFA45C', size: [2, 4.5], time: [4, 8], blur: 1 };
const DUST: Kind = { motion: 'drift', count: 18, color: '#F1E6D0', size: [1.5, 3], time: [14, 26] };
const MIST: Kind = { motion: 'mist', count: 4, color: '#C9D6DB', size: [220, 420], time: [40, 70] };
const RUNE: Kind = { motion: 'twinkle', count: 16, color: '#B39DF5', size: [3, 6], time: [2.5, 5], blur: 2 };
const STAR: Kind = { motion: 'twinkle', count: 14, color: '#F6F2D8', size: [2, 4], time: [2, 4.5], blur: 1 };
const LEAF: Kind = { motion: 'fall', count: 10, color: '#8DB66A', size: [5, 9], time: [9, 16] };
const POLLEN: Kind = { motion: 'drift', count: 16, color: '#E7F0A8', size: [2, 3.5], time: [12, 22], blur: 1 };
const BUBBLE: Kind = { motion: 'rise', count: 12, color: '#9BE6C0', size: [4, 9], time: [5, 10], blur: 0.5 };
const STEAM: Kind = { motion: 'rise', count: 7, color: '#E7E3DA', size: [26, 50], time: [7, 12], blur: 10 };
const SPARK: Kind = { motion: 'twinkle', count: 10, color: '#4CC9D6', size: [2, 4], time: [1.5, 3.5], blur: 2 };

/** Ce qui flotte dans chaque lieu (identifiants des métiers). */
const EFFECTS: Record<string, Kind[]> = {
  mining: [DUST, { ...MIST, count: 2, color: '#9AA6AA' }],
  woodcutting: [LEAF, MIST],
  fishing: [MIST, STAR],
  herbalism: [POLLEN, MIST],
  hunting: [{ ...DUST, color: '#E8EEF2', count: 22 }, MIST],
  agriculture: [POLLEN, { ...LEAF, count: 6 }],
  smithing: [EMBER, { ...STEAM, count: 3 }],
  carpentry: [{ ...DUST, color: '#E2C58F' }],
  tanning: [{ ...MIST, color: '#A9A18A' }, DUST],
  tailoring: [{ ...DUST, count: 12 }],
  cooking: [{ ...EMBER, count: 10 }, STEAM],
  alchemy: [BUBBLE, { ...STEAM, color: '#BFA9F0', count: 4 }],
  jewelcrafting: [STAR, { ...STAR, color: '#8EE0F0', count: 8 }],
  enchanting: [RUNE, STAR],
  artificing: [SPARK, { ...STEAM, count: 4 }],
  construction: [{ ...DUST, count: 24, color: '#D8CBB4' }],
  exploration: [DUST, STAR],
};

/** Aléa déterministe : un décor a toujours les mêmes particules. */
function rng(seed: string) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function Particles({ id }: { id: string }) {
  const items = useMemo(() => {
    const rand = rng(id);
    const between = ([a, b]: [number, number]) => a + (b - a) * rand();
    return (EFFECTS[id] ?? [DUST]).flatMap((kind, k) =>
      Array.from({ length: kind.count }, (_, i) => ({
        key: `${k}-${i}`,
        kind,
        style: {
          left: `${rand() * 100}%`,
          top: `${kind.motion === 'rise' ? 55 + rand() * 40 : kind.motion === 'fall' ? -5 : 5 + rand() * 85}%`,
          width: between(kind.size),
          height: between(kind.size),
          color: kind.color,
          '--t': `${between(kind.time)}s`,
          '--delay': `${-rand() * 30}s`,
          '--dx': `${(rand() - 0.5) * 80}px`,
          '--blur': `${kind.blur ?? 0}px`,
        } as CSSProperties,
      })),
    );
  }, [id]);
  return (
    <div className="scene-fx" aria-hidden>
      {items.map((p) => (
        <i key={p.key} className={`fx fx-${p.kind.motion}`} style={p.style} />
      ))}
    </div>
  );
}

export function Scene({ ids, interval = 9000 }: { ids: string[]; interval?: number }) {
  const root = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const key = ids.join(',');

  // Fondu enchaîné entre les décors.
  useEffect(() => {
    setActive(0);
    if (ids.length < 2) return;
    const t = window.setInterval(() => setActive((i) => (i + 1) % ids.length), interval);
    return () => window.clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, interval]);

  // Parallaxe : la souris sur la bande décale les calques (variables CSS, sans re-rendu React).
  useEffect(() => {
    const el = root.current;
    const parent = el?.parentElement;
    if (!el || !parent) return;
    const move = (e: PointerEvent) => {
      const r = parent.getBoundingClientRect();
      el.style.setProperty('--px', String(((e.clientX - r.left) / r.width - 0.5) * 2));
      el.style.setProperty('--py', String(((e.clientY - r.top) / r.height - 0.5) * 2));
    };
    const leave = () => {
      el.style.setProperty('--px', '0');
      el.style.setProperty('--py', '0');
    };
    parent.addEventListener('pointermove', move);
    parent.addEventListener('pointerleave', leave);
    return () => {
      parent.removeEventListener('pointermove', move);
      parent.removeEventListener('pointerleave', leave);
    };
  }, []);

  const current = ids[active]!;
  return (
    <div className="scene" ref={root} aria-hidden>
      <div className="scene-back">
        {ids.map((id, i) => (
          <img key={id} className={`scene-img${i === active ? ' on' : ''}`} src={`/scenes/${id}.webp`} alt="" draggable={false} decoding="async" />
        ))}
      </div>
      <div className="scene-front">
        <Particles key={current} id={current} />
      </div>
      <div className="scene-shade" />
    </div>
  );
}

import { useEffect, useId, useMemo, useRef, type CSSProperties } from 'react';
import type { Appearance, ContentResponse, Lod, Slot } from '@bramo/shared';
import { useContent } from '../game/ContentContext';
import { type LoadedPart, animations, parts, rig } from './assets';
import { type Matrix, orderedBones, toSvg, worldMatrices } from './skeleton';
import './rig.css';

const BONES = orderedBones(rig);
const CHILDREN = Object.fromEntries(rig.bones.map((b) => [b.id, rig.bones.filter((c) => c.parent === b.id)]));

interface Layer {
  key: string;
  bone: string;
  z: number;
  markup: string;
  anchor: [number, number];
}

/** Pièces portées : corps de base + tenue + retouches pièce par pièce + arme et effet de la classe. */
export function resolveParts(content: ContentResponse, appearance: Appearance): Partial<Record<Slot, string>> {
  const outfit = content.cosmetics.outfits.find((o) => o.id === appearance.outfit) ?? content.cosmetics.outfits[0]!;
  const cls = content.classes[appearance.classId];
  const chosen: Partial<Record<Slot, string | null>> = {
    body: 'base',
    ...outfit.parts,
    weapon: cls?.weapon ?? null,
    effect: cls?.effect ?? null,
    ...appearance.overrides,
  };
  return Object.fromEntries(Object.entries(chosen).filter(([, id]) => id)) as Partial<Record<Slot, string>>;
}

/** Variables CSS de couleur : palette de la tenue, couleurs du gabarit, couleur d'affinité de la classe. */
function colorVars(content: ContentResponse, appearance: Appearance): CSSProperties {
  const outfit = content.cosmetics.outfits.find((o) => o.id === appearance.outfit) ?? content.cosmetics.outfits[0]!;
  const glow = content.classes[appearance.classId]?.affinityColor ?? '#B39DF5';
  const kebab = (s: string) => s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
  const vars: Record<string, string> = {};
  for (const [role, color] of Object.entries({ ...rig.colors, ...outfit.palette })) vars[`--c-${kebab(role)}`] = color;
  vars['--c-glow'] = glow;
  vars['--c-glow-light'] = `color-mix(in srgb, ${glow} 45%, white)`;
  return vars as CSSProperties;
}

export interface CharacterProps {
  /** Par défaut : l'apparence par défaut de data/cosmetics.yaml. */
  appearance?: Appearance;
  /** portrait (~80 px), scene (~400 px) ou combat. */
  lod?: Lod;
  animate?: boolean;
  showBones?: boolean;
  /** Vue éclatée : écarte les calques selon leur ordre d'empilement. */
  explode?: boolean;
  className?: string;
  title?: string;
}

/**
 * Personnage assemblé à partir de pièces SVG posées sur les os du gabarit.
 * Règle de mise en scène : toujours en trois quarts vers la droite, jamais en miroir.
 */
export function Character({ appearance, lod = 'scene', animate = true, showBones, explode, className, title }: CharacterProps) {
  const content = useContent();
  const look = appearance ?? { outfit: content.cosmetics.default.outfit, classId: content.cosmetics.default.class };
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const level = rig.lods[lod];

  const layers = useMemo<Layer[]>(() => {
    const out: Layer[] = [];
    for (const [slot, id] of Object.entries(resolveParts(content, look))) {
      const part: LoadedPart | undefined = parts[`${slot}/${id}`];
      if (!part) continue;
      for (const l of part.layers) {
        if (l.detail > level.detail) continue;
        out.push({
          key: `${slot}/${id}/${l.id}`,
          bone: l.bone,
          z: l.z,
          markup: part.markup[l.id]!.replaceAll('#rig-', `#${uid}-rig-`),
          anchor: part.anchor,
        });
      }
    }
    return out.sort((a, b) => a.z - b.z);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, JSON.stringify(look), level.detail, uid]);

  const layerRefs = useRef(new Map<string, SVGGElement>());
  const boneRefs = useRef(new Map<string, SVGGElement>());
  const explodeAmount = useRef(0);

  // Boucle d'animation : on écrit directement les attributs transform, sans re-rendu React.
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const anim = animate && !reduced ? (animations.idle ?? null) : null;
    const zs = layers.map((l) => l.z);
    const zMid = (Math.min(...zs) + Math.max(...zs)) / 2;
    let frame = 0;

    const draw = (now: number) => {
      const target = explode ? 1 : 0;
      explodeAmount.current += (target - explodeAmount.current) * (reduced ? 1 : 0.12);
      const world: Record<string, Matrix> = worldMatrices(BONES, anim, now / 1000);
      for (const l of layers) {
        const el = layerRefs.current.get(l.key);
        if (!el) continue;
        const spread = (l.z - zMid) * 3.2 * explodeAmount.current;
        const m = world[l.bone]!;
        el.setAttribute('transform', `translate(${spread.toFixed(2)} 0) ${toSvg(m)}`);
      }
      for (const [id, el] of boneRefs.current) el.setAttribute('transform', toSvg(world[id]!));
      const settling = Math.abs(target - explodeAmount.current) > 0.001;
      if (anim || settling) frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [layers, animate, explode]);

  const [x, y, w, h] = level.viewBox;
  return (
    <svg
      className={`rig rig-${lod}${animate ? '' : ' rig-still'}${className ? ` ${className}` : ''}`}
      viewBox={`${x} ${y} ${w} ${h}`}
      preserveAspectRatio={lod === 'portrait' ? 'xMidYMid slice' : 'xMidYMax meet'}
      style={colorVars(content, look)}
      role="img"
      aria-label={title ?? 'Personnage'}
    >
      <defs>
        <filter id={`${uid}-rig-glow`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id={`${uid}-rig-soft`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="14" />
        </filter>
        {/* Ombre douce côté gauche, lumière de contour du sort côté droit. */}
        <linearGradient id={`${uid}-rig-shade`} x1="0" x2="1">
          <stop offset="0" stopColor="#000" stopOpacity=".35" />
          <stop offset=".55" stopColor="#000" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${uid}-rig-light`} x1="0" x2="1">
          <stop offset=".45" stopColor="var(--c-glow)" stopOpacity="0" />
          <stop offset="1" stopColor="var(--c-glow)" stopOpacity=".22" />
        </linearGradient>
        <linearGradient id={`${uid}-rig-hood`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0B0D10" stopOpacity=".92" />
          <stop offset=".75" stopColor="#0B0D10" stopOpacity=".75" />
          <stop offset="1" stopColor="#0B0D10" stopOpacity="0" />
        </linearGradient>
      </defs>

      {layers.map((l) => (
        <g
          key={l.key}
          data-layer={l.key}
          ref={(el) => {
            if (el) layerRefs.current.set(l.key, el);
            else layerRefs.current.delete(l.key);
          }}
        >
          <g
            transform={l.anchor[0] || l.anchor[1] ? `translate(${l.anchor[0]} ${l.anchor[1]})` : undefined}
            dangerouslySetInnerHTML={{ __html: l.markup }}
          />
        </g>
      ))}

      {showBones && (
        <g className="rig-bones">
          {BONES.map((b) => (
            <g
              key={b.id}
              ref={(el) => {
                if (el) boneRefs.current.set(b.id, el);
                else boneRefs.current.delete(b.id);
              }}
            >
              {CHILDREN[b.id]!.map((c) => (
                <line key={c.id} x1={b.pivot[0]} y1={b.pivot[1]} x2={c.pivot[0]} y2={c.pivot[1]} />
              ))}
              <circle cx={b.pivot[0]} cy={b.pivot[1]} r={4} />
              <title>{b.id}</title>
            </g>
          ))}
        </g>
      )}
    </svg>
  );
}

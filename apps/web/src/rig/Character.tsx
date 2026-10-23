import { useEffect, useId, useMemo, useRef, type CSSProperties } from 'react';
import type { Appearance, ContentResponse, Lod, Pose, Slot } from '@bramo/shared';
import { outfitPalette, outfitParts } from '@bramo/shared';
import { useContent } from '../game/ContentContext';
import { type LoadedPart, animations, parts, poses, rig } from './assets';
import { type Matrix, orderedBones, toSvg, worldMatrices } from './skeleton';
import './rig.css';

const BONES = orderedBones(rig);
const CHILDREN = Object.fromEntries(rig.bones.map((b) => [b.id, rig.bones.filter((c) => c.parent === b.id)]));

interface Layer {
  key: string;
  slot: string;
  bone: string;
  z: number;
  markup: string;
  anchor: [number, number];
}

/** Pose de la classe (plus tard : de la voie) ; la pose de référence si la classe n'en a pas. */
export function poseFor(content: ContentResponse, appearance: Appearance): Pose | null {
  const id = content.classes[appearance.classId]?.pose;
  return (id && poses[id]) || null;
}

/** Pièces portées : corps de la pose + tenue + retouches pièce par pièce + arme et effet de la classe. */
export function resolveParts(content: ContentResponse, appearance: Appearance): Partial<Record<Slot, string>> {
  const outfit = content.cosmetics.outfits.find((o) => o.id === appearance.outfit) ?? content.cosmetics.outfits[0]!;
  const cls = content.classes[appearance.classId];
  const chosen: Partial<Record<Slot, string | null>> = {
    body: poseFor(content, appearance)?.body ?? 'base',
    ...outfitParts(outfit, appearance.classId),
    weapon: cls?.weapon ?? null,
    effect: cls?.effect ?? null,
    ...appearance.overrides,
  };
  return Object.fromEntries(Object.entries(chosen).filter(([, id]) => id)) as Partial<Record<Slot, string>>;
}

/** Variables CSS de couleur : palette de la tenue, couleurs du gabarit, couleur d'affinité de la classe. */
export function colorVars(content: ContentResponse, appearance: Appearance): CSSProperties {
  const outfit = content.cosmetics.outfits.find((o) => o.id === appearance.outfit) ?? content.cosmetics.outfits[0]!;
  const palette = outfitPalette(outfit, appearance.classId);
  const glow = palette.glow ?? content.classes[appearance.classId]?.affinityColor ?? '#B39DF5';
  const kebab = (s: string) => s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
  const vars: Record<string, string> = {};
  for (const [role, color] of Object.entries({ ...rig.colors, ...palette })) if (color) vars[`--c-${kebab(role)}`] = color;
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
  /** Met une pièce en valeur (survol d'un emplacement) : les autres calques s'estompent. */
  highlight?: Slot[] | null;
  /**
   * Action jouée une fois par-dessus le repos : animation (`art/rig/animations`), instant `at` (performance.now, ms) où elle
   * en est à `t0` secondes, et vitesse `rate` (1 par défaut ; 0 la fige, pour régler une image).
   */
  action?: { anim: string; at: number; t0?: number; rate?: number } | null;
  /**
   * Cadre centré sur l'axe du corps (pied de l'os racine) plutôt que sur la scène, qui laisse de la place à droite pour
   * l'arme et les effets : pour un portrait en pied aligné sur autre chose (ornement, nom).
   */
  centered?: boolean;
  className?: string;
  /**
   * Foule (bourg, place du clan) : sans lueurs ni matières, et repos animé à 20 images par seconde au lieu de 60 (mesure
   * du 23 octobre, art/perf.mjs : la moitié du coût d'affichage, invisible à la taille d'un doigt).
   */
  crowd?: boolean;
  title?: string;
}

/** Apparence par défaut (data/cosmetics.yaml) tant que le personnage n'en a pas d'autre. */
export function useLook(appearance?: Appearance): Appearance {
  const content = useContent();
  return appearance ?? { outfit: content.cosmetics.default.outfit, classId: content.cosmetics.default.class };
}

/** Dégradés et filtres partagés par les pièces (ids rendus uniques par `uid`). */
export function RigDefs({ uid }: { uid: string }) {
  return (
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
      {/* Matières partagées, sans couleur propre : reflet de métal (diagonale), grain de cuir, tissage, mailles. */}
      <linearGradient id={`${uid}-rig-sheen`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#fff" stopOpacity=".34" />
        <stop offset=".3" stopColor="#fff" stopOpacity=".06" />
        <stop offset=".62" stopColor="#000" stopOpacity="0" />
        <stop offset="1" stopColor="#000" stopOpacity=".34" />
      </linearGradient>
      <linearGradient id={`${uid}-rig-fold`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#000" stopOpacity=".3" />
        <stop offset=".35" stopColor="#fff" stopOpacity=".08" />
        <stop offset=".6" stopColor="#000" stopOpacity=".18" />
        <stop offset="1" stopColor="#fff" stopOpacity=".06" />
      </linearGradient>
      <pattern id={`${uid}-rig-grain`} width="7" height="7" patternUnits="userSpaceOnUse">
        <circle cx="1.4" cy="1.6" r=".8" fill="#000" fillOpacity=".2" />
        <circle cx="5" cy="4.6" r=".7" fill="#fff" fillOpacity=".12" />
        <circle cx="3" cy="6" r=".5" fill="#000" fillOpacity=".14" />
      </pattern>
      <pattern id={`${uid}-rig-weave`} width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(32)">
        <path d="M0 .5H5" stroke="#000" strokeOpacity=".2" strokeWidth=".8" />
        <path d="M.5 0V5" stroke="#fff" strokeOpacity=".1" strokeWidth=".8" />
      </pattern>
      <pattern id={`${uid}-rig-mail`} width="6" height="5" patternUnits="userSpaceOnUse">
        <path d="M0 3.6Q3 -.4 6 3.6" fill="none" stroke="#000" strokeOpacity=".32" strokeWidth=".9" />
        <path d="M0 1.4Q3 -2.6 6 1.4" fill="none" stroke="#fff" strokeOpacity=".12" strokeWidth=".7" />
      </pattern>
      {/* Fausses lueurs (halo sans flou, 23 octobre) : le flou de rig-glow est ce qui coûte le plus à l'affichage. */}
      <radialGradient id={`${uid}-rig-halo`}>
        <stop offset="0" stopColor="var(--c-glow)" stopOpacity=".8" />
        <stop offset=".45" stopColor="var(--c-glow)" stopOpacity=".3" />
        <stop offset="1" stopColor="var(--c-glow)" stopOpacity="0" />
      </radialGradient>
      <radialGradient id={`${uid}-rig-halo-trim`}>
        <stop offset="0" stopColor="var(--c-trim)" stopOpacity=".85" />
        <stop offset=".45" stopColor="var(--c-trim)" stopOpacity=".3" />
        <stop offset="1" stopColor="var(--c-trim)" stopOpacity="0" />
      </radialGradient>
      <linearGradient id={`${uid}-rig-hood`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#0B0D10" stopOpacity=".92" />
        <stop offset=".75" stopColor="#0B0D10" stopOpacity=".75" />
        <stop offset="1" stopColor="#0B0D10" stopOpacity="0" />
      </linearGradient>
    </defs>
  );
}

/**
 * Personnage assemblé à partir de pièces SVG posées sur les os du gabarit.
 * Règle de mise en scène : toujours en trois quarts vers la droite, jamais en miroir.
 */
export function Character({
  appearance,
  lod = 'scene',
  animate = true,
  showBones,
  explode,
  highlight,
  action,
  centered,
  className,
  title,
  crowd,
}: CharacterProps) {
  const content = useContent();
  const look = useLook(appearance);
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
          slot,
          bone: l.bone,
          z: l.z,
          markup: part.markup[l.id]!.replaceAll('#rig-', `#${uid}-rig-`).replaceAll('id="rig-', `id="${uid}-rig-`),
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
  const pose = poseFor(content, look);
  // L'action se lit à chaque image : en changer ne relance pas la boucle d'animation.
  const actionRef = useRef(action);
  actionRef.current = action;

  // Boucle d'animation : on écrit directement les attributs transform, sans re-rendu React.
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // « Réduire les animations » : respiration de repos plus douce (40 % d'amplitude) ; les effets des pièces (CSS)
    // continuent, plus lents (rig.css).
    const anim = animate ? (animations[pose?.animation ?? 'idle'] ?? null) : null;
    const gain = reduced ? 0.4 : 1;
    const offsets = pose?.bones ?? {};
    const zs = layers.map((l) => l.z);
    const zMid = (Math.min(...zs) + Math.max(...zs)) / 2;
    let frame = 0;
    let last = -1;

    const draw = (now: number) => {
      // Foule : tous les personnages avancent sur la même horloge (20 images par seconde), dans la même image : les autres
      // images n'ont rien à redessiner (mesure du 23 octobre, scène de la Marée : 6 → voir art/perf.mjs).
      const slot = Math.floor(now / 50);
      if (crowd && slot === last) {
        frame = requestAnimationFrame(draw);
        return;
      }
      last = slot;
      const target = explode ? 1 : 0;
      explodeAmount.current += (target - explodeAmount.current) * (reduced ? 1 : 0.12);
      const act = actionRef.current;
      const actAnim = act ? animations[act.anim] : undefined;
      const actT = act ? (act.t0 ?? 0) + ((now - act.at) / 1000) * (act.rate ?? 1) : 0;
      const playing = actAnim && actT >= 0 && actT < actAnim.duration ? { anim: actAnim, t: actT } : null;
      const world: Record<string, Matrix> = worldMatrices(BONES, anim, now / 1000, offsets, gain, playing);
      for (const l of layers) {
        const el = layerRefs.current.get(l.key);
        if (!el) continue;
        const spread = (l.z - zMid) * 3.2 * explodeAmount.current;
        const m = world[l.bone]!;
        el.setAttribute('transform', `translate(${spread.toFixed(2)} 0) ${toSvg(m)}`);
      }
      for (const [id, el] of boneRefs.current) el.setAttribute('transform', toSvg(world[id]!));
      const settling = Math.abs(target - explodeAmount.current) > 0.001;
      // Sans animation de repos, la boucle tourne encore le temps d'une action (une attaque), puis s'arrête.
      const acting = !!actAnim && actT < actAnim.duration;
      if (anim || settling || acting) frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layers, animate, explode, pose, crowd, action?.at]);

  const [x0, y, w, h] = level.viewBox;
  const axis = rig.bones.find((b) => b.id === 'root')?.pivot[0];
  const x = centered && axis !== undefined ? axis - w / 2 : x0;
  return (
    <svg
      className={`rig rig-${lod}${animate ? '' : ' rig-still'}${crowd ? ' rig-crowd' : ''}${className ? ` ${className}` : ''}`}
      viewBox={`${x} ${y} ${w} ${h}`}
      preserveAspectRatio={lod === 'portrait' ? 'xMidYMid slice' : 'xMidYMax meet'}
      style={colorVars(content, look)}
      role="img"
      aria-label={title ?? 'Personnage'}
    >
      <RigDefs uid={uid} />

      {layers.map((l) => (
        <g
          key={l.key}
          data-layer={l.key}
          className={highlight?.length && !highlight.includes(l.slot as Slot) && l.slot !== 'body' ? 'rig-dim' : undefined}
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

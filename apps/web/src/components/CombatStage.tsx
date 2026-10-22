import { memo, useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Appearance, SpellEffects, TimelineEvent } from '@bramo/shared';
import { useContent } from '../game/ContentContext';
import { Character, colorVars, poseFor } from '../rig/Character';
import { animations, rig } from '../rig/assets';
import { apply, orderedBones, worldMatrices } from '../rig/skeleton';
import { BASIC_FX, FxDefs, GESTURE_POINT, SPELL_FX, type Cast, type Pt, type SpellFx, type Stage, type StatusSource, clamp01, easeOut, floatText, statusLayer } from '../combat-fx';
import { Dummy, Shade } from '../combat-fx/enemy';
import { BESTIARY } from '../combat-fx/bestiary';
import { StatusBadges } from '../combat-fx/badges';

/**
 * Scène de combat : le personnage à gauche, l'ennemi à droite, et le déroulé du combat (`timeline`) rejoué à l'écran au
 * rythme de l'horloge du combat (`clock`). Chaque sort a son geste et son effet propres (`combat-fx/`). Tout se dessine à
 * partir du temps : rejoindre un combat en cours, ou rejouer, donne la même image. Le serveur reste seul juge.
 */

const BONES = orderedBones(rig);
const VB = rig.lods.scene.viewBox;
const MemoCharacter = memo(Character);

export const ELEMENT_COLOR: Record<string, string> = { physical: '#EDE6D2', fire: '#FF8A3D', frost: '#9FD8FF', lightning: '#E2CCFF' };

export interface StageEnemy {
  count: number;
  kind: 'shadow' | 'dummy';
  /** Rencontre : son ennemi du bestiaire (sinon l'Ombre de la Marée). */
  id?: string | null;
}

export interface StageSpell {
  name: string;
  element: string;
  effects?: SpellEffects;
}

export interface CombatStageProps {
  look: Appearance;
  enemy: StageEnemy | null;
  timeline: TimelineEvent[];
  /** Temps du combat en cours (s) à cet instant ; null : pas de combat, le personnage attend. */
  clock: () => number | null;
  /** Fin du combat (s) : victoire ou défaite à cet instant. */
  fightTime: number | null;
  win: boolean | null;
  spells?: Record<string, StageSpell>;
  /** Vitesse de l'horloge (1 en jeu ; ralenti ou image figée dans l'Arène). */
  timeScale?: number;
  /** Place laissée en haut et en bas pour ce qui est posé par-dessus la scène (bandeau d'étape, barre de sorts), en px. */
  insetTop?: number;
  insetBottom?: number;
}

const isPlayer = (e: TimelineEvent) => e.kind === 'basic' || e.kind === 'cast';

/** Effet d'un événement du personnage : son sort, ou l'attaque de base de la classe. */
export function fxOf(classId: string, e: TimelineEvent): SpellFx {
  return (e.kind === 'cast' && e.spell ? SPELL_FX[e.spell] : undefined) ?? BASIC_FX[classId] ?? BASIC_FX.runist!;
}
/** Temps entre le début du geste et l'arrivée sur l'ennemi. */
export function leadOf(fx: SpellFx): number {
  return (animations[fx.gesture]?.impact ?? 0.3) + fx.travel;
}
/** Temps entre le début de l'attaque de base d'une classe et le coup porté. */
export const attackLead = (classId: string) => leadOf(BASIC_FX[classId] ?? BASIC_FX.runist!);

/** Redessine à chaque image tant que la scène est montée. */
function useFrame(): number {
  const [now, setNow] = useState(() => performance.now());
  useEffect(() => {
    let id = 0;
    const loop = (t: number) => {
      setNow(t);
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, []);
  return now;
}

function useSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setSize({ w: e!.contentRect.width, h: e!.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, size] as const;
}

export function CombatStage({ look, enemy, timeline, clock, fightTime, win, spells, timeScale = 1, insetTop = 0, insetBottom = 0 }: CombatStageProps) {
  const content = useContent();
  const now = useFrame();
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const [ref, { w, h }] = useSize<HTMLDivElement>();
  const reduced = useMemo(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches, []);
  const classId = look.classId;
  const offsets = poseFor(content, look)?.bones ?? {};
  const glow = content.classes[classId]?.affinityColor ?? '#B39DF5';

  // Repères de la scène, en pixels : le personnage tient la hauteur (au plus 42 % de la largeur, pour une scène étroite
  // comme le panneau de l'accueil), pieds en bas ; l'ennemi lui fait face.
  const sh = Math.max(0, Math.min(h - insetTop - insetBottom, w * 0.42));
  const top = h - insetBottom - sh;
  const k = sh / VB[3]!;
  const charW = VB[2]! * k;
  const creature = enemy?.kind === 'shadow' && enemy.id ? BESTIARY[enemy.id] : undefined;
  // Un gardien est plus grand que les ennemis ordinaires.
  const enemyH = sh * 0.74 * (creature?.scale ?? 1);
  const total = enemy?.count ?? 0;
  const shown = Math.min(3, total);
  // Le duel est centré : personnage, écart, ennemi (et ceux derrière lui). Une scène large garde plus d'air entre eux.
  const enemyW = enemyH * 0.8 + Math.max(0, shown - 1) * enemyH * 0.42;
  const gap = Math.min(Math.max(170 * k, w * 0.2), w * 0.36);
  const charLeft = Math.max(8, (w - (charW * 0.8 + gap + enemyW)) / 2 - charW * 0.1);
  const toPx = ([x, y]: Pt): Pt => [charLeft + (x - VB[0]!) * k, top + (y - VB[1]!) * k];
  const groundY = top + (700 - VB[1]!) * k;
  const enemyX = charLeft + charW * 0.9 + gap + enemyH * 0.4;
  const figX = (j: number) => enemyX + j * enemyH * 0.42;
  const hits: Pt[] = Array.from({ length: Math.max(1, shown) }, (_, j) => [figX(j) - enemyH * 0.12 * (j ? 0.82 : 1), groundY - enemyH * 0.5 * (j ? 0.82 : 1)]);
  const st: Stage = { w, h, k, toPx, groundY, chest: toPx([212, 270]), feet: toPx([205, 700]), enemyX, enemyH, hits, reduced, now };

  const c = clock();
  const events = c === null ? [] : timeline;

  // Action en cours du personnage : le dernier geste commencé.
  const actionRef = useRef<{ i: number; scale: number; action: { anim: string; at: number; t0: number; rate: number } } | null>(null);
  let acting = -1;
  let actingFx: SpellFx | null = null;
  if (c !== null) {
    for (let i = 0; i < events.length; i++) {
      const e = events[i]!;
      if (!isPlayer(e)) continue;
      const fx = fxOf(classId, e);
      const start = e.t - leadOf(fx);
      if (start > c) continue;
      if (c - start < (animations[fx.gesture]?.duration ?? 1)) {
        acting = i;
        actingFx = fx;
      }
    }
  }
  if (acting < 0) actionRef.current = null;
  else if (actionRef.current?.i !== acting || actionRef.current.scale !== timeScale || timeScale === 0) {
    const e = events[acting]!;
    const start = e.t - leadOf(actingFx!);
    actionRef.current = { i: acting, scale: timeScale, action: { anim: actingFx!.gesture, at: now, t0: c! - start, rate: timeScale } };
  }

  const layers: ReactNode[] = [];
  const texts: ReactNode[] = [];
  const statuses: StatusSource[] = [];
  let hurt = 0;
  let knock = 0;
  let lunge = 0;
  let windup = 0;
  let shake = 0;
  let playerHit = 0;
  let hp = 1;
  let self = 1;
  let kills = 0;
  let dying = -1;
  let numbers = 0;

  if (c !== null && w > 0) {
    for (let i = 0; i < events.length; i++) {
      const e = events[i]!;
      if (e.t <= c) {
        if (e.hp !== undefined) hp = e.hp;
        if (e.self !== undefined) self = e.self;
      }
      if (e.kind === 'kill' && e.t <= c) {
        kills++;
        if (c - e.t < 0.9) dying = e.t;
      }
      if (isPlayer(e)) {
        const fx = fxOf(classId, e);
        const anim = animations[fx.gesture];
        const impact = anim?.impact ?? 0.3;
        const start = e.t - impact - fx.travel;
        const spell = e.spell ? spells?.[e.spell] : undefined;
        const col = fx.col ?? (e.kind === 'cast' && spell && classId === 'runist' ? (ELEMENT_COLOR[spell.element] ?? glow) : glow);
        if (spell?.effects && e.t <= c) statuses.push({ e, classId, effects: spell.effects, col });
        const after = c - e.t;
        if (after >= 0 && after < 0.22) {
          hurt = Math.max(hurt, 1 - after / 0.18);
          knock = Math.max(knock, (1 - after / 0.22) * 14 * k * (e.crit ? 1.5 : 1));
        }
        if (e.crit && after >= 0 && after < 0.25 && !reduced) shake = Math.max(shake, (1 - after / 0.25) * 5);
        if (spell?.effects?.ultimate && after >= 0 && after < 0.4 && !reduced) shake = Math.max(shake, (1 - after / 0.4) * 9);
        if (c >= start - 0.05 && c <= e.t + (fx.after ?? 0.9) + 2) {
          const gp = GESTURE_POINT[fx.gesture] ?? GESTURE_POINT.attack_runist!;
          const from = (tau = impact): Pt =>
            toPx(apply(worldMatrices(BONES, null, 0, offsets, 1, anim ? { anim, t: Math.max(0, Math.min(tau, anim.duration)) } : null)[gp.bone]!, gp.point));
          const cs: Cast = {
            i,
            e,
            c,
            start,
            release: e.t - fx.travel,
            tau: c - start,
            sinceRelease: c - (e.t - fx.travel),
            after,
            s: e.crit ? 1.35 : 1,
            crit: !!e.crit,
            col,
            hot: fx.hot ?? '#FFFFFF',
            from,
            effects: spell?.effects ?? null,
          };
          layers.push(<g key={`p${i}`}>{fx.render(st, cs)}</g>);
          // Nom du sort au-dessus du personnage pendant le geste.
          if (e.kind === 'cast' && spell && c >= start && c < e.t + 0.6) {
            const u = (c - start) / (e.t + 0.6 - start);
            texts.push(
              <text key={`n${i}`} className="stage-text" x={toPx([212, 0])[0]} y={toPx([0, -14])[1] - u * 6 * k} fill={col} opacity={Math.min(1, (1 - u) * 3, u * 8)} fontSize={Math.max(12, 28 * k)}>
                {spell.name}
              </text>,
            );
          }
        }
        if (e.dmg && after >= 0 && after < 0.9) {
          // Ils montent du haut du corps de l'ennemi, sous sa barre de vie, un peu décalés les uns des autres.
          const p: Pt = [hits[0]![0] + enemyH * 0.12 + ((numbers++ % 3) - 1) * 26 * k, hits[0]![1] - enemyH * 0.12];
          texts.push(<g key={`d${i}`}>{floatText(p, after / 0.9, e.crit ? `${e.dmg} !` : `${e.dmg}`, e.crit ? '#FFD45A' : '#FFFFFF', Math.max(12, (e.crit ? 40 : 28) * k), 50 * k)}</g>);
        }
        if (e.crit && after >= 0 && after < 0.9) texts.push(<g key={`c${i}`}>{floatText([hits[0]![0], hits[0]![1] - enemyH * 0.6], after / 0.9, 'Critique !', '#FFD45A', Math.max(12, 30 * k), 30 * k)}</g>);
      } else if (e.kind === 'attack' || e.kind === 'charge') {
        const big = e.kind === 'charge';
        const span = big ? 0.45 : 0.32;
        if (c > e.t - span && c < e.t + 0.25) {
          const u = c < e.t ? (c - (e.t - span)) / span : 1 - (c - e.t) / 0.25;
          lunge = Math.max(lunge, Math.sin((u * Math.PI) / 2) * (big ? 80 : 46) * k);
        }
        if (big && c > e.t - 1.2 && c < e.t) windup = Math.max(windup, (c - (e.t - 1.2)) / 1.2);
        const after = c - e.t;
        if (after >= 0 && after < 0.35) {
          playerHit = Math.max(playerHit, 1 - after / 0.35);
          const [cx, cy] = toPx([240, 300]);
          const u = easeOut(clamp01(after / 0.12));
          const len = (big ? 120 : 80) * k;
          layers.push(
            <g key={`h${i}`} opacity={1 - after / 0.35} stroke="#FF7C7C" strokeLinecap="round" filter="url(#fx-glow)">
              {(big ? [-1, 0, 1] : [0, 1]).map((j) => (
                <line key={j} x1={cx - len / 2 + j * 14 * k} y1={cy - len / 2} x2={cx - len / 2 + j * 14 * k + len * u} y2={cy - len / 2 + len * u} strokeWidth={(big ? 7 : 5) * k} />
              ))}
            </g>,
          );
        }
        if (e.dmg && after >= 0 && after < 0.9) texts.push(<g key={`r${i}`}>{floatText(toPx([360, 300]), after / 0.9, `−${e.dmg}`, '#FF8C8C', Math.max(11, 26 * k), 40 * k)}</g>);
      } else if (e.kind === 'break' && c >= e.t && c < e.t + 1) {
        texts.push(<g key={`b${i}`}>{floatText([hits[0]![0], hits[0]![1] - enemyH * 0.7], c - e.t, 'Rupture !', '#E3C770', Math.max(13, 34 * k), 24 * k)}</g>);
      }
    }
  }

  const over = c !== null && fightTime !== null && c >= fightTime;
  const alive = over && win ? 0 : Math.max(0, total - kills);
  const status = c !== null && w > 0 ? statusLayer(st, statuses, c, alive > 0) : { back: null, front: null };
  const appear = c === null ? 0 : clamp01(c / 0.5);
  const t = now / 1000;
  const bob = reduced ? 0 : Math.sin(t * 1.9) * 3 * k;
  const shakeX = shake ? Math.sin(now / 18) * shake : 0;
  const hitX = playerHit && !reduced ? Math.sin(now / 22) * 5 * k * playerHit : 0;
  const barW = Math.max(90, enemyH * 0.75);
  const barH = Math.max(5, 9 * k);

  return (
    <div className="combat-stage" ref={ref} style={{ transform: shakeX ? `translateX(${shakeX}px)` : undefined }}>
      {w > 0 && (
        <>
          <div className="combat-stage-vignette" />
          <svg className="combat-stage-fx combat-stage-back" width={w} height={h}>
            {status.back}
          </svg>
          <div className="combat-stage-char" style={{ left: charLeft, width: charW, height: sh, bottom: insetBottom, transform: hitX ? `translateX(${hitX}px)` : undefined }}>
            <MemoCharacter appearance={look} lod="scene" action={actionRef.current?.action ?? null} />
            {playerHit > 0 && <div className="combat-stage-hurt" style={{ opacity: playerHit * 0.5 }} />}
          </div>
          <svg className="combat-stage-fx" width={w} height={h} style={colorVars(content, look)}>
            <FxDefs k={k} />
            {enemy && total > 0 && (
              <g opacity={appear}>
                {windup > 0 && <ellipse cx={enemyX} cy={groundY - enemyH * 0.45} rx={enemyH * 0.45} ry={enemyH * 0.55} fill="#FF5A3D" opacity={windup * 0.4} filter="url(#fx-soft)" />}
                {Array.from({ length: shown }, (_, j) => shown - 1 - j).map((j) => {
                  const isShown = j < alive;
                  const isDying = !isShown && dying >= 0 && j === alive;
                  if (!isShown && !isDying) return null;
                  const fade = isDying ? 1 - (c! - dying) / 0.9 : 1;
                  const sc = (enemyH / 260) * (j === 0 ? 1 : 0.82);
                  const x = figX(j) + (j === 0 ? knock - lunge : 0);
                  return (
                    <g key={j} opacity={Math.max(0, fade) * (j === 0 ? 1 : 0.7)} transform={`translate(${x} ${groundY + (j === 0 || creature ? 0 : bob * 0.5)}) scale(${sc})`}>
                      {enemy.kind === 'dummy' ? (
                        <Dummy hurt={j === 0 ? hurt : 0} />
                      ) : creature ? (
                        <g style={j === 0 && hurt > 0 ? { filter: `brightness(${1 + hurt * 0.9})` } : undefined}>
                          <g transform="translate(-100 -260)">{creature.draw({ t: t + j * 1.3, strike: j === 0 ? Math.min(1, lunge / (46 * k)) : 0, hurt: j === 0 ? hurt : 0, u: `${uid}e${j}` })}</g>
                        </g>
                      ) : (
                        <Shade t={t + j * 1.3} hurt={j === 0 ? hurt : 0} uid={`${uid}e${j}`} />
                      )}
                    </g>
                  );
                })}
                {dying >= 0 &&
                  Array.from({ length: 10 }, (_, j) => {
                    const u = (c! - dying) / 0.9;
                    const x = enemyX + (Math.sin(j * 7.3) * 0.5) * 140 * k;
                    return <circle key={j} cx={x} cy={groundY - enemyH * 0.5 - (20 + 180 * ((j * 0.37) % 1)) * k * u} r={(4 + 6 * ((j * 0.53) % 1)) * k} fill={creature?.glow ?? '#4CC9D6'} opacity={(1 - u) * 0.6} />;
                  })}
              </g>
            )}
            {status.front}
            {layers}
            {texts}
            {/* Barres de vie : l'ennemi au-dessus de sa tête, le personnage au-dessus de la sienne. */}
            {enemy?.kind === 'shadow' && alive > 0 && c !== null && (
              <g transform={`translate(${enemyX - barW / 2} ${groundY - enemyH - 26 * k})`} opacity={appear}>
                <rect width={barW} height={barH} rx={barH / 2} fill="rgb(0 0 0 / .65)" stroke="rgb(255 255 255 / .18)" />
                <rect width={barW * hp} height={barH} rx={barH / 2} fill="#E5484D" />
              </g>
            )}
            {enemy?.kind === 'shadow' && c !== null && (
              <g transform={`translate(${toPx([212, 0])[0] - barW * 0.35} ${Math.max(4, toPx([0, 4])[1])})`}>
                <rect width={barW * 0.7} height={barH} rx={barH / 2} fill="rgb(0 0 0 / .65)" stroke="rgb(255 255 255 / .18)" />
                <rect width={barW * 0.7 * clamp01(self)} height={barH} rx={barH / 2} fill="#5FD39A" />
              </g>
            )}
            {over && (
              <text className="stage-text stage-result" x={(charLeft + charW + enemyX) / 2} y={top + sh * 0.42} fill={win ? 'var(--good)' : 'var(--alert)'} opacity={clamp01((c! - fightTime!) / 0.3)} fontSize={Math.max(16, 52 * k)}>
                {win ? 'Victoire' : 'Défaite'}
              </text>
            )}
          </svg>
          {/* États en icônes sous les barres de vie : ce que subit l'ennemi, la protection du personnage. */}
          {enemy?.kind === 'shadow' && c !== null && alive > 0 && <StatusBadges sources={statuses} c={c} side="enemy" x={enemyX} y={groundY - enemyH - 26 * k + barH + 5} center />}
          {enemy?.kind === 'shadow' && c !== null && <StatusBadges sources={statuses} c={c} side="self" x={toPx([212, 0])[0]} y={Math.max(4, toPx([0, 4])[1]) + barH + 5} center />}
        </>
      )}
    </div>
  );
}

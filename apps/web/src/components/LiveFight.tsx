import { useEffect, useMemo } from 'react';
import type { CombatView, TimelineEvent } from '@bramo/shared';
import { api } from '../api';
import { useGame } from '../game/GameContext';
import { CombatStage } from './CombatStage';

/** Intervalle des coups d'essai sur le mannequin du Terrain d'entraînement (décor seulement : l'XP y est continue). */
const TRAINING_PERIOD = 2.2;

/**
 * Le combat en cours, rejoué à l'écran : la rencontre que le serveur a jouée, au rythme de la barre de progression. Au
 * Terrain d'entraînement, le personnage frappe un mannequin ; sans combat, il attend.
 */
export function LiveFight({ view, insetTop, insetBottom }: { view: CombatView; insetTop?: number; insetBottom?: number }) {
  const { look, receivedAt, act } = useGame();
  const a = view.activity;
  // Une rencontre finit avant le prochain signe de vie : on redemande l'état à ce moment-là, pour enchaîner la suivante.
  // Un combat qui vient d'être lancé n'a pas encore de rencontre : on la demande tout de suite.
  const left = a?.fightMs ? a.fightMs - a.progressMs : a && a.encounter !== null ? 0 : null;
  useEffect(() => {
    if (left === null) return;
    const id = window.setTimeout(() => void act(api.state), Math.max(800, left - (Date.now() - receivedAt) + 300));
    return () => window.clearTimeout(id);
  }, [left, receivedAt, act]);
  const training = !!a && a.encounter === null;
  const spells = useMemo(() => Object.fromEntries(view.spells.map((s) => [s.id, { name: s.name, element: s.element === 'inherit' ? 'physical' : s.element, effects: s.effects }])), [view.spells]);
  const timeline = useMemo<TimelineEvent[]>(
    () => (training ? Array.from({ length: 400 }, (_, i) => ({ t: 1.2 + i * TRAINING_PERIOD, kind: 'basic' as const })) : (a?.timeline ?? [])),
    [training, a?.timeline],
  );
  if (!look) return null;
  const clock = () => {
    if (!a) return null;
    if (training) return ((Date.now() - a.startedAt) / 1000) % (400 * TRAINING_PERIOD);
    return a.timeline ? (a.progressMs + (Date.now() - receivedAt)) / 1000 : null;
  };
  return (
    <CombatStage
      look={look}
      enemy={a ? { count: a.enemies, kind: training ? 'dummy' : 'shadow', id: a.encounter } : null}
      timeline={timeline}
      clock={clock}
      fightTime={training ? null : (a?.fightTime ?? null)}
      win={a?.win ?? null}
      spells={spells}
      insetTop={insetTop}
      insetBottom={insetBottom}
    />
  );
}

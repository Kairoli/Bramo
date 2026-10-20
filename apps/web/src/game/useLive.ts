import { useEffect, useState } from 'react';
import type { Recipe, StateView } from '@bramo/shared';
import { useGame } from './GameContext';

export function useNow(intervalMs = 250): number {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}

/** Dernière fabrication atteignable : quantité demandée, ou moins si les ingrédients manquent. */
function displayTarget(state: StateView, recipe: Recipe): number {
  const a = state.activity!;
  let affordable = Number.POSITIVE_INFINITY;
  for (const i of recipe.inputs) affordable = Math.min(affordable, Math.floor((state.inventory[i.item] ?? 0) / i.qty));
  return Math.min(a.quantity, a.done + affordable);
}

/** Temps réel estimé avant que l'activité en cours s'arrête (pour redemander l'état au serveur). */
export function msUntilActivityEnds(state: StateView, recipe: Recipe): number {
  const a = state.activity!;
  if (a.rate.total <= 0) return Number.POSITIVE_INFINITY;
  return ((displayTarget(state, recipe) - a.done) * a.durationMs - a.progress) / a.rate.total;
}

export interface LiveActivity {
  recipe: Recipe;
  done: number;
  quantity: number;
  /** Avancement de la fabrication en cours, 0 à 1. */
  fraction: number;
  /** Rendement total (présence × bonus) renvoyé par le serveur. */
  rate: number;
  /** Durée réelle d'une fabrication au rendement actuel. */
  realDurationMs: number;
  /** Heure locale estimée de fin. */
  etaAt: number;
  xpPerHour: number;
}

/**
 * Affichage prévisionnel entre deux réponses du serveur (anneau, compteur).
 * Ce n'est qu'une estimation visuelle : la vérité revient à chaque appel au serveur.
 */
export function useLiveActivity(): LiveActivity | null {
  const { state, receivedAt, content } = useGame();
  const now = useNow();
  const a = state.activity;
  const recipe = a && content.recipes[a.recipeId];
  if (!a || !recipe) return null;
  const rate = a.rate.total;
  const target = displayTarget(state, recipe);
  const effective = a.progress + Math.max(0, now - receivedAt) * rate;
  const done = Math.min(target, a.done + Math.floor(effective / a.durationMs));
  const fraction = done >= target ? 0 : (effective % a.durationMs) / a.durationMs;
  const realDurationMs = rate > 0 ? a.durationMs / rate : Number.POSITIVE_INFINITY;
  const remainingMs = (target - done - fraction) * realDurationMs;
  return {
    recipe,
    done,
    quantity: a.quantity,
    fraction,
    rate,
    realDurationMs,
    etaAt: now + remainingMs,
    xpPerHour: (recipe.xp * 3_600_000) / realDurationMs,
  };
}

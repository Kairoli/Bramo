import { useEffect, useState } from 'react';
import { msUntilActivityEnds } from '../game/useLive';
import { api } from '../api';
import { useGame } from '../game/GameContext';
import { useTide } from './Tide';

/**
 * Notifications du navigateur (sortie publique, 23 octobre) : quand plus rien ne tourne (activité finie, file vide), et à
 * l'ouverture des inscriptions de la Marée du soir (19 h), si le personnage n'est pas encore inscrit. Seulement si le joueur les a activées (fenêtre Compte) et que le navigateur les autorise.
 * Elles marchent tant qu'un onglet du jeu est ouvert, même en arrière-plan ; onglet fermé, il faudrait des notifications
 * « push » (un service du navigateur et un envoi par le serveur), à faire plus tard.
 */

const KEY = 'bramo.notifications';

export function notificationsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function notificationsOn(): boolean {
  try {
    return notificationsSupported() && Notification.permission === 'granted' && localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

/** Demande l'autorisation au navigateur, puis retient le choix du joueur. Renvoie l'état obtenu. */
export async function enableNotifications(on: boolean): Promise<boolean> {
  if (!notificationsSupported()) return false;
  if (on && Notification.permission !== 'granted') await Notification.requestPermission();
  const ok = on && Notification.permission === 'granted';
  try {
    localStorage.setItem(KEY, ok ? '1' : '0');
  } catch {
    // Stockage indisponible (navigation privée) : le réglage ne survivra pas au rechargement.
  }
  return ok;
}

function notify(title: string, body: string) {
  if (!notificationsOn() || !document.hidden) return;
  try {
    new Notification(title, { body, tag: title });
  } catch {
    // Certains navigateurs mobiles refusent les notifications hors d'un service : rien à faire.
  }
}

export function Notifier() {
  const { state, content, act } = useGame();
  const tide = useTide();
  const [, setTick] = useState(0);

  // Fin de l'activité : si la file est vide, on prévient ; sinon on redemande l'état à ce moment-là pour recalculer.
  useEffect(() => {
    const a = state.activity;
    const recipe = a && content.recipes[a.recipeId];
    if (!a || !recipe) return;
    const ms = msUntilActivityEnds(state, recipe);
    if (!Number.isFinite(ms) || ms < 0 || ms > 2 ** 31 - 1) return;
    const id = window.setTimeout(() => {
      if (state.queue.length) void act(api.state);
      else notify('Bramo : plus rien ne tourne', `${recipe.name} est terminé. Lancez une autre activité.`);
      setTick((t) => t + 1);
    }, ms + 1000);
    return () => window.clearTimeout(id);
  }, [state, content, act]);

  // La Marée du soir : à l'ouverture des inscriptions, si le personnage n'est pas encore inscrit.
  const opens = tide.view?.registration.start;
  const registered = tide.view?.registration.registered;
  const name = tide.view?.tonight.name;
  useEffect(() => {
    if (!opens || registered) return;
    const ms = opens - Date.now();
    if (ms <= 0 || ms > 2 ** 31 - 1) return;
    const id = window.setTimeout(() => notify('Inscriptions à la Marée du soir', `${name ?? 'La Marée'} : inscrivez-vous avant 20 h pour tenir la digue.`), ms);
    return () => window.clearTimeout(id);
  }, [opens, registered, name]);

  return null;
}

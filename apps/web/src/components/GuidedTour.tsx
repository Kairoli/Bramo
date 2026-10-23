import { useEffect, useState } from 'react';
import { api } from '../api';
import { type Room, useGame } from '../game/GameContext';

/**
 * Tour guidé de la première session [Décidé par Louis, 23 octobre : « un petit tour guidé très très rapide, puis un wiki »].
 * Six étapes, une par salle : le jeu ouvre la salle, l'onglet s'allume, une carte dit l'essentiel en deux phrases. On peut
 * passer à tout moment ; le serveur retient que le tour a été vu (`POST /api/character/tour`).
 */

interface Step {
  room: Room;
  /** Élément à faire briller (un onglet de la barre du haut, ou le bandeau de la Marée). */
  glow: string;
  title: string;
  text: string;
}

const STEPS: Step[] = [
  {
    room: 'home',
    glow: '[data-tour="home"]',
    title: 'Bienvenue à Bramo',
    text: 'Ton personnage travaille même quand tu n’es pas là, jusqu’à 16 h après ta dernière visite. Reviens quand tu veux récupérer ce qu’il a fait.',
  },
  {
    room: 'professions',
    glow: '[data-tour="professions"]',
    title: 'Les métiers',
    text: 'Choisis un métier et lance une activité : récolter, puis fabriquer. Ce que tu produis se vend, ou sert à monter d’autres métiers.',
  },
  {
    room: 'market',
    glow: '[data-tour="market"]',
    title: 'Le marché',
    text: 'Tout se vend entre joueurs. Pressé ? Achète tes matières en gros. Économe ? Récolte-les toi-même. Le petit graphique d’une carte montre le prix du mois.',
  },
  {
    room: 'combat',
    glow: '[data-tour="combat"]',
    title: 'La route',
    text: 'Ton personnage combat tout seul sur la route des Lointains, à côté de son métier. Elle ne finit jamais : chaque tour est plus dur.',
  },
  {
    room: 'clan',
    glow: '[data-tour="clan"]',
    title: 'Les clans',
    text: 'Rejoins un clan pour bâtir ensemble. Chaque ouvrage achevé offre un Banquet : des heures d’XP en plus pour tout le clan.',
  },
  {
    room: 'home',
    glow: '.tide-banner',
    title: 'La Marée du soir',
    text: 'Tous les soirs à 20 h, tout le serveur tient la digue pendant une heure. Inscris-toi entre 19 h et 20 h : ton personnage combattra même si tu te déconnectes.',
  },
];

export function GuidedTour() {
  const { go, act } = useGame();
  const [i, setI] = useState(0);
  const [closed, setClosed] = useState(false);
  const step = STEPS[i]!;
  useEffect(() => {
    if (closed) return;
    go(step.room);
    const el = document.querySelector(step.glow);
    el?.classList.add('tour-glow');
    return () => el?.classList.remove('tour-glow');
    // `go` change à chaque rendu du contexte : on ne rouvre la salle qu'au changement d'étape.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i, closed]);
  if (closed) return null;
  const finish = () => {
    setClosed(true);
    go('home');
    void act(api.tourDone);
  };
  const last = i === STEPS.length - 1;
  return (
    <div className="tour-card" role="dialog" aria-live="polite" aria-label={`Visite guidée, étape ${i + 1} sur ${STEPS.length}`}>
      <span className="tour-step">
        {i + 1} / {STEPS.length}
      </span>
      <strong className="tour-title">{step.title}</strong>
      <p>{step.text}</p>
      <div className="tour-actions">
        {!last && (
          <button className="btn btn-ghost btn-sm" onClick={finish}>
            Passer
          </button>
        )}
        {i > 0 && (
          <button className="btn btn-sm" onClick={() => setI(i - 1)}>
            Retour
          </button>
        )}
        <button className="btn btn-primary btn-sm" onClick={() => (last ? finish() : setI(i + 1))} autoFocus>
          {last ? 'C’est parti !' : 'Suivant'}
        </button>
      </div>
    </div>
  );
}

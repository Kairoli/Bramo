import { useEffect, useState } from 'react';
import type { FirstStepsView } from '@bramo/shared';
import { api } from '../../api';
import { type Room, useGame } from '../../game/GameContext';

/**
 * Premiers pas (relevé en jouant, 23 octobre : « après le tour guidé, l'accueil est vide et on ne sait pas quoi faire »).
 * Une courte liste de choses à essayer, dans l'ordre où le jeu s'ouvre, chacune avec son raccourci. Aucune récompense :
 * c'est un fil à suivre, pas une corvée. Repliée, elle montre la prochaine étape ; elle disparaît une fois tout fait, ou
 * quand on la masque.
 */

type Go = { room: Room } | { open: 'tide' | 'profile' };
interface Step {
  id: string;
  title: string;
  hint: string;
  done: boolean;
  go: Go;
  label: string;
}

const HIDDEN_KEY = 'bramo.firstSteps.hidden';

export function FirstSteps() {
  const { state, content, avatar, go } = useGame();
  const [server, setServer] = useState<FirstStepsView | null>(null);
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(() => {
    try {
      return localStorage.getItem(HIDDEN_KEY) === '1';
    } catch {
      return false;
    }
  });

  // Clan, marché et Marée viennent du serveur : relus de temps en temps, et quand on déplie.
  useEffect(() => {
    if (hidden) return;
    let live = true;
    const load = () => api.firstSteps().then((s) => live && setServer(s)).catch(() => {});
    load();
    const t = window.setInterval(load, 60_000);
    return () => {
      live = false;
      window.clearInterval(t);
    };
  }, [hidden, open]);

  const family = (f: string) => content.professions.filter((p) => p.family === f).map((p) => p.id);
  // Un métier compte dès qu'il a de l'XP, ou qu'une de ses recettes tourne en ce moment.
  const running = state.activity ? content.recipes[state.activity.recipeId]?.profession : undefined;
  const xpIn = (ids: string[]) => ids.some((id) => (state.skills[id]?.xp ?? 0) > 0 || id === running);
  const best = Math.max(0, ...Object.values(state.skills).map((s) => s.level));
  const route = state.combat?.route?.best ?? 0;

  const steps: Step[] = [
    { id: 'harvest', title: 'Lancer une récolte', hint: 'Minage, Bûcheronnage, Pêche… : votre personnage récolte même quand vous n’êtes pas là.', done: xpIn(family('gathering')), go: { room: 'professions' }, label: 'Métiers' },
    { id: 'level', title: 'Monter un métier au niveau 5', hint: 'Lancez-en une centaine, revenez plus tard : 16 h de travail vous attendent.', done: best >= 5, go: { room: 'professions' }, label: 'Métiers' },
    { id: 'craft', title: 'Fabriquer un objet', hint: 'Forge, Menuiserie, Cuisine… : ce qu’il vous manque s’achète au marché.', done: xpIn(family('crafting')), go: { room: 'professions' }, label: 'Métiers' },
    { id: 'market', title: 'Acheter ou vendre au marché', hint: 'Tout passe entre joueurs : c’est le plus court chemin pour monter un métier.', done: !!server?.market, go: { room: 'market' }, label: 'Marché' },
    { id: 'guardian', title: 'Vaincre le premier gardien de la route', hint: 'La route se bat toute seule ; la Préparation de la salle Combat choisit vos sorts.', done: route >= 10, go: { room: 'combat' }, label: 'Combat' },
    { id: 'clan', title: 'Rejoindre un clan', hint: 'Ses bâtiments accélèrent les métiers de tous ses membres.', done: !!server?.clan, go: { room: 'clan' }, label: 'Clan' },
    { id: 'photo', title: 'Choisir sa photo de profil', hint: 'Elle vous suit partout : discussion, clan, classements.', done: !!avatar, go: { open: 'profile' }, label: 'Profil' },
    { id: 'tide', title: 'S’inscrire à la Marée du soir', hint: 'Entre 19 h et 20 h ; à 20 h, tout le serveur tient la digue.', done: !!server?.tide, go: { open: 'tide' }, label: 'Marée' },
  ];
  const done = steps.filter((s) => s.done).length;
  const next = steps.find((s) => !s.done);
  if (hidden || !next || !server) return null;

  const follow = (g: Go) => ('room' in g ? go(g.room) : window.dispatchEvent(new CustomEvent('bramo:open', { detail: g.open })));
  const hide = () => {
    setHidden(true);
    try {
      localStorage.setItem(HIDDEN_KEY, '1');
    } catch {}
  };

  return (
    <section className={`first-steps${open ? ' open' : ''}`} aria-label="Premiers pas">
      <header className="first-steps-head">
        <button className="first-steps-toggle" onClick={() => setOpen(!open)} aria-expanded={open}>
          <span className="first-steps-ring" style={{ '--p': `${(done / steps.length) * 100}%` } as React.CSSProperties}>
            {done}/{steps.length}
          </span>
          <span className="first-steps-title">
            <span className="eyebrow">Premiers pas</span>
            <strong>{next.title}</strong>
          </span>
          <span className="first-steps-chevron" aria-hidden>
            {open ? '▴' : '▾'}
          </span>
        </button>
        {!open && (
          <button className="btn btn-sm btn-primary" onClick={() => follow(next.go)}>
            {next.label}
          </button>
        )}
      </header>
      {open && (
        <>
          <ol className="first-steps-list">
            {steps.map((s) => (
              <li key={s.id} className={s.done ? 'done' : s === next ? 'next' : ''}>
                <span className="first-steps-check" aria-hidden>
                  {s.done ? '✓' : ''}
                </span>
                <span className="first-steps-text">
                  <strong>{s.title}</strong>
                  {!s.done && <span className="muted small">{s.hint}</span>}
                </span>
                {!s.done && (
                  <button className="btn btn-sm" onClick={() => follow(s.go)}>
                    {s.label}
                  </button>
                )}
              </li>
            ))}
          </ol>
          <button className="link small first-steps-hide" onClick={hide}>
            Masquer ces conseils
          </button>
        </>
      )}
    </section>
  );
}

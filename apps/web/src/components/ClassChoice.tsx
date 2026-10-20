import { useState, type CSSProperties } from 'react';
import type { CharacterClass } from '@bramo/shared';
import { api } from '../api';
import { useGame } from '../game/GameContext';
import { Character } from '../rig/Character';
import { Modal } from './ui';

export const STYLE_NAMES: Record<CharacterClass['style'], string> = { melee: 'Mêlée', ranged: 'Tir', magic: 'Magie' };

/** Les trois classes côte à côte, chacune dans sa tenue de départ et sa pose. */
function ClassCards({ onChosen }: { onChosen?: () => void }) {
  const { content, state, act } = useGame();
  const [busy, setBusy] = useState<string | null>(null);
  const classes = Object.values(content.classes);

  const choose = async (c: CharacterClass) => {
    setBusy(c.id);
    const ok = await act(() => api.chooseClass(c.id));
    setBusy(null);
    if (ok) onChosen?.();
  };

  return (
    <div className="class-cards">
      {classes.map((c) => {
        const current = state.classId === c.id;
        const profession = content.professions.find((p) => p.id === c.profession);
        return (
          <article key={c.id} className={`panel class-card${current ? ' current' : ''}`} style={{ '--affinity': c.affinityColor } as CSSProperties}>
            <div className="class-figure sunken">
              <Character appearance={{ classId: c.id, outfit: c.startingOutfit }} lod="scene" title={c.name} />
            </div>
            <div className="class-text">
              <span className="eyebrow" style={{ color: c.affinityColor }}>
                {STYLE_NAMES[c.style]}
                {!c.weapon && ' · visuel à venir'}
              </span>
              <h2>{c.name}</h2>
              <p className="muted">{c.pitch}</p>
              <p className="class-link">
                Métier lié : <strong>{profession?.name}</strong>
                <span className="muted"> · le monter renforcera votre classe</span>
              </p>
            </div>
            <button className="btn btn-primary" disabled={current || busy !== null} onClick={() => choose(c)}>
              {current ? 'Votre classe' : busy === c.id ? 'Un instant…' : `Jouer ${c.name}`}
            </button>
          </article>
        );
      })}
    </div>
  );
}

/** Écran plein, à la première connexion : la classe se choisit avant d'entrer dans le jeu. */
export function ClassScreen() {
  const { name } = useGame();
  return (
    <main className="class-screen">
      <header className="class-head">
        <span className="eyebrow">Bienvenue, {name}</span>
        <h1>Choisissez votre classe</h1>
        <p className="muted">
          Elle se voit à votre tenue, votre pose et votre arme. Vous pourrez en changer à tout moment, gratuitement : rien
          n’est perdu, vos métiers restent les vôtres.
        </p>
      </header>
      <ClassCards />
    </main>
  );
}

/** Changer de classe depuis la salle Personnage. */
export function ClassModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal onClose={onClose} className="class-modal">
      <div className="class-modal-head">
        <div>
          <div className="eyebrow">Changer de classe</div>
          <h2>Gratuit, à tout moment</h2>
        </div>
        <button className="btn btn-sm" onClick={onClose}>
          Fermer
        </button>
      </div>
      <p className="muted">Votre tenue de départ suit la classe ; vos métiers et votre sac ne changent pas.</p>
      <ClassCards onChosen={onClose} />
    </Modal>
  );
}

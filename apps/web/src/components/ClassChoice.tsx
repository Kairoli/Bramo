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

/** Choisir sa tenue : cosmétique, gratuite, avec n'importe quelle classe ; les tenues pas encore débloquées sont estompées. */
export function OutfitModal({ onClose }: { onClose: () => void }) {
  const { content, state, look, act } = useGame();
  const unlocked = new Set(state.unlockedOutfits);
  return (
    <Modal onClose={onClose} className="class-modal outfit-modal">
      <div className="class-modal-head">
        <div>
          <div className="eyebrow">Tenue</div>
          <h2>Votre apparence</h2>
        </div>
        <button className="btn btn-sm" onClick={onClose}>
          Fermer
        </button>
      </div>
      <p className="muted small">Un cosmétique : il ne change ni vos statistiques ni votre classe. Pièce par pièce : le mode Apparence du personnage.</p>
      <div className="class-cards outfit-cards scroll">
        {content.cosmetics.outfits.filter((o) => (!o.id.startsWith('sketch_') || (import.meta.env.DEV && o.id.startsWith('sketch_season_'))) && (!look || o.classes.includes(look.classId))).map((o) => {
          const ok = unlocked.has(o.id);
          const current = look?.outfit === o.id;
          return (
            <article key={o.id} className={`panel class-card${current ? ' current' : ''}${ok ? '' : ' locked'}`}>
              <div className="class-figure sunken" style={ok ? undefined : { opacity: 0.45 }}>
                <Character appearance={{ classId: look?.classId ?? content.cosmetics.default.class, outfit: o.id }} lod="scene" centered />
              </div>
              <div className="class-text">
                <h3>{o.name}</h3>
                <p className="muted">{o.subtitle}</p>
              </div>
              <button
                className="btn btn-primary"
                disabled={!ok || current}
                onClick={async () => {
                  if (await act(() => api.chooseOutfit(o.id))) onClose();
                }}
              >
                {current ? 'Portée' : ok ? 'Enfiler' : 'Pas encore débloquée'}
              </button>
            </article>
          );
        })}
      </div>
    </Modal>
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

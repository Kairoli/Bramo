import { useState } from 'react';
import { api } from '../api';
import { useGame } from '../game/GameContext';
import { Modal } from './ui';
import { OrnamentPlate, ornamentTitle, ornamentUrl } from './Ornament';

/**
 * Choisir l'ornement porté (salle Personnage) : aperçu de la plaque, puis une ligne de badges par métier, du palier 20
 * au 99. Un ornement se débloque avec la commande du maître de son palier ; les autres sont estompés.
 */
export function OrnamentModal({ onClose }: { onClose: () => void }) {
  const { name, content, state, act } = useGame();
  const unlocked = new Set(state.unlockedOrnaments);
  const [picked, setPicked] = useState<string | null>(state.ornament);
  const ornaments = Object.values(content.ornaments);
  const professions = content.professions.filter((p) => ornaments.some((o) => o.profession === p.id));
  const chosen = picked ? content.ornaments[picked] : undefined;

  const wear = async (id: string | null) => {
    if (await act(() => api.chooseOrnament(id))) onClose();
  };

  return (
    <Modal onClose={onClose} className="ornament-modal">
      <div className="class-modal-head">
        <div>
          <div className="eyebrow">Ornement</div>
          <h2>Votre plaque</h2>
        </div>
        <button className="btn btn-sm" onClick={onClose}>
          Fermer
        </button>
      </div>
      <p className="muted">
        Un cadre autour de votre nom, de n’importe quel métier : chacun se gagne avec la commande du maître de son palier.
        {content.settings.ornaments.unlockAll && ' Essais : tous sont ouverts, variantes du palier 90 comprises.'}
      </p>

      <div className="ornament-preview sunken">
        {chosen ? (
          <OrnamentPlate ornament={chosen} name={name} title={ornamentTitle(chosen, content, state)} width={448} />
        ) : (
          <div className="ornament-none">
            <strong>{name}</strong>
            <span className="muted">Sans ornement</span>
          </div>
        )}
      </div>

      <div className="ornament-grid scroll">
        {professions.map((p) => (
          <div key={p.id} className="ornament-row">
            <span className="ornament-row-name">{p.name}</span>
            {ornaments
              .filter((o) => o.profession === p.id)
              .map((o) => {
                const ok = unlocked.has(o.id);
                const trial = o.trial ? content.trials[o.trial] : undefined;
                const label = trial ? `${trial.nickname} (palier ${o.rank})` : `Palier ${o.rank} · en réserve`;
                return (
                  <button
                    key={o.id}
                    className={`ornament-cell${picked === o.id ? ' picked' : ''}${state.ornament === o.id ? ' worn' : ''}`}
                    disabled={!ok}
                    aria-pressed={picked === o.id}
                    title={ok ? label : `${label} : commande « ${trial?.name ?? '?'} » du maître`}
                    onClick={() => setPicked(o.id)}
                  >
                    <img src={ornamentUrl(o, 'badge')} alt="" />
                    <span>{o.rank}</span>
                  </button>
                );
              })}
          </div>
        ))}
      </div>

      <footer className="ornament-actions">
        <button className="btn" disabled={state.ornament === null} onClick={() => wear(null)}>
          Retirer l’ornement
        </button>
        <button className="btn btn-primary" disabled={!picked || picked === state.ornament} onClick={() => wear(picked)}>
          {picked && picked === state.ornament ? 'Porté' : 'Porter'}
        </button>
      </footer>
    </Modal>
  );
}

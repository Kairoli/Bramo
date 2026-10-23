import { useState } from 'react';
import { api } from '../api';
import { useGame } from '../game/GameContext';
import { Modal } from './ui';
import { OrnamentPlate, ornamentTitle, ornamentUrl } from './Ornament';

/**
 * Ornements et titres (salle Personnage) [Louis, 24 octobre : « renommer en ornements et titres ; changer son titre
 * indépendamment de l'ornement »]. En haut, l'aperçu de la plaque avec le choix en cours ; deux onglets : l'ornement
 * (une ligne de badges par métier, du palier 20 au 99, débloqué par la commande du maître) et le titre (tous les titres
 * gagnés, de métier ou de la Marée).
 */
export function OrnamentModal({ onClose }: { onClose: () => void }) {
  const { name, content, state, act } = useGame();
  const unlocked = new Set(state.unlockedOrnaments);
  const [tab, setTab] = useState<'ornament' | 'title'>('ornament');
  const [picked, setPicked] = useState<string | null>(state.ornament);
  const [title, setTitle] = useState<string | null>(state.title);
  const ornaments = Object.values(content.ornaments);
  const professions = content.professions.filter((p) => ornaments.some((o) => o.profession === p.id));
  const chosen = picked ? content.ornaments[picked] : undefined;
  const dirty = picked !== state.ornament || title !== state.title;
  const sources = [...new Set(state.titles.map((t) => t.source))];

  const save = async () => {
    const ok = (picked === state.ornament || (await act(() => api.chooseOrnament(picked)))) && (title === state.title || (await act(() => api.chooseTitle(title))));
    if (ok) onClose();
  };

  return (
    <Modal onClose={onClose} className="ornament-modal">
      <div className="class-modal-head">
        <div>
          <div className="eyebrow">Personnage</div>
          <h2>Ornements et titres</h2>
        </div>
        <button className="btn btn-sm" onClick={onClose}>
          Fermer
        </button>
      </div>

      <div className="ornament-preview sunken">
        {chosen ? (
          <OrnamentPlate ornament={chosen} name={name} title={ornamentTitle(chosen, content, state, title)} width={448} />
        ) : (
          <div className="ornament-none">
            <strong>{name}</strong>
            <span style={{ color: 'var(--clan)' }}>{title ?? 'Titre par défaut'}</span>
          </div>
        )}
      </div>

      <nav className="gear-card-tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'ornament'} onClick={() => setTab('ornament')}>
          Ornement
        </button>
        <button role="tab" aria-selected={tab === 'title'} onClick={() => setTab('title')}>
          Titre · {state.titles.length}
        </button>
      </nav>

      {tab === 'ornament' ? (
        <div className="ornament-grid scroll">
          <div className="ornament-row">
            <span className="ornament-row-name">Aucun</span>
            <button className={`ornament-cell none${picked === null ? ' picked' : ''}`} aria-pressed={picked === null} onClick={() => setPicked(null)} title="Sans ornement">
              <span className="ornament-none-mark">∅</span>
            </button>
          </div>
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
      ) : (
        <div className="title-grid scroll">
          <button className={`title-chip default${title === null ? ' on' : ''}`} onClick={() => setTitle(null)}>
            Par défaut <span className="muted small">(celui de l’ornement, ou de votre meilleur métier)</span>
          </button>
          {sources.map((src) => (
            <div key={src} className="title-group">
              <span className="eyebrow">{src}</span>
              <div className="title-row">
                {state.titles
                  .filter((t) => t.source === src)
                  .map((t) => (
                    <button key={t.text} className={`title-chip${title === t.text ? ' on' : ''}`} aria-pressed={title === t.text} onClick={() => setTitle(t.text)}>
                      {t.text}
                    </button>
                  ))}
              </div>
            </div>
          ))}
          <p className="muted small">D’autres titres se gagnent avec les commandes des maîtres (niveaux 20, 40, 60, 80, 90, 99) et les soirs de Marée.</p>
        </div>
      )}

      <footer className="ornament-actions">
        <button className="btn" disabled={!dirty} onClick={() => (setPicked(state.ornament), setTitle(state.title))}>
          Annuler
        </button>
        <button className="btn btn-primary" disabled={!dirty} onClick={() => void save()}>
          Enregistrer
        </button>
      </footer>
    </Modal>
  );
}

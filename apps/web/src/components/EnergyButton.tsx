import { api } from '../api';
import { useGame } from '../game/GameContext';
import { useNow } from '../game/useLive';
import { duration } from '../format';
import { useState } from 'react';
import { Bar, Modal } from './ui';

/**
 * Coup de fouet : le joueur l'active quand il veut, après une confirmation [Louis, 24 octobre : une charge partait sur
 * un clic distrait]. Pendant l'effet, une jauge descend.
 */
export function EnergyButton() {
  const { state, act } = useGame();
  const now = useNow(1000);
  const { chargesLeft, charges, activeUntil, durationMs, multiplier } = state.energy;
  const remaining = activeUntil ? activeUntil - now : 0;
  const label = `×${String(multiplier).replace('.', ',')}`;
  const [asking, setAsking] = useState(false);
  const confirm = asking && (
    <Modal onClose={() => setAsking(false)} className="confirm-modal">
      <span className="eyebrow" style={{ color: 'var(--good)' }}>Coup de fouet</span>
      <h3>{remaining > 0 ? `Ajouter ${duration(durationMs)} ?` : 'L’activer maintenant ?'}</h3>
      <p className="muted">
        Rendement {label} pendant {duration(durationMs)}, en ligne comme hors ligne. Il vous en restera {chargesLeft - 1} aujourd’hui.
      </p>
      <div className="confirm-actions">
        <button className="btn btn-ghost" onClick={() => setAsking(false)}>
          Pas maintenant
        </button>
        <button className="btn btn-primary" onClick={() => (setAsking(false), void act(api.energize))}>
          Activer
        </button>
      </div>
    </Modal>
  );

  // La fenêtre vit à côté du bouton (dans le bouton, ses clics remontaient jusqu'à lui).
  if (remaining > 0) {
    return (
      <>
      <button
        className="energy energy-active"
        disabled={chargesLeft <= 0}
        onClick={() => setAsking(true)}
        title={`Coup de fouet en cours : rendement ${label}.${chargesLeft ? ` Cliquer ajoute ${duration(durationMs)} (encore ${chargesLeft}).` : ''}`}
      >
        <div className="energy-head">
          <span style={{ color: 'var(--good)' }}>Coup de fouet {label}</span>
          <span>{duration(remaining)}</span>
        </div>
        <Bar value={Math.min(1, remaining / durationMs)} color="var(--good)" />
      </button>
      {confirm}
    </>
    );
  }
  return (
    <>
    <button
      className="btn btn-ghost btn-sm energy-btn"
      disabled={chargesLeft <= 0}
      onClick={() => setAsking(true)}
      title={`Rendement ${label} pendant ${duration(durationMs)}, en ligne comme hors ligne. ${charges} par jour.`}
    >
      Coup de fouet
      <span className="energy-pips" aria-label={`${chargesLeft} sur ${charges}`}>
        {Array.from({ length: charges }, (_, i) => (
          <span key={i} className={i < chargesLeft ? 'pip on' : 'pip'} />
        ))}
      </span>
    </button>
    {confirm}
    </>
  );
}

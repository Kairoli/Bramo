import { api } from '../api';
import { useGame } from '../game/GameContext';
import { useNow } from '../game/useLive';
import { duration } from '../format';
import { Bar } from './ui';

/** Coup de fouet : le joueur l'active quand il veut. Pendant l'effet, une jauge descend. */
export function EnergyButton() {
  const { state, act } = useGame();
  const now = useNow(1000);
  const { chargesLeft, charges, activeUntil, durationMs, multiplier } = state.energy;
  const remaining = activeUntil ? activeUntil - now : 0;
  const label = `×${String(multiplier).replace('.', ',')}`;

  if (remaining > 0) {
    return (
      <button
        className="energy energy-active"
        disabled={chargesLeft <= 0}
        onClick={() => void act(api.energize)}
        title={`Coup de fouet en cours : rendement ${label}.${chargesLeft ? ` Cliquer ajoute ${duration(durationMs)} (encore ${chargesLeft}).` : ''}`}
      >
        <div className="energy-head">
          <span style={{ color: 'var(--good)' }}>Coup de fouet {label}</span>
          <span>{duration(remaining)}</span>
        </div>
        <Bar value={Math.min(1, remaining / durationMs)} color="var(--good)" />
      </button>
    );
  }
  return (
    <button
      className="btn btn-ghost btn-sm energy-btn"
      disabled={chargesLeft <= 0}
      onClick={() => void act(api.energize)}
      title={`Rendement ${label} pendant ${duration(durationMs)}, en ligne comme hors ligne. ${charges} par jour.`}
    >
      Coup de fouet
      <span className="energy-pips" aria-label={`${chargesLeft} sur ${charges}`}>
        {Array.from({ length: charges }, (_, i) => (
          <span key={i} className={i < chargesLeft ? 'pip on' : 'pip'} />
        ))}
      </span>
    </button>
  );
}

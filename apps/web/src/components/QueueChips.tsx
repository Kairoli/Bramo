import { api } from '../api';
import { useGame } from '../game/GameContext';
import { clock, duration } from '../format';

/** File d'actions à suivre, avec estimation des horaires (affichage seulement). */
export function QueueChips({ startAt, title = 'Ensuite, dans la file' }: { startAt: number; title?: string }) {
  const { content, state, act } = useGame();
  const { queueLength } = content.settings.activity;
  const rate = state.activity?.rate.total || 1;
  const durations = state.queue.map((q) => (q.quantity * (content.recipes[q.recipeId]?.durationSec ?? 0) * 1000) / rate);
  const endAt = startAt + durations.reduce((a, b) => a + b, 0);

  return (
    <div className="queue">
      <div className="queue-head">
        <span className="eyebrow">{title}</span>
        <span className="muted queue-times">
          {state.queue.length ? `${clock(startAt)} → ${clock(endAt)}` : `${state.queue.length}/${queueLength}`}
        </span>
      </div>
      <div className="queue-chips">
        {state.queue.map((q, i) => (
          <div key={i} className="queue-chip">
            <span className="queue-name">
              {q.quantity} × {content.recipes[q.recipeId]?.name}
            </span>
            <span className="muted">{duration(durations[i]!)}</span>
            <button className="queue-x" aria-label="Retirer de la file" onClick={() => act(() => api.cancel(i))}>
              ×
            </button>
          </div>
        ))}
        {Array.from({ length: Math.max(0, queueLength - state.queue.length) }, (_, i) => (
          <div key={`empty-${i}`} className="queue-chip empty">
            Libre
          </div>
        ))}
      </div>
    </div>
  );
}

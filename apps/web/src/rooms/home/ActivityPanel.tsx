import { api } from '../../api';
import { useGame } from '../../game/GameContext';
import { useLiveActivity } from '../../game/useLive';
import { clock, duration, num, pct, signedPct } from '../../format';
import { FAMILY_NAME, Ring } from '../../components/ui';
import { QueueChips } from '../../components/QueueChips';

export function ActivityPanel() {
  const { content, state, go, act } = useGame();
  const live = useLiveActivity();
  const a = state.activity;
  const profession = live && content.professions.find((p) => p.id === live.recipe.profession);
  const { settings } = content;

  return (
    <section className="panel activity">
      <header className="activity-head">
        <span className="eyebrow">Activité en cours</span>
        <div className="row-gap">
          {a && (
            <button className="link" onClick={() => act(() => api.cancel(-1))}>
              Arrêter
            </button>
          )}
          <button className="btn btn-sm" onClick={() => go('professions', profession?.id ?? null)}>
            Changer d’activité
          </button>
        </div>
      </header>

      {!live || !a || !profession ? (
        <div className="activity-empty">
          <p className="muted">Aucune activité. Vos métiers attendent.</p>
          <button className="btn btn-primary" onClick={() => go('professions')}>
            Choisir un métier
          </button>
        </div>
      ) : (
        <div className="activity-body">
          <div className="sunken activity-scene">
            <span>[{profession.place}]</span>
          </div>
          <Ring value={(live.done + live.fraction) / live.quantity} size={132}>
            <strong>{num(live.done)}</strong>
            <span className="muted">sur {num(live.quantity)}</span>
            <span className="ring-eta">fini à {clock(live.etaAt)}</span>
          </Ring>
          <div className="activity-details">
            <div className="eyebrow" style={{ color: 'var(--action)' }}>
              {FAMILY_NAME[profession.family]} · {profession.name} {state.skills[profession.id]?.level}
            </div>
            <h3>{live.recipe.name}</h3>
            <dl className="kv">
              <dt>XP par heure</dt>
              <dd>{num(live.xpPerHour)}</dd>
              <dt>Rendement</dt>
              <dd style={{ color: a.rate.energized ? 'var(--good)' : undefined }}>
                {pct(a.rate.total)}
                {a.rate.energized ? ' · coup de fouet' : ''}
              </dd>
              {a.rate.tool > 0 && (
                <>
                  <dt>Outil</dt>
                  <dd style={{ color: 'var(--good)' }}>{signedPct(a.rate.tool)}</dd>
                </>
              )}
              {a.rate.meal > 0 && (
                <>
                  <dt>Repas</dt>
                  <dd style={{ color: 'var(--good)' }}>{signedPct(a.rate.meal)}</dd>
                </>
              )}
              <dt>Hors ligne</dt>
              <dd>
                {pct(settings.rates.offline)}, {settings.rates.offlineCapHours} h max
              </dd>
              <dt>Une fabrication</dt>
              <dd>{duration(live.realDurationMs)}</dd>
            </dl>
          </div>
        </div>
      )}

      <footer className="activity-queue">
        <QueueChips startAt={live?.etaAt ?? Date.now()} />
      </footer>
    </section>
  );
}

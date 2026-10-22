import { api } from '../../api';
import { useGame } from '../../game/GameContext';
import { num } from '../../format';
import { Scene } from '../../components/Scene';
import { LiveFight } from '../../components/LiveFight';

/**
 * Accueil, à droite : la route (PvE solo) qui tourne en boucle. On la voit se battre ; un clic l'ouvre en grand dans la
 * salle Combat. Si le personnage fait autre chose, la route l'attend.
 */
export function RoutePanel() {
  const { state, go, act } = useGame();
  const view = state.combat;
  const a = view?.activity;
  const route = view?.route;

  if (!view || !route) {
    return (
      <section className="panel route-panel">
        <div className="route-empty">
          <p className="muted">Choisissez une classe pour prendre la route.</p>
        </div>
      </section>
    );
  }
  const stages = route.chapters.flatMap((c) => c.stages);
  const current = stages[route.stage]!;
  const chapter = route.chapters.find((c) => c.stages.some((s) => s.index === current.index))!;
  const other = a && !a.route;
  return (
    <section className="panel route-panel">
      <button className="route-stage-view band" onClick={() => go('combat')} title="Ouvrir le combat en grand">
        <Scene ids={['combat']} />
        <LiveFight view={view} insetTop={40} />
        <span className="route-hud">
          <span className="route-chip">{a?.route ? `Étape ${a.stageLabel}` : other ? (a.encounter === null ? 'Entraînement' : 'Patrouille') : `Étape ${current.label}`}</span>
          <span className="route-name">{a ? a.name : current.name}</span>
        </span>
        <span className="route-open" aria-hidden>
          ⤢
        </span>
        {!a && (
          <span className="route-idle">
            <span>La route vous attend</span>
          </span>
        )}
      </button>
      <div className="route-foot">
        <div className="route-chapter">
          <span className="eyebrow">Route · chapitre {chapter.number}</span>
          <span className="route-chapter-name">{chapter.name}</span>
          <div className="route-nodes">
            {chapter.stages.map((s) => (
              <span key={s.index} className={`route-node${s.index < route.best ? ' done' : ''}${s.index === route.stage ? ' current' : ''}${s.guardian ? ' guardian' : ''}`} title={`${s.label} · ${s.name} · palier ${s.tier}`}>
                {s.guardian ? '♛' : s.label.split('-')[1]}
              </span>
            ))}
          </div>
        </div>
        {a?.route ? (
          <div className="route-stats">
            <strong>{num(a.wins)}</strong>
            <span className="muted small">victoire{a.wins > 1 ? 's' : ''}</span>
          </div>
        ) : (
          <button className="btn btn-primary btn-sm" onClick={() => void act(() => api.combatRoute())}>
            {other ? 'Reprendre la route' : 'Prendre la route'}
          </button>
        )}
      </div>
    </section>
  );
}

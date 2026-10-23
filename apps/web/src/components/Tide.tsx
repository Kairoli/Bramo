import { useCallback, useEffect, useState } from 'react';
import type { TideView } from '@bramo/shared';
import { api } from '../api';
import { useGame } from '../game/GameContext';
import { clock, num } from '../format';
import { Modal } from './ui';

/**
 * La Marée du soir (docs/design/contenu/le-monde.md §5) : un bandeau dans la barre du haut (ce soir, dans combien de
 * temps, ou « en cours ») et une fenêtre : rejoindre la digue en direct, l'inscription automatique, le canal travail,
 * le résultat du serveur (lanternes allumées), la semaine, les éclats et ce qu'ils achètent.
 */

export function useTide() {
  const { state } = useGame();
  const [view, setView] = useState<TideView | null>(null);
  const refresh = useCallback(() => {
    api
      .tide()
      .then(setView)
      .catch(() => setView(null));
  }, []);
  // Rafraîchi avec l'état du jeu (or, inventaire) et toutes les minutes pour le compte à rebours.
  useEffect(refresh, [refresh, state.gold]);
  useEffect(() => {
    const id = window.setInterval(refresh, 60_000);
    return () => window.clearInterval(id);
  }, [refresh]);
  return { view, refresh };
}

const until = (ms: number) => {
  const m = Math.max(0, Math.round(ms / 60_000));
  return m >= 60 ? `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')}` : `${m} min`;
};

export function TideBanner({ onOpen, view }: { onOpen: () => void; view: TideView | null }) {
  if (!view) return null;
  const t = view.tonight;
  const now = Date.now();
  const sub = t.open
    ? view.joinedLive
      ? `Vous tenez la digue, jusqu’à ${clock(t.end)}`
      : `En cours jusqu’à ${clock(t.end)} : rejoindre (+15 %)`
    : now < t.start
      ? `Ce soir à ${clock(t.start)} · dans ${until(t.start - now)}`
      : 'Terminée pour ce soir';
  return (
    <div className={`banner tide-banner${t.open ? ' is-open' : ''}`} style={{ ['--tone' as string]: 'var(--event)' }}>
      <button className="banner-main" onClick={onOpen}>
        <span className="banner-icon">
          <WaveIcon />
        </span>
        <span className="banner-text">
          <strong>Marée du soir · {t.name}</strong>
          <span className="muted">{sub}</span>
        </span>
      </button>
    </div>
  );
}

export function TideModal({ view, refresh, onClose }: { view: TideView; refresh: () => void; onClose: () => void }) {
  const { act } = useGame();
  const t = view.tonight;
  const now = Date.now();
  const run = async (call: () => ReturnType<typeof api.state>) => {
    await act(call);
    refresh();
  };
  const workReady = t.work.items.some((w) => w.have > 0 && w.delivered < w.qty);
  const last = view.last;
  const lit = last ? last.thresholds : 0;
  return (
    <Modal onClose={onClose} className="tide-modal">
      <div className="tide-head">
        <WaveIcon size={40} />
        <div>
          <span className="eyebrow">Marée du soir · tous les soirs à {clock(t.start)}</span>
          <h2>{t.name}</h2>
          <p className="muted">{t.blurb}</p>
          <p className="small">Qui y brille : {t.shines}.</p>
        </div>
      </div>

      <section className="tide-now">
        {t.open ? (
          view.joinedLive ? (
            <p className="tide-ok">Vous tenez la digue : vos points de ce soir comptent 15 % de plus.</p>
          ) : (
            <button className="btn btn-primary" onClick={() => void run(api.tideJoin)}>
              Rejoindre la digue (+15 % ce soir)
            </button>
          )
        ) : (
          <p className="muted">{now < t.start ? `La Marée monte dans ${until(t.start - now)}, jusqu’à ${clock(t.end)}.` : 'Elle est passée pour ce soir : les éclats arrivent à votre prochaine visite.'}</p>
        )}
        <label className="tide-toggle">
          <input type="checkbox" checked={view.prefs.auto} onChange={(e) => void run(() => api.tidePrefs({ auto: e.target.checked }))} />
          Y aller chaque soir, même absent (votre personnage s’y rend seul, avec votre build)
        </label>
        <div className="tide-channels" role="radiogroup">
          <button className={`chip${view.prefs.channel === 'combat' ? ' on' : ''}`} onClick={() => void run(() => api.tidePrefs({ channel: 'combat' }))}>
            Combattre
          </button>
          <button className={`chip${view.prefs.channel === 'work' ? ' on' : ''}`} onClick={() => void run(() => api.tidePrefs({ channel: 'work' }))}>
            Travailler pour la digue
          </button>
        </div>
      </section>

      <section className="tide-work">
        <h3>Ce que la digue demande ce soir</h3>
        <p className="muted small">{t.work.text} Tout livrer vaut les points d’un bon combattant ; sans livraison, votre personnage combat.</p>
        <ul>
          {t.work.items.map((w) => (
            <li key={w.item}>
              <span>
                {w.name} : {num(w.delivered)} / {num(w.qty)}
              </span>
              <span className="muted small">(vous en avez {num(w.have)})</span>
            </li>
          ))}
        </ul>
        <button className="btn btn-ghost btn-sm" disabled={!workReady} onClick={() => void run(api.tideDeliver)}>
          Livrer ce que j’ai
        </button>
      </section>

      {last && (
        <section className="tide-last">
          <h3>
            Hier soir : {last.name} · {num(last.participants)} participants
          </h3>
          <div className="tide-dike">
            <div className="tide-dike-bar">
              <span style={{ width: `${Math.min(100, (last.points / Math.max(1, last.objective)) * 100)}%` }} />
            </div>
            <div className="tide-lanterns" aria-label={`${lit} lanternes allumées sur ${last.of}`}>
              {Array.from({ length: last.of }, (_, i) => (
                <span key={i} className={i < lit ? 'lit' : ''} />
              ))}
            </div>
          </div>
          <p className="muted small">
            {num(last.points)} points sur {num(last.objective)} : chaque lanterne allumée donne des éclats en plus à tout le monde.
          </p>
        </section>
      )}

      <section className="tide-me">
        <div className="tide-stat">
          <strong>{num(view.shards)}</strong>
          <span className="muted small">éclats de marée</span>
        </div>
        <div className="tide-stat">
          <strong>
            {num(view.week.points)} / {num(view.week.bonusAbove)}
          </strong>
          <span className="muted small">
            points de la semaine ({view.week.nights}/{view.week.bestNights} meilleurs soirs) : coffre le lundi
          </span>
        </div>
        {view.titles.length > 0 && (
          <div className="tide-stat">
            <strong>{view.titles.join(' · ')}</strong>
            <span className="muted small">titres</span>
          </div>
        )}
      </section>

      {view.nights.length > 0 && (
        <section className="tide-nights">
          <h3>Vos derniers soirs</h3>
          <ul>
            {[...view.nights]
              .reverse()
              .slice(0, 7)
              .map((n) => (
                <li key={n.day}>
                  <span>{new Date(n.day * 86_400_000).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })}</span>
                  <span>{n.points} points{n.live ? ' · en direct' : ''}{n.channel === 'work' ? ' · travail' : ''}</span>
                  <span className="muted">{n.shards} éclats</span>
                </li>
              ))}
          </ul>
        </section>
      )}

      <section className="tide-shop">
        <h3>Ce que les éclats achètent</h3>
        <p className="muted small">Des apparences, jamais de la puissance.</p>
        <ul>
          {view.shop
            .filter((o) => o.forClass)
            .map((o) => (
              <li key={o.id}>
                <span>{o.name}</span>
                {o.owned ? (
                  <span className="chip on">Débloquée</span>
                ) : (
                  <button className="btn btn-sm" disabled={view.shards < o.cost} onClick={() => void run(() => api.tideBuy(o.id))}>
                    {num(o.cost)} éclats
                  </button>
                )}
              </li>
            ))}
        </ul>
      </section>
    </Modal>
  );
}

function WaveIcon({ size = 20 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 15c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2" />
      <path d="M2 19c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2" opacity="0.6" />
      <path d="M12 3v6M9 6l3-3 3 3" />
    </svg>
  );
}

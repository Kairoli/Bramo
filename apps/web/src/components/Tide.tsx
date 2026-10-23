import { useCallback, useEffect, useState } from 'react';
import type { TideView } from '@bramo/shared';
import { api } from '../api';
import { useGame } from '../game/GameContext';
import { clock, num } from '../format';
import { Modal } from './ui';
import { TideLive } from './TideLive';
import type { TideLiveView } from '@bramo/shared';

/**
 * La Marée du soir (docs/design/contenu/le-monde.md §5) : un bandeau dans la barre du haut (ce soir, dans combien de
 * temps, ou « en cours ») et une fenêtre : rejoindre la digue en direct, l'inscription automatique, le canal travail,
 * le résultat du serveur (lanternes allumées), la semaine, les éclats et ce qu'ils achètent.
 */

export function useTide() {
  const [view, setView] = useState<TideView | null>(null);
  const refresh = useCallback(() => {
    api
      .tide()
      .then(setView)
      .catch(() => setView(null));
  }, []);
  // Au chargement, puis toutes les minutes (compte à rebours, résultat du soir) ; la fenêtre rafraîchit après chaque action.
  useEffect(refresh, [refresh]);
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
  const reg = view.registration;
  const sub = t.open
    ? reg.registered
      ? view.joinedLive
        ? `Vous tenez la digue, jusqu’à ${clock(t.end)}`
        : `En cours jusqu’à ${clock(t.end)} : rejoindre en direct (+15 %)`
      : `En cours jusqu’à ${clock(t.end)} · vous n’êtes pas inscrit`
    : reg.registered
      ? `Inscrit · à ${clock(t.start)}, même déconnecté`
      : reg.open
        ? `Inscriptions ouvertes jusqu’à ${clock(reg.end)} : s’inscrire`
        : now < reg.start
          ? `Inscriptions à ${clock(reg.start)} · dans ${until(reg.start - now)}`
          : 'Terminée pour ce soir';
  const patrons = view.patron?.tonight && view.patron.names.length ? ` · offerte par ${view.patron.names.join(', ')}` : '';
  return (
    <div className={`banner tide-banner${t.open ? ' is-open' : ''}`} style={{ ['--tone' as string]: 'var(--event)' }}>
      <button className="banner-main" onClick={onOpen}>
        <span className="banner-icon">
          <WaveIcon />
        </span>
        <span className="banner-text">
          <strong>Marée du soir · {t.name}</strong>
          <span className="muted">
            {sub}
            {patrons}
          </span>
        </span>
      </button>
    </div>
  );
}

/** La scène en direct : relue toutes les 15 s tant que la fenêtre est ouverte (démonstration à toute heure en développement). */
function useTideLive(demo: boolean) {
  const [live, setLive] = useState<TideLiveView | null>(null);
  useEffect(() => {
    let stop = false;
    const load = () =>
      api
        // ?maree=giants avant le # : la démonstration montre cette Marée (développement).
        .tideLive(demo, new URLSearchParams(location.search).get('maree') ?? undefined)
        .then((v) => !stop && setLive(v))
        .catch(() => {});
    load();
    const id = window.setInterval(load, 15_000);
    return () => {
      stop = true;
      window.clearInterval(id);
    };
  }, [demo]);
  return live;
}

export function TideModal({ view, refresh, onClose }: { view: TideView; refresh: () => void; onClose: () => void }) {
  const { act, state } = useGame();
  const [demo, setDemo] = useState(false);
  const live = useTideLive(demo);
  const showLive = !!live && (live.demo || live.phase !== 'idle');
  const t = view.tonight;
  const now = Date.now();
  const run = async (call: () => ReturnType<typeof api.state>) => {
    await act(call);
    refresh();
  };
  const reg = view.registration;
  const workReady = t.work.items.some((w) => w.have > 0 && w.delivered < w.qty);
  const last = view.last;
  const lit = last ? last.thresholds : 0;
  return (
    <Modal onClose={onClose} className={`tide-modal${showLive ? ' with-live' : ''}`}>
      {showLive && <TideLive view={live!} />}
      {import.meta.env.DEV && (
        <button className="btn btn-ghost btn-sm tide-demo" onClick={() => setDemo(!demo)}>
          {demo ? 'Revenir à la vraie Marée' : 'Démo : voir la digue en direct'}
        </button>
      )}
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
        {/* Inscription de 19 h à 20 h [Décidé par Louis] : inscrit, le personnage combat même si le joueur se déconnecte. */}
        {reg.registered ? (
          <p className="tide-ok">Inscrit pour ce soir : votre personnage tiendra la digue à {clock(t.start)}, même si vous êtes déconnecté.</p>
        ) : reg.open ? (
          <button className="btn btn-primary" onClick={() => void run(api.tideRegister)}>
            S’inscrire pour ce soir (jusqu’à {clock(reg.end)})
          </button>
        ) : (
          <p className="muted">
            {now < reg.start
              ? `Les inscriptions ouvrent à ${clock(reg.start)}, dans ${until(reg.start - now)} : une heure pour s’inscrire, puis la Marée monte à ${clock(t.start)}.`
              : 'Les inscriptions de ce soir sont closes. Elles rouvrent demain à 19 h.'}
          </p>
        )}
        {t.open && reg.registered && !view.joinedLive && (
          <button className="btn btn-primary" onClick={() => void run(api.tideJoin)}>
            Rejoindre la digue en direct (+15 % ce soir)
          </button>
        )}
        {t.open && view.joinedLive && <p className="tide-ok">Vous tenez la digue en direct : vos points de ce soir comptent 15 % de plus.</p>}
        {!t.open && now >= t.end && reg.registered && <p className="muted">Elle est passée pour ce soir : les éclats arrivent à votre prochaine visite.</p>}
        <div className="tide-channels" role="radiogroup">
          <button className={`chip${view.prefs.channel === 'combat' ? ' on' : ''}`} onClick={() => void run(() => api.tidePrefs({ channel: 'combat' }))}>
            Combattre
          </button>
          <button className={`chip${view.prefs.channel === 'work' ? ' on' : ''}`} onClick={() => void run(() => api.tidePrefs({ channel: 'work' }))}>
            Travailler pour la digue
          </button>
        </div>
      </section>

      {view.patron && <PatronSection patron={view.patron} gold={state.gold} run={run} />}

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

/**
 * Mécène de la Marée [Décidé par Louis, 23 octobre] : offrir la prochaine Marée au serveur. L'or est détruit ; chaque mécène
 * donne des éclats en plus à tous les participants du soir ; des titres selon le nombre de soirs offerts.
 */
function PatronSection({ patron, gold, run }: { patron: NonNullable<TideView['patron']>; gold: number; run: (call: () => ReturnType<typeof api.state>) => Promise<void> }) {
  const bonus = Math.round(patron.shardBonus * 100);
  const full = patron.names.length >= patron.max;
  const when = patron.tonight ? 'ce soir' : 'demain soir';
  return (
    <section className="tide-patron">
      <h3>Offrir la Marée</h3>
      <p className="muted small">
        Offrez la Marée {when} à tout le serveur : chaque mécène donne +{bonus} % d’éclats à tous les participants ({patron.max} mécènes au plus). Votre nom est
        annoncé au bourg. L’or offert disparaît.
      </p>
      <p className="small">
        {patron.names.length ? (
          <>
            Mécènes {when} : <strong>{patron.names.join(', ')}</strong> ({patron.names.length}/{patron.max}, +{bonus * patron.names.length} % d’éclats)
          </>
        ) : (
          <>Personne n’a encore offert la Marée {when}.</>
        )}
      </p>
      <button className="btn btn-primary btn-sm" disabled={full || gold < patron.price} onClick={() => void run(api.tidePatron)}>
        {full ? 'Les places de mécène sont prises' : `Offrir la Marée (${num(patron.price)} or)`}
      </button>
      <p className="muted small">
        Vous avez offert {patron.offered} Marée{patron.offered > 1 ? 's' : ''}
        {patron.next ? ` · prochain titre « ${patron.next.title} » à ${patron.next.offered}` : ''}
      </p>
    </section>
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

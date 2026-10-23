import { useCallback, useEffect, useState } from 'react';
import type { TideView } from '@bramo/shared';
import { api } from '../api';
import { useGame } from '../game/GameContext';
import { clock, num } from '../format';
import { Modal } from './ui';
import { TideLive, TideRecap } from './TideLive';
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
  const t = view.tonight;
  const r = view.rules;
  const now = Date.now();
  const run = async (call: () => ReturnType<typeof api.state>) => {
    await act(call);
    refresh();
  };
  const reg = view.registration;
  const workReady = t.work.items.some((w) => w.have > 0 && w.delivered < w.qty);
  const workDone = t.work.items.every((w) => w.delivered >= w.qty);
  const working = view.prefs.channel === 'work';
  const last = view.last;
  const lastMine = last ? view.nights.find((n) => n.day === last.day) : undefined;
  // Les trois temps du soir : s'inscrire, tenir la digue, recevoir.
  const step = now < reg.start ? 0 : now < t.start ? 1 : now < t.end ? 2 : 3;
  const pts = (ratio: number) => Math.round(r.fullPoints * ratio);
  const plural = (n: number, word: string) => `${num(n)} ${word}${n > 1 ? 's' : ''}`;

  return (
    <Modal onClose={onClose} className="tide-modal with-live">
      {live && <TideLive view={live} />}
      {import.meta.env.DEV && (
        <button className="btn btn-ghost btn-sm tide-demo" onClick={() => setDemo(!demo)}>
          {demo ? 'Revenir à la vraie Marée' : 'Démo : voir la digue en direct'}
        </button>
      )}

      <header className="tide-head">
        <WaveIcon size={40} />
        <div>
          <span className="eyebrow">Marée du soir · tous les soirs, tout le serveur ensemble</span>
          <h2>{t.name}</h2>
          <p className="muted">{t.blurb}</p>
          <p className="small">Ce soir, ce qui marque le plus : {t.shines}.</p>
        </div>
      </header>

      {/* Les trois temps du soir. Inscrit, le personnage combat même si le joueur se déconnecte [Décidé par Louis]. */}
      <ol className="tide-steps">
        <li className={step === 1 ? 'now' : reg.registered ? 'done' : ''}>
          <span className="tide-step-n">1</span>
          <strong>S’inscrire</strong>
          <span className="muted small">
            {clock(reg.start)} – {clock(reg.end)}
          </span>
          {reg.registered ? (
            <span className="tide-ok small">Inscrit pour ce soir</span>
          ) : reg.open ? (
            <button className="btn btn-primary btn-sm" onClick={() => void run(api.tideRegister)}>
              S’inscrire
            </button>
          ) : (
            <span className="muted small">{now < reg.start ? `ouvre dans ${until(reg.start - now)}` : 'fermé ce soir'}</span>
          )}
        </li>
        <li className={step === 2 ? 'now' : step === 3 && reg.registered ? 'done' : ''}>
          <span className="tide-step-n">2</span>
          <strong>Tenir la digue</strong>
          <span className="muted small">
            {clock(t.start)} – {clock(t.end)}
          </span>
          {t.open && reg.registered && !view.joinedLive ? (
            <button className="btn btn-primary btn-sm" onClick={() => void run(api.tideJoin)}>
              Être là en direct (+{Math.round(r.liveBonus * 100)} %)
            </button>
          ) : view.joinedLive ? (
            <span className="tide-ok small">En direct : +{Math.round(r.liveBonus * 100)} % ce soir</span>
          ) : (
            <span className="muted small">{reg.registered ? 'même si vous êtes déconnecté' : 'pour les inscrits'}</span>
          )}
        </li>
        <li className={step === 3 && reg.registered ? 'now' : ''}>
          <span className="tide-step-n">3</span>
          <strong>Recevoir ses éclats</strong>
          <span className="muted small">après {clock(t.end)}</span>
          <span className="muted small">à votre prochaine visite</span>
        </li>
      </ol>

      {/* Les deux façons de tenir la digue, avec ce qu'elles rapportent vraiment (data/combat/tide.yaml). */}
      <section className="tide-roles">
        <h3>Votre rôle ce soir</h3>
        <p className="muted small">On choisit l’un ou l’autre ; on peut changer jusqu’à la fin de la Marée.</p>
        <div className="tide-role-cards">
          <button className={`tide-role${working ? '' : ' on'}`} aria-pressed={!working} onClick={() => void run(() => api.tidePrefs({ channel: 'combat' }))}>
            <span className="tide-role-icon">
              <svg viewBox="0 0 24 24" aria-hidden>
                <path d="M14.5 17.5L3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2" />
              </svg>
            </span>
            <strong>Combattre</strong>
            <span className="small">Votre personnage se bat contre la Marée avec sa classe, ses sorts et son équipement.</span>
            <span className="tide-role-gain">
              {pts(r.minRatio)} à {pts(r.maxRatio)} points · un build moyen de son niveau : <b>{pts(1)}</b>
            </span>
            <span className="muted small">Meilleur équipement, meilleurs points. Personne ne repart avec moins de {pts(r.minRatio)}.</span>
          </button>
          <div className={`tide-role${working ? ' on' : ''}`}>
            <button className="tide-role-pick" aria-pressed={working} onClick={() => void run(() => api.tidePrefs({ channel: 'work' }))}>
              <span className="tide-role-icon">
                <svg viewBox="0 0 24 24" aria-hidden>
                  <path d="M3 7h8v5H3zM13 7h8v5h-8zM7 12h10v5H7zM3 17h4M17 17h4" />
                </svg>
              </span>
              <strong>Travailler pour la digue</strong>
              <span className="small">Au lieu de combattre, vous apportez ce que la digue demande ce soir. Pour les récolteurs et les artisans.</span>
              <span className="tide-role-gain">
                Tout livré : <b>{pts(r.workMultiplier)}</b> points, sans combattre
              </span>
              <span className="muted small">Une partie seulement : les points au prorata (moins que combattre). Rien livré : votre personnage combat.</span>
            </button>
            <ul className="tide-work-list">
              {t.work.items.map((w) => (
                <li key={w.item}>
                  <span>{w.name}</span>
                  <span className="tide-work-bar">
                    <span style={{ width: `${Math.min(100, (w.delivered / Math.max(1, w.qty)) * 100)}%` }} />
                  </span>
                  <span className="small">
                    {num(w.delivered)} / {num(w.qty)} <span className="muted">(sac : {num(w.have)})</span>
                  </span>
                </li>
              ))}
            </ul>
            {workDone ? (
              <span className="tide-ok small">Tout est livré : {pts(r.workMultiplier)} points assurés ce soir.</span>
            ) : (
              <button className="btn btn-sm" disabled={!workReady} onClick={() => void run(api.tideDeliver)}>
                Livrer ce que j’ai
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Ce que rapportent les points. */}
      <section className="tide-gains">
        <h3>Ce que vous gagnez</h3>
        <div className="tide-gain-tiles">
          <div className="tide-gain">
            <strong>Éclats de marée</strong>
            <span className="small">1 éclat pour {Math.round(1 / r.perPoint)} points. Ils achètent des apparences (plus bas).</span>
            <span className="tide-gain-big">{num(view.shards)}</span>
            <span className="muted small">éclats en poche</span>
          </div>
          <div className="tide-gain">
            <strong>Lanternes du serveur</strong>
            <span className="small">Tous ensemble : chaque lanterne allumée donne des éclats en plus à chaque participant.</span>
            <span className="tide-lantern-rules">
              {r.thresholds.map((th) => (
                <span key={th.share}>
                  <i /> {Math.round(th.share * 100)} % : +{th.bonus}
                </span>
              ))}
            </span>
          </div>
          <div className="tide-gain">
            <strong>Coffre du lundi</strong>
            <span className="small">Vos {r.bestNights} meilleurs soirs de la semaine : des matières, et une chance d’équipement Épique.</span>
            <span className="tide-gain-big">{plural(view.week.nights, 'soir')}</span>
            <span className="muted small">
              sur {view.week.bestNights} cette semaine · {num(view.week.points)} points
            </span>
          </div>
        </div>
      </section>

      {last && (
        <section className="tide-last">
          <h3>
            Hier soir : {last.name} · {plural(last.participants, 'participant')}
          </h3>
          <div className="tide-dike">
            {/* Les lanternes sont posées sur leur seuil, le long de la barre. */}
            <div className="tide-dike-bar">
              <span style={{ width: `${Math.min(100, (last.points / Math.max(1, last.objective)) * 100)}%` }} />
              {r.thresholds.map((th, i) => (
                <i key={th.share} className={i < last.thresholds ? 'lit' : ''} style={{ left: `${Math.min(100, th.share * 100)}%` }} title={`${Math.round(th.share * 100)} % : +${th.bonus} éclats`} />
              ))}
            </div>
          </div>
          <p className="muted small">
            Le serveur a fait {num(last.points)} points sur {num(last.objective)} : {plural(last.thresholds, 'lanterne')} sur {last.of}.
            {lastMine ? ` Vous : ${num(lastMine.points)} points, ${num(lastMine.shards)} éclats.` : ''}
          </p>
          {last.recap.length > 0 && <TideRecap awards={last.recap} />}
        </section>
      )}

      {view.patron && <PatronSection patron={view.patron} gold={state.gold} run={run} />}

      {view.nights.length > 0 && (
        <details className="tide-nights">
          <summary>
            <h3>Vos derniers soirs</h3>
          </summary>
          <ul>
            {[...view.nights]
              .reverse()
              .slice(0, 7)
              .map((n) => (
                <li key={n.day}>
                  <span>{new Date(n.day * 86_400_000).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })}</span>
                  <span>
                    {n.points} points{n.live ? ' · en direct' : ''}
                    {n.channel === 'work' ? ' · travail' : ''}
                  </span>
                  <span className="muted">{n.shards} éclats</span>
                </li>
              ))}
          </ul>
        </details>
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

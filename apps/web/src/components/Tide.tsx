import { useCallback, useEffect, useState } from 'react';
import type { TideView } from '@bramo/shared';
import { api } from '../api';
import { useGame } from '../game/GameContext';
import { clock, num } from '../format';
import { ItemIcon, Modal } from './ui';
import { Tip, TipHead, TipLine } from './Tip';
import { TideLive, TideRecap } from './TideLive';
import { TideRanking } from './TideRanking';
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
  const { act, state, content } = useGame();
  const [demo, setDemo] = useState(false);
  const [ranking, setRanking] = useState(false);
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

  // Le classement complet remplace la fenêtre le temps qu'on le regarde.
  if (ranking) return <TideRanking demo={demo} tide={new URLSearchParams(location.search).get('maree') ?? undefined} onClose={() => setRanking(false)} />;
  const DAY = ['Hier', 'Ce soir', 'Demain'];
  // [Louis, 24 octobre : « trop de texte, pas assez d'infos ; les joueurs s'habituent »] : l'essentiel en chiffres et en
  // boutons, les explications dans les bulles « ? ».
  return (
    <Modal onClose={onClose} className="tide-modal with-live">
      {live && <TideLive view={live} onRanking={() => setRanking(true)} />}
      {import.meta.env.DEV && (
        <div className="tide-demo">
          <button className="btn btn-ghost btn-sm" onClick={() => setDemo(!demo)}>
            {demo ? 'Revenir à la vraie Marée' : 'Démo : voir la digue en direct'}
          </button>
        </div>
      )}

      <header className="tide-top">
        <WaveIcon size={34} />
        <Tip content={<TipHead title={t.name} sub={t.blurb} />}>
          <div className="tide-top-title">
            <span className="eyebrow">Marée du soir · {clock(t.start)}</span>
            <h2>{t.name}</h2>
            <span className="small tide-shines">Marque le plus : {t.shines}</span>
          </div>
        </Tip>
        <button className="btn btn-primary tide-rank-btn" onClick={() => setRanking(true)}>
          🏆 Classement
        </button>
      </header>

      {/* La rotation : hier, ce soir, les prochains soirs. */}
      <ol className="tide-rotation">
        {view.rotation.map((x, i) => (
          <li key={x.day} className={x.day === t.day ? 'now' : x.day < t.day ? 'past' : ''}>
            <span className="tide-rot-day">{DAY[i] ?? new Date(x.day * 86_400_000).toLocaleDateString('fr-FR', { weekday: 'long' })}</span>
            <Tip content={<TipHead title={x.name} sub={`Marque le plus : ${x.shines}`} />}>
              <strong className={`tide-rot-name t-${x.id}`}>{x.name}</strong>
            </Tip>
          </li>
        ))}
      </ol>

      {/* Les trois temps du soir, en une ligne. Inscrit, le personnage combat même déconnecté [Décidé par Louis]. */}
      <ol className="tide-timeline">
        <li className={step === 1 ? 'now' : reg.registered ? 'done' : ''}>
          <span className="tide-step-n">1</span>
          <span className="tide-tl-text">
            <strong>Inscription</strong>
            <span className="muted small">
              {clock(reg.start)} – {clock(reg.end)}
            </span>
          </span>
          {reg.registered ? (
            <span className="tide-ok small">✓ Inscrit</span>
          ) : reg.open ? (
            <button className="btn btn-primary btn-sm" onClick={() => void run(api.tideRegister)}>
              S’inscrire
            </button>
          ) : (
            <span className="muted small">{now < reg.start ? `dans ${until(reg.start - now)}` : 'fermée'}</span>
          )}
        </li>
        <li className={step === 2 ? 'now' : step === 3 && reg.registered ? 'done' : ''}>
          <span className="tide-step-n">2</span>
          <span className="tide-tl-text">
            <strong>La digue</strong>
            <span className="muted small">
              {clock(t.start)} – {clock(t.end)}
            </span>
          </span>
          {t.open && reg.registered && !view.joinedLive ? (
            <button className="btn btn-primary btn-sm" onClick={() => void run(api.tideJoin)}>
              En direct +{Math.round(r.liveBonus * 100)} %
            </button>
          ) : view.joinedLive ? (
            <span className="tide-ok small">En direct +{Math.round(r.liveBonus * 100)} %</span>
          ) : null}
        </li>
        <li className={step === 3 && reg.registered ? 'now' : ''}>
          <span className="tide-step-n">3</span>
          <span className="tide-tl-text">
            <strong>Éclats</strong>
            <span className="muted small">à votre visite</span>
          </span>
        </li>
      </ol>

      {/* Le rôle : deux boutons et leurs points ; le détail au survol. */}
      <div className="tide-role-toggle" role="radiogroup" aria-label="Votre rôle ce soir">
        <button className={working ? '' : 'on'} aria-pressed={!working} onClick={() => void run(() => api.tidePrefs({ channel: 'combat' }))}>
          <strong>⚔ Combattre</strong>
          <span>
            {pts(r.minRatio)} à {pts(r.maxRatio)} pts
          </span>
        </button>
        <button className={working ? 'on' : ''} aria-pressed={working} onClick={() => void run(() => api.tidePrefs({ channel: 'work' }))}>
          <strong>⛏ Travailler</strong>
          <span>{pts(r.workMultiplier)} pts si tout est livré</span>
        </button>
        <Tip
          content={
            <>
              <TipHead title="Combattre ou travailler" />
              <div className="tide-tip-body">
                <TipLine mark="⚔">Votre personnage se bat avec sa classe et son équipement : un build moyen de son niveau fait {pts(1)} points.</TipLine>
                <TipLine mark="⛏">Vous livrez ce que la digue demande ce soir, sans combattre. Une partie livrée : des points au prorata. Rien livré : il combat.</TipLine>
              </div>
            </>
          }
        >
          <span className="tide-help" tabIndex={0}>
            ?
          </span>
        </Tip>
      </div>
      {working && (
        <div className="tide-work">
          {t.work.items.map((w) => (
            <div key={w.item} className="tide-work-row">
              <ItemIcon item={content.items[w.item]} small />
              <span>{w.name}</span>
              <span className="tide-work-bar">
                <span style={{ width: `${Math.min(100, (w.delivered / Math.max(1, w.qty)) * 100)}%` }} />
              </span>
              <span className="small">
                {num(w.delivered)} / {num(w.qty)} <span className="muted">· sac {num(w.have)}</span>
              </span>
            </div>
          ))}
          {workDone ? (
            <span className="tide-ok small">✓ Tout est livré : {pts(r.workMultiplier)} points</span>
          ) : (
            <button className="btn btn-sm" disabled={!workReady} onClick={() => void run(api.tideDeliver)}>
              Livrer ce que j’ai
            </button>
          )}
        </div>
      )}

      {/* Trois chiffres : ses éclats, la digue d'hier, son coffre de la semaine. */}
      <div className="tide-stats">
        <Tip content={<TipHead title="Éclats de marée" sub={`1 éclat pour ${Math.round(1 / r.perPoint)} points, plus les lanternes du serveur : ${r.thresholds.map((th) => `${Math.round(th.share * 100)} % → +${th.bonus}`).join(' · ')}. Ils achètent des apparences.`} />}>
          <div className="tide-stat">
            <span className="tide-stat-big">{num(view.shards)}</span>
            <span className="muted small">éclats</span>
          </div>
        </Tip>
        <Tip content={last ? <TipHead title={`Hier soir : ${last.name}`} sub={`${plural(last.participants, 'participant')} · ${num(last.points)} points sur ${num(last.objective)}${lastMine ? ` · vous : ${num(lastMine.points)} points, ${num(lastMine.shards)} éclats` : ''}`} /> : <TipHead title="Pas encore de soir joué" />}>
          <div className="tide-stat wide">
            <span className="muted small">Hier soir</span>
            <div className="tide-dike-bar">
              <span style={{ width: `${last ? Math.min(100, (last.points / Math.max(1, last.objective)) * 100) : 0}%` }} />
              {r.thresholds.map((th, i) => (
                <i key={th.share} className={last && i < last.thresholds ? 'lit' : ''} style={{ left: `${Math.min(100, th.share * 100)}%` }} />
              ))}
            </div>
            <span className="small">{last ? `${last.thresholds} lanterne${last.thresholds > 1 ? 's' : ''} sur ${last.of}` : '—'}</span>
          </div>
        </Tip>
        <Tip content={<TipHead title="Coffre du lundi" sub={`Vos ${r.bestNights} meilleurs soirs de la semaine : des matières, et une chance d’équipement Épique.`} />}>
          <div className="tide-stat">
            <span className="tide-stat-big">
              {view.week.nights}/{view.week.bestNights}
            </span>
            <span className="muted small">soirs · coffre</span>
          </div>
        </Tip>
      </div>
      {last && last.recap.length > 0 && <TideRecap awards={last.recap} />}

      <details className="tide-more">
        <summary>Boutique des éclats</summary>
        <ul className="tide-shop-list">
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
      </details>
      {view.patron && (
        <details className="tide-more">
          <summary>Offrir la Marée</summary>
          <PatronSection patron={view.patron} gold={state.gold} run={run} />
        </details>
      )}
      {view.nights.length > 0 && (
        <details className="tide-more">
          <summary>Vos derniers soirs</summary>
          <ul className="tide-nights-list">
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

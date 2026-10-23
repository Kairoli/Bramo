import { type CSSProperties, useEffect, useState } from 'react';
import type { TideRankingRow, TideRankingView } from '@bramo/shared';
import { api } from '../api';
import { num } from '../format';
import { Character } from '../rig/Character';
import { Modal } from './ui';
import { AWARD_ICON } from './TideLive';
import { Avatar } from './Avatar';
import { PlayerName } from './ProfileLink';

/**
 * Le classement d'un soir de Marée [demande de Louis, 23 octobre : « un top 10 dans chaque catégorie, plus visuel, une
 * fenêtre complète s'il le faut ; il faut que ce soit sympa à regarder »] : un onglet par catégorie, le podium avec les
 * personnages, les places 4 à 10 en barres, et la place du joueur.
 */

const COLOR: Record<string, string> = {
  mvp: 'var(--clan)',
  damage: 'var(--action)',
  healing: 'var(--good)',
  shielding: 'var(--event)',
  control: 'var(--magic)',
  work: 'var(--market)',
};

/** Ce que mesure chaque catégorie, en une phrase. */
const EXPLAIN: Record<string, string> = {
  mvp: 'Les points du soir : votre combat comparé à un build moyen de votre niveau (de 0,4 à 2 fois), bonus en direct compris, ou votre travail pour la digue. Un joueur très bien équipé pour son niveau peut être le pilier sans faire le plus de dégâts bruts.',
  damage: 'Les dégâts portés à la Marée, en moyenne sur ses combats du soir.',
  healing: 'Les soins réellement rendus (sans compter ce qui dépasse les points de vie).',
  shielding: 'Les dégâts absorbés par les boucliers qu’il a posés.',
  control: 'Les dégâts ennemis évités grâce à ses affaiblissements et ralentissements.',
  work: 'Les points de ceux qui ont travaillé pour la digue : tout livrer vaut un très bon combattant.',
};

const MEDAL = ['or', 'argent', 'bronze'];

export function TideRanking({ demo, tide, onClose }: { demo: boolean; tide?: string; onClose: () => void }) {
  const [view, setView] = useState<TideRankingView | null | undefined>(undefined);
  const [tab, setTab] = useState('mvp');
  useEffect(() => {
    api
      .tideRanking(demo, tide)
      .then(setView)
      .catch(() => setView(null));
  }, [demo, tide]);
  const cat = view?.categories.find((c) => c.key === tab) ?? view?.categories[0];
  const color = COLOR[cat?.key ?? 'mvp'];
  const date = view ? new Date(view.day * 86_400_000).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) : '';
  const podium = cat ? [cat.top[1], cat.top[0], cat.top[2]] : [];
  const best = cat?.top[0]?.value ?? 1;

  return (
    <Modal onClose={onClose} className="rank-modal">
      {view === undefined ? (
        <p className="muted">Chargement du classement…</p>
      ) : view === null ? (
        <div className="rank-empty">
          <h2>Pas encore de classement</h2>
          <p className="muted">Le classement d’un soir s’affiche une fois la Marée finie (après 21 h).</p>
          <button className="btn" onClick={onClose}>
            Fermer
          </button>
        </div>
      ) : (
        <>
          <header className="rank-hero">
            <div>
              <span className="eyebrow">Classement de la Marée{view.demo ? ' · démonstration' : ''}</span>
              <h2>{view.name}</h2>
              <span className="muted rank-date">{date}</span>
            </div>
            <div className="rank-hero-stats">
              <span>
                <strong>{num(view.participants)}</strong>
                <span className="muted small">à la digue</span>
              </span>
              <span>
                <strong>
                  {num(view.points)}
                  <span className="muted small"> / {num(view.objective)}</span>
                </strong>
                <span className="muted small">points du serveur</span>
              </span>
              <span>
                <span className="rank-lanterns" aria-label={`${view.lit} lanternes sur ${view.of}`}>
                  {Array.from({ length: view.of }, (_, i) => (
                    <i key={i} className={i < view.lit ? 'lit' : ''} />
                  ))}
                </span>
                <span className="muted small">lanternes allumées</span>
              </span>
            </div>
            <button className="btn btn-ghost btn-sm rank-close" onClick={onClose} aria-label="Fermer">
              ✕
            </button>
          </header>

          <nav className="rank-tabs" role="tablist">
            {view.categories.map((c) => (
              <button key={c.key} role="tab" aria-selected={c.key === cat?.key} className={c.key === cat?.key ? 'on' : ''} style={{ '--rc': COLOR[c.key] } as CSSProperties} onClick={() => setTab(c.key)}>
                <svg viewBox="0 0 24 24" aria-hidden>
                  <path d={AWARD_ICON[c.key as keyof typeof AWARD_ICON]} />
                </svg>
                <span>{c.short}</span>
                <span className="rank-tab-count">{c.count}</span>
              </button>
            ))}
          </nav>

          {cat && (
            <section className="rank-body" style={{ '--rc': color } as CSSProperties}>
              <div className="rank-title">
                <h3>{cat.title}</h3>
                <p className="muted small">{EXPLAIN[cat.key]}</p>
              </div>
              {cat.top.length === 0 ? (
                <p className="muted rank-none">Personne dans cette catégorie ce soir-là.</p>
              ) : (
                <>
                  <div className="rank-podium">
                    {podium.map((r, i) =>
                      r ? <Podium key={r.characterId} r={r} place={i === 1 ? 0 : i === 0 ? 1 : 2} unit={cat.unit} /> : <span key={`empty${i}`} className="rank-step-empty" />,
                    )}
                  </div>
                  <ol className="rank-list" start={4}>
                    {cat.top.slice(3).map((r) => (
                      <li key={r.characterId} className={r.me ? 'me' : ''}>
                        <span className="rank-n">{r.rank}</span>
                        <Avatar id={r.characterId} version={r.avatar} name={r.name} classId={r.appearance?.classId} appearance={r.appearance} size={46} />
                        <span className="rank-name">
                          <PlayerName id={r.characterId}>{r.name}</PlayerName>
                          {r.me && <span className="rank-you">vous</span>}
                          {r.live && <span className="rank-live">en direct</span>}
                        </span>
                        <span className="rank-bar">
                          <span style={{ width: `${(r.value / best) * 100}%` }} />
                        </span>
                        <span className="rank-value">
                          <strong>{num(r.value)}</strong>
                          <span className="muted small"> {Math.round((r.value / Math.max(1, cat.total)) * 100)} %</span>
                        </span>
                      </li>
                    ))}
                  </ol>
                </>
              )}
              <footer className="rank-me">
                {cat.me ? (
                  <>
                    <span className="rank-n">{cat.me.rank}</span>
                    <span>
                      <strong>Vous</strong> · {cat.me.rank === 1 ? '1er' : `${cat.me.rank}e`} sur {cat.count}
                    </span>
                    <span className="rank-bar">
                      <span style={{ width: `${(cat.me.value / best) * 100}%` }} />
                    </span>
                    <span className="rank-value">
                      <strong>{num(cat.me.value)}</strong> <span className="muted small">{cat.unit}</span>
                    </span>
                  </>
                ) : (
                  <span className="muted rank-me-none">{view.demo ? 'Démonstration : vous n’êtes pas dans cette soirée d’essai.' : 'Vous n’êtes pas classé dans cette catégorie ce soir-là.'}</span>
                )}
              </footer>
            </section>
          )}
        </>
      )}
    </Modal>
  );
}

/** Une marche du podium : le personnage debout, sa médaille, son nom, sa valeur. */
function Podium({ r, place, unit }: { r: TideRankingRow; place: number; unit: string }) {
  return (
    <div className={`rank-step step-${place + 1}${r.me ? ' me' : ''}`}>
      <div className="rank-step-figure">{r.appearance && <Character appearance={r.appearance} lod="scene" centered />}</div>
      <div className="rank-step-block">
        <span className={`rank-medal medal-${MEDAL[place]}`}>{r.rank}</span>
        <span className="rank-step-who">
          <Avatar id={r.characterId} version={r.avatar} name={r.name} classId={r.appearance?.classId} size={place === 0 ? 56 : 46} />
          <PlayerName id={r.characterId} className="rank-step-name">{r.name}</PlayerName>
        </span>
        <span className="rank-step-value">{num(r.value)}</span>
        <span className="muted small">{unit}</span>
        {r.live && <span className="rank-live">en direct</span>}
      </div>
    </div>
  );
}

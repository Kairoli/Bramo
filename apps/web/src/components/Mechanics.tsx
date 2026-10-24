import type { CSSProperties } from 'react';
import type { CombatView, MechanicView, TimelineEvent } from '@bramo/shared';
import { useGame } from '../game/GameContext';
import { useNow } from '../game/useLive';
import { Tip, TipFoot, TipHead, TipLine } from './Tip';

/**
 * Les mécaniques d'une rencontre (fenêtres, garde, érosion, renforts…), expliquées au survol avec ce qui y répond, et
 * suivies en direct pendant le combat [Louis, 24 octobre : « chaque zone ou boss a une mécanique un peu spéciale ; sans
 * explication, impossible de deviner ce qu'il se passe »].
 */

const ICON: Record<MechanicView['id'], string> = {
  windows: 'M6 3h12M6 21h12M7 3c0 5 10 5 10 9s-10 4-10 9M17 3c0 5-10 5-10 9',
  erosion: 'M12 3c3 4 6 7 6 11a6 6 0 0 1-12 0c0-4 3-7 6-11zM9 15a3 3 0 0 0 3 3',
  guard: 'M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z',
  adds: 'M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3 20c0-3 3-5 6-5s6 2 6 5M17 11a3 3 0 1 0 0-6M21 20c0-2.5-1.5-4.3-4-5',
  heavy: 'M4 20l9-9M11 4l9 9-3 3-9-9zM14 7l3 3',
  charge: 'M13 2L5 14h6l-1 8 8-12h-6z',
  aura: 'M12 12m-3 0a3 3 0 1 0 6 0 3 3 0 1 0-6 0M12 3a9 9 0 0 1 0 18M12 3a9 9 0 0 0 0 18',
  regen: 'M12 5v14M5 12h14',
  group: 'M8 8a3 3 0 1 0 0-.01M16 8a3 3 0 1 0 0-.01M3 19c0-3 2-5 5-5s5 2 5 5M11 19c0-3 2-5 5-5s5 2 5 5',
  enrage: 'M12 3c2 3 5 5 5 9a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3 0-5 1-8zM5 21h14',
};
const TONE: Record<MechanicView['id'], string> = {
  windows: '#7ED6A2',
  erosion: '#8FD8F5',
  guard: '#E3C770',
  adds: '#F08A4B',
  heavy: '#FF7C7C',
  charge: '#FF7C7C',
  aura: '#B39DF5',
  regen: '#7ED6A2',
  group: '#A9B3B5',
  enrage: '#FF7C7C',
};

const sec = (x: number) => `${Math.max(0, Math.ceil(x))} s`;

/** L'état en direct d'une mécanique à l'instant c du combat : un mot court, et s'il faut y prêter attention. */
function liveState(m: MechanicView, c: number, timeline: TimelineEvent[]): { text: string; hot: boolean } | null {
  const l = m.live;
  if (m.id === 'windows' && l?.period && l.open) {
    const phase = c % l.period;
    const open = phase >= l.period - l.open;
    return open ? { text: `ouverte · ${sec(l.period - phase)}`, hot: true } : { text: `fermée · ${sec(l.period - l.open - phase)}`, hot: false };
  }
  const last = [...timeline].reverse().find((e) => e.t <= c);
  if (m.id === 'guard') return last?.guard ? { text: 'levée', hot: true } : l?.period ? { text: `dans ${sec(l.period - (c % l.period))}`, hot: false } : null;
  if (m.id === 'erosion') return { text: `×${last?.erosion ?? 0}`, hot: (last?.erosion ?? 0) >= (l?.max ?? 99) };
  if (m.id === 'adds' && l?.waves) {
    const next = l.waves.filter((w) => w.at > c).sort((a, b) => a.at - b.at)[0];
    return next ? { text: `dans ${sec(next.at - c)}`, hot: next.at - c < 3 } : { text: 'tous là', hot: false };
  }
  if ((m.id === 'charge' || m.id === 'regen') && l?.period) {
    const left = l.period - (c % l.period);
    return { text: `dans ${sec(left)}`, hot: left < 2 };
  }
  return null;
}

export function MechanicChips({ mechanics, timeline, clock, compact }: { mechanics: MechanicView[]; timeline?: TimelineEvent[]; clock?: number | null; compact?: boolean }) {
  if (!mechanics.length) return null;
  return (
    <div className={`mech-chips${compact ? ' compact' : ''}`}>
      {mechanics.map((m) => {
        const live = clock != null && timeline ? liveState(m, clock, timeline) : null;
        return (
          <Tip
            key={m.id}
            content={
              <>
                <TipHead
                  icon={
                    <span className="mech-icon big" style={{ color: TONE[m.id] }}>
                      <svg viewBox="0 0 24 24" aria-hidden>
                        <path d={ICON[m.id]} />
                      </svg>
                    </span>
                  }
                  title={m.name}
                  sub={live ? `En ce moment : ${live.text}` : 'Mécanique de la rencontre'}
                  color={TONE[m.id]}
                />
                <div className="tip-body">{m.text}</div>
                {m.answers.length > 0 && (
                  <>
                    <div className="tip-section">Ce qui y répond</div>
                    {m.answers.map((a) => (
                      <TipLine key={a} mark="▸" color={TONE[m.id]}>
                        {a}
                      </TipLine>
                    ))}
                  </>
                )}
                {m.answers.length > 0 && <TipFoot>Une seule réponse suffit souvent à passer quelques paliers plus tôt ; aucune n’est obligatoire.</TipFoot>}
              </>
            }
          >
            <span className={`mech-chip${live?.hot ? ' hot' : ''}`} style={{ '--mc': TONE[m.id] } as CSSProperties}>
              <span className="mech-icon">
                <svg viewBox="0 0 24 24" aria-hidden>
                  <path d={ICON[m.id]} />
                </svg>
              </span>
              {!compact && <span className="mech-name">{m.name}</span>}
              {live && <span className="mech-live">{live.text}</span>}
            </span>
          </Tip>
        );
      })}
    </div>
  );
}

/** Les mécaniques de la rencontre en cours, suivies au rythme du combat rejoué à l'écran. */
export function LiveMechanics({ view, compact }: { view: CombatView; compact?: boolean }) {
  const { receivedAt } = useGame();
  const now = useNow(250);
  const a = view.activity;
  if (!a?.mechanics.length) return null;
  const c = a.timeline ? (a.progressMs + (now - receivedAt)) / 1000 : null;
  // Entre deux rencontres (le repos), plus rien ne bouge : on garde les explications sans l'état en direct.
  const live = c !== null && a.fightTime !== null && c <= a.fightTime ? c : null;
  return <MechanicChips mechanics={a.mechanics} timeline={a.timeline ?? []} clock={live} compact={compact} />;
}

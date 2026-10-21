import { useEffect, useRef } from 'react';
import type { JournalEntry } from '@bramo/shared';
import { useGame } from '../../game/GameContext';
import { hhmm } from '../../format';

const KIND: Record<JournalEntry['kind'], { label: string; color: string }> = {
  absence: { label: 'Absence', color: 'var(--event)' },
  levelup: { label: 'Niveau', color: 'var(--good)' },
  finished: { label: 'Métier', color: 'var(--action)' },
  started: { label: 'File', color: 'var(--action)' },
  info: { label: '', color: 'var(--action)' },
  trial: { label: 'Épreuve', color: 'var(--clan)' },
  combat: { label: 'Combat', color: 'var(--alert)' },
};

export function JournalPanel() {
  const { journal, showAbsence } = useGame();
  const listRef = useRef<HTMLDivElement>(null);
  const entries = [...journal].reverse();

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [journal.length]);

  return (
    <section className="panel journal">
      <div className="tabs journal-tabs" role="tablist">
        <button role="tab" aria-selected="false" disabled title="Bientôt">
          Tout
        </button>
        <button role="tab" aria-selected="true">
          Journal
        </button>
        <button role="tab" aria-selected="false" disabled title="Bientôt">
          Clan
        </button>
        <button role="tab" aria-selected="false" disabled title="Bientôt">
          Serveur
        </button>
      </div>
      <div className="journal-list scroll" ref={listRef}>
        {entries.length === 0 && <p className="muted">Votre journal est vide. Lancez une première activité !</p>}
        {entries.map((e) => (
          <p key={e.id} className="journal-line">
            <span className="journal-time">{hhmm(e.at)}</span>
            {KIND[e.kind].label && <span style={{ color: KIND[e.kind].color, fontWeight: 600 }}>{KIND[e.kind].label} </span>}
            {e.text}
            {e.kind === 'absence' && e.data && (
              <button className="link journal-more" onClick={() => showAbsence(e.data!)}>
                Revoir
              </button>
            )}
          </p>
        ))}
      </div>
      <div className="sunken journal-input">
        <input placeholder="La discussion arrive bientôt…" disabled />
        <button className="btn btn-sm" disabled>
          Envoyer
        </button>
      </div>
    </section>
  );
}

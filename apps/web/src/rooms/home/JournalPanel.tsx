import { type CSSProperties, type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import type { ChatMessageView, ChatView, JournalEntry, TownEvent } from '@bramo/shared';
import { Avatar } from '../../components/Avatar';
import { PlayerName } from '../../components/ProfileLink';
import { FirstSteps } from './FirstSteps';
import { api } from '../../api';
import { useGame } from '../../game/GameContext';
import { hhmm } from '../../format';

/**
 * Journal de l'accueil, lisible d'un coup d'œil (retour de Louis : « gros pâté de texte ») : une icône de couleur par
 * sorte, le début de la ligne en titre, les lignes répétées fusionnées (« Vestiges » ×3), l'heure une fois par groupe.
 * Onglets : tout, combat, métiers, puis le journal du clan et le fil du serveur, avec leur discussion (23 octobre) : les
 * messages des joueurs s'y mêlent aux événements ; on peut signaler un message, masquer un joueur, et un modérateur peut
 * supprimer ou rendre muet.
 */

/** Joueurs masqués par ce joueur (dans ce navigateur). */
const IGNORED = 'bramo.ignored';
function readIgnored(): number[] {
  try {
    return JSON.parse(localStorage.getItem(IGNORED) ?? '[]') as number[];
  } catch {
    return [];
  }
}

type Tab = 'all' | 'combat' | 'crafts' | 'clan' | 'server';
type Tone = 'event' | 'good' | 'action' | 'clan' | 'alert' | 'magic' | 'muted';

interface Line {
  key: string;
  at: number;
  tone: Tone;
  icon: string;
  title: string | null;
  text: string;
  count: number;
  /** Absence : son résumé à revoir. */
  data?: JournalEntry['data'];
  /** Butin qui compte (trophée, nommé, ensemble, Épique, Légendaire) : la ligne ressort à la couleur de sa rareté. */
  notable?: string;
}

const ICON = {
  moon: 'M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z',
  up: 'M12 4l6 7h-4v8h-4v-8H6z',
  check: 'M5 12l4 4 10-10',
  queue: 'M4 6h16M4 12h10M4 18h7M17 15l3 3-3 3',
  dot: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
  medal: 'M8 3l4 6 4-6M12 21a6 6 0 1 0 0-12 6 6 0 0 0 0 12z',
  swords: 'M4 4l9 9M13 4h7v7M20 4L9 15M6 14l4 4M4 20l3-3',
  chest: 'M4 10h16v9H4zM4 10l2-5h12l2 5M11 13h2',
  shield: 'M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z',
  bell: 'M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 20h4',
  star: 'M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z',
};

const KIND: Record<JournalEntry['kind'], { tone: Tone; icon: string }> = {
  absence: { tone: 'event', icon: ICON.moon },
  levelup: { tone: 'good', icon: ICON.up },
  finished: { tone: 'action', icon: ICON.check },
  started: { tone: 'action', icon: ICON.queue },
  info: { tone: 'muted', icon: ICON.dot },
  trial: { tone: 'clan', icon: ICON.medal },
  combat: { tone: 'alert', icon: ICON.swords },
};
const TOWN: Record<TownEvent['kind'], { tone: Tone; icon: string }> = {
  level: { tone: 'good', icon: ICON.up },
  trial: { tone: 'clan', icon: ICON.medal },
  first: { tone: 'action', icon: ICON.star },
  join: { tone: 'event', icon: ICON.bell },
  clan: { tone: 'clan', icon: ICON.shield },
  loot: { tone: 'magic', icon: ICON.chest },
  tide: { tone: 'event', icon: ICON.bell },
};
const TONE: Record<Tone, string> = {
  event: 'var(--event)',
  good: 'var(--good)',
  action: 'var(--action)',
  clan: 'var(--clan)',
  alert: 'var(--alert)',
  magic: 'var(--magic)',
  muted: 'var(--text-muted)',
};
const RARITY: Record<string, string> = { Commun: 'common', Rare: 'rare', Épique: 'epic', Légendaire: 'legendary' };

/** Titres que le serveur donne au butin qui compte (game.ts, grantLoot). */
const NOTABLE_TITLES = ['Trophée', 'Objet nommé', 'Ensemble'];
/** La rareté d'un butin qui doit ressortir [Louis, 24 octobre : « j'ai failli le rater »], sinon rien. */
function notableOf(title: string | null, text: string): string | undefined {
  const r = /\((Commun|Rare|Épique|Légendaire), palier \d+\)/.exec(text)?.[1];
  if (!r || !title) return undefined;
  if (NOTABLE_TITLES.includes(title) || (title === 'Butin' && (r === 'Épique' || r === 'Légendaire'))) return RARITY[r];
  return undefined;
}

/** « Vestiges : 9 Galets du puits. » → titre « Vestiges », texte « 9 Galets du puits. » (début court seulement). */
function split(text: string): { title: string | null; text: string } {
  const i = text.indexOf(' : ');
  if (i > 0 && i <= 22) return { title: text.slice(0, i), text: text.slice(i + 3) };
  return { title: null, text };
}

/** Lignes voisines identiques (à 20 min près) fusionnées ; les vestiges du même objet s'additionnent. */
function merge(lines: Line[]): Line[] {
  const out: Line[] = [];
  for (const l of lines) {
    const prev = out[out.length - 1];
    const near = prev && Math.abs(l.at - prev.at) < 20 * 60_000;
    if (near && prev.title === l.title && prev.text === l.text && !l.data) {
      prev.count += l.count;
      prev.at = Math.max(prev.at, l.at);
      continue;
    }
    const a = prev && near && prev.title === 'Vestiges' && l.title === 'Vestiges' ? /^(\d+) (.+)$/.exec(prev.text) : null;
    const b = a ? /^(\d+) (.+)$/.exec(l.text) : null;
    if (a && b && a[2] === b[2]) {
      prev!.text = `${Number(a[1]) + Number(b[1])} ${a[2]}`;
      prev!.at = Math.max(prev!.at, l.at);
      continue;
    }
    out.push({ ...l });
  }
  return out;
}

/** Le texte, avec les objets tombés colorés selon leur rareté : « Pourpoint (Commun, palier 1) ». */
function rich(text: string): ReactNode {
  const parts = text.split(/([^,:]+?) \((Commun|Rare|Épique|Légendaire), palier (\d+)\)/);
  if (parts.length === 1) return text;
  const out: ReactNode[] = [];
  for (let i = 0; i < parts.length; i += 4) {
    if (parts[i]) out.push(parts[i]);
    if (parts[i + 1]) {
      out.push(
        <span key={i} className="j-item" style={{ '--rc': `var(--r-${RARITY[parts[i + 2]!]})` } as CSSProperties}>
          {parts[i + 1]!.trim()} <small>p{parts[i + 3]}</small>
        </span>,
      );
    }
  }
  return out;
}

export function JournalPanel() {
  const { journal, showAbsence, content, flash } = useGame();
  const [tab, setTab] = useState<Tab>('all');
  const [chat, setChat] = useState<ChatView | null>(null);
  const [draft, setDraft] = useState('');
  const [ignored, setIgnored] = useState<number[]>(readIgnored);
  const [clanLog, setClanLog] = useState<Line[] | null>(null);
  const [feed, setFeed] = useState<Line[] | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const classNames = useMemo(() => Object.values(content.classes).map((c) => c.name), [content]);

  // Le clan et le serveur se chargent à l'ouverture de leur onglet, puis toutes les 20 s.
  useEffect(() => {
    if (tab !== 'clan' && tab !== 'server') return;
    let live = true;
    const load = () => {
      if (tab === 'clan')
        api
          .myClan()
          .then((c) => live && setClanLog(c ? c.log.map((l): Line => ({ key: `c${l.id}`, at: l.at, tone: 'clan', icon: ICON.shield, ...split(l.text), count: 1 })).reverse() : []))
          .catch(() => {});
      else
        api
          .town()
          .then((t) => live && setFeed(t.feed.map((e) => ({ key: `s${e.id}`, at: e.at, ...TOWN[e.kind], ...split(e.text), count: 1 })).sort((a, b) => a.at - b.at)))
          .catch(() => {});
    };
    const loadChat = () =>
      api
        .chat(tab)
        .then((c) => live && setChat(c))
        .catch(() => {});
    setChat(null);
    load();
    loadChat();
    const id = window.setInterval(load, 20_000);
    const chatId = window.setInterval(loadChat, 8_000);
    return () => {
      live = false;
      window.clearInterval(id);
      window.clearInterval(chatId);
    };
  }, [tab]);

  const mine = useMemo(() => {
    const isCombat = (e: JournalEntry) => e.kind === 'combat' || (e.kind === 'levelup' && classNames.some((n) => e.text.startsWith(n)));
    const isCraft = (e: JournalEntry) => !isCombat(e) && ['levelup', 'finished', 'started', 'trial'].includes(e.kind);
    return [...journal]
      .reverse()
      .filter((e) => tab === 'all' || (tab === 'combat' ? isCombat(e) : isCraft(e)))
      .map((e): Line => {
        const parts = split(e.text);
        const notable = e.kind === 'combat' ? notableOf(parts.title, parts.text) : undefined;
        return { key: `j${e.id}`, at: e.at, ...KIND[e.kind], ...(notable ? { tone: 'magic' as const, icon: ICON.chest } : {}), ...parts, count: 1, ...(e.data ? { data: e.data } : {}), ...(notable ? { notable } : {}) };
      });
  }, [journal, tab, classNames]);

  const lines = merge(tab === 'clan' ? (clanLog ?? []) : tab === 'server' ? (feed ?? []) : mine);
  const talk = tab === 'clan' || tab === 'server';
  const messages = talk && chat?.channel === tab ? chat.messages.filter((m) => m.characterId === null || !ignored.includes(m.characterId)) : [];
  // Événements et messages, dans l'ordre du temps.
  const items: ({ kind: 'line'; at: number; line: Line } | { kind: 'chat'; at: number; msg: ChatMessageView })[] = [
    ...lines.map((line) => ({ kind: 'line' as const, at: line.at, line })),
    ...messages.map((msg) => ({ kind: 'chat' as const, at: msg.at, msg })),
  ].sort((a, b) => a.at - b.at);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [items.length, tab]);

  const send = async () => {
    if (!talk || !draft.trim()) return;
    try {
      setChat(await api.chatPost(tab, draft));
      setDraft('');
    } catch (err) {
      flash(err instanceof Error ? err.message : 'Message refusé.');
    }
  };
  const hide = (id: number) => {
    const next = [...new Set([...ignored, id])];
    setIgnored(next);
    try {
      localStorage.setItem(IGNORED, JSON.stringify(next));
    } catch {
      // Stockage indisponible : le joueur reste masqué jusqu'au rechargement.
    }
  };
  const report = (id: number) =>
    api
      .chatReport(id)
      .then(() => flash('Message signalé. Merci : trois signalements le masquent.'))
      .catch((err) => flash(err instanceof Error ? err.message : 'Signalement refusé.'));
  const moderate = (id: number, action: 'delete' | 'mute') =>
    api
      .chatModerate(id, action, action === 'mute' ? 24 : undefined)
      .then((r) => {
        flash(r.message);
        return api.chat(tab as 'server' | 'clan').then(setChat);
      })
      .catch((err) => flash(err instanceof Error ? err.message : 'Action refusée.'));

  const empty =
    tab === 'clan' ? (clanLog === null ? 'Chargement…' : 'Rien au clan pour le moment (ou pas encore de clan).') : tab === 'server' ? (feed === null ? 'Chargement…' : 'Rien à annoncer pour le moment.') : 'Rien ici pour le moment.';

  return (
    <section className="panel journal">
      {tab === 'all' && <FirstSteps />}
      <div className="tabs journal-tabs" role="tablist">
        {(
          [
            ['all', 'Tout'],
            ['combat', 'Combat'],
            ['crafts', 'Métiers'],
            ['clan', 'Clan'],
            ['server', 'Serveur'],
          ] as [Tab, string][]
        ).map(([id, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>
      <div className="journal-list scroll" ref={listRef}>
        {items.length === 0 && <p className="muted small">{empty}</p>}
        {items.map((it, i) => {
          if (it.kind === 'chat') {
            const m = it.msg;
            return (
              <div key={`m${m.id}`} className={`j-chat${m.mine ? ' mine' : ''}`}>
                <Avatar id={m.characterId} version={m.avatar} name={m.name} classId={m.classId} size={46} className="j-chat-avatar" />
                <span className="j-chat-head">
                  <PlayerName id={m.characterId}>{m.name}</PlayerName>
                  <span className="j-time">{hhmm(m.at)}</span>
                </span>
                <span className="j-chat-text">{m.text}</span>
                {!m.mine && m.characterId !== null && (
                  <span className="j-chat-actions">
                    <button className="link small" onClick={() => void report(m.id)}>
                      Signaler
                    </button>
                    <button className="link small" onClick={() => hide(m.characterId!)}>
                      Masquer ce joueur
                    </button>
                    {chat?.moderator && (
                      <>
                        <button className="link small" onClick={() => void moderate(m.id, 'delete')}>
                          Supprimer
                        </button>
                        <button className="link small" onClick={() => void moderate(m.id, 'mute')}>
                          Muet 24 h
                        </button>
                      </>
                    )}
                  </span>
                )}
              </div>
            );
          }
          const l = it.line;
          const prevItem = items[i - 1];
          const prev = prevItem ? { at: prevItem.at } : undefined;
          // Un séparateur quand plus de 20 minutes séparent deux lignes ; l'heure n'est écrite qu'une fois par minute.
          const gap = !prev || l.at - prev.at > 20 * 60_000;
          const showTime = gap || hhmm(prev.at) !== hhmm(l.at);
          return (
            <div key={l.key} className="j-group">
              {gap && prev && <div className="j-sep">{hhmm(l.at)}</div>}
              {l.data ? (
                <button className="j-absence" onClick={() => showAbsence(l.data!)}>
                  <JIcon tone={l.tone} d={l.icon} />
                  <span className="j-body">
                    <strong>{l.title ?? 'Pendant votre absence'}</strong>
                    <span>{l.text}</span>
                  </span>
                  <span className="j-more">Revoir ›</span>
                </button>
              ) : (
                <div
                  className={`j-line tone-${l.tone}${l.notable ? ' j-notable' : ''}`}
                  style={{ '--tc': l.notable ? `var(--r-${l.notable})` : TONE[l.tone], ...(l.notable ? { '--rc': `var(--r-${l.notable})` } : {}) } as CSSProperties}
                >
                  <JIcon tone={l.tone} d={l.icon} />
                  <span className="j-body">
                    {l.title && <strong>{l.title}</strong>} {rich(l.text)}
                    {l.count > 1 && <span className="j-count">×{l.count}</span>}
                  </span>
                  <span className="j-time">{showTime ? hhmm(l.at) : ''}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <form
        className="sunken journal-input"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <input
          id="chat-input"
          placeholder={!talk ? 'Choisissez Clan ou Serveur pour discuter' : chat && !chat.canWrite ? (chat.reason ?? 'Vous ne pouvez pas écrire ici.') : tab === 'clan' ? 'Écrire au clan…' : 'Écrire à tout le serveur…'}
          disabled={!talk || !chat?.canWrite}
          maxLength={content.settings.chat.maxLength}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <button className="btn btn-sm" disabled={!talk || !chat?.canWrite || !draft.trim()}>
          Envoyer
        </button>
      </form>
    </section>
  );
}

function JIcon({ tone, d }: { tone: Tone; d: string }) {
  return (
    <span className="j-icon" style={{ '--tc': TONE[tone] } as CSSProperties}>
      <svg viewBox="0 0 24 24" aria-hidden>
        <path d={d} />
      </svg>
    </span>
  );
}

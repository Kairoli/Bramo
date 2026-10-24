import { type FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import type { FriendsView, MessagesView, RelationView, SocialPerson, ThreadView } from '@bramo/shared';
import { api } from '../api';
import { useGame } from '../game/GameContext';
import { hhmm } from '../format';
import { Avatar } from './Avatar';
import { PlayerName, useOpenProfile } from './ProfileLink';
import { Modal } from './ui';
import { OrderModal } from './Orders';

/**
 * Le social : amis, demandes, blocage, messages privés (docs/design/social.md ; demande de Louis du 24 octobre ; décidé :
 * messages privés ouverts à tous par défaut). Un onglet « Amis » dans le journal de l'accueil, des boutons sur la page
 * profil d'un joueur, une conversation en fenêtre depuis n'importe où.
 */

/** Ce qui attend : messages non lus et demandes d'ami (rafraîchi toutes les 20 s). */
export function useSocialBadge(): { unread: number; requests: number; refresh: () => void } {
  const [m, setM] = useState<MessagesView | null>(null);
  const refresh = useCallback(() => {
    api
      .messages()
      .then(setM)
      .catch(() => {});
  }, []);
  useEffect(() => {
    refresh();
    const id = window.setInterval(refresh, 20_000);
    return () => window.clearInterval(id);
  }, [refresh]);
  return { unread: m?.unread ?? 0, requests: m?.requests ?? 0, refresh };
}

const seen = (p: SocialPerson, now: number) => {
  if (p.online) return p.doing ? `en ligne · ${p.doing}` : 'en ligne';
  const min = Math.round((now - p.lastSeenAt) / 60_000);
  return min < 60 ? `vu il y a ${min} min` : min < 48 * 60 ? `vu il y a ${Math.round(min / 60)} h` : `vu il y a ${Math.round(min / 1440)} j`;
};

function Person({ p, children, onClick }: { p: SocialPerson; children?: React.ReactNode; onClick?: () => void }) {
  const now = Date.now();
  return (
    <div className={`soc-row${onClick ? ' clickable' : ''}`} onClick={onClick}>
      <span className="soc-avatar">
        <Avatar id={p.id} version={p.avatar} name={p.name} classId={p.classId} size={38} />
        <i className={`soc-dot${p.online ? ' on' : ''}`} />
      </span>
      <span className="soc-text">
        <PlayerName id={p.id}>{p.name}</PlayerName>
        <span className="muted small">{seen(p, now)}</span>
      </span>
      {children && <span className="soc-actions" onClick={(e) => e.stopPropagation()}>{children}</span>}
    </div>
  );
}

/** L'onglet « Amis » du journal : les conversations, puis les amis et les demandes. */
export function SocialPanel({ onChange }: { onChange: () => void }) {
  const { flash } = useGame();
  const [view, setView] = useState<'messages' | 'friends'>('messages');
  const [open, setOpen] = useState<number | null>(null);
  const [msgs, setMsgs] = useState<MessagesView | null>(null);
  const [friends, setFriends] = useState<FriendsView | null>(null);
  const load = useCallback(() => {
    api.messages().then(setMsgs).catch(() => {});
    api.friends().then(setFriends).catch(() => {});
  }, []);
  useEffect(() => {
    load();
    const id = window.setInterval(load, 15_000);
    return () => window.clearInterval(id);
  }, [load]);
  const act = (p: Promise<{ message: string; friends: FriendsView }>) =>
    p
      .then((r) => {
        setFriends(r.friends);
        flash(r.message);
        onChange();
      })
      .catch((e) => flash(e instanceof Error ? e.message : 'Action refusée.'));

  if (open !== null)
    return (
      <Thread
        id={open}
        onBack={() => {
          setOpen(null);
          load();
          onChange();
        }}
      />
    );
  const requests = friends?.incoming.length ?? 0;
  return (
    <div className="soc-panel">
      <div className="seg-toggle soc-tabs">
        <button aria-pressed={view === 'messages'} onClick={() => setView('messages')}>
          Messages{msgs?.unread ? <span className="soc-badge">{msgs.unread}</span> : null}
        </button>
        <button aria-pressed={view === 'friends'} onClick={() => setView('friends')}>
          Amis {friends ? `· ${friends.friends.length}` : ''}
          {requests ? <span className="soc-badge">{requests}</span> : null}
        </button>
      </div>
      <div className="soc-list scroll">
        {view === 'messages' ? (
          msgs === null ? (
            <p className="muted small">Chargement…</p>
          ) : msgs.conversations.length === 0 ? (
            <p className="muted small">Aucune conversation. Écrivez à un joueur depuis sa page profil (cliquez sur son nom), ou à un ami depuis l’onglet Amis.</p>
          ) : (
            msgs.conversations.map((c) => (
              <div key={c.with.id} className={`soc-conv${c.unread ? ' unread' : ''}`} onClick={() => setOpen(c.with.id)}>
                <Person p={c.with} />
                <span className="soc-last small">
                  {c.last.mine ? 'Vous : ' : ''}
                  {c.last.text}
                </span>
                <span className="soc-time small">
                  {hhmm(c.last.at)}
                  {c.unread ? <span className="soc-badge">{c.unread}</span> : null}
                </span>
              </div>
            ))
          )
        ) : friends === null ? (
          <p className="muted small">Chargement…</p>
        ) : (
          <>
            {friends.incoming.length > 0 && <div className="eyebrow soc-head">Demandes reçues</div>}
            {friends.incoming.map((p) => (
              <Person key={p.id} p={p}>
                <button className="btn btn-sm btn-primary" onClick={() => act(api.friendRespond(p.id, true))}>
                  Accepter
                </button>
                <button className="btn btn-sm" onClick={() => act(api.friendRespond(p.id, false))}>
                  Refuser
                </button>
              </Person>
            ))}
            <div className="eyebrow soc-head">
              Amis · {friends.friends.length} / {friends.max}
            </div>
            {friends.friends.length === 0 && <p className="muted small">Pas encore d’ami : « Ajouter en ami » sur la page profil d’un joueur (cliquez sur son nom ou sa photo).</p>}
            {friends.friends.map((p) => (
              <Person key={p.id} p={p}>
                <button className="btn btn-sm" onClick={() => setOpen(p.id)}>
                  Message
                </button>
                <button className="link small" onClick={() => act(api.friendRemove(p.id))} title="Retirer de vos amis">
                  Retirer
                </button>
              </Person>
            ))}
            {friends.outgoing.length > 0 && <div className="eyebrow soc-head">Demandes envoyées</div>}
            {friends.outgoing.map((p) => (
              <Person key={p.id} p={p}>
                <button className="link small" onClick={() => act(api.friendRemove(p.id))}>
                  Annuler
                </button>
              </Person>
            ))}
            {friends.blocked.length > 0 && <div className="eyebrow soc-head">Joueurs bloqués</div>}
            {friends.blocked.map((b) => (
              <div key={b.id} className="soc-row">
                <span className="soc-text">
                  <strong>{b.name}</strong>
                </span>
                <span className="soc-actions">
                  <button className="link small" onClick={() => act(api.block(b.id, false))}>
                    Débloquer
                  </button>
                </span>
              </div>
            ))}
            {msgs && (
              <label className="soc-policy small">
                Qui peut m’écrire
                <select
                  value={msgs.dmPolicy}
                  onChange={(e) =>
                    void api
                      .dmPolicy(e.target.value as 'all' | 'friends_clan')
                      .then(setMsgs)
                      .catch(() => {})
                  }
                >
                  <option value="all">Tout le monde</option>
                  <option value="friends_clan">Mes amis et mon clan</option>
                </select>
              </label>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/** Une conversation privée : les messages, et de quoi répondre. */
export function Thread({ id, onBack }: { id: number; onBack?: () => void }) {
  const { content, flash } = useGame();
  const openProfile = useOpenProfile();
  const [t, setT] = useState<ThreadView | null>(null);
  const [draft, setDraft] = useState('');
  const list = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let live = true;
    const load = () =>
      api
        .thread(id)
        .then((x) => live && setT(x))
        .catch(() => {});
    load();
    const i = window.setInterval(load, 8_000);
    return () => {
      live = false;
      window.clearInterval(i);
    };
  }, [id]);
  useEffect(() => {
    if (list.current) list.current.scrollTop = list.current.scrollHeight;
  }, [t?.messages.length]);
  const send = async (e: FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    try {
      setT(await api.sendPrivate(id, draft));
      setDraft('');
    } catch (err) {
      flash(err instanceof Error ? err.message : 'Message refusé.');
    }
  };
  if (!t) return <p className="muted small">Chargement…</p>;
  return (
    <div className="soc-thread">
      <div className="soc-thread-head">
        {onBack && (
          <button className="btn btn-sm" onClick={onBack} aria-label="Retour aux conversations">
            ‹
          </button>
        )}
        <Person p={t.with} />
        {openProfile && (
          <button className="link small" onClick={() => openProfile(t.with.id)}>
            Profil
          </button>
        )}
      </div>
      <div className="soc-messages scroll" ref={list}>
        {t.messages.length === 0 && <p className="muted small">Aucun message. Dites bonjour !</p>}
        {t.messages.map((m) => (
          <div key={m.id} className={`soc-msg${m.mine ? ' mine' : ''}`}>
            <span className="soc-bubble">{m.text}</span>
            <span className="soc-msg-foot">
              {hhmm(m.at)}
              {!m.mine && (
                <button className="link small" onClick={() => void api.reportPrivate(m.id).then(() => flash('Message signalé : un modérateur le lira.'))}>
                  Signaler
                </button>
              )}
            </span>
          </div>
        ))}
      </div>
      <form className="sunken journal-input" onSubmit={(e) => void send(e)}>
        <input
          placeholder={t.canWrite ? `Écrire à ${t.with.name}…` : (t.reason ?? 'Vous ne pouvez pas lui écrire.')}
          disabled={!t.canWrite}
          maxLength={content.settings.chat.maxLength}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <button className="btn btn-sm" disabled={!t.canWrite || !draft.trim()}>
          Envoyer
        </button>
      </form>
    </div>
  );
}

/** La conversation en fenêtre (depuis la page profil). */
export function ThreadModal({ id, onClose }: { id: number; onClose: () => void }) {
  return (
    <Modal onClose={onClose} className="soc-modal">
      <Thread id={id} />
    </Modal>
  );
}

/** Les boutons sociaux de la page profil d'un autre joueur : ami, message, bloquer. */
export function FriendActions({ id }: { id: number }) {
  const { flash } = useGame();
  const [rel, setRel] = useState<RelationView | null>(null);
  const [talk, setTalk] = useState(false);
  const [order, setOrder] = useState(false);
  const [confirmBlock, setConfirmBlock] = useState(false);
  const reload = useCallback(() => {
    api.relation(id).then(setRel).catch(() => {});
  }, [id]);
  useEffect(reload, [reload]);
  const act = (p: Promise<{ message: string }>) =>
    p
      .then((r) => {
        flash(r.message);
        reload();
      })
      .catch((e) => flash(e instanceof Error ? e.message : 'Action refusée.'));
  if (!rel) return null;
  return (
    <span className="soc-profile-actions">
      {rel.blocked ? (
        <button className="btn btn-sm" onClick={() => act(api.block(id, false))}>
          Débloquer
        </button>
      ) : (
        <>
          {rel.friend === 'none' && (
            <button className="btn btn-sm btn-primary" onClick={() => act(api.friendRequest(id))}>
              Ajouter en ami
            </button>
          )}
          {rel.friend === 'sent' && (
            <button className="btn btn-sm" onClick={() => act(api.friendRemove(id))} title="Annuler la demande">
              Demande envoyée ✓
            </button>
          )}
          {rel.friend === 'received' && (
            <button className="btn btn-sm btn-primary" onClick={() => act(api.friendRespond(id, true))}>
              Accepter en ami
            </button>
          )}
          {rel.friend === 'friends' && <span className="chip soc-friend">Ami ✓</span>}
          {rel.canMessage && (
            <button className="btn btn-sm" onClick={() => setTalk(true)}>
              Message
            </button>
          )}
          {rel.canMessage && (
            <button className="btn btn-sm" onClick={() => setOrder(true)} title="Lui commander des objets, avec un prix et un délai">
              Passer une commande
            </button>
          )}
          {confirmBlock ? (
            <span className="soc-confirm small">
              Bloquer ? Il ne pourra plus vous écrire ni vous demander en ami.
              <button className="btn btn-sm" onClick={() => (setConfirmBlock(false), act(api.block(id, true)))}>
                Oui, bloquer
              </button>
              <button className="link small" onClick={() => setConfirmBlock(false)}>
                Non
              </button>
            </span>
          ) : (
            <button className="link small" onClick={() => setConfirmBlock(true)}>
              Bloquer
            </button>
          )}
        </>
      )}
      {talk && <ThreadModal id={id} onClose={() => setTalk(false)} />}
      {order && <OrderModal artisanId={id} onClose={() => setOrder(false)} />}
    </span>
  );
}

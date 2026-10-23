import { useEffect, useState } from 'react';
import type { MyAvatarView } from '@bramo/shared';
import { RequestError, api } from '../api';
import { useGame } from '../game/GameContext';
import { AccountModal } from './Account';
import { Avatar } from './Avatar';
import { AvatarPicker } from './AvatarPicker';
import { Modal } from './ui';

/**
 * Fenêtre Profil (en haut à droite) [demande de Louis, 23 octobre, inspirée de Legend of Mushroom] : la photo de profil
 * qu'on choisit librement, son nom, sa classe, son titre, son clan ; et l'onglet Compte (mot de passe, notifications,
 * données, déconnexion).
 */
export function ProfileModal({ onClose }: { onClose: () => void }) {
  const { name, avatar, characterId, look, state, content, act } = useGame();
  const [tab, setTab] = useState<'profile' | 'account'>('profile');
  const [mine, setMine] = useState<MyAvatarView | null>(null);
  const [picking, setPicking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    api.myAvatar().then(setMine).catch(() => {});
  }, []);
  const cls = look ? content.classes[look.classId] : undefined;
  const best = content.professions
    .map((p) => ({ p, s: state.skills[p.id]! }))
    .filter((x) => x.s)
    .sort((a, b) => b.s.xp - a.s.xp)[0];

  const run = async (call: () => Promise<MyAvatarView>, done: string) => {
    setBusy(true);
    setMsg(null);
    try {
      setMine(await call());
      await act(api.state); // la barre du haut et la discussion prennent la nouvelle photo
      setPicking(false);
      setMsg(done);
    } catch (err) {
      setMsg(err instanceof RequestError || err instanceof Error ? err.message : 'Erreur inattendue.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal onClose={onClose} className="profile-modal">
      <nav className="seg-toggle profile-tabs" role="tablist">
        <button aria-pressed={tab === 'profile'} onClick={() => setTab('profile')}>
          Profil
        </button>
        <button aria-pressed={tab === 'account'} onClick={() => setTab('account')}>
          Compte
        </button>
      </nav>
      {tab === 'account' ? (
        <AccountModal onClose={onClose} embedded />
      ) : (
        <>
          <section className="profile-card">
            <div className="profile-photo">
              <Avatar id={characterId} version={avatar} name={name} classId={look?.classId} appearance={look} size={132} />
              {!picking && (
                <div className="profile-photo-actions">
                  <button className="btn btn-primary btn-sm" onClick={() => setPicking(true)}>
                    {avatar ? 'Changer la photo' : 'Choisir une photo'}
                  </button>
                  {avatar && (
                    <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => void run(api.removeAvatar, 'Photo retirée : votre personnage reprend sa place.')}>
                      Retirer
                    </button>
                  )}
                </div>
              )}
            </div>
            <div className="profile-id">
              <span className="eyebrow">Profil</span>
              <h2>{name}</h2>
              {cls && (
                <span className="profile-line" style={{ color: cls.affinityColor }}>
                  {cls.name}
                  {state.combat ? ` · niveau ${state.combat.level}` : ''}
                </span>
              )}
              {best && (
                <span className="profile-line muted">
                  {best.s.nickname} · {best.p.name} {best.s.level}
                </span>
              )}
              <span className="profile-line muted small">Identifiant : #{characterId}</span>
              <p className="muted small">Votre photo apparaît partout où l’on vous voit : la discussion, le clan, votre fiche, les classements de la Marée, le bourg. Sans photo, c’est votre personnage.</p>
            </div>
          </section>

          {mine?.hidden && <p className="profile-warn small">Votre photo a été masquée après des signalements. Choisissez-en une autre.</p>}
          {msg && <p className="small profile-msg">{msg}</p>}

          {picking && <AvatarPicker busy={busy} onCancel={() => setPicking(false)} onSave={(img) => void run(() => api.setAvatar(img), 'Nouvelle photo enregistrée.')} />}

          <section className="profile-rules">
            <h3>Ce qu’on peut mettre</h3>
            <p className="muted small">L’image de votre choix : un personnage, un dessin, une photo. Pas de contenu choquant, haineux ou sexuel, ni la photo d’une autre personne sans son accord : les joueurs peuvent signaler une photo, elle est alors masquée, et un modérateur peut la retirer.</p>
          </section>

          {import.meta.env.DEV && (
            <a className="btn btn-ghost btn-sm profile-dev" href="#atelier">
              Atelier de personnages (développement)
            </a>
          )}
        </>
      )}
    </Modal>
  );
}

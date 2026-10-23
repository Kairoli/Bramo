import { useState } from 'react';
import { api, RequestError } from '../api';
import { useGame } from '../game/GameContext';
import { Modal } from './ui';
import { LegalLinks } from './Legal';
import { enableNotifications, notificationsOn, notificationsSupported } from './Notifier';

/**
 * Fenêtre « Compte » (sortie publique, 23 octobre) : changer son mot de passe, télécharger ses données, supprimer son compte
 * (droits d'accès et d'effacement du RGPD), et les pages légales.
 */
export function AccountModal({ onClose, embedded = false }: { onClose: () => void; embedded?: boolean }) {
  const { name, logout, flash } = useGame();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  const [delPw, setDelPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [delMsg, setDelMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notify, setNotify] = useState(notificationsOn());

  const message = (err: unknown) => (err instanceof RequestError || err instanceof Error ? err.message : 'Erreur inattendue.');

  const changePassword = async () => {
    setBusy(true);
    try {
      await api.accountPassword(current, next);
      setCurrent('');
      setNext('');
      setPwMsg('Mot de passe changé. Vos autres appareils sont déconnectés.');
    } catch (err) {
      setPwMsg(message(err));
    } finally {
      setBusy(false);
    }
  };

  const deleteAccount = async () => {
    setBusy(true);
    try {
      await api.accountDelete(delPw, confirm);
      flash('Votre compte a été supprimé.');
      logout();
    } catch (err) {
      setDelMsg(message(err));
      setBusy(false);
    }
  };

  // Les réglages du compte : seuls dans leur fenêtre, ou en onglet de la fenêtre Profil (embedded).
  const sections = (
    <>
      <section className="account-session">
        <h3>Session</h3>
        <button className="btn btn-sm" onClick={logout}>
          Se déconnecter
        </button>
      </section>

      <section>
        <h3>Changer de mot de passe</h3>
        <form
          className="account-form"
          onSubmit={(e) => {
            e.preventDefault();
            void changePassword();
          }}
        >
          <input id="pw-current" className="input" type="password" autoComplete="current-password" placeholder="Mot de passe actuel" value={current} onChange={(e) => setCurrent(e.target.value)} />
          <input id="pw-next" className="input" type="password" autoComplete="new-password" placeholder="Nouveau mot de passe (8 caractères ou plus)" value={next} onChange={(e) => setNext(e.target.value)} />
          <button className="btn btn-primary btn-sm" disabled={busy || !current || next.length < 8}>
            Changer
          </button>
        </form>
        {pwMsg && <p className="small">{pwMsg}</p>}
      </section>

      <section>
        <h3>Notifications</h3>
        <p className="muted small">Être prévenu quand plus rien ne tourne, et à l’ouverture des inscriptions de la Marée du soir à 19 h (tant qu’un onglet du jeu est ouvert).</p>
        {notificationsSupported() ? (
          <button className="btn btn-sm" onClick={() => void enableNotifications(!notify).then(setNotify)}>
            {notify ? 'Désactiver les notifications' : 'Activer les notifications'}
          </button>
        ) : (
          <p className="small">Ce navigateur ne sait pas afficher de notifications.</p>
        )}
      </section>

      <section>
        <h3>Mes données</h3>
        <p className="muted small">Tout ce que le jeu garde sur vous, dans un fichier.</p>
        <a className="btn btn-sm" href="/api/account/export" download="bramo-mes-donnees.json">
          Télécharger mes données
        </a>
      </section>

      <section className="account-danger">
        <h3>Supprimer mon compte</h3>
        <p className="muted small">Tout est effacé tout de suite, sans retour possible : personnage, objets, or, ordres au marché. Si vous dirigez un clan, la direction passe à un autre membre.</p>
        <form
          className="account-form"
          onSubmit={(e) => {
            e.preventDefault();
            void deleteAccount();
          }}
        >
          <input id="del-pw" className="input" type="password" autoComplete="current-password" placeholder="Mot de passe" value={delPw} onChange={(e) => setDelPw(e.target.value)} />
          <input id="del-confirm" className="input" placeholder="Écrivez SUPPRIMER" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          <button className="btn btn-danger btn-sm" disabled={busy || !delPw || confirm !== 'SUPPRIMER'}>
            Supprimer définitivement
          </button>
        </form>
        {delMsg && <p className="small form-error">{delMsg}</p>}
      </section>

      <LegalLinks />
    </>
  );
  if (embedded) return sections;
  return (
    <Modal onClose={onClose} className="account-modal">
      <header>
        <span className="eyebrow">Compte</span>
        <h2>{name}</h2>
      </header>
      {sections}
    </Modal>
  );
}

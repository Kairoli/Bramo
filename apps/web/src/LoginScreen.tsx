import { useState, type FormEvent } from 'react';
import { api } from './api';
import { Character } from './rig/Character';

export function LoginScreen({ onLoggedIn }: { onLoggedIn: () => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await (mode === 'login' ? api.login : api.register)(username, password);
      onLoggedIn();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login">
      <div className="panel band login-scene">
        <Character className="band-figure" />
        <div className="login-title">
          <div className="logo" style={{ fontSize: 56 }}>
            Bramo
          </div>
          <p className="muted">Métiers, clans et saisons. Le monde avance même quand vous dormez.</p>
        </div>
      </div>
      <form className="panel login-form" onSubmit={submit}>
        <h2>{mode === 'login' ? 'Se connecter' : 'Créer un compte'}</h2>
        <label>
          <span className="eyebrow">Pseudo</span>
          <input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" autoFocus required />
        </label>
        <label>
          <span className="eyebrow">Mot de passe</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            required
          />
        </label>
        {error && <p className="form-error">{error}</p>}
        <button className="btn btn-primary" disabled={busy}>
          {mode === 'login' ? 'Entrer' : 'Créer mon personnage'}
        </button>
        <button type="button" className="link" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
          {mode === 'login' ? 'Pas encore de compte ? En créer un' : 'Déjà un compte ? Se connecter'}
        </button>
      </form>
    </div>
  );
}

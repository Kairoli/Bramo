import { useState } from 'react';
import type { PresetView } from '@bramo/shared';
import { api } from '../api';
import { useGame } from '../game/GameContext';
import { SpellIcon } from './SpellIcon';

/**
 * Préréglages de build (classe, voie, sorts, équipement porté) : la liste complète dans la salle Personnage, et un sélecteur
 * rapide sur l'accueil.
 */
export function PresetsCard() {
  const { state, act, content } = useGame();
  const view = state.combat;
  const [naming, setNaming] = useState<number | 'new' | null>(null);
  const [name, setName] = useState('');
  if (!view) return null;
  const presets = view.presets;
  const submit = () => {
    const n = name.trim();
    if (naming === 'new') void act(() => api.presetSave(undefined, n || undefined));
    else if (naming !== null && n) void act(() => api.presetRename(naming, n));
    setNaming(null);
    setName('');
  };
  return (
    <div className="presets">
      <div className="card-head">
        <span className="eyebrow">Préréglages</span>
        <span className="muted small">
          {presets.length} / {view.maxPresets}
        </span>
      </div>
      {presets.length === 0 && <p className="muted small">Enregistrez votre build (classe, voie, sorts et équipement) pour y revenir en un clic.</p>}
      <div className="preset-list">
        {presets.map((p) => {
          const active = view.activePreset === p.id;
          const cls = content.classes[p.classId];
          return (
            <div key={p.id} className={`preset${active ? ' active' : ''}`} style={{ ['--cc' as string]: cls?.affinityColor ?? 'var(--border)' }}>
              <div className="preset-top">
                {naming === p.id ? (
                  <input autoFocus className="preset-input" value={name} maxLength={24} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => (e.key === 'Enter' ? submit() : e.key === 'Escape' && setNaming(null))} onBlur={submit} />
                ) : (
                  <button className="preset-name" title="Renommer" onClick={() => { setNaming(p.id); setName(p.name); }}>
                    {p.name}
                  </button>
                )}
                <span className="preset-class">
                  {cls?.name}
                  {p.pathName ? ` · ${p.pathName}` : ''}
                </span>
              </div>
              <div className="preset-spells">
                {p.spells.slice(0, 6).map((s) => (
                  <SpellIcon key={s.id} id={s.id} classId={p.classId} element={s.element === 'inherit' || s.element === 'physical' ? undefined : s.element} ultimate={s.ultimate} size={22} />
                ))}
                <span className="muted small preset-gear">{p.gear} pièce{p.gear > 1 ? 's' : ''}</span>
              </div>
              <div className="preset-actions">
                <button className={`btn btn-sm${active ? '' : ' btn-primary'}`} disabled={active} onClick={() => void act(() => api.presetApply(p.id))}>
                  {active ? 'Actif' : 'Appliquer'}
                </button>
                <button className="mini wide" title="Enregistrer le build actuel dans ce préréglage" onClick={() => void act(() => api.presetSave(p.id))}>
                  ⤓
                </button>
                <button className="mini wide" title="Supprimer" onClick={() => void act(() => api.presetDelete(p.id))}>
                  ×
                </button>
              </div>
            </div>
          );
        })}
      </div>
      {presets.length < view.maxPresets &&
        (naming === 'new' ? (
          <input autoFocus className="preset-input" placeholder="Nom du préréglage (Farm, Mur, Gardien…)" value={name} maxLength={24} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => (e.key === 'Enter' ? submit() : e.key === 'Escape' && setNaming(null))} onBlur={submit} />
        ) : (
          <button className="btn btn-sm preset-add" onClick={() => { setNaming('new'); setName(''); }}>
            + Enregistrer le build actuel
          </button>
        ))}
    </div>
  );
}

/** Sélecteur rapide (accueil) : le préréglage actif ; un clic ouvre la liste. */
export function PresetSwitch() {
  const { state, act, content, go } = useGame();
  const [open, setOpen] = useState(false);
  const view = state.combat;
  if (!view) return null;
  const active: PresetView | undefined = view.presets.find((p) => p.id === view.activePreset);
  if (!view.presets.length) {
    return (
      <button className="preset-switch empty" onClick={() => go('character')} title="Créer des préréglages dans la salle Personnage">
        Préréglages ›
      </button>
    );
  }
  return (
    <div className="preset-switch-wrap">
      <button className="preset-switch" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span className="preset-dot" style={{ background: active ? content.classes[active.classId]?.affinityColor : 'var(--border)' }} />
        {active ? active.name : 'Choisir un build'}
        <span className="muted">▾</span>
      </button>
      {open && (
        <div className="preset-menu" onMouseLeave={() => setOpen(false)}>
          {view.presets.map((p) => (
            <button
              key={p.id}
              className={`preset-menu-item${p.id === view.activePreset ? ' on' : ''}`}
              onClick={() => {
                setOpen(false);
                if (p.id !== view.activePreset) void act(() => api.presetApply(p.id));
              }}
            >
              <span className="preset-dot" style={{ background: content.classes[p.classId]?.affinityColor }} />
              <span className="preset-menu-name">{p.name}</span>
              <span className="preset-menu-spells">
                {p.spells.slice(0, 4).map((s) => (
                  <SpellIcon key={s.id} id={s.id} classId={p.classId} element={s.element === 'inherit' || s.element === 'physical' ? undefined : s.element} ultimate={s.ultimate} size={18} />
                ))}
              </span>
            </button>
          ))}
          <button className="preset-menu-item manage" onClick={() => { setOpen(false); go('character'); }}>
            Gérer les préréglages ›
          </button>
        </div>
      )}
    </div>
  );
}

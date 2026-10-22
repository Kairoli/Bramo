import { useState } from 'react';
import type { GearView, PresetView } from '@bramo/shared';
import { api } from '../api';
import { useGame } from '../game/GameContext';
import { SpellIcon } from './SpellIcon';
import { PresetEditor } from './PresetEditor';

/**
 * Préréglages de build (classe, voie, sorts, équipement porté) : la liste complète dans la salle Personnage, et un sélecteur
 * rapide sur l'accueil.
 */
export function PresetsCard({ gear }: { gear: GearView | null }) {
  const { state, act, content } = useGame();
  const view = state.combat;
  const [naming, setNaming] = useState<number | 'new' | null>(null);
  const [name, setName] = useState('');
  const [editing, setEditing] = useState<PresetView | 'new' | null>(null);
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
                <button className="mini wide" title="Modifier (classe, voie, sorts, équipement)" onClick={() => setEditing(p)}>
                  ✎
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
          <div className="preset-add-row">
            <button className="btn btn-sm btn-primary" onClick={() => setEditing('new')}>
              + Nouveau préréglage
            </button>
            <button className="btn btn-sm" onClick={() => { setNaming('new'); setName(''); }}>
              Enregistrer le build actuel
            </button>
          </div>
        ))}
      {editing && <PresetEditor preset={editing === 'new' ? null : editing} gear={gear} onClose={() => setEditing(null)} />}
    </div>
  );
}

/** Sélecteur rapide (accueil) : chaque préréglage créé, appliqué en un clic. */
export function PresetSwitch() {
  const { state, act, content } = useGame();
  const view = state.combat;
  if (!view) return null;
  if (!view.presets.length) return <span className="muted small preset-none">Aucun préréglage</span>;
  return (
    <div className="preset-chips" role="group" aria-label="Préréglages">
      {view.presets.map((p: PresetView) => {
        const on = p.id === view.activePreset;
        return (
          <button key={p.id} className={`preset-chip${on ? ' on' : ''}`} style={{ ['--cc' as string]: content.classes[p.classId]?.affinityColor }} aria-pressed={on} disabled={on} onClick={() => void act(() => api.presetApply(p.id))} title={`${content.classes[p.classId]?.name}${p.pathName ? ` · ${p.pathName}` : ''} · ${p.gear} pièce${p.gear > 1 ? 's' : ''}`}>
            <span className="preset-dot" />
            {p.name}
          </button>
        );
      })}
    </div>
  );
}

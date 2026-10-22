import { useState } from 'react';
import type { GearView, KitView, PlanEntry, PresetView } from '@bramo/shared';
import { api } from '../api';
import { useGame } from '../game/GameContext';
import { Modal } from './ui';
import { SpellIcon } from './SpellIcon';
import { GearTile, SLOT_ORDER } from './GearPanel';

const ROLE = { damage: 'Dégâts', control: 'Contrôle', support: 'Soutien' } as const;

/**
 * Composer un préréglage à la main, sans toucher au build porté : nom, classe, voie, sorts, pièces d'équipement. Part du
 * préréglage choisi, ou du build actuel pour un nouveau.
 */
export function PresetEditor({ preset, gear, onClose }: { preset: PresetView | null; gear: GearView | null; onClose: () => void }) {
  const { state, act, content } = useGame();
  const view = state.combat!;
  const worn = (gear?.items ?? []).filter((g) => g.equipped).map((g) => g.id);
  const [name, setName] = useState(preset?.name ?? '');
  const [classId, setClassId] = useState(preset?.classId ?? view.classId);
  const [path, setPath] = useState<string | null>(preset ? preset.path : view.path);
  const [plan, setPlan] = useState<PlanEntry[] | null>(preset ? preset.plan : view.advised ? null : view.plan);
  const [picked, setPicked] = useState<number[]>(preset ? preset.gearIds : worn);
  const kit = view.kits.find((k) => k.classId === classId)!;
  const pathOpen = kit.level >= view.pathLevel;
  const usable = (s: KitView['spells'][number]) => s.level <= kit.level && (!s.path || (pathOpen && s.path === path));
  const own = plan ?? [];

  const switchClass = (id: string) => {
    if (id === classId) return;
    setClassId(id);
    setPath(null);
    setPlan(null);
    setPicked(picked.filter((g) => gear?.items.find((x) => x.id === g)?.classes.includes(id)));
  };
  const switchPath = (id: string | null) => {
    setPath(id);
    // Les sorts d'une autre voie quittent le plan.
    if (plan) setPlan(plan.filter((e) => { const s = kit.spells.find((x) => x.id === e.spell); return !s?.path || s.path === id; }));
  };
  const toggleSpell = (id: string) => {
    const s = kit.spells.find((x) => x.id === id)!;
    if (own.some((e) => e.spell === id)) return setPlan(own.filter((e) => e.spell !== id));
    if (own.length >= kit.slots) return;
    // Un seul sort ultime par plan : le nouveau remplace l'ancien.
    const rest = s.ultimate ? own.filter((e) => !kit.spells.find((x) => x.id === e.spell)?.ultimate) : own;
    setPlan([...rest, { spell: id, at: 0 }]);
  };
  const pieces = (gear?.items ?? []).filter((g) => g.classes.includes(classId) && !g.worn);
  const toggleGear = (id: number, slot: string) => {
    if (picked.includes(id)) return setPicked(picked.filter((x) => x !== id));
    const same = picked.filter((x) => pieces.find((g) => g.id === x)?.slot === slot);
    const keep = slot === 'ring' ? same.slice(-1) : [];
    setPicked([...picked.filter((x) => !same.includes(x) || keep.includes(x)), id]);
  };
  const save = () => {
    void act(() => api.presetWrite({ ...(preset ? { id: preset.id } : {}), name: name.trim() || (preset?.name ?? `Build ${view.presets.length + 1}`), classId, path, plan: plan && plan.length ? plan : null, gear: picked })).then((ok) => ok && onClose());
  };

  return (
    <Modal onClose={onClose} className="preset-editor">
      <header className="prep-head">
        <h2>{preset ? 'Modifier le préréglage' : 'Nouveau préréglage'}</h2>
        <span className="muted small">Votre build actuel ne change pas.</span>
      </header>
      <input className="preset-input" placeholder="Nom (Farm, Mur, Gardien…)" value={name} maxLength={24} onChange={(e) => setName(e.target.value)} />

      <div className="eyebrow">Classe</div>
      <div className="pe-row">
        {view.kits.map((k) => (
          <button key={k.classId} className={`pe-choice${k.classId === classId ? ' on' : ''}`} style={{ ['--cc' as string]: content.classes[k.classId]?.affinityColor }} onClick={() => switchClass(k.classId)}>
            <strong>{content.classes[k.classId]?.name}</strong>
            <span className="muted small">niveau {k.level}</span>
          </button>
        ))}
      </div>

      <div className="eyebrow">Voie</div>
      <div className="pe-row">
        <button className={`pe-choice${path === null ? ' on' : ''}`} onClick={() => switchPath(null)}>
          <strong>Sans voie</strong>
          <span className="muted small">sorts de base</span>
        </button>
        {kit.paths.map((p) => (
          <button key={p.id} className={`pe-choice${path === p.id ? ' on' : ''}`} onClick={() => switchPath(p.id)} title={pathOpen ? undefined : `S’ouvre au niveau ${view.pathLevel} : gardée pour plus tard`}>
            <strong>{p.name}</strong>
            <span className="muted small">
              {ROLE[p.role]}
              {pathOpen ? '' : ` · niv. ${view.pathLevel}`}
            </span>
          </button>
        ))}
      </div>

      <div className="pe-spells-head">
        <span className="eyebrow">Sorts</span>
        <div className="seg-toggle" role="group">
          <button aria-pressed={plan === null} onClick={() => setPlan(null)}>
            Plan conseillé
          </button>
          <button aria-pressed={plan !== null} onClick={() => setPlan(own)}>
            Mon plan · {own.length} / {kit.slots}
          </button>
        </div>
      </div>
      {plan === null ? (
        <p className="muted small">Le jeu choisit les meilleurs sorts accessibles à chaque niveau.</p>
      ) : (
        <>
          <div className="pe-plan">
            {Array.from({ length: kit.slots }, (_, i) => {
              const e = own[i];
              const s = e && kit.spells.find((x) => x.id === e.spell);
              return (
                <button key={i} className={`pe-slot${s ? '' : ' empty'}`} onClick={() => s && toggleSpell(s.id)} title={s ? `${s.name} · retirer` : 'Place libre'}>
                  {s ? <SpellIcon id={s.id} classId={classId} element={s.element === 'inherit' ? undefined : (s.element as never)} ultimate={s.ultimate} size={40} /> : '+'}
                </button>
              );
            })}
          </div>
          <div className="pe-book">
            {kit.spells.map((s) => {
              const ok = usable(s);
              const used = own.some((e) => e.spell === s.id);
              return (
                <button key={s.id} className={`book-spell${used ? ' used' : ''}`} disabled={!ok} onClick={() => toggleSpell(s.id)} title={`${s.name} · niveau ${s.level}${s.path ? ` · ${kit.paths.find((p) => p.id === s.path)?.name}` : ''} · ${s.text}`}>
                  <SpellIcon id={s.id} classId={classId} element={s.element === 'inherit' ? undefined : (s.element as never)} ultimate={s.ultimate} size={36} dim={!ok} />
                  <span className="book-name">{ok ? s.name : `Niv. ${s.level}`}</span>
                </button>
              );
            })}
          </div>
        </>
      )}

      <div className="eyebrow">Équipement · {picked.length} pièce{picked.length > 1 ? 's' : ''}</div>
      {!gear ? (
        <p className="muted small">Chargement de l’équipement…</p>
      ) : (
        <div className="pe-gear">
          {SLOT_ORDER.map((slot) => {
            const list = pieces.filter((g) => g.slot === slot);
            return (
              <div key={slot} className="pe-gear-slot">
                {list.length === 0 ? (
                  <GearTile slot={slot} label="—" />
                ) : (
                  list.map((g) => <GearTile key={g.id} g={g} slot={slot} selected={picked.includes(g.id)} onClick={() => toggleGear(g.id, slot)} />)
                )}
              </div>
            );
          })}
        </div>
      )}

      <footer className="row-gap prep-foot">
        <button className="btn btn-primary" onClick={save}>
          {preset ? 'Enregistrer' : 'Créer le préréglage'}
        </button>
        <button className="btn" onClick={onClose}>
          Annuler
        </button>
      </footer>
    </Modal>
  );
}

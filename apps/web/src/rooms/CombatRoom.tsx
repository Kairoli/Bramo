import { useEffect, useMemo, useState } from 'react';
import type { CombatView, PlanEntry, SpellView } from '@bramo/shared';
import { api } from '../api';
import { useGame } from '../game/GameContext';
import { useNow } from '../game/useLive';
import { decimal, num } from '../format';
import { Bar } from '../components/ui';
import { Scene } from '../components/Scene';

const ROLE = { damage: 'Dégâts', control: 'Contrôle', support: 'Soutien' } as const;
const ELEMENT: Record<SpellView['element'], string> = { physical: 'Physique', fire: 'Feu', frost: 'Givre', lightning: 'Foudre', inherit: 'Hérité' };

/**
 * Salle Combat : la préparation est le jeu. À gauche la classe et sa voie, au centre le plan (sorts et minuteur de
 * première utilisation, puis les cooldowns), à droite les rencontres, l'activité en cours et le journal du dernier combat.
 */
export function CombatRoom() {
  const { state, content } = useGame();
  const view = state.combat;
  return (
    <main className="room combat-room">
      <section className="panel band">
        <Scene ids={['combat']} />
      </section>
      {view ? (
        <section className="panel combat-panel">
          <ClassColumn view={view} />
          <PlanColumn view={view} />
          <FightColumn view={view} />
        </section>
      ) : (
        <section className="panel soon-panel">
          <h1>Combat</h1>
          <p className="muted">{state.classId ? 'Le combat n’est pas encore disponible pour cette classe.' : `Choisissez d’abord une classe (${Object.values(content.classes).map((c) => c.name).join(', ')}).`}</p>
        </section>
      )}
    </main>
  );
}

function ClassColumn({ view }: { view: CombatView }) {
  const { act, content } = useGame();
  const span = (view.nextLevelXp ?? view.xp) - view.levelXp;
  const locked = view.level < view.pathLevel;
  return (
    <div className="combat-col">
      <div className="eyebrow">Classe</div>
      <div className="combat-class">
        <h2>{content.classes[view.classId]?.name}</h2>
        <span className="chip">Niveau {view.level}</span>
      </div>
      <Bar value={span > 0 ? (view.xp - view.levelXp) / span : 1} color="var(--alert)" />
      <p className="muted small">
        {num(Math.floor(view.xp))} XP{view.nextLevelXp ? ` · niveau suivant à ${num(view.nextLevelXp)}` : ''} · {num(Math.round(view.xpPerHour))} XP par heure de combat
      </p>
      <div className="combat-mechanic">
        <strong>{view.mechanic.label}</strong>
        <span className="muted small">{view.mechanic.state}</span>
      </div>
      <div className="eyebrow">Voie</div>
      {locked && <p className="muted small">Les voies s’ouvrent au niveau {view.pathLevel} : dégâts, contrôle ou soutien. Le choix est gratuit et se change quand on veut.</p>}
      <div className="combat-paths">
        {view.paths.map((p) => (
          <button
            key={p.id}
            className={`combat-path${view.path === p.id ? ' on' : ''}`}
            disabled={locked || view.path === p.id}
            onClick={() => void act(() => api.combatPath(p.id))}
          >
            <span className="combat-path-role">{ROLE[p.role]}</span>
            <strong>{p.name}</strong>
            <span className="muted small">{p.passive}</span>
          </button>
        ))}
      </div>
      <div className="eyebrow">Autres classes</div>
      <div className="row-gap">
        {Object.entries(view.classLevels)
          .filter(([id]) => id !== view.classId)
          .map(([id, level]) => (
            <span key={id} className="chip">
              {content.classes[id]?.name} {level}
            </span>
          ))}
      </div>
    </div>
  );
}

function PlanColumn({ view }: { view: CombatView }) {
  const { act } = useGame();
  const [draft, setDraft] = useState<PlanEntry[]>(view.plan);
  const key = JSON.stringify(view.plan);
  useEffect(() => setDraft(view.plan), [key]); // eslint-disable-line react-hooks/exhaustive-deps
  const spells = useMemo(() => Object.fromEntries(view.spells.map((s) => [s.id, s])), [view.spells]);
  const available = view.spells.filter((s) => s.available);
  const dirty = JSON.stringify(draft) !== key;
  const rows = Array.from({ length: view.slots }, (_, i) => draft[i] ?? null);
  const set = (i: number, entry: PlanEntry | null) => {
    const next = rows.map((r, j) => (j === i ? entry : r)).filter((r): r is PlanEntry => !!r);
    setDraft(next);
  };
  const move = (i: number, d: -1 | 1) => {
    const next = [...draft];
    const j = i + d;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j]!, next[i]!];
    setDraft(next);
  };
  return (
    <div className="combat-col">
      <div className="combat-head">
        <div className="eyebrow">Plan de combat</div>
        <span className={`chip${view.advised ? '' : ' chip-own'}`}>{view.advised ? 'Plan conseillé' : 'Votre plan'}</span>
      </div>
      <p className="muted small">
        Chaque sort part à son horaire (au plus {view.maxFirstUse} s), puis le combat tourne seul sur les cooldowns. L’ordre départage deux sorts prêts en même temps. Le plan conseillé, sans horaire, suffit pour commencer.
      </p>
      <div className="combat-plan scroll">
        {rows.map((entry, i) => {
          const s = entry ? spells[entry.spell] : undefined;
          return (
            <div key={i} className="combat-slot">
              <span className="combat-slot-n">{i + 1}</span>
              <select value={entry?.spell ?? ''} onChange={(e) => set(i, e.target.value ? { spell: e.target.value, at: entry?.at ?? 0 } : null)}>
                <option value="">— place vide —</option>
                {available.map((x) => (
                  <option key={x.id} value={x.id} disabled={x.id !== entry?.spell && draft.some((d) => d.spell === x.id)}>
                    {x.name} · {x.cooldown} s{x.tags.includes('ultimate') ? ' · ultime' : ''}
                  </option>
                ))}
              </select>
              <label className="combat-at" title="Première utilisation (secondes après le début du combat)">
                <input
                  type="number"
                  min={0}
                  max={view.maxFirstUse}
                  step={1}
                  value={entry?.at ?? 0}
                  disabled={!entry}
                  onChange={(e) => entry && set(i, { ...entry, at: Math.max(0, Math.min(view.maxFirstUse, Number(e.target.value) || 0)) })}
                />
                s
              </label>
              <span className="combat-slot-moves">
                <button className="link" disabled={!entry || i === 0} onClick={() => move(i, -1)} aria-label="Monter">↑</button>
                <button className="link" disabled={!entry || i >= draft.length - 1} onClick={() => move(i, 1)} aria-label="Descendre">↓</button>
              </span>
              {s && <span className="combat-slot-text muted small">{ELEMENT[s.element]} · {s.text}</span>}
            </div>
          );
        })}
      </div>
      <div className="row-gap">
        <button className="btn btn-primary btn-sm" disabled={!dirty || !draft.length} onClick={() => void act(() => api.combatPlan(draft))}>
          Enregistrer le plan
        </button>
        <button className="btn btn-sm" disabled={view.advised && !dirty} onClick={() => (dirty && !view.advised ? setDraft(view.plan) : void act(() => api.combatPlan(null)))}>
          {dirty && !view.advised ? 'Annuler' : 'Plan conseillé'}
        </button>
        {dirty && view.advised && (
          <button className="link" onClick={() => setDraft(view.plan)}>
            Annuler
          </button>
        )}
      </div>
      <details className="combat-spells">
        <summary className="muted small">Répertoire ({available.length} sorts accessibles)</summary>
        <div className="scroll combat-spell-list">
          {view.spells.map((s) => (
            <div key={s.id} className={`combat-spell${s.available ? '' : ' locked'}`}>
              <strong>{s.name}</strong> <span className="muted small">niveau {s.level} · {s.cooldown} s</span>
              <div className="muted small">{s.text}</div>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}

function FightColumn({ view }: { view: CombatView }) {
  const { act, receivedAt } = useGame();
  const now = useNow(250);
  const a = view.activity;
  // Interpolation pour l'animation seulement : le serveur reste seul juge (rendement actif = 1).
  const progress = a?.fightMs ? Math.min(1, (a.progressMs + (now - receivedAt)) / a.fightMs) : 0;
  const trainingOff = view.level >= view.training.maxLevel;
  // Une rencontre finit avant le prochain signe de vie : on redemande l'état à ce moment-là.
  const left = a?.fightMs ? a.fightMs - a.progressMs : null;
  useEffect(() => {
    if (left === null) return;
    const id = window.setTimeout(() => void act(api.state), Math.max(500, left - (Date.now() - receivedAt) + 300));
    return () => window.clearTimeout(id);
  }, [left, receivedAt, act]);
  return (
    <div className="combat-col">
      <div className="eyebrow">En cours</div>
      {a ? (
        <div className="combat-activity">
          <div className="combat-head">
            <strong>{a.name}</strong>
            <button className="btn btn-sm" onClick={() => void act(api.combatStop)}>
              Arrêter
            </button>
          </div>
          {a.encounter !== null && <Bar value={progress} color="var(--alert)" />}
          <p className="muted small">
            {a.encounter === null
              ? `XP à ${Math.round(view.training.xpShare * 100)} %, sans butin ni risque, jusqu’au niveau ${view.training.maxLevel}.`
              : `${num(a.wins)} victoire${a.wins > 1 ? 's' : ''}${a.losses ? ` · ${num(a.losses)} défaite${a.losses > 1 ? 's' : ''}` : ''}${a.streak ? ` (${a.streak} de suite)` : ''}`}
          </p>
        </div>
      ) : (
        <p className="muted small">
          {view.stopped === 'losses'
            ? 'Trois défaites de suite : le combat s’est mis en pause. Rien n’est perdu ; changez de plan ou de rencontre.'
            : view.stopped === 'training_cap'
              ? 'Le Terrain d’entraînement s’arrête ici : la suite se gagne en vraies rencontres.'
              : 'Aucun combat. Une rencontre se rejoue en boucle, en ligne comme hors ligne, et remplace l’activité de métier.'}
        </p>
      )}
      <div className="eyebrow">Rencontres d’essai</div>
      <div className="combat-encounters scroll">
        {view.encounters.map((e) => (
          <div key={e.id} className="combat-encounter">
            <div>
              <strong>{e.name}</strong>
              <div className="muted small">{e.text}</div>
            </div>
            <button className="btn btn-sm" disabled={a?.encounter === e.id} onClick={() => void act(() => api.combatStart(e.id))}>
              {a?.encounter === e.id ? 'En cours' : 'Combattre'}
            </button>
          </div>
        ))}
        <div className="combat-encounter">
          <div>
            <strong>Terrain d’entraînement</strong>
            <div className="muted small">
              {Math.round(view.training.xpShare * 100)} % de l’XP, sans combat réel, jusqu’au niveau {view.training.maxLevel}
            </div>
          </div>
          <button className="btn btn-sm" disabled={trainingOff || (!!a && a.encounter === null)} onClick={() => void act(() => api.combatStart(null))}>
            {a && a.encounter === null ? 'En cours' : 'S’entraîner'}
          </button>
        </div>
      </div>
      <div className="eyebrow">Dernier combat</div>
      {view.lastFight ? (
        <div className="combat-log scroll">
          <p className="small">
            <strong style={{ color: view.lastFight.win ? 'var(--good)' : 'var(--alert)' }}>{view.lastFight.win ? 'Victoire' : 'Défaite'}</strong> · {view.lastFight.name} · {decimal(view.lastFight.time)} s
          </p>
          {view.lastFight.lines.map((l, i) => (
            <div key={i} className="combat-line small">
              <span className="muted">{decimal(l.t)} s</span> {l.text}
            </div>
          ))}
        </div>
      ) : (
        <p className="muted small">Le journal du dernier combat s’affichera ici : sorts lancés, Braises dépensées, runes lues, Ruptures.</p>
      )}
    </div>
  );
}

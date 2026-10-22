import { type ReactNode, useEffect, useMemo, useState } from 'react';
import type { CombatView, EncounterView, PlanEntry, SpellView } from '@bramo/shared';
import { api } from '../api';
import { useGame } from '../game/GameContext';
import { useNow } from '../game/useLive';
import { decimal, num } from '../format';
import { Bar, Modal } from '../components/ui';
import { Scene } from '../components/Scene';
import { LiveFight } from '../components/LiveFight';
import { SpellIcon } from '../components/SpellIcon';

const ROLE = { damage: 'Dégâts', control: 'Contrôle', support: 'Soutien' } as const;

type Sheet = 'prep' | 'class' | 'patrol' | 'log';

/**
 * Salle Combat, comme un écran de jeu : en haut le combat en direct (étape, barre de sorts avec leurs recharges) ; en
 * bas la carte de la route et les modes de jeu. Les détails (préparation, classe, patrouilles, journal) s'ouvrent en
 * fenêtre.
 */
export function CombatRoom() {
  const { state, content } = useGame();
  const view = state.combat;
  const [sheet, setSheet] = useState<Sheet | null>(null);
  if (!view) {
    return (
      <main className="room combat-room">
        <section className="panel band">
          <Scene ids={['combat']} />
        </section>
        <section className="panel soon-panel">
          <h1>Combat</h1>
          <p className="muted">{state.classId ? 'Le combat n’est pas encore disponible pour cette classe.' : `Choisissez d’abord une classe (${Object.values(content.classes).map((c) => c.name).join(', ')}).`}</p>
        </section>
      </main>
    );
  }
  return (
    <main className="room combat-room">
      <section className="panel band combat-arena">
        <Scene ids={['combat']} />
        <LiveFight view={view} insetTop={54} insetBottom={70} />
        <ArenaHud view={view} />
        <SpellBar view={view} onEdit={() => setSheet('prep')} />
      </section>
      <div className="combat-hub">
        <RouteMap view={view} />
        <ModeGrid view={view} open={setSheet} />
      </div>
      {sheet === 'prep' && (
        <Modal onClose={() => setSheet(null)} className="combat-sheet">
          <PrepSheet view={view} />
        </Modal>
      )}
      {sheet === 'class' && (
        <Modal onClose={() => setSheet(null)} className="combat-sheet">
          <ClassSheet view={view} />
        </Modal>
      )}
      {sheet === 'patrol' && (
        <Modal onClose={() => setSheet(null)} className="combat-sheet">
          <h2>Patrouilles</h2>
          <p className="muted small">Choisissez une zone à farmer en boucle, au palier de votre choix : la route, elle, avance toute seule.</p>
          <WorldPicker view={view} />
        </Modal>
      )}
      {sheet === 'log' && (
        <Modal onClose={() => setSheet(null)} className="combat-sheet">
          <LogSheet view={view} />
        </Modal>
      )}
    </main>
  );
}

// --- Le combat en direct -------------------------------------------------------------------------------------------

/** Ce qui se passe, par-dessus la scène : classe et niveau, étape, victoires ; d'une patrouille, le retour à la route. */
function ArenaHud({ view }: { view: CombatView }) {
  const { act, content } = useGame();
  const a = view.activity;
  const span = (view.nextLevelXp ?? view.xp) - view.levelXp;
  const label = !a ? 'En route' : a.encounter === null ? 'Entraînement' : a.route ? `Étape ${a.stageLabel}` : 'Patrouille';
  return (
    <>
      <div className="hud-class">
        <span className="hud-level">{view.level}</span>
        <span className="hud-class-text">
          <strong>{content.classes[view.classId]?.name}</strong>
          <Bar value={span > 0 ? (view.xp - view.levelXp) / span : 1} color="var(--alert)" />
        </span>
      </div>
      <div className="hud-stage">
        <span className={`hud-chip${a?.guardian ? ' guardian' : ''}`}>{label}</span>
        <strong>{a ? a.name : 'La route reprend'}</strong>
        {a?.tier ? <span className="muted">palier {a.tier}</span> : null}
      </div>
      <div className="hud-right">
        {a && a.encounter !== null && (
          <span className="hud-score">
            <span style={{ color: 'var(--good)' }}>{num(a.wins)}</span> / <span style={{ color: 'var(--alert)' }}>{num(a.losses)}</span>
          </span>
        )}
        {a && !a.route && (
          <button className="hud-btn primary" onClick={() => void act(api.combatStop)}>
            Retour à la route
          </button>
        )}
      </div>
    </>
  );
}

/** Barre de sorts : l'attaque de base, puis le plan, avec la recharge de chaque sort au fil du combat montré. */
function SpellBar({ view, onEdit }: { view: CombatView; onEdit: () => void }) {
  const { receivedAt } = useGame();
  const now = useNow(100);
  const a = view.activity;
  const spells = useMemo(() => Object.fromEntries(view.spells.map((s) => [s.id, s])), [view.spells]);
  const c = a?.timeline ? (a.progressMs + (now - receivedAt)) / 1000 : null;
  const casts = a?.timeline?.filter((e) => e.kind === 'cast') ?? [];
  const basics = a?.timeline?.filter((e) => e.kind === 'basic') ?? [];
  const lastBasic = c === null ? null : [...basics].reverse().find((e) => e.t <= c + 0.3);
  return (
    <div className="spell-bar">
      <div className={`spell-slot${lastBasic && c !== null && c - lastBasic.t < 0.25 && c >= lastBasic.t - 0.3 ? ' fire' : ''}`} title="Attaque de base">
        <SpellIcon id={`basic_${view.classId}`} classId={view.classId} size={46} />
      </div>
      <span className="spell-bar-sep" />
      {view.plan.map((p, i) => {
        const s = spells[p.spell];
        if (!s) return null;
        const last = c === null ? null : [...casts].reverse().find((e) => e.spell === p.spell && e.t <= c);
        let left = 0;
        if (c !== null) left = last ? Math.max(0, s.cooldown - (c - last.t)) : Math.max(0, p.at - c);
        const share = last ? left / s.cooldown : p.at > 0 ? left / p.at : 0;
        const just = last && c !== null && c - last.t < 0.3;
        return (
          <div key={i} className={`spell-slot${just ? ' fire' : ''}`} title={`${s.name} · ${s.text}`}>
            <SpellIcon id={s.id} classId={view.classId} element={s.element === 'inherit' ? undefined : s.element} ultimate={s.tags.includes('ultimate')} size={46} />
            {left > 0.05 && (
              <>
                <span className="spell-cd" style={{ ['--cd' as string]: `${Math.min(1, share) * 360}deg` }} />
                <span className="spell-cd-text">{Math.ceil(left)}</span>
              </>
            )}
          </div>
        );
      })}
      {Array.from({ length: Math.max(0, view.slots - view.plan.length) }, (_, i) => (
        <button key={`e${i}`} className="spell-slot empty" onClick={onEdit} title="Place libre : préparer">
          +
        </button>
      ))}
      <button className="spell-bar-edit" onClick={onEdit} title="Préparer les sorts">
        ✎
      </button>
    </div>
  );
}

// --- La route ----------------------------------------------------------------------------------------------------------

/** Carte de la route : les chapitres, et les étapes du chapitre affiché reliées comme un chemin. */
function RouteMap({ view }: { view: CombatView }) {
  const { act } = useGame();
  const route = view.route;
  const currentChapter = route ? (route.chapters.find((c) => c.stages.some((s) => s.index === route.stage))?.number ?? 1) : 1;
  const [chapterNo, setChapterNo] = useState<number | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  if (!route) return <section className="panel route-map" />;
  const chapter = route.chapters[(chapterNo ?? currentChapter) - 1] ?? route.chapters[0]!;
  const sel = chapter.stages.find((s) => s.index === picked) ?? chapter.stages.find((s) => s.index === route.stage) ?? chapter.stages[0]!;
  const e = view.encounters.find((x) => x.id === sel.encounter);
  const open = sel.index <= route.best;
  const playing = route.running && route.stage === sel.index;
  const unlockedChapters = route.chapters.filter((c) => c.stages[0]!.index <= route.best).length;
  return (
    <section className="panel route-map">
      <header className="route-map-head">
        <button className="round-btn" disabled={chapter.number <= 1} onClick={() => { setChapterNo(chapter.number - 1); setPicked(null); }} aria-label="Chapitre précédent">
          ‹
        </button>
        <div className="route-map-title">
          <span className="eyebrow">
            Chapitre {chapter.number} / {route.chapters.length} · {chapter.region}
          </span>
          <strong>{chapter.name}</strong>
        </div>
        <button className="round-btn" disabled={chapter.number >= Math.max(unlockedChapters, currentChapter)} onClick={() => { setChapterNo(chapter.number + 1); setPicked(null); }} aria-label="Chapitre suivant">
          ›
        </button>
      </header>
      <div className="route-path">
        <svg className="route-path-line" preserveAspectRatio="none" viewBox="0 0 100 10" aria-hidden>
          <path d="M5 5 L95 5" />
        </svg>
        {chapter.stages.map((s) => {
          const done = s.index < route.best;
          const cur = s.index === route.stage;
          const locked = s.index > route.best;
          return (
            <button key={s.index} className={`path-node${done ? ' done' : ''}${cur ? ' current' : ''}${locked ? ' locked' : ''}${s.guardian ? ' guardian' : ''}${sel.index === s.index ? ' selected' : ''}`} onClick={() => setPicked(s.index)} title={`${s.label} · ${s.name} · palier ${s.tier}`}>
              <span className="path-node-dot">{s.guardian ? '♛' : s.label.split('-')[1]}</span>
              <span className="path-node-name">{s.guardian ? 'Gardien' : `P. ${s.tier}`}</span>
            </button>
          );
        })}
      </div>
      <div className="route-detail">
        <div className="route-detail-text">
          <div className="route-detail-title">
            <span className={`hud-chip${sel.guardian ? ' guardian' : ''}`}>{sel.label}</span>
            <strong>{sel.name}</strong>
            <span className="chip">Palier {sel.tier}</span>
          </div>
          {e?.blurb && <p className="small muted route-blurb">{e.blurb}</p>}
          {e && <p className="small route-mech">{e.text}</p>}
        </div>
        <div className="route-detail-actions">
          {playing ? (
            <span className="chip chip-own">En cours, en boucle</span>
          ) : (
            <button className="btn btn-primary" disabled={!open} onClick={() => void act(() => api.combatRoute(sel.index))}>
              {open ? (sel.index === route.stage ? 'Reprendre ici' : 'Rejouer ici') : 'Étape fermée'}
            </button>
          )}
          <span className="muted small">{num(route.best)} étape{route.best > 1 ? 's' : ''} franchie{route.best > 1 ? 's' : ''}</span>
        </div>
      </div>
    </section>
  );
}

// --- Les modes ---------------------------------------------------------------------------------------------------------

function ModeGrid({ view, open }: { view: CombatView; open: (s: Sheet) => void }) {
  const a = view.activity;
  const patrol = a && !a.route && a.encounter !== null;
  return (
    <section className="panel mode-grid">
      <ModeTile tone="var(--action)" icon={<PrepIcon />} title="Préparation" sub={`${view.plan.length} / ${view.slots} sorts`} onClick={() => open('prep')}>
        <span className="mode-mini">
          {view.plan.slice(0, 4).map((p) => {
            const s = view.spells.find((x) => x.id === p.spell);
            return s ? <SpellIcon key={p.spell} id={s.id} classId={view.classId} element={s.element === 'inherit' ? undefined : s.element} ultimate={s.tags.includes('ultimate')} size={20} /> : null;
          })}
        </span>
      </ModeTile>
      <ModeTile tone="var(--magic)" icon={<ClassIcon />} title="Classe et voie" sub={`Niveau ${view.level} · palier ${view.classTier}`} onClick={() => open('class')} />
      <ModeTile tone="var(--alert)" icon={<PatrolIcon />} title="Patrouilles" sub={patrol ? `En cours : ${a.name}` : 'Farmer une zone'} onClick={() => open('patrol')} />
      <ModeTile tone="var(--text-muted)" icon={<LogIcon />} title="Dernier combat" sub={view.lastFight ? `${view.lastFight.win ? 'Victoire' : 'Défaite'} · ${decimal(view.lastFight.time)} s` : 'Rien encore'} onClick={() => open('log')} />
      <ModeTile tone="var(--event)" icon={<DungeonIcon />} title="Profondeurs" sub="Donjons à salles" soon />
      <ModeTile tone="var(--good)" icon={<ScoutIcon />} title="Éclaireurs" sub="Envoyer en expédition" soon />
    </section>
  );
}

function ModeTile({ tone, icon, title, sub, onClick, soon, children }: { tone: string; icon: ReactNode; title: string; sub: string; onClick?: () => void; soon?: boolean; children?: ReactNode }) {
  return (
    <button className={`mode-tile${soon ? ' soon' : ''}`} style={{ ['--tone' as string]: tone }} onClick={onClick} disabled={soon}>
      <span className="mode-icon">{icon}</span>
      <span className="mode-text">
        <strong>{title}</strong>
        <span className="muted">{sub}</span>
        {children}
      </span>
      {soon && <span className="mode-soon">Bientôt</span>}
    </button>
  );
}

const ico = (d: string) => (
  <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);
const PrepIcon = () => ico('M4 6h16M4 12h16M4 18h10M18 16l2 2-2 2');
const ClassIcon = () => ico('M12 3l7 4v5c0 4-3 7-7 9-4-2-7-5-7-9V7z M12 8v6 M9 11h6');
const PatrolIcon = () => ico('M3 20l5-14 4 8 3-5 6 11z M8 6l1-3');
const LogIcon = () => ico('M6 3h9l3 3v15H6z M9 9h6 M9 13h6 M9 17h4');
const DungeonIcon = () => ico('M4 21V10l8-6 8 6v11 M9 21v-6h6v6 M12 4v3');
const ScoutIcon = () => ico('M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M15 9l-2 5-4 1 2-5z');

// --- Fenêtres ----------------------------------------------------------------------------------------------------------

/**
 * Préparation : la barre de sorts (ordre et premier lancer) et le répertoire. On choisit une place, puis un sort du
 * répertoire ; le minuteur dit quand le sort part la première fois (ensuite il revient sur sa recharge).
 */
function PrepSheet({ view }: { view: CombatView }) {
  const { act } = useGame();
  const [draft, setDraft] = useState<PlanEntry[]>(view.plan);
  const key = JSON.stringify(view.plan);
  useEffect(() => setDraft(view.plan), [key]); // eslint-disable-line react-hooks/exhaustive-deps
  const [slot, setSlot] = useState(0);
  const [hover, setHover] = useState<SpellView | null>(null);
  const spells = useMemo(() => Object.fromEntries(view.spells.map((s) => [s.id, s])), [view.spells]);
  const dirty = JSON.stringify(draft) !== key;
  const rows = Array.from({ length: view.slots }, (_, i) => draft[i] ?? null);
  const put = (spell: string) => {
    const at = rows[slot]?.at ?? 0;
    const next = rows.map((r) => (r?.spell === spell ? null : r));
    next[slot] = { spell, at };
    setDraft(next.filter((r): r is PlanEntry => !!r));
    setSlot(Math.min(view.slots - 1, next.filter(Boolean).length));
  };
  const remove = (i: number) => setDraft(rows.filter((r, j) => j !== i && r).filter((r): r is PlanEntry => !!r));
  const time = (i: number, d: number) => setDraft(draft.map((r, j) => (j === i ? { ...r, at: Math.max(0, Math.min(view.maxFirstUse, r.at + d)) } : r)));
  const move = (i: number, d: -1 | 1) => {
    const next = [...draft];
    const j = i + d;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j]!, next[i]!];
    setDraft(next);
  };
  const info = hover ?? (rows[slot] ? spells[rows[slot]!.spell] : null);
  return (
    <div className="prep">
      <header className="prep-head">
        <h2>Préparation</h2>
        <span className={`chip${view.advised ? '' : ' chip-own'}`}>{view.advised && !dirty ? 'Plan conseillé' : 'Votre plan'}</span>
      </header>
      <div className="prep-bar">
        {rows.map((r, i) => {
          const s = r ? spells[r.spell] : undefined;
          return (
            <div key={i} className={`prep-slot${slot === i ? ' on' : ''}`}>
              <button className="prep-slot-icon" onClick={() => setSlot(i)} onMouseEnter={() => s && setHover(s)} onMouseLeave={() => setHover(null)}>
                {s ? <SpellIcon id={s.id} classId={view.classId} element={s.element === 'inherit' ? undefined : s.element} ultimate={s.tags.includes('ultimate')} size={52} /> : <span className="prep-empty">+</span>}
                <span className="prep-n">{i + 1}</span>
              </button>
              {r && (
                <div className="prep-slot-tools">
                  <button className="mini" onClick={() => time(i, -1)} aria-label="Plus tôt">−</button>
                  <span title="Premier lancer (s)">{r.at} s</span>
                  <button className="mini" onClick={() => time(i, 1)} aria-label="Plus tard">+</button>
                </div>
              )}
              {r && (
                <div className="prep-slot-tools">
                  <button className="mini" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Avant">‹</button>
                  <button className="mini" onClick={() => remove(i)} aria-label="Retirer">×</button>
                  <button className="mini" disabled={i >= draft.length - 1} onClick={() => move(i, 1)} aria-label="Après">›</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="prep-info">
        {info ? (
          <>
            <strong>{info.name}</strong> <span className="muted small">niveau {info.level} · recharge {info.cooldown} s</span>
            <div className="small">{info.text}</div>
          </>
        ) : (
          <span className="muted small">Choisissez une place, puis un sort. Chaque sort part à son minuteur (au plus {view.maxFirstUse} s), puis revient sur sa recharge ; l’ordre départage deux sorts prêts ensemble.</span>
        )}
      </div>
      <div className="prep-book">
        {view.spells.map((s) => {
          const used = draft.some((d) => d.spell === s.id);
          return (
            <button key={s.id} className={`book-spell${used ? ' used' : ''}`} disabled={!s.available} onClick={() => put(s.id)} onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(null)} title={s.available ? s.name : `${s.name} · niveau ${s.level}`}>
              <SpellIcon id={s.id} classId={view.classId} element={s.element === 'inherit' ? undefined : s.element} ultimate={s.tags.includes('ultimate')} size={44} dim={!s.available} />
              <span className="book-name">{s.available ? s.name : `Niv. ${s.level}`}</span>
            </button>
          );
        })}
      </div>
      <footer className="row-gap prep-foot">
        <button className="btn btn-primary" disabled={!dirty || !draft.length} onClick={() => void act(() => api.combatPlan(draft))}>
          Enregistrer
        </button>
        <button className="btn" disabled={view.advised && !dirty} onClick={() => (dirty ? setDraft(view.plan) : void act(() => api.combatPlan(null)))}>
          {dirty ? 'Annuler' : 'Revenir au plan conseillé'}
        </button>
      </footer>
    </div>
  );
}

const pct = (x: number) => `${Math.round(x * 100)} %`;

function ClassSheet({ view }: { view: CombatView }) {
  const { act, content } = useGame();
  const span = (view.nextLevelXp ?? view.xp) - view.levelXp;
  const locked = view.level < view.pathLevel;
  return (
    <div className="class-sheet">
      <header className="prep-head">
        <h2>{content.classes[view.classId]?.name}</h2>
        <span className="chip">Niveau {view.level}</span>
        <span className="chip" title="Le palier de la classe ouvre les cercles des régions hautes.">Palier {view.classTier}</span>
      </header>
      <Bar value={span > 0 ? (view.xp - view.levelXp) / span : 1} color="var(--alert)" />
      <p className="muted small">
        {num(Math.floor(view.xp))} XP{view.nextLevelXp ? ` · niveau suivant à ${num(view.nextLevelXp)}` : ''} · {num(Math.round(view.xpPerHour))} XP par heure de combat
      </p>
      <div className="combat-stats">
        <Stat label="Puissance" value={num(Math.round(view.stats.power))} />
        <Stat label="PV" value={num(Math.round(view.stats.maxHp))} />
        <Stat label="Défense" value={pct(view.stats.damageReduction)} />
        <Stat label="Cadence" value={`+${pct(view.stats.haste)}`} />
        <Stat label="Critique" value={pct(view.stats.critChance)} />
        <Stat label="Dégâts crit." value={`×${decimal(view.stats.critMultiplier)}`} />
      </div>
      {view.floored && <p className="muted small">Équipement sous votre palier : le combat compte le plancher du palier. Les rencontres font tomber de meilleur équipement.</p>}
      <div className="combat-mechanic">
        <strong>{view.mechanic.label}</strong>
        <span className="muted small">{view.mechanic.state}</span>
      </div>
      <div className="eyebrow">Voie</div>
      {locked && <p className="muted small">Les voies s’ouvrent au niveau {view.pathLevel} : dégâts, contrôle ou soutien. Le choix est gratuit et se change quand on veut.</p>}
      <div className="combat-paths">
        {view.paths.map((p) => (
          <button key={p.id} className={`combat-path${view.path === p.id ? ' on' : ''}`} disabled={locked || view.path === p.id} onClick={() => void act(() => api.combatPath(p.id))}>
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="combat-stat">
      <span className="muted">{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function LogSheet({ view }: { view: CombatView }) {
  const f = view.lastFight;
  return (
    <div className="log-sheet">
      <h2>Dernier combat</h2>
      {f ? (
        <>
          <p>
            <strong style={{ color: f.win ? 'var(--good)' : 'var(--alert)' }}>{f.win ? 'Victoire' : 'Défaite'}</strong> · {f.name} · {decimal(f.time)} s
          </p>
          <div className="combat-log scroll">
            {f.lines.map((l, i) => (
              <div key={i} className="combat-line small">
                <span className="muted">{decimal(l.t)} s</span> {l.text}
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="muted">Le journal du dernier combat s’affichera ici : sorts lancés, Braises dépensées, runes lues, Ruptures.</p>
      )}
    </div>
  );
}

const ESSAIS = 'Essais';

/**
 * Patrouilles : les régions du monde, de la plus proche à la plus lointaine, puis le Terrain et les rencontres d'essai.
 * Une carte se déplie pour son histoire, son butin et, dans une région haute, le choix du cercle.
 */
function WorldPicker({ view }: { view: CombatView }) {
  const { act } = useGame();
  const a = view.activity;
  const trainingOff = view.level >= view.training.maxLevel;
  const regions = useMemo(() => {
    const byRegion = new Map<string, EncounterView[]>();
    for (const e of view.encounters) {
      const r = e.kind === 'profil' || !e.region ? ESSAIS : e.region;
      byRegion.set(r, [...(byRegion.get(r) ?? []), e]);
    }
    const low = (list: EncounterView[]) => Math.min(...list.map((e) => e.tier ?? 999));
    return [...byRegion.entries()]
      .map(([name, list]) => ({ name, list: [...list].sort((x, y) => (x.tier ?? 0) - (y.tier ?? 0) || (x.kind === 'gardien' ? 1 : 0) - (y.kind === 'gardien' ? 1 : 0)), low: low(list) }))
      .sort((x, y) => (x.name === ESSAIS ? 1 : y.name === ESSAIS ? -1 : x.low - y.low));
  }, [view.encounters]);
  // Région ouverte par défaut : celle du combat en cours, sinon la plus lointaine à la portée du palier de la classe.
  const current = a?.encounter ? regions.find((r) => r.list.some((e) => e.id === a.encounter))?.name : undefined;
  const reachable = [...regions].reverse().find((r) => r.name !== ESSAIS && r.low <= view.classTier)?.name;
  const [region, setRegion] = useState<string | null>(null);
  const shown = regions.find((r) => r.name === (region ?? current ?? reachable)) ?? regions[0];
  const [open, setOpen] = useState<string | null>(null);
  const [circle, setCircle] = useState<Record<string, number>>({});
  return (
    <>
      <div className="combat-regions" role="tablist">
        {regions.map((r) => (
          <button key={r.name} role="tab" aria-selected={shown?.name === r.name} className={`combat-region${shown?.name === r.name ? ' on' : ''}`} onClick={() => setRegion(r.name)}>
            {r.name === ESSAIS ? 'Essais' : r.name.replace(/^(Les |La |Le |L’)/, '')}
            {r.name !== ESSAIS && <span className="muted"> {r.low}</span>}
          </button>
        ))}
      </div>
      <div className="combat-encounters patrol-list scroll">
        {shown?.list.map((e) => {
          const tiers = e.tiers;
          const chosen = circle[e.id] ?? tiers[tiers.length - 1] ?? e.tier ?? null;
          const running = a?.encounter === e.id && !a.route && (!e.circles || a.tier === chosen);
          const hard = chosen !== null && chosen > view.classTier;
          const expanded = open === e.id;
          return (
            <div key={e.id} className={`combat-encounter${expanded ? ' open' : ''}${e.kind === 'gardien' ? ' guardian' : ''}`}>
              <button className="combat-encounter-head" onClick={() => setOpen(expanded ? null : e.id)} aria-expanded={expanded}>
                <span className="combat-encounter-name">
                  {e.kind === 'gardien' && <span className="combat-badge">Gardien</span>}
                  <strong>{e.name}</strong>
                </span>
                {e.tier !== null && <span className={`chip${hard ? ' chip-hard' : ''}`}>{e.circles ? `Cercles ${e.tier}+` : `Palier ${e.tier}`}</span>}
              </button>
              <div className="muted small">{e.text}</div>
              {expanded && (
                <div className="combat-encounter-more">
                  {e.blurb && <p className="small combat-blurb">{e.blurb}</p>}
                  {e.loot && <LootLine loot={e.loot} />}
                  {hard && <p className="small" style={{ color: 'var(--alert)' }}>Au-dessus de votre palier ({view.classTier}) : les ennemis y frappent plus fort que votre équipement ne le prévoit.</p>}
                </div>
              )}
              <div className="combat-encounter-actions">
                {e.circles && tiers.length > 0 && (
                  <label className="small muted combat-circle">
                    Cercle
                    <select value={chosen ?? ''} onChange={(ev) => setCircle({ ...circle, [e.id]: Number(ev.target.value) })}>
                      {tiers.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <button className="btn btn-sm" disabled={running} onClick={() => void act(() => api.combatStart(e.id, e.circles ? (chosen ?? undefined) : undefined))}>
                  {running ? 'En cours' : 'Patrouiller'}
                </button>
              </div>
            </div>
          );
        })}
        {shown?.name === ESSAIS && (
          <div className="combat-encounter">
            <div className="combat-encounter-head">
              <strong>Terrain d’entraînement</strong>
            </div>
            <div className="muted small">
              {Math.round(view.training.xpShare * 100)} % de l’XP, sans combat réel ni butin, jusqu’au niveau {view.training.maxLevel}
            </div>
            <div className="combat-encounter-actions">
              <button className="btn btn-sm" disabled={trainingOff || (!!a && a.encounter === null)} onClick={() => void act(() => api.combatStart(null))}>
                {a && a.encounter === null ? 'En cours' : 'S’entraîner'}
              </button>
            </div>
          </div>
        )}
        {shown?.name === ESSAIS && <p className="muted small">Les rencontres d’essai se jouent à votre palier, sans butin : pour tester un plan.</p>}
      </div>
    </>
  );
}

function LootLine({ loot }: { loot: NonNullable<EncounterView['loot']> }) {
  const { content } = useGame();
  return (
    <div className="combat-loot small">
      <span className="muted">Butin :</span> objets du palier
      {loot.vestige && <>, {loot.vestige}</>}
      {loot.named.map((n) => (
        <span key={n.name}>
          , <strong className="combat-named">{n.name}</strong>
          {n.nickname ? ` ${n.nickname}` : ''}
          {n.classId ? <span className="muted"> ({content.classes[n.classId]?.name})</span> : null}
        </span>
      ))}
      {loot.sets.length > 0 && <>, pièces d’ensemble : {loot.sets.join(', ')}</>}
    </div>
  );
}

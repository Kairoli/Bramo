import type { CSSProperties } from 'react';
import type { CombatView, GearView, SheetView } from '@bramo/shared';
import { useGame } from '../game/GameContext';
import { GearTile } from './GearPanel';
import { SLOT } from './GearCard';
import { POOL_LOOK, PoolText } from './PoolGauges';
import { SpellIcon } from './SpellIcon';
import { SpellTipContent } from './SpellTip';
import { Tip, TipHead } from './Tip';

/**
 * Le build d'un coup d'œil, et la fiche complète du personnage [Louis, 24 octobre : « le build est basique et pas très
 * bien agencé, refais-le pour que ce soit plus parlant » ; « un endroit où voir les stats complètes, comme dans les MMO
 * classiques »]. Le build se lit de haut en bas comme il se construit : la classe et ses sorts, les quatre places de
 * talent, les ensembles, les réponses aux mécaniques, les réserves ; puis l'équipement porté.
 */

const SLOT_ORDER = ['weapon', 'head', 'torso', 'hands', 'legs', 'feet', 'cape', 'belt', 'necklace', 'ring'];

export function BuildPanel({ gear }: { gear: GearView | null }) {
  const { state, content, go } = useGame();
  const view = state.combat;
  if (!view) return <p className="muted small">Choisissez une classe pour monter un build.</p>;
  const sheet = view.sheet;
  const path = view.paths.find((p) => p.id === view.path);
  const spells = Object.fromEntries(view.spells.map((s) => [s.id, s]));
  const items = gear?.items ?? [];
  const worn = SLOT_ORDER.flatMap((slotId) => {
    const slot = content.gearSlots[slotId];
    if (!slot) return [];
    const on = items.filter((g) => g.equipped === slotId).sort((a, b) => a.id - b.id);
    return Array.from({ length: slot.capacity }, (_, i) => ({ slotId, label: slot.name, g: on[i] }));
  });
  return (
    <div className="build-panel">
      {/* La classe, la voie, les sorts. */}
      <section className="build-block build-class" style={{ '--cc': content.classes[view.classId]?.affinityColor } as CSSProperties}>
        <div className="build-class-head">
          <span className="build-level">{view.level}</span>
          <span className="build-class-name">
            <strong>{content.classes[view.classId]?.name}</strong>
            <span className="muted small">{path ? `Voie ${path.name}` : `Voie au niveau ${view.pathLevel}`} · palier {view.classTier}</span>
          </span>
          <button className="btn btn-sm" onClick={() => go('combat')} title="Préparer les sorts dans la salle Combat">
            Sorts ›
          </button>
        </div>
        <div className="build-spells">
          {view.plan.map((p) => {
            const s = spells[p.spell];
            if (!s) return null;
            return (
              <Tip key={p.spell} content={<SpellTipContent s={s} classId={view.classId} level={view.level} pathName={view.paths.find((x) => x.id === s.path)?.name} />}>
                <span className="build-spell">
                  <SpellIcon id={s.id} classId={view.classId} element={s.element === 'inherit' ? undefined : s.element} ultimate={s.tags.includes('ultimate')} size={38} />
                </span>
              </Tip>
            );
          })}
          {Array.from({ length: Math.max(0, view.slots - view.plan.length) }, (_, i) => (
            <span key={i} className="build-spell empty" />
          ))}
        </div>
      </section>

      {sheet && <Places sheet={sheet} />}

      {sheet && sheet.sets.length > 0 && (
        <section className="build-block">
          <BlockHead title="Ensembles" />
          {sheet.sets.map((s) => (
            <div key={s.name} className="build-set">
              <div className="build-set-head">
                <strong>{s.name}</strong>
                <span className="build-pips">
                  {Array.from({ length: Math.max(4, s.count) }, (_, i) => (
                    <i key={i} className={i < s.count ? 'on' : ''} />
                  ))}
                </span>
              </div>
              {s.bonuses.map((b) => (
                <div key={b.pieces} className={`build-bonus${b.active ? ' on' : ''}`}>
                  <span className="build-bonus-n">{b.pieces} p.</span>
                  <span>
                    <PoolText text={b.text} />
                  </span>
                </div>
              ))}
            </div>
          ))}
        </section>
      )}

      <section className="build-block">
        <BlockHead title="Réponses aux mécaniques" hint="Gemmes de situation, ensembles portés à 4 pièces, préparation : chacune aide contre une mécanique des rencontres." />
        {(sheet?.answers ?? []).length ? (
          <div className="build-chips">
            {sheet!.answers.map((a) => (
              <span key={a.name} className="chip">
                {a.name}
                {a.against ? <span className="muted"> · contre {a.against}</span> : null}
              </span>
            ))}
          </div>
        ) : (
          <p className="muted small">Aucune. Devant un mur, une gemme de situation (Joaillerie) ou une préparation (Fournitures) peut changer le combat.</p>
        )}
      </section>

      <Reserves view={view} />

      <section className="build-block">
        <BlockHead title="Équipement porté" hint="Survolez une pièce pour la voir ; l’onglet Équipement pour la changer." />
        <div className="build-worn">
          {worn.map(({ slotId, label, g }, i) => (
            <div key={`${slotId}${i}`} className={`build-worn-row${g ? '' : ' empty'}`} style={g ? ({ '--rc': `var(--r-${g.rarity})` } as CSSProperties) : undefined}>
              <GearTile g={g} slot={slotId} label={label} />
              <span className="build-worn-text">
                <span className="eyebrow">{SLOT[slotId] ?? label}</span>
                {g ? (
                  <strong>
                    {g.name}
                    {g.gem ? <span className="build-gem" title={content.items[g.gem]?.name}> ◆</span> : null}
                  </strong>
                ) : (
                  <span className="muted small">rien</span>
                )}
              </span>
              {g && <span className="build-tier">p{g.tier}</span>}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function BlockHead({ title, extra, hint }: { title: string; extra?: string; hint?: string }) {
  const head = (
    <div className="build-head">
      <span className="eyebrow">{title}</span>
      {extra && <span className="muted small">{extra}</span>}
    </div>
  );
  return hint ? (
    <Tip block content={<TipHead title={title} sub={hint} />}>
      {head}
    </Tip>
  ) : (
    head
  );
}

/** Les quatre places de talent : ce qui les occupe (objets nommés d'abord, puis gemmes), et ce qui est en trop. */
function Places({ sheet }: { sheet: SheetView }) {
  const items = sheet.places.items;
  const free = Math.max(0, sheet.places.max - items.length);
  return (
    <section className="build-block">
      <BlockHead
        title="Talents"
        extra={`${Math.min(items.length, sheet.places.max)} / ${sheet.places.max} places`}
        hint="Quatre places : les objets nommés que vous portez d’abord, puis les gemmes serties (arme, torse, tête, collier). Au-delà de quatre, une gemme n’agit pas."
      />
      <div className="build-places">
        {items.map((p) => (
          <div key={p.name} className={`build-place ${p.kind}${p.active && !p.idle ? '' : ' off'}`}>
            <span className="build-place-kind">{p.kind === 'named' ? 'Objet nommé' : 'Gemme'}</span>
            <strong>{p.name}</strong>
            {p.text && (
              <span className="small build-place-text">
                <PoolText text={p.text} />
              </span>
            )}
            {!p.active && <span className="small" style={{ color: 'var(--alert)' }}>En trop : n’agit pas.</span>}
            {p.idle && <span className="small" style={{ color: 'var(--alert)' }}>{p.idle}</span>}
          </div>
        ))}
        {Array.from({ length: free }, (_, i) => (
          <div key={`f${i}`} className="build-place free">
            <span className="build-place-kind">Place libre</span>
            <span className="muted small">Un objet nommé, ou une gemme sertie (de talent ou de situation).</span>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Les réserves du build : celles qui se remplissent, celles qui se dépensent, celles qui ne servent pas. */
function Reserves({ view }: { view: CombatView }) {
  const pools = view.activity?.pools ?? [];
  if (!pools.length) return null;
  return (
    <section className="build-block">
      <BlockHead title="Réserves" hint="Ce que vos pièces remplissent et dépensent pendant un combat. Une réserve remplie que rien ne dépense ne sert à rien une fois pleine." />
      <div className="build-reserves">
        {pools.map((p) => {
          const fill = p.build.fill.length > 0;
          const spend = p.build.spend.length > 0 || p.build.use.some((u) => u.how);
          const state = fill && spend ? 'ok' : fill ? 'idle' : 'off';
          const look = POOL_LOOK[p.id];
          return (
            <Tip
              key={p.id}
              content={
                <TipHead
                  title={p.name}
                  sub={state === 'ok' ? 'Remplie et dépensée : elle travaille.' : state === 'idle' ? 'Remplie, mais rien ne la dépense : une fois pleine, elle ne sert plus. C’est la pièce qui manque.' : 'Rien dans le build ne la remplit.'}
                  color={look?.color}
                />
              }
            >
              <span className={`build-reserve ${state}`} style={{ '--pc': look?.color } as CSSProperties}>
                <span className="pool-ring" style={{ '--share': state === 'off' ? 0 : 1, '--size': '24px' } as CSSProperties}>
                  <svg viewBox="0 0 24 24" aria-hidden>
                    <path d={look?.icon ?? ''} />
                  </svg>
                </span>
                <span>{p.name}</span>
                <span className="build-reserve-state">{state === 'ok' ? 'active' : state === 'idle' ? 'rien ne la dépense' : 'rien ne la remplit'}</span>
              </span>
            </Tip>
          );
        })}
      </div>
    </section>
  );
}

/** La fiche complète, comme dans un MMO : toutes les statistiques du combat, lisibles, et ce qui les modifie. */
export function StatsPanel() {
  const { state } = useGame();
  const sheet = state.combat?.sheet;
  if (!sheet) return <p className="muted small">Choisissez une classe : la fiche montre les statistiques du combat.</p>;
  return (
    <div className="stats-panel">
      {sheet.groups.map((g) => (
        <section key={g.name} className="build-block">
          <BlockHead title={g.name} />
          {g.stats.map((s) => (
            <Tip key={s.key} block content={<TipHead title={s.label} sub={s.hint} />}>
              <div className="stats-row">
                <span>{s.label}</span>
                <strong>{s.value}</strong>
              </div>
            </Tip>
          ))}
        </section>
      ))}
      {sheet.mods.length > 0 && (
        <section className="build-block">
          <BlockHead title="Modificateurs" hint="Ce qu’ajoutent les lignes tirées de l’équipement, les ensembles et les talents." />
          {sheet.mods.map((m) => (
            <div key={m.label} className="stats-row">
              <span>{m.label}</span>
              <strong>{m.value}</strong>
            </div>
          ))}
        </section>
      )}
      <section className="build-block">
        <BlockHead title="Plafond des réserves" hint="Le maximum de chaque réserve pour ce build (lignes « au plafond », ensembles, talents)." />
        <div className="stats-pools">
          {sheet.pools.map((p) => (
            <span key={p.id} className="stats-pool" style={{ '--pc': POOL_LOOK[p.id]?.color } as CSSProperties}>
              {p.name} <strong>{p.max}</strong>
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}

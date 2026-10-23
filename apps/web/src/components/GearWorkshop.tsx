import { type CSSProperties, type ReactNode, useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import { useGame } from '../game/GameContext';
import { decimal, num, pct } from '../format';
import { GearIcon } from './GearIcon';
import { STATS } from './GearCard';
import { SlotGlyph } from './GearPanel';
import { SourceChips } from './ItemTip';
import { Tip, TipHead } from './Tip';
import { ItemIcon } from './ui';

/**
 * L'atelier d'équipement d'un métier (Forge, Tannerie, Couture, Joaillerie, Menuiserie, Enchantement), dans la salle du
 * métier, à la place des recettes [Louis, 24 octobre : le bouton était mal placé et la fenêtre « faisait gros pâté »].
 * À gauche, on filtre en un clic (emplacement en pictogrammes, rareté en couleurs, classe, orientation) et on choisit
 * une pièce dans une grille ; à droite, la pièce en grand : ce qu'elle donne, ce qu'il faut, où trouver ce qui manque,
 * « Fabriquer ». La pièce sort dans le sac d'équipement, ses lignes tirées ; parfois un chef-d'œuvre, signé.
 */

type Recipes = Awaited<ReturnType<typeof api.gearRecipes>>;
type Model = Recipes['models'][number];
const RARITIES = ['common', 'rare', 'epic', 'legendary'] as const;
const RARITY: Record<string, string> = { common: 'Commun', rare: 'Rare', epic: 'Épique', legendary: 'Légendaire' };
const SLOT_ORDER = ['head', 'torso', 'hands', 'legs', 'feet', 'weapon', 'cape', 'belt', 'necklace', 'ring'];
// Quatre rangées de pièces, trois sur un écran bas (1280 × 720).
const rowsFor = () => (typeof window !== 'undefined' && window.innerHeight < 820 ? 3 : 4);

export function GearWorkshop({ profession, switcher }: { profession: string; switcher: ReactNode }) {
  const { content, state } = useGame();
  const [data, setData] = useState<Recipes | null>(null);
  const [slot, setSlot] = useState('');
  const [rarity, setRarity] = useState('');
  const [cls, setCls] = useState<string | null>(null);
  const [side, setSide] = useState('');
  const [page, setPage] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const load = () => {
    api
      .gearRecipes(profession)
      .then(setData)
      .catch(() => setData({ level: 0, models: [] }));
  };
  useEffect(load, [profession]);

  const models = data?.models ?? [];
  const slots = useMemo(() => SLOT_ORDER.filter((s) => models.some((m) => m.slot === s)), [models]);
  // Les classes que ce métier habille ; par défaut la sienne si le métier l'habille, sinon toutes.
  const classes = useMemo(() => Object.values(content.classes).filter((c) => models.some((m) => m.classes.includes(c.id))), [models, content]);
  const classFilter = cls ?? (classes.some((c) => c.id === state.classId) ? state.classId! : '');
  const lv = data?.level ?? 1;
  const list = models
    .filter((m) => (!slot || m.slot === slot) && (!rarity || m.rarity === rarity) && (!classFilter || m.classes.includes(classFilter)) && (!side || m.orientation === side))
    // Ce qu'on peut fabriquer d'abord (le plus haut palier en tête), puis ce qui vient ensuite.
    .sort((a, b) => Number(b.recipe.level <= lv) - Number(a.recipe.level <= lv) || b.tier - a.tier || SLOT_ORDER.indexOf(a.slot) - SLOT_ORDER.indexOf(b.slot) || RARITIES.indexOf(a.rarity as 'rare') - RARITIES.indexOf(b.rarity as 'rare'));
  const [rows] = useState(rowsFor);
  const PAGE = rows * 3;
  const pages = Math.max(1, Math.ceil(list.length / PAGE));
  const at = Math.min(page, pages - 1);
  const visible = list.slice(at * PAGE, at * PAGE + PAGE);
  const sel = list.find((m) => m.id === picked) ?? visible[0] ?? null;
  const filter = (set: (v: string) => void) => (v: string) => {
    set(v);
    setPage(0);
  };

  return (
    <>
      <section className="panel recipes workshop">
        <header className="recipes-head">{switcher}</header>
        <div className="workshop-filters">
          <div className="ws-row" role="group" aria-label="Emplacement">
            <Chip on={!slot} onClick={() => filter(setSlot)('')}>
              Tout
            </Chip>
            {slots.map((s) => (
              <Tip key={s} content={<TipHead title={content.gearSlots[s]?.name ?? s} />}>
                <Chip on={slot === s} onClick={() => filter(setSlot)(slot === s ? '' : s)} icon>
                  <SlotGlyph slot={s} size={18} />
                </Chip>
              </Tip>
            ))}
          </div>
          <div className="ws-row">
            <div className="ws-group" role="group" aria-label="Rareté">
              {RARITIES.map((r) => (
                <Chip key={r} on={rarity === r} onClick={() => filter(setRarity)(rarity === r ? '' : r)} color={`var(--r-${r})`}>
                  {RARITY[r]}
                </Chip>
              ))}
            </div>
            <div className="ws-group" role="group" aria-label="Orientation">
              <Chip on={side === 'offensive'} onClick={() => filter(setSide)(side === 'offensive' ? '' : 'offensive')}>
                ⚔ Offensive
              </Chip>
              <Chip on={side === 'protective'} onClick={() => filter(setSide)(side === 'protective' ? '' : 'protective')}>
                ◈ Protectrice
              </Chip>
            </div>
          </div>
          {classes.length > 1 && (
            <div className="ws-row" role="group" aria-label="Classe">
              <Chip on={!classFilter} onClick={() => (setCls(''), setPage(0))}>
                Toutes les classes
              </Chip>
              {classes.map((c) => (
                <Chip key={c.id} on={classFilter === c.id} onClick={() => (setCls(c.id), setPage(0))} color={c.affinityColor}>
                  {c.name}
                  {c.id === state.classId ? ' · vous' : ''}
                </Chip>
              ))}
            </div>
          )}
        </div>

        {!data ? (
          <p className="muted">Chargement…</p>
        ) : !list.length ? (
          <p className="muted small ws-empty">Rien avec ces filtres : retirez-en un.</p>
        ) : (
          <div className="ws-grid" style={{ '--rows': rows } as CSSProperties}>
            {visible.map((m) => {
              const locked = m.recipe.level > lv;
              const ready = !locked && m.recipe.inputs.every((i) => (state.inventory[i.item] ?? 0) >= i.qty);
              return (
                <button key={m.id} className={`ws-card${sel?.id === m.id ? ' selected' : ''}${locked ? ' locked' : ''}`} style={{ '--rc': `var(--r-${m.rarity})` } as CSSProperties} onClick={() => setPicked(m.id)}>
                  <GearIcon slot={m.slot} family={m.family} tier={m.tier} rarity={m.rarity} size={46} />
                  <span className="ws-card-text">
                    <strong>{m.name}</strong>
                    <span className="muted">
                      {content.gearSlots[m.slot]?.name ?? m.slot} · palier {m.tier}
                    </span>
                  </span>
                  {locked ? <span className="ws-badge locked">niv. {m.recipe.level}</span> : ready ? <span className="ws-badge ready">prêt</span> : null}
                </button>
              );
            })}
          </div>
        )}
        <footer className="recipes-foot">
          <span className="muted">
            Page {at + 1} sur {pages} · {list.length} pièce{list.length > 1 ? 's' : ''}
          </span>
          <div className="row-gap">
            <button className="btn btn-sm" disabled={at === 0} onClick={() => setPage(at - 1)} aria-label="Page précédente">
              ‹
            </button>
            <button className="btn btn-sm" disabled={at >= pages - 1} onClick={() => setPage(at + 1)} aria-label="Page suivante">
              ›
            </button>
          </div>
        </footer>
      </section>
      {sel ? <PieceDetail key={sel.id} m={sel} level={lv} onDone={load} /> : <section className="panel recipe-detail ws-detail-empty muted">Choisissez une pièce.</section>}
    </>
  );
}

function Chip({ on, onClick, color, icon, children }: { on: boolean; onClick: () => void; color?: string; icon?: boolean; children: ReactNode }) {
  return (
    <button className={`ws-chip${on ? ' on' : ''}${icon ? ' icon' : ''}`} style={color ? ({ '--cc': color } as CSSProperties) : undefined} aria-pressed={on} onClick={onClick}>
      {children}
    </button>
  );
}

/** La pièce choisie, en grand : ce qu'elle donne, ce qu'il faut, et « Fabriquer ». */
function PieceDetail({ m, level, onDone }: { m: Model; level: number; onDone: () => void }) {
  const { content, state, act } = useGame();
  const locked = m.recipe.level > level;
  const missing = m.recipe.inputs.filter((i) => (state.inventory[i.item] ?? 0) < i.qty);
  const boost = state.skills[m.recipe.profession]?.boost?.multiplier ?? 1;
  const [lo, hi] = m.rolls;
  return (
    <section className="panel recipe-detail ws-detail" style={{ '--rc': `var(--r-${m.rarity})` } as CSSProperties}>
      <header className="detail-head">
        <span className="eyebrow" style={{ color: `var(--r-${m.rarity})` }}>
          {RARITY[m.rarity]} · palier {m.tier}
        </span>
        <span className="muted">{content.gearSlots[m.slot]?.name ?? m.slot}</span>
      </header>

      <div className="ws-hero">
        <span className="ws-hero-icon">
          <GearIcon slot={m.slot} family={m.family} tier={m.tier} rarity={m.rarity} size={72} />
        </span>
        <div className="ws-hero-text">
          <h3>{m.name}</h3>
          <div className="ws-tags">
            <span className="ws-tag">{m.orientation === 'offensive' ? '⚔ Offensive' : '◈ Protectrice'}</span>
            {m.classes.map((c) => (
              <span key={c} className="ws-tag" style={{ color: content.classes[c]?.affinityColor }}>
                {content.classes[c]?.name ?? c}
              </span>
            ))}
          </div>
          <span className="muted small">
            {Math.round(m.recipe.durationSec / 60)} min · {decimal(m.recipe.xp * boost)} XP{boost > 1 && <span className="xp-boost small">×{boost}</span>}
          </span>
        </div>
      </div>

      <div className="ws-stats">
        {m.stats.map((st) => (
          <Tip key={st.stat} content={<TipHead title={STATS[st.stat]?.name ?? st.stat} sub={STATS[st.stat]?.hint} />}>
            <span className="ws-stat">
              <strong>+{num(st.value)}</strong> {STATS[st.stat]?.name ?? st.stat}
            </span>
          </Tip>
        ))}
      </div>
      <p className="muted ws-bonus">
        + {lo === hi ? lo : `${lo} à ${hi}`} ligne{hi > 1 ? 's' : ''} de bonus tirée{hi > 1 ? 's' : ''} au hasard · chef-d’œuvre : {pct(m.masterpiece)}
      </p>

      <div className="ingredients">
        <span className="eyebrow">Matières</span>
        {m.recipe.inputs.map((i) => {
          const have = state.inventory[i.item] ?? 0;
          const ok = have >= i.qty;
          return (
            <div key={i.item} className={`ingredient${ok ? '' : ' missing'}`}>
              <ItemIcon item={content.items[i.item]} small />
              <span>
                {i.qty} × {content.items[i.item]?.name}
              </span>
              <span className="ingredient-sources">{!ok && <SourceChips itemId={i.item} />}</span>
              <span style={{ color: ok ? 'var(--text-muted)' : 'var(--alert)' }}>
                {num(have)} / {num(i.qty)}
              </span>
            </div>
          );
        })}
      </div>

      <div className="launch">
        <button className="btn btn-primary launch-main" disabled={locked || missing.length > 0} onClick={() => void act(() => api.gearCraft(m.id)).then(onDone)}>
          {locked ? `${content.professions.find((p) => p.id === m.recipe.profession)?.name} niveau ${m.recipe.level} requis` : missing.length ? 'Il manque des matières' : 'Fabriquer'}
        </button>
        <Tip
          content={
            <>
              <TipHead title="Chef-d’œuvre" sub="Plus vous dépassez le niveau de la recette, plus il est probable." />
              <div className="tip-body">Toutes les lignes au maximum, une ligne en plus, et votre nom gravé dessus. La pièce se porte, ou se vend à la vitrine du marché.</div>
            </>
          }
        >
          <span className="ws-help" tabIndex={0}>
            ?
          </span>
        </Tip>
      </div>
    </section>
  );
}

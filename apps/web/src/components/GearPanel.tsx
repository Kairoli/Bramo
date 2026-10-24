import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import type { GearItemView, GearModel, GearView } from '@bramo/shared';
import { api } from '../api';
import { GearIcon } from './GearIcon';
import { GearCard, SLOT, STATS } from './GearCard';
import { Tip, TipFoot, TipHead, TipLine } from './Tip';
import { ItemIcon, Modal } from './ui';
import { useGame } from '../game/GameContext';
import { PoolText } from './PoolGauges';

export const STAT_NAMES: Record<string, string> = {
  vitality: 'Vitalité',
  defense: 'Défense',
  power: 'Puissance',
  haste: 'Cadence',
  crit: 'Critique',
  tenacity: 'Ténacité',
};
const RARITY_NAMES: Record<string, string> = { common: 'Commun', rare: 'Rare', epic: 'Épique', legendary: 'Légendaire' };
const rarityColor = (r: string) => `var(--r-${r})`;

/** Ordre d'affichage des emplacements ; les anneaux ont deux places. */
export const SLOT_ORDER = ['head', 'torso', 'hands', 'legs', 'feet', 'weapon', 'cape', 'belt', 'necklace', 'ring'];

/** Pictogramme d'un emplacement (24 × 24), à défaut d'illustration d'objet. */
const SLOT_ICON: Record<string, string> = {
  head: 'M5 14c0-5 3-9 7-9s7 4 7 9v2H5z M3 16h18',
  torso: 'M8 4l-4 3 2 4 2-1v10h8V10l2 1 2-4-4-3-2 2h-4z',
  hands: 'M7 21v-8l-2-3 1-2 3 3V5h2v6h1V4h2v7h1V5h2v9l-2 7z',
  legs: 'M7 3h10l-1 18h-3l-1-11-1 11H8z',
  feet: 'M6 4h5v9l7 3v3H5z',
  weapon: 'M14 4h6v6L9 21l-3-3L17 7M5 15l4 4',
  cape: 'M8 3h8l4 18H4z M10 3l2 4 2-4',
  belt: 'M2 10h20v4H2z M10 9h4v6h-4z',
  necklace: 'M5 4c0 6 3 9 7 9s7-3 7-9 M12 13v3 M10 18a2 2 0 1 0 4 0 2 2 0 0 0-4 0',
  ring: 'M12 8a6 6 0 1 0 0 12 6 6 0 0 0 0-12z M9 5l3-3 3 3',
};

export function SlotGlyph({ slot, size = 26 }: { slot: string; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={SLOT_ICON[slot] ?? SLOT_ICON.torso} />
    </svg>
  );
}

/** Une pièce en tuile : le pictogramme de son emplacement dans la couleur de sa rareté, son palier, ★ pour un chef-d'œuvre. */
/** Bulle d'une pièce : son nom à la couleur de sa rareté, ses caractéristiques et ses lignes, en un coup d'œil. */
function GearTipContent({ g }: { g: GearItemView }) {
  const { content } = useGame();
  return (
    <>
      <TipHead
        icon={<GearIcon slot={g.slot} family={g.family} tier={g.tier} rarity={g.rarity} size={40} />}
        title={`${g.masterpiece ? 'Chef-d’œuvre · ' : ''}${g.name}`}
        sub={`${RARITY_NAMES[g.rarity]} · palier ${g.tier} · ${SLOT[g.slot] ?? g.slot}`}
        color={rarityColor(g.rarity)}
      />
      <div className="tip-body">
        <div className="tip-section">Attributs de base · fixes</div>
        {g.stats.map((s) => (
          <TipLine key={s.stat} mark="▸">
            <strong>
              +{Math.round(s.value)} {STATS[s.stat]?.name ?? s.stat}
            </strong>{' '}
            <span className="muted">{g.effects.find((x) => x.stat === s.stat)?.text ?? STATS[s.stat]?.hint}</span>
          </TipLine>
        ))}
        {g.lines.length > 0 && <div className="tip-section rolled">Attributs · tirés au hasard</div>}
        {g.lines.map((l, i) => (
          <TipLine key={i} color="#9fd2ff" mark="+">
            {Math.round(l.value * 10) / 10} % <PoolText text={l.name} />
            {l.bonus ? <span className="muted"> · chef-d’œuvre</span> : l.max > l.min ? <span className="muted"> {l.value >= l.max - 1e-9 ? '· max' : `· max ${Math.round(l.max * 10) / 10} %`}</span> : null}
          </TipLine>
        ))}
        {g.named && g.conditional && (
          <>
            <div className="tip-section talent">Talent</div>
            <TipLine color="var(--r-legendary)" mark="★">
              <PoolText text={g.conditional} />
            </TipLine>
          </>
        )}
        {g.set && (
          <TipLine color="var(--clan)" mark="◆">
            Ensemble : {content.gearSets[g.set]?.name ?? g.set}
          </TipLine>
        )}
        {g.gem && (
          <TipLine color="var(--magic)" mark="◆">
            Gemme sertie : {content.items[g.gem]?.name ?? g.gem}
          </TipLine>
        )}
      </div>
      {g.wearShare >= 1 ? (
        <TipFoot tone="locked">Usée : à réparer pour qu’elle compte de nouveau.</TipFoot>
      ) : !g.wearable ? (
        <TipFoot tone="locked">Pas portable par votre classe actuelle.</TipFoot>
      ) : (
        <TipFoot>Touchez-la pour sa fiche complète et la comparer.</TipFoot>
      )}
    </>
  );
}

export function GearTile({ g, slot, selected, onClick, label }: { g?: GearItemView; slot: string; selected?: boolean; onClick?: () => void; label?: string }) {
  return (
    <Tip block className="gear-tip" content={g ? <GearTipContent g={g} /> : label && label.length > 1 ? <TipHead title={label} sub="Rien de porté ici." /> : null}>
    <button
      className={`gear-tile${g ? '' : ' empty'}${selected ? ' selected' : ''}${g?.worn ? ' worn' : ''}${g && !g.wearable ? ' other' : ''}`}
      style={g ? ({ '--rc': rarityColor(g.rarity) } as CSSProperties) : undefined}
      onClick={onClick}
    >
      {g ? <GearIcon slot={g.slot} family={g.family} tier={g.tier} rarity={g.rarity} size={40} /> : <SlotGlyph slot={slot} />}
      {g && <span className="gear-tile-tier">{g.tier}</span>}
      {g?.masterpiece && <span className="gear-tile-star">★</span>}
      {g?.set && <span className="gear-tile-set" />}
      {g?.gem && <span className="gear-tile-gem" title="Gemme sertie" />}
      {label && !g && <span className="gear-tile-label">{label}</span>}
    </button>
    </Tip>
  );
}

/**
 * Équipement réel du personnage, comme un inventaire de jeu : les emplacements portés en tuiles, le sac d'équipement
 * dessous, et le détail de la pièce choisie en bas. Le build ne dépend jamais de l'apparence.
 */
export function GearPanel({ gear, onChange }: { gear: GearView | null; onChange: (g: GearView) => void }) {
  const { content, state, flash, act } = useGame();
  const [pick, setPick] = useState<{ id?: number; slot?: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [chosen, setChosen] = useState<number[]>([]);
  const [rarityF, setRarityF] = useState('');
  const [mine, setMine] = useState(false);
  const [sort, setSort] = useState<'rarity' | 'tier' | 'slot' | 'new'>('rarity');
  const call = async (fn: () => Promise<GearView>) => {
    setBusy(true);
    try {
      onChange(await fn());
    } catch (e) {
      flash(e instanceof Error ? e.message : 'Erreur.');
    } finally {
      setBusy(false);
    }
  };
  const items = gear?.items ?? [];
  const slots = SLOT_ORDER.filter((s) => content.gearSlots[s]);
  const bag = items.filter((g) => !g.equipped);
  const RANK_OF: Record<string, number> = { common: 0, rare: 1, epic: 2, legendary: 3 };
  const shown = bag
    .filter((g) => (!pick?.slot || g.slot === pick.slot) && (!rarityF || g.rarity === rarityF) && (!mine || g.wearable))
    .sort((a, b) =>
      sort === 'new'
        ? b.id - a.id
        : sort === 'slot'
          ? SLOT_ORDER.indexOf(a.slot) - SLOT_ORDER.indexOf(b.slot) || RANK_OF[b.rarity]! - RANK_OF[a.rarity]! || b.tier - a.tier
          : sort === 'tier'
            ? b.tier - a.tier || RANK_OF[b.rarity]! - RANK_OF[a.rarity]!
            : RANK_OF[b.rarity]! - RANK_OF[a.rarity]! || b.tier - a.tier || Number(b.masterpiece) - Number(a.masterpiece),
    );
  const selected = pick?.id !== undefined ? items.find((g) => g.id === pick.id) : undefined;
  const sets = gear?.totals.sets ?? [];

  return (
    <div className="gear-panel">
      <div className="gear-worn">
        {slots.flatMap((slotId) => {
          const slot = content.gearSlots[slotId]!;
          const worn = items.filter((g) => g.equipped === slotId).sort((a, b) => a.id - b.id);
          return Array.from({ length: slot.capacity }, (_, i) => {
            const g = worn[i];
            return (
              <GearTile
                key={`${slotId}${i}`}
                g={g}
                slot={slotId}
                label={slot.name}
                selected={g ? pick?.id === g.id : pick?.slot === slotId && pick.id === undefined}
                onClick={() => setPick(g ? { id: g.id, slot: slotId } : { slot: slotId })}
              />
            );
          });
        })}
      </div>
      {sets.length > 0 && (
        <div className="gear-sets">
          {sets.map((s) => (
            <span key={s.id} className={`chip${s.active.length ? ' chip-own' : ''}`} title={s.active.map((a) => `${a.pieces} p. ${a.text}`).join('\n') || `Bonus à partir de 2 pièces (${content.gearSets[s.id]?.theme ?? ''})`}>
              {s.name} · {s.pieces}
            </span>
          ))}
        </div>
      )}
      <header className="bag-head">
        <span className="eyebrow">
          Sac d’équipement · {shown.length}
          {shown.length !== bag.length ? ` sur ${bag.length}` : ''}
        </span>
        {bag.some((g) => g.salvage) && (
          <button className={`btn btn-sm${selecting ? ' btn-primary' : ''}`} onClick={() => (setSelecting(!selecting), setChosen([]))}>
            {selecting ? 'Terminer' : 'Sélectionner'}
          </button>
        )}
      </header>
      {/* Trier et filtrer le sac [Louis, 24 octobre : « tout est juste déposé dans le sac, c'est chiant pour s'y retrouver »]. */}
      <div className="bag-tools">
        <div className="bag-row">
          <button className={`ws-chip${!pick?.slot ? ' on' : ''}`} onClick={() => setPick(null)}>
            Tout
          </button>
          {slots
            .filter((s) => bag.some((g) => g.slot === s))
            .map((s) => (
              <Tip key={s} content={<TipHead title={content.gearSlots[s]?.name ?? s} sub={`${bag.filter((g) => g.slot === s).length} au sac`} />}>
                <button className={`ws-chip icon${pick?.slot === s ? ' on' : ''}`} onClick={() => setPick(pick?.slot === s ? null : { slot: s })}>
                  <SlotGlyph slot={s} size={16} />
                </button>
              </Tip>
            ))}
        </div>
        <div className="bag-row">
          {(['common', 'rare', 'epic', 'legendary'] as const)
            .filter((r) => bag.some((g) => g.rarity === r))
            .map((r) => (
              <button key={r} className={`ws-chip${rarityF === r ? ' on' : ''}`} style={{ '--cc': rarityColor(r) } as CSSProperties} onClick={() => setRarityF(rarityF === r ? '' : r)}>
                {RARITY_NAMES[r]}
              </button>
            ))}
          <button className={`ws-chip${mine ? ' on' : ''}`} onClick={() => setMine(!mine)} title="Seulement les pièces que votre classe peut porter">
            Ma classe
          </button>
          <select className="input bag-sort" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} aria-label="Trier">
            <option value="rarity">Rareté</option>
            <option value="tier">Palier</option>
            <option value="slot">Emplacement</option>
            <option value="new">Plus récentes</option>
          </select>
        </div>
      </div>
      <div className="gear-grid scroll">
        {shown.length === 0 && <p className="muted small gear-grid-empty">{bag.length ? 'Rien avec ces filtres.' : 'Rien ici pour l’instant : les rencontres en font tomber.'}</p>}
        {shown.map((g) =>
          selecting ? (
            <span key={g.id} className={`bag-pick${chosen.includes(g.id) ? ' checked' : ''}${g.salvage ? '' : ' off'}`}>
              <GearTile g={g} slot={g.slot} selected={chosen.includes(g.id)} onClick={() => g.salvage && setChosen(chosen.includes(g.id) ? chosen.filter((x) => x !== g.id) : [...chosen, g.id])} />
            </span>
          ) : (
            <GearTile key={g.id} g={g} slot={g.slot} selected={pick?.id === g.id} onClick={() => setPick({ id: g.id, slot: pick?.slot })} />
          ),
        )}
      </div>
      {selecting ? (
        <SalvageBar
          bag={shown}
          chosen={bag.filter((g) => chosen.includes(g.id))}
          onChoose={setChosen}
          onDone={() =>
            void act(async () => {
              const r = await api.gearSalvage(chosen);
              onChange(r.gear);
              setChosen([]);
              setSelecting(false);
              return r.state;
            })
          }
        />
      ) : (
        <p className="muted small gear-hint">Survolez une pièce pour la voir ; touchez-la pour la comparer et l’équiper.</p>
      )}
      {selected && (
        <GearCard
          g={selected}
          // Comparée à la pièce portée au même emplacement (la première, pour les anneaux).
          compare={selected.equipped ? null : (items.find((x) => x.equipped && x.slot === selected.slot) ?? null)}
          onClose={() => setPick(pick?.slot ? { slot: pick.slot } : null)}
          onSocket={(itemId) =>
            void act(async () => {
              const r = await api.gearSocket(selected.id, itemId);
              onChange(r.gear);
              return r.state;
            })
          }
          actions={
            selected.price != null ? (
              <button className="btn" disabled={busy} onClick={() => void call(() => api.gearUnlist(selected.id))}>
                Retirer de la vitrine ({selected.price} or)
              </button>
            ) : selected.equipped ? (
              <button className="btn" disabled={busy} onClick={() => void call(() => api.gearUnequip(selected.id)).then(() => setPick(null))}>
                Ranger au sac
              </button>
            ) : (
              <button className="btn btn-primary" disabled={busy || !selected.wearable} title={selected.wearable ? '' : 'Pas du style de votre classe'} onClick={() => void call(() => api.gearEquip(selected.id)).then(() => setPick(null))}>
                {selected.wearable ? 'Équiper' : 'Pour une autre classe'}
              </button>
            )
          }
          onRefine={(service) =>
            void act(async () => {
              const r = await api.gearRefine(selected.id, service);
              onChange(r.gear);
              return r.state;
            })
          }
          onSell={selected.bound || selected.price != null ? undefined : (price) => void call(() => api.gearSell(selected.id, price)).then(() => setPick(null))}
          onSalvage={() =>
            void act(async () => {
              const r = await api.gearSalvage([selected.id]);
              onChange(r.gear);
              setPick(null);
              return r.state;
            })
          }
        />
      )}
      {state.classId && import.meta.env.DEV && <DevGrant onChange={onChange} />}
    </div>
  );
}

/**
 * Démonter plusieurs pièces d'un coup chez l'Affineur [Louis, 24 octobre : « pas de démontage en multi-sélection »] : on
 * coche les pièces dans le sac (ou « Toutes les Communes »…), on voit la poussière, une confirmation pour tout le lot.
 * Les raccourcis par rareté laissent de côté les chefs-d'œuvre, ensembles, nommées et pièces travaillées.
 */
const PLURAL: Record<string, string> = { common: 'Toutes les Communes', rare: 'Toutes les Rares', epic: 'Toutes les Épiques' };

function SalvageBar({ bag, chosen, onChoose, onDone }: { bag: GearItemView[]; chosen: GearItemView[]; onChoose: (ids: number[]) => void; onDone: () => void }) {
  const { content } = useGame();
  const [sure, setSure] = useState(false);
  const kept = (g: GearItemView) => g.masterpiece || !!g.set || g.rank > 0 || g.rerollLine != null || g.named;
  const dust = chosen.reduce((s, g) => s + (g.salvage?.qty ?? 0), 0);
  const dustItem = content.gearCrafting?.refine?.salvage?.item;
  const ids = new Set(chosen.map((g) => g.id));
  const add = (r: string) => onChoose([...ids, ...bag.filter((g) => g.salvage && !kept(g) && g.rarity === r).map((g) => g.id)]);
  return (
    <div className="salvage-bar">
      <div className="bag-row">
        <span className="muted small">Ajouter :</span>
        {(['common', 'rare', 'epic'] as const)
          .filter((r) => bag.some((g) => g.salvage && !kept(g) && g.rarity === r))
          .map((r) => (
            <button key={r} className="ws-chip" style={{ '--cc': rarityColor(r) } as CSSProperties} onClick={() => (setSure(false), add(r))}>
              {PLURAL[r]}
            </button>
          ))}
        {chosen.length > 0 && (
          <button className="link small" onClick={() => (setSure(false), onChoose([]))}>
            Vider
          </button>
        )}
      </div>
      <div className="salvage-bar-foot">
        <span>
          <strong>{chosen.length}</strong> pièce{chosen.length > 1 ? 's' : ''} → {dustItem && <ItemIcon item={content.items[dustItem]} small />} <strong>{dust.toLocaleString('fr-FR')}</strong> poussière
        </span>
        {sure ? (
          <span className="salvage-confirm">
            <button className="btn btn-sm btn-danger" onClick={onDone}>
              Oui, démonter
            </button>
            <button className="btn btn-sm btn-ghost" onClick={() => setSure(false)}>
              Non
            </button>
          </span>
        ) : (
          <button className="btn btn-sm btn-primary" disabled={!chosen.length} onClick={() => setSure(true)}>
            Démonter
          </button>
        )}
      </div>
    </div>
  );
}

/** Outil de test, visible seulement en développement : prendre n'importe quel objet du catalogue. */
function DevGrant({ onChange }: { onChange: (g: GearView) => void }) {
  const { flash } = useGame();
  const [models, setModels] = useState<GearModel[] | null>(null);
  const [q, setQ] = useState('');
  const [mp, setMp] = useState(false);
  useEffect(() => {
    api.gearCatalogue().then((r) => setModels(r.models)).catch(() => setModels([]));
  }, []);
  const found = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!models || needle.length < 2) return [];
    return models.filter((m) => m.name.toLowerCase().includes(needle)).slice(0, 8);
  }, [models, q]);
  return (
    <details className="gear-dev">
      <summary className="eyebrow">Test : obtenir un objet ({models?.length ?? '…'} modèles)</summary>
      <div className="gear-dev-body">
        <input type="search" placeholder="Nom (2 lettres minimum)…" value={q} onChange={(e) => setQ(e.target.value)} />
        <label className="small">
          <input type="checkbox" checked={mp} onChange={(e) => setMp(e.target.checked)} /> Chef-d’œuvre
        </label>
        {found.map((m) => (
          <button
            key={m.id}
            className="btn btn-sm"
            onClick={() =>
              api
                .devGrantGear(m.id, mp)
                .then(onChange)
                .catch((e) => flash(e instanceof Error ? e.message : 'Erreur.'))
            }
          >
            {m.name} · {RARITY_NAMES[m.rarity]} · palier {m.tier}
          </button>
        ))}
      </div>
    </details>
  );
}

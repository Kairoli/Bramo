import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import type { GearItemView, GearModel, GearView } from '@bramo/shared';
import { api } from '../api';
import { GearIcon } from './GearIcon';
import { GearCard, SLOT, STATS } from './GearCard';
import { Tip, TipFoot, TipHead, TipLine } from './Tip';
import { ItemIcon, Modal } from './ui';
import { useGame } from '../game/GameContext';

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
        {g.stats.map((s) => (
          <TipLine key={s.stat} mark="▸">
            <strong>
              +{Math.round(s.value)} {STATS[s.stat]?.name ?? s.stat}
            </strong>{' '}
            <span className="muted">{STATS[s.stat]?.hint}</span>
          </TipLine>
        ))}
        {g.lines.map((l, i) => (
          <TipLine key={i} color="var(--good)" mark="+">
            {Math.round(l.value * 10) / 10} % {l.name}
          </TipLine>
        ))}
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
  const [bulk, setBulk] = useState(false);
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
  const filtered = pick?.slot ? bag.filter((g) => g.slot === pick.slot) : bag;
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
          Sac d’équipement · {filtered.length}
          {pick?.slot ? ` · ${content.gearSlots[pick.slot]?.name}` : ''}
        </span>
        {pick?.slot && (
          <button className="link small" onClick={() => setPick(null)}>
            Tout voir
          </button>
        )}
        {bag.some((g) => g.salvage) && (
          <button className="link small" onClick={() => setBulk(true)}>
            Démonter…
          </button>
        )}
      </header>
      <div className="gear-grid scroll">
        {filtered.length === 0 && <p className="muted small gear-grid-empty">Rien ici pour l’instant : les rencontres en font tomber.</p>}
        {filtered.map((g) => (
          <GearTile key={g.id} g={g} slot={g.slot} selected={pick?.id === g.id} onClick={() => setPick({ id: g.id, slot: pick?.slot })} />
        ))}
      </div>
      <p className="muted small gear-hint">Touchez une pièce pour voir sa fiche et la comparer à celle que vous portez.</p>
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
      {bulk && (
        <BulkSalvage
          bag={bag}
          onClose={() => setBulk(false)}
          onDone={(ids) =>
            void act(async () => {
              const r = await api.gearSalvage(ids);
              onChange(r.gear);
              setBulk(false);
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
 * Démonter en lot chez l'Affineur (docs/design/eclats.md §3) : les pièces du sac des raretés cochées. Les chefs-d'œuvre,
 * les pièces d'ensemble, les nommées et celles déjà travaillées restent : elles se démontent une à une depuis leur fiche.
 */
function BulkSalvage({ bag, onClose, onDone }: { bag: GearItemView[]; onClose: () => void; onDone: (ids: number[]) => void }) {
  const { content } = useGame();
  const [rarities, setRarities] = useState<string[]>(['common', 'rare']);
  const [sure, setSure] = useState(false);
  const kept = (g: GearItemView) => g.masterpiece || !!g.set || g.rank > 0 || g.rerollLine != null || g.named;
  const chosen = bag.filter((g) => g.salvage && !kept(g) && rarities.includes(g.rarity));
  const dust = chosen.reduce((s, g) => s + (g.salvage?.qty ?? 0), 0);
  const dustItem = content.gearCrafting?.refine?.salvage?.item;
  const toggle = (r: string) => {
    setSure(false);
    setRarities((x) => (x.includes(r) ? x.filter((y) => y !== r) : [...x, r]));
  };
  return (
    <Modal onClose={onClose} className="salvage-modal">
      <h2>Démonter chez l’Affineur</h2>
      <p className="muted small">Les pièces disparaissent et donnent de la poussière, qui sert à retailler une ligne. Les chefs-d’œuvre, pièces d’ensemble, nommées et pièces déjà travaillées sont gardés : démontez-les une à une depuis leur fiche.</p>
      <div className="salvage-rarities">
        {(['common', 'rare', 'epic', 'legendary'] as const).map((r) => {
          const n = bag.filter((g) => g.salvage && !kept(g) && g.rarity === r).length;
          return (
            <button key={r} className={`chip${rarities.includes(r) ? ' on' : ''}`} style={{ '--rc': rarityColor(r) } as CSSProperties} disabled={!n} onClick={() => toggle(r)}>
              {RARITY_NAMES[r]} · {n}
            </button>
          );
        })}
      </div>
      <div className="salvage-preview gear-grid">
        {chosen.map((g) => (
          <GearTile key={g.id} g={g} slot={g.slot} />
        ))}
        {!chosen.length && <p className="muted small">Aucune pièce de ces raretés à démonter.</p>}
      </div>
      <footer className="salvage-foot">
        <span>
          {chosen.length} pièce{chosen.length > 1 ? 's' : ''} → {dustItem && <ItemIcon item={content.items[dustItem]} small />} <strong>{dust.toLocaleString('fr-FR')}</strong> × {dustItem ? content.items[dustItem]?.name : 'poussière'}
        </span>
        {sure ? (
          <span className="salvage-confirm">
            <button className="btn btn-danger" onClick={() => onDone(chosen.map((g) => g.id))}>
              Oui, démonter {chosen.length} pièce{chosen.length > 1 ? 's' : ''}
            </button>
            <button className="btn btn-ghost" onClick={() => setSure(false)}>
              Annuler
            </button>
          </span>
        ) : (
          <button className="btn btn-primary" disabled={!chosen.length} onClick={() => setSure(true)}>
            Démonter
          </button>
        )}
      </footer>
    </Modal>
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

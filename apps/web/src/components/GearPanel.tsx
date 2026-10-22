import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import type { GearItemView, GearModel, GearView } from '@bramo/shared';
import { api } from '../api';
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
const SLOT_ORDER = ['head', 'torso', 'hands', 'legs', 'feet', 'cape', 'belt', 'necklace', 'ring', 'weapon'];

function lineText(l: GearItemView['lines'][number]) {
  return `${l.name} +${l.value} %${l.bonus ? ' (chef-d’œuvre)' : ''}`;
}

function ItemTooltip(g: GearItemView): string {
  return [
    `${g.name} · ${RARITY_NAMES[g.rarity]} · palier ${g.tier}${g.masterpiece ? ' · Chef-d’œuvre' : ''}`,
    ...g.stats.map((s) => `${STAT_NAMES[s.stat] ?? s.stat} ${s.value}`),
    ...g.lines.map((l) => `${lineText(l)} (${l.min}-${l.max})`),
    g.conditional ?? '',
    g.signedBy ? `Signé : ${g.signedBy}` : '',
    g.worn ? 'Usé : ne compte plus' : `Usure ${Math.round(g.wearShare * 100)} %`,
  ]
    .filter(Boolean)
    .join('\n');
}

function ItemCard({ g, children }: { g: GearItemView; children?: React.ReactNode }) {
  return (
    <div className={`gear-card${g.worn ? ' worn' : ''}`} style={{ '--rc': rarityColor(g.rarity) } as CSSProperties} title={ItemTooltip(g)}>
      <div className="gear-card-head">
        <strong>{g.masterpiece ? `Chef-d’œuvre ${g.name}` : g.name}</strong>
        <span className="muted">
          {RARITY_NAMES[g.rarity]} · palier {g.tier}
          {g.bound ? ' · lié' : ''}
        </span>
      </div>
      <div className="gear-lines">
        {g.stats.map((s) => (
          <span key={s.stat}>
            {STAT_NAMES[s.stat] ?? s.stat} <b>{s.value}</b>
          </span>
        ))}
        {g.lines.map((l) => (
          <span key={l.name} className={l.bonus ? 'bonus' : 'rolled'}>
            {lineText(l)}
          </span>
        ))}
        {g.conditional && <span className="cond">{g.conditional}</span>}
      </div>
      {children}
    </div>
  );
}

/** Équipement réel du personnage : emplacements portés, sac d'équipement, totaux. Le build ne dépend jamais de l'apparence. */
export function GearPanel({ gear, onChange }: { gear: GearView | null; onChange: (g: GearView) => void }) {
  const { content, state, flash } = useGame();
  const [open, setOpen] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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

  const slots = SLOT_ORDER.filter((s) => content.gearSlots[s]);
  const bag = (gear?.items ?? []).filter((g) => !g.equipped);

  return (
    <div className="gear-panel">
      <div className="gear-slots">
        {slots.flatMap((slotId) => {
          const slot = content.gearSlots[slotId]!;
          const worn = (gear?.items ?? []).filter((g) => g.equipped === slotId).sort((a, b) => a.id - b.id);
          return Array.from({ length: slot.capacity }, (_, i) => {
            const g = worn[i];
            return (
              <div key={`${slotId}${i}`} className={`gear-slot${g ? '' : ' empty'}`} style={g ? ({ '--rc': rarityColor(g.rarity) } as CSSProperties) : undefined}>
                <span className="eyebrow">{slot.name}</span>
                {g ? (
                  <ItemCard g={g}>
                    <button className="btn btn-sm" disabled={busy} onClick={() => call(() => api.gearUnequip(g.id))}>
                      Ranger
                    </button>
                  </ItemCard>
                ) : (
                  <span className="muted small">
                    Vide
                    {bag.some((b) => b.slot === slotId && b.wearable) && (
                      <button className="link" onClick={() => setOpen(open === slotId ? null : slotId)}>
                        {open === slotId ? 'Masquer' : 'Choisir'}
                      </button>
                    )}
                  </span>
                )}
              </div>
            );
          });
        })}
      </div>

      <header className="bag-head">
        <span className="eyebrow">Sac d’équipement ({bag.length})</span>
      </header>
      <div className="gear-bag scroll">
        {bag.length === 0 && <p className="muted small">Aucun équipement dans le sac pour l’instant.</p>}
        {bag
          .filter((g) => !open || g.slot === open)
          .map((g) => (
            <ItemCard key={g.id} g={g}>
              <button className="btn btn-sm btn-primary" disabled={busy || !g.wearable} title={g.wearable ? '' : 'Pas du style de votre classe'} onClick={() => call(() => api.gearEquip(g.id))}>
                {g.wearable ? 'Équiper' : 'Autre classe'}
              </button>
            </ItemCard>
          ))}
      </div>
      {state.classId && import.meta.env.DEV && <DevGrant onChange={onChange} />}
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

/** Totaux de l'équipement porté : lignes fixes, lignes aléatoires, bonus d'ensemble. */
export function GearTotalsBlock({ gear }: { gear: GearView | null }) {
  const { content } = useGame();
  const t = gear?.totals;
  const lines = Object.entries(t?.lines ?? {});
  return (
    <div className="stat-block">
      <div className="stat-block-head">
        <span className="eyebrow">Équipement porté</span>
        <span className="muted" title="Converties selon le palier de chaque pièce : les statistiques de combat sont dans la salle Combat.">points des pièces</span>
      </div>
      <dl className="kv">
        {Object.entries(STAT_NAMES).map(([k, label]) => (
          <div key={k} style={{ display: 'contents' }}>
            <dt>{label}</dt>
            <dd>{t?.stats[k] ?? '—'}</dd>
          </div>
        ))}
      </dl>
      {lines.length > 0 && (
        <dl className="kv">
          {lines.map(([name, v]) => (
            <div key={name} style={{ display: 'contents' }}>
              <dt>{name}</dt>
              <dd>+{v} %</dd>
            </div>
          ))}
        </dl>
      )}
      {(t?.sets ?? []).map((s) => (
        <div key={s.id} className="set-progress">
          <strong>
            {s.name} · {s.pieces} pièce{s.pieces > 1 ? 's' : ''}
          </strong>
          {s.active.length === 0 && <span className="muted small">Bonus à partir de 2 pièces ({content.gearSets[s.id]?.theme}).</span>}
          {s.active.map((a) => (
            <span key={a.pieces} className="small">
              <b>{a.pieces} p.</b> {a.text}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

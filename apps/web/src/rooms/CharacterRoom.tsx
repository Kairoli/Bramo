import { useEffect, useState } from 'react';
import type { GearView, Item, Slot } from '@bramo/shared';
import { api } from '../api';
import { ClassModal, OutfitModal, STYLE_NAMES } from '../components/ClassChoice';
import { EnergyButton } from '../components/EnergyButton';
import { useGame } from '../game/GameContext';
import { duration, num, pct, signedPct } from '../format';
import { Bar, FAMILY_COLOR, ItemIcon } from '../components/ui';
import { AppearancePicker, LOOK_GROUPS, lookGroupOf } from '../components/AppearancePicker';
import { GearPanel } from '../components/GearPanel';
import { PaperDoll, PartThumb, useEquipment } from '../components/equipment';
import { OrnamentPlate, ornamentTitle } from '../components/Ornament';
import { OrnamentModal } from '../components/OrnamentPicker';
import { PresetsCard } from '../components/Presets';
import { Tip, TipHead } from '../components/Tip';
import { BuildPanel, StatsPanel } from '../components/CharacterSheet';

/**
 * Salle Personnage, comme un écran de jeu : à gauche l'inventaire (équipement en tuiles, sac, apparence), au centre le
 * personnage, à droite les préréglages de build et l'essentiel en cartes.
 */
export function CharacterRoom() {
  const { name, content, state, look } = useGame();
  const [classOpen, setClassOpen] = useState(false);
  const [outfitOpen, setOutfitOpen] = useState(false);
  const [ornamentOpen, setOrnamentOpen] = useState(false);
  const ornament = state.ornament ? content.ornaments[state.ornament] : undefined;
  /** « Équipement » : ce qui compte pour le build ; « Apparence » : l'aspect de chaque pièce, sans effet sur le build. */
  const [mode, setMode] = useState<'gear' | 'look'>('gear');
  // Mode Apparence : l'emplacement dont on choisit l'apparence (touché autour du personnage).
  const [lookSlot, setLookSlot] = useState<Slot>('headwear');
  const [tab, setTab] = useState<'build' | 'gear' | 'bag' | 'stats'>('build');
  const [gear, setGear] = useState<GearView | null>(null);
  useEffect(() => {
    api.gear().then(setGear).catch(() => {});
  }, [state.classId, state.combat?.activePreset]);
  const outfit = content.cosmetics.outfits.find((o) => o.id === look?.outfit);
  const cls = look && content.classes[look.classId];
  const skills = content.professions.map((p) => ({ p, s: state.skills[p.id]! }));
  const best = skills.filter((x) => x.p.status === 'playable').sort((a, b) => b.s.xp - a.s.xp)[0]!;
  const totalLevel = skills.reduce((sum, x) => sum + x.s.level, 0);
  const bagCount = Object.keys(state.inventory).length;

  return (
    <main className="character-room">
      <section className="panel char-equipment">
        {mode === 'look' ? (
          <>
            <span className="eyebrow">Apparence</span>
            <AppearancePicker slot={lookSlot} onSlot={setLookSlot} />
          </>
        ) : (
          <>
            <div className="seg-toggle inv-tabs" role="tablist">
              <button aria-pressed={tab === 'build'} onClick={() => setTab('build')}>
                Build
              </button>
              <button aria-pressed={tab === 'gear'} onClick={() => setTab('gear')}>
                Équipement
              </button>
              <button aria-pressed={tab === 'bag'} onClick={() => setTab('bag')}>
                Sac · {bagCount}
              </button>
              <button aria-pressed={tab === 'stats'} onClick={() => setTab('stats')}>
                Stats
              </button>
            </div>
            {tab === 'build' ? <BuildPanel gear={gear} /> : tab === 'gear' ? <GearPanel gear={gear} onChange={setGear} /> : tab === 'stats' ? <StatsPanel /> : <BagPanel />}
          </>
        )}
      </section>

      <section className="panel band char-stage">
        {/* Ce que montrent les cases : l'équipement (le build) ou l'apparence (sans effet). */}
        <div className="mode-switch" role="group" aria-label="Affichage du personnage">
          <button aria-pressed={mode === 'gear'} onClick={() => setMode('gear')} title="Équipement : ce qui compte pour le combat">
            <svg viewBox="0 0 24 24" aria-hidden>
              <path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z" />
            </svg>
          </button>
          <button aria-pressed={mode === 'look'} onClick={() => setMode('look')} title="Apparence : l'aspect de chaque pièce, sans effet">
            <svg viewBox="0 0 24 24" aria-hidden>
              <path d="M12 3a9 9 0 1 0 0 18c1.5 0 2-1 2-2 0-1.5-1-2 0-3s3 0 4-1 3-3 3-5a9 9 0 0 0-9-7zM7.5 12a1.5 1.5 0 1 0 0-.01M10 7.5a1.5 1.5 0 1 0 0-.01M15 7.5a1.5 1.5 0 1 0 0-.01" />
            </svg>
          </button>
          <span className="mode-switch-label">{mode === 'gear' ? 'Équipement' : 'Apparence'}</span>
        </div>
        <header className="char-stage-head">
          {cls && (
            <div className="eyebrow" style={{ color: cls.affinityColor }}>
              {cls.name} · {STYLE_NAMES[cls.style]}
              {state.combat ? ` · niveau ${state.combat.level}` : ''}
            </div>
          )}
          {ornament ? <OrnamentPlate ornament={ornament} name={name} title={ornamentTitle(ornament, content, state)} width={352} className="char-plate" /> : <h1>{name}</h1>}
          {!ornament && (
            <div style={{ color: 'var(--clan)' }}>
              {best.s.nickname} · {best.p.name} {best.s.level}
            </div>
          )}
        </header>
        <PaperDoll
          size="page"
          mode={mode}
          gear={gear}
          pick={
            mode === 'look'
              ? { selected: lookGroupOf(lookSlot), pickable: (id) => !!LOOK_GROUPS[id], onPick: (id) => setLookSlot(LOOK_GROUPS[id]!.slots[0]!.slot) }
              : undefined
          }
        />
        <footer className="char-stage-foot">
          <button className="btn btn-sm" onClick={() => setClassOpen(true)}>
            Changer de classe
          </button>
          <button className="btn btn-sm" onClick={() => setOutfitOpen(true)}>
            Changer de tenue
          </button>
          <button className="btn btn-sm" onClick={() => setOrnamentOpen(true)}>
            Ornements et titres
          </button>
          {outfit && <span className="chip">Tenue {outfit.name}</span>}
        </footer>
        {classOpen && <ClassModal onClose={() => setClassOpen(false)} />}
        {outfitOpen && <OutfitModal onClose={() => setOutfitOpen(false)} />}
        {ornamentOpen && <OrnamentModal onClose={() => setOrnamentOpen(false)} />}
      </section>

      <section className="panel char-stats scroll">
        <PresetsCard gear={gear} />
        <div className="card">
          <div className="quick-tiles">
            <Tip block content={<TipHead title="Niveau des métiers" sub={`La somme des niveaux de vos ${content.professions.length} métiers : ${content.professions.length} au départ, ${num(content.professions.length * content.settings.xp.maxLevel)} au maximum. Il monte à chaque niveau gagné dans n’importe quel métier.`} />}>
              <QuickTile label="Métiers (total)" value={String(totalLevel)} />
            </Tip>
            <QuickTile label="Or" value={num(state.gold)} tone="var(--action)" />
            <QuickTile label="Combat" value={state.combat ? `Niv. ${state.combat.level}` : '—'} tone="var(--alert)" sub={state.combat ? `palier ${state.combat.classTier}` : undefined} />
          </div>
        </div>
        <YieldCard />
        <div className="card">
          <div className="card-head">
            <span className="eyebrow">Coups de fouet</span>
            <span className="muted small">
              {state.energy.chargesLeft} / {state.energy.charges} aujourd’hui
            </span>
          </div>
          <EnergyButton />
          <span className="muted small">
            ×{content.settings.energy.multiplier} pendant {duration(state.energy.durationMs)}, quand vous voulez.
          </span>
        </div>
        <div className="card">
          <div className="card-head">
            <span className="eyebrow">Métiers</span>
            <span className="muted small">niveau total {totalLevel}</span>
          </div>
          <div className="skill-tiles">
            {skills.map(({ p, s }) => {
              const span = s.nextLevelXp ? (s.xp - s.levelXp) / (s.nextLevelXp - s.levelXp) : 1;
              const soon = p.status === 'soon';
              return (
                <div key={p.id} className={`skill-tile${soon ? ' soon' : ''}`} style={{ ['--fc' as string]: FAMILY_COLOR[p.family] }} title={soon ? `${p.name} · bientôt` : `${p.name} ${s.level} · ${s.nickname}`}>
                  <strong>{soon ? '—' : s.level}</strong>
                  <span>{p.name}</span>
                  <Bar value={soon ? 0 : span} color={FAMILY_COLOR[p.family]} />
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}

function QuickTile({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: string }) {
  return (
    <div className="quick-tile">
      <span className="muted small">{label}</span>
      <strong style={{ color: tone }}>{value}</strong>
      {sub && <span className="muted small">{sub}</span>}
    </div>
  );
}

/** Rendement : présence, hors ligne, total, puis les bonus plafonnés en barres. */
function YieldCard() {
  const { content, state } = useGame();
  const { settings } = content;
  const rate = state.activity?.rate;
  const bonuses = [
    { label: 'Outil', value: rate?.tool ?? 0, cap: settings.bonusCaps.tool, soon: false },
    { label: 'Repas', value: rate?.meal ?? 0, cap: settings.bonusCaps.meal, soon: false },
    // Le clan existe : ses bâtiments (ou, sans clan, la Guilde du bourg) comptent déjà ; « bientôt » laissait croire le contraire.
    { label: 'Clan', value: rate?.clan ?? 0, cap: settings.bonusCaps.clan, soon: false },
    { label: 'Saison', value: 0, cap: settings.bonusCaps.season, soon: true },
  ];
  return (
    <div className="card">
      <div className="card-head">
        <span className="eyebrow">Rendement</span>
        <span className="muted small">{rate ? 'activité en cours' : 'aucune activité'}</span>
      </div>
      <div className="quick-tiles">
        <QuickTile label="Présence" value={rate ? pct(rate.presence) : '—'} tone={rate?.energized ? 'var(--good)' : undefined} />
        <QuickTile label="Hors ligne" value={pct(settings.rates.offline)} sub={`${settings.rates.offlineCapHours} h`} />
        <QuickTile label="Total" value={rate ? pct(rate.total) : '—'} tone="var(--action)" />
      </div>
      {bonuses.map((b) => (
        <div key={b.label} className={`bonus-row${b.soon ? ' soon' : ''}`}>
          <span>{b.label}</span>
          <span className="muted">{b.soon ? 'bientôt' : `${signedPct(b.value)} / ${signedPct(b.cap)}`}</span>
          <Bar value={b.cap ? b.value / b.cap : 0} color="var(--good)" />
        </div>
      ))}
    </div>
  );
}

/** Le sac : outil et repas en cours, les objets en tuiles ; les actions de l'objet choisi en bas. */
function BagPanel() {
  const { content, state, act, openMarket } = useGame();
  const equipment = useEquipment();
  const [picked, setPicked] = useState<string | null>(null);
  const { durability } = state;
  const items = Object.entries(state.inventory)
    .map(([id, qty]) => ({ item: content.items[id]!, qty }))
    .filter((x) => x.item)
    .sort((a, b) => a.item.category.localeCompare(b.item.category) || a.item.name.localeCompare(b.item.name));
  const pantry = Object.entries(state.pantry)
    .map(([id, qty]) => ({ item: content.items[id]!, qty }))
    .filter((x) => x.item);
  const sel = items.find((x) => x.item.id === picked);
  const left = (item: Item) => {
    const d = durability[item.id];
    if (!d) return null;
    const r = d.copies.find((x) => x > 0);
    return r === undefined ? 0 : r / ((item.tool?.durabilityHours ?? 1) * 3_600_000);
  };
  return (
    <div className="bag-panel">
      <div className="bag-current">
        {(['tool', 'meal'] as const).map((id) => {
          const e = equipment[id];
          return (
            <div key={id} className={`bag-current-item${e.name ? '' : ' empty'}`}>
              <span className={`equip-slot equip-${e.kind}${e.name ? '' : ' empty'}`}>{e.thumb ? <PartThumb slot={e.thumb.slot} partId={e.thumb.partId} /> : e.item ? <ItemIcon item={e.item} small /> : null}</span>
              <span className="equip-text">
                <span className="eyebrow">{e.label}</span>
                <strong>{e.name ?? 'Aucun'}</strong>
              </span>
            </div>
          );
        })}
      </div>
      <div className="item-grid scroll">
        {items.length === 0 && <p className="muted small">Votre sac est vide.</p>}
        {items.map(({ item, qty }) => {
          const l = left(item);
          return (
            <button key={item.id} className={`item-tile${picked === item.id ? ' selected' : ''}`} onClick={() => setPicked(picked === item.id ? null : item.id)}>
              <ItemIcon item={item} />
              <span className="item-qty">{num(qty)}</span>
              {l !== null && (
                <span className="item-wear">
                  <span style={{ width: `${Math.max(0, Math.min(1, l)) * 100}%` }} />
                </span>
              )}
            </button>
          );
        })}
      </div>
      {sel ? (
        <div className="item-detail">
          <div className="item-detail-head">
            <ItemIcon item={sel.item} />
            <span>
              <strong>{sel.item.name}</strong>
              <span className="muted small">
                {' '}
                ×{num(sel.qty)}
                {durability[sel.item.id] && (() => {
                  const r = durability[sel.item.id]!.copies.find((x) => x > 0);
                  return r === undefined ? ' · usé' : ` · reste ${duration(r)}`;
                })()}
              </span>
            </span>
          </div>
          <div className="item-actions">
            {sel.item.meal && (
              <>
                <button className="btn btn-sm btn-primary" onClick={() => act(() => api.eat(sel.item.id))}>
                  Manger
                </button>
                <button className="btn btn-sm" title="Le personnage en mange un dès que le précédent expire" onClick={() => act(() => api.stockPantry(sel.item.id, sel.qty))}>
                  Garde-manger
                </button>
              </>
            )}
            {durability[sel.item.id]?.repair && durability[sel.item.id]!.repairCost > 0 && (
              <button className="btn btn-sm" disabled={durability[sel.item.id]!.repair!.problem !== null} title={durability[sel.item.id]!.repair!.problem ?? durability[sel.item.id]!.repair!.materials.map((m) => `${m.qty} × ${content.items[m.item]?.name ?? m.item}`).join(', ')} onClick={() => act(() => api.repairSelf(sel.item.id))}>
                Réparer
              </button>
            )}
            {durability[sel.item.id] && durability[sel.item.id]!.repairCost > 0 && (
              <button className="btn btn-sm" disabled={state.gold < durability[sel.item.id]!.repairCost} title="Rend toute la durabilité ; le maximum ne baisse jamais" onClick={() => act(() => api.repair(sel.item.id))}>
                PNJ · {durability[sel.item.id]!.repairCost} or
              </button>
            )}
            <button className="btn btn-sm" onClick={() => openMarket(sel.item.id)}>
              Vendre
            </button>
            {state.recycle[sel.item.id] && (
              <button className="btn btn-sm" title={`Rend ${state.recycle[sel.item.id]!.map((y) => `${y.qty} × ${content.items[y.item]?.name ?? y.item}`).join(', ')} par exemplaire`} onClick={() => act(() => api.recycle(sel.item.id, 1))}>
                Recycler
              </button>
            )}
          </div>
        </div>
      ) : (
        <p className="muted small gear-hint">Touchez un objet pour ses actions.</p>
      )}
      {pantry.length > 0 && (
        <div className="pantry-row">
          <span className="eyebrow">Garde-manger</span>
          {pantry.map(({ item, qty }) => (
            <button key={item.id} className="chip" title="Reprendre dans le sac" onClick={() => act(() => api.unstockPantry(item.id, qty))}>
              {item.name} ×{num(qty)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

import { useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { Appearance, GearView, Item, Slot } from '@bramo/shared';
import { useGame } from '../game/GameContext';
import { useNow } from '../game/useLive';
import { Character, RigDefs, colorVars, resolveParts, useLook } from '../rig/Character';
import { parts } from '../rig/assets';
import { duration, signedPct } from '../format';
import { ItemIcon } from './ui';

export type EquipSlotId =
  | 'headwear'
  | 'shoulders'
  | 'top'
  | 'gloves'
  | 'belt'
  | 'weapon'
  | 'tool'
  | 'meal'
  | 'cape'
  | 'robe'
  | 'boots';

export interface EquipEntry {
  id: EquipSlotId;
  /** Nom de l'emplacement. */
  label: string;
  /** cosmetic : pièce de tenue ; class : arme de classe ; gear : objet qui donne un bonus. */
  kind: 'cosmetic' | 'class' | 'gear';
  /** Nom de l'objet porté, ou null si l'emplacement est vide. */
  name: string | null;
  detail: string;
  thumb: { slot: Slot; partId: string } | null;
  item: Item | null;
  /** Pièces à mettre en valeur sur le personnage au survol. */
  highlight: Slot[];
  /** Rareté de l'équipement réel porté (couleur de bordure). */
  rarity?: string;
}

const COSMETIC: { id: EquipSlotId; label: string; slots: Slot[] }[] = [
  { id: 'headwear', label: 'Coiffe', slots: ['headwear'] },
  { id: 'shoulders', label: 'Épaules', slots: ['shoulder_far', 'shoulder_near'] },
  { id: 'top', label: 'Haut', slots: ['top'] },
  { id: 'gloves', label: 'Gants', slots: ['gloves'] },
  { id: 'belt', label: 'Ceinture', slots: ['belt'] },
  { id: 'cape', label: 'Cape', slots: ['cape'] },
  { id: 'robe', label: 'Bas', slots: ['robe'] },
  { id: 'boots', label: 'Bottes', slots: ['boots'] },
];

export const DOLL_LEFT: EquipSlotId[] = ['headwear', 'shoulders', 'top', 'gloves', 'belt'];
export const DOLL_RIGHT: EquipSlotId[] = ['weapon', 'tool', 'meal', 'cape', 'robe', 'boots'];

/**
 * Ce que le personnage porte : pièces de tenue (cosmétiques), arme de classe,
 * et objets qui donnent un bonus (outil du métier en cours, repas actif).
 */
export function useEquipment(appearance?: Appearance): Record<EquipSlotId, EquipEntry> {
  const { content, state, receivedAt, look: playerLook } = useGame();
  const look = useLook(appearance ?? playerLook);
  const now = useNow(1000);
  const worn = resolveParts(content, look);
  const outfit = content.cosmetics.outfits.find((o) => o.id === look.outfit)!;
  const cls = content.classes[look.classId];
  const out = {} as Record<EquipSlotId, EquipEntry>;

  for (const c of COSMETIC) {
    const slot = c.slots.find((s) => worn[s]);
    const part = slot ? parts[`${slot}/${worn[slot]}`] : undefined;
    out[c.id] = {
      id: c.id,
      label: c.label,
      kind: 'cosmetic',
      name: part?.name ?? null,
      detail: part ? `Cosmétique · tenue ${outfit.name}` : 'Vide',
      thumb: slot && part ? { slot, partId: part.id } : null,
      item: null,
      highlight: c.slots,
    };
  }

  const weapon = worn.weapon ? parts[`weapon/${worn.weapon}`] : undefined;
  out.weapon = {
    id: 'weapon',
    label: 'Arme',
    kind: 'class',
    name: weapon?.name ?? null,
    detail: weapon ? `Arme de classe · ${cls?.name}` : `Arme du ${cls?.name} à venir`,
    thumb: weapon ? { slot: 'weapon', partId: weapon.id } : null,
    item: null,
    highlight: ['weapon', 'effect'],
  };

  // Outil : le meilleur possédé pour le métier en cours (sinon le meilleur tout court).
  const activeProfession = state.activity && content.recipes[state.activity.recipeId]?.profession;
  const isWorn = (i: Item) => !!state.durability[i.id] && state.durability[i.id]!.copies.every((r) => r <= 0);
  const tools = Object.keys(state.inventory)
    .map((id) => content.items[id])
    .filter((i): i is Item => !!i?.tool)
    .sort((a, b) => Number(isWorn(a)) - Number(isWorn(b)) || b.tool!.bonus - a.tool!.bonus);
  const tool = tools.find((t) => t.tool!.profession === activeProfession && !isWorn(t)) ?? tools[0] ?? null;
  const toolProfession = tool && content.professions.find((p) => p.id === tool.tool!.profession)?.name;
  out.tool = {
    id: 'tool',
    label: 'Outil',
    kind: 'gear',
    name: tool?.name ?? null,
    detail: tool ? (isWorn(tool) ? 'Usé : à réparer' : `${signedPct(tool.tool!.bonus)} de vitesse en ${toolProfession}`) : 'Aucun outil : forgez-en un',
    thumb: null,
    item: tool,
    highlight: [],
  };

  const buff = state.buff;
  const meal = buff ? content.items[buff.itemId] ?? null : null;
  const remaining = buff ? buff.until - (state.serverTime + now - receivedAt) : 0;
  out.meal = {
    id: 'meal',
    label: 'Repas',
    kind: 'gear',
    name: meal && remaining > 0 ? meal.name : null,
    detail: meal && remaining > 0 ? `${signedPct(buff!.bonus)} · encore ${duration(remaining)}` : 'Aucun repas actif',
    thumb: null,
    item: remaining > 0 ? meal : null,
    highlight: [],
  };
  return out;
}

/** Miniature d'une pièce de tenue, recadrée automatiquement sur son contenu. */
export function PartThumb({ slot, partId, appearance }: { slot: Slot; partId: string; appearance?: Appearance }) {
  const { content, look: playerLook } = useGame();
  const look = useLook(appearance ?? playerLook);
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const ref = useRef<SVGGElement>(null);
  const [viewBox, setViewBox] = useState('0 0 480 760');
  const part = parts[`${slot}/${partId}`];
  const layers = useMemo(
    () =>
      part
        ? part.layers
            .filter((l) => l.detail <= 2)
            .sort((a, b) => a.z - b.z)
            .map((l) => ({ id: l.id, markup: part.markup[l.id]!.replaceAll('#rig-', `#${uid}-rig-`) }))
        : [],
    [part, uid],
  );

  useLayoutEffect(() => {
    const box = ref.current?.getBBox();
    if (!box || !box.width) return;
    const size = Math.max(box.width, box.height) * 1.12;
    setViewBox(`${box.x + box.width / 2 - size / 2} ${box.y + box.height / 2 - size / 2} ${size} ${size}`);
  }, [layers]);

  if (!part) return null;
  return (
    <svg className="rig part-thumb" viewBox={viewBox} style={colorVars(content, look)} aria-hidden>
      <RigDefs uid={uid} />
      <g ref={ref} transform={part.anchor[0] || part.anchor[1] ? `translate(${part.anchor[0]} ${part.anchor[1]})` : undefined}>
        {layers.map((l) => (
          <g key={l.id} dangerouslySetInnerHTML={{ __html: l.markup }} />
        ))}
      </g>
    </svg>
  );
}

/** Emplacement du poupon → emplacement d'équipement réel (les épaules n'en ont pas). */
const GEAR_SLOT_OF: Partial<Record<EquipSlotId, string>> = { headwear: 'head', top: 'torso', gloves: 'hands', belt: 'belt', cape: 'cape', robe: 'legs', boots: 'feet', weapon: 'weapon' };
const RARITY_NAMES: Record<string, string> = { common: 'Commun', rare: 'Rare', epic: 'Épique', legendary: 'Légendaire' };

/** Mode Équipement : les cases montrent ce qui est réellement porté (le build), pas l'apparence. */
function gearEntries(base: Record<EquipSlotId, EquipEntry>, gear: GearView | null): Record<EquipSlotId, EquipEntry> {
  const out = { ...base };
  for (const [id, slot] of Object.entries(GEAR_SLOT_OF) as [EquipSlotId, string][]) {
    const g = gear?.items.find((x) => x.equipped === slot);
    out[id] = {
      ...base[id],
      kind: 'gear',
      name: g ? (g.masterpiece ? `Chef-d’œuvre ${g.name}` : g.name) : null,
      detail: g ? `${RARITY_NAMES[g.rarity]} · palier ${g.tier}${g.worn ? ' · usé' : ''}` : 'Vide',
      thumb: null,
      item: null,
      rarity: g?.rarity,
    };
  }
  out.shoulders = { ...base.shoulders, kind: 'gear', name: null, detail: 'Pas d’équipement à cet emplacement', thumb: null, item: null };
  return out;
}

export function EquipSlot({
  entry,
  side,
  onHover,
}: {
  entry: EquipEntry;
  side: 'left' | 'right';
  onHover?: (slots: Slot[] | null) => void;
}) {
  return (
    <div
      className={`equip-slot equip-${entry.kind}${entry.name ? '' : ' empty'}`}
      style={entry.rarity ? ({ '--rc': `var(--r-${entry.rarity})` } as React.CSSProperties) : undefined}
      tabIndex={0}
      onMouseEnter={() => onHover?.(entry.highlight)}
      onMouseLeave={() => onHover?.(null)}
      onFocus={() => onHover?.(entry.highlight)}
      onBlur={() => onHover?.(null)}
      aria-label={`${entry.label} : ${entry.name ?? 'vide'}`}
    >
      {entry.thumb ? (
        <PartThumb slot={entry.thumb.slot} partId={entry.thumb.partId} />
      ) : entry.item ? (
        <ItemIcon item={entry.item} small />
      ) : entry.rarity && entry.name ? (
        <span className="equip-gear-name">{entry.name}</span>
      ) : (
        <span className="equip-empty-label">{entry.label}</span>
      )}
      <span className={`equip-tip ${side}`} role="tooltip">
        <span className="eyebrow">{entry.label}</span>
        <strong>{entry.name ?? 'Vide'}</strong>
        <span className="muted">{entry.detail}</span>
      </span>
    </div>
  );
}

/** Le personnage en entier, entouré de ce qu'il porte. Survoler un emplacement met la pièce en valeur. */
export function PaperDoll({ size, mode = 'look', gear = null }: { size: 'card' | 'page'; mode?: 'gear' | 'look'; gear?: GearView | null }) {
  const { look } = useGame();
  const base = useEquipment();
  const equipment = mode === 'gear' ? gearEntries(base, gear) : base;
  const [highlight, setHighlight] = useState<Slot[] | null>(null);
  return (
    <div className={`doll doll-${size}`}>
      <div className="doll-col">
        {DOLL_LEFT.map((id) => (
          <EquipSlot key={id} entry={equipment[id]} side="left" onHover={setHighlight} />
        ))}
      </div>
      <div className="doll-figure">
        {/* Centré sur le corps : l'ornement et le nom au-dessus tombent sur le même axe. */}
        <Character appearance={look} lod="scene" highlight={highlight} centered />
      </div>
      <div className="doll-col">
        {DOLL_RIGHT.map((id) => (
          <EquipSlot key={id} entry={equipment[id]} side="right" onHover={setHighlight} />
        ))}
      </div>
    </div>
  );
}

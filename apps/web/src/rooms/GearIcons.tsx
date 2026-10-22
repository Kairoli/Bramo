import type { CSSProperties } from 'react';
import { GearIcon, type GearRarity } from '../components/GearIcon';
import { ItemIcon } from '../components/ui';
import { useContent } from '../game/ContentContext';

/** Page de développement (/#icones) : toutes les icônes d'équipement, par rareté, puis la même pièce palier par palier. */
const PIECES: [string, string, string][] = [
  ['head', 'armor', 'Heaume (plaques)'],
  ['head', 'cuirass', 'Calotte (cuir)'],
  ['head', 'trail', 'Capuche (piste)'],
  ['head', 'robe', 'Chapeau (tissu)'],
  ['torso', 'armor', 'Cuirasse (plaques)'],
  ['torso', 'cuirass', 'Plastron (cuir)'],
  ['torso', 'trail', 'Pourpoint (piste)'],
  ['torso', 'robe', 'Robe (tissu)'],
  ['hands', 'armor', 'Gantelets (plaques)'],
  ['hands', 'cuirass', 'Gants (cuir, piste)'],
  ['hands', 'robe', 'Bandes (tissu)'],
  ['legs', 'armor', 'Jambières (plaques)'],
  ['legs', 'trail', 'Braies (cuir, piste)'],
  ['legs', 'robe', 'Jupe (tissu)'],
  ['feet', 'armor', 'Solerets (plaques)'],
  ['feet', 'trail', 'Bottes (cuir, piste)'],
  ['feet', 'robe', 'Chaussons (tissu)'],
  ['cape', 'armor', 'Cape'],
  ['belt', 'cuirass', 'Ceinture'],
  ['necklace', 'jewel', 'Collier'],
  ['ring', 'jewel', 'Anneau'],
  ['weapon', 'hammer', 'Marteau'],
  ['weapon', 'sword_shield', 'Épée et bouclier'],
  ['weapon', 'axe', 'Hache'],
  ['weapon', 'longbow', 'Arc long'],
  ['weapon', 'crossbow', 'Arbalète'],
  ['weapon', 'daggers', 'Dagues'],
  ['weapon', 'staff', 'Bâton'],
  ['weapon', 'scepter', 'Sceptre'],
  ['weapon', 'grimoire', 'Grimoire'],
];
const COLUMNS: { rarity: GearRarity; tier: number; label: string }[] = [
  { rarity: 'common', tier: 1, label: 'Commun · palier 1' },
  { rarity: 'rare', tier: 20, label: 'Rare · palier 20' },
  { rarity: 'epic', tier: 40, label: 'Épique · palier 40' },
  { rarity: 'legendary', tier: 90, label: 'Légendaire · palier 90' },
];
const TIERS = [1, 10, 20, 30, 40, 50, 60, 70, 80, 90];

export function GearIcons() {
  const content = useContent();
  const items = Object.values(content.items).sort((a, b) => a.category.localeCompare(b.category));
  return (
    <div className="gi-page">
      <section className="panel gi-panel">
        <h2>Objets · {items.length}</h2>
        <div className="gi-items">
          {items.map((it) => (
            <span key={it.id} className="gi-item" title={`${it.name} · ${it.category}`}>
              <ItemIcon item={it} />
              <small>{it.name}</small>
            </span>
          ))}
        </div>
      </section>
      <section className="panel gi-panel">
        <h2>Icônes d’équipement</h2>
        <div className="gi-grid" style={{ gridTemplateColumns: `170px repeat(${COLUMNS.length}, 1fr)` }}>
          <span />
          {COLUMNS.map((c) => (
            <span key={c.label} className="eyebrow" style={{ color: `var(--r-${c.rarity})` }}>
              {c.label}
            </span>
          ))}
          {PIECES.map(([slot, family, label]) => (
            <Row key={`${slot}${family}`} slot={slot} family={family} label={label} />
          ))}
        </div>
      </section>
      <section className="panel gi-panel">
        <h2>La même pièce, palier par palier (Rare)</h2>
        {PIECES.map(([slot, family, label]) => (
          <div key={`${slot}${family}`} className="gi-tiers">
            <span className="muted small">{label}</span>
            {TIERS.map((t) => (
              <span key={t} className="gi-tile" style={{ '--rc': 'var(--r-rare)' } as CSSProperties} title={`palier ${t}`}>
                <GearIcon slot={slot} family={family} tier={t} rarity="rare" size={44} />
                <small>{t}</small>
              </span>
            ))}
          </div>
        ))}
      </section>
    </div>
  );
}

function Row({ slot, family, label }: { slot: string; family: string; label: string }) {
  return (
    <>
      <span className="muted">{label}</span>
      {COLUMNS.map((c) => (
        <span key={c.rarity} className="gi-cell">
          <span className="gi-tile big" style={{ '--rc': `var(--r-${c.rarity})` } as CSSProperties}>
            <GearIcon slot={slot} family={family} tier={c.tier} rarity={c.rarity} size={64} />
          </span>
          <span className="gi-tile" style={{ '--rc': `var(--r-${c.rarity})` } as CSSProperties}>
            <GearIcon slot={slot} family={family} tier={c.tier} rarity={c.rarity} size={40} />
          </span>
        </span>
      ))}
    </>
  );
}

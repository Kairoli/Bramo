import { useState } from 'react';
import { type Appearance, type Lod, type Slot, slots } from '@bramo/shared';
import { useContent } from '../game/ContentContext';
import { Character, resolveParts } from '../rig/Character';
import { partsInSlot } from '../rig/assets';

const SLOT_NAMES: Record<Slot, string> = {
  body: 'Corps',
  headwear: 'Coiffe',
  face: 'Visage et barbe',
  shoulder_near: 'Épaule (côté proche)',
  shoulder_far: 'Épaule (côté sort)',
  top: 'Haut et manches',
  belt: 'Ceinture',
  robe: 'Bas de robe',
  gloves: 'Gants',
  boots: 'Bottes',
  cape: 'Cape',
  weapon: 'Arme',
  effect: 'Effet de classe',
};

const LODS: { id: Lod; name: string; size: string }[] = [
  { id: 'portrait', name: 'Portrait', size: '80 px' },
  { id: 'scene', name: 'Scène', size: '400 px' },
  { id: 'combat', name: 'Combat', size: 'plein cadre' },
];

const STYLE_NAMES = { melee: 'Mêlée', ranged: 'Tir', magic: 'Magie' } as const;

/** Page de développement : tester tenues, pièces, os et animation de repos. */
export function Atelier() {
  const content = useContent();
  const [look, setLook] = useState<Appearance>({
    outfit: content.cosmetics.default.outfit,
    classId: content.cosmetics.default.class,
  });
  const [lod, setLod] = useState<Lod>('scene');
  const [bones, setBones] = useState(false);
  const [animate, setAnimate] = useState(true);
  const [explode, setExplode] = useState(false);
  const cls = content.classes[look.classId]!;
  const worn = resolveParts(content, look);
  const editable = slots.filter((s) => s !== 'body');

  const setPart = (slot: Slot, id: string) =>
    setLook((l) => ({ ...l, overrides: { ...l.overrides, [slot]: id === '' ? null : id } }));

  return (
    <div className="atelier">
      <section className="panel band atelier-stage">
        <div className="atelier-lods tabs tabs-sm" role="tablist">
          {LODS.map((l) => (
            <button key={l.id} role="tab" aria-selected={lod === l.id} onClick={() => setLod(l.id)}>
              {l.name} · {l.size}
            </button>
          ))}
        </div>
        <div className={`atelier-frame atelier-${lod}`}>
          <Character appearance={look} lod={lod} animate={animate} showBones={bones} explode={explode} />
        </div>
        <div className="atelier-chips">
          <span className="chip">Trois quarts vers la droite, jamais en miroir</span>
          <span className="chip">{Object.keys(worn).length} pièces sur un même squelette</span>
        </div>
      </section>

      <aside className="panel atelier-side scroll">
        <div className="eyebrow" style={{ color: cls.affinityColor }}>
          Classe de base · {STYLE_NAMES[cls.style]}
        </div>
        <h1>{cls.name}</h1>
        <p className="muted">Atelier de personnages · page de développement</p>

        <div className="atelier-classes">
          {Object.values(content.classes).map((c) => (
            <button
              key={c.id}
              className={`chip${c.id === look.classId ? ' active' : ''}`}
              style={{ borderColor: c.id === look.classId ? c.affinityColor : undefined, color: c.affinityColor }}
              title={c.weapon ? `Tenue de départ et pose du ${c.name}` : 'Visuel à venir'}
              onClick={() => setLook({ classId: c.id, outfit: c.startingOutfit })}
            >
              {c.name}
            </button>
          ))}
        </div>

        <span className="eyebrow">Tenue</span>
        <div className="outfits">
          {content.cosmetics.outfits.map((o) => (
            <button
              key={o.id}
              className={`outfit${o.id === look.outfit ? ' selected' : ''}`}
              onClick={() => setLook((l) => ({ ...l, outfit: o.id, overrides: undefined }))}
            >
              <span className="swatches">
                {[o.palette.coat, o.palette.mantle, o.palette.trim].map((c, i) => (
                  <span key={i} style={{ background: c }} />
                ))}
              </span>
              <span>
                <strong>{o.name}</strong>
                <span className="muted">{o.subtitle}</span>
              </span>
            </button>
          ))}
        </div>

        <span className="eyebrow">Pièces</span>
        <div className="slot-list">
          {editable.map((slot) => (
            <label key={slot} className="slot-row">
              <span className="muted">{SLOT_NAMES[slot]}</span>
              <select value={worn[slot] ?? ''} onChange={(e) => setPart(slot, e.target.value)}>
                <option value="">Aucune</option>
                {partsInSlot(slot).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>

        <div className="atelier-toggles">
          <button className={`btn${bones ? ' btn-primary' : ''}`} onClick={() => setBones(!bones)}>
            Os
          </button>
          <button className={`btn${animate ? ' btn-primary' : ''}`} onClick={() => setAnimate(!animate)}>
            Repos animé
          </button>
          <button className={`btn${explode ? ' btn-primary' : ''}`} onClick={() => setExplode(!explode)}>
            Éclater les pièces
          </button>
        </div>
        <a className="link" href="#">
          ← Retour au jeu
        </a>
      </aside>
    </div>
  );
}

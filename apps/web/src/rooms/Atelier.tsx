import { useEffect, useState } from 'react';
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
  legs: 'Jambières',
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

/** Images par seconde mesurées (moyenne sur une seconde) : sert à juger le coût d'un style de pièces. */
function useFps(): number {
  const [fps, setFps] = useState(0);
  useEffect(() => {
    let frames = 0;
    let last = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      frames++;
      if (now - last >= 1000) {
        setFps(Math.round((frames * 1000) / (now - last)));
        frames = 0;
        last = now;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return fps;
}

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
  // Le corps se change aussi : une livraison peut fournir son propre corps (sous-couches des articulations).
  const editable = [...slots];
  const [copies, setCopies] = useState(1);
  const fps = useFps();

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
        <div className={`atelier-frame atelier-${lod}${copies > 1 ? ' atelier-crowd' : ''}`}>
          {copies === 1 ? (
            <Character appearance={look} lod={lod} animate={animate} showBones={bones} explode={explode} />
          ) : (
            Array.from({ length: copies }, (_, i) => <Character key={i} appearance={look} lod="scene" animate={animate} />)
          )}
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
          <label className="chip">
            Copies
            <select value={copies} onChange={(e) => setCopies(Number(e.target.value))}>
              {[1, 5, 10, 20, 40].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <span className="chip" title="Images par seconde mesurées sur cette page">
            {fps} i/s
          </span>
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

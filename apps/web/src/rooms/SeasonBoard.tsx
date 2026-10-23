import { type CSSProperties, useState } from 'react';
import type { Appearance, Lod, Slot } from '@bramo/shared';
import { useContent } from '../game/ContentContext';
import { Character } from '../rig/Character';

/**
 * Essais d'apparences de saison (page de développement `/#saisons`, demande de Louis du 23 octobre : « fais des tests, en
 * lien avec des types de saisons qu'on pourrait avoir ; des pièces, des tenues complètes »). Chaque tenue d'essai
 * (`sketch_season_*` dans data/cosmetics.yaml, jamais proposée au joueur) sur les trois classes, puis ses pièces une à une
 * posées sur la tenue de départ de chaque classe, comme on les achèterait à la pièce.
 */

const CLASSES = ['runist', 'forgefire', 'tracker'] as const;

/** Pièce montrée seule : sur quelle classe et quelle tenue (celle de départ par défaut). */
interface Showcase {
  slot: Slot;
  id: string;
  classId: string;
  outfit?: string;
}

const SEASONS: { outfit: string; season: string; mood: string; sky: [string, string]; weapons?: Record<string, string>; showcase?: Showcase[] }[] = [
  { outfit: 'sketch_season_frost', season: 'Saison du Givre', mood: 'Hiver : fourrure, cristaux de glace, neige qui tombe.', sky: ['#1B2A36', '#3B5568'] },
  { outfit: 'sketch_season_harvest', season: 'Saison des Moissons', mood: 'Fin d’été : paille, gerbe de blé, lanterne-courge, feuilles qui tombent.', sky: ['#2A2018', '#6A4A26'] },
  { outfit: 'sketch_season_carnival', season: 'Carnaval des Masques', mood: 'Événement surprise : masque à bec, tricorne à plumes, collerette, confettis.', sky: ['#22142A', '#5A2448'] },
  { outfit: 'sketch_season_abyss', season: 'Marée des Abysses', mood: 'Printemps des marées : couronne de corail, cape d’algues, coquillage, bulles.', sky: ['#0D2226', '#1E4A50'] },
  {
    outfit: 'sketch_season_halloween',
    season: 'Halloween',
    mood: 'La Veillée des Courges : sorts verts spectraux, lanternes d’âmes, toiles, loup ; armes d’apparence.',
    sky: ['#140F1A', '#3A2440'],
    weapons: { runist: 'halloween_staff', forgefire: 'halloween_hammer', tracker: 'halloween_bow' },
    showcase: [
      { slot: 'headwear', id: 'halloween_pumpkin', classId: 'forgefire' },
      { slot: 'headwear', id: 'halloween_witch_hat', classId: 'runist' },
      { slot: 'shoulder_near', id: 'halloween_crow', classId: 'tracker' },
      { slot: 'cape', id: 'halloween_bat_cape', classId: 'runist' },
      { slot: 'effect', id: 'halloween_mist', classId: 'forgefire' },
      { slot: 'headwear', id: 'halloween_pumpkin', classId: 'tracker', outfit: 'sketch_season_halloween' },
    ],
  },
];

export function SeasonBoard() {
  const content = useContent();
  // ?only=<tenue>&lod=combat&still=1 avant le #saisons : pour une capture d'une seule tenue (navigateur sans fenêtre).
  const q = new URLSearchParams(location.search);
  const [lod, setLod] = useState<Lod>((q.get('lod') as Lod) ?? 'scene');
  const [still, setStill] = useState(q.has('still'));
  const [only, setOnly] = useState<string | null>(q.get('only'));
  const shown = SEASONS.filter((s) => !only || s.outfit === only);
  return (
    <div className={`season-board${only ? " big" : ""}`} style={{ '--zoom': q.get('zoom') ?? 1, '--pzoom': q.get('pzoom') ?? 1 } as CSSProperties}>
      <header className="season-board-head">
        <h1>Essais d’apparences de saison</h1>
        <span className="muted small">Page de développement · tenues `sketch_season_*`, jamais proposées au joueur</span>
        <div className="season-board-tools">
          {(['scene', 'combat'] as Lod[]).map((l) => (
            <button key={l} className={`chip${lod === l ? ' on' : ''}`} onClick={() => setLod(l)}>
              {l === 'scene' ? 'Scène' : 'Plein cadre'}
            </button>
          ))}
          <button className={`chip${still ? ' on' : ''}`} onClick={() => setStill(!still)}>
            Figer
          </button>
          <button className={`chip${only ? '' : ' on'}`} onClick={() => setOnly(null)}>
            Toutes
          </button>
          {SEASONS.map((s) => (
            <button key={s.outfit} className={`chip${only === s.outfit ? ' on' : ''}`} onClick={() => setOnly(s.outfit)}>
              {s.season}
            </button>
          ))}
        </div>
      </header>
      {shown.map((s) => {
        const outfit = content.cosmetics.outfits.find((o) => o.id === s.outfit);
        if (!outfit) return <p key={s.outfit}>Tenue {s.outfit} absente de data/cosmetics.yaml.</p>;
        // Les pièces propres à la saison (pas celles reprises d'une autre tenue), pour l'essai « à la pièce ».
        // Les pièces propres à la saison (celles de son générateur, toutes classes confondues), pour l'essai « à la pièce ».
        const prefix = s.outfit.replace('sketch_season_', '') + '_';
        const all = [outfit.parts, ...Object.values(outfit.byClass ?? {}).map((v) => v.parts)].flatMap((p) => Object.entries(p));
        const own = [...new Map(all.filter(([, id]) => id?.startsWith(prefix)).map(([slot, id]) => [id, [slot, id]])).values()] as [Slot, string][];
        const shows: Showcase[] = s.showcase ?? own.map(([slot, id], i) => ({ slot, id, classId: CLASSES[i % CLASSES.length]! }));
        return (
          <section key={s.outfit} className="season-row" style={{ '--sky-a': s.sky[0], '--sky-b': s.sky[1] } as CSSProperties}>
            <div className="season-row-title">
              <span className="eyebrow">{s.season}</span>
              <h2>{outfit.name}</h2>
              <p className="muted small">{s.mood}</p>
            </div>
            <div className="season-stage">
              {CLASSES.map((c) => (
                <figure key={c}>
                  <Character appearance={{ classId: c, outfit: s.outfit, overrides: s.weapons?.[c] ? { weapon: s.weapons[c] } : undefined }} lod={lod} animate={!still} />
                  <figcaption className="small muted">{content.classes[c]?.name}</figcaption>
                </figure>
              ))}
            </div>
            {shows.length > 0 && (
              <div className="season-pieces">
                <span className="eyebrow">À la pièce, sur la tenue de départ</span>
                <div className="season-stage small">
                  {shows.map(({ slot, id, classId: c, outfit: o }, i) => {
                    const look: Appearance = { classId: c, outfit: o ?? content.classes[c]?.startingOutfit ?? 'ashes', overrides: { [slot]: id } };
                    return (
                      <figure key={`${id}${i}`}>
                        <Character appearance={look} lod="scene" animate={!still} />
                        <figcaption className="small muted">{id.replace(prefix, '').replaceAll('_', ' ')}</figcaption>
                      </figure>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

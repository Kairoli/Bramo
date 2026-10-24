import { type CSSProperties, useEffect, useMemo, useState } from 'react';
import type { TideLiveFighter, TideLiveView } from '@bramo/shared';
import { useContent } from '../game/ContentContext';
import { Character } from '../rig/Character';
import { TideLive } from '../components/TideLive';

/**
 * Vidéo de promotion (format vertical 9:16, 15 s) [demande de Louis, 24 octobre : « des TikToks pour promouvoir le
 * jeu »]. Page de développement `/#promo` ; `tools/promo/record.mjs` la filme image par image (temps virtuel) et
 * l'encode en MP4. Tout est fonction du temps écoulé depuis l'ouverture : la même image à chaque prise.
 *
 * Le pilote : « Chaque soir à 20 h… la Marée remonte. Tout le serveur tient la digue. » puis les trois classes et le logo.
 */

const DURATION = 15_000;
const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
/** 0 → 1 entre deux instants, adouci. */
const ease = (t: number, from: number, to: number) => {
  const x = clamp((t - from) / (to - from));
  return x * x * (3 - 2 * x);
};
/** Apparition puis disparition : visible entre a et b, fondu de f ms. */
const window01 = (t: number, a: number, b: number, f = 300) => Math.min(ease(t, a, a + f), 1 - ease(t, b - f, b));

/** Temps écoulé depuis le début ; sous l'enregistreur (window.__vt), il part quand l'enregistrement commence. */
function useClock() {
  const [t, setT] = useState(0);
  useEffect(() => {
    let frame = 0;
    let start: number | null = null;
    const vt = (window as unknown as { __vt?: { started: boolean } }).__vt;
    const tick = () => {
      if (!vt || vt.started) {
        start ??= performance.now();
        setT(performance.now() - start);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);
  return t;
}

const rand = (seed: number) => {
  let s = seed >>> 0 || 1;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0), s / 4294967296);
};
const NAMES = ['Brume', 'Tisonne', 'Aulne', 'Grésil', 'Ferrand', 'Lysandre', 'Pétrel', 'Marne', 'Sorbe', 'Cendrine', 'Galet', 'Ronce', 'Vireo', 'Halle', 'Tarn', 'Écume', 'Bastide', 'Saule', 'Fauve', 'Corvin', 'Ysolde', 'Rocaille', 'Varech', 'Bruyère', 'Héron', 'Molène', 'Givre', 'Escarbille', 'Pistil', 'Gravelot', 'Neyzz', 'Puitsdor'];

export function Promo() {
  const content = useContent();
  const t = useClock();

  // La foule de la digue : les trois classes, leurs tenues (saisons d'essai comprises, pour la variété).
  const fighters = useMemo<TideLiveFighter[]>(() => {
    const r = rand(20);
    const classes = Object.keys(content.classes);
    return Array.from({ length: 30 }, (_, i) => {
      const classId = classes[i % classes.length]!;
      const outfits = content.cosmetics.outfits.filter((o) => o.classes.includes(classId) && (!o.id.startsWith('sketch_') || o.id.startsWith('sketch_season_')));
      const outfit = outfits[Math.floor(r() * outfits.length)]!.id;
      return { id: i + 1, name: NAMES[i % NAMES.length]!, appearance: { classId, outfit }, live: r() > 0.5, me: i === 0 };
    });
  }, [content]);

  // La digue se remplit pendant la scène de la Marée ; une lanterne s'allume à chaque seuil.
  const [base] = useState(() => Date.now());
  const share = 0.08 + 0.95 * ease(t, 3200, 9200);
  const shares = [0.25, 0.5, 0.75, 1];
  const objective = 2550;
  const view = useMemo<TideLiveView>(
    () => ({
      day: 0,
      tide: 'lanterns',
      name: 'La Nuit des Lanternes',
      phase: 'battle',
      registrationStart: base - 60 * 60_000,
      start: base - 20 * 60_000,
      end: base + 40 * 60_000,
      serverTime: base,
      fighters,
      total: 128,
      progress: { points: Math.round(objective * Math.min(1, share)), objective, shares, lit: shares.filter((s) => share >= s).length },
      recap: [],
      demo: false,
    }),
    // La vue ne change qu'au franchissement d'une lanterne ou par pas de points : moins de rendus de la foule.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fighters, base, Math.round(share * 40)],
  );

  // La caméra sur la scène de la Marée : la foule, puis les lanternes, puis la foule qui tient.
  const pan = ease(t, 4300, 6100) - ease(t, 7300, 8900) * 0.75;
  const zoom = 1.32;
  const sceneW = 1000 * zoom;
  const panX = -(sceneW - 540) * pan;

  const clock = t < 1700 ? '19:59' : '20:00';
  const ring = ease(t, 1700, 2500);
  const actionAt = useMemo(() => [0, 1, 2].map(() => 0), []);
  const classTime = t - 9700;
  const classes = Object.values(content.classes);

  return (
    <div className="promo-stage">
      <div className="promo-frame">
        {/* 1. Le bourg la nuit, l'horloge du beffroi. */}
        <div className="promo-layer" style={{ opacity: 1 - ease(t, 2400, 2900) }}>
          <div className="promo-town" style={{ transform: `scale(${1.02 + t * 0.00003}) translateX(${-20 + t * 0.006}px)` }} />
          <div className="promo-night" />
          <div className="promo-fog" style={{ transform: `translateY(${120 - ease(t, 0, 2600) * 160}px)`, opacity: 0.4 + ease(t, 800, 2400) * 0.5 }} />
          <div className="promo-clock" style={{ transform: `scale(${1 + 0.08 * Math.sin(Math.min(1, ring) * Math.PI)})` }}>
            <span className={clock === '20:00' ? 'on' : ''}>{clock}</span>
            {[0, 1, 2].map((k) => (
              <i key={k} className="promo-ring" style={{ opacity: (1 - clamp(ring * 1.4 - k * 0.25)) * (t > 1700 ? 1 : 0), transform: `scale(${0.6 + clamp(ring * 1.4 - k * 0.25) * 2.2})` }} />
            ))}
          </div>
          <Caption t={t} a={250} b={2700} top>
            Chaque soir, à <b>20 h</b>…
          </Caption>
        </div>

        {/* 2. La Marée en direct : la caméra glisse sur la digue. */}
        <div className="promo-layer promo-sea" style={{ opacity: window01(t, 2500, 9800, 450) }}>
          <div className="promo-tide" style={{ width: sceneW, height: 420 * zoom, transform: `translateX(${panX}px)` }}>
            <div style={{ width: 1000, height: 420, transform: `scale(${zoom})`, transformOrigin: '0 0' }}>
              {t > 2300 && t < 10000 && <TideLive view={view} />}
            </div>
          </div>
          <Caption t={t} a={2900} b={6000} top>
            …la <b className="tide">Marée</b> remonte.
          </Caption>
          <Caption t={t} a={6200} b={9700} top>
            Tout le serveur
            <br />
            tient la <b className="tide">digue</b>.
          </Caption>
          {/* Les quatre lanternes de la digue : elles s'allument une à une, à chaque seuil. */}
          <div className="promo-lanterns" style={{ opacity: window01(t, 3300, 9700) }}>
            {shares.map((s, i) => (
              <i key={i} className={share >= s ? 'lit' : ''} />
            ))}
          </div>
          <div className="promo-count" style={{ opacity: window01(t, 6600, 9600) }}>
            <strong>128</strong> joueurs · <strong>1</strong> soir · <strong>4</strong> lanternes
          </div>
        </div>

        {/* 3. Les trois classes. */}
        <div className="promo-layer promo-classes" style={{ opacity: window01(t, 9500, 12700, 350) }}>
          <div className="promo-glow" />
          <div className="promo-trio">
            {classes.map((c, i) => {
              const appear = ease(classTime, i * 220, i * 220 + 450);
              return (
                <div key={c.id} className="promo-hero" style={{ opacity: appear, transform: `translateY(${(1 - appear) * 60}px)`, '--cc': c.affinityColor } as CSSProperties}>
                  <Character
                    appearance={{ classId: c.id, outfit: c.startingOutfit }}
                    lod="scene"
                    centered
                    action={classTime > 900 + i * 350 ? { anim: `attack_${c.id}`, at: actionAt[i]! || (actionAt[i] = performance.now()) } : undefined}
                  />
                  <span className="promo-hero-name">{c.name}</span>
                </div>
              );
            })}
          </div>
          <Caption t={t} a={9800} b={12600} bottom>
            <b>3 classes</b>. Ton build,
            <br />
            tes sorts.
          </Caption>
        </div>

        {/* 4. Le logo. */}
        <div className="promo-layer promo-end" style={{ opacity: ease(t, 12500, 13000) }}>
          <div className="promo-glow end" />
          <h1 className="promo-logo" style={{ transform: `scale(${0.85 + 0.15 * ease(t, 12500, 13300)})`, letterSpacing: `${0.02 + 0.1 * ease(t, 12500, 13600)}em` }}>
            BRAMO
          </h1>
          <p className="promo-tag" style={{ opacity: ease(t, 13000, 13500) }}>
            Le MMO idle où ton perso
            <br />
            joue même quand tu dors.
          </p>
          <span className="promo-soon" style={{ opacity: ease(t, 13600, 14100) }}>
            Bientôt dans ton navigateur
          </span>
        </div>
      </div>
      {/* Pour le script de prise de vue : la durée et l'instant. */}
      <span className="promo-meta" data-duration={DURATION} data-t={Math.round(t)} hidden />
    </div>
  );
}

function Caption({ t, a, b, top, bottom, children }: { t: number; a: number; b: number; top?: boolean; bottom?: boolean; children: React.ReactNode }) {
  const o = window01(t, a, b, 280);
  const rise = 1 - ease(t, a, a + 380);
  return (
    <div className={`promo-caption${top ? ' top' : ''}${bottom ? ' bottom' : ''}`} style={{ opacity: o, transform: `translateY(${rise * 26}px) scale(${1 + rise * 0.04})` }}>
      {children}
    </div>
  );
}

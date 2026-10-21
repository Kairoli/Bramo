// Génère esquisses.html : les pièces dessinées sur les personnages (captures de l'Atelier dans art/*.svg).
// Usage : node docs/design/catalogue/generate_esquisses.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const art = (n) => readFileSync(join(here, 'art', `${n}.svg`), 'utf8');
const css = readFileSync(join(here, 'style.css'), 'utf8');

const tiers = [
  ['t1', 'Palier 1', 'Bronze', 'Commun et Rare : cuir et bronze, galon cuivre.'],
  ['t10', 'Palier 10', 'Fer', 'Métal gris, galon clair, tabard rouge sombre.'],
  ['t20', 'Palier 20', 'Acier', 'Acier bleuté, galon cyan, tabard bleu nuit.'],
];
const rarities = [
  ['epic', 'Épique · palier 20', 'Gravures violettes, plumet, médaillon.'],
  ['legendary', 'Légendaire · palier 20', 'Galon d’or, runes lumineuses, ailes de heaume, pointes d’épaulière.'],
];
const sets = [
  ['cendres', 'Cendres persistantes', 'Métal noirci, fissures de braise, crête de flammes.'],
  ['enclume', 'L’Enclume patiente', 'Plaques lourdes rivetées, emblème d’enclume, bouclier de heaume.'],
];
const classes = [['fg', 'Forgefeu'], ['tq', 'Traqueur'], ['rn', 'Runiste']];

const fig = (n, label, sub) => `<figure class="fig"><div class="stage">${art(n)}</div><figcaption><b>${label}</b><span class="muted">${sub}</span></figcaption></figure>`;

const html = `<title>Esquisses d’équipement</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&family=IBM+Plex+Sans:wght@400;500;600&display=swap">
<style>
${css}
.figs { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 14px; }
.fig { margin: 0; display: grid; gap: 8px; background: var(--sunken); border: 1px solid var(--border); border-radius: 12px; padding: 12px; }
.stage { height: 520px; display: flex; align-items: flex-end; justify-content: center; }
.stage svg { height: 100%; width: auto; max-width: 100%; }
.small-stage .stage { height: 380px; }
figcaption { display: grid; gap: 2px; }
ul.tight { margin: 0; padding-left: 18px; display: grid; gap: 4px; }
</style>
<div class="wrap">
  <header>
    <span class="eyebrow">Esquisses · 21 octobre 2026 · lot 1, famille Armure</span>
    <h1>Esquisses d’équipement</h1>
    <p class="muted">Pièces de <b>Forgefeu</b> uniquement : la famille Armure lui est réservée. Même style et mêmes os que les personnages ; chaque pièce est un calque SVG recoloré par la palette de la tenue.</p>
  </header>

  <section class="panel"><h2>Du palier 1 au palier 20</h2>
    <p class="muted">Un seul dessin de base par pièce ; le palier ne change que la palette (matière, galon, tabard).</p>
    <div class="figs">${tiers.map(([k, l, m, d]) => fig(`armure_fg_${k}`, `${l} · ${m}`, d)).join('')}</div>
  </section>

  <section class="panel"><h2>Épique et Légendaire</h2>
    <p class="muted">Mêmes pièces, plus d’ouvrage : gravures au galon, plumet, médaillon sur le plastron. Le Légendaire ajoute des runes lumineuses (à la couleur d’affinité de la classe), des ailes de heaume, des pointes d’épaulière et une gemme.</p>
    <div class="figs">${rarities.map(([k, l, d]) => fig(`armure_fg_${k}`, l, d)).join('')}</div>
  </section>

  <section class="panel"><h2>Détails d’ensemble</h2>
    <p class="muted">Un ensemble se reconnaît à ses pièces, pas seulement à sa couleur. Quatre pièces propres à chaque ensemble, complétées par des pièces d’Armure ordinaires (le mélange 4+2 reste possible).</p>
    <div class="figs">${sets.map(([k, l, d]) => fig(`armure_fg_${k}`, l, d)).join('')}</div>
  </section>

  <section class="panel small-stage"><h2>Contrôle technique, pas du contenu</h2>
    <p class="muted">Pour vérifier que les pièces suivent des poses différentes (jambes, bras), on les a posées sur les squelettes du Traqueur et du Runiste. L’Armure reste réservée au Forgefeu ; ces deux classes auront leurs propres pièces.</p>
    <div class="figs">${classes.filter(([c]) => c !== 'fg').map(([c, n]) => fig(`armure_${c}_t10`, n, 'Test d’ajustement')).join('')}</div>
  </section>

  <section class="panel"><h2>Ce que contient le lot</h2>
    <ul class="tight">
      <li><b>Coiffe</b> : heaume de fantassin. <b>Torse</b> : plastron à arête, lames de ventre, brassards, gorgerin. <b>Gants</b> : gantelets. <b>Jambes</b> (nouvel emplacement) : cuissots, genouillères, grèves.</li>
      <li><b>Bottes</b> : solerets à lames. <b>Cape</b> : tabard d’armes. <b>Ceinture</b> : ceinturon à plaque et tassettes. <b>Épaules</b> : épaulière de plates.</li>
      <li><b>Variantes</b> : Épique, Légendaire (huit pièces chacune), Cendres persistantes (heaume, plastron, gantelets, jambières) et L’Enclume patiente (plastron, jambières, solerets, ceinturon).</li>
    </ul>
  </section>
</div>
`;
writeFileSync(join(here, 'esquisses.html'), html);
console.log('esquisses.html', (html.length / 1024).toFixed(0), 'Ko');

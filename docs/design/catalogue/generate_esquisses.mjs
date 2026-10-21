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
    <span class="eyebrow">Esquisses · 21 octobre 2026 · premier lot</span>
    <h1>Esquisses d’équipement</h1>
    <p class="muted">Même style et mêmes os que les personnages : chaque pièce est un calque SVG qui suit le squelette, recolorée par la palette de la tenue. Premier lot : la famille <b>Armure</b> (Forgefeu), sept emplacements plus l’épaulière.</p>
  </header>

  <section class="panel"><h2>La famille Armure, trois paliers</h2>
    <p class="muted">Un seul dessin par pièce. Le palier ne change que la palette (matière, galon, tabard) : c’est ce qui rend 760 objets réalistes à dessiner.</p>
    <div class="figs">${tiers.map(([k, l, m, d]) => fig(`armure_fg_${k}`, `${l} · ${m}`, d)).join('')}</div>
  </section>

  <section class="panel small-stage"><h2>Mêmes pièces sur les trois poses (palier 10)</h2>
    <p class="muted">Test d’ajustement, pas une règle : l’Armure est réservée au Forgefeu. On vérifie que les pièces suivent les trois poses sans se déformer. L’arme de classe reste celle de la classe.</p>
    <div class="figs">${classes.map(([c, n]) => fig(`armure_${c}_t10`, n, 'Pose de la classe')).join('')}</div>
  </section>

  <section class="panel"><h2>Ce que contient le lot</h2>
    <ul class="tight">
      <li><b>Coiffe</b> : heaume de fantassin (calotte à crête, jugulaire, nasal, visage dégagé).</li>
      <li><b>Torse</b> : plastron de plates à arête, lames de ventre, brassards, gorgerin.</li>
      <li><b>Gants</b> : gantelets (manchettes évasées, dos de main côté proche).</li>
      <li><b>Jambes</b> (nouvel emplacement) : cuissots, genouillères, grèves.</li>
      <li><b>Bottes</b> : solerets à lames. <b>Cape</b> : tabard d’armes (manteau dans le dos et agrafe). <b>Ceinture</b> : ceinturon à plaque et tassettes. <b>Épaules</b> : épaulière de plates.</li>
    </ul>
  </section>
</div>
`;
writeFileSync(join(here, 'esquisses.html'), html);
console.log('esquisses.html', (html.length / 1024).toFixed(0), 'Ko');

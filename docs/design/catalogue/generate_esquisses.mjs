// Génère esquisses.html : les pièces dessinées sur les personnages (captures de l'Atelier dans art/*.svg).
// Usage : node docs/design/catalogue/generate_esquisses.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const art = (n) => readFileSync(join(here, 'art', `${n}.svg`), 'utf8');
const css = readFileSync(join(here, 'style.css'), 'utf8');
const shapes = (n) => (art(n).match(/<(path|circle|ellipse|rect|line)\b/g) ?? []).length;
const kb = (n) => Math.round(art(n).length / 1024);

const fig = (n, label, sub) => `<figure class="fig"><div class="stage">${art(n)}</div><figcaption><b>${label}</b><span class="muted">${sub}</span></figcaption></figure>`;

const base = [
  ['armure_fg_t1', 'Forgefeu · Armure', 'Plaques, camail, tabard : le jeu de base du guerrier.'],
  ['piste_tq', 'Traqueur · Tenue de piste', 'Cuir, chemise, capuche à bec, bandoulière, bottes souples.'],
  ['robe_rn', 'Runiste · Robe', 'Tissu ample, ourlet et col brodés de runes, mantelet.'],
];
const before = [
  ['avant_braise', 'Avant : tenue de départ du Forgefeu'],
  ['avant_lisiere', 'Avant : tenue de départ du Traqueur'],
  ['avant_cendres', 'Avant : tenue de départ du Runiste'],
];
const tiers = [
  ['armure_fg_t1', 'Palier 1', 'Bronze'],
  ['armure_fg_t10', 'Palier 10', 'Fer'],
  ['armure_fg_t20', 'Palier 20', 'Acier'],
];
const rarities = [
  ['armure_fg_epic', 'Épique', 'Gravures violettes, plumet, médaillon.'],
  ['armure_fg_legendary', 'Légendaire', 'Galon d’or, runes lumineuses, ailes de heaume, pointes d’épaulière.'],
];
const sets = [
  ['armure_fg_cendres', 'Cendres persistantes', 'Métal noirci, fissures de braise, crête de flammes.'],
  ['armure_fg_enclume', 'L’Enclume patiente', 'Plaques lourdes rivetées, emblème d’enclume, bouclier de heaume.'],
];

const row = (n) => `<tr><td>${n[1]}</td><td class="mono">${shapes(n[0])}</td><td class="mono">${kb(n[0])} Ko</td></tr>`;

const html = `<title>Esquisses d’équipement</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap">
<style>
${css}
.figs { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px; }
.fig { margin: 0; display: grid; gap: 8px; background: var(--sunken); border: 1px solid var(--border); border-radius: 12px; padding: 12px; align-content: start; }
.stage { height: 500px; display: flex; align-items: flex-end; justify-content: center; }
.stage svg { height: 100%; width: auto; max-width: 100%; }
.small .stage { height: 340px; }
figcaption { display: grid; gap: 2px; }
ul.tight { margin: 0; padding-left: 18px; display: grid; gap: 5px; }
</style>
<div class="wrap">
  <header>
    <span class="eyebrow">Esquisses · 21 octobre 2026 · deuxième passe</span>
    <h1>Esquisses d’équipement</h1>
    <p class="muted">Style plat, fait à la main, sur le squelette du jeu : un jeu de base par classe. Seconde passe : plus de volume (reflet de métal, ombres), des matières (cuir grené, tissu tissé, mailles) et des détails (rivets, coutures, broderies), à budget de formes maîtrisé.</p>
  </header>

  <section class="panel"><h2>Les trois jeux de base</h2>
    <div class="figs">${base.map(([n, l, d]) => fig(n, l, d)).join('')}</div>
  </section>

  <section class="panel small"><h2>Avant, pour comparer</h2>
    <p class="muted">Les tenues de départ actuelles du jeu (déjà dessinées avant cette passe).</p>
    <div class="figs">${before.map(([n, l]) => fig(n, l, '')).join('')}</div>
  </section>

  <section class="panel"><h2>Armure du Forgefeu : de la première esquisse à la deuxième</h2>
    <div class="figs">${fig('armure_fg_avant', 'Première esquisse', 'Plaques plates, jambes fines, petits pieds.')}${fig('armure_fg_t20', 'Deuxième passe', 'Cuissots et grèves épais, genouillères en éventail, solerets à lames, lames de ventre, tassettes à trois rangs.')}</div>
  </section>

  <section class="panel"><h2>Du palier 1 au palier 20</h2>
    <p class="muted">Un seul dessin ; le palier ne change que la palette (matière, galon, tabard).</p>
    <div class="figs">${tiers.map(([n, l, m]) => fig(n, `${l} · ${m}`, '')).join('')}</div>
  </section>

  <section class="panel"><h2>Épique, Légendaire et ensembles</h2>
    <div class="figs">${rarities.map(([n, l, d]) => fig(n, l, d)).join('')}${sets.map(([n, l, d]) => fig(n, l, d)).join('')}</div>
  </section>

  <section class="panel"><h2>Coût de rendu</h2>
    <table><tr><th>Personnage complet (corps, arme, effet compris)</th><th>Formes</th><th>Taille du dessin</th></tr>
      ${[['avant_braise', 'Avant : Forgefeu de départ'], ['avant_lisiere', 'Avant : Traqueur de départ'], ['avant_cendres', 'Avant : Runiste de départ'], ['armure_fg_t1', 'Armure (Forgefeu)'], ['piste_tq', 'Tenue de piste (Traqueur)'], ['robe_rn', 'Robe (Runiste)'], ['armure_fg_legendary', 'Armure légendaire']].map(row).join('')}
    </table>
    <p class="muted small">Mesure dans le navigateur de développement, dix copies à l’écran : environ 29 images par seconde avec les tenues de départ actuelles, 14 à 16 avec les nouveaux jeux de base. Ils coûtent donc environ le double ; la livraison peinte de ChatGPT coûtait dix fois plus.</p>
  </section>
</div>
`;
writeFileSync(join(here, 'esquisses.html'), html);
console.log('esquisses.html', (html.length / 1024).toFixed(0), 'Ko');

// Génère docs/design/catalogue/catalogue.html (page autonome) et catalogue.json à partir de data.mjs.
// Usage : node docs/design/catalogue/generate.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as data from './data.mjs';
import { GLYPHS } from './glyphs.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const art = (name) => readFileSync(join(here, 'art', `${name}.svg`), 'utf8').replace(/ role="img" aria-label="Personnage"/, ' role="img" aria-label="Personnage"').replace('preserveAspectRatio="xMidYMax meet"', 'preserveAspectRatio="xMidYMax meet" aria-hidden="true"');

const classes = data.CLASSES.map((c) => ({ ...c, color: { forgefire: 'var(--copper)', tracker: 'var(--good)', runist: 'var(--magic)' }[c.id], svg: art(c.art) }));
const DATA = {
  tiers: data.TIERS,
  rarities: data.RARITIES,
  stats: data.STATS,
  classes,
  families: data.FAMILIES,
  slots: data.SLOTS,
  items: data.ITEMS,
  sets: data.SETS,
  gems: data.GEMS,
  gemFamilies: data.GEM_FAMILIES,
  minorGems: data.MINOR_GEMS,
  gemRanks: data.GEM_RANKS,
  gemTierScale: data.GEM_TIER_SCALE,
  sources: data.SOURCES,
  dropWindow: data.DROP_WINDOW,
  profiles: data.PROFILES,
  glyphs: GLYPHS,
};

writeFileSync(
  join(here, 'catalogue.json'),
  JSON.stringify({ tiers: data.TIERS, rarities: data.RARITIES, families: data.FAMILIES, slots: data.SLOTS, items: data.ITEMS, sets: data.SETS, gems: data.GEMS, minorGems: data.MINOR_GEMS, sources: data.SOURCES }, null, 1),
);

const css = readFileSync(join(here, 'style.css'), 'utf8');
const client = readFileSync(join(here, 'client.js'), 'utf8');
const json = JSON.stringify(DATA).replace(/</g, '\\u003c');
const html = `<title>Butin de Bramo</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap">
<style>
${css}
</style>
<div class="wrap">
  <header>
    <span class="eyebrow">Conception du 21 octobre 2026 · illustratif, pas un catalogue définitif</span>
    <h1>Butin de Bramo</h1>
    <p class="muted">Tout ce que le jeu pourrait faire tomber ou fabriquer sur les trois premiers paliers : vêtements par famille et par classe, armes, bijoux, ensembles, gemmes. Noms et chiffres servent à voir le pool, pas à équilibrer.</p>
  </header>
  <nav id="nav" role="tablist" aria-label="Sections"></nav>

  <section class="tab" id="tab-apercu">
    <div class="kpis" id="kpis"></div>
    <div class="panel"><h2>Qui porte quoi</h2>
      <p class="muted">Chaque classe a sa silhouette. Les vêtements sont des familles liées aux classes ; les bijoux sont universels et les armes propres à la classe. L’élément des sorts vient du répertoire choisi, pas de la classe seule.</p>
      <div class="grid g3" id="classes"></div></div>
    <div class="panel"><h2>Anatomie d’un objet</h2>
      <div class="anatomy"><div id="anatomy"></div><div class="grid" id="parts"></div></div></div>
    <div class="panel"><h2>Répartition du pool</h2><div id="distribution" class="scroll"></div></div>
  </section>

  <section class="tab" id="tab-equipement" hidden>
    <div class="panel"><div class="filters" id="filters"></div><div class="small muted" id="count"></div></div>
    <div class="layout">
      <div class="grid"><div class="cards" id="cards"></div><div class="pager" id="pager"></div></div>
      <aside class="panel detail" id="detail"></aside>
    </div>
  </section>

  <section class="tab" id="tab-gemmes" hidden>
    <div class="panel"><h2>Les gemmes font les builds</h2>
      <p class="muted">Un talent est une règle automatique : quand [événement], si [condition], alors [effet]. Quatre gemmes majeures actives (arme, torse, coiffe, collier) ; n’importe quelle classe peut en porter. Les valeurs suivent le palier et le rang ; à partir du rang Rare, une clause supplémentaire.</p>
      <div class="filters"><div><div class="eyebrow">Palier</div><div class="seg" id="gtier"></div></div><div><div class="eyebrow">Rang</div><div class="seg" id="grank"></div></div></div></div>
    <div class="grid" id="gems"></div>
    <div class="panel"><h3>Gemmes mineures</h3><div class="scroll" id="minor"></div></div>
  </section>

  <section class="tab" id="tab-ensembles" hidden>
    <div class="panel"><h2>Ensembles à 2, 3 et 4 pièces</h2><p class="muted">On combine 4+2, 3+3, 2+2+2 ou des ensembles mêlés à des pièces indépendantes. Le bonus à 4 pièces sert un type de rencontre sans écraser les autres assemblages. Les ensembles d’événement ne donnent jamais de bonus indispensable.</p></div>
    <div class="grid g3" id="sets"></div>
  </section>

  <section class="tab" id="tab-sources" hidden>
    <div class="panel"><h2>D’où vient le butin</h2><p class="muted">Une région ou un donjon a un palier. Il fait tomber surtout des objets de ce palier, des objets du palier précédent, et plus rarement du palier suivant (à convoiter). La ligne variable de chaque exemplaire ajoute le hasard.</p></div>
    <div class="grid g3" id="sources"></div>
    <div class="panel"><h2>Chaque profil a ses objectifs</h2><div class="grid g3" id="profiles"></div></div>
  </section>

  <footer>Source des données : docs/design/catalogue/data.mjs · design : docs/design/combat-items.md</footer>
</div>
<script>
const DATA = ${json};
${client}
</script>
`;
writeFileSync(join(here, 'catalogue.html'), html);
console.log('catalogue.html', (html.length / 1024).toFixed(0), 'Ko ;', DATA.items.length, 'objets');

/* Visionneuse du pool de butin : tout vient de l'objet DATA (voir data.mjs). */
const D = DATA;
const $ = (id) => document.getElementById(id);
const el = (tag, cls, html) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html !== undefined) e.innerHTML = html;
  return e;
};
const nf = new Intl.NumberFormat('fr-FR');
const rar = (id) => D.rarities.find((r) => r.id === id);
const fam = (id) => D.families.find((f) => f.id === id);
const cls = (id) => D.classes.find((c) => c.id === id);
const slotName = (id) => (D.slots.find((s) => s.id === id) || { name: id === 'tool' ? 'Outil' : id }).name;
const ico = (g) => `<svg class="g" viewBox="0 0 48 48" aria-hidden="true">${D.glyphs[g] || D.glyphs.gem}</svg>`;
const glyphOf = (it) => (it.kind === 'weapon' ? it.family : it.kind === 'tool' ? 'tool' : it.slot);
const colorOf = (it) => (it.kind === 'weapon' ? cls(it.classes[0]).color || 'var(--copper)' : it.kind === 'jewel' ? 'var(--gold)' : it.kind === 'tool' ? 'var(--good)' : fam(it.family).color);
const famName = (it) => (it.kind === 'jewel' ? 'Bijou universel' : it.kind === 'weapon' ? 'Arme' : it.kind === 'tool' ? 'Métier' : fam(it.family).name);
const className = (ids) => (ids.length === 3 ? 'Toutes les classes' : ids.map((i) => cls(i).name).join(', '));
const chip = (txt, color) => `<span class="chip"${color ? ` style="color:${color};border-color:${color}"` : ''}>${txt}</span>`;
const statName = (k) => D.stats[k] || k;

// --- Onglets ---
const TABS = [
  ['apercu', 'Aperçu'],
  ['equipement', 'Équipement'],
  ['gemmes', 'Gemmes'],
  ['ensembles', 'Ensembles'],
  ['sources', 'Sources de butin'],
];
const nav = $('nav');
function showTab(id) {
  const tab = TABS.find((t) => t[0] === id) ? id : 'apercu';
  for (const [key] of TABS) $(`tab-${key}`).hidden = key !== tab;
  nav.querySelectorAll('button').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === tab)));
  try { history.replaceState(null, '', `#${tab}`); } catch (e) { /* page intégrée : pas de changement d'adresse */ }
}
TABS.forEach(([key, label]) => {
  const b = el('button', '', label);
  b.dataset.tab = key;
  b.setAttribute('role', 'tab');
  b.addEventListener('click', () => showTab(key));
  nav.appendChild(b);
});

// --- Aperçu ---
const count = (f) => D.items.filter(f).length;
const kpis = [
  [D.items.filter((i) => i.kind !== 'tool').length, 'objets d’équipement'],
  [count((i) => i.kind === 'clothing' && !i.set && !i.named), 'vêtements de famille'],
  [count((i) => i.kind === 'weapon' && !i.named), 'armes (9 catégories)'],
  [count((i) => i.kind === 'jewel'), 'bijoux universels'],
  [count((i) => i.set), 'pièces d’ensemble'],
  [D.gems.length + D.minorGems.length, 'gemmes (talents et mineures)'],
];
$('kpis').innerHTML = kpis.map(([n, l]) => `<div class="kpi"><b>${nf.format(n)}</b><span>${l}</span></div>`).join('');

$('classes').innerHTML = '';
for (const c of D.classes) {
  const card = el('div', 'class-card');
  card.innerHTML = `<div class="fig">${c.svg}</div>
    <div class="info">
      <span class="eyebrow">${c.style}</span><h3>${c.name}</h3><p class="small muted">${c.pitch}</p>
      <div><span class="eyebrow">Vêtements</span><div class="chips">${c.families.map((f) => chip(fam(f).name, fam(f).color)).join('')}</div></div>
      <div><span class="eyebrow">Armes</span><div class="chips">${c.weapons.map((w) => chip(D.items.find((i) => i.family === w).name.split(' ').slice(0, 3).join(' ').replace(/ (de|d’|d').*$/, ''))).join('')}</div></div>
      <div><span class="eyebrow">Éléments du répertoire</span><div class="chips">${c.elements.map((e) => chip(e)).join('')}</div></div>
    </div>`;
  $('classes').appendChild(card);
}

// Exemplaire annoté
const sample = D.items.find((i) => i.name === 'Tunique de l’Aube') || D.items.find((i) => i.masterpieceExample);
function anatomy() {
  const s = sample;
  const line = s.lines[1] || s.lines[0];
  $('anatomy').innerHTML = `
    <div class="card" style="--rc:${rar(s.rarity).color};--fc:${colorOf(s)};cursor:default;grid-template-columns:64px 1fr">
      <div class="ico" style="width:64px;height:64px">${ico(glyphOf(s))}</div>
      <div class="t">
        <strong style="font-size:15px">Chef-d’œuvre ${s.name}</strong>
        <span>Niveau ${s.tier} · ${slotName(s.slot)} · ${famName(s)}</span>
        <span>${s.stats.map((x) => `${statName(x.stat)} ${x.value}`).join(' · ')}</span>
        <span style="color:var(--teal)">${line.name} +${line.max} % (jet maximal, lignes choisies par l’artisan)</span><span style="color:var(--r-legendary)">Ligne bonus du chef-d’œuvre : +6 % de chance de gemme</span>
        <span>Gemme : <span style="color:var(--ge-storm)">Paratonnerre</span> · Signé : Maître Brunhild</span>
        <span>Durabilité 142 / 150 h</span>
      </div>
    </div>`;
}
anatomy();
const parts = [
  ['Niveau requis', 'celui de la classe pour le combat, celui du métier pour un outil.'],
  ['Rareté', 'Commun, Rare, Épique ou Légendaire : fixe pour le modèle, elle règle le budget de statistiques et les emplacements. Aucun talent.'],
  ['Attributs fixes', 'connus d’avance, propres au modèle : une cuirasse protège, un harnais frappe.'],
  ['Lignes fixes et aléatoires', 'Commun : 1 fixe ; les autres : 2 fixes. Les lignes aléatoires varient en nombre avec la rareté (0-1, 1-2, 2-3, 3-4) ; les valeurs suivent le palier. Un artisan peut les monter jusqu’au maximum de chaque ligne, sans re-tirage.'],
  ['Gemme', 'les talents sont là. Quatre gemmes majeures actives : arme, torse, coiffe, collier.'],
  ['Ensemble', 'des bonus à 2, 3 et 4 pièces, indépendants de la rareté.'],
  ['Chef-d’œuvre', 'tirage séparé à la fabrication (2 à 5 %, 1 par jour et par artisan), jamais par retouche : lignes choisies par l’artisan, toutes au maximum, plus une ligne bonus unique. Le nom ne répète pas la rareté.'],
  ['Signature', 'tout objet fabriqué garde le nom de son artisan ; aucun bonus, seulement la réputation et la recherche au marché.'],
  ['Usure', 'baisse avec le temps de combat, se répare sans jamais perdre de durabilité maximale.'],
];
$('parts').innerHTML = parts.map(([a, b]) => `<div class="sub"><b>${a}</b><span class="muted">${b}</span></div>`).join('');

// Répartition par palier et rareté
function distribution() {
  const rows = D.tiers.map((t) => {
    const its = D.items.filter((i) => i.tier === t && i.kind !== 'tool');
    const total = its.length;
    const bar = D.rarities.map((r) => {
      const n = its.filter((i) => i.rarity === r.id).length;
      return `<i style="width:${(n / total) * 100}%;background:${r.color}" title="${r.name} : ${n}"></i>`;
    }).join('');
    return `<tr><td class="mono">palier ${t}</td><td class="mono">${total}</td><td style="min-width:200px"><div class="stack">${bar}</div></td></tr>`;
  });
  $('distribution').innerHTML = `<table><tr><th>Palier</th><th>Objets</th><th>Répartition des raretés</th></tr>${rows.join('')}</table>
    <div class="legend">${D.rarities.map((r) => `<span><i class="dot" style="background:${r.color}"></i>${r.name}</span>`).join('')}</div>`;
}
distribution();

// --- Équipement ---
const F = { cls: '', slot: '', fam: '', tier: '', rar: '', q: '', page: 0, sel: null };
const PAGE = 48;
const filterBar = $('filters');
function select(id, label, options) {
  const l = el('label', '', `<span>${label}</span>`);
  const s = el('select');
  s.id = id;
  s.innerHTML = options.map(([v, t]) => `<option value="${v}">${t}</option>`).join('');
  l.appendChild(s);
  return [l, s];
}
const defs = [
  ['cls', 'Classe', [['', 'Toutes'], ...D.classes.map((c) => [c.id, c.name])]],
  ['slot', 'Emplacement', [['', 'Tous'], ...D.slots.map((s) => [s.id, s.name]), ['tool', 'Outil de métier']]],
  ['fam', 'Famille', [['', 'Toutes'], ...D.families.map((f) => [f.id, f.name]), ['jewel', 'Bijou'], ['weapon', 'Arme']]],
  ['tier', 'Palier', [['', 'Tous'], ...D.tiers.map((t) => [String(t), `Palier ${t}`])]],
  ['rar', 'Rareté', [['', 'Toutes'], ...D.rarities.map((r) => [r.id, r.name])]],
];
for (const [key, label, opts] of defs) {
  const [l, s] = select(`f-${key}`, label, opts);
  s.addEventListener('change', () => { F[key] = s.value; F.page = 0; renderItems(); });
  filterBar.appendChild(l);
}
const search = el('label', '', '<span>Recherche</span>');
const qi = el('input');
qi.type = 'search';
qi.id = 'f-q';
qi.placeholder = 'Nom…';
qi.addEventListener('input', () => { F.q = qi.value.toLowerCase(); F.page = 0; renderItems(); });
search.appendChild(qi);
filterBar.appendChild(search);

const matches = (it) =>
  (!F.cls || it.classes.includes(F.cls)) &&
  (!F.slot || it.slot === F.slot) &&
  (!F.fam || it.family === F.fam || (F.fam === 'weapon' && it.kind === 'weapon') || (F.fam === 'jewel' && it.kind === 'jewel')) &&
  (!F.tier || it.tier === Number(F.tier)) &&
  (!F.rar || it.rarity === F.rar) &&
  (!F.q || it.name.toLowerCase().includes(F.q));

function itemCard(it) {
  const b = el('button', 'card');
  b.style.setProperty('--rc', rar(it.rarity).color);
  b.style.setProperty('--fc', colorOf(it));
  b.setAttribute('aria-pressed', String(F.sel === it.id));
  b.innerHTML = `<div class="ico">${ico(glyphOf(it))}</div><div class="t"><strong>${it.name}</strong><span>${famName(it)} · ${slotName(it.slot)}</span><span>${rar(it.rarity).name} · palier ${it.tier}</span></div>`;
  b.addEventListener('click', () => { F.sel = it.id; renderItems(); renderDetail(); });
  return b;
}
function renderItems() {
  const list = D.items.filter(matches);
  const pages = Math.max(1, Math.ceil(list.length / PAGE));
  F.page = Math.min(F.page, pages - 1);
  const box = $('cards');
  box.innerHTML = '';
  list.slice(F.page * PAGE, F.page * PAGE + PAGE).forEach((it) => box.appendChild(itemCard(it)));
  if (!list.length) box.innerHTML = '<p class="muted">Aucun objet ne correspond à ces filtres.</p>';
  $('count').textContent = `${nf.format(list.length)} objet${list.length > 1 ? 's' : ''}`;
  const pg = $('pager');
  pg.innerHTML = '';
  const prev = el('button', '', 'Précédent'), next = el('button', '', 'Suivant');
  prev.disabled = F.page === 0;
  next.disabled = F.page >= pages - 1;
  prev.addEventListener('click', () => { F.page--; renderItems(); });
  next.addEventListener('click', () => { F.page++; renderItems(); });
  pg.append(prev, el('span', 'small muted', `page ${F.page + 1} sur ${pages}`), next);
}
const SRC = { start: 'Set de départ (lié au personnage)', craft: 'Fabrication (Forge, Couture, Tannerie…)', loot: 'Butin de rencontres', plan: 'Plan à apprendre', dungeon: 'Donjon', event: 'Événement' };
let masterpiece = false;
function renderDetail() {
  const d = $('detail');
  const it = D.items.find((i) => i.id === F.sel);
  if (!it) { d.innerHTML = '<p class="muted">Choisissez un objet pour voir sa fiche.</p>'; return; }
  const max = Math.max(...it.stats.map((s) => s.value || 0), 1);
  const line = it.lines[0];
  const set = it.set ? D.sets.find((s) => s.id === it.set) : null;
  const craftable = it.source.includes('craft');
  d.innerHTML = `
    <div class="eyebrow" style="color:${rar(it.rarity).color}">${rar(it.rarity).name}${masterpiece && craftable ? ' · Chef-d’œuvre' : ''}</div>
    <h3>${masterpiece && craftable ? 'Chef-d’œuvre ' : ''}${it.name}</h3>
    <div class="chips">${chip(`Niveau ${it.tier}`)}${chip(slotName(it.slot))}${chip(famName(it), colorOf(it))}${it.material ? chip(it.material.replace(/^d[e’']\s?/, '')) : ''}${it.weaponSpeed ? chip(it.weaponSpeed) : ''}</div>
    <p class="small muted">Porté par : <b style="color:var(--text)">${it.classes.length ? className(it.classes) : 'toute personne exerçant le métier'}</b></p>
    ${it.stats.length && typeof it.stats[0] === 'object' ? `<div class="grid">${it.stats.map((s) => `<div class="statrow"><span>${statName(s.stat)}</span><div class="bar"><i style="width:${(s.value / max) * 100}%"></i></div><b class="mono">${s.value}</b></div>`).join('')}</div>` : `<div class="sub">${it.stats.map((s) => `<span>${s}</span>`).join('')}</div>`}
    ${it.conditional ? `<div class="sub"><b style="color:var(--r-legendary)">Attribut conditionnel</b><span>${it.conditional}</span></div>` : ''}
    ${line && it.rolls ? `<div class="sub"><b>Lignes aléatoires : ${it.rolls[0] === it.rolls[1] ? it.rolls[0] : `${it.rolls[0]} à ${it.rolls[1]}`}</b><span class="muted">Tirées parmi (fourchette selon le palier) :</span>${it.lines.map((l) => `<span>• ${l.name} : ${l.min} à ${l.max} %${masterpiece && craftable ? ` → ${l.max} (choisie, au max)` : ''}</span>`).join('')}${masterpiece && craftable ? `<span style="color:var(--teal)">Chef-d’œuvre : lignes choisies au maximum, plus une ligne bonus, signé par l’artisan.</span>` : ''}</div>` : ''}
    <div class="sub"><b>Gemme</b><span class="muted">${it.socket === 'aucun' ? 'Aucun emplacement.' : it.socket === 'majeur' ? 'Emplacement de talent (gemme majeure).' : it.socket === 'mineur' ? 'Emplacement de gemme mineure.' : it.socket === 'métier' ? 'Emplacement de gemme de métier.' : 'Un emplacement de gemme.'}</span></div>
    ${set ? `<div class="sub"><b>Ensemble : ${set.name}</b><span class="muted">${set.theme}</span></div>` : ''}
    <div class="sub"><b>Où le trouver</b>${it.source.map((s) => `<span>• ${SRC[s]}</span>`).join('')}</div>
    ${craftable ? `<div class="seg" role="group" aria-label="Exemplaire"><button aria-pressed="${!masterpiece}" id="m0">Exemplaire courant</button><button aria-pressed="${masterpiece}" id="m1">Chef-d’œuvre</button></div>` : ''}`;
  const m0 = $('m0'), m1 = $('m1');
  if (m0) { m0.addEventListener('click', () => { masterpiece = false; renderDetail(); }); m1.addEventListener('click', () => { masterpiece = true; renderDetail(); }); }
}
F.sel = D.items.find((i) => i.family === 'armor' && i.slot === 'torso' && i.tier === 20 && i.rarity === 'rare')?.id || D.items[0].id;
renderItems();
renderDetail();

// --- Gemmes ---
const G = { tier: 20, rank: 'common' };
function seg(target, items, key) {
  target.innerHTML = '';
  items.forEach(([v, t]) => {
    const b = el('button', '', t);
    b.setAttribute('aria-pressed', String(String(G[key]) === String(v)));
    b.addEventListener('click', () => { G[key] = typeof G[key] === 'number' ? Number(v) : v; renderGems(); });
    target.appendChild(b);
  });
}
function renderGems() {
  seg($('gtier'), D.tiers.map((t) => [t, `Palier ${t}`]), 'tier');
  seg($('grank'), D.gemRanks.map((r) => [r.id, r.name]), 'rank');
  const rank = D.gemRanks.find((r) => r.id === G.rank);
  const k = D.gemTierScale[G.tier] * rank.mult;
  const box = $('gems');
  box.innerHTML = '';
  for (const gf of D.gemFamilies) {
    const gems = D.gems.filter((g) => g.fam === gf.id);
    const sec = el('div', 'panel');
    sec.innerHTML = `<div><span class="eyebrow" style="color:${gf.color}">Famille de build</span><h3>${gf.name}</h3><p class="small muted">${gf.idea}</p></div>`;
    const grid = el('div', 'grid g3');
    for (const g of gems) {
      const v = Math.round(g.base * k * 10) / 10;
      const c = el('div', 'gem');
      c.style.setProperty('--gc', gf.color);
      c.innerHTML = `<header><div class="ico">${ico('gem')}</div><div><strong>${g.name}</strong><div class="small muted">${g.trigger}</div></div></header>
        <p class="small">${g.effect.replace('{v}', `<b class="mono">${v}</b>`)}</p>
        <div class="small muted">Délai : ${g.icd}</div>
        ${rank.rider ? `<div class="rider">Clause de rang : ${g.rider}</div>` : ''}`;
      grid.appendChild(c);
    }
    sec.appendChild(grid);
    box.appendChild(sec);
  }
  $('minor').innerHTML = `<table><tr><th>Gemme mineure</th><th>Effet au palier ${G.tier}, rang ${rank.name}</th></tr>${D.minorGems.map((m) => `<tr><td>${m.name}</td><td class="mono">+${Math.round(m.base * k)} ${m.stat}</td></tr>`).join('')}</table>`;
}
renderGems();

// --- Ensembles ---
function renderSets() {
  const box = $('sets');
  box.innerHTML = '';
  for (const s of D.sets) {
    const f = fam(s.family);
    const c = el('div', 'panel set');
    c.innerHTML = `<div><span class="eyebrow" style="color:${f.color}">${f.name} · ${cls(s.cls).name}${s.event ? ' · événement' : ''}</span><h3>${s.name}</h3><p class="small muted">${s.theme}</p></div>
      <div class="pieces">${s.pieces.map(([slot, name]) => `<span class="piece" style="--fc:${f.color}"><span class="ico">${ico(slot)}</span><span>${name}<br><span class="muted">${slotName(slot)}</span></span></span>`).join('')}</div>
      <div class="grid">${s.bonuses.map((b, i) => `<div class="bonus"><b>${i + 2} p.</b><span>${b}</span></div>`).join('')}</div>
      <p class="small muted">${s.note}</p>`;
    box.appendChild(c);
  }
}
renderSets();

// --- Sources ---
function renderSources() {
  const box = $('sources');
  box.innerHTML = '';
  for (const s of D.sources) {
    const tiers = [s.tier - 10, s.tier, s.tier + 10];
    const pool = (t) => D.items.filter((i) => i.tier === (t < 1 ? 1 : t) && i.kind !== 'tool' && !i.named && !i.set).length;
    const c = el('div', 'panel');
    c.innerHTML = `<div><span class="eyebrow">${s.kind} · palier ${s.tier}</span><h3>${s.name}</h3><p class="small muted">${s.blurb}</p><p class="small">Boss : <b>${s.boss}</b></p></div>
      <div class="stack" aria-label="Répartition des paliers de butin">${D.dropWindow.map((w, i) => `<i style="width:${w.share * 100}%;background:${['var(--copper)', 'var(--teal)', 'var(--magic)'][i]}" title="${w.label} : ${w.share * 100} %"></i>`).join('')}</div>
      <div class="legend">${D.dropWindow.map((w, i) => `<span><i class="dot" style="background:${['var(--copper)', 'var(--teal)', 'var(--magic)'][i]}"></i>${w.label} ${w.share * 100} %</span>`).join('')}</div>
      <table><tr><th>Palier du butin</th><th>Modèles possibles</th></tr>${tiers.map((t, i) => (t < 1 || t > 20 ? '' : `<tr><td>palier ${t}${i === 1 ? ' (cœur)' : ''}</td><td class="mono">${pool(t)}</td></tr>`)).join('')}</table>
      <div class="chips">${['Équipement fini', 'Composants de boss', 'Plans', 'Gemmes', 'Fragments garantis'].map((x) => chip(x)).join('')}</div>`;
    box.appendChild(c);
  }
  $('profiles').innerHTML = D.profiles.map((p) => `<div class="panel"><h3>${p.name}</h3><p class="small muted">Objectif : ${p.goal}</p><p class="small">${p.gets}</p></div>`).join('');
}
renderSources();

showTab(location.hash.replace('#', '') || 'apercu');

// Catalogue illustratif du butin de Bramo (21 octobre 2026), tranche des paliers 1, 10 et 20.
// Il met en forme les règles de docs/design/combat-items.md ; ce n'est PAS un catalogue définitif :
// noms, statistiques et chiffres servent à visualiser le pool, pas à équilibrer.

export const TIERS = [1, 10, 20];

export const RARITIES = [
  { id: 'common', name: 'Commun', mult: 1.0, stats: 1, rolls: [0, 1], socket: 'aucun', color: 'var(--r-common)' },
  { id: 'rare', name: 'Rare', mult: 1.05, stats: 2, rolls: [1, 2], socket: 'mineur', color: 'var(--r-rare)' },
  { id: 'epic', name: 'Épique', mult: 1.1, stats: 2, rolls: [2, 3], socket: 'oui', color: 'var(--r-epic)' },
  { id: 'legendary', name: 'Légendaire', mult: 1.15, stats: 2, rolls: [3, 4], socket: 'oui', color: 'var(--r-legendary)' },
];

export const STATS = {
  vitality: 'Vitalité',
  defense: 'Défense',
  power: 'Puissance',
  haste: 'Cadence',
  crit: 'Critique',
  tenacity: 'Ténacité',
};

export const CLASSES = [
  {
    id: 'forgefire',
    name: 'Forgefeu',
    style: 'Mêlée',
    art: 'forgefeu',
    families: ['armor', 'cuirass'],
    weapons: ['hammer', 'sword_shield', 'axe'],
    elements: ['Physique', 'Feu'],
    pitch: 'Un guerrier de la forge : plaques, cuir renforcé, armes lourdes.',
  },
  {
    id: 'tracker',
    name: 'Traqueur',
    style: 'Tir',
    art: 'traqueur',
    families: ['cuirass', 'trail'],
    weapons: ['longbow', 'crossbow', 'daggers'],
    elements: ['Physique', 'Foudre'],
    pitch: 'Un pisteur discret : cuir, capuches, tirs précis et marques.',
  },
  {
    id: 'runist',
    name: 'Runiste',
    style: 'Magie',
    art: 'runiste',
    families: ['trail', 'robe'],
    weapons: ['staff', 'scepter', 'grimoire'],
    elements: ['Feu', 'Givre', 'Foudre'],
    pitch: 'Un mage runique : robes, tuniques, sorts de l\'élément que vous choisissez.',
  },
];

export const FAMILIES = [
  {
    id: 'armor',
    name: 'Armure',
    look: 'Plaques, mailles, grosses épaulières',
    classes: ['forgefire'],
    color: 'var(--copper)',
    material: ['de bronze', 'de fer', 'd\'acier'],
    names: ['du Bon Vivant', 'du Cogneur', 'du Sergent boiteux', 'du Tapageur'],
    epicNames: ['du Veilleur de braise', 'du Briseur de serments'],
    legendNames: { head: 'Couronne du Roi sans feu', torso: 'Cœur de la Forge-Mère', hands: 'Gantelets du Dernier Serment', legs: 'Jambières du Colosse boiteux', feet: 'Solerets du Pas de fer', cape: 'Tabard du Régiment fantôme', belt: 'Ceinturon du Fondeur maudit' },
    slotNames: { head: 'Heaume', torso: 'Plastron', hands: 'Gantelets', legs: 'Jambières', feet: 'Solerets', cape: 'Tabard d\'armes', belt: 'Ceinturon' },
    bias: { defense: 1.25, haste: 0.8 },
  },
  {
    id: 'cuirass',
    name: 'Cuirasse',
    look: 'Cuir renforcé, boucles, pièces de métal',
    classes: ['forgefire', 'tracker'],
    color: 'var(--teal)',
    material: ['de cuir bouilli', 'de cuir tanné', 'de cuir durci'],
    names: ['du Colporteur bourru', 'du Guetteur pressé', 'du Dernier Relais', 'du Rôdeur patient'],
    epicNames: ['du Contrebandier', 'de la Louve grise'],
    legendNames: { head: 'Cervelière du Louvetier', torso: 'Pourpoint de la Mère-louve', hands: 'Mitaines du Chasseur de têtes', legs: 'Chausses du Fugitif', feet: 'Bottes du Dernier Pardon', cape: 'Cape du Convoi perdu', belt: 'Ceinture du Bourreau pensif' },
    slotNames: { head: 'Cervelière', torso: 'Pourpoint', hands: 'Mitaines cloutées', legs: 'Chausses', feet: 'Bottes ferrées', cape: 'Cape de cuir', belt: 'Ceinture à plaques' },
    bias: { vitality: 1.1 },
  },
  {
    id: 'trail',
    name: 'Tenue de piste',
    look: 'Cuir léger, capes, capuches',
    classes: ['tracker', 'runist'],
    color: 'var(--good)',
    material: ['de peau', 'de daim', 'de cuir fin'],
    names: ['du Chat maigre', 'du Voleur de lune', 'de la Pie-grièche', 'du Braconnier repenti'],
    epicNames: ['du Braconnier pardonné', 'de la Corneille'],
    legendNames: { head: 'Capuche de la Veuve {p}', torso: 'Veste du Spectre de la lisière', hands: 'Gants de la Veuve {p}', legs: 'Pantalon du Funambule', feet: 'Bottes du Chat sans ombre', cape: 'Cape de la Pie-grièche noire', belt: 'Ceinture du Braconnier des étoiles' },
    slotNames: { head: 'Capuche', torso: 'Veste', hands: 'Gants souples', legs: 'Pantalon', feet: 'Bottes souples', cape: 'Cape déchiquetée', belt: 'Ceinture à poches' },
    bias: { haste: 1.2, crit: 1.1, defense: 0.85 },
  },
  {
    id: 'robe',
    name: 'Robe',
    look: 'Tissu, robes, tuniques, ornements runiques',
    classes: ['runist'],
    color: 'var(--magic)',
    material: ['de toile', 'de lin', 'de soie'],
    names: ['de l\'Apprenti distrait', 'du Somnambule', 'de l\'Encrier', 'du Griffonneur d\'orage'],
    epicNames: ['de l\'Encrier sans fond', 'du Penseur d\'orage'],
    legendNames: { head: 'Capuchon du Songe-creux', torso: 'Robe du Grand Silence', hands: 'Mitaines de l\'Encre vive', legs: 'Jupe des Marées mortes', feet: 'Chaussons du Somnambule royal', cape: 'Mantelet de l\'Orage endormi', belt: 'Cordon du Sceau brisé' },
    slotNames: { head: 'Capuchon', torso: 'Tunique', hands: 'Mitaines brodées', legs: 'Jupe de tissu', feet: 'Chaussons', cape: 'Mantelet', belt: 'Cordon à sceaux' },
    bias: { power: 1.2, defense: 0.6, vitality: 0.9 },
  },
];

export const SLOTS = [
  { id: 'head', name: 'Coiffe', w: 0.8, kind: 'clothing' },
  { id: 'torso', name: 'Torse', w: 1.4, kind: 'clothing' },
  { id: 'hands', name: 'Gants', w: 0.6, kind: 'clothing' },
  { id: 'legs', name: 'Jambes', w: 1.0, kind: 'clothing' },
  { id: 'feet', name: 'Bottes', w: 0.6, kind: 'clothing' },
  { id: 'cape', name: 'Cape', w: 0.6, kind: 'clothing' },
  { id: 'belt', name: 'Ceinture', w: 0.6, kind: 'clothing' },
  { id: 'necklace', name: 'Collier', w: 0.7, kind: 'jewel' },
  { id: 'ring', name: 'Anneau', w: 0.5, kind: 'jewel' },
  { id: 'weapon', name: 'Arme', w: 1.6, kind: 'weapon' },
];

const SHARES = {
  protective: { defense: 0.45, vitality: 0.35, tenacity: 0.2 },
  offensive: { power: 0.45, crit: 0.25, haste: 0.2, defense: 0.1 },
};

/** Points de base d'un palier (illustratif). */
export const basePoints = (level) => Math.round(18 + level * 4.2);

/** Lignes variables compatibles par emplacement, avec leur plage de valeurs en % au palier 1 (elle grandit avec le palier). */
export const VARIABLE_LINES = {
  head: [['Critique', 2, 4], ['Ténacité', 3, 6], ['Dégâts de Feu', 2, 4], ['Dégâts de Givre', 2, 4], ['Vitalité', 3, 6], ['Défense', 2, 5]],
  torso: [['Vitalité', 3, 6], ['Défense', 3, 6], ['Bouclier de début de combat', 2, 5], ['Régénération', 1, 3], ['Ténacité', 3, 6], ['Résistance au ralentissement', 4, 8]],
  hands: [['Cadence', 2, 4], ['Critique', 2, 4], ['Dégâts physiques', 2, 4], ['Dégâts de Foudre', 2, 4], ['Pénétration', 2, 5], ['Dégâts critiques', 4, 9]],
  legs: [['Vitalité', 3, 6], ['Résistance au ralentissement', 4, 8], ['Défense', 2, 5], ['Dégâts de Givre', 2, 4], ['Ténacité', 3, 6], ['Régénération', 1, 3]],
  feet: [['Cadence', 2, 4], ['Résistance au ralentissement', 4, 8], ['Critique', 1, 3], ['Dégâts de Foudre', 2, 4], ['Vitalité', 3, 6], ['Dégâts de Feu', 2, 4]],
  cape: [['Défense', 2, 5], ['Ténacité', 3, 6], ['Dégâts de Feu', 2, 4], ['Critique', 1, 3], ['Régénération', 1, 3], ['Dégâts de Givre', 2, 4]],
  belt: [['Vitalité', 3, 6], ['Cadence', 2, 4], ['Dégâts physiques', 2, 4], ['Bouclier de début de combat', 2, 5], ['Défense', 2, 5], ['Régénération', 1, 3]],
  necklace: [['Critique', 2, 5], ['Dégâts critiques', 4, 9], ['Régénération', 1, 3], ['Ténacité', 3, 6], ['Vitalité', 3, 6], ['Cadence', 2, 4]],
  ring: [['Critique', 2, 4], ['Cadence', 2, 4], ['Dégâts de Feu', 2, 4], ['Dégâts de Givre', 2, 4], ['Dégâts de Foudre', 2, 4], ['Pénétration', 2, 5]],
  weapon: [['Dégâts critiques', 4, 9], ['Cadence', 2, 4], ['Pénétration', 2, 5], ['Dégâts de l\'élément de l\'arme', 3, 6], ['Critique', 2, 4], ['Dégâts physiques', 2, 4]],
};

const WEAPON_NAMES = {"hammer":["Marteau de chantier","Cogne-tout","Faiseur de silences","Le Marteau des griefs"],"sword_shield":["Épée et rondache de garde","Épée du Mur de fer","Serment et Rempart","Rondache du Dernier Carré"],"axe":["Hache de bûcheron-soldat","Fend-crâne","Hache des Veillées rouges","Mâchoire de Vorn"],"longbow":["Arc de chasse","Arc de la Haie vive","Sifflerelle","Arc des Ronceraies"],"crossbow":["Arbalète de rempart","Claque-neuf","Arbalète du Percepteur","Le Verdict"],"daggers":["Couteaux de poche","Dagues du Chat maigre","Dagues de la Pie-grièche","Les Jumelles muettes"],"staff":["Bâton de marche runique","Bâton de l'Encrier","Éclat d'orage têtu","Plume de Foudre"],"scepter":["Sceptre de notaire","Sceptre fêlé","Sceptre du Sceau brisé","Le Dernier Décret"],"grimoire":["Carnet de runes","Grimoire des marges","Le Recueil des brouillons","Livre-qui-murmure"]};
const WEAPONS = [
  { id: 'hammer', name: 'Marteau de guerre', cls: 'forgefire', speed: 'lent', stats: { power: 1.35, haste: 0.6, crit: 0.4 }, mat: ['de bronze', 'de fer', 'd\'acier'] },
  { id: 'sword_shield', name: 'Épée et bouclier', cls: 'forgefire', speed: 'équilibré', stats: { power: 0.9, defense: 0.8, haste: 0.7 }, mat: ['de bronze', 'de fer', 'd\'acier'] },
  { id: 'axe', name: 'Hache à deux mains', cls: 'forgefire', speed: 'rapide', stats: { power: 1.1, haste: 1.0, crit: 0.6 }, mat: ['de bronze', 'de fer', 'd\'acier'] },
  { id: 'longbow', name: 'Arc long', cls: 'tracker', speed: 'précis', stats: { power: 1.1, crit: 1.0, haste: 0.6 }, mat: ['de frêne', 'd\'if', 'de bois de lune'] },
  { id: 'crossbow', name: 'Arbalète', cls: 'tracker', speed: 'lourd', stats: { power: 1.35, haste: 0.5, crit: 0.5 }, mat: ['de frêne', 'd\'if', 'de bois de lune'] },
  { id: 'daggers', name: 'Dagues jumelles', cls: 'tracker', speed: 'rapide', stats: { power: 0.8, haste: 1.3, crit: 0.9 }, mat: ['de bronze', 'de fer', 'd\'acier'] },
  { id: 'staff', name: 'Bâton runique', cls: 'runist', speed: 'puissant', stats: { power: 1.3, vitality: 0.5, crit: 0.4 }, mat: ['de frêne', 'd\'if', 'de bois de lune'] },
  { id: 'scepter', name: 'Sceptre', cls: 'runist', speed: 'rapide', stats: { power: 0.9, haste: 1.1, crit: 0.8 }, mat: ['de bronze', 'd\'argent', 'd\'orichalque'] },
  { id: 'grimoire', name: 'Grimoire', cls: 'runist', speed: 'soutien', stats: { power: 0.8, vitality: 0.9, tenacity: 0.6 }, mat: ['de toile', 'de lin', 'de soie'] },
];

const RARITY_IDS = ['common', 'rare', 'epic', 'legendary'];
const PLACES = ['des Murmures', 'de Maldefer', 'des cimes'];
function clothingName(fam, slotId, rar, ri, oi, ti) {
  if (rar === 'legendary') return fam.legendNames[slotId].replace('{p}', PLACES[ti]);
  if (rar === 'epic') return `${fam.slotNames[slotId]} ${fam.epicNames[oi]}`;
  return `${fam.slotNames[slotId]} ${fam.names[ri * 2 + oi]}`;
}
const SOURCE_BY_RARITY = { common: ['craft', 'loot'], rare: ['craft', 'loot', 'plan'], epic: ['craft', 'loot', 'plan'], legendary: ['dungeon', 'plan'] };

const round = (n) => Math.max(1, Math.round(n));

function statLine(base, slotW, shares, famBias, rarityMult, count) {
  const entries = Object.entries(shares)
    .map(([stat, share]) => [stat, base * slotW * share * (famBias[stat] ?? 1) * rarityMult])
    .sort((a, b) => b[1] - a[1])
    .slice(0, count);
  return entries.map(([stat, v]) => ({ stat, value: round(v) }));
}

const lineRange = (slot, tierIndex) => VARIABLE_LINES[slot].map(([name, lo, hi]) => ({ name, min: +(lo * (1 + tierIndex * 0.45)).toFixed(1), max: +(hi * (1 + tierIndex * 0.45)).toFixed(1) }));

const items = [];
let seq = 0;
const add = (it) => {
  const r = RARITIES.find((x) => x.id === it.rarity);
  const tool = it.kind === 'tool';
  items.push({ id: `i${++seq}`, ...it, stats: tool ? it.stats : it.stats.slice(0, r.stats), rolls: tool ? undefined : (it.rolls ?? r.rolls) });
};

/** Chef-d'œuvre [Proposé par Claude, à valider] : tirage séparé à la fabrication seulement, jamais par retouche. */
export const MASTERPIECE = { chance: [0.02, 0.05], dailyCap: 1, linesChosen: true, linesAtMax: true, bonusLine: true, stockCeiling: 0.03 };

// --- Vêtements : par famille, emplacement, palier ; deux modèles Communs et deux Rares (protecteur, offensif) ---
for (const fam of FAMILIES) {
  for (const slot of SLOTS.filter((s) => s.kind === 'clothing')) {
    TIERS.forEach((level, ti) => {
      RARITY_IDS.forEach((rar, ri) => {
        ['protective', 'offensive'].forEach((orient, oi) => {
          if (rar === 'legendary' && oi !== slot.id.length % 2) return; // un seul modèle légendaire par emplacement
          const rarity = RARITIES.find((r) => r.id === rar);
          add({
            name: clothingName(fam, slot.id, rar, ri, oi, ti),
            kind: 'clothing',
            slot: slot.id,
            family: fam.id,
            classes: fam.classes,
            tier: level,
            rarity: rar,
            orientation: orient,
            material: fam.material[ti],
            stats: statLine(basePoints(level), slot.w, SHARES[orient], fam.bias, rarity.mult, rarity.stats),
            lines: lineRange(slot.id, ti),
            socket: rarity.socket,
            source: SOURCE_BY_RARITY[rar],
          });
        });
      });
    });
  }
}

// --- Bijoux : universels ---
const JEWEL = {
  ring: [['du Joueur de dés', 'offensive', { crit: 1, power: 0.6 }], ['du Veilleur têtu', 'protective', { defense: 0.8, tenacity: 0.8 }], ['du Serment brisé', 'offensive', { power: 1, haste: 0.7 }], ['de la Dernière Marée', 'protective', { vitality: 1, tenacity: 0.6 }]],
  necklace: [['du Pèlerin', 'protective', { vitality: 1, tenacity: 0.7 }], ['de l\'Aube rousse', 'offensive', { power: 1, crit: 0.8 }], ['du Sceau tenu', 'protective', { defense: 1, vitality: 0.7 }], ['de la Tempête captive', 'offensive', { crit: 1, haste: 0.8 }]],
};
const JEWEL_MAT = ['d\'étain', 'd\'argent', 'd\'or'];
for (const [slotId, models] of Object.entries(JEWEL)) {
  const slot = SLOTS.find((s) => s.id === slotId);
  TIERS.forEach((level, ti) => {
    models.forEach(([n, orient, shares], mi) => {
      const rar = RARITY_IDS[mi];
      const rarity = RARITIES.find((r) => r.id === rar);
      add({
        name: `${slotId === 'ring' ? 'Anneau' : 'Collier'} ${n}`,
        kind: 'jewel',
        slot: slotId,
        family: 'jewel',
        classes: ['forgefire', 'tracker', 'runist'],
        tier: level,
        rarity: rar,
        orientation: orient,
        material: JEWEL_MAT[ti],
        stats: statLine(basePoints(level), slot.w, shares, {}, rarity.mult, rarity.stats),
        lines: lineRange(slotId, ti),
        socket: slotId === 'necklace' ? 'majeur' : rarity.socket,
        source: SOURCE_BY_RARITY[rar],
      });
    });
  });
}

// --- Armes : par classe, deux modèles par catégorie et palier (Commun, Rare) ---
for (const w of WEAPONS) {
  const slot = SLOTS.find((s) => s.id === 'weapon');
  TIERS.forEach((level, ti) => {
    RARITY_IDS.forEach((rar) => {
      const rarity = RARITIES.find((r) => r.id === rar);
      add({
        name: `${WEAPON_NAMES[w.id][RARITY_IDS.indexOf(rar)]}${rar === 'common' || rar === 'rare' ? ' ' + w.mat[ti] : ''}`,
        kind: 'weapon',
        slot: 'weapon',
        family: w.id,
        classes: [w.cls],
        tier: level,
        rarity: rar,
        orientation: 'offensive',
        material: w.mat[ti],
        stats: statLine(basePoints(level), slot.w, w.stats, {}, rarity.mult, rarity.stats),
        weaponSpeed: w.speed,
        lines: lineRange('weapon', ti),
        socket: 'majeur',
        source: SOURCE_BY_RARITY[rar],
      });
    });
  });
}

// --- Ensembles (palier 20) ---
const clothing = (famId, slotId) => FAMILIES.find((f) => f.id === famId).slotNames[slotId];
export const SETS = [
  {
    id: 'cendres',
    name: 'Cendres persistantes',
    cls: 'forgefire',
    family: 'armor',
    theme: 'Brûlures qui se propagent entre les ennemis',
    event: false,
    pieces: [['head', 'Couronne de charbon'], ['torso', 'Harnais de la Ville qui brûle'], ['hands', 'Gantelets de l\'incendiaire poli'], ['legs', 'Jambières du dernier pas chaud']],
    bonuses: ['Les brûlures durent 25 % plus longtemps.', '+15 % de dégâts contre une cible qui brûle.', 'À la mort d\'une cible brûlée, la brûlure passe à un ennemi proche (délai 4 s).'],
    note: 'Le 4 pièces brille contre les groupes ; contre un boss seul, un assemblage à 3 pièces peut être préférable.',
  },
  {
    id: 'enclume',
    name: 'L\'Enclume patiente',
    cls: 'forgefire',
    family: 'armor',
    theme: 'Protections et ripostes',
    event: false,
    pieces: [['torso', 'Cuirasse de la longue patience'], ['legs', 'Jambières du Têtu de fer'], ['feet', 'Solerets qui ne reculent pas'], ['belt', 'Ceinturon du contremaître sourd']],
    bonuses: ['+10 % de Défense.', 'Chaque coup reçu charge un bouclier (jusqu\'à 20 % de la Vitalité).', 'Quand le bouclier se brise, une riposte frappe l\'attaquant.'],
    note: 'Endurance et boss qui frappent fort.',
  },
  {
    id: 'empreinte',
    name: 'La Dernière empreinte',
    cls: 'tracker',
    family: 'trail',
    theme: 'Marquage et cible unique',
    event: false,
    pieces: [['head', 'Capuche de la Dernière empreinte'], ['torso', 'Veste du Pisteur sans retour'], ['hands', 'Gants du Tireur patient'], ['cape', 'Cape de l\'affût perpétuel']],
    bonuses: ['+10 % de critique sur une cible marquée.', 'La marque dure 50 % plus longtemps.', 'Le premier tir sur une cible marquée frappe deux fois.'],
    note: 'Pensé pour les cibles uniques et les boss.',
  },
  {
    id: 'ronces',
    name: 'Ronces vives',
    cls: 'tracker',
    family: 'cuirass',
    theme: 'Ralentissements et groupes',
    event: false,
    pieces: [['head', 'Cervelière de la Louve des ronces'], ['torso', 'Pourpoint des Ronces cousues'], ['legs', 'Chausses du Braconnier pardonné'], ['feet', 'Bottes de la Lisière noire']],
    bonuses: ['Les ralentissements durent 20 % plus longtemps.', 'Les ennemis ralentis subissent 10 % de dégâts en plus.', 'Toutes les 6 s, les ennemis proches de la cible sont ralentis.'],
    note: 'Efficace contre les groupes.',
  },
  {
    id: 'orage',
    name: 'L\'Orage contenu',
    cls: 'runist',
    family: 'robe',
    theme: 'Dégâts directs et critiques',
    event: false,
    pieces: [['head', 'Capuchon de l\'Orage qui dort'], ['torso', 'Robe de l\'Orage contenu'], ['hands', 'Mitaines d\'étincelles volées'], ['cape', 'Mantelet des Éclairs en cage']],
    bonuses: ['+12 % de dégâts critiques.', 'Chaque critique charge un point de Surtension (5 au maximum).', 'À 5 points, le prochain sort frappe un second ennemi à pleine puissance.'],
    note: 'Fonctionne avec n\'importe quel élément : le nom est un thème, pas un verrou.',
  },
  {
    id: 'sceau',
    name: 'Veilleurs du sceau',
    cls: 'runist',
    family: 'robe',
    theme: 'Boucliers et soutien',
    event: false,
    pieces: [['head', 'Capuchon du Veilleur d\'encre'], ['torso', 'Robe des Veilleurs'], ['feet', 'Chaussons du Sceau tenu'], ['belt', 'Cordon des Sceaux jurés']],
    bonuses: ['+10 % de puissance des boucliers.', 'Un bouclier qui expire soigne légèrement.', 'Au début du combat, un sceau protège l\'allié le plus fragile.'],
    note: 'Soutien et endurance.',
  },
  {
    id: 'givre',
    name: 'Givre des cimes',
    cls: 'runist',
    family: 'trail',
    theme: 'Ralentissement et sécurité',
    event: true,
    pieces: [['head', 'Capuche des Cimes muettes'], ['torso', 'Manteau de la Wyverne'], ['hands', 'Gants du Froid têtu'], ['feet', 'Bottes de neige creuse']],
    bonuses: ['+10 % de résistance au ralentissement.', 'Les ennemis ralentis ont 10 % de chances de gelures.', 'Le ralentissement le plus fort du combat gèle brièvement la cible.'],
    note: 'Ensemble d\'événement (la Wyverne des cimes) : jamais indispensable, rerun chaque année.',
  },
];

for (const set of SETS) {
  const fam = FAMILIES.find((f) => f.id === set.family);
  for (const [slotId, name] of set.pieces) {
    const slot = SLOTS.find((s) => s.id === slotId);
    const orient = set.id === 'enclume' || set.id === 'sceau' || set.id === 'givre' ? 'protective' : 'offensive';
    add({
      name,
      kind: 'clothing',
      slot: slotId,
      family: set.family,
      classes: fam.classes,
      tier: 20,
      rarity: 'epic',
      orientation: orient,
      material: fam.material[2],
      stats: statLine(basePoints(20), slot.w, SHARES[orient], fam.bias, RARITIES[2].mult, 3),
      lines: lineRange(slotId, 2),
      socket: 'oui',
      set: set.id,
      source: set.event ? ['event', 'craft'] : ['dungeon', 'craft'],
    });
  }
}

// --- Pièces nommées (illustratives) ---
const named = [
  { name: 'Feu sourd', kind: 'weapon', slot: 'weapon', family: 'hammer', classes: ['forgefire'], tier: 20, rarity: 'legendary', orientation: 'offensive', material: 'd\'acier', conditional: 'Les brûlures infligées par ses coups durent 40 % plus longtemps et se cumulent une fois de plus.', stats: [{ stat: 'power', value: 190 }, { stat: 'crit', value: 55 }, { stat: 'haste', value: 30 }, { stat: 'vitality', value: 34 }], socket: 'majeur', source: ['dungeon'] },
  { name: 'Arc de la Dernière flèche', kind: 'weapon', slot: 'weapon', family: 'longbow', classes: ['tracker'], tier: 20, rarity: 'legendary', orientation: 'offensive', material: 'de bois de lune', conditional: 'Le dernier tir d\'un combat contre une cible marquée inflige le double de dégâts.', stats: [{ stat: 'power', value: 170 }, { stat: 'crit', value: 90 }, { stat: 'haste', value: 24 }, { stat: 'tenacity', value: 20 }], socket: 'majeur', source: ['dungeon'] },
  { name: 'Le Paratonnerre', kind: 'weapon', slot: 'weapon', family: 'staff', classes: ['runist'], tier: 20, rarity: 'legendary', orientation: 'offensive', material: 'd\'orichalque', conditional: 'Les sorts critiques de Foudre frappent un second ennemi à moitié de puissance.', stats: [{ stat: 'power', value: 200 }, { stat: 'crit', value: 60 }, { stat: 'vitality', value: 40 }, { stat: 'haste', value: 26 }], socket: 'majeur', source: ['dungeon'] },
  { name: 'Anneau de l\'Étincelle', kind: 'jewel', slot: 'ring', family: 'jewel', classes: ['forgefire', 'tracker', 'runist'], tier: 20, rarity: 'epic', orientation: 'offensive', material: 'd\'or', stats: [{ stat: 'crit', value: 62 }, { stat: 'power', value: 38 }, { stat: 'haste', value: 22 }], socket: 'oui', source: ['dungeon', 'craft'] },
  { name: 'Cuirasse du Mur vivant', kind: 'clothing', slot: 'torso', family: 'armor', classes: ['forgefire'], tier: 20, rarity: 'legendary', orientation: 'protective', material: 'd\'acier', conditional: 'Un bouclier se forme au début de chaque combat et dure tant que vous êtes au-dessus de 50 % de vie.', stats: [{ stat: 'defense', value: 210 }, { stat: 'vitality', value: 150 }, { stat: 'tenacity', value: 70 }, { stat: 'power', value: 28 }], socket: 'majeur', source: ['dungeon'] },
  { name: 'Tunique de l\'Aube', kind: 'clothing', slot: 'torso', family: 'robe', classes: ['runist'], tier: 20, rarity: 'epic', orientation: 'offensive', material: 'de soie', stats: [{ stat: 'power', value: 160 }, { stat: 'crit', value: 76 }, { stat: 'vitality', value: 70 }], socket: 'majeur', source: ['craft', 'plan'], masterpieceExample: true },
];
for (const n of named) add({ lines: lineRange(n.slot, 2), named: true, ...n });

// --- Set de départ : quelques pièces Communes de palier 1, presque sans valeur, données une fois par classe et liées au personnage ---
const STARTER = {
  forgefire: { family: 'armor', stat: 'defense', names: { head: 'Calot de recrue', torso: 'Gilet de toile rapiécé', legs: 'Braies de recrue', feet: 'Sabots de bois' }, weapon: ['hammer', 'Maillet ébréché'] },
  tracker: { family: 'trail', stat: 'vitality', names: { head: 'Capuchon de chiffon', torso: 'Gilet de peau mal tannée', legs: 'Chausses de toile', feet: 'Bottes de paille tressée' }, weapon: ['longbow', 'Arc de fortune'] },
  runist: { family: 'robe', stat: 'vitality', names: { head: 'Bonnet de laine', torso: 'Robe rapiécée', legs: 'Jupe de toile', feet: 'Chaussons de feutre' }, weapon: ['staff', 'Bâton de berger'] },
};
const STARTER_VALUE = { head: 3, torso: 6, legs: 4, feet: 3 };
for (const [cls, s] of Object.entries(STARTER)) {
  for (const [slot, name] of Object.entries(s.names)) {
    add({ name, kind: 'clothing', slot, family: s.family, classes: [cls], tier: 1, rarity: 'common', orientation: 'protective', material: 'de fortune', stats: [{ stat: s.stat, value: STARTER_VALUE[slot] }], rolls: [0, 0], socket: 'aucun', source: ['start'], starter: true, bound: true, named: true });
  }
  add({ name: s.weapon[1], kind: 'weapon', slot: 'weapon', family: s.weapon[0], classes: [cls], tier: 1, rarity: 'common', orientation: 'offensive', material: 'de fortune', stats: [{ stat: 'power', value: 5 }], rolls: [0, 0], socket: 'aucun', source: ['start'], starter: true, bound: true, named: true });
}

// --- Outils et équipements de métier (exemples) ---
const tools = [
  { name: 'Pioche de Veine franche', profession: 'Minage', tier: 20, rarity: 'epic', stats: ['+trouvailles et sous-produits', '+4 % de vitesse'], socket: 'métier' },
  { name: 'Tablier de l\'Atelier économe', profession: 'Artisanat', tier: 20, rarity: 'epic', stats: ['−8 % d\'ingrédients consommés', 'séries longues : +3 % de vitesse'], socket: 'métier' },
  { name: 'Canne de l\'Embarcadère', profession: 'Pêche', tier: 10, rarity: 'rare', stats: ['+5 % de vitesse', 'chance de prise rare'], socket: 'métier' },
  { name: 'Serpe de rosée', profession: 'Herboristerie', tier: 10, rarity: 'rare', stats: ['+5 % de vitesse', 'sous-produit : graines'], socket: 'mineur' },
  { name: 'Hache de scierie', profession: 'Bûcheronnage', tier: 10, rarity: 'common', stats: ['+10 % de vitesse'], socket: 'aucun' },
  { name: 'Marteau de précision', profession: 'Forge', tier: 20, rarity: 'rare', stats: ['+10 % de vitesse', 'chance d\'exemplaire Chef-d\'œuvre accrue'], socket: 'métier' },
];
for (const t of tools) add({ kind: 'tool', slot: 'tool', family: 'tool', classes: [], named: true, material: '', orientation: 'protective', lines: [], source: ['craft', 'loot'], ...t });

export const ITEMS = items;

// --- Gemmes de talent (majeures) ---
export const GEM_FAMILIES = [
  { id: 'burn', name: 'Brasier', color: 'var(--ge-fire)', idea: 'Brûlures qui se propagent' },
  { id: 'mark', name: 'Chasse marquée', color: 'var(--ge-mark)', idea: 'Une cible, des critiques' },
  { id: 'bulwark', name: 'Rempart', color: 'var(--ge-shield)', idea: 'Boucliers et ripostes' },
  { id: 'storm', name: 'Orage', color: 'var(--ge-storm)', idea: 'Critiques en chaîne' },
  { id: 'frost', name: 'Givre', color: 'var(--ge-frost)', idea: 'Contrôle et sécurité' },
  { id: 'bleed', name: 'Saignement', color: 'var(--ge-bleed)', idea: 'Dégâts sur la durée' },
  { id: 'tempo', name: 'Cadence', color: 'var(--ge-tempo)', idea: 'Beaucoup de petits coups' },
  { id: 'support', name: 'Soutien', color: 'var(--ge-support)', idea: 'Durer et protéger' },
  { id: 'trade', name: 'Métier', color: 'var(--ge-trade)', idea: 'Récolte et artisanat' },
];

// {v} est remplacé par la valeur du palier et du rang ; {r} est la clause supplémentaire des rangs Rare et au-delà.
export const GEMS = [
  { id: 'g1', name: 'Cendre vive', fam: 'burn', trigger: 'Sur coup direct', effect: 'Applique Brûlure ({v} % des dégâts sur 4 s).', icd: '3 s', rider: 'La brûlure peut se cumuler une fois de plus.', base: 20 },
  { id: 'g2', name: 'Mort en flammes', fam: 'burn', trigger: 'Sur mort d\'une cible brûlée', effect: 'La brûlure passe à un ennemi proche et inflige {v} % de dégâts immédiats.', icd: '4 s', rider: 'Touche aussi un deuxième ennemi.', base: 30 },
  { id: 'g3', name: 'Fournaise', fam: 'burn', trigger: 'Contre une cible brûlée', effect: '+{v} % de dégâts.', icd: '—', rider: 'S\'ajoute aux critiques sur cible brûlée.', base: 10 },
  { id: 'g4', name: 'Œil du chasseur', fam: 'mark', trigger: 'Première attaque du combat', effect: 'Marque la cible : +{v} % de dégâts subis pendant 12 s.', icd: 'une fois par cible', rider: 'La marque se renouvelle sur un critique.', base: 8 },
  { id: 'g5', name: 'Dernière empreinte', fam: 'mark', trigger: 'Critique sur cible marquée', effect: '+{v} % de dégâts critiques pendant 6 s.', icd: '6 s', rider: 'Les critiques suivants prolongent l\'effet.', base: 20 },
  { id: 'g6', name: 'Bastion', fam: 'bulwark', trigger: 'Début de combat', effect: 'Un bouclier de {v} % de la Vitalité.', icd: '—', rider: 'Se reforme à 30 % de vie.', base: 12 },
  { id: 'g7', name: 'Choc de rappel', fam: 'bulwark', trigger: 'Quand un bouclier se brise', effect: 'Étourdit l\'attaquant 1 s et lui inflige {v} % de dégâts.', icd: '8 s', rider: 'Étourdit aussi un ennemi proche.', base: 40 },
  { id: 'g8', name: 'Paratonnerre', fam: 'storm', trigger: 'Sur critique', effect: 'Frappe un second ennemi pour {v} % des dégâts.', icd: '2 s', rider: 'Le second ennemi est ralenti.', base: 50 },
  { id: 'g9', name: 'Surtension', fam: 'storm', trigger: 'Sur critique', effect: 'Gagne 1 Charge (5 max). À 5 Charges, le prochain sort inflige +{v} %.', icd: '—', rider: 'Les Charges ne se perdent plus entre deux combats d\'un donjon.', base: 60 },
  { id: 'g10', name: 'Souffle polaire', fam: 'frost', trigger: 'Toutes les 8 s', effect: 'Ralentit la cible la plus dangereuse de {v} % pendant 4 s.', icd: '8 s', rider: 'Ralentit aussi la cible suivante.', base: 25 },
  { id: 'g11', name: 'Glace-miroir', fam: 'frost', trigger: 'Contre une cible ralentie', effect: 'Elle subit {v} % de dégâts en plus.', icd: '—', rider: 'Un ralentissement renouvelé prolonge l\'effet.', base: 10 },
  { id: 'g12', name: 'Plaie ouverte', fam: 'bleed', trigger: 'Sur coup', effect: 'Applique Saignement ({v} % des dégâts sur 5 s), cumulable 3 fois.', icd: '2 s', rider: 'Un cumul supplémentaire.', base: 18 },
  { id: 'g13', name: 'Hémorragie', fam: 'bleed', trigger: 'Sur critique', effect: 'Convertit les Saignements en dégâts immédiats : {v} % de ce qui reste.', icd: '10 s', rider: 'Le Saignement reprend ensuite.', base: 70 },
  { id: 'g14', name: 'Fièvre de combat', fam: 'tempo', trigger: 'Sur coup', effect: '+{v} % de Cadence (5 cumuls, 6 s).', icd: '—', rider: 'Le sixième cumul accorde une attaque gratuite.', base: 3 },
  { id: 'g15', name: 'Rythme', fam: 'tempo', trigger: 'Chaque cinquième coup', effect: 'Inflige {v} % de dégâts supplémentaires à la cible.', icd: '—', rider: 'Touche deux ennemis.', base: 35 },
  { id: 'g16', name: 'Régénération du veilleur', fam: 'support', trigger: 'Toutes les 5 s', effect: 'Soigne {v} % de la Vitalité manquante.', icd: '5 s', rider: 'Soigne aussi l\'allié le plus fragile.', base: 4 },
  { id: 'g17', name: 'Sceau protecteur', fam: 'support', trigger: 'Début de combat', effect: 'Protège l\'allié le plus fragile (bouclier de {v} % de sa Vitalité).', icd: '—', rider: 'Se renouvelle une fois à mi-combat.', base: 10 },
  { id: 'g18', name: 'Veine franche', fam: 'trade', trigger: 'Récolte (minerais)', effect: '+{v} % de chances de trouvailles et de sous-produits.', icd: '—', rider: 'Les trouvailles sont d\'un rang plus rare.', base: 4 },
  { id: 'g19', name: 'Atelier économe', fam: 'trade', trigger: 'Fabrication', effect: '{v} % de chances de ne consommer aucun ingrédient.', icd: '—', rider: 'Les séries longues augmentent la chance.', base: 3 },
];

export const MINOR_GEMS = [
  { name: 'Rubis', stat: 'Puissance', base: 6 },
  { name: 'Saphir', stat: 'Vitalité', base: 8 },
  { name: 'Topaze', stat: 'Critique', base: 4 },
  { name: 'Améthyste', stat: 'Cadence', base: 4 },
  { name: 'Onyx', stat: 'Défense', base: 7 },
  { name: 'Émeraude', stat: 'Ténacité', base: 6 },
];

export const GEM_RANKS = [
  { id: 'common', name: 'Commun', mult: 1.0, rider: false },
  { id: 'rare', name: 'Rare', mult: 1.15, rider: true },
  { id: 'epic', name: 'Épique', mult: 1.3, rider: true },
  { id: 'legendary', name: 'Légendaire', mult: 1.5, rider: true },
];
export const GEM_TIER_SCALE = { 1: 1, 10: 1.6, 20: 2.2 };

// --- Sources de butin ---
export const SOURCES = [
  { id: 's1', name: 'Clairière des Murmures', tier: 1, kind: 'Région et boss', boss: 'Le Loup-garou des fourrés', blurb: 'Première région de combat : peu de risques, beaucoup d\'objets de départ.' },
  { id: 's2', name: 'Fosses de Maldefer', tier: 10, kind: 'Donjon', boss: 'Le Golem de schiste', blurb: 'Des galeries à plusieurs rencontres : un boss unique, puis un groupe.' },
  { id: 's3', name: 'Falaises du Givre', tier: 20, kind: 'Donjon', boss: 'La Wyverne des cimes', blurb: 'Un boss qui se soigne et des renforts : cible unique et groupes comptent.' },
];

export const DROP_WINDOW = [
  { label: 'Palier de la région', share: 0.7 },
  { label: 'Palier précédent', share: 0.2 },
  { label: 'Palier suivant (à convoiter)', share: 0.1 },
];

export const PROFILES = [
  { id: 'fighter', name: 'Combattant', goal: 'Donjons, boss, ensembles, builds', gets: 'Équipement fini, composants, plans, gemmes, fragments.' },
  { id: 'gatherer', name: 'Récolteur', goal: 'Rendement, trouvailles, économie', gets: 'Outils et tenues de métier, gemmes de métier, ressources rares de région.' },
  { id: 'crafter', name: 'Artisan', goal: 'Séries, signature, chefs-d\'œuvre', gets: 'Plans, composants de boss, commandes, reforges ; équipe les combattants sans combattre.' },
];

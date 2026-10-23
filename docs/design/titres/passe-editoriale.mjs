// Passe éditoriale des titres, surnoms et commandes de maître (24 octobre 2026, demande de Louis).
// Lit data/trials.yaml, applique les corrections de texte (EDITS), ajoute les commandes du palier 90 (NEW90) et réécrit
// le fichier, maître par maître, dans l'ordre de data/professions.yaml. Ne touche ni aux identifiants, ni aux niveaux,
// ni aux quantités, ni aux récompenses des commandes existantes.
// Usage : node docs/design/titres/passe-editoriale.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const require = createRequire(join(root, 'packages', 'shared', 'package.json'));
const YAML = require('yaml');

const trials = YAML.parse(readFileSync(join(root, 'data', 'trials.yaml'), 'utf8'));
const professions = YAML.parse(readFileSync(join(root, 'data', 'professions.yaml'), 'utf8'));

// --- Corrections des commandes existantes (seuls les champs cités changent). ---
const EDITS = {
  // Minage : « Gratteur » répétait le surnom de départ (Gratte-sol) ; trois « Chuchoteur » dans le jeu ; pas de nains à Bramo.
  mining_20: { nickname: 'Casse-cailloux' },
  mining_40: { nickname: 'Oreille des filons' },
  mining_60: { nickname: 'Étai des galeries' },
  mining_80: {
    name: 'Les vieux de la Taupinière',
    nickname: 'Salué par la Taupinière',
    intro: '« Les vieux de la Taupinière ne saluent personne. Rapporte-moi de l’azurite et du sombracier, et on verra. »',
    outro: 'Le plus vieux de la Taupinière a levé son verre sur ton passage. Il ne l’avait pas levé depuis la Marée. Le bourg en parle encore, à voix basse.',
  },

  // Bûcheronnage : « Chuchoteur » ; « à lui tout seul » ne va qu'aux joueurs ; deux « Chez elle, c'est une médaille ».
  woodcutting_20: { outro: 'Aldra a compté les bûches trois fois, puis t’a offert un morceau d’écorce, le plus beau du tas. Elle n’en donne jamais.' },
  woodcutting_60: { nickname: 'Beau-parleur des chênes' },
  woodcutting_99: {
    name: 'Toute une forêt, ou presque',
    nickname: 'La Forêt qui marche',
    intro: '« Je n’ai plus rien à t’apprendre, alors je te demande tout : une forêt, ou presque. Je ne demande pas où tu la caches. »',
  },

  // Herboristerie : le troisième « Chuchoteur » ; le surnom vient enfin de l'histoire (trois heures à reculons).
  herbalism_60: { nickname: 'Cueille-à-reculons' },

  // Pêche : « Lanceur » répétait le surnom de départ ; « Veilleur » et « lanternes » partout ; « Seigneur » générique.
  fishing_20: { nickname: 'Taiseux de la baie' },
  fishing_60: { name: 'Les poissons qui s’allument', nickname: 'Noctambule des quais' },
  fishing_80: { nickname: 'Berger de la houle' },

  // Forge : Brunhild est une maîtresse ; « Semeur » appartient à l'Agriculture ; « Gardien de » ; pas de roi à Bramo.
  smithing_40: { name: 'L’épée artistique', nickname: 'Pluie d’étincelles' },
  smithing_60: { name: 'Le feu qui reconnaît', nickname: 'Le Feu sacré' },
  smithing_80: {
    name: 'Le marteau du capitaine',
    // Le Bastion des longues veilles est une forteresse abandonnée des Lointains : pas de capitaine, c'est la garde du bourg.
    nickname: 'Créancier du capitaine',
    intro: '« Le capitaine de la garde passe demain et il veut un marteau. Il n’a pas dit lequel. »',
    outro: 'Le capitaine a emporté le marteau, laissé son manteau et oublié de payer. Brunhild affirme que c’est un honneur.',
  },
  smithing_99: { intro: '« Fais-moi un ouvrage qui survivra à la forge. Et à moi. »' },

  // Menuiserie : « Chuchoteur » ; trois « de légende » ; le chantage des poutres méritait son jeu de mots.
  carpentry_60: { nickname: 'Maître chanteur des poutres' },
  carpentry_80: { nickname: 'Mille-Ans' },
  carpentry_99: { intro: '« De la sciure, encore. Toute celle du monde, si possible, et qu’on en parle encore quand elle sera balayée. »' },

  // Cuisine : « Terreur » doublait l'Herboristerie ; pas de roi ; « Gourmet de légende » trop banal pour un 99.
  cooking_60: { nickname: 'Corne d’abondance' },
  cooking_80: {
    name: 'Le jury du Concours',
    nickname: 'Coupe-sifflet',
    intro: '« Le jury du Concours des Maîtres goûte de tout et n’aime rien. Fais-les taire. Par la bouche. »',
    outro: 'Le jury n’a rien dit de tout le repas. Pour la première fois, il a oublié de noter. Bertin a fait encadrer la feuille blanche.',
  },
  cooking_99: {
    nickname: 'Table ouverte',
    intro: '« Un festin dont on se souviendra, ou dont on sera trop plein pour oublier. Je n’ai plus rien d’autre à te demander. »',
  },

  // Chasse : « Traqueur » est une classe ; « Fléau des » ; « Chasseur de l'ours » plat ; « Seigneur des battues » générique.
  hunting_20: { nickname: 'Liseur de traces' },
  hunting_40: { nickname: 'Sommeil des bergers' },
  hunting_60: { nickname: 'Patte-d’Ours' },
  hunting_80: { outro: 'Brenna a tendu les peaux devant le feu et, pour la première fois, elle n’a pas sifflé. Elle admirait.' },
  hunting_99: { nickname: 'L’Arc de Brenna' },

  // Agriculture : « Maître des récoltes » et « Maître des moissons » presque jumeaux ; « Semeur » deux fois.
  agriculture_40: {
    nickname: 'Récolteur de nuages',
    outro: 'Les balles de coton s’empilent jusqu’au toit de la grange. Anselme t’a offert la gerbe tressée qu’il accroche d’habitude au-dessus de sa propre porte.',
  },
  agriculture_60: { nickname: 'Le Bleu du Val' },
  agriculture_80: { nickname: 'Grenier plein' },

  // Tannerie : un vocabulaire à elle (l'odeur, le cuir bouilli, la fosse) ; « Cuirassier » prêtait à confusion.
  tanning_20: { nickname: 'Nez bouché' },
  tanning_40: { nickname: 'Cuir-bouilli' },
  tanning_80: { nickname: 'Increvable' },
  // Pas de cavaliers au Bastion (forteresse abandonnée) : ce sont ceux de la garde du bourg.
  tanning_60: {
    nickname: 'Enfin du sérieux',
    name: 'Les selles de la garde',
    intro: '« Les cavaliers de la garde usent leurs selles plus vite que leurs chevaux. Du cuir lourd, et des fourrures pour l’hiver. »',
    outro: 'La garde a renvoyé une selle neuve, avec un mot : « Enfin du sérieux. » Hugon l’a encadré.',
  },

  // Couture : trois surnoms au féminin seulement (Couseuse, Brodeuse, Tisseuse) ; des surnoms qui vont à tous.
  tailoring_20: { nickname: 'Ourlet-de-travers' },
  tailoring_40: { nickname: 'Doigts de fée' },
  // Le Cercle des runes (et pas un « chapitre ») : le même nom partout.
  tailoring_60: {
    nickname: 'Aiguille d’argent',
    name: 'Les robes du Cercle',
    intro: '« Le Cercle des runes veut des robes neuves, et du coton pour les doublures. Des coutures qui ne bâillent pas. »',
  },
  tailoring_80: { nickname: 'Voile-Bleue' },

  // Alchimie : deux « Distillateur » ; « du bourg » cinq fois dans le jeu ; « Alchimiste du bourg », banal pour un 99.
  alchemy_20: { nickname: 'Sourcils roussis' },
  alchemy_40: { nickname: 'Apothicaire de garde' },
  alchemy_80: { nickname: 'Remède de la digue' },
  alchemy_99: {
    name: 'Le remède à presque tout',
    nickname: 'Panacée',
    intro: '« Une saison entière de Marées, sans un blessé de trop. Et de l’huile, pour ceux qui chassent les renforts. Après ça, je ferme boutique, ou je fais semblant. »',
  },

  // Joaillerie : deux « Orfèvre » ; « Garde du trésor » ; « Joyau du bourg » moins fort que sa propre commande.
  jewelcrafting_40: { nickname: 'Fait-dire-oui' },
  jewelcrafting_80: { nickname: 'Brille-trop' },
  jewelcrafting_99: { nickname: 'Couronne sans tête' },

  // Enchantement : deux « Lieur » ; « Mémoire du bourg ».
  enchanting_40: { nickname: 'Ouvre-portes' },
  enchanting_80: { outro: 'Les robes de veille ont tenu trois Marées sans une déchirure. Les veilleurs touchent leur col avant de monter sur la digue ; c’est devenu une superstition.' },
  enchanting_99: { nickname: 'Souvenance' },

  // Artificerie : « Artificier » et « Pyrotechnicien du bourg » redisaient le métier ; « Gardien des phares ».
  artificing_20: { nickname: 'Deux minutes d’avance' },
  artificing_40: { nickname: 'Fusée de garde' },
  artificing_60: { nickname: 'Bouquet final' },
  artificing_80: { nickname: 'Agace-géants' },
  artificing_99: { intro: '« Une machine qui tienne la digue toute seule. Bon. Au moins ses rouages. Après, je n’aurai plus rien à inventer, et ça m’inquiète un peu. »' },

  // Construction : deux « Bâtisseur » ; « Maître d'œuvre », « Maître de la digue » ; trop de noms gravés.
  construction_20: { nickname: 'Fil-à-plomb' },
  construction_40: { nickname: 'Nom sous l’arche' },
  construction_80: { nickname: 'Pierre d’angle' },
  construction_99: {
    nickname: 'Cent Marées',
    outro: 'La digue de pierre se dresse contre la brume. Gautier a posé la dernière pierre lui-même, puis il t’a tendu sa truelle. Il ne l’avait jamais prêtée.',
  },

  // Exploration : « Éclaireur » est une activité du jeu ; « des Lointains » deux fois de suite.
  exploration_40: { nickname: 'Poches pleines' },
  exploration_80: { nickname: 'Rose des vents' },
};

// --- Le palier 90 : une commande par métier. Budget de travail de 9 h (entre 6 h au 80 et 12 h au 99) : les matières
//     du 80 × 1,5 ; 45 000 or (entre 30 000 et 60 000). Il débloque l'ornement du 90 (ornement/manifest.json). ---
const NEW90 = {
  mining: {
    name: 'Les galeries d’avant',
    nickname: 'Lampe du fond',
    intro: '« Sous la mine, il y a d’autres galeries. Personne ne se souvient de les avoir creusées. Descends. Garde ta lampe allumée : la brume y dort. »',
    outro: 'Tu es remonté les poches pleines et avec une pioche qui n’était pas la tienne. Orvald l’a reconnue : c’était celle de son père. Il ne t’a rien demandé d’autre.',
  },
  woodcutting: {
    name: 'Les arbres qui ont vu la Marée',
    nickname: 'La Hache tranquille',
    intro: '« À la Lisière, les arbres ont vu passer la Marée. Ils ne craignent plus rien, surtout pas toi. Coupe sans te presser : ils détestent qu’on se presse. »',
    outro: 'Tu as coupé toute une saison sans jamais forcer. Les arbres se sont laissé faire, par politesse. Aldra dit qu’elle n’avait jamais vu ça, et qu’elle préfère que ça ne se sache pas.',
  },
  herbalism: {
    name: 'Les jardins de la brume',
    nickname: 'Rosée des Lointains',
    intro: '« Il pousse des herbes dans la brume, là où l’on ne voit plus ses pieds. Je n’y vois rien non plus. Toi, on dit que tu les trouves les yeux fermés. »',
    outro: 'Tu as trouvé les herbes à l’odeur, dans une brume à couper au couteau. Ysolde a reniflé ton panier et, pour la première fois, n’a rien trouvé à redire.',
  },
  fishing: {
    name: 'Ce qui mord sous la brume',
    nickname: 'Silence des grands fonds',
    intro: '« Quand la brume touche l’eau, les raies remontent. Elles ne mordent qu’aux pêcheurs qui se taisent. Tu parles trop. Essaie quand même. »',
    outro: 'Tu n’as pas dit un mot de toute la saison. Les raies sont venues d’elles-mêmes. Naël t’a serré la main, longuement, et c’est tout ce qu’il y avait à dire.',
  },
  smithing: {
    name: 'La forge qui s’était tue',
    nickname: 'Rallume-forges',
    intro: '« Là-bas, dans les Forges éteintes, une enclume est froide depuis la Marée. Je veux l’entendre sonner une fois avant de mourir. Pas tout de suite, rassure-toi. »',
    outro: 'La vieille forge a ronflé toute une nuit. Brunhild n’a rien dit ; elle a posé la main sur l’enclume tiède, comme on salue quelqu’un qu’on croyait perdu.',
  },
  carpentry: {
    name: 'L’escalier qui ne mène nulle part',
    nickname: 'Niveau à bulle',
    intro: '« Sur la vieille tour, un escalier monte vers le ciel et s’arrête. La Marée a pris le reste. Je veux qu’il mène quelque part. Droit, je précise. Et des hampes pour la rampe. »',
    outro: 'L’escalier mène maintenant à une petite terrasse d’où l’on voit les Lointains. Joris y a posé son niveau : la bulle est restée au milieu. Il a souri, cette fois, sans se cacher.',
  },
  cooking: {
    name: 'La soupe de grand-mère',
    nickname: 'Goût d’enfance',
    intro: '« Ma grand-mère faisait une soupe. La Marée m’a pris la recette, pas le souvenir du goût. Fais-en des chaudrons entiers, jusqu’à ce que l’un d’eux ait le bon goût. »',
    outro: 'Au quarantième chaudron, Bertin a goûté et s’est assis. Il n’a pas dit que ce n’était pas dégoûtant. Il n’a rien dit du tout, et il s’est resservi trois fois.',
  },
  hunting: {
    name: 'Les traces sans bête',
    nickname: 'Lit-dans-la-brume',
    intro: '« À la Lisière, il y a des traces qui ne mènent à aucune bête. Les autres chasseurs font demi-tour. Pas toi, j’espère. Rapporte des peaux, et ce que tu auras compris. »',
    outro: 'Tu as suivi les traces jusqu’au bord de la brume, et elles ont continué sans toi. Tu n’as rien compris. Brenna dit que c’est le début de la sagesse, et elle a sifflé juste.',
  },
  agriculture: {
    name: 'Les champs salés',
    nickname: 'Blé-sur-sel',
    intro: '« La Marée a laissé du sel dans les champs du bas. Rien n’y pousse, disent-ils. Ils n’ont jamais essayé avec moi. Ni avec toi. »',
    outro: 'Les premiers épis ont poussé, tordus et têtus, dans la terre salée. Anselme en a fait un pain au drôle de goût et l’a mangé en entier sur le pas de sa porte, sans en laisser à personne.',
  },
  tanning: {
    name: 'Les vieilles fosses',
    nickname: 'Un an et un jour',
    intro: '« Le bon cuir dort un an et un jour dans la fosse. Plus personne n’a cette patience depuis la Marée. Remplis-moi les vieilles fosses, et ne viens pas me dire que ça sent. »',
    outro: 'Un an et un jour plus tard, ou c’est tout comme, Hugon a sorti le premier cuir des vieilles fosses. Il était parfait. Il a dit que ça sentait bon, et personne n’a osé le contredire.',
  },
  tailoring: {
    name: 'Les bannières rapiécées',
    nickname: 'Reprise invisible',
    intro: '« Les vieilles bannières du bourg ont traversé la Marée. Elles sont en lambeaux, mais elles se souviennent de leurs couleurs. Reprise-les sans qu’on voie la reprise. »',
    outro: 'Les bannières flottent sur la halle, comme neuves. Les anciens cherchent les reprises du bout du doigt et ne les trouvent pas. Lise, si, mais elle fait semblant que non.',
  },
  alchemy: {
    name: 'La brume en bouteille',
    nickname: 'Fume-violet',
    intro: '« J’ai mis de la brume en bouteille. Elle a fumé violet. J’ai couru. Toi, tu ne cours pas, à ce qu’on dit. Distille ce qu’il faut pour la tenir tranquille. »',
    outro: 'La bouteille fume violet sur l’étagère, sagement. Évariste la surveille du coin de l’œil, et il ne court plus quand il passe devant.',
  },
  jewelcrafting: {
    name: 'Les pierres sans nom',
    nickname: 'Nomme-les-pierres',
    intro: '« Les Lointains rendent des pierres que personne n’a jamais vues. Elles n’ont pas de nom. Monte-les sur de l’or, et on verra bien comment elles s’appellent. »',
    outro: 'Tu as monté les pierres sans nom et tu leur en as donné un à chacune. Sidonie les a notés dans son grand livre, à l’encre rouge, celle qu’elle garde pour les choses vraies.',
  },
  enchanting: {
    name: 'L’encre que la Marée n’efface pas',
    nickname: 'L’Encre qui reste',
    intro: '« La Marée efface tout, même l’encre. Sauf une, paraît-il, qu’on trace en pensant très fort à ce qu’on veut garder. Je n’y arrive pas. J’y pense trop. »',
    outro: 'Tu as tracé une rune, et le lendemain, après la Marée, elle était toujours là. Ilian l’a regardée longtemps, puis il a sorti un vieux carnet aux pages blanches et t’a demandé de recommencer.',
  },
  artificing: {
    name: 'Le rabot qui rabote tout seul',
    nickname: 'Apprivoise-outils',
    intro: '« On a ramené des Lointains un rabot qui rabote tout seul. Tout. La table, la porte, l’apprenti. Il faut l’apprivoiser, et pour ça, de la lumière et un peu de bruit. »',
    outro: 'Le rabot obéit maintenant. Il ne rabote plus que ce qu’on lui montre, et il ronronne. Capucine l’a appelé Gaspard et refuse qu’on le démonte.',
  },
  construction: {
    name: 'Le mur sans histoire',
    nickname: 'Mur sans histoire',
    intro: '« Toute ma vie, j’ai voulu un mur sans histoire. Les miens en ont tous une : une fissure, un oubli, une Marée. Fais-m’en un. Un seul. Avec sa charpente, tant qu’à faire. »',
    outro: 'Le mur est droit, sec, sans une fissure. Il n’a pas d’histoire. Gautier l’a regardé une heure, puis il a dit que c’était la plus belle histoire qu’il connaisse.',
  },
  exploration: {
    name: 'La route qui n’était pas là hier',
    nickname: 'Boussole têtue',
    intro: '« Chaque saison, la Marée déplace une route. Celle de la Cicatrice a changé trois fois ce mois-ci. Suis-la, note tout, et ne crois pas ta boussole : elle a peur. »',
    outro: 'Tu as suivi la route qui bougeait jusqu’à ce qu’elle se fatigue. Ombeline a refait la carte trois fois en riant, puis elle a gravé une boussole sur ta besace.',
  },
};

// --- Construction du fichier. ---
const byId = Object.fromEntries(trials.map((t) => [t.id, t]));
for (const [id, patch] of Object.entries(EDITS)) {
  if (!byId[id]) throw new Error(`commande inconnue : ${id}`);
  Object.assign(byId[id], patch);
}
const round = (n) => (n < 50 ? Math.round(n) : Math.round(n / 5) * 5);
for (const [profession, text] of Object.entries(NEW90)) {
  const base = byId[`${profession}_80`];
  if (!base) throw new Error(`pas de commande 80 pour ${profession}`);
  byId[`${profession}_90`] = {
    id: `${profession}_90`,
    profession,
    rank: 90,
    ...text,
    tasks: base.tasks.map((t) => ({ item: t.item, qty: round(t.qty * 1.5) })),
    reward: { gold: 45000 },
  };
}

// Typographie : l'apostrophe courbe partout dans les textes.
const curly = (s) => s.replace(/'/g, '’');
const q = (s) => JSON.stringify(curly(s));
const lines = [
  '# Rangs de métier : commandes du maître aux niveaux 20, 40, 60, 80, 90 et 99 (docs/design/rangs.md).',
  '# Réussir la commande accorde le surnom du palier et débloque la tranche suivante : sans elle, le niveau reste au palier',
  '# (l’XP continue de s’accumuler, rien n’est perdu). Quantités = budget de travail par palier (30 min, 1 h 30, 3 h, 6 h,',
  '# 9 h, 12 h). Textes : passe éditoriale du 24 octobre 2026 (docs/design/titres/passe-editoriale.md), régénérés par',
  '# docs/design/titres/passe-editoriale.mjs. Récompenses et quantités à équilibrer. # à équilibrer',
];
const RANKS = [20, 40, 60, 80, 90, 99];
for (const p of professions) {
  const list = RANKS.map((r) => byId[`${p.id}_${r}`]).filter(Boolean);
  if (!list.length) continue;
  lines.push('', `# --- ${p.master?.name ?? p.name} (${p.id}) : ${p.name} ---`);
  for (const t of list) {
    lines.push(
      `- id: ${t.id}`,
      `  profession: ${t.profession}`,
      `  rank: ${t.rank}`,
      `  name: ${q(t.name)}`,
      `  nickname: ${q(t.nickname)}`,
      `  intro: ${q(t.intro)}`,
      `  outro: ${q(t.outro)}`,
      '  tasks:',
      ...t.tasks.map((x) => `    - { item: ${x.item}, qty: ${x.qty} }`),
      `  reward: { gold: ${t.reward.gold} }`,
      '',
    );
  }
}
const all = Object.values(byId);
const missing = all.filter((t) => !professions.some((p) => p.id === t.profession));
if (missing.length) throw new Error('métier inconnu : ' + missing.map((t) => t.id).join(', '));
writeFileSync(join(root, 'data', 'trials.yaml'), lines.join('\n').replace(/\n+$/, '\n'));
console.log(`${all.length} commandes écrites (${Object.keys(EDITS).length} retouchées, ${Object.keys(NEW90).length} nouvelles au 90).`);

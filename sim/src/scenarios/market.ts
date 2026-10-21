import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, loadVariant } from '../load.js';
import { PROFILES } from '../profiles.js';
import { type DashboardInput, type Summary, dashboardHtml, summarize } from '../market/dashboard.js';
import { type WorldOptions, type WorldResult, runWorld } from '../market/world.js';

const REPORTS = join(ROOT, 'sim', 'reports');
const fmt = (n: number) => Math.round(n).toLocaleString('fr-FR');
const fmt1 = (n: number) => n.toLocaleString('fr-FR', { maximumFractionDigits: 1 });

export function marketSim(opts: WorldOptions): WorldResult {
  return runWorld(loadVariant(), opts);
}

/** Constats tirés des chiffres, dans l'ordre où on doit les lire. */
function findings(s: Summary): DashboardInput['findings'] {
  const out: DashboardInput['findings'] = [];
  const sinks = s.outflowTax + s.outflowPnj + s.outflowStall;
  out.push({
    level: s.netPerPlayerDay > 50 ? 'alerte' : s.netPerPlayerDay > 0 ? 'attention' : 'bon',
    title: s.netPerPlayerDay > 0 ? 'L’or entre bien plus vite qu’il ne sort' : 'L’or est à peu près équilibré',
    text:
      `Les commandes PNJ créent ${fmt(s.inflowNpc)} or par joueur et par jour ; la taxe, les réparations du PNJ et l’étal en retirent ${fmt(sinks)} (${fmt(s.outflowTax)} de taxe, ${fmt(s.outflowPnj + s.outflowStall)} de réparations et d’étal). ` +
      `Solde : +${fmt(s.netPerPlayerDay)} or par joueur et par jour, soit ${fmt(s.goldPerPlayer)} or par joueur au bout de ${s.days} jours. ` +
      'Les leviers : baisser les récompenses des commandes, ou ajouter de vrais postes de dépense (clan, construction, équipement de combat) avant l’ouverture.',
  });
  out.push({
    level: s.priceRatio < 0.5 ? 'alerte' : s.priceRatio < 0.9 ? 'attention' : 'bon',
    title: s.priceRatio < 0.5 ? 'Les matières premières se vendent à perte' : 'Les prix suivent le travail',
    text:
      `Le prix moyen des objets les plus échangés vaut ${fmt1(s.priceRatio * 100)} % du prix de référence. Un récolteur qui joue 16 h par jour produit des milliers d’unités : l’offre écrase la demande, et il reste l’équivalent de ${fmt1(s.unsoldDays)} jours de ventes en offres invendues. ` +
      'À un ou deux or l’unité, la taxe de 5 % arrondie à l’avantage de la taxe fait qu’une vente à l’unité à 1 or ne rapporte rien : il faut vendre par lots, ou prévoir un minimum de taxe.',
  });
  out.push({
    level: s.artisanRepairs === 0 && s.pnjRepairs > 0 ? 'attention' : 'bon',
    title: 'Les réparations vont au PNJ, pas aux artisans',
    text:
      `${fmt(s.pnjRepairs)} réparations chez le PNJ à ${fmt(s.pnjRepairPrice)} or en moyenne, ${fmt(s.artisanRepairs)} par les joueurs. Un artisan doit au minimum rembourser ses matériaux (environ ${fmt(s.artisanFloor)} or de lingots), le PNJ demande moins de la moitié. ` +
      'C’est cohérent avec ton garde-fou (la Forge ne doit pas devenir indispensable), mais la réparation par un artisan ne servira alors à personne : à toi de choisir entre un PNJ plus cher et un service assumé comme secondaire.',
  });
  out.push({
    level: s.forgeShare > 0.15 ? 'attention' : 'bon',
    title: s.forgeShare > 0.15 ? 'La Forge prend une grande part du travail' : 'La Forge n’est pas surchargée',
    text: `${fmt1(s.forgeShare * 100)} % du temps de travail est passé en Forge (7 métiers jouables, un forgeron pour sept joueurs environ). Les artisans simulés passent l’essentiel de leur temps à récolter faute d’ingrédients ou de profit à fabriquer : lis ce chiffre comme un minimum. Elle ne devient pas un passage obligé tant que le combat n’ajoute pas d’armes.`,
  });
  out.push({
    level: s.firstToolDays === null || s.firstToolDays > 3 ? 'attention' : 'bon',
    title: 'Les débuts d’un nouveau joueur',
    text:
      s.firstToolDays === null
        ? 'Aucun nouveau joueur n’a obtenu d’outil pendant la simulation.'
        : `Un nouvel arrivant a son premier outil en état au bout de ${fmt1(s.firstToolDays)} jour(s) en moyenne et ${s.noToolEver ? `${s.noToolEver} sur ${s.newcomers} n’en ont jamais eu` : 'tous en ont eu un'}. ` +
          (s.day500 === null ? '' : `Il atteint 500 or en ${fmt1(s.day500)} jour(s) : ses premières commandes PNJ et ses ventes le lancent vite.`),
  });
  return out;
}

export interface MarketRun {
  result: WorldResult;
  html: string;
}

export function marketReport(opts: { players: number; days: number; seed: number }, scaleSizes = [10, 30, 120]): MarketRun {
  const content = loadVariant();
  const main = runWorld(content, opts);
  const scales = [...new Set([...scaleSizes, opts.players])].sort((a, b) => a - b).map((players) => ({
    label: `${players} joueurs${players === opts.players ? ' (simulation ci-dessus)' : ''}`,
    summary: players === opts.players ? summarize(main) : summarize(runWorld(content, { ...opts, players })),
  }));
  const professionNames = Object.fromEntries(content.professions.map((p) => [p.id, p.name]));
  const presenceNames = Object.fromEntries(Object.values(PROFILES).map((p) => [p.id, p.name]));
  const input: DashboardInput = {
    main,
    scales,
    generatedOn: new Date().toISOString().slice(0, 10),
    professionNames,
    presenceNames,
    findings: findings(summarize(main)),
  };
  mkdirSync(REPORTS, { recursive: true });
  writeFileSync(join(REPORTS, 'marche.json'), JSON.stringify({ options: main.options, summary: summarize(main), scales, findings: input.findings }, null, 1));
  const html = dashboardHtml(input);
  writeFileSync(join(REPORTS, 'marche.html'), html);
  return { result: main, html };
}

export function marketText(run: MarketRun): string {
  const s = summarize(run.result);
  return [
    `${s.players} joueurs, ${s.days} jours`,
    `or créé par joueur et par jour : ${fmt(s.netPerPlayerDay)} (entrées ${fmt(s.inflowNpc)}, sorties ${fmt(s.outflowTax + s.outflowPnj + s.outflowStall)})`,
    `or par joueur à la fin : ${fmt(s.goldPerPlayer)} · prix/référence : ${fmt1(s.priceRatio * 100)} % · sans outil : ${fmt1(s.noToolShare * 100)} % · Forge : ${fmt1(s.forgeShare * 100)} %`,
    `Écrit : sim/reports/marche.html et marche.json`,
  ].join('\n');
}

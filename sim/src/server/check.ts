/**
 * Garde-fou des simulations de serveur : relit l'analyse d'un serveur réaliste (`sim/reports/serveur/<nom>.json`) et dit si
 * chaque chose qui marche reste dans ses bornes, et si chaque point fragile est réglé. On corrige un point, on resimule,
 * on relance ce contrôle : rien d'autre ne doit casser.
 * `pnpm --filter @bramo/sim exec tsx src/server/check.ts <nom>`
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Analysis } from './report.js';

export interface Check {
  name: string;
  value: string;
  ok: boolean;
  /** Ce qui marchait déjà (à ne pas casser) ou un point fragile à régler. */
  kind: 'garder' | 'fragile';
}

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length ? s[Math.floor(s.length / 2)]! : 0;
};

export function checks(a: Analysis): Check[] {
  const out: Check[] = [];
  const add = (kind: Check['kind'], name: string, value: number | string, ok: boolean) => out.push({ kind, name, value: String(value), ok });
  const day120 = (p: string) => a.milestones.find((m) => m.persona === p)?.route['étape 120']?.day ?? null;
  const casual = day120('casual');
  const tryhard = day120('tryhard');
  // --- À garder ---
  add('garder', 'route principale finie par un casu (jour, 30 à 70)', casual ?? '—', casual !== null && casual >= 30 && casual <= 70);
  const ratio = casual && tryhard ? casual / tryhard : 0;
  add('garder', 'tryhard / casu sur la route (1,2 à 2,5)', ratio.toFixed(2), ratio >= 1.2 && ratio <= 2.5);
  // Tous les joueurs (sauf l'onglet oublié), pondérés : un petit groupe de quatre joueurs ne fait plus 25 % à lui seul.
  const groups = a.goalSummary.filter((g) => g.persona !== 'afk');
  const counted = groups.reduce((s, g) => s + (g.n ?? 1), 0);
  const idle = groups.reduce((s, g) => s + g.noProgress14d * (g.n ?? 1), 0) / Math.max(1, counted);
  add('garder', 'joueurs sans aucun progrès depuis 14 jours (au plus 10 %)', `${Math.round(idle * 100)} %`, idle <= 0.1);
  const route = a.guardians.slice(0, 12);
  const worst = Math.max(...route.map((g) => g.medianDays));
  add('garder', 'gardiens de la route : pire médiane (au plus 7 jours)', worst, worst <= 7);
  add('garder', 'pièces d’équipement par joueur et par jour (1 à 3)', a.loot.perBotDay, a.loot.perBotDay >= 1 && a.loot.perBotDay <= 3);
  // Marée : depuis l'inscription de 19 h à 20 h (décision de Louis du 23 octobre), on mesure un soir joué ; la part des
  // inscrits dépend des horaires des joueurs simulés (rapport), pas d'une règle.
  const shards = a.tide?.shardsPerNight ?? 0;
  add('garder', 'Marée : éclats par soir joué (30 à 80)', shards, shards >= 30 && shards <= 80);
  const worn = a.loot.sets.filter((s) => s.worn2plus > 0).length;
  add('garder', 'ensembles portés par au moins un joueur (au moins 12 sur 15)', worn, worn >= 12);
  // --- Points fragiles ---
  const faucet = a.economy.faucetTotal;
  const sink = a.economy.sinkTotal;
  add('fragile', 'or créé / or détruit (au plus 1,5)', (faucet / Math.max(1, sink)).toFixed(2), faucet / Math.max(1, sink) <= 1.5);
  if (a.economy.lateRatio !== undefined) add('fragile', 'or créé / or détruit, 30 derniers jours (au plus 1,5)', a.economy.lateRatio, a.economy.lateRatio <= 1.5);
  const last = a.economy.gold.at(-1)!;
  const perDay = last.perPlayer / Math.max(1, last.day);
  add('fragile', 'or gagné et gardé par joueur et par jour (au plus 350)', perDay.toFixed(0), perDay <= 350);
  const index = median(a.market.index.slice(-4));
  add('fragile', 'indice des prix, dernières semaines (au moins 65)', index, index >= 65);
  const soldShare = a.vitrine.sold / Math.max(1, a.vitrine.sold + a.vitrine.listed);
  add('fragile', 'vitrine : part des pièces mises en vente qui partent (au moins 50 %)', `${Math.round(soldShare * 100)} %`, soldShare >= 0.5);
  const fair = a.classes.classFair;
  const r30 = fair.map((c) => c.route30).filter((x) => x > 0);
  const spread = r30.length ? Math.max(...r30) / Math.min(...r30) : 0;
  add('fragile', 'écart des classes à 30 jours, casus (au plus 1,15)', spread.toFixed(2), spread > 0 && spread <= 1.15);
  const tide = Object.values(a.tide?.byClass ?? {});
  const tspread = tide.length ? Math.max(...tide) / Math.min(...tide) : 0;
  add('fragile', 'écart des classes à la Marée (au plus 1,15)', tspread.toFixed(2), tspread > 0 && tspread <= 1.15);
  return out;
}

if (process.argv[1]?.endsWith('check.ts')) {
  const root = fileURLToPath(new URL('../../../', import.meta.url));
  const name = process.argv[2] ?? 'v6-real-120x90';
  const a = JSON.parse(readFileSync(join(root, 'sim/reports/serveur', `${name}.json`), 'utf8')) as Analysis;
  const list = checks(a);
  for (const c of list) console.log(`${c.ok ? 'OK  ' : 'NON '} [${c.kind}] ${c.name} : ${c.value}`);
  const broken = list.filter((c) => !c.ok);
  console.log(broken.length ? `${broken.length} point(s) hors des bornes.` : 'Tout est dans les bornes.');
}

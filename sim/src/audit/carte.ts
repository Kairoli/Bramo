/**
 * Audit des systèmes, phase 1 : la carte des mécaniques tirée des données du jeu (`data/`) et du schéma du moteur, sans passer
 * par les fiches de conception. Pour chaque réserve : ce qui la remplit, la dépense, s'en sert (`gamePoolLinks`) ; pour chaque
 * talent : déclencheurs et actions ; ce que le moteur sait faire et que les données n'utilisent pas ; les mécaniques des
 * rencontres ; qui porte quoi (classe, emplacement, source).
 *
 * pnpm --filter @bramo/sim exec tsx src/audit/carte.ts       (écrit sim/reports/audit/carte.md)
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { type Talent, type TalentAction, type TalentEffect, gamePoolLinks, talentModKeys, talentTriggers } from '@bramo/shared';
import { loadContent } from '@bramo/shared/node';

const ROOT = fileURLToPath(new URL('../../../', import.meta.url));
const content = loadContent(join(ROOT, 'data'), join(ROOT, 'art'));
const combat = content.combat!;
const cat = combat.talents!;
const out: string[] = ['# Carte des mécaniques (audit, phase 1)', '', `Tirée de \`data/\` et du moteur (commit courant). ${cat.gems.length} gemmes de talent, ${cat.named.length} objets nommés, ${cat.sets.length} ensembles, ${combat.tools.length} outils de situation, ${Object.keys(combat.encounters).length} rencontres, ${Object.keys(combat.spells).length} sorts, ${Object.keys(content.gearModels).length} modèles d'équipement.`, ''];

// Tous les talents du jeu, avec leur origine.
const power = (content.power?.systems ?? []).flatMap((s) => s.nodes.flatMap((n) => n.talents.map((t) => ({ src: `puissance:${s.id}`, t: t.talent }))));
const all: { src: string; t: Talent }[] = [
  ...cat.gems.map((t) => ({ src: 'gemme', t })),
  ...cat.named.map((t) => ({ src: 'nommé', t })),
  ...cat.sets.flatMap((s) =>
    (['2', '3', '4'] as const)
      .filter((k) => s.pieces[k])
      .map((k) => {
        const p = s.pieces[k]!;
        const t = { id: `${s.id}_${k}`, name: `${s.name} (${k})`, effects: p.effects ?? [], mods: p.mods, pools: p.pools, convert: p.convert, tool: p.tool } as Talent;
        return { src: `ensemble ${k}`, t };
      }),
  ),
  ...power,
];
const actions = (e: TalentEffect): TalentAction[] => {
  const xs: TalentAction[] = [];
  for (let a: TalentAction | undefined = e.do; a; a = a.fallback) xs.push(a);
  return xs;
};

// --- Les réserves ---------------------------------------------------------------------------------------------------
out.push('## 1. Les huit réserves', '', 'Tous les talents du jeu : gemmes (g), objets nommés (n), paliers d\'ensemble (e), talents de la Puissance (p). « Lue » : multiplie un effet par les charges (`scaleBy`) ou attend un seuil (`poolAtLeast`) sans la vider. « Conversion » : reçoit une part des charges d\'une autre.', '', '| Réserve | Plafond | Remplie par | Dépensée par | Lue sans la vider | Conversion vers elle |', '|---|---|---|---|---|---|');
const tag = (src: string) => (src === 'gemme' ? 'g' : src === 'nommé' ? 'n' : src.startsWith('ensemble') ? 'e' : 'p');
for (const p of cat.pools) {
  const fill: string[] = [];
  const spend: string[] = [];
  const use: string[] = [];
  const conv: string[] = [];
  for (const { src, t } of all) {
    const as = t.effects.flatMap(actions);
    const label = `${t.name} (${tag(src)})`;
    if (as.some((a) => a.gain?.pool === p.id)) fill.push(label);
    if (as.some((a) => a.spendPool?.pool === p.id)) spend.push(label);
    else if (as.some((a) => a.scaleBy === p.id) || t.effects.some((e) => e.poolAtLeast?.pool === p.id)) use.push(label);
    if (t.convert?.some((c) => c.to === p.id)) conv.push(`${label} depuis ${t.convert.filter((c) => c.to === p.id).map((c) => c.from).join(', ')}`);
  }
  const names = (xs: string[]) => (xs.length ? `${xs.length} : ${xs.join(', ')}` : '**rien**');
  out.push(`| ${p.name} | ${p.max} | ${names(fill)} | ${names(spend)} | ${names(use)} | ${conv.join(' ; ') || '—'} |`);
}
out.push('', 'Note : `gamePoolLinks` (`combat/guide.ts`, la bulle « dans le jeu » des jauges) ne parcourt que les objets nommés et les ensembles : pour le joueur, presque toutes les réserves y paraissent « dépensées par rien », alors que les gemmes de talent les dépensent.', '');
void gamePoolLinks;

// --- Déclencheurs et actions -----------------------------------------------------------------------------------------
const trig: Record<string, number> = {};
const act: Record<string, number> = {};
const mods: Record<string, number> = {};
const cond: Record<string, number> = {};
for (const { t } of all) {
  for (const e of t.effects) {
    for (const w of Array.isArray(e.when) ? e.when : [e.when]) trig[w] = (trig[w] ?? 0) + 1;
    for (const k of ['target', 'minCooldown', 'maxCooldown', 'skill', 'heatAtLeast', 'before', 'after', 'noSkillFor', 'hpBelow', 'selfShielded', 'rune', 'form', 'pattern', 'every', 'amountAtLeast', 'poolAtLeast', 'targetHpBelow', 'targetHpAbove'] as const) if (e[k] !== undefined) cond[k] = (cond[k] ?? 0) + 1;
    for (const a of actions(e)) for (const [k, v] of Object.entries(a)) if (v !== undefined && k !== 'fallback') act[k] = (act[k] ?? 0) + 1;
  }
  for (const k of Object.keys(t.mods ?? {})) mods[k] = (mods[k] ?? 0) + 1;
}
const actionKeys = ['amplify', 'critBonus', 'damage', 'dot', 'mark', 'slow', 'vuln', 'shield', 'heal', 'healShare', 'buff', 'cooldownCut', 'heat', 'replayRune', 'transferDots', 'bank', 'spend', 'next', 'gain', 'spendPool', 'scaleBy', 'lowHpHeal', 'stack', 'uses', 'usesPerHeat', 'other'];
out.push('## 2. La langue des talents : ce que les données utilisent', '', `${all.length} talents (gemmes, nommés, paliers d'ensemble, talents de la Puissance).`, '');
out.push('| Déclencheur | Talents |', '|---|---|', ...talentTriggers.map((k) => `| ${k} | ${trig[k] ?? '**0**'} |`), '');
out.push('| Action | Effets |', '|---|---|', ...actionKeys.map((k) => `| ${k} | ${act[k] ?? '**0**'} |`), '');
out.push('| Condition | Effets |', '|---|---|', ...Object.entries(cond).sort((a, b) => b[1] - a[1]).map(([k, n]) => `| ${k} | ${n} |`), '');
out.push('| Modificateur passif | Talents |', '|---|---|', ...talentModKeys.map((k) => `| ${k} | ${mods[k] ?? '**0**'} |`), '');

// --- Ce qui change le combat et ce qui n'est qu'un nombre --------------------------------------------------------------
const behavioral = (t: Talent) => t.effects.some((e) => actions(e).some((a) => a.gain || a.spendPool || a.next || a.transferDots || a.replayRune || a.cooldownCut || a.heat || a.bank || a.spend || a.slow || a.mark || a.vuln || a.dot)) || !!t.convert?.length || !!t.tool;
const numeric = all.filter(({ t }) => !behavioral(t));
out.push('## 3. Mécanique ou simple nombre ?', '', `Un talent « mécanique » remplit ou dépense une réserve, prépare l'action suivante, rejoue une rune, rend des Braises, raccourcit des recharges, pose un état (marque, ralentissement, affliction, vulnérabilité), convertit une réserve ou apporte un outil de situation. Les autres ne font que des bonus chiffrés (dégâts en plus, bouclier, soin, modificateur).`, '', `- Mécaniques : ${all.length - numeric.length} talents sur ${all.length}.`, `- Simples nombres : ${numeric.length} : ${numeric.map(({ src, t }) => `${t.name} (${src})`).join(', ')}.`, '');

// --- Les rencontres ----------------------------------------------------------------------------------------------------
out.push('## 4. Les rencontres de la route', '', '| Rencontre | Sorte | Palier | Limite (s) | Mécaniques |', '|---|---|---|---|---|');
for (const e of Object.values(combat.encounters).filter((x) => x.kind === 'zone' || x.kind === 'gardien')) {
  const m = [e.enemies > 1 ? `${e.enemies} ennemis` : null, e.adds ? `renforts ×${e.adds.reduce((a, x) => a + x.count, 0)}` : null, e.attack.heavyEvery ? `coup lourd 1/${e.attack.heavyEvery} ×${e.attack.heavyMultiplier}` : null, e.charge ? `charge ${e.charge.damage} / ${e.charge.period} s` : null, e.guard ? `garde${e.guard.empower ? ' menaçante' : ''}${e.guard.on === 'alternate' ? ' alternée' : ''}` : null, e.regen ? 'soin ennemi' : null, e.aura ? `aura ${e.aura.damage}/s` : null, e.erosion ? 'érosion' : null, e.windows ? `fenêtres (fermées −${Math.round(100 * e.windows.closedReduction)} %)` : null, e.enrage ? 'fureur' : null].filter(Boolean);
  out.push(`| ${e.name} | ${e.kind} | ${e.tier}${e.circles ? '+' : ''} | ${e.timeLimit ?? combat.rules.fightLimit} | ${m.join(', ')} |`);
}
out.push('');

// --- Ce que les données n'utilisent pas ---------------------------------------------------------------------------------
const lines = new Set(Object.values(content.gearPools.pools).flatMap((p) => p.map((l) => l.name)));
const effects = new Set([...lines].map((n) => combat.rules.gearStats?.lines[n] ?? 'none'));
const unusedEffects = ['penetration', 'physical', 'fire', 'frost', 'lightning', 'startShield', 'critMultiplier', 'maxHp', 'power', 'haste', 'critChance', 'damageReduction'].filter((x) => !effects.has(x));
const gearStats = new Set(Object.values(content.gearModels).flatMap((m) => m.stats.map((s) => s.stat)));
const powerStats = new Set((content.power?.systems ?? []).flatMap((s) => s.nodes.flatMap((n) => n.perLevel.map((b) => b.stat))));
out.push('## 5. Ce que le moteur sait faire et que le jeu n\'utilise pas', '');
out.push(`- Effets de ligne aléatoire sans aucune ligne dans \`gear_pools.yaml\` : ${unusedEffects.join(', ') || 'aucun'} (les éléments n'ont donc aucun effet en combat : aucune résistance, aucune ligne de dégâts par élément).`);
out.push(`- Statistiques fixes des modèles d'équipement : ${[...gearStats].join(', ')}.`);
out.push(`- Statistiques des systèmes de Puissance : ${[...powerStats].join(', ')} (les seules sources de combo, contre-attaque, esquive et régénération).`);
out.push(`- Déclencheurs sans aucun talent : ${talentTriggers.filter((k) => !trig[k]).join(', ') || 'aucun'}.`);
out.push(`- Actions sans aucun talent : ${actionKeys.filter((k) => !act[k]).join(', ') || 'aucune'}.`);
out.push(`- Modificateurs sans aucun talent : ${talentModKeys.filter((k) => !mods[k]).join(', ') || 'aucun'}.`, '');

// --- Qui porte quoi ----------------------------------------------------------------------------------------------------
out.push('## 6. Qui porte quoi', '');
const named = cat.named.map((n) => `${n.name} (${n.class ?? 'toutes'}${n.slot ? `, ${n.slot}` : ''})`);
out.push(`- Objets nommés : ${named.join(' ; ')}.`);
out.push(`- Ensembles de classe : ${cat.sets.filter((s) => s.class).map((s) => `${s.name} (${s.class})`).join(', ') || 'aucun'} ; sans classe : ${cat.sets.filter((s) => !s.class).length}.`);
const gemsByRole: Record<string, number> = {};
for (const g of cat.gems) gemsByRole[g.role ?? '?'] = (gemsByRole[g.role ?? '?'] ?? 0) + 1;
out.push(`- Gemmes par rôle : ${Object.entries(gemsByRole).map(([k, n]) => `${k} ${n}`).join(', ')}.`);
const situation = Object.values(content.items).filter((i) => i.gem && combat.tools.some((t) => t.id === i.gem)).map((i) => i.name);
out.push(`- Gemmes de situation (outils, rang « gemme ») : ${situation.join(', ')}.`, '');

const dir = join(ROOT, 'sim', 'reports', 'audit');
mkdirSync(dir, { recursive: true });
writeFileSync(join(dir, 'carte.md'), `${out.join('\n')}\n`);
console.log(out.join('\n'));

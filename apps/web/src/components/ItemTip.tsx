import type { CSSProperties, ReactElement } from 'react';
import type { ContentResponse, Item, Recipe } from '@bramo/shared';
import { useGame } from '../game/GameContext';
import { useContent } from '../game/ContentContext';
import { num } from '../format';
import { FAMILY_COLOR } from './ui';
import { TipFoot, TipHead, TipLine } from './Tip';
import { PoolText } from './PoolGauges';

/**
 * D'où vient un objet et à quoi il sert [demande de Louis, 23 octobre : « si on a besoin de quelque chose pour une
 * recette, il faut indiquer où l'obtenir, de manière propre et visuelle »]. Les recettes qui le fabriquent (métier et
 * niveau), le combat qui le fait tomber (région), l'étal de la guilde, et toujours le marché entre joueurs.
 */

export interface ItemSources {
  recipes: Recipe[];
  drops: { region: string; encounters: string[] }[];
  obtain: string | null;
  stall: number | null;
}

export function itemSources(itemId: string, content: ContentResponse): ItemSources {
  const recipes = Object.values(content.recipes)
    .filter((r) => !r.trial && r.outputs.some((o) => o.item === itemId))
    .sort((a, b) => a.level - b.level);
  const item = content.items[itemId];
  return { recipes, drops: content.drops?.[itemId] ?? [], obtain: item?.obtain ?? null, stall: item?.stallPrice ?? null };
}

/** Les recettes où l'objet entre, regroupées par métier. */
function itemUses(itemId: string, content: ContentResponse): { profession: string; names: string[] }[] {
  const by = new Map<string, string[]>();
  for (const r of Object.values(content.recipes)) {
    if (r.trial || !r.inputs.some((i) => i.item === itemId)) continue;
    const list = by.get(r.profession) ?? [];
    list.push(r.name);
    by.set(r.profession, list);
  }
  return [...by.entries()].map(([profession, names]) => ({ profession, names }));
}

const profOf = (content: ContentResponse, id: string) => content.professions.find((p) => p.id === id);

/** Le contenu de la bulle d'un objet. */
export function ItemTipContent({ item }: { item: Item }) {
  const content = useContent();
  const src = itemSources(item.id, content);
  const uses = itemUses(item.id, content);
  const lines: ReactElement[] = [];
  if (item.meal) lines.push(<TipLine key="meal" color="var(--clan)" mark="✚">Repas : +{Math.round(item.meal.bonus * 100)} % de vitesse aux métiers pendant {item.meal.durationMin >= 60 ? `${Math.round(item.meal.durationMin / 60)} h` : `${item.meal.durationMin} min`}</TipLine>);
  if (item.tool) lines.push(<TipLine key="tool" color="var(--clan)" mark="⚒">Outil de {profOf(content, item.tool.profession)?.name ?? item.tool.profession} : +{Math.round(item.tool.bonus * 100)} % de vitesse{item.tool.durabilityHours ? `, ${item.tool.durabilityHours} h de travail avant réparation` : ''}</TipLine>);
  if (item.potion) lines.push(<TipLine key="potion" color="var(--good)" mark="✚">Potion de combat : rend {Math.round(item.potion.heal * 100)} % des PV, bue sous {Math.round(item.potion.below * 100)} %</TipLine>);
  const talent = content.talentGems?.[item.id];
  if (talent) {
    // Gemme de talent : son talent, ses réserves soulignées (expliquées au survol).
    lines.push(<TipLine key="talent" color="var(--r-legendary)" mark="★">Talent : {talent.text ? <PoolText text={talent.text} /> : item.name}</TipLine>);
    lines.push(<TipLine key="gem" color="var(--magic)" mark="◆">Gemme de talent : se sertit dans l’arme, le torse, la tête ou le collier ; elle prend une des quatre places de talent, comme un objet nommé</TipLine>);
  } else if (item.gem) lines.push(<TipLine key="gem" color="var(--magic)" mark="◆">Gemme : se sertit dans l’arme, le torse, la tête ou le collier ; elle répond à une mécanique de combat</TipLine>);
  return (
    <>
      <TipHead title={item.name} sub={`Valeur de référence ${num(item.value)} or`} />
      {lines.length > 0 && <div className="tip-body">{lines}</div>}
      <div className="tip-body">
        <span className="tip-label">S’obtient</span>
        {src.recipes.slice(0, 3).map((r) => {
          const p = profOf(content, r.profession);
          return (
            <TipLine key={r.id} color={p ? FAMILY_COLOR[p.family] : undefined} mark="▸">
              {p?.name} niveau {r.level}
              {r.inputs.length ? ` · ${r.inputs.map((i) => `${i.qty} × ${content.items[i.item]?.name ?? i.item}`).join(' + ')}` : ' · récolte'}
            </TipLine>
          );
        })}
        {src.recipes.length > 3 && <span className="muted small">et {src.recipes.length - 3} autre{src.recipes.length > 4 ? 's' : ''} recette{src.recipes.length > 4 ? 's' : ''}</span>}
        {src.drops.map((d) => (
          <TipLine key={d.region} color="var(--alert)" mark="⚔">
            Tombe en combat : {d.region} ({d.encounters.slice(0, 2).join(', ')}
            {d.encounters.length > 2 ? '…' : ''})
          </TipLine>
        ))}
        {src.obtain && (
          <TipLine color="var(--event)" mark="✦">
            {src.obtain}
          </TipLine>
        )}
        {src.stall !== null && (
          <TipLine color="var(--market)" mark="⌂">
            Étal de la guilde : {num(src.stall)} or (si aucun joueur n’en vend)
          </TipLine>
        )}
        <TipLine color="var(--market)" mark="⇄">
          Au marché, entre joueurs
        </TipLine>
      </div>
      {uses.length > 0 && (
        <TipFoot>
          Sert à : {uses.slice(0, 3).map((u) => `${profOf(content, u.profession)?.name} (${u.names.slice(0, 2).join(', ')}${u.names.length > 2 ? '…' : ''})`).join(' · ')}
          {uses.length > 3 ? ' · …' : ''}
        </TipFoot>
      )}
    </>
  );
}

/**
 * « Où l'obtenir », pour un ingrédient de recette : des pastilles cliquables. Le métier qui le fabrique (ouvre la
 * recette), le combat qui le fait tomber, l'étal, le marché.
 */
export function SourceChips({ itemId }: { itemId: string }) {
  const { content, state, openRecipe, openMarket, go } = useGame();
  const src = itemSources(itemId, content);
  return (
    <div className="source-chips">
      {src.recipes.slice(0, 2).map((r) => {
        const p = profOf(content, r.profession);
        const level = state.skills[r.profession]?.level ?? 1;
        const ok = level >= r.level;
        return (
          <button
            key={r.id}
            className={`source-chip${ok ? '' : ' far'}`}
            style={{ '--sc': p ? FAMILY_COLOR[p.family] : 'var(--text-muted)' } as CSSProperties}
            onClick={() => openRecipe(r.id)}
            title={ok ? `Ouvrir « ${r.name} »` : `${p?.name} niveau ${r.level} requis (vous êtes ${level})`}
          >
            <span className="source-dot" />
            {p?.name} {r.level > 1 ? `niv. ${r.level}` : ''}
            {!ok && ' 🔒'}
            <span className="source-go">→</span>
          </button>
        );
      })}
      {src.drops.slice(0, 1).map((d) => (
        <button key={d.region} className="source-chip" style={{ '--sc': 'var(--alert)' } as CSSProperties} onClick={() => go('combat')} title={d.encounters.join(', ')}>
          <span className="source-dot" />
          Combat · {d.region}
          <span className="source-go">→</span>
        </button>
      ))}
      {src.obtain && (
        <span className="source-chip static" style={{ '--sc': 'var(--event)' } as CSSProperties}>
          <span className="source-dot" />
          {src.obtain}
        </span>
      )}
      <button className="source-chip" style={{ '--sc': 'var(--market)' } as CSSProperties} onClick={() => openMarket(itemId)}>
        <span className="source-dot" />
        Marché{src.stall !== null ? ` · étal ${num(src.stall)} or` : ''}
        <span className="source-go">→</span>
      </button>
    </div>
  );
}

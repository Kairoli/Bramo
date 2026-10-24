import { useEffect, useState } from 'react';
import { GearWorkshop } from '../components/GearWorkshop';
import { maxAffordable, trialsOf, type Recipe } from '@bramo/shared';
import { api } from '../api';
import { useGame } from '../game/GameContext';
import { useLiveActivity } from '../game/useLive';
import { decimal, duration, num, seconds, initialOf } from '../format';
import { Bar, ItemIcon, Ring } from '../components/ui';
import { SourceChips } from '../components/ItemTip';
import { Character } from '../rig/Character';
import { QueueChips } from '../components/QueueChips';
import { Scene } from '../components/Scene';
import { ProfessionOrders } from '../components/Orders';

const PAGE = 6;

export function ProfessionRoom({ id }: { id: string }) {
  const { content, state, look, go, recipeFocus } = useGame();
  const profession = content.professions.find((p) => p.id === id)!;
  const skill = state.skills[id]!;
  // Les chefs-d'œuvre n'apparaissent que pendant leur épreuve.
  const recipes = Object.values(content.recipes)
    .filter((r) => r.profession === id && (!r.trial || state.trials[r.trial] === 'open'))
    .sort((a, b) => a.level - b.level);
  const current = state.activity?.recipeId;
  // Par défaut : l'activité en cours, sinon la plus haute recette qu'on peut lancer avec son sac, sinon la première du
  // plus haut niveau accessible (et pas la dernière, qui ouvrait la Forge à la page 4 sur 9).
  const open = recipes.filter((r) => r.level <= skill.level && !r.trial);
  const makeable = open.filter((r) => r.inputs.every((i) => (state.inventory[i.item] ?? 0) >= i.qty));
  const top = open.length ? open[open.length - 1]!.level : 0;
  const fallbackId = recipes.find((r) => r.id === current)?.id ?? makeable[makeable.length - 1]?.id ?? open.find((r) => r.level === top)?.id ?? recipes[0]!.id;
  // Arrivé ici depuis « où l'obtenir » d'un ingrédient : la recette qui le fabrique est choisie.
  const focused = recipeFocus && recipes.some((r) => r.id === recipeFocus.id) ? recipeFocus.id : null;
  const [chosenId, setSelectedId] = useState<string>(focused ?? fallbackId);
  useEffect(() => {
    if (focused) setSelectedId(focused);
  }, [recipeFocus?.at]); // eslint-disable-line react-hooks/exhaustive-deps
  // Un chef-d'œuvre disparaît une fois l'épreuve réussie : on revient alors à une recette du métier.
  const selectedId = recipes.some((r) => r.id === chosenId) ? chosenId : fallbackId;
  const selected = content.recipes[selectedId]!;
  // Les métiers d'équipement ont deux espaces en bas de la salle : leurs recettes, et l'atelier d'équipement.
  const [mode, setMode] = useState<'recipes' | 'gear'>('recipes');
  // Les métiers qui fabriquent de l'équipement de combat ont leur atelier (data/gear_crafting.yaml).
  const makesGear = Object.values(content.gearCrafting?.families ?? {}).includes(id);
  const span = skill.nextLevelXp ? Math.min(1, (skill.xp - skill.levelXp) / (skill.nextLevelXp - skill.levelXp)) : 1;

  return (
    <main className="room">
      <section className="panel band">
        <Scene ids={[id]} />
        <Character appearance={look} className="band-figure profession-figure" />
        <ProfessionOrders profession={id} />
        <div className="sunken skill-card">
          <button className="btn btn-sm" onClick={() => go('professions')}>
            ← Tous les métiers
          </button>
          <div className="skill-head">
            <h1>{profession.name}</h1>
            <span className="skill-level">{skill.level}</span>
          </div>
          <div>
            <NicknamePicker professionId={id} />
            {skill.next &&
              (skill.next.reached ? (
                <span style={{ color: 'var(--clan)' }}> · la commande « {skill.next.name} » vous attend</span>
              ) : (
                <span className="muted">
                  {' '}
                  · « {skill.next.nickname} » au niveau {skill.next.rank}, par la commande {profession.master?.name.startsWith('Maîtresse') ? 'de la maîtresse' : 'du maître'}
                </span>
              ))}
          </div>
          <Bar value={span} color={skill.gated ? 'var(--clan)' : undefined} />
          <div className="muted skill-xp">
            {skill.gated
              ? `Niveau bloqué au ${skill.level} · ${num(skill.heldXp)} XP en attente, créditée à la validation`
              : `${num(skill.xp)} XP${skill.nextLevelXp ? ` · encore ${num(skill.nextLevelXp - skill.xp)} pour le niveau ${skill.level + 1}` : ''}`}
            {skill.boost && (
              <span className="xp-boost" title={`Tant que ce métier est sous le niveau ${skill.boost.untilLevel}, chaque fabrication rapporte ${skill.boost.multiplier} fois plus d’XP.`}>
                XP ×{skill.boost.multiplier} jusqu’au niveau {skill.boost.untilLevel}
              </span>
            )}
          </div>
        </div>
        {profession.master && <MasterPanel professionId={id} onCraft={setSelectedId} />}
      </section>

      <div className="profession-bottom">
        {makesGear && mode === 'gear' ? (
          <GearWorkshop profession={id} switcher={<ModeSwitch mode={mode} onMode={setMode} />} />
        ) : (
          <>
            <RecipeList recipes={recipes} level={skill.level} selectedId={selectedId} onSelect={setSelectedId} switcher={makesGear ? <ModeSwitch mode={mode} onMode={setMode} /> : null} />
            <RecipeDetail key={selected.id} recipe={selected} level={skill.level} />
          </>
        )}
      </div>
    </main>
  );
}

/** Recettes ou atelier d'équipement : deux grands onglets en tête du panneau du bas. */
function ModeSwitch({ mode, onMode }: { mode: 'recipes' | 'gear'; onMode: (m: 'recipes' | 'gear') => void }) {
  return (
    <div className="mode-tabs" role="tablist">
      <button role="tab" aria-selected={mode === 'recipes'} onClick={() => onMode('recipes')}>
        Recettes
      </button>
      <button role="tab" aria-selected={mode === 'gear'} onClick={() => onMode('gear')}>
        <span aria-hidden>⚒</span> Équipement
      </button>
    </div>
  );
}

/** Surnom affiché : on choisit parmi ceux qu'on a débloqués, même après un rang supérieur. */
function NicknamePicker({ professionId }: { professionId: string }) {
  const { state, act } = useGame();
  const skill = state.skills[professionId]!;
  const unlocked = skill.nicknames.filter((n) => n.unlocked);
  if (unlocked.length < 2) return <span>{skill.nickname}</span>;
  return (
    <select
      className="nickname-picker"
      aria-label="Surnom affiché"
      value={skill.shownRank}
      onChange={(e) => act(() => api.setNickname(professionId, Number(e.target.value)))}
    >
      {unlocked.map((n) => (
        <option key={n.rank} value={n.rank}>
          {n.nickname}
        </option>
      ))}
    </select>
  );
}

/**
 * Le maître du métier et sa commande, à droite de la scène.
 * Quatre cas : épreuve à passer (mise en avant), prochaine épreuve (verrouillée), toutes réussies, aucune.
 */
function MasterPanel({ professionId, onCraft }: { professionId: string; onCraft: (recipeId: string) => void }) {
  const { content, state, act } = useGame();
  const profession = content.professions.find((p) => p.id === professionId)!;
  const master = profession.master!;
  const skill = state.skills[professionId]!;
  const trials = trialsOf(professionId, content);
  const [success, setSuccess] = useState<{ title: string; story: string } | null>(null);
  const open = trials.find((t) => state.trials[t.id] === 'open');
  const next = open ?? trials.find((t) => state.trials[t.id] === 'locked');

  if (success) {
    return (
      <div className="sunken master-bubble trial-success" role="status">
        <span className="npc-avatar" data-initial={initialOf(master.name)} />
        <div>
          <span className="eyebrow">Commande réussie</span>
          <strong>{success.title}</strong>
          <p className="muted">{success.story}</p>
        </div>
      </div>
    );
  }

  if (!next) {
    return (
      <div className="sunken master-bubble">
        <span className="npc-avatar" data-initial={initialOf(master.name)} />
        <div>
          <strong>{master.name}</strong>
          <p className="muted">
            {trials.length ? 'Vous avez réussi toutes les commandes de ce métier, pour l’instant.' : master.line}
          </p>
        </div>
      </div>
    );
  }

  if (!open) {
    return (
      <div className="sunken master-bubble trial-locked">
        <span className="npc-avatar" data-initial={initialOf(master.name)} />
        <div className="trial-body">
          <strong>{master.name}</strong>
          <p className="muted">{master.line}</p>
          <span className="eyebrow">
            Prochaine commande · « {next.nickname} » au niveau {next.rank}
          </span>
          <Bar value={skill.level / next.rank} color="var(--clan)" />
          <span className="muted small">
            « {next.name} » · vous êtes niveau {skill.level}
          </span>
        </div>
      </div>
    );
  }

  const ready = open.tasks.every((t) => (state.inventory[t.item] ?? 0) >= t.qty);
  // La recette du métier qui produit l'objet demandé (le chef-d'œuvre de l'épreuve en priorité).
  const recipeFor = (item: string) =>
    Object.values(content.recipes)
      .filter((r) => r.profession === professionId && (!r.trial || r.trial === open.id) && r.outputs.some((o) => o.item === item))
      .sort((a, b) => Number(!!b.trial) - Number(!!a.trial))[0];
  const verb = profession.family === 'gathering' ? 'Récolter' : 'Fabriquer';
  const submit = async () => {
    if (await act(() => api.completeTrial(open.id))) {
      setSuccess({ title: `Vous devenez « ${open.nickname} » en ${profession.name} · +${num(open.reward.gold)} or`, story: open.outro });
      window.setTimeout(() => setSuccess(null), 12000);
    }
  };

  return (
    <div className="sunken master-bubble trial-open">
      <span className="npc-avatar" data-initial={initialOf(master.name)} />
      <div className="trial-body">
        <span className="trial-badge">Commande · surnom « {open.nickname} »</span>
        <strong>
          {master.name} · « {open.name} »
        </strong>
        <p className="muted trial-intro">{open.intro}</p>
        <ul className="trial-tasks">
          {open.tasks.map((t) => {
            const have = state.inventory[t.item] ?? 0;
            const done = have >= t.qty;
            const recipe = recipeFor(t.item);
            return (
              <li key={t.item} className={done ? 'done' : undefined}>
                <span className="trial-check" aria-hidden>
                  {done ? '✓' : ''}
                </span>
                <span>{content.items[t.item]?.name}</span>
                {recipe && !done && (
                  <button className="link" onClick={() => onCraft(recipe.id)}>
                    {verb}
                  </button>
                )}
                <span className="trial-count">
                  {num(Math.min(have, t.qty))} / {num(t.qty)}
                </span>
              </li>
            );
          })}
        </ul>
        <div className="trial-foot">
          <button className="btn btn-primary btn-sm" disabled={!ready} onClick={submit}>
            Remettre au maître
          </button>
          <span className="muted small">{ready ? 'Les objets seront consommés.' : `Récompense : ${num(open.reward.gold)} or, le surnom et la suite de la progression`}</span>
        </div>
      </div>
    </div>
  );
}

function RecipeList({
  recipes,
  level,
  selectedId,
  onSelect,
  switcher,
}: {
  recipes: Recipe[];
  level: number;
  selectedId: string;
  onSelect: (id: string) => void;
  switcher?: React.ReactNode;
}) {
  const { content, state } = useGame();
  const profession = content.professions.find((p) => p.id === recipes[0]?.profession)!;
  const [category, setCategory] = useState<string | null>(null);
  // L'onglet « Épreuve » n'apparaît que lorsqu'un chef-d'œuvre est à fabriquer.
  const categories = profession.categories.filter((c) => recipes.some((r) => r.category === c.id));
  const filtered = recipes.filter((r) => !category || r.category === category);
  const [page, setPage] = useState(() => Math.floor(Math.max(0, filtered.findIndex((r) => r.id === selectedId)) / PAGE));
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  useEffect(() => setPage((p) => Math.min(p, pages - 1)), [pages]);
  // Une recette choisie ailleurs (« Fabriquer » dans l'épreuve) : afficher sa page.
  useEffect(() => {
    const index = recipes.filter((r) => !category || r.category === category).findIndex((r) => r.id === selectedId);
    if (index !== -1) return setPage(Math.floor(index / PAGE));
    setCategory(null);
    setPage(Math.floor(Math.max(0, recipes.findIndex((r) => r.id === selectedId)) / PAGE));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);
  const visible = filtered.slice(page * PAGE, page * PAGE + PAGE);

  return (
    <section className="panel recipes">
      <header className="recipes-head">
        {switcher ?? <span className="eyebrow">Recettes</span>}
        {categories.length > 1 && (
          <div className="tabs tabs-sm" role="tablist">
            <button role="tab" aria-selected={!category} onClick={() => setCategory(null)}>
              Tout
            </button>
            {categories.map((c) => (
              <button key={c.id} role="tab" aria-selected={category === c.id} onClick={() => setCategory(c.id)}>
                {c.name}
              </button>
            ))}
          </div>
        )}
      </header>
      <div className="recipe-grid">
        {visible.map((r) => {
          const locked = r.level > level;
          const out = content.items[r.outputs[0]!.item];
          const inputs = r.inputs.map((i) => `${i.qty} × ${content.items[i.item]?.name}`).join(' · ');
          return (
            <button
              key={r.id}
              className={`recipe-card${locked ? ' locked' : ''}${r.trial ? ' masterwork' : ''}${r.id === selectedId ? ' selected' : ''}`}
              onClick={() => onSelect(r.id)}
            >
              <ItemIcon item={out} dim={locked} />
              <span className="recipe-text">
                <strong>{r.name}</strong>
                <span className="muted">{inputs || 'Récolte'}</span>
                {state.activity?.recipeId === r.id ? (
                  <span style={{ color: 'var(--action)' }}>En cours</span>
                ) : r.trial ? (
                  <span className="recipe-cat" style={{ color: 'var(--clan)' }}>
                    Chef-d’œuvre de l’épreuve
                  </span>
                ) : (
                  <span className="muted recipe-cat">{profession.categories.find((c) => c.id === r.category)?.name}</span>
                )}
              </span>
              <span className="recipe-level" style={{ color: locked ? 'var(--alert)' : undefined }}>
                niv. {r.level}
              </span>
            </button>
          );
        })}
      </div>
      <footer className="recipes-foot">
        <span className="muted">
          Page {page + 1} sur {pages} · {filtered.length} recettes
        </span>
        <div className="row-gap">
          <button className="btn btn-sm" disabled={page === 0} onClick={() => setPage(page - 1)} aria-label="Page précédente">
            ‹
          </button>
          <button className="btn btn-sm" disabled={page >= pages - 1} onClick={() => setPage(page + 1)} aria-label="Page suivante">
            ›
          </button>
        </div>
      </footer>
    </section>
  );
}

function RecipeDetail({ recipe, level }: { recipe: Recipe; level: number }) {
  const { content, state, act, openMarket } = useGame();
  const live = useLiveActivity();
  const { maxQuantity, queueLength } = content.settings.activity;
  const affordable = Math.min(maxQuantity, maxAffordable(recipe, state.inventory));
  // Un chef-d'œuvre d'épreuve se fabrique à l'unité.
  const [qty, setQty] = useState(() => (recipe.trial ? 1 : Math.max(1, Math.min(100, affordable))));
  const locked = recipe.level > level;
  const running = live && live.recipe.id === recipe.id ? live : null;
  const currentName = state.activity && content.recipes[state.activity.recipeId]?.name;
  const queueFull = state.queue.length >= queueLength;
  const missingInput = recipe.inputs.find((i) => (state.inventory[i.item] ?? 0) < i.qty);
  const clamp = (n: number) => Math.max(1, Math.min(maxQuantity, Math.floor(n) || 1));

  const start = (mode: 'replace' | 'queue') => act(() => api.start(recipe.id, qty, mode));

  return (
    <section className="panel recipe-detail">
      <header className="detail-head">
        <span className="eyebrow" style={{ color: running ? 'var(--action)' : undefined }}>
          {running ? 'En cours' : 'Recette'}
        </span>
        <span className="muted">{content.items[recipe.outputs[0]!.item]?.name}</span>
      </header>

      <div className="detail-main">
        {running ? (
          <Ring value={(running.done + running.fraction) / running.quantity} size={112} stroke={8}>
            <strong>{num(running.done)}</strong>
            <span className="muted">sur {num(running.quantity)}</span>
          </Ring>
        ) : (
          <ItemIcon item={content.items[recipe.outputs[0]!.item]} dim={locked} />
        )}
        <div className="detail-info">
          <h3>{recipe.name}</h3>
          <dl className="kv">
            <dt>Niveau requis</dt>
            <dd style={{ color: locked ? 'var(--alert)' : 'var(--good)' }}>{recipe.level}</dd>
            <dt>Temps</dt>
            <dd>{seconds(recipe.durationSec)}</dd>
            <dt>Gain</dt>
            <dd>
              {decimal(recipe.xp * (state.skills[recipe.profession]?.boost?.multiplier ?? 1))} XP
              {state.skills[recipe.profession]?.boost && <span className="xp-boost small">×{state.skills[recipe.profession]!.boost!.multiplier}</span>}
            </dd>
            <dt>Durée pour {num(qty)}</dt>
            <dd>{duration((qty * recipe.durationSec * 1000) / (state.activity?.rate.total || 1))}</dd>
          </dl>
        </div>
      </div>

      <div className="ingredients">
        <span className="eyebrow">Ingrédients</span>
        {recipe.inputs.length === 0 && <span className="muted">Aucun : c’est une récolte.</span>}
        {recipe.inputs.map((i) => {
          const have = state.inventory[i.item] ?? 0;
          const ok = have >= i.qty * qty;
          return (
            <div key={i.item} className={`ingredient${ok ? '' : ' missing'}`}>
              <ItemIcon item={content.items[i.item]} small />
              <span>
                {i.qty} × {content.items[i.item]?.name}
              </span>
              {/* Ce qui manque : où l'obtenir (métier qui le fabrique, combat, marché), en un clic, sur la même ligne. */}
              <span className="ingredient-sources">{!ok && <SourceChips itemId={i.item} />}</span>
              <span style={{ color: ok ? 'var(--text-muted)' : 'var(--alert)' }}>
                {num(have)} / {num(i.qty * qty)}
              </span>
            </div>
          );
        })}
      </div>

      <div className="launch">
        <div className="qty sunken">
          <button onClick={() => setQty(clamp(qty - 1))} aria-label="Moins">
            −
          </button>
          <input value={qty} inputMode="numeric" onChange={(e) => setQty(clamp(Number(e.target.value)))} aria-label="Quantité" />
          <button onClick={() => setQty(clamp(qty + 1))} aria-label="Plus">
            +
          </button>
          <button onClick={() => setQty(clamp(affordable || 1))}>Max</button>
        </div>
        <button className="btn btn-primary launch-main" disabled={locked || !!missingInput} onClick={() => start('replace')}>
          {missingInput
            ? 'Il manque des matières'
            : state.activity && state.activity.recipeId !== recipe.id
              ? `Lancer à la place de ${currentName}`
              : state.activity
                ? 'Relancer'
                : 'Lancer'}
        </button>
        {state.activity && (
          <button className="btn" disabled={locked || queueFull} onClick={() => start('queue')}>
            Ajouter à la file
          </button>
        )}
      </div>

      <QueueChips startAt={live?.etaAt ?? Date.now()} title="File" />
    </section>
  );
}

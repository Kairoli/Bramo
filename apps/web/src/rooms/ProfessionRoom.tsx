import { useEffect, useState } from 'react';
import { maxAffordable, type Recipe } from '@bramo/shared';
import { api } from '../api';
import { useGame } from '../game/GameContext';
import { useLiveActivity } from '../game/useLive';
import { duration, num, seconds } from '../format';
import { Bar, ItemIcon, Ring } from '../components/ui';
import { Character } from '../rig/Character';
import { QueueChips } from '../components/QueueChips';

const PAGE = 6;

export function ProfessionRoom({ id }: { id: string }) {
  const { content, state, go } = useGame();
  const profession = content.professions.find((p) => p.id === id)!;
  const skill = state.skills[id]!;
  const recipes = Object.values(content.recipes)
    .filter((r) => r.profession === id)
    .sort((a, b) => a.level - b.level);
  const current = state.activity?.recipeId;
  const [selectedId, setSelectedId] = useState<string>(
    recipes.find((r) => r.id === current)?.id ?? [...recipes].reverse().find((r) => r.level <= skill.level)?.id ?? recipes[0]!.id,
  );
  const selected = content.recipes[selectedId]!;
  const span = skill.nextLevelXp ? (skill.xp - skill.levelXp) / (skill.nextLevelXp - skill.levelXp) : 1;

  return (
    <main className="room">
      <section className="panel band">
        <div className="band-label">[Illustration animée : {profession.place}]</div>
        <Character className="band-figure profession-figure" />
        <div className="sunken skill-card">
          <button className="btn btn-sm" onClick={() => go('professions')}>
            ← Tous les métiers
          </button>
          <div className="skill-head">
            <h1>{profession.name}</h1>
            <span className="skill-level">{skill.level}</span>
          </div>
          <div>
            {skill.title}
            {skill.nextTitle && (
              <span className="muted">
                {' '}
                · {skill.nextTitle.name} au niveau {skill.nextTitle.level}
              </span>
            )}
          </div>
          <Bar value={span} />
          <div className="muted skill-xp">
            {num(skill.xp)} XP{skill.nextLevelXp ? ` · encore ${num(skill.nextLevelXp - skill.xp)} pour le niveau ${skill.level + 1}` : ''}
          </div>
        </div>
        {profession.master && (
          <div className="sunken master-bubble">
            <span className="npc-avatar" />
            <div>
              <strong>{profession.master.name}</strong>
              <p className="muted">{profession.master.line}</p>
            </div>
          </div>
        )}
      </section>

      <div className="profession-bottom">
        <RecipeList recipes={recipes} level={skill.level} selectedId={selectedId} onSelect={setSelectedId} />
        <RecipeDetail recipe={selected} level={skill.level} />
      </div>
    </main>
  );
}

function RecipeList({
  recipes,
  level,
  selectedId,
  onSelect,
}: {
  recipes: Recipe[];
  level: number;
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const { content, state } = useGame();
  const profession = content.professions.find((p) => p.id === recipes[0]?.profession)!;
  const [category, setCategory] = useState<string | null>(null);
  const filtered = recipes.filter((r) => !category || r.category === category);
  const [page, setPage] = useState(() => Math.floor(Math.max(0, filtered.findIndex((r) => r.id === selectedId)) / PAGE));
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  useEffect(() => setPage((p) => Math.min(p, pages - 1)), [pages]);
  const visible = filtered.slice(page * PAGE, page * PAGE + PAGE);

  return (
    <section className="panel recipes">
      <header className="recipes-head">
        <span className="eyebrow">Recettes</span>
        {profession.categories.length > 1 && (
          <div className="tabs tabs-sm" role="tablist">
            <button role="tab" aria-selected={!category} onClick={() => setCategory(null)}>
              Tout
            </button>
            {profession.categories.map((c) => (
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
              className={`recipe-card${locked ? ' locked' : ''}${r.id === selectedId ? ' selected' : ''}`}
              onClick={() => onSelect(r.id)}
            >
              <ItemIcon item={out} dim={locked} />
              <span className="recipe-text">
                <strong>{r.name}</strong>
                <span className="muted">{inputs || 'Récolte'}</span>
                {state.activity?.recipeId === r.id ? (
                  <span style={{ color: 'var(--action)' }}>En cours</span>
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
  const { content, state, act, setShopOpen } = useGame();
  const live = useLiveActivity();
  const { maxQuantity, queueLength } = content.settings.activity;
  const affordable = Math.min(maxQuantity, maxAffordable(recipe, state.inventory));
  const [qty, setQty] = useState(() => Math.max(1, Math.min(100, affordable)));
  const locked = recipe.level > level;
  const running = live && live.recipe.id === recipe.id ? live : null;
  const currentName = state.activity && content.recipes[state.activity.recipeId]?.name;
  const queueFull = state.queue.length >= queueLength;
  const missingShopItem = recipe.inputs.some((i) => (state.inventory[i.item] ?? 0) < i.qty && content.items[i.item]?.shopPrice);
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
            <dd>{num(recipe.xp)} XP</dd>
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
            <div key={i.item} className="ingredient">
              <ItemIcon item={content.items[i.item]} small />
              <span>
                {i.qty} × {content.items[i.item]?.name}
              </span>
              <span style={{ color: ok ? 'var(--text-muted)' : 'var(--alert)' }}>
                {num(have)} / {num(i.qty * qty)}
              </span>
            </div>
          );
        })}
        {missingShopItem && (
          <button className="link" style={{ color: 'var(--market)', justifySelf: 'start' }} onClick={() => setShopOpen(true)}>
            Acheter au marchand du port →
          </button>
        )}
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
        <button className="btn btn-primary launch-main" disabled={locked} onClick={() => start('replace')}>
          {state.activity && state.activity.recipeId !== recipe.id ? `Lancer à la place de ${currentName}` : state.activity ? 'Relancer' : 'Lancer'}
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

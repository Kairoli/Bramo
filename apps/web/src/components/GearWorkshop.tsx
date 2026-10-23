import { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import { useGame } from '../game/GameContext';
import { num } from '../format';
import { GearIcon } from './GearIcon';
import { ItemIcon, Modal } from './ui';

/**
 * L'atelier d'équipement d'un métier (Forge, Tannerie, Couture, Joaillerie, Menuiserie, Enchantement) : on choisit
 * l'emplacement, la classe et la rareté, puis la pièce ; sa recette dit les matières (celles qu'on a, celles qui
 * manquent). La pièce sort dans le sac d'équipement, ses lignes tirées ; parfois un chef-d'œuvre, signé.
 */

type Recipes = Awaited<ReturnType<typeof api.gearRecipes>>;
const RARITY: Record<string, string> = { common: 'Commun', rare: 'Rare', epic: 'Épique', legendary: 'Légendaire' };

export function GearWorkshop({ profession, onClose }: { profession: string; onClose: () => void }) {
  const { content, state, act } = useGame();
  const [data, setData] = useState<Recipes | null>(null);
  const [slot, setSlot] = useState<string>('');
  const [cls, setCls] = useState<string>(state.classId ?? '');
  const [rarity, setRarity] = useState<string>('rare');
  const load = () => {
    api
      .gearRecipes(profession)
      .then(setData)
      .catch(() => setData({ level: 0, models: [] }));
  };
  useEffect(load, [profession]);
  const name = content.professions.find((p) => p.id === profession)?.name ?? profession;
  const slots = useMemo(() => [...new Set((data?.models ?? []).map((m) => m.slot))], [data]);
  const list = (data?.models ?? []).filter((m) => (!slot || m.slot === slot) && (!cls || m.classes.includes(cls)) && (!rarity || m.rarity === rarity));
  // Les plus hauts paliers accessibles d'abord : c'est ce qu'on vient chercher.
  const shown = [...list].sort((a, b) => b.tier - a.tier || a.slot.localeCompare(b.slot)).slice(0, 40);

  return (
    <Modal onClose={onClose} className="workshop-modal">
      <span className="eyebrow">Atelier d’équipement · {name} niveau {data?.level ?? '…'}</span>
      <h2>Fabriquer une pièce</h2>
      <p className="muted small">
        Vous choisissez la pièce (sa rareté, son orientation) ; ses bonus se tirent à la fabrication. Plus vous dépassez le niveau de la recette, plus le chef-d’œuvre est probable : toutes
        les lignes au maximum, et votre nom dessus. Une pièce se porte, ou se vend à la vitrine du marché.
      </p>
      <div className="workshop-filters">
        <select className="input" value={slot} onChange={(e) => setSlot(e.target.value)}>
          <option value="">Tous les emplacements</option>
          {slots.map((s) => (
            <option key={s} value={s}>
              {content.gearSlots[s]?.name ?? s}
            </option>
          ))}
        </select>
        <select className="input" value={cls} onChange={(e) => setCls(e.target.value)}>
          <option value="">Toutes les classes</option>
          {Object.values(content.classes).map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select className="input" value={rarity} onChange={(e) => setRarity(e.target.value)}>
          <option value="">Toutes les raretés</option>
          {Object.entries(RARITY).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </div>
      {!data && <p className="muted">Chargement…</p>}
      {data && !shown.length && <p className="muted small">Rien à fabriquer avec ces filtres.</p>}
      <ul className="workshop-list scroll">
        {shown.map((m) => {
          const ok = m.recipe.level <= data!.level;
          const enough = m.recipe.inputs.every((i) => (state.inventory[i.item] ?? 0) >= i.qty);
          return (
            <li key={m.id} className={`workshop-row r-${m.rarity}${ok ? '' : ' locked'}`}>
              <GearIcon slot={m.slot} family={m.family} tier={m.tier} rarity={m.rarity} size={44} />
              <span className="workshop-name">
                <strong>{m.name}</strong>
                <span className="muted small">
                  {RARITY[m.rarity]} · palier {m.tier} · {content.gearSlots[m.slot]?.name ?? m.slot} · {m.orientation === 'offensive' ? 'offensive' : 'protectrice'} ·{' '}
                  {m.classes.map((c) => content.classes[c]?.name ?? c).join(', ')}
                </span>
              </span>
              <span className="workshop-inputs">
                {m.recipe.inputs.map((i) => {
                  const have = state.inventory[i.item] ?? 0;
                  return (
                    <span key={i.item} className={have >= i.qty ? '' : 'missing'} title={content.items[i.item]?.name}>
                      <ItemIcon item={content.items[i.item]} small /> {num(Math.min(have, i.qty))}/{num(i.qty)}
                    </span>
                  );
                })}
              </span>
              <button
                className="btn btn-sm btn-primary"
                disabled={!ok || !enough}
                title={!ok ? `Niveau ${m.recipe.level} requis` : enough ? `+${num(m.recipe.xp)} XP` : 'Il manque des matières'}
                onClick={() => void act(() => api.gearCraft(m.id)).then(load)}
              >
                {ok ? 'Fabriquer' : `Niv. ${m.recipe.level}`}
              </button>
            </li>
          );
        })}
      </ul>
    </Modal>
  );
}

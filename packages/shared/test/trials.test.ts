import { describe, expect, it } from 'vitest';
import { advance } from '../src/engine/advance.js';
import { chooseClass, startActivity } from '../src/engine/actions.js';
import { completeTrial, effectiveLevel, heldXp, setNickname, skillLevel } from '../src/engine/trials.js';
import { viewState } from '../src/engine/view.js';
import { HOUR, T0, content, makeState, mining } from './fixture.js';

const xpAt = (level: number) => content.xpTable[level]!;
const atLevel = (level: number) => ({ mining: xpAt(level) });

describe('rangs : commandes du maître', () => {
  it('sans la commande, le niveau reste au palier mais l’XP s’accumule', () => {
    const xp = xpAt(45);
    expect(effectiveLevel(xp, 'mining', [], content)).toBe(20);
    expect(heldXp(xp, 'mining', [], content)).toBe(xp - xpAt(21));
    // Commande du 20 réussie : on monte jusqu’au palier suivant (40), rien n’a été perdu.
    expect(effectiveLevel(xp, 'mining', ['mining_20'], content)).toBe(40);
    expect(heldXp(xp, 'mining', ['mining_20'], content)).toBe(xp - xpAt(41));
    expect(effectiveLevel(xp, 'mining', ['mining_20', 'mining_40'], content)).toBe(45);
    expect(heldXp(xp, 'mining', ['mining_20', 'mining_40'], content)).toBe(0);
  });

  it('le moteur applique le palier : pas de recette plus haute, niveau bloqué, XP gardée', () => {
    const s = makeState({ skills: atLevel(25) });
    expect(skillLevel(s, 'mining', content)).toBe(20);
    expect(() => startActivity(s, 'hard', 1, 'replace', T0, content)).toThrow('Niveau');
    // Une longue séance de travail bloquée au palier continue de rapporter de l’XP.
    const worked = advance(makeState({ skills: atLevel(20), activity: mining() }), T0 + 4 * HOUR, content).state;
    expect(worked.skills.mining).toBeGreaterThan(xpAt(20));
    expect(skillLevel(worked, 'mining', content)).toBe(20);
  });

  it('le niveau bloqué ne produit pas de montée de niveau avant la validation', () => {
    const near = makeState({ skills: { mining: xpAt(21) - 5 }, activity: mining() });
    const { summary } = advance(near, T0 + 10 * 60_000, content);
    expect(summary.levelUps).toEqual([]);
  });

  it('remettre les objets consomme le sac, donne l’or et le surnom, et débloque la tranche', () => {
    const s = completeTrial(makeState({ skills: atLevel(25), inventory: { ore: 12 } }), 'mining_20', content);
    expect(s.inventory.ore).toBe(2);
    expect(s.gold).toBe(150);
    expect(s.trials).toEqual(['mining_20']);
    expect(skillLevel(s, 'mining', content)).toBe(25);
    const view = viewState(s, T0, content);
    expect(view.skills.mining).toMatchObject({ nickname: 'Gratteur', shownRank: 20, heldXp: 0 });
    expect(view.trials).toMatchObject({ mining_20: 'done', mining_40: 'locked' });
  });

  it('refuse trop tôt, incomplet, déjà fait ou dans le désordre', () => {
    expect(() => completeTrial(makeState({ inventory: { ore: 10 } }), 'mining_20', content)).toThrow('Niveau 20 requis');
    expect(() => completeTrial(makeState({ skills: atLevel(20), inventory: { ore: 4 } }), 'mining_20', content)).toThrow('Il manque 6 × Minerai.');
    expect(() => completeTrial(makeState({ skills: atLevel(20), inventory: { ore: 10 }, trials: ['mining_20'] }), 'mining_20', content)).toThrow('déjà réussie');
    expect(() => completeTrial(makeState({ skills: atLevel(60), inventory: { bar: 1 } }), 'mining_40', content)).toThrow('d’abord');
  });

  it('le chef-d’œuvre ne se fabrique que pendant la commande', () => {
    expect(() => startActivity(makeState({ skills: atLevel(20), trials: ['mining_20'] }), 'masterpiece', 1, 'replace', T0, content)).toThrow('chef-d’œuvre');
    expect(startActivity(makeState({ skills: atLevel(20) }), 'masterpiece', 1, 'replace', T0, content).activity?.recipeId).toBe('masterpiece');
  });

  it('la vue indique la prochaine commande, atteinte ou non', () => {
    expect(viewState(makeState({ skills: atLevel(12) }), T0, content).skills.mining?.next).toMatchObject({
      rank: 20,
      trialId: 'mining_20',
      nickname: 'Gratteur',
      reached: false,
    });
    const blocked = viewState(makeState({ skills: atLevel(30) }), T0, content).skills.mining!;
    expect(blocked.next?.reached).toBe(true);
    expect(blocked.level).toBe(20);
    expect(blocked.heldXp).toBe(xpAt(30) - xpAt(21));
  });

  it('on affiche le surnom de son choix parmi ceux débloqués, même après un rang supérieur', () => {
    let s = makeState({ skills: atLevel(45), trials: ['mining_20', 'mining_40'], shown: { mining: 40 } });
    expect(viewState(s, T0, content).skills.mining?.nickname).toBe('Chuchoteur');
    s = setNickname(s, 'mining', 20, content);
    expect(viewState(s, T0, content).skills.mining?.nickname).toBe('Gratteur');
    s = setNickname(s, 'mining', 0, content);
    expect(viewState(s, T0, content).skills.mining?.nickname).toBe('Gratte-sol');
    expect(() => setNickname(makeState({ trials: ['mining_20'] }), 'mining', 40, content)).toThrow('pas encore débloqué');
    expect(() => setNickname(s, 'mining', 33, content)).toThrow('n’existe pas');
  });
});

describe('classe', () => {
  it('se choisit, se change librement et donne la tenue de départ', () => {
    const fresh = makeState({ classId: null });
    expect(viewState(fresh, T0, content).appearance).toBeNull();
    const chosen = chooseClass(fresh, 'mage', content);
    expect(viewState(chosen, T0, content).appearance).toEqual({ classId: 'mage', outfit: 'plain' });
    expect(chooseClass(chosen, 'brute', content).classId).toBe('brute');
    expect(() => chooseClass(chosen, 'mage', content)).toThrow('déjà');
    expect(() => chooseClass(chosen, 'nope', content)).toThrow('inconnue');
  });
});

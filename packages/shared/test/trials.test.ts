import { describe, expect, it } from 'vitest';
import { chooseClass, startActivity } from '../src/engine/actions.js';
import { completeTrial, earnedTitle } from '../src/engine/trials.js';
import { viewState } from '../src/engine/view.js';
import { T0, content, makeState } from './fixture.js';

const atLevel = (level: number) => ({ mining: content.xpTable[level]! });

describe('épreuves des maîtres', () => {
  it('le titre d’un palier attend son épreuve, pas le niveau', () => {
    expect(earnedTitle('mining', 45, [], content)).toMatchObject({ name: 'Novice', pendingTrial: { id: 'mining_30' } });
    expect(earnedTitle('mining', 45, ['mining_30'], content)).toMatchObject({ name: 'Apprenti', pendingTrial: null });
    // On ne saute pas une épreuve : au niveau 70, il faut d'abord celle du 30.
    expect(earnedTitle('mining', 70, [], content).pendingTrial?.id).toBe('mining_30');
    // Un palier sans épreuve (Maître 85) reste automatique.
    expect(earnedTitle('mining', 90, ['mining_30', 'mining_60'], content).name).toBe('Maître');
  });

  it('remettre les objets consomme le sac, donne l’or et le titre', () => {
    const s = completeTrial(makeState({ skills: atLevel(30), inventory: { ore: 12 } }), 'mining_30', content);
    expect(s.inventory.ore).toBe(2);
    expect(s.gold).toBe(150);
    expect(s.trials).toEqual(['mining_30']);
    const view = viewState(s, T0, content);
    expect(view.skills.mining?.title).toBe('Apprenti');
    expect(view.trials).toMatchObject({ mining_30: 'done', mining_60: 'locked' });
  });

  it('refuse une épreuve trop tôt, incomplète, déjà faite ou dans le désordre', () => {
    expect(() => completeTrial(makeState({ inventory: { ore: 10 } }), 'mining_30', content)).toThrow('Niveau 30 requis');
    expect(() => completeTrial(makeState({ skills: atLevel(30), inventory: { ore: 4 } }), 'mining_30', content)).toThrow(
      'Il manque 6 × Minerai.',
    );
    expect(() =>
      completeTrial(makeState({ skills: atLevel(30), inventory: { ore: 10 }, trials: ['mining_30'] }), 'mining_30', content),
    ).toThrow('déjà réussie');
    expect(() => completeTrial(makeState({ skills: atLevel(60), inventory: { bar: 1 } }), 'mining_60', content)).toThrow(
      'd’abord',
    );
  });

  it('le chef-d’œuvre ne se fabrique que pendant l’épreuve', () => {
    expect(() => startActivity(makeState({ skills: atLevel(30), trials: ['mining_30'] }), 'masterpiece', 1, 'replace', T0, content)).toThrow(
      'épreuve',
    );
    expect(startActivity(makeState({ skills: atLevel(30) }), 'masterpiece', 1, 'replace', T0, content).activity?.recipeId).toBe(
      'masterpiece',
    );
  });

  it('le prochain titre indique l’épreuve qui le donne', () => {
    const view = viewState(makeState({ skills: atLevel(12) }), T0, content);
    expect(view.skills.mining?.nextTitle).toEqual({ level: 30, name: 'Apprenti', trialId: 'mining_30' });
  });
});

describe('classe', () => {
  it('se choisit, se change librement et donne la tenue de départ', () => {
    const fresh = makeState({ classId: null });
    expect(viewState(fresh, T0, content).appearance).toBeNull();
    const chosen = chooseClass(fresh, 'brute', content);
    expect(viewState(chosen, T0, content).appearance).toEqual({ classId: 'brute', outfit: 'plain' });
    expect(chooseClass(chosen, 'mage', content).classId).toBe('mage');
    expect(() => chooseClass(chosen, 'brute', content)).toThrow('déjà votre classe');
    expect(() => chooseClass(chosen, 'inconnue', content)).toThrow('Classe inconnue');
  });
});

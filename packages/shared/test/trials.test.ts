import { describe, expect, it } from 'vitest';
import { advance } from '../src/engine/advance.js';
import { chooseClass, chooseOutfit, setLook, startActivity, unlockedOutfits } from '../src/engine/actions.js';
import { chooseOrnament, completeTrial, effectiveLevel, heldXp, setNickname, skillLevel, unlockedOrnaments } from '../src/engine/trials.js';
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

describe('rangs sans blocage du niveau (settings.ranks.gatesLevel = false)', () => {
  const free = { ...content, settings: { ...content.settings, ranks: { ...content.settings.ranks, gatesLevel: false } } };

  it('le niveau monte librement : la commande ne donne que le surnom', () => {
    const xp = xpAt(45);
    expect(effectiveLevel(xp, 'mining', [], free)).toBe(45);
    expect(heldXp(xp, 'mining', [], free)).toBe(0);
    const view = viewState(makeState({ skills: atLevel(45) }), T0, free);
    expect(view.skills.mining).toMatchObject({ level: 45, gated: false, nickname: 'Gratte-sol' });
    expect(view.skills.mining?.next).toMatchObject({ rank: 20, reached: true });
    const done = completeTrial(makeState({ skills: atLevel(45), inventory: { ore: 10 } }), 'mining_20', free);
    expect(viewState(done, T0, free).skills.mining?.nickname).toBe('Gratteur');
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

describe('tenue', () => {
  it('se change librement parmi les tenues débloquées de sa classe', () => {
    const s = makeState({ classId: 'mage' });
    expect(unlockedOutfits(s, content)).toEqual(['plain', 'plain_alt']);
    expect(chooseOutfit(s, 'plain', content).outfit).toBe('plain');
    expect(viewState(chooseOutfit(s, 'plain', content), T0, content).appearance).toEqual({ classId: 'mage', outfit: 'plain' });
    expect(() => chooseOutfit(s, 'nope', content)).toThrow('inconnue');
  });

  it('n’emprunte que les styles de sa classe, et pas les tenues verrouillées', () => {
    const s = makeState({ classId: 'mage' });
    expect(() => chooseOutfit(s, 'brute_garb', content)).toThrow('style de votre classe');
    expect(() => chooseOutfit(s, 'season', content)).toThrow('pas encore débloquée');
    // Changer de classe : la tenue qui ne va pas à la nouvelle classe est remplacée par sa tenue de départ.
    const wearing = chooseOutfit(s, 'plain_alt', content);
    const brute = chooseClass(wearing, 'brute', content);
    expect(brute.outfit).toBeNull();
    expect(viewState(brute, T0, content).appearance?.outfit).toBe('brute_garb');
    // Un ancien personnage qui porte une tenue d'une autre classe est affiché avec sa tenue de départ.
    const legacy = makeState({ classId: 'mage', outfit: 'brute_garb' });
    expect(viewState(legacy, T0, content).appearance?.outfit).toBe('plain');
  });

  it('l’apparence pièce par pièce ne touche pas à l’équipement et reste dans le style de la classe', () => {
    const s = makeState({ classId: 'mage', gold: 123, inventory: { ore: 5 } });
    expect(viewState(s, T0, content).lookOptions.headwear).toEqual(['hood', 'crown']);
    const changed = setLook(s, 'headwear', 'crown', content);
    expect(changed.look).toEqual({ headwear: 'crown' });
    expect(changed.gold).toBe(123);
    expect(changed.inventory).toEqual({ ore: 5 });
    expect(viewState(changed, T0, content).appearance?.overrides).toEqual({ headwear: 'crown' });
    expect(setLook(changed, 'headwear', null, content).look).toEqual({});
    expect(() => setLook(s, 'headwear', 'helm', content)).toThrow('pas disponible');
    expect(() => setLook(s, 'headwear', 'tide', content)).toThrow('pas disponible');
    expect(() => setLook(s, 'cape', 'x', content)).toThrow('pas d’apparence');
    // Changer de tenue repart de zéro.
    expect(chooseOutfit(changed, 'plain', content).look).toEqual({});
  });
});

describe('ornements de métier', () => {
  it('celui d’une commande réussie se porte ; la variante en réserve, jamais sans essais', () => {
    expect(unlockedOrnaments(makeState(), content)).toEqual([]);
    expect(() => chooseOrnament(makeState(), 'mining_20', content)).toThrow('commande du maître');
    const s = chooseOrnament(makeState({ trials: ['mining_20'] }), 'mining_20', content);
    expect(viewState(s, T0, content)).toMatchObject({ ornament: 'mining_20', unlockedOrnaments: ['mining_20'] });
    expect(() => chooseOrnament(s, 'mining_90', content)).toThrow('commande du maître');
    expect(() => chooseOrnament(s, 'nope', content)).toThrow('inconnu');
    expect(chooseOrnament(s, null, content).ornament).toBeNull();
  });

  it('settings.ornaments.unlockAll : tous portables, réserve comprise', () => {
    const all = { ...content, settings: { ...content.settings, ornaments: { unlockAll: true } } };
    expect(unlockedOrnaments(makeState(), all)).toEqual(['mining_20', 'mining_90']);
    const s = chooseOrnament(makeState(), 'mining_90', all);
    expect(viewState(s, T0, all).ornament).toBe('mining_90');
    // Les essais finis, l'ornement non débloqué n'est plus affiché (le choix reste enregistré).
    expect(viewState(s, T0, content).ornament).toBeNull();
  });
});

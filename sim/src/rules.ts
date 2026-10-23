/**
 * Règles d'équilibrage proposées (docs/design/progression.md et economie.md).
 * Le simulateur s'en sert pour recalculer les données d'une proposition et pour les vérifier.
 */

/** XP par heure effective de la meilleure recette de récolte débloquée au niveau L. */
export function referenceXpPerHour(level: number): number {
  return 400 * 2 ** ((level - 1) / 55);
}

/** Durée d'une action de récolte débloquée au niveau L : 12 s + 2 s par dizaine. */
export function gatherDurationSec(level: number): number {
  return 12 + 2 * Math.floor(level / 10);
}

/** Une heure d'artisanat (matériaux achetés) rapporte 1,75 fois l'XP d'une heure de récolte de même niveau. */
export const CRAFT_XP_FACTOR = 1.75;

/** XP d'une recette selon la règle (arrondie au dixième). */
export function ruleXp(level: number, durationSec: number, crafting: boolean): number {
  const perHour = referenceXpPerHour(level) * (crafting ? CRAFT_XP_FACTOR : 1);
  return Math.round((perHour * durationSec) / 360) / 10;
}

/** Un repas doit rapporter environ 2 fois le temps de chaîne qu'il coûte (joueur autonome). */
export const MEAL_PAYBACK = 2;

/** Valeur de référence : 10 000 or par heure de travail autonome (outils de base ; monnaie ×10 depuis le 23 octobre). */
export const GOLD_PER_WORK_HOUR = 10000;

/** Le marchand PNJ rachète à 10 % de la valeur de référence (plafonné par semaine) : un plancher, pas un débouché. */
export const NPC_BUYBACK = 0.1;

/** Une parcelle·heure compte comme une minute de travail dans les comparaisons de coût. */
export const PLOT_HOUR_AS_SEC = 60;

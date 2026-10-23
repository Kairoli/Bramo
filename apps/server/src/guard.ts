/**
 * Garde-fous des comptes (sortie publique, 23 octobre) : tout se compte en mémoire, sur un seul serveur. Un redémarrage
 * remet les compteurs à zéro, ce qui ne gêne pas : ils ne servent qu'à freiner les essais en rafale.
 *
 * - Essais de connexion : au plus `loginFailures.max` mots de passe erronés par pseudo et par adresse en `windowMin` minutes.
 * - Créations de comptes : au plus `registrationsPerIpPerDay` par adresse et par jour (freine les comptes jetables).
 *
 * Pas de limite « un compte connecté par adresse » [Décidé par Louis, 23 octobre : retirée, un foyer partage la même adresse].
 */
import type { Content } from '@bramo/shared';

const MIN = 60_000;
const DAY = 86_400_000;

export class GuardError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export class AccountGuard {
  private failures = new Map<string, number[]>();
  private registrations = new Map<string, number[]>();

  constructor(private readonly content: Content) {}

  private get rules() {
    return this.content.settings.security;
  }

  private recent(map: Map<string, number[]>, key: string, since: number): number[] {
    const list = (map.get(key) ?? []).filter((t) => t >= since);
    if (list.length) map.set(key, list);
    else map.delete(key);
    return list;
  }

  /** Avant de vérifier un mot de passe : refuse si ce pseudo a trop échoué depuis cette adresse. */
  checkLogin(ip: string, username: string, now: number): void {
    const { max, windowMin } = this.rules.loginFailures;
    const list = this.recent(this.failures, `${ip}|${username.toLowerCase()}`, now - windowMin * MIN);
    if (list.length >= max) {
      const wait = Math.max(1, Math.ceil((list[0]! + windowMin * MIN - now) / MIN));
      throw new GuardError(429, 'too_many_attempts', `Trop d’essais. Réessayez dans ${wait} minute${wait > 1 ? 's' : ''}.`);
    }
  }

  loginFailed(ip: string, username: string, now: number): void {
    const key = `${ip}|${username.toLowerCase()}`;
    this.failures.set(key, [...(this.failures.get(key) ?? []), now]);
  }

  loginSucceeded(ip: string, username: string): void {
    this.failures.delete(`${ip}|${username.toLowerCase()}`);
  }

  /** Avant de créer un compte. */
  checkRegister(ip: string, now: number): void {
    const list = this.recent(this.registrations, ip, now - DAY);
    if (list.length >= this.rules.registrationsPerIpPerDay) {
      throw new GuardError(429, 'too_many_accounts', 'Trop de comptes créés depuis cette connexion aujourd’hui. Réessayez demain.');
    }
  }

  registered(ip: string, now: number): void {
    this.registrations.set(ip, [...(this.registrations.get(ip) ?? []), now]);
  }
}

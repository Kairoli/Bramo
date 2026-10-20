import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { and, eq, gt } from 'drizzle-orm';
import type { Db } from './db/index.js';
import { sessions } from './db/schema.js';

const scryptAsync = promisify(scrypt) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;

export const SESSION_COOKIE = 'bramo_session';
export const SESSION_DAYS = 30;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scryptAsync(password, salt, 64);
  return `scrypt$${salt.toString('base64')}$${hash.toString('base64')}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algo, salt, hash] = stored.split('$');
  if (algo !== 'scrypt' || !salt || !hash) return false;
  const expected = Buffer.from(hash, 'base64');
  const actual = await scryptAsync(password, Buffer.from(salt, 'base64'), expected.length);
  return timingSafeEqual(actual, expected);
}

const digest = (token: string) => createHash('sha256').update(token).digest('base64url');

/** Crée une session et renvoie le jeton à placer dans le cookie. */
export async function createSession(db: Db, accountId: number, now: Date): Promise<string> {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(now.getTime() + SESSION_DAYS * 86_400_000);
  await db.insert(sessions).values({ id: digest(token), accountId, expiresAt });
  return token;
}

export async function accountForToken(db: Db, token: string | undefined, now: Date): Promise<number | null> {
  if (!token) return null;
  const [row] = await db
    .select({ accountId: sessions.accountId })
    .from(sessions)
    .where(and(eq(sessions.id, digest(token)), gt(sessions.expiresAt, now)));
  return row?.accountId ?? null;
}

export async function deleteSession(db: Db, token: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.id, digest(token)));
}

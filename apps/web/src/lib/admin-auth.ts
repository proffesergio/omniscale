import 'server-only';
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

const COOKIE = 'omniscale_admin';
const SESSION_HOURS = 12;
const MIN_TOKEN_LENGTH = 32;

function configuredToken(): string | null {
  const token = process.env.ADMIN_TOKEN;
  return token && token.length >= MIN_TOKEN_LENGTH ? token : null;
}

export function adminTokenConfigured(): boolean {
  return configuredToken() !== null;
}

export function verifyAdminToken(candidate: string): boolean {
  const expected = configuredToken();
  if (!expected || !candidate) return false;
  const a = createHash('sha256').update(candidate).digest();
  const b = createHash('sha256').update(expected).digest();
  return timingSafeEqual(a, b);
}

/** Sealed session value: `<expiry-base36>.<hmac>`. Pure for testability. */
export function sealAdminSession(secret: string, expiresAt: number): string {
  const body = expiresAt.toString(36);
  const sig = createHmac('sha256', secret).update(body).digest('hex');
  return `${body}.${sig}`;
}

/** Returns the expiry timestamp when the sealed value is authentic and fresh. */
export function openAdminSession(secret: string, raw: string, now: number): number | null {
  const [body, sig] = raw.split('.');
  if (!body || !sig) return null;
  const good = createHmac('sha256', secret).update(body).digest('hex');
  const a = Buffer.from(sig);
  const b = Buffer.from(good);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  const expiresAt = parseInt(body, 36);
  if (!Number.isFinite(expiresAt) || expiresAt <= now) return null;
  return expiresAt;
}

export async function createAdminSession() {
  const secret = configuredToken();
  if (!secret) throw new Error('Admin access is not configured');
  const store = await cookies();
  store.set(COOKIE, sealAdminSession(secret, Date.now() + SESSION_HOURS * 3600 * 1000), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_HOURS * 3600,
  });
}

export async function destroyAdminSession() {
  const store = await cookies();
  store.delete(COOKIE);
}

export async function getAdminSession(): Promise<boolean> {
  const secret = configuredToken();
  if (!secret) return false;
  const store = await cookies();
  const raw = store.get(COOKIE)?.value;
  if (!raw) return false;
  return openAdminSession(secret, raw, Date.now()) !== null;
}

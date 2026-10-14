import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import {
  openAdminSession,
  sealAdminSession,
  verifyAdminToken,
} from '@/lib/admin-auth';

const SECRET = 'a'.repeat(40);

describe('admin token verification', () => {
  it('accepts the configured token and rejects anything else', () => {
    process.env.ADMIN_TOKEN = SECRET;
    expect(verifyAdminToken(SECRET)).toBe(true);
    expect(verifyAdminToken(`${SECRET}x`)).toBe(false);
    expect(verifyAdminToken('')).toBe(false);
    expect(verifyAdminToken('wrong')).toBe(false);
  });

  it('fails closed when the token is missing or too short', () => {
    process.env.ADMIN_TOKEN = 'short';
    expect(verifyAdminToken('short')).toBe(false);
    delete process.env.ADMIN_TOKEN;
    expect(verifyAdminToken(SECRET)).toBe(false);
    process.env.ADMIN_TOKEN = SECRET;
  });
});

describe('sealed admin sessions', () => {
  it('round-trips an authentic fresh seal', () => {
    const now = Date.now();
    const raw = sealAdminSession(SECRET, now + 3600_000);
    expect(openAdminSession(SECRET, raw, now)).toBe(now + 3600_000);
  });

  it('rejects tampered, expired, foreign-secret, and malformed seals', () => {
    const now = Date.now();
    const raw = sealAdminSession(SECRET, now + 3600_000);
    expect(openAdminSession(SECRET, `${raw}x`, now)).toBeNull();
    expect(openAdminSession(SECRET, raw, now + 7200_000)).toBeNull();
    expect(openAdminSession('b'.repeat(40), raw, now)).toBeNull();
    expect(openAdminSession(SECRET, 'garbage', now)).toBeNull();
    expect(openAdminSession(SECRET, '', now)).toBeNull();
  });
});

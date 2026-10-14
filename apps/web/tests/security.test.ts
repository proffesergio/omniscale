import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
const rpc = vi.hoisted(() => vi.fn());
vi.mock('@/lib/supabase', () => ({ db: () => ({ rpc }) }));
import {
  assertOrigin,
  internalAuthorized,
  readJson,
  rateLimit,
  secretHash,
  tokenHash,
} from '@/lib/security';
beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://omniscale.example');
  vi.stubEnv('RATE_LIMIT_SECRET', 'a'.repeat(64));
  vi.stubEnv('CRON_SECRET', 'b'.repeat(64));
  vi.stubEnv('TRUSTED_IP_HEADER', '');
  rpc.mockReset();
  rpc.mockResolvedValue({ data: true, error: null });
});
describe('Request boundaries', () => {
  it('rejects missing and foreign origins', () => {
    expect(() => assertOrigin(new Headers())).toThrow();
    expect(() => assertOrigin(new Headers({ origin: 'https://attacker.test' }))).toThrow();
    expect(() => assertOrigin(new Headers({ origin: 'https://omniscale.example' }))).not.toThrow();
  });
  it('requires exact internal bearer credentials', () => {
    expect(internalAuthorized(new Request('https://omniscale.example'))).toBe(false);
    expect(
      internalAuthorized(
        new Request('https://omniscale.example', {
          headers: { authorization: `Bearer ${'b'.repeat(64)}` },
        }),
      ),
    ).toBe(true);
  });
  it('rejects oversized JSON even without a Content-Length header', async () => {
    const request = new Request('https://omniscale.example', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'a'.repeat(20000) }),
    });
    await expect(readJson(request)).rejects.toMatchObject({ status: 413 });
  });
  it('rejects malformed JSON and unsupported media types', async () => {
    await expect(
      readJson(
        new Request('https://omniscale.example', {
          method: 'POST',
          body: '{',
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    ).rejects.toMatchObject({ status: 400 });
    await expect(
      readJson(new Request('https://omniscale.example', { method: 'POST', body: 'abc' })),
    ).rejects.toMatchObject({ status: 415 });
  });
  it('fails closed when the shared rate limit cannot be checked', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'offline' } });
    await expect(rateLimit(new Headers(), 'alex@example.com', 'audit')).rejects.toMatchObject({
      status: 503,
    });
  });
  it('uses hashed keys and does not trust arbitrary forwarded IP headers', async () => {
    await rateLimit(new Headers({ 'x-forwarded-for': '1.2.3.4' }), 'alex@example.com', 'audit');
    expect(rpc).toHaveBeenCalledTimes(2);
    expect(JSON.stringify(rpc.mock.calls)).not.toContain('alex@example.com');
    expect(JSON.stringify(rpc.mock.calls)).not.toContain('1.2.3.4');
  });
  it('returns a rate limit response when the atomic database budget is spent', async () => {
    rpc.mockResolvedValue({ data: false, error: null });
    await expect(rateLimit(new Headers(), 'alex@example.com', 'audit')).rejects.toMatchObject({
      status: 429,
    });
  });
  it('derives stable opaque management tokens and hashes them for storage', () => {
    const token = secretHash('booking-management:example');
    expect(token).toMatch(/^[a-f0-9]{64}$/);
    expect(tokenHash(token)).not.toBe(token);
    expect(secretHash('booking-management:example')).toBe(token);
  });
});

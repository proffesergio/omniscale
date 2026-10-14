import { describe, expect, it } from 'vitest';
import {
  decodeCursor,
  encodeCursor,
  parseAvailabilityQuery,
  AVAILABILITY_DEFAULT_LIMIT,
} from '@/lib/pagination';

describe('page cursors', () => {
  it('round-trips a timestamp and id through an opaque cursor', () => {
    const raw = encodeCursor('2026-10-20T10:00:00.000Z', '123e4567-e89b-12d3-a456-426614174000');
    expect(decodeCursor(raw)).toEqual({
      t: '2026-10-20T10:00:00.000Z',
      id: '123e4567-e89b-12d3-a456-426614174000',
    });
  });

  it('rejects missing, malformed, and forged cursors', () => {
    expect(decodeCursor(null)).toBeNull();
    expect(decodeCursor(undefined)).toBeNull();
    expect(decodeCursor('')).toBeNull();
    expect(decodeCursor('not-a-cursor')).toBeNull();
    expect(
      decodeCursor(Buffer.from(JSON.stringify({ t: 'nope', id: 'nope' })).toString('base64url')),
    ).toBeNull();
    expect(
      decodeCursor(
        Buffer.from(
          JSON.stringify({ t: '2026-10-20T10:00:00.000Z', id: 'not-a-uuid' }),
        ).toString('base64url'),
      ),
    ).toBeNull();
  });
});

describe('availability query parsing', () => {
  it('accepts a valid cursor and limit', () => {
    expect(
      parseAvailabilityQuery({ after: '2026-10-20T10:00:00.000Z', limit: '50' }),
    ).toEqual({ after: '2026-10-20T10:00:00.000Z', limit: 50 });
  });

  it('falls back to defaults for missing or invalid input', () => {
    expect(parseAvailabilityQuery({})).toEqual({
      after: undefined,
      limit: AVAILABILITY_DEFAULT_LIMIT,
    });
    expect(parseAvailabilityQuery({ after: 'yesterday', limit: 'lots' })).toEqual({
      after: undefined,
      limit: AVAILABILITY_DEFAULT_LIMIT,
    });
    expect(parseAvailabilityQuery({ limit: '0' })).toEqual({
      after: undefined,
      limit: AVAILABILITY_DEFAULT_LIMIT,
    });
    expect(parseAvailabilityQuery({ limit: '500' })).toEqual({
      after: undefined,
      limit: AVAILABILITY_DEFAULT_LIMIT,
    });
  });
});

import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';
import { btree_gist } from '@electric-sql/pglite/contrib/btree_gist';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const migrationsDir = fileURLToPath(
  new URL('../../../supabase/migrations', import.meta.url),
);
let db: PGlite;

function booking(slotId: string, requestId = randomUUID()) {
  return {
    requestId,
    slotId,
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    website: 'https://example.com',
    timezone: 'UTC',
    notes: '',
  };
}

async function createSlot(offsetDays = 3): Promise<string> {
  const id = randomUUID();
  await db.query(
    `insert into public.slots(id, starts_at, ends_at)
     values ($1, now() + $2::integer * interval '1 day', now() + $2::integer * interval '1 day' + interval '30 minutes')`,
    [id, offsetDays],
  );
  return id;
}

async function reserve(data: ReturnType<typeof booking>, tokenHash = randomUUID()) {
  return db.query<{ reserve_booking: { id: string; status: string } }>(
    'select public.reserve_booking($1::jsonb, $2::text)',
    [JSON.stringify(data), tokenHash],
  );
}

async function count(table: 'bookings' | 'outbox' | 'audit_submissions', condition = 'true') {
  const result = await db.query<{ count: number }>(
    `select count(*)::integer as count from public.${table} where ${condition}`,
  );
  return result.rows[0].count;
}

describe('database migration', () => {
  beforeAll(async () => {
    db = new PGlite({ extensions: { btree_gist } });
    await db.exec(`
      create schema auth;
      create table auth.users (id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$
        select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
      $$;
      create role anon;
      create role authenticated;
      create role service_role;
      grant usage on schema auth to authenticated;
      grant usage on schema public to anon, authenticated, service_role;
    `);
    const files = (await readdir(migrationsDir)).filter((f) => f.endsWith('.sql')).sort();
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) await db.exec(await readFile(join(migrationsDir, file), 'utf8'));
  });

  afterAll(async () => {
    await db?.close();
  });

  it('rejects overlapping slots and permits adjacent slots', async () => {
    const id = await createSlot();
    await expect(
      db.query(
        `insert into public.slots(id, starts_at, ends_at)
       select $1::uuid, starts_at + interval '15 minutes', ends_at + interval '15 minutes'
       from public.slots where id = $2::uuid`,
        [randomUUID(), id],
      ),
    ).rejects.toThrow();
    await db.query(
      `insert into public.slots(id, starts_at, ends_at)
       select $1::uuid, ends_at, ends_at + interval '30 minutes'
       from public.slots where id = $2::uuid`,
      [randomUUID(), id],
    );
  });

  it('allows only one of two requests for the same slot', async () => {
    const slotId = await createSlot(4);
    const attempts = await Promise.allSettled([reserve(booking(slotId)), reserve(booking(slotId))]);
    expect(attempts.filter((attempt) => attempt.status === 'fulfilled')).toHaveLength(1);
    expect(attempts.filter((attempt) => attempt.status === 'rejected')).toHaveLength(1);
    expect(await count('bookings', `slot_id = '${slotId}'`)).toBe(1);
  });

  it('retries identical requests without duplicate notifications and rejects changed payloads', async () => {
    const slotId = await createSlot(5);
    const data = booking(slotId);
    const token = randomUUID();
    const before = await count('outbox');
    const first = await reserve(data, token);
    const retry = await reserve(data, token);
    expect(retry.rows[0].reserve_booking).toEqual(first.rows[0].reserve_booking);
    expect(await count('bookings', `id = '${data.requestId}'`)).toBe(1);
    expect(await count('outbox')).toBe(before + 1);
    await expect(reserve({ ...data, notes: 'changed' }, token)).rejects.toThrow(
      'IDEMPOTENCY_CONFLICT',
    );
    expect(await count('outbox')).toBe(before + 1);
  });

  it('makes a cancelled slot available for a new booking', async () => {
    const slotId = await createSlot(6);
    const token = randomUUID();
    await reserve(booking(slotId), token);
    const cancelled = await db.query<{ manage_booking: { status: string } }>(
      'select public.manage_booking($1::text, true)',
      [token],
    );
    expect(cancelled.rows[0].manage_booking.status).toBe('cancelled');
    const available = await db.query<{ id: string }>('select id from public.available_slots()');
    expect(available.rows.some((slot) => slot.id === slotId)).toBe(true);
    await reserve(booking(slotId));
    expect(await count('bookings', `slot_id = '${slotId}'`)).toBe(2);
  });

  it('reschedules a booking, releasing the old slot and reserving the new one', async () => {
    const oldSlot = await createSlot(7);
    const newSlot = await createSlot(8);
    const request = booking(oldSlot);
    await reserve(request);
    const before = await count('outbox');
    await db.query('select public.admin_update_booking($1::uuid, $2::text, $3::uuid)', [
      request.requestId,
      'confirmed',
      newSlot,
    ]);
    const moved = await db.query<{ slot_id: string; status: string }>(
      'select slot_id, status from public.bookings where id = $1::uuid',
      [request.requestId],
    );
    expect(moved.rows).toEqual([{ slot_id: newSlot, status: 'confirmed' }]);
    const available = await db.query<{ id: string }>('select id from public.available_slots()');
    expect(available.rows.some((slot) => slot.id === oldSlot)).toBe(true);
    expect(available.rows.some((slot) => slot.id === newSlot)).toBe(false);
    expect(await count('outbox')).toBe(before + 1);
    await reserve(booking(oldSlot));
  });

  it('allows admin cancellation and refuses completion before the slot ends', async () => {
    const slotId = await createSlot(9);
    const request = booking(slotId);
    await reserve(request);
    const before = await count('outbox');
    await expect(
      db.query('select public.admin_update_booking($1::uuid, $2::text)', [
        request.requestId,
        'completed',
      ]),
    ).rejects.toThrow('BOOKING_NOT_ENDED');
    expect(await count('outbox')).toBe(before);
    await db.query('select public.admin_update_booking($1::uuid, $2::text)', [
      request.requestId,
      'cancelled',
    ]);
    const result = await db.query<{ status: string }>(
      'select status from public.bookings where id = $1::uuid',
      [request.requestId],
    );
    expect(result.rows[0].status).toBe('cancelled');
    expect(await count('outbox')).toBe(before + 1);
    const available = await db.query<{ id: string }>('select id from public.available_slots()');
    expect(available.rows.some((slot) => slot.id === slotId)).toBe(true);
  });

  it('writes an audit and its notification in the same transaction', async () => {
    const requestId = randomUUID();
    const data = { requestId, website: 'https://example.com' };
    const before = await count('outbox');
    await db.query('select public.submit_audit($1::jsonb)', [JSON.stringify(data)]);
    await db.query('select public.submit_audit($1::jsonb)', [JSON.stringify(data)]);
    expect(await count('audit_submissions', `id = '${requestId}'`)).toBe(1);
    expect(await count('outbox')).toBe(before + 1);
    await expect(
      db.query('select public.submit_audit($1::jsonb)', [
        JSON.stringify({ ...data, website: 'https://changed.example' }),
      ]),
    ).rejects.toThrow('IDEMPOTENCY_CONFLICT');
    expect(await count('outbox')).toBe(before + 1);
  });

  it('rolls back the notification when its submission transaction rolls back', async () => {
    const requestId = randomUUID();
    const before = await count('outbox');
    await db.exec('begin');
    try {
      await db.query('select public.submit_audit($1::jsonb)', [
        JSON.stringify({ requestId, website: 'https://rollback.example' }),
      ]);
      expect(await count('audit_submissions', `id = '${requestId}'`)).toBe(1);
      expect(await count('outbox')).toBe(before + 1);
    } finally {
      await db.exec('rollback');
    }
    expect(await count('audit_submissions', `id = '${requestId}'`)).toBe(0);
    expect(await count('outbox')).toBe(before);
  });

  it('denies direct public-role access to private data and functions', async () => {
    await db.exec('set role anon');
    try {
      await expect(db.query('select * from public.bookings')).rejects.toThrow();
      await expect(
        db.query('insert into public.rate_limits(key, hits, expires_at) values ($1, 1, now())', [
          randomUUID(),
        ]),
      ).rejects.toThrow();
      await expect(db.query('select public.available_slots()')).rejects.toThrow();
      await expect(
        db.query('select public.submit_audit($1::jsonb)', [
          JSON.stringify({ requestId: randomUUID() }),
        ]),
      ).rejects.toThrow();
    } finally {
      await db.exec('reset role');
    }
  });

  it('hides bookings from non-admin authenticated users and exposes them to allowlisted admins', async () => {
    const slotId = await createSlot(10);
    const request = booking(slotId);
    await reserve(request);
    const visitor = randomUUID();
    const admin = randomUUID();
    await db.query('insert into auth.users(id) values ($1::uuid), ($2::uuid)', [visitor, admin]);
    await db.query('insert into public.admins(user_id) values ($1::uuid)', [admin]);
    const inspectAs = async (userId: string) => {
      await db.query("select set_config('request.jwt.claim.sub', $1, false)", [userId]);
      await db.exec('set role authenticated');
      try {
        const bookings = await db.query<{ id: string }>(
          'select id from public.bookings where id = $1::uuid',
          [request.requestId],
        );
        const admins = await db.query<{ user_id: string }>('select user_id from public.admins');
        await expect(
          db.query('update public.bookings set name = $1 where id = $2::uuid', [
            'Unauthorized',
            request.requestId,
          ]),
        ).rejects.toThrow();
        return { bookings: bookings.rows, admins: admins.rows };
      } finally {
        await db.exec('reset role');
      }
    };
    expect(await inspectAs(visitor)).toEqual({ bookings: [], admins: [] });
    expect(await inspectAs(admin)).toEqual({
      bookings: [{ id: request.requestId }],
      admins: [{ user_id: admin }],
    });
  });

  it('leases claimed notifications so a second immediate claim cannot duplicate delivery', async () => {
    const first = await db.query<{ id: string; attempts: number }>(
      'select id, attempts from public.claim_notifications()',
    );
    expect(first.rows.length).toBeGreaterThan(0);
    expect(first.rows.every((item) => item.attempts === 1)).toBe(true);
    const second = await db.query('select id from public.claim_notifications()');
    expect(second.rows).toHaveLength(0);
    const id = first.rows[0].id;
    await db.query(
      "update public.outbox set available_at = now() - interval '1 second' where id = $1::uuid",
      [id],
    );
    const retried = await db.query<{ id: string; attempts: number }>(
      'select id, attempts from public.claim_notifications()',
    );
    expect(retried.rows).toEqual([{ id, attempts: 2 }]);
  });

  it('resets rate limits after expiration', async () => {
    const key = randomUUID();
    const consume = async () =>
      (await db.query<{ consume_rate: boolean }>('select public.consume_rate($1, 2, 60)', [key]))
        .rows[0].consume_rate;
    expect(await consume()).toBe(true);
    expect(await consume()).toBe(true);
    expect(await consume()).toBe(false);
    await db.query(
      "update public.rate_limits set expires_at = now() - interval '1 second' where key = $1",
      [key],
    );
    expect(await consume()).toBe(true);
    const result = await db.query<{ hits: number }>(
      'select hits from public.rate_limits where key = $1',
      [key],
    );
    expect(result.rows[0].hits).toBe(1);
  });

  it('pages availability forward with a keyset cursor and no gaps', async () => {
    const full = await db.query<{ id: string }>(
      'select id from public.available_slots(null, 50)',
    );
    const first = await db.query<{ id: string; starts_at: string }>(
      'select id, starts_at from public.available_slots(null, 2)',
    );
    expect(first.rows).toHaveLength(2);
    const starts = first.rows.map((slot) => slot.starts_at);
    expect([...starts].sort()).toEqual(starts);
    const cursor = first.rows[first.rows.length - 1].starts_at;
    const second = await db.query<{ id: string; starts_at: string }>(
      'select id, starts_at from public.available_slots($1::timestamptz, 2)',
      [cursor],
    );
    const secondStarts = second.rows.map((slot) => slot.starts_at);
    expect([...secondStarts].sort()).toEqual(secondStarts);
    expect(
      second.rows.every((slot) => new Date(slot.starts_at) > new Date(cursor)),
    ).toBe(true);
    const firstIds = new Set(first.rows.map((slot) => slot.id));
    expect(second.rows.every((slot) => !firstIds.has(slot.id))).toBe(true);
    const pagedIds = new Set([...first.rows, ...second.rows].map((slot) => slot.id));
    for (const row of full.rows.slice(0, first.rows.length + second.rows.length))
      expect(pagedIds.has(row.id)).toBe(true);
  });

  it('clamps the availability limit between 1 and 200', async () => {
    // Far-future hourly slots: clear of the day-offset slots other tests created.
    await db.query(
      `insert into public.slots(starts_at, ends_at)
       select now() + (x || ' hours')::interval, now() + (x || ' hours')::interval + interval '30 minutes'
       from generate_series(300, 520) as x`,
    );
    const capped = await db.query('select id from public.available_slots(null, 500)');
    expect(capped.rows.length).toBeLessThanOrEqual(200);
    const floored = await db.query('select id from public.available_slots(null, 0)');
    expect(floored.rows).toHaveLength(1);
    const unpaged = await db.query('select id from public.available_slots()');
    expect(unpaged.rows.length).toBeLessThanOrEqual(200);
  });
});

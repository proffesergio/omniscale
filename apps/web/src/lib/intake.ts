import 'server-only';
import { auditSchema, bookingSchema } from '@/lib/validators';
import { db, databaseConfigured } from '@/lib/supabase';
import { assertOrigin, HttpError, rateLimit, secretHash, tokenHash } from '@/lib/security';
export async function submitAudit(input: unknown, headers: Headers) {
  assertOrigin(headers);
  const parsed = auditSchema.safeParse(input);
  if (!parsed.success) throw new HttpError(422, parsed.error.issues[0].message);
  if (!databaseConfigured())
    throw new HttpError(503, 'Audit requests are not open yet. Please check back soon.');
  await rateLimit(headers, parsed.data.email, 'audit');
  const { data, error } = await db().rpc('submit_audit', { p_data: parsed.data });
  if (error)
    throw new HttpError(
      error.message.includes('IDEMPOTENCY') ? 409 : 503,
      'Your audit could not be saved. Please try again.',
    );
  return { id: data as string };
}
export async function reserveBooking(input: unknown, headers: Headers) {
  assertOrigin(headers);
  const parsed = bookingSchema.safeParse(input);
  if (!parsed.success) throw new HttpError(422, parsed.error.issues[0].message);
  if (!databaseConfigured())
    throw new HttpError(503, 'Online booking is not open yet. Please check back soon.');
  await rateLimit(headers, parsed.data.email, 'booking');
  const token = secretHash(`booking-management:${parsed.data.requestId}`);
  const { data, error } = await db().rpc('reserve_booking', {
    p_data: parsed.data,
    p_token_hash: tokenHash(token),
  });
  if (error) {
    if (error.message.includes('SLOT_UNAVAILABLE') || error.code === '23505')
      throw new HttpError(
        409,
        'That time has just become unavailable. Please choose another slot.',
      );
    if (error.message.includes('IDEMPOTENCY'))
      throw new HttpError(409, 'This request has already been used. Refresh and try again.');
    throw new HttpError(503, 'Your booking could not be saved. Please try again.');
  }
  return { ...(data as { id: string; starts_at: string; ends_at: string; status: string }), token };
}

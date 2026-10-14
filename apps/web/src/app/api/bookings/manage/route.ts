import { z } from 'zod';
import { db, databaseConfigured } from '@/lib/supabase';
import {
  assertOrigin,
  readJson,
  HttpError,
  errorResponse,
  tokenHash,
  rateLimit,
} from '@/lib/security';
const schema = z.object({
  token: z.string().regex(/^[a-f0-9]{64}$/),
  cancel: z.boolean().default(false),
});
export async function POST(request: Request) {
  try {
    assertOrigin(request.headers);
    const parsed = schema.safeParse(await readJson(request));
    if (!parsed.success) throw new HttpError(400, 'This booking link is invalid.');
    if (!databaseConfigured())
      throw new HttpError(503, 'Booking management is temporarily unavailable.');
    await rateLimit(request.headers, tokenHash(parsed.data.token), 'manage');
    const { data, error } = await db().rpc('manage_booking', {
      p_token_hash: tokenHash(parsed.data.token),
      p_cancel: parsed.data.cancel,
    });
    if (error)
      throw new HttpError(
        error.message.includes('BOOKING_STARTED') ? 409 : 404,
        error.message.includes('BOOKING_STARTED')
          ? 'This appointment has already started.'
          : 'This booking was not found.',
      );
    return Response.json(data, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return errorResponse(error);
  }
}

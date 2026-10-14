import 'server-only';
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { db } from '@/lib/supabase';
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function assertOrigin(headers: Headers) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  const allowed = configured ? new URL(configured).origin : 'http://localhost:3000';
  const origin = headers.get('origin');
  const development =
    process.env.NODE_ENV !== 'production' &&
    ['http://localhost:3000', 'http://127.0.0.1:3000'].includes(origin ?? '');
  if (origin !== allowed && !development)
    throw new HttpError(403, 'This request must come from the OmniScale website.');
}
export async function readJson(request: Request): Promise<unknown> {
  if (!request.headers.get('content-type')?.includes('application/json'))
    throw new HttpError(415, 'Send JSON data.');
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, 'Missing request data.');
  let size = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 16384) {
      await reader.cancel();
      throw new HttpError(413, 'This submission is too large.');
    }
    chunks.push(value);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new HttpError(400, 'Invalid JSON data.');
  }
}
export function secretHash(value: string) {
  const secret = process.env.RATE_LIMIT_SECRET;
  if (!secret || secret.length < 32)
    throw new HttpError(503, 'Submissions are temporarily unavailable. Please try again later.');
  return createHmac('sha256', secret).update(value).digest('hex');
}
export const tokenHash = (token: string) => createHash('sha256').update(token).digest('hex');
export async function rateLimit(headers: Headers, email: string, category: string) {
  const ipHeader = process.env.TRUSTED_IP_HEADER;
  const ip = ipHeader ? headers.get(ipHeader)?.split(',')[0].trim() : null;
  const keys = [
    { key: `${category}:email:${email}`, max: 5 },
    { key: `${category}:global`, max: 300 },
  ];
  if (ip) keys.push({ key: `${category}:ip:${ip}`, max: 15 });
  for (const entry of keys) {
    const { data, error } = await db().rpc('consume_rate', {
      p_key: secretHash(entry.key),
      p_limit: entry.max,
      p_seconds: 3600,
    });
    if (error)
      throw new HttpError(503, 'Submissions are temporarily unavailable. Please try again later.');
    if (!data) throw new HttpError(429, 'Too many requests. Please try again in an hour.');
  }
}
export function internalAuthorized(request: Request): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected || expected.length < 32) return false;
  const actual = request.headers.get('authorization') ?? '';
  const a = Buffer.from(actual);
  const b = Buffer.from(`Bearer ${expected}`);
  return a.length === b.length && timingSafeEqual(a, b);
}
export function errorResponse(error: unknown) {
  const status = error instanceof HttpError ? error.status : 503;
  return Response.json(
    {
      error:
        error instanceof HttpError
          ? error.message
          : 'The service is temporarily unavailable. Please try again later.',
    },
    {
      status,
      headers: {
        'Cache-Control': 'no-store',
        ...(status === 429 ? { 'Retry-After': '3600' } : {}),
      },
    },
  );
}

import { z } from 'zod';

export const ADMIN_PAGE_SIZE = 50;
export const AVAILABILITY_DEFAULT_LIMIT = 200;
export const AVAILABILITY_MAX_LIMIT = 200;

const cursorPayload = z.object({
  t: z.iso.datetime({ offset: true }),
  id: z.uuid(),
});
export type PageCursor = z.infer<typeof cursorPayload>;

/** Opaque keyset cursor: `{ t: rowTimestamp, id: rowId }` as base64url JSON. */
export function encodeCursor(t: string, id: string): string {
  return Buffer.from(JSON.stringify({ t, id }), 'utf8').toString('base64url');
}

/** Returns the cursor payload, or null when the raw value is missing or forged. */
export function decodeCursor(raw: string | null | undefined): PageCursor | null {
  if (!raw) return null;
  try {
    const parsed = cursorPayload.safeParse(
      JSON.parse(Buffer.from(raw, 'base64url').toString('utf8')),
    );
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

const availabilityQuery = z.object({
  after: z.iso.datetime({ offset: true }).optional(),
  limit: z.coerce.number().int().min(1).max(AVAILABILITY_MAX_LIMIT).optional(),
});

export function parseAvailabilityQuery(input: {
  after?: string | null;
  limit?: string | null;
}): { after?: string; limit: number } {
  const parsed = availabilityQuery.safeParse({
    after: input.after ?? undefined,
    limit: input.limit ?? undefined,
  });
  if (!parsed.success)
    return { after: undefined, limit: AVAILABILITY_DEFAULT_LIMIT };
  return {
    after: parsed.data.after,
    limit: parsed.data.limit ?? AVAILABILITY_DEFAULT_LIMIT,
  };
}

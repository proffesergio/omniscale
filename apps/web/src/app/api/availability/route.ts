import { db, databaseConfigured } from '@/lib/supabase';
import { parseAvailabilityQuery } from '@/lib/pagination';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  const headers = { 'Cache-Control': 'no-store' };
  if (!databaseConfigured()) return Response.json({ slots: [], configured: false }, { headers });
  const url = new URL(request.url);
  const { after, limit } = parseAvailabilityQuery({
    after: url.searchParams.get('after'),
    limit: url.searchParams.get('limit'),
  });
  const { data, error } = await db().rpc('available_slots', {
    p_after: after ?? null,
    p_limit: limit,
  });
  if (error)
    return Response.json(
      { error: 'Availability could not be loaded. Please try again.' },
      { status: 503, headers },
    );
  const slots = (data ?? []) as { id: string; starts_at: string; ends_at: string }[];
  return Response.json(
    { slots, configured: true, hasMore: slots.length >= limit },
    { headers },
  );
}

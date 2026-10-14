import { db, databaseConfigured } from '@/lib/supabase';
import { internalAuthorized } from '@/lib/security';
import { deliverNotification } from '@/lib/notifications';
export const maxDuration = 60;
export async function POST(request: Request) {
  if (!internalAuthorized(request))
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (!databaseConfigured())
    return Response.json({ error: 'Database not configured' }, { status: 503 });
  const { data, error } = await db().rpc('claim_notifications');
  if (error)
    return Response.json({ error: 'Could not claim pending notifications' }, { status: 503 });
  let delivered = 0;
  let retried = 0;
  // At most twenty deliveries, four concurrently, with a 10-second request timeout.
  for (let offset = 0; offset < data.length; offset += 4) {
    await Promise.all(
      data
        .slice(offset, offset + 4)
        .map(
          async (item: {
            id: string;
            kind: string;
            payload: Record<string, unknown>;
            attempts: number;
          }) => {
            try {
              await deliverNotification(item);
              const { error: updateError } = await db()
                .from('outbox')
                .update({ delivered_at: new Date().toISOString(), last_error: null })
                .eq('id', item.id);
              if (updateError) throw new Error('Delivery acknowledgement failed');
              delivered++;
            } catch (error) {
              retried++;
              await db()
                .from('outbox')
                .update({
                  last_error: error instanceof Error ? error.message : 'Delivery failed',
                  available_at: new Date(
                    Date.now() + Math.min(3600000, 2 ** item.attempts * 60000),
                  ).toISOString(),
                })
                .eq('id', item.id);
            }
          },
        ),
    );
  }
  return Response.json({ delivered, retried }, { headers: { 'Cache-Control': 'no-store' } });
}

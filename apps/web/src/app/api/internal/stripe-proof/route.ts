import { internalAuthorized } from '@/lib/security';
import { verifyRevenueEvidence } from '@/lib/stripe-proof';
export async function POST(request: Request) {
  if (!internalAuthorized(request))
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    return Response.json(await verifyRevenueEvidence(), {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch {
    return Response.json(
      {
        error:
          'Stripe evidence is unavailable. Check the server configuration and approved live charge IDs.',
      },
      { status: 503 },
    );
  }
}

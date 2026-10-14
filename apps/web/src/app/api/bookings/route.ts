import { reserveBooking } from '@/lib/intake';
import { errorResponse, readJson, assertOrigin } from '@/lib/security';
export async function POST(request: Request) {
  try {
    assertOrigin(request.headers);
    return Response.json(await reserveBooking(await readJson(request), request.headers), {
      status: 201,
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    return errorResponse(error);
  }
}

import { submitManualPayment } from '@/lib/intake';
import { errorResponse, readJson, assertOrigin } from '@/lib/security';
export async function POST(request: Request) {
  try {
    assertOrigin(request.headers);
    return Response.json(await submitManualPayment(await readJson(request), request.headers), {
      status: 201,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

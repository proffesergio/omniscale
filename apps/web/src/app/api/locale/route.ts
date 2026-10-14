import { currencyForCountry } from '@/lib/currency';
export async function GET(request: Request) {
  // Vercel overwrites this header. Other hosts fall back to the browser timezone.
  const country = process.env.VERCEL === '1' ? request.headers.get('x-vercel-ip-country') : null;
  return Response.json(
    { currency: country ? currencyForCountry(country) : null, source: country ? 'region' : null },
    { headers: { 'Cache-Control': 'private, no-store', Vary: 'x-vercel-ip-country' } },
  );
}

import { NextResponse } from 'next/server';
// Admin routes use a sealed same-site token cookie (see lib/admin-auth) and
// service-role database access. Nothing to refresh here — just keep admin
// responses out of shared caches.
export async function proxy() {
  const response = NextResponse.next();
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}
export const config = { matcher: ['/admin/:path*'] };

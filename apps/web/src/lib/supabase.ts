import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
export function databaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SECRET_KEY &&
    process.env.RATE_LIMIT_SECRET,
  );
}
export function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error('Database is not configured');
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}
export async function authClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  const store = await cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll: () => store.getAll(),
      setAll(values) {
        try {
          values.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          /* Server Component rendering cannot set cookies; proxy refreshes sessions. */
        }
      },
    },
  });
}
export async function getAdmin() {
  const client = await authClient();
  if (!client) return null;
  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  if (error || !user) return null;
  const { data } = await client
    .from('admins')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle();
  return data ? user : null;
}

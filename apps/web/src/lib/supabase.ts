import 'server-only';
import { createClient } from '@supabase/supabase-js';
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

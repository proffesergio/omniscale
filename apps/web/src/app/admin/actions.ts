'use server';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { authClient, databaseConfigured, db, getAdmin } from '@/lib/supabase';
import { rateLimit, HttpError } from '@/lib/security';
export type AdminState = { error?: string; message?: string };
export async function login(_previous: AdminState, form: FormData): Promise<AdminState> {
  const parsed = z
    .object({ email: z.email().max(254), password: z.string().min(8).max(256) })
    .safeParse({ email: form.get('email'), password: form.get('password') });
  if (!parsed.success)
    return { error: 'Enter your team email and password (at least 8 characters).' };
  if (!databaseConfigured())
    return {
      error:
        'Admin access is not configured. Connect Supabase and provision an admin account first.',
    };
  try {
    await rateLimit(await headers(), parsed.data.email.toLowerCase(), 'admin-login');
    const client = await authClient();
    if (!client) return { error: 'Authentication is not configured.' };
    const { error } = await client.auth.signInWithPassword(parsed.data);
    if (error) return { error: 'Unable to sign in with these credentials.' };
    if (!(await getAdmin())) {
      await client.auth.signOut();
      return { error: 'This account does not have admin access.' };
    }
    revalidatePath('/admin');
    return { message: 'Signed in.' };
  } catch (error) {
    return {
      error: error instanceof HttpError ? error.message : 'Sign-in is temporarily unavailable.',
    };
  }
}
export async function logout() {
  const client = await authClient();
  await client?.auth.signOut();
  revalidatePath('/admin');
}
export async function adminMutation(_previous: AdminState, form: FormData): Promise<AdminState> {
  if (!(await getAdmin())) return { error: 'Please sign in with an authorized admin account.' };
  const operation = form.get('operation');
  try {
    if (operation === 'create-slot') {
      const start = z.iso.datetime({ offset: true }).safeParse(form.get('starts_at'));
      if (!start.success) return { error: 'Choose a valid date and time.' };
      const date = new Date(start.data);
      const now = Date.now();
      if (date.getTime() < now + 2 * 3600000 || date.getTime() > now + 90 * 86400000)
        return { error: 'Publish a time between 2 hours and 90 days from now.' };
      const { error } = await db()
        .from('slots')
        .insert({
          starts_at: date.toISOString(),
          ends_at: new Date(date.getTime() + 30 * 60000).toISOString(),
        });
      if (error)
        return {
          error:
            error.code === '23P01'
              ? 'That time overlaps an existing slot. Reopen the existing slot instead.'
              : 'The slot could not be published.',
        };
    } else if (operation === 'toggle-slot') {
      const id = z.uuid().safeParse(form.get('id'));
      if (!id.success) return { error: 'Invalid slot.' };
      const { error } = await db()
        .from('slots')
        .update({ is_open: form.get('is_open') === 'true' })
        .eq('id', id.data);
      if (error) return { error: 'Availability could not be updated.' };
    } else if (operation === 'update-booking') {
      const parsed = z
        .object({
          id: z.uuid(),
          status: z.enum(['confirmed', 'cancelled', 'completed']),
          slot: z.union([z.uuid(), z.literal('')]),
        })
        .safeParse({
          id: form.get('id'),
          status: form.get('status'),
          slot: form.get('slot_id') || '',
        });
      if (!parsed.success) return { error: 'Choose a valid booking update.' };
      const { error } = await db().rpc('admin_update_booking', {
        p_id: parsed.data.id,
        p_status: parsed.data.status,
        p_slot_id: parsed.data.slot || null,
      });
      if (error)
        return {
          error: error.message.includes('BOOKING_NOT_ENDED')
            ? 'You can mark a call complete after its scheduled end.'
            : error.message.includes('BOOKING_STARTED')
              ? 'A past appointment cannot be reconfirmed.'
              : 'Update failed. The selected time may no longer be available.',
        };
    } else {
      return { error: 'Unknown admin action.' };
    }
    revalidatePath('/admin');
    return { message: 'Saved. Booking changes are queued for email delivery when configured.' };
  } catch {
    return { error: 'The update could not be saved. Please try again.' };
  }
}

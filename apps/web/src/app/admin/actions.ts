'use server';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { databaseConfigured, db } from '@/lib/supabase';
import {
  adminTokenConfigured,
  createAdminSession,
  destroyAdminSession,
  getAdminSession,
  verifyAdminToken,
} from '@/lib/admin-auth';
import { paymentMethodSchema } from '@/lib/validators';
import { rateLimit, HttpError } from '@/lib/security';
export type AdminState = { error?: string; message?: string };
export async function login(_previous: AdminState, form: FormData): Promise<AdminState> {
  const parsed = z
    .object({ token: z.string().min(1).max(256) })
    .safeParse({ token: form.get('token') });
  if (!parsed.success) return { error: 'Enter your admin token.' };
  if (!databaseConfigured() || !adminTokenConfigured())
    return {
      error:
        'Admin access is not configured. Connect Supabase, apply the migrations, and set ADMIN_TOKEN first.',
    };
  try {
    await rateLimit(await headers(), 'admin-token', 'admin-login');
    if (!verifyAdminToken(parsed.data.token))
      return { error: 'That token is not correct.' };
    await createAdminSession();
    revalidatePath('/admin');
    return { message: 'Signed in.' };
  } catch (error) {
    return {
      error: error instanceof HttpError ? error.message : 'Sign-in is temporarily unavailable.',
    };
  }
}
export async function logout() {
  await destroyAdminSession();
  revalidatePath('/admin');
}
export async function adminMutation(_previous: AdminState, form: FormData): Promise<AdminState> {
  if (!(await getAdminSession())) return { error: 'Please sign in with the admin token.' };
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
    } else if (operation === 'update-booking') {      const parsed = z
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
    } else if (operation === 'create-method' || operation === 'update-method') {
      const parsed = paymentMethodSchema.safeParse({
        provider: form.get('provider'),
        label: form.get('label'),
        accountName: form.get('account_name') || '',
        accountNumber: form.get('account_number'),
        qrImageUrl: form.get('qr_image_url') || '',
        instructions: form.get('instructions') || '',
        isActive: form.get('is_active') === 'true',
        sortOrder: form.get('sort_order') || 0,
      });
      if (!parsed.success) return { error: 'Check the payment method fields and try again.' };
      const row = {
        provider: parsed.data.provider,
        label: parsed.data.label,
        account_name: parsed.data.accountName,
        account_number: parsed.data.accountNumber,
        qr_image_url: parsed.data.qrImageUrl,
        instructions: parsed.data.instructions,
        is_active: parsed.data.isActive,
        sort_order: parsed.data.sortOrder,
      };
      if (operation === 'create-method') {
        const { error } = await db().from('payment_methods').insert(row);
        if (error) return { error: 'The payment method could not be saved.' };
      } else {
        const id = z.uuid().safeParse(form.get('id'));
        if (!id.success) return { error: 'Invalid payment method.' };
        const { error } = await db().from('payment_methods').update(row).eq('id', id.data);
        if (error) return { error: 'The payment method could not be saved.' };
      }
    } else if (operation === 'verify-payment') {
      const parsed = z
        .object({ id: z.uuid(), status: z.enum(['verified', 'rejected']) })
        .safeParse({ id: form.get('id'), status: form.get('status') });
      if (!parsed.success) return { error: 'Choose a valid payment decision.' };
      const { data: current } = await db()
        .from('manual_payments')
        .select('id,status')
        .eq('id', parsed.data.id)
        .maybeSingle();
      if (!current) return { error: 'Payment not found.' };
      if (current.status !== 'pending') return { error: 'That payment was already decided.' };
      const { error } = await db()
        .from('manual_payments')
        .update({ status: parsed.data.status })
        .eq('id', parsed.data.id);
      if (error) return { error: 'The payment decision could not be saved.' };
    } else {
      return { error: 'Unknown admin action.' };
    }
    revalidatePath('/admin');
    return { message: 'Saved. Booking changes are queued for email delivery when configured.' };
  } catch {
    return { error: 'The update could not be saved. Please try again.' };
  }
}

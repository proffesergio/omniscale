import type { Metadata } from 'next';
import { AdminDashboard, AdminLogin } from '@/components/admin/dashboard';
import { databaseConfigured, db, getAdmin } from '@/lib/supabase';
import { ADMIN_PAGE_SIZE, decodeCursor, encodeCursor } from '@/lib/pagination';
import type { Booking, ManualPayment, PaymentMethod, Slot } from '@/types';
import type { AuditInput } from '@/lib/validators';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Team operations',
  robots: { index: false, follow: false },
};
type Cursors = { bAfter?: string; aAfter?: string; sAfter?: string; pAfter?: string };
export default async function AdminPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const configured = databaseConfigured();
  const user = configured ? await getAdmin() : null;
  const intro = (
    <div className="page-intro">
      <div className="eyebrow">OMNISCALE / TEAM WORKSPACE</div>
      <h1>
        Good growth starts
        <br />
        with good operations.
      </h1>
    </div>
  );
  if (!user)
    return (
      <div className="container">
        {intro}
        <AdminLogin configured={configured} />
      </div>
    );
  const client = db();
  const params = (await searchParams) ?? {};
  const first = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value;
  const cursors: Cursors = {
    bAfter: first(params.bAfter),
    aAfter: first(params.aAfter),
    sAfter: first(params.sAfter),
    pAfter: first(params.pAfter),
  };
  const paymentStatus = first(params.pStatus) === 'all' ? 'all' : 'pending';
  const bookingCursor = decodeCursor(cursors.bAfter);
  const auditCursor = decodeCursor(cursors.aAfter);
  const slotCursor = decodeCursor(cursors.sAfter);
  const paymentCursor = decodeCursor(cursors.pAfter);
  const pagePlusOne = ADMIN_PAGE_SIZE + 1;
  const bookingsQuery = client
    .from('bookings')
    .select(
      'id,slot_id,name,email,website,timezone,notes,status,created_at,slots(id,starts_at,ends_at)',
    )
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(pagePlusOne);
  if (bookingCursor)
    bookingsQuery.or(
      `created_at.lt.${bookingCursor.t},and(created_at.eq.${bookingCursor.t},id.lt.${bookingCursor.id})`,
    );
  const auditsQuery = client
    .from('audit_submissions')
    .select('id,payload,created_at')
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(pagePlusOne);
  if (auditCursor)
    auditsQuery.or(
      `created_at.lt.${auditCursor.t},and(created_at.eq.${auditCursor.t},id.lt.${auditCursor.id})`,
    );
  const slotsQuery = client
    .from('slots')
    .select('*')
    .gte('starts_at', new Date().toISOString())
    .order('starts_at')
    .order('id')
    .limit(pagePlusOne);
  if (slotCursor)
    slotsQuery.or(
      `starts_at.gt.${slotCursor.t},and(starts_at.eq.${slotCursor.t},id.gt.${slotCursor.id})`,
    );
  const paymentsQuery = client
    .from('manual_payments')
    .select('*')
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(pagePlusOne);
  if (paymentStatus === 'pending') paymentsQuery.eq('status', 'pending');
  if (paymentCursor)
    paymentsQuery.or(
      `created_at.lt.${paymentCursor.t},and(created_at.eq.${paymentCursor.t},id.lt.${paymentCursor.id})`,
    );
  const [slots, bookings, audits, pending, failed, methods, payments] = await Promise.all([
    slotsQuery,
    bookingsQuery,
    auditsQuery,
    client
      .from('outbox')
      .select('id', { count: 'exact', head: true })
      .is('delivered_at', null)
      .lt('attempts', 8),
    client
      .from('outbox')
      .select('id', { count: 'exact', head: true })
      .is('delivered_at', null)
      .gte('attempts', 8),
    client.from('payment_methods').select('*').order('sort_order').order('created_at'),
    paymentsQuery,
  ]);
  if ([slots, bookings, audits, pending, failed, methods, payments].some((r) => r.error))
    throw new Error('Admin data could not be loaded');
  const slotRows = ((slots.data ?? []) as (Slot & { is_open: boolean })[]).slice(
    0,
    ADMIN_PAGE_SIZE,
  );
  const bookingRows = ((bookings.data ?? []) as unknown as Booking[]).slice(0, ADMIN_PAGE_SIZE);
  const auditRows = (
    (audits.data ?? []) as { id: string; payload: AuditInput; created_at: string }[]
  ).slice(0, ADMIN_PAGE_SIZE);
  const paymentRows = ((payments.data ?? []) as ManualPayment[]).slice(0, ADMIN_PAGE_SIZE);
  const next = {
    slots:
      (slots.data?.length ?? 0) > ADMIN_PAGE_SIZE
        ? encodeCursor(
            slotRows[slotRows.length - 1].starts_at,
            slotRows[slotRows.length - 1].id,
          )
        : null,
    bookings:
      (bookings.data?.length ?? 0) > ADMIN_PAGE_SIZE
        ? encodeCursor(
            bookingRows[bookingRows.length - 1].created_at,
            bookingRows[bookingRows.length - 1].id,
          )
        : null,
    audits:
      (audits.data?.length ?? 0) > ADMIN_PAGE_SIZE
        ? encodeCursor(auditRows[auditRows.length - 1].created_at, auditRows[auditRows.length - 1].id)
        : null,
    payments:
      (payments.data?.length ?? 0) > ADMIN_PAGE_SIZE
        ? encodeCursor(
            paymentRows[paymentRows.length - 1].created_at,
            paymentRows[paymentRows.length - 1].id,
          )
        : null,
  };
  return (
    <div className="container">
      {intro}
      <AdminDashboard
        email={user.email ?? ''}
        slots={slotRows}
        bookings={bookingRows}
        audits={auditRows}
        pendingNotifications={pending.count ?? 0}
        failedNotifications={failed.count ?? 0}
        cursors={cursors}
        next={next}
        pageSize={ADMIN_PAGE_SIZE}
        methods={(methods.data ?? []) as PaymentMethod[]}
        payments={paymentRows}
        paymentStatus={paymentStatus}
      />
    </div>
  );
}

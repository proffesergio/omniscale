'use client';
import Link from 'next/link';
import { useActionState, useState } from 'react';
import { useBrowserTimezone } from '@/hooks/use-browser-timezone';
import { adminMutation, login, logout, type AdminState } from '@/app/admin/actions';
import { Button } from '@/components/ui/button';
import type { Booking, Slot } from '@/types';
import type { AuditInput } from '@/lib/validators';
export function AdminLogin({ configured }: { configured: boolean }) {
  const [state, action, pending] = useActionState(login, {} as AdminState);
  return (
    <form action={action} className="form-card login-card">
      <h2>Team sign-in</h2>
      <p>Access appointment controls and incoming growth audits.</p>
      {!configured && (
        <div className="notice">
          Setup required: connect Supabase, apply the migration, and add your user to the admins
          table. See the project README.
        </div>
      )}
      <label className="field">
        <span>Team email</span>
        <input name="email" type="email" autoComplete="username" required />
      </label>
      <label className="field">
        <span>Password</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          minLength={8}
          required
        />
      </label>
      {state.error && (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      )}
      <Button type="submit" disabled={pending || !configured}>
        {pending ? 'Signing in…' : 'Sign in to OmniScale'}
      </Button>
    </form>
  );
}
export function AdminDashboard({
  email,
  slots,
  bookings,
  audits,
  pendingNotifications,
  failedNotifications,
  cursors,
  next,
  pageSize,
}: {
  email: string;
  slots: (Slot & { is_open: boolean })[];
  bookings: Booking[];
  audits: { id: string; payload: AuditInput; created_at: string }[];
  pendingNotifications: number;
  failedNotifications: number;
  cursors: { bAfter?: string; aAfter?: string; sAfter?: string };
  next: { slots: string | null; bookings: string | null; audits: string | null };
  pageSize: number;
}) {
  const [state, action, pending] = useActionState(adminMutation, {} as AdminState);
  const timezone = useBrowserTimezone();
  const [date, setDate] = useState('');
  const format = (value: string) =>
    new Date(value).toLocaleString(undefined, {
      timeZone: timezone,
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  const available = slots.filter(
    (s) => s.is_open && !bookings.some((b) => b.slot_id === s.id && b.status !== 'cancelled'),
  );
  const pageHref = (key: 'sAfter' | 'bAfter' | 'aAfter', cursor: string) => {
    const params = new URLSearchParams();
    if (cursors.sAfter) params.set('sAfter', cursors.sAfter);
    if (cursors.bAfter) params.set('bAfter', cursors.bAfter);
    if (cursors.aAfter) params.set('aAfter', cursors.aAfter);
    params.set(key, cursor);
    return `/admin?${params.toString()}`;
  };
  return (
    <div className="admin-layout">
      <div className="admin-toolbar">
        <div>
          <h2>Booking & lead operations</h2>
          <p style={{ fontSize: 12 }}>
            {email} · {timezone}
          </p>
        </div>
        <form action={logout}>
          <Button variant="outline">Sign out</Button>
        </form>
      </div>
      <div className="notice">
        {pendingNotifications} pending notifications · {failedNotifications} exhausted retries.
        Configure the notification cron and delivery provider to send confirmations. No calendar
        sync or video link is generated automatically.
      </div>
      {state.error && (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      )}
      {state.message && (
        <p className="form-success" role="status">
          {state.message}
        </p>
      )}
      <div className="admin-columns">
        <section className="admin-panel">
          <h3>Publish availability</h3>
          <p>
            Each slot is 30 minutes. Enter a time in {timezone}; it will be stored in UTC and shown
            in each visitor’s timezone. Overlapping slots are rejected.
          </p>
          <form action={action}>
            <input type="hidden" name="operation" value="create-slot" />
            <input
              type="hidden"
              name="starts_at"
              value={
                date && !Number.isNaN(new Date(date).getTime()) ? new Date(date).toISOString() : ''
              }
            />
            <label className="field">
              <span>Date & start time ({timezone})</span>
              <input
                type="datetime-local"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </label>
            <Button disabled={pending || !date}>Publish 30-minute slot</Button>
          </form>
          <h3 style={{ marginTop: 30 }}>Upcoming availability</h3>
          {slots.length === 0 && <p>No slots published yet.</p>}          {slots.map((slot) => (
            <div className="admin-row" key={slot.id}>
              <div>
                <strong>{format(slot.starts_at)}</strong>
                <small>
                  {slot.is_open ? 'Published' : 'Closed'} ·{' '}
                  {bookings.some((b) => b.slot_id === slot.id && b.status !== 'cancelled')
                    ? 'Reserved'
                    : 'Unreserved'}
                </small>
              </div>
              <form action={action}>
                <input type="hidden" name="operation" value="toggle-slot" />
                <input type="hidden" name="id" value={slot.id} />
                <input type="hidden" name="is_open" value={String(!slot.is_open)} />
                <button disabled={pending}>{slot.is_open ? 'Close' : 'Reopen'}</button>
              </form>
            </div>
          ))}
          {next.slots && (
            <p style={{ marginTop: 12 }}>
              <Link className="text-link" href={pageHref('sAfter', next.slots)}>
                Show older availability →
              </Link>
            </p>
          )}
        </section>
        <section className="admin-panel">
          <h3>Appointments</h3>
          <p>
            Showing the {pageSize} most recent appointments per page. Closing availability does not
            cancel existing bookings. Rescheduling queues an update for the visitor.
          </p>
          {bookings.length === 0 && <p>No appointments yet.</p>}
          {bookings.map((b) => (
            <article className="admin-booking" key={b.id}>
              <h4>
                {b.name} · {b.status}
              </h4>
              <p>
                <a href={`mailto:${b.email}`}>{b.email}</a>
                <br />
                {b.slots ? format(b.slots.starts_at) : 'Slot unavailable'}
                <br />
                Visitor timezone: {b.timezone}
              </p>
              <p>
                <a href={b.website} target="_blank" rel="noreferrer">
                  {b.website}
                </a>
              </p>
              {b.notes && <p>{b.notes}</p>}
              <form action={action}>
                <input type="hidden" name="operation" value="update-booking" />
                <input type="hidden" name="id" value={b.id} />
                <select name="status" defaultValue={b.status} aria-label={`Status for ${b.name}`}>
                  <option value="confirmed">Confirmed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="completed">Completed</option>
                </select>
                <select name="slot_id" defaultValue="" aria-label={`Reschedule ${b.name}`}>
                  <option value="">Keep current time</option>
                  {available.map((s) => (
                    <option key={s.id} value={s.id}>
                      {format(s.starts_at)}
                    </option>
                  ))}
                </select>
                <Button disabled={pending}>Save booking</Button>
              </form>
            </article>
          ))}
          {next.bookings && (
            <p style={{ marginTop: 12 }}>
              <Link className="text-link" href={pageHref('bAfter', next.bookings)}>
                Show older appointments →
              </Link>
            </p>
          )}
        </section>
      </div>
      <section className="admin-panel" style={{ marginTop: 25 }}>
        <h3>Growth audit pipeline</h3>
        <p>
          Showing the {pageSize} most recent requests per page. Submitted information is visible
          only to authorized team members.
        </p>
        {audits.length === 0 && <p>No audit requests yet.</p>}
        {audits.map((a) => (
          <article className="admin-booking" key={a.id}>
            <h4>
              {a.payload.name} · {a.payload.businessType} · {a.payload.channel}
            </h4>
            <p>
              <a href={`mailto:${a.payload.email}`}>{a.payload.email}</a> · {format(a.created_at)}
            </p>
            <p>
              <a target="_blank" rel="noreferrer" href={a.payload.website}>
                Website
              </a>{' '}
              ·{' '}
              <a target="_blank" rel="noreferrer" href={a.payload.competitor}>
                Competitor
              </a>{' '}
              ·{' '}
              <a target="_blank" rel="noreferrer" href={a.payload.linkedin}>
                LinkedIn profile
              </a>
            </p>
          </article>
        ))}
        {next.audits && (
          <p style={{ marginTop: 12 }}>
            <Link className="text-link" href={pageHref('aAfter', next.audits)}>
              Show older requests →
            </Link>
          </p>
        )}
      </section>
    </div>
  );
}

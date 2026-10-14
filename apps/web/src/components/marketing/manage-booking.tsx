'use client';
import { useEffect, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { downloadCalendar } from '@/lib/calendar';
type Details = { id: string; name: string; status: string; starts_at: string; ends_at: string };
const subscribeHash = (callback: () => void) => {
  window.addEventListener('hashchange', callback);
  return () => window.removeEventListener('hashchange', callback);
};
export function ManageBooking() {
  const token = useSyncExternalStore(
    subscribeHash,
    () => window.location.hash.slice(1),
    () => '',
  );
  const [details, setDetails] = useState<Details | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(true);
  const [confirm, setConfirm] = useState(false);
  useEffect(() => {
    if (!/^[a-f0-9]{64}$/.test(token)) return;
    let active = true;
    fetch('/api/bookings/manage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error);
        if (active) setDetails(data);
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setBusy(false);
      });
    return () => {
      active = false;
    };
  }, [token]);
  async function cancel() {
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/bookings/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, cancel: true }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setDetails(data);
      setConfirm(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Cancellation could not be saved.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="form-card" style={{ maxWidth: 650, marginBottom: 70 }}>
      {!/^[a-f0-9]{64}$/.test(token) ? (
        <p>Open the complete private management link from your booking confirmation.</p>
      ) : (
        busy && <p role="status">Updating your booking…</p>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {details && (
        <>
          <h2>
            {details.name}, your booking is {details.status}.
          </h2>
          <p>
            {new Date(details.starts_at).toLocaleString(undefined, {
              dateStyle: 'full',
              timeStyle: 'short',
            })}{' '}
            · {Intl.DateTimeFormat().resolvedOptions().timeZone}
          </p>
          {details.status === 'confirmed' && (
            <div className="receipt-actions">
              <Button variant="outline" onClick={() => downloadCalendar(details)}>
                Add to calendar
              </Button>
              <Button variant="outline" onClick={() => setConfirm(!confirm)} disabled={busy}>
                Cancel appointment
              </Button>
            </div>
          )}
          {confirm && (
            <div className="notice" style={{ marginTop: 20 }}>
              <p>Cancel this discovery call and release the time?</p>
              <Button onClick={() => void cancel()} disabled={busy}>
                Yes, cancel appointment
              </Button>
            </div>
          )}
          {details.status === 'cancelled' && (
            <Button asChild>
              <Link href="/booking">Choose a new time</Link>
            </Button>
          )}
          <p className="input-explanation">
            To change your time, cancel this appointment and book a new available slot.
          </p>
        </>
      )}
    </div>
  );
}

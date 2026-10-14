'use client';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, CalendarDays, ArrowRight, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { bookingSchema, type BookingInput } from '@/lib/validators';
import { downloadCalendar } from '@/lib/calendar';
import { useBrowserTimezone } from '@/hooks/use-browser-timezone';
import type { Slot } from '@/types';
type Receipt = { id: string; starts_at: string; ends_at: string; status: string; token: string };
export function BookingCalendar() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState('');
  const [configured, setConfigured] = useState(true);
  const [selected, setSelected] = useState<Slot | null>(null);
  const [chosenTimezone, setTimezone] = useState<string | null>(null);
  const browserTimezone = useBrowserTimezone();
  const timezone = chosenTimezone || browserTimezone;
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [manageUrl, setManageUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const requestId = useRef('');
  const {
    register,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BookingInput>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      name: '',
      email: '',
      website: '',
      notes: '',
      consent: false,
      company: '',
      timezone: 'UTC',
      requestId: '',
      slotId: '',
    },
  });
  const load = useCallback((signal?: AbortSignal, after?: string, append = false) => {
    const url = after ? `/api/availability?after=${encodeURIComponent(after)}` : '/api/availability';
    return fetch(url, { signal })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        return data as { slots: Slot[]; configured: boolean; hasMore?: boolean };
      })
      .then((data) => {
        setSlots((previous) => (append ? [...previous, ...data.slots] : data.slots));
        setHasMore(data.hasMore ?? false);
        setConfigured(data.configured);
        setError('');
      })
      .catch((error) => {
        if (!signal?.aborted)
          setError(error instanceof Error ? error.message : 'Availability could not be loaded.');
      })
      .finally(() => {
        if (!signal?.aborted) {
          setLoading(false);
          setLoadingMore(false);
        }
      });
  }, []);
  useEffect(() => {
    requestId.current = crypto.randomUUID();
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);
  useEffect(() => {
    setValue('timezone', timezone);
  }, [timezone, setValue]);
  function select(slot: Slot) {
    setSelected(slot);
    setValue('slotId', slot.id);
    setError('');
  }
  async function submit(values: BookingInput) {
    setError('');
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error);
        if (response.status === 409) {
          setSelected(null);
          void load().then(() => setError(data.error));
        }
        return;
      }
      setReceipt(data);
      setManageUrl(`${window.location.origin}/booking/manage#${data.token}`);
    } catch {
      setError(
        'Connection interrupted. Please retry; your request will not create a duplicate booking.',
      );
    }
  }
  if (receipt)
    return (
      <div className="form-card" role="status">
        <div className="receipt-icon">
          <Check />
        </div>
        <h2>
          {receipt.status === 'confirmed'
            ? 'Your discovery call is booked.'
            : `Booking ${receipt.status}`}
        </h2>
        <p>
          {new Date(receipt.starts_at).toLocaleString(undefined, {
            timeZone: timezone,
            dateStyle: 'full',
            timeStyle: 'short',
          })}{' '}
          · {timezone}
        </p>
        <p>
          Save your calendar event and private management link below. The team will share meeting
          details separately.
        </p>
        <div className="receipt-actions">
          <Button onClick={() => downloadCalendar(receipt)}>
            <CalendarDays size={16} /> Add to calendar
          </Button>
          <Button
            variant="outline"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(manageUrl);
                setCopied(true);
              } catch {
                setCopied(false);
              }
            }}
          >
            <Copy size={15} />
            {copied ? 'Copied' : 'Copy private link'}
          </Button>
        </div>
        <Link className="manage-url" href={manageUrl}>
          {manageUrl}
        </Link>
        <p className="input-explanation">
          Keep this link private. It lets you view or cancel your booking. Email delivery depends on
          the team’s notification setup.
        </p>
      </div>
    );
  return (
    <div className="form-card">
      <h2>{selected ? 'A few details, then you’re in.' : 'Find a time that works.'}</h2>
      <p>A focused, 30-minute discovery call. All times are shown in your selected timezone.</p>
      <label className="field">
        <span>Your timezone</span>
        <select
          value={timezone}
          onChange={(e) => {
            setTimezone(e.target.value);
            setValue('timezone', e.target.value);
          }}
        >
          {Array.from(new Set([timezone, 'UTC', ...Intl.supportedValuesOf('timeZone')]))
            .sort()
            .map((z) => (
              <option key={z}>{z}</option>
            ))}
        </select>
      </label>
      {!selected && (
        <>
          {loading ? (
            <p className="booking-loading">Loading available times…</p>
          ) : !configured ? (
            <div className="empty-state">
              Online scheduling is opening soon. Please check back for published discovery times.
            </div>
          ) : slots.length === 0 ? (
            <div className="empty-state">
              No discovery times are currently published.{' '}
              <Link className="text-link" href="/audit">
                Request a growth audit instead <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            <div className="slot-grid">
              {slots.map((slot) => (
                <button className="slot-button" key={slot.id} onClick={() => select(slot)}>
                  <span>
                    {new Date(slot.starts_at).toLocaleDateString(undefined, {
                      timeZone: timezone,
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                  <strong>
                    {new Date(slot.starts_at).toLocaleTimeString(undefined, {
                      timeZone: timezone,
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </strong>
                </button>
              ))}
            </div>
          )}
          {hasMore && slots.length > 0 && (
            <Button
              variant="outline"
              disabled={loadingMore}
              onClick={() => {
                setLoadingMore(true);
                void load(undefined, slots[slots.length - 1].starts_at, true);
              }}
            >
              {loadingMore ? 'Loading more times…' : 'Show more times'}
            </Button>
          )}
          {error && (
            <>
              <p className="form-error" role="alert">
                {error}
              </p>
              <Button variant="outline" onClick={() => void load()}>
                Retry availability
              </Button>
            </>
          )}
        </>
      )}
      {selected && (
        <form
          noValidate
          onSubmit={(e) => {
            setValue('requestId', requestId.current);
            void handleSubmit(submit)(e);
          }}
        >
          <div className="booking-selected">
            <span>
              {new Date(selected.starts_at).toLocaleString(undefined, {
                timeZone: timezone,
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </span>
            <button type="button" onClick={() => setSelected(null)}>
              Change
            </button>
          </div>
          <div className="form-grid">
            {(['name', 'email'] as const).map((key) => (
              <label className="field" key={key}>
                <span>{key === 'name' ? 'Your name' : 'Work email'}</span>
                <input
                  {...register(key)}
                  autoComplete={key}
                  type={key === 'email' ? 'email' : 'text'}
                  aria-invalid={Boolean(errors[key])}
                />
                {errors[key] && <small className="form-error">{errors[key].message}</small>}
              </label>
            ))}
          </div>
          <label className="field" style={{ marginTop: 20 }}>
            <span>Your website</span>
            <input
              {...register('website')}
              type="url"
              placeholder="https://yourbrand.com"
              aria-invalid={Boolean(errors.website)}
            />
            {errors.website && <small className="form-error">{errors.website.message}</small>}
          </label>
          <label className="field" style={{ marginTop: 20 }}>
            <span>What would make this conversation useful? (optional)</span>
            <textarea {...register('notes')} maxLength={1500} />
            {errors.notes && <small className="form-error">{errors.notes.message}</small>}
          </label>
          <div className="honeypot" aria-hidden="true">
            <label>
              Leave empty
              <input {...register('company')} tabIndex={-1} autoComplete="off" />
            </label>
          </div>
          <label className="checkbox-field">
            <input type="checkbox" {...register('consent')} />
            <span>
              I agree to the <Link href="/privacy">privacy notice</Link> and appointment-related
              communication.
            </span>
          </label>
          {errors.consent && <p className="form-error">{errors.consent.message}</p>}
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Reserving your time…' : 'Confirm discovery call'}
            <ArrowRight size={16} />
          </Button>
        </form>
      )}
    </div>
  );
}

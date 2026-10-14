'use client';
import { useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { plans } from '@/lib/pricing';
import type { PaymentMethod } from '@/types';
export function PaymentForm({ methods }: { methods: PaymentMethod[] }) {
  const [planId, setPlanId] = useState(plans[0].id);
  const [methodId, setMethodId] = useState(methods[0]?.id ?? '');
  const [senderNumber, setSenderNumber] = useState('');
  const [trxid, setTrxid] = useState('');
  const [payerName, setPayerName] = useState('');
  const [payerEmail, setPayerEmail] = useState('');
  const [note, setNote] = useState('');
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState('');
  const method = methods.find((m) => m.id === methodId) ?? methods[0];
  const plan = plans.find((p) => p.id === planId) ?? plans[0];
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          methodId: method?.id,
          plan: plan.name,
          amountText: `${plan.price} ${plan.cadence}`,
          senderNumber,
          trxid,
          payerName,
          payerEmail,
          note,
          consent,
          company: '',
          requestId: crypto.randomUUID(),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Your payment could not be recorded.');
      setReceipt(data.id);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Your payment could not be recorded.');
    } finally {
      setSubmitting(false);
    }
  }
  if (receipt)
    return (
      <div className="form-card" role="status">
        <div className="receipt-icon">
          <Check />
        </div>
        <h2>Payment submitted for verification.</h2>
        <p>
          Reference <code>{receipt}</code>. The team will verify transaction{' '}
          <strong>{trxid}</strong> and confirm by email. Verification is manual and usually
          completed within one business day.
        </p>
      </div>
    );
  return (
    <form className="form-card" noValidate onSubmit={(e) => void submit(e)}>
      <h2>Submit your payment</h2>
      <p>Pay with any method above, then record the transaction ID here for verification.</p>
      <div className="form-grid">
        <label className="field">
          <span>Engagement</span>
          <select value={planId} onChange={(e) => setPlanId(e.target.value)}>
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} · {p.price} {p.cadence}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Payment method</span>
          <select value={methodId} onChange={(e) => setMethodId(e.target.value)}>
            {methods.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="form-grid">
        <label className="field">
          <span>Your name</span>
          <input value={payerName} onChange={(e) => setPayerName(e.target.value)} required />
        </label>
        <label className="field">
          <span>Work email</span>
          <input
            type="email"
            value={payerEmail}
            onChange={(e) => setPayerEmail(e.target.value)}
            required
          />
        </label>
      </div>
      <div className="form-grid">
        <label className="field">
          <span>Sender account number</span>
          <input
            value={senderNumber}
            onChange={(e) => setSenderNumber(e.target.value)}
            required
            placeholder="01XXXXXXXXX"
          />
        </label>
        <label className="field">
          <span>Transaction ID (TrxID)</span>
          <input
            value={trxid}
            onChange={(e) => setTrxid(e.target.value)}
            required
            placeholder="As shown in your payment receipt"
          />
        </label>
      </div>
      <label className="field" style={{ marginTop: 20 }}>
        <span>Note (optional)</span>
        <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />
      </label>
      <label className="checkbox-field">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
        <span>
          I agree to the privacy notice and to being contacted about this payment.
        </span>
      </label>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" disabled={submitting}>
        {submitting ? 'Recording payment…' : 'Submit for verification'}
        <ArrowRight size={16} />
      </Button>
    </form>
  );
}

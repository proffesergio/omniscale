import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { plans } from '@/lib/pricing';
import { databaseConfigured, db } from '@/lib/supabase';
import type { PaymentMethod } from '@/types';
import { PaymentForm } from '@/components/marketing/payment-form';
export const metadata: Metadata = { title: 'Engagement models and pricing' };
export default async function PricingPage() {
  const configured = databaseConfigured();
  let methods: PaymentMethod[] = [];
  if (configured) {
    const { data } = await db()
      .from('payment_methods')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')
      .order('created_at');
    methods = (data ?? []) as PaymentMethod[];
  }
  return (
    <div className="container">
      <div className="page-intro">
        <div className="eyebrow">ENGAGEMENT MODELS</div>
        <h1>
          Clear scopes.
          <br />
          Honest economics.
        </h1>
        <p>
          Starting rates below. Every engagement begins with a conversation — figures are modeled
          estimates, never guaranteed outcomes.
        </p>
      </div>
      <div className="admin-columns">
        {plans.map((plan) => (
          <section className="admin-panel" key={plan.id}>
            <h3>{plan.name}</h3>
            <p>
              <strong>{plan.price}</strong> · {plan.cadence}
            </p>
            <p>{plan.blurb}</p>
            <ul>
              {plan.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <div className="page-intro" style={{ marginTop: 40 }}>
        <div className="eyebrow">PAY WITH MOBILE BANKING</div>
        <h2>Pay, then share your transaction ID.</h2>
        <p>
          Send the amount to any account below, then submit the form so the team can verify it by
          hand. Prefer a call first?{' '}
          <Link className="text-link" href="/booking">
            Book a discovery call <ArrowUpRight size={14} />
          </Link>
        </p>
      </div>
      {!configured ? (
        <div className="empty-state">
          Online payments are opening soon. Please check back for published payment details, or{' '}
          <Link className="text-link" href="/audit">
            request a growth audit instead <ArrowUpRight size={14} />
          </Link>
        </div>
      ) : methods.length === 0 ? (
        <div className="empty-state">
          No payment methods are published yet. The team is setting up receiving accounts.
        </div>
      ) : (
        <>
          <div className="admin-columns">
            {methods.map((m) => (
              <section className="admin-panel" key={m.id}>
                <h3>{m.label}</h3>
                <p>
                  <strong>{m.account_number}</strong>
                  {m.account_name && ` · ${m.account_name}`}
                </p>
                {m.qr_image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={m.qr_image_url}
                    alt={`${m.label} payment QR code`}
                    style={{ maxWidth: 220, height: 'auto', marginTop: 12 }}
                  />
                )}
                {m.instructions && <p style={{ marginTop: 12 }}>{m.instructions}</p>}
              </section>
            ))}
          </div>
          <div style={{ marginTop: 30 }}>
            <PaymentForm methods={methods} />
          </div>
        </>
      )}
    </div>
  );
}

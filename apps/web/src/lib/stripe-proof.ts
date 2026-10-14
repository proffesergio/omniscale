import 'server-only';
import { z } from 'zod';
const chargeSchema = z.object({
  id: z.string(),
  paid: z.boolean(),
  captured: z.boolean(),
  disputed: z.boolean(),
  status: z.string(),
  amount_captured: z.number().int().nonnegative(),
  amount_refunded: z.number().int().nonnegative(),
  currency: z.string(),
  livemode: z.boolean(),
  created: z.number(),
});
// Only explicitly approved charge IDs are read. No Stripe data is published automatically.
export async function verifyRevenueEvidence() {
  const key = process.env.STRIPE_SECRET_KEY;
  const ids = (process.env.STRIPE_PROOF_CHARGE_IDS || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
  if (!key || ids.length === 0) throw new Error('Stripe evidence is not configured');
  if (ids.length > 50 || ids.some((id) => !/^ch_[A-Za-z0-9]+$/.test(id)))
    throw new Error('Configure up to 50 approved Stripe charge IDs');
  const charges = [];
  for (const id of new Set(ids)) {
    const response = await fetch(`https://api.stripe.com/v1/charges/${id}`, {
      headers: { Authorization: `Bearer ${key}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error('Stripe verification failed');
    const charge = chargeSchema.parse(await response.json());
    if (
      !charge.livemode ||
      !charge.paid ||
      !charge.captured ||
      charge.disputed ||
      charge.status !== 'succeeded'
    )
      throw new Error('Evidence must reference captured, undisputed, successful live payments');
    charges.push(charge);
  }
  const totals: Record<string, number> = {};
  charges.forEach((c) => {
    totals[c.currency] = (totals[c.currency] || 0) + c.amount_captured - c.amount_refunded;
  });
  return {
    verifiedAt: new Date().toISOString(),
    source: 'Stripe charge API',
    scope:
      'Net collected amounts for explicitly selected charges, less refunds recorded at verification time.',
    totalsInStripeMinorUnits: totals,
    chargeCount: charges.length,
    limitation:
      'Payment evidence does not verify attribution, incremental revenue, profit, or ROI.',
  };
}

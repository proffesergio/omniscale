import { afterEach, beforeEach, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { verifyRevenueEvidence } from '@/lib/stripe-proof';
const charge = {
  id: 'ch_approved',
  paid: true,
  captured: true,
  disputed: false,
  status: 'succeeded',
  amount_captured: 5000,
  amount_refunded: 1000,
  currency: 'usd',
  livemode: true,
  created: 1700000000,
};
beforeEach(() => {
  vi.stubEnv('STRIPE_SECRET_KEY', 'test-secret');
  vi.stubEnv('STRIPE_PROOF_CHARGE_IDS', 'ch_approved,ch_approved');
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
it('uses captured amounts less refunds, deduplicates IDs, and does not equate revenue with ROI', async () => {
  const fetcher = vi.fn().mockResolvedValue(Response.json(charge));
  vi.stubGlobal('fetch', fetcher);
  const report = await verifyRevenueEvidence();
  expect(report.totalsInStripeMinorUnits.usd).toBe(4000);
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect(report.limitation).toContain('does not verify');
});
it('rejects authorizations, disputed charges, and test payments as public evidence', async () => {
  for (const changes of [{ captured: false }, { disputed: true }, { livemode: false }]) {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ ...charge, ...changes })));
    await expect(verifyRevenueEvidence()).rejects.toThrow();
  }
});

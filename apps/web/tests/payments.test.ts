import { describe, expect, it } from 'vitest';
import { manualPaymentSchema, paymentMethodSchema } from '@/lib/validators';

const method = {
  provider: 'bkash',
  label: 'bKash Personal',
  accountName: 'OmniScale',
  accountNumber: '01XXXXXXXXX',
  qrImageUrl: '/qr/bkash.png',
  instructions: 'Send Money, then submit the TrxID.',
  isActive: true,
  sortOrder: 0,
};

const payment = {
  methodId: '123e4567-e89b-12d3-a456-426614174000',
  plan: 'Growth Audit',
  amountText: 'BDT 15,000 one-time',
  senderNumber: '01800000000',
  trxid: 'TRX123ABC',
  payerName: 'Ada Lovelace',
  payerEmail: 'ada@example.com',
  note: '',
  consent: true,
  company: '',
  requestId: '123e4567-e89b-12d3-a456-426614174001',
};

describe('payment method validation', () => {
  it('accepts a complete method with a site-local QR path', () => {
    expect(paymentMethodSchema.safeParse(method).success).toBe(true);
  });

  it('accepts an empty QR field and a data-URI QR', () => {
    expect(
      paymentMethodSchema.safeParse({ ...method, qrImageUrl: '' }).success,
    ).toBe(true);
    expect(
      paymentMethodSchema.safeParse({
        ...method,
        qrImageUrl: 'data:image/png;base64,iVBORw0KGgo=',
      }).success,
    ).toBe(true);
  });

  it('rejects unknown providers and off-site QR URLs', () => {
    expect(
      paymentMethodSchema.safeParse({ ...method, provider: 'paypal' }).success,
    ).toBe(false);
    expect(
      paymentMethodSchema.safeParse({ ...method, qrImageUrl: 'https://cdn.example/qr.png' })
        .success,
    ).toBe(false);
  });
});

describe('manual payment validation', () => {
  it('accepts a complete TrxID submission', () => {
    expect(manualPaymentSchema.safeParse(payment).success).toBe(true);
  });

  it('rejects bad contact details, missing consent, and honeypot fills', () => {
    expect(
      manualPaymentSchema.safeParse({ ...payment, payerEmail: 'not-an-email' }).success,
    ).toBe(false);
    expect(manualPaymentSchema.safeParse({ ...payment, trxid: 'x' }).success).toBe(false);
    expect(manualPaymentSchema.safeParse({ ...payment, consent: false }).success).toBe(false);
    expect(manualPaymentSchema.safeParse({ ...payment, company: 'bot' }).success).toBe(false);
  });
});

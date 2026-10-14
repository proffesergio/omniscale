import { z } from 'zod';
const publicUrl = z
  .string()
  .trim()
  .max(500)
  .url('Enter a full URL, including https://')
  .refine((value) => {
    try {
      const u = new URL(value);
      return (
        ['https:', 'http:'].includes(u.protocol) &&
        !u.username &&
        !u.password &&
        u.hostname.includes('.') &&
        u.hostname !== 'localhost'
      );
    } catch {
      return false;
    }
  }, 'Enter a public website URL.');
export const auditSchema = z.object({
  website: publicUrl,
  competitor: publicUrl,
  channel: z.enum(['Meta Ads', 'Google Ads', 'TikTok Ads', 'LinkedIn Ads', 'Other']),
  linkedin: publicUrl.refine((v) => {
    try {
      const u = new URL(v);
      return (
        ['linkedin.com', 'www.linkedin.com'].includes(u.hostname) && u.pathname.startsWith('/in/')
      );
    } catch {
      return false;
    }
  }, 'Use your LinkedIn profile URL.'),
  name: z.string().trim().min(2).max(100),
  email: z.email().max(254).toLowerCase(),
  businessType: z.enum(['E-commerce', 'B2B SaaS', 'Other']),
  consent: z.boolean().refine(Boolean, 'Please agree so we can respond to your request.'),
  company: z.string().max(0),
  requestId: z.uuid(),
});
export type AuditInput = z.infer<typeof auditSchema>;
export const bookingSchema = z.object({
  slotId: z.uuid(),
  name: z.string().trim().min(2).max(100),
  email: z.email().max(254).toLowerCase(),
  website: publicUrl,
  timezone: z
    .string()
    .min(1)
    .max(100)
    .refine((v) => {
      try {
        new Intl.DateTimeFormat('en', { timeZone: v });
        return true;
      } catch {
        return false;
      }
    }, 'Invalid timezone'),
  notes: z.string().trim().max(1500),
  consent: z.boolean().refine(Boolean, 'Please accept the privacy notice.'),
  company: z.string().max(0),
  requestId: z.uuid(),
});
export type BookingInput = z.infer<typeof bookingSchema>;
export const paymentProviders = ['bkash', 'nagad', 'rocket', 'bank', 'card', 'other'] as const;
const qrImage = z
  .string()
  .trim()
  .max(2000)
  .refine(
    (value) =>
      value === '' ||
      value.startsWith('/qr/') ||
      (value.startsWith('data:image/') && value.includes(';base64,')),
    'Use a /qr/ image path from the site or a data:image base64 URI.',
  );
export const paymentMethodSchema = z.object({
  provider: z.enum(paymentProviders),
  label: z.string().trim().min(2).max(80),
  accountName: z.string().trim().max(100),
  accountNumber: z.string().trim().min(3).max(60),
  qrImageUrl: qrImage,
  instructions: z.string().trim().max(1000),
  isActive: z.boolean(),
  sortOrder: z.coerce.number().int().min(0).max(1000),
});
export type PaymentMethodInput = z.infer<typeof paymentMethodSchema>;
export const manualPaymentSchema = z.object({
  methodId: z.uuid(),
  plan: z.string().trim().min(2).max(80),
  amountText: z.string().trim().min(1).max(40),
  senderNumber: z.string().trim().min(6).max(20),
  trxid: z.string().trim().min(4).max(60),
  payerName: z.string().trim().min(2).max(100),
  payerEmail: z.email().max(254).toLowerCase(),
  note: z.string().trim().max(500),
  consent: z.boolean().refine(Boolean, 'Please accept the privacy notice.'),
  company: z.string().max(0),
  requestId: z.uuid(),
});
export type ManualPaymentInput = z.infer<typeof manualPaymentSchema>;

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

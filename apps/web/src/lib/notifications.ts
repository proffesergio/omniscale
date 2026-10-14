import 'server-only';
import { createHmac } from 'node:crypto';
import { secretHash } from '@/lib/security';
type Notification = {
  id: string;
  kind: string;
  payload: Record<string, unknown>;
  attempts: number;
};
function httpsEndpoint(value: string) {
  const url = new URL(value);
  if (url.protocol !== 'https:') throw new Error('Notification endpoint must use HTTPS');
  return url;
}
export async function deliverNotification(item: Notification) {
  const p = item.payload;
  if (item.kind === 'audit') {
    if (!process.env.AUDIT_WEBHOOK_URL) throw new Error('Audit delivery is not configured');
    const url = httpsEndpoint(process.env.AUDIT_WEBHOOK_URL);
    const provider = process.env.AUDIT_WEBHOOK_PROVIDER || 'generic';
    const text = `New OmniScale growth audit\nName: ${p.name}\nEmail: ${p.email}\nWebsite: ${p.website}\nCompetitor: ${p.competitor}\nChannel: ${p.channel}\nBusiness: ${p.businessType}\nLinkedIn: ${p.linkedin}`;
    const payload =
      provider === 'slack'
        ? {
            text: text.replace(/[<>&]/g, ' '),
            mrkdwn: false,
            unfurl_links: false,
            unfurl_media: false,
          }
        : provider === 'discord'
          ? { content: text, allowed_mentions: { parse: [] } }
          : { event: 'audit.created', eventId: item.id, data: p };
    const body = JSON.stringify(payload);
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-OmniScale-Event-Id': item.id,
      'X-OmniScale-Timestamp': timestamp,
    };
    if (provider === 'generic') {
      if (!process.env.AUDIT_WEBHOOK_SECRET)
        throw new Error('Webhook signing secret is not configured');
      headers['X-OmniScale-Signature'] = createHmac('sha256', process.env.AUDIT_WEBHOOK_SECRET)
        .update(`${timestamp}.${body}`)
        .digest('hex');
    }
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body,
      signal: AbortSignal.timeout(10000),
      redirect: 'error',
    });
    if (!response.ok) throw new Error(`Webhook delivery returned ${response.status}`);
  } else if (item.kind === 'booking') {
    const key = process.env.RESEND_API_KEY;
    const from = process.env.BOOKING_FROM_EMAIL;
    const site = process.env.NEXT_PUBLIC_SITE_URL;
    if (!key || !from || !site) throw new Error('Booking email delivery is not configured');
    const timezone = String(p.timezone || 'UTC');
    const when = new Date(String(p.starts_at)).toLocaleString('en-US', {
      timeZone: timezone,
      dateStyle: 'full',
      timeStyle: 'short',
    });
    const link = `${site}/booking/manage#${secretHash(`booking-management:${p.id}`)}`;
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': item.id,
      },
      body: JSON.stringify({
        from,
        to: [String(p.email)],
        subject: `OmniScale discovery call: ${p.status}`,
        text: `Hi ${p.name},\n\nYour OmniScale discovery call is ${p.status}.\n\n${when} (${timezone})\nDuration: 30 minutes\n\nView or cancel your booking using this private link:\n${link}\n\nThe team will share meeting details separately.\n\nOmniScale`,
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error(`Email delivery returned ${response.status}`);
  } else if (item.kind === 'payment') {
    const key = process.env.RESEND_API_KEY;
    const from = process.env.BOOKING_FROM_EMAIL;
    const team = process.env.CONTACT_EMAIL;
    if (!key || !from || !team) throw new Error('Payment notification delivery is not configured');
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': item.id,
      },
      body: JSON.stringify({
        from,
        to: [team],
        subject: `OmniScale payment to verify: ${p.trxid}`,
        text: `A manual payment needs verification.\n\nPlan: ${p.plan}\nAmount: ${p.amountText}\nPayer: ${p.payerName} <${p.payerEmail}>\nSender number: ${p.senderNumber}\nTransaction ID: ${p.trxid}\nNote: ${p.note || '-'}\n\nVerify it in the admin panel. This notice retries until delivery succeeds.`,
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error(`Email delivery returned ${response.status}`);
  } else throw new Error('Unknown notification type');
}

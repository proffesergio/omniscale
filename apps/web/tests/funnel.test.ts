import { describe, expect, it } from 'vitest';
import { calculateFunnel, defaultInputs } from '@/lib/funnel';
import { currencyForCountry, currencyForTimezone } from '@/lib/currency';
import { auditSchema, bookingSchema } from '@/lib/validators';
import { calendarEvent } from '@/lib/calendar';
describe('Funnel economics', () => {
  it('calculates CAC, gross-profit LTV, ROAS and MER from independent inputs', () => {
    const r = calculateFunnel(defaultInputs);
    expect(r.baseline.impressions).toBeCloseTo(1666666.6667, 2);
    expect(r.baseline.orders).toBeCloseTo(500);
    expect(r.baseline.revenue).toBe(42500);
    expect(r.baseline.cac).toBe(50);
    expect(r.baseline.roas).toBe(2.125);
    expect(r.ltv).toBeCloseTo(122.4);
    expect(r.mer).toBe(2.6);
    expect(r.optimized.revenue).toBeCloseTo(56100);
    expect(r.revenueLift).toBeCloseTo(13600);
    expect(r.contributionLift).toBeCloseTo(8160);
  });
  it('produces zero lift and zero spend gap when there is no assumed improvement', () => {
    const r = calculateFunnel({ ...defaultInputs, hookLift: 0, conversionLift: 0 });
    expect(r.revenueLift).toBe(0);
    expect(r.equivalentSpendGap).toBe(0);
  });
  it('caps modeled rates at 100% and preserves funnel ordering', () => {
    const r = calculateFunnel({
      ...defaultInputs,
      hookRate: 90,
      clickThroughRate: 85,
      conversionRate: 95,
      hookLift: 100,
      conversionLift: 100,
    });
    expect(r.optimized.hooks).toBe(r.optimized.impressions);
    expect(r.optimized.clicks).toBeLessThanOrEqual(r.optimized.hooks);
    expect(r.optimized.orders).toBeLessThanOrEqual(r.optimized.clicks);
  });
  it('rejects invalid, nonfinite, and inconsistent economics', () => {
    for (const change of [
      { spend: 0 },
      { aov: NaN },
      { cpm: Infinity },
      { hookRate: 101 },
      { hookRate: 0.5, clickThroughRate: 1 },
      { totalMarketingSpend: 100 },
    ])
      expect(() => calculateFunnel({ ...defaultInputs, ...change })).toThrow();
  });
  it('keeps MER independent of attributed paid revenue', () => {
    const r = calculateFunnel({ ...defaultInputs, totalRevenue: 100000 });
    expect(r.baseline.revenue).toBe(42500);
    expect(r.mer).toBe(4);
  });
});
describe('Regional suggestions', () => {
  it('selects BDT, EUR, or USD without implying FX conversion', () => {
    expect(currencyForCountry('BD')).toBe('BDT');
    expect(currencyForCountry('DE')).toBe('EUR');
    expect(currencyForCountry('GB')).toBe('USD');
    expect(currencyForTimezone('Asia/Dhaka')).toBe('BDT');
    expect(currencyForTimezone('Europe/Berlin')).toBe('EUR');
    expect(currencyForTimezone('America/New_York')).toBe('USD');
  });
});
describe('Intake validation', () => {
  it('returns validation issues instead of throwing for an empty LinkedIn URL', () => {
    expect(() => auditSchema.safeParse({ linkedin: '' })).not.toThrow();
  });
  const valid = {
    website: 'https://brand.example',
    competitor: 'https://competitor.example',
    channel: 'Meta Ads',
    linkedin: 'https://www.linkedin.com/in/founder',
    name: 'Alex Morgan',
    email: 'alex@example.com',
    businessType: 'E-commerce',
    consent: true,
    company: '',
    requestId: '4a91cbf7-197c-42dc-82b4-a815429ef5ad',
  };
  it('rejects unsafe URLs, lookalike LinkedIn hosts, missing consent and honeypot entries', () => {
    expect(auditSchema.safeParse(valid).success).toBe(true);
    for (const change of [
      { website: 'javascript:alert(1)' },
      { linkedin: 'https://linkedin.com.attacker.test/in/alex' },
      { consent: false },
      { company: 'spam' },
      { email: 'not-an-email' },
    ])
      expect(auditSchema.safeParse({ ...valid, ...change }).success).toBe(false);
  });
  it('requires a real timezone and a slot identifier for a booking', () => {
    const data = {
      slotId: valid.requestId,
      name: valid.name,
      email: valid.email,
      website: valid.website,
      timezone: 'Asia/Dhaka',
      notes: '',
      consent: true,
      company: '',
      requestId: valid.requestId,
    };
    expect(bookingSchema.safeParse(data).success).toBe(true);
    expect(bookingSchema.safeParse({ ...data, timezone: 'Mars/City' }).success).toBe(false);
  });
});
it('exports a UTC calendar event that keeps local timezone conversion unambiguous', () => {
  const text = calendarEvent({
    id: 'test-booking',
    starts_at: '2026-10-25T15:00:00+06:00',
    ends_at: '2026-10-25T15:30:00+06:00',
  });
  expect(text).toContain('DTSTART:20261025T090000Z');
  expect(text).toContain('DTEND:20261025T093000Z');
  expect(text).toContain('UID:test-booking@omniscale');
  expect(text.endsWith('\r\n')).toBe(true);
});

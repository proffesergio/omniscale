import type { Currency } from '@/types';
export const currencies: Currency[] = ['USD', 'EUR', 'BDT'];
export const isCurrency = (v: unknown): v is Currency => currencies.includes(v as Currency);
const euroCountries = new Set([
  'AT',
  'BE',
  'BG',
  'HR',
  'CY',
  'EE',
  'FI',
  'FR',
  'DE',
  'GR',
  'IE',
  'IT',
  'LV',
  'LT',
  'LU',
  'MT',
  'NL',
  'PT',
  'SK',
  'SI',
  'ES',
]);
export function currencyForCountry(country?: string | null): Currency {
  if (country?.toUpperCase() === 'BD') return 'BDT';
  return euroCountries.has(country?.toUpperCase() ?? '') ? 'EUR' : 'USD';
}
export function currencyForTimezone(timezone: string): Currency {
  if (timezone === 'Asia/Dhaka') return 'BDT';
  const euroZones = [
    'Amsterdam',
    'Andorra',
    'Athens',
    'Berlin',
    'Bratislava',
    'Brussels',
    'Dublin',
    'Helsinki',
    'Lisbon',
    'Ljubljana',
    'Luxembourg',
    'Madrid',
    'Malta',
    'Monaco',
    'Paris',
    'Riga',
    'Rome',
    'San_Marino',
    'Sofia',
    'Tallinn',
    'Vatican',
    'Vienna',
    'Vilnius',
    'Zagreb',
    'Nicosia',
  ];
  return euroZones.some((zone) => timezone === `Europe/${zone}` || timezone === `Asia/${zone}`)
    ? 'EUR'
    : 'USD';
}
export const money = (value: number, currency: Currency, compact = false) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
    notation: compact ? 'compact' : 'standard',
  }).format(value);

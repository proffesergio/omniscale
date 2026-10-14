export type Currency = 'USD' | 'EUR' | 'BDT';
export type BusinessType = 'E-commerce' | 'B2B SaaS';
export interface FunnelInputs {
  aov: number;
  spend: number;
  conversionRate: number;
  hookRate: number;
  cpm: number;
  clickThroughRate: number;
  newCustomerShare: number;
  ordersPerCustomer: number;
  grossMargin: number;
  totalRevenue: number;
  totalMarketingSpend: number;
  hookLift: number;
  conversionLift: number;
}
export interface FunnelScenario {
  impressions: number;
  hooks: number;
  clicks: number;
  orders: number;
  customers: number;
  revenue: number;
  cac: number | null;
  roas: number;
}
export interface FunnelResults {
  baseline: FunnelScenario;
  optimized: FunnelScenario;
  ltv: number;
  ltvCac: number | null;
  mer: number | null;
  revenueLift: number;
  contributionLift: number;
  equivalentSpendGap: number;
}
export interface Blueprint {
  slug: string;
  name: string;
  type: BusinessType;
  category: string;
  title: string;
  description: string;
  palette: 'sage' | 'peach' | 'violet';
  product: string;
  hypothesis: string;
  metrics: { label: string; value: string }[];
  tests: string[];
}
export interface Slot {
  id: string;
  starts_at: string;
  ends_at: string;
}
export interface Booking {
  id: string;
  slot_id: string;
  name: string;
  email: string;
  website: string;
  timezone: string;
  notes: string;
  status: 'confirmed' | 'cancelled' | 'completed';
  created_at: string;
  slots: Slot;
}
export interface Testimonial {
  id: string;
  quote: string;
  name: string;
  role: string;
  company: string;
  type: BusinessType;
  approvedAt: string;
  sourceUrl: string;
}

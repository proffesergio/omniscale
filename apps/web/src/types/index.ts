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
export interface PaymentMethod {
  id: string;
  provider: 'bkash' | 'nagad' | 'rocket' | 'bank' | 'card' | 'other';
  label: string;
  account_name: string;
  account_number: string;
  qr_image_url: string;
  instructions: string;
  is_active: boolean;
  sort_order: number;
}
export interface ManualPayment {
  id: string;
  method_id: string;
  plan: string;
  amount_text: string;
  sender_number: string;
  trxid: string;
  payer_name: string;
  payer_email: string;
  note: string;
  status: 'pending' | 'verified' | 'rejected';
  created_at: string;
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

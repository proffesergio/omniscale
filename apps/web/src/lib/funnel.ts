import { z } from 'zod';
import type { FunnelInputs, FunnelResults, FunnelScenario } from '@/types';
const percent = z.number().finite().min(0).max(100);
export const funnelSchema = z
  .object({
    aov: z.number().finite().min(1).max(1e9),
    spend: z.number().finite().min(1).max(1e12),
    conversionRate: percent.min(0.01),
    hookRate: percent.min(0.01),
    cpm: z.number().finite().min(0.01).max(1e6),
    clickThroughRate: percent.min(0.01),
    newCustomerShare: percent.min(0.01),
    ordersPerCustomer: z.number().finite().min(1).max(1000),
    grossMargin: percent,
    totalRevenue: z.number().finite().min(0).max(1e12),
    totalMarketingSpend: z.number().finite().min(0).max(1e12),
    hookLift: percent,
    conversionLift: percent,
  })
  .refine((v) => v.clickThroughRate <= v.hookRate, {
    message: 'Click-through rate must not exceed hook rate in this sequential model.',
    path: ['clickThroughRate'],
  })
  .refine((v) => v.totalMarketingSpend >= v.spend, {
    message: 'Total marketing spend must include the ad spend above.',
    path: ['totalMarketingSpend'],
  });
export const defaultInputs: FunnelInputs = {
  aov: 85,
  spend: 20000,
  conversionRate: 2.5,
  hookRate: 25,
  cpm: 12,
  clickThroughRate: 1.2,
  newCustomerShare: 80,
  ordersPerCustomer: 2.4,
  grossMargin: 60,
  totalRevenue: 65000,
  totalMarketingSpend: 25000,
  hookLift: 20,
  conversionLift: 10,
};
export function calculateFunnel(raw: FunnelInputs): FunnelResults {
  const v = funnelSchema.parse(raw);
  const impressions = (v.spend / v.cpm) * 1000;
  const projectedHookRate = Math.min(100, v.hookRate * (1 + v.hookLift / 100));
  const projectedCtr = Math.min(100, (v.clickThroughRate * projectedHookRate) / v.hookRate);
  const projectedCvr = Math.min(100, v.conversionRate * (1 + v.conversionLift / 100));
  const scenario = (hook: number, ctr: number, cvr: number): FunnelScenario => {
    const clicks = impressions * (ctr / 100);
    const orders = clicks * (cvr / 100);
    const customers = orders * (v.newCustomerShare / 100);
    const revenue = orders * v.aov;
    return {
      impressions,
      hooks: impressions * (hook / 100),
      clicks,
      orders,
      customers,
      revenue,
      cac: customers > 0 ? v.spend / customers : null,
      roas: revenue / v.spend,
    };
  };
  const baseline = scenario(v.hookRate, v.clickThroughRate, v.conversionRate);
  const optimized = scenario(projectedHookRate, projectedCtr, projectedCvr);
  const ltv = (v.aov * v.ordersPerCustomer * v.grossMargin) / 100;
  return {
    baseline,
    optimized,
    ltv,
    ltvCac: baseline.cac ? ltv / baseline.cac : null,
    mer: v.totalMarketingSpend > 0 ? v.totalRevenue / v.totalMarketingSpend : null,
    revenueLift: optimized.revenue - baseline.revenue,
    contributionLift: ((optimized.revenue - baseline.revenue) * v.grossMargin) / 100,
    equivalentSpendGap:
      optimized.roas > 0 ? Math.max(0, v.spend - baseline.revenue / optimized.roas) : 0,
  };
}

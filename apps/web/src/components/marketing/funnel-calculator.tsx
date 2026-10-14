'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, SlidersHorizontal, Info, RotateCcw } from 'lucide-react';
import { calculateFunnel, defaultInputs, funnelSchema } from '@/lib/funnel';
import { useCurrency } from '@/hooks/use-currency';
import { money } from '@/lib/currency';
import type { Currency, FunnelInputs } from '@/types';
const defaultByCurrency = (currency: Currency): FunnelInputs =>
  currency === 'BDT'
    ? {
        ...defaultInputs,
        aov: 4000,
        spend: 500000,
        cpm: 300,
        totalRevenue: 1600000,
        totalMarketingSpend: 650000,
      }
    : { ...defaultInputs };
function CalculatorBody({ currency, compact }: { currency: Currency; compact: boolean }) {
  const [inputs, setInputs] = useState<FunnelInputs>(() => defaultByCurrency(currency));
  const [advanced, setAdvanced] = useState(false);
  const valid = funnelSchema.safeParse(inputs);
  const result = valid.success ? calculateFunnel(inputs) : null;
  const update = (key: keyof FunnelInputs, value: string) =>
    setInputs((prev) => ({ ...prev, [key]: value === '' ? NaN : Number(value) }));
  const field = (
    key: keyof FunnelInputs,
    label: string,
    unit: string,
    min: number,
    max: number,
    step = 1,
  ) => (
    <label className="calc-field" key={key}>
      <span>{label}</span>
      <div>
        <span className="input-unit">{unit}</span>
        <input
          name={key}
          type="number"
          min={min}
          max={max}
          step={step}
          value={Number.isNaN(inputs[key]) ? '' : inputs[key]}
          onChange={(e) => update(key, e.target.value)}
        />
      </div>
    </label>
  );
  return (
    <div className="calculator-shell">
      <div className="calculator-controls">
        <div className="panel-label">
          <span>
            <SlidersHorizontal size={15} /> YOUR CURRENT NUMBERS
          </span>
          <button
            onClick={() => setInputs(defaultByCurrency(currency))}
            aria-label="Reset calculator"
          >
            <RotateCcw size={14} />
          </button>
        </div>
        <div className="calculator-fields">
          {field('aov', 'Average order value', currency, 1, 1e9)}
          {field('spend', 'Monthly ad spend', currency, 1, 1e12)}
          {field('conversionRate', 'Conversion rate', '%', 0.01, 100, 0.1)}
          {field('hookRate', 'Average hook rate', '%', 0.01, 100, 0.1)}
        </div>
        <button
          className="assumptions-toggle"
          aria-expanded={advanced}
          onClick={() => setAdvanced(!advanced)}
        >
          {advanced ? '−' : '+'} Model assumptions & advanced inputs
        </button>
        <p className="input-explanation">
          All amounts are in {currency}. Switching currency starts a new example; no exchange rate
          is implied.
        </p>
        {advanced && (
          <div className="advanced-fields">
            {field('cpm', 'Cost per 1,000 impressions', currency, 0.01, 1e6, 0.01)}
            {field('clickThroughRate', 'Click-through rate', '%', 0.01, 100, 0.1)}
            {field('newCustomerShare', 'New customer share', '%', 0.01, 100, 1)}
            {field('ordersPerCustomer', 'Lifetime orders per customer', '×', 1, 1000, 0.1)}
            {field('grossMargin', 'Gross margin', '%', 0, 100, 1)}
            {field('totalRevenue', 'Total monthly business revenue', currency, 0, 1e12)}
            {field('totalMarketingSpend', 'Total monthly marketing spend', currency, 0, 1e12)}
            {field('hookLift', 'Assumed relative hook-rate lift', '%', 0, 100, 1)}
            {field('conversionLift', 'Assumed relative conversion lift', '%', 0, 100, 1)}
          </div>
        )}
        {!valid.success && (
          <p className="form-error" role="alert">
            {valid.error.issues[0].message}
          </p>
        )}
        <div className="model-note">
          <Info size={15} />
          <p>
            Scenario model, not a forecast. Defaults assume {inputs.cpm || '—'} {currency} CPM,{' '}
            {inputs.clickThroughRate || '—'}% CTR, +{inputs.hookLift || 0}% relative hook lift and +
            {inputs.conversionLift || 0}% relative conversion lift. Media spend stays constant.
          </p>
        </div>
      </div>
      <div className="calculator-results" aria-live="polite" aria-atomic="true">
        <div className="panel-label">
          <span>YOUR GROWTH SCENARIO</span>
          <span className="scenario-badge">ILLUSTRATIVE</span>
        </div>
        {result ? (
          <>
            <div className="lift-number">
              <span>Potential monthly revenue lift</span>
              <strong>
                +{money(result.revenueLift, currency)}
                <ArrowUpRight size={32} />
              </strong>
              <small>
                {((result.optimized.revenue / result.baseline.revenue - 1) * 100).toFixed(1)}%
                increase at the same ad spend
              </small>
            </div>
            <div className="scenario-bars">
              <div>
                <span>Current revenue</span>
                <strong>{money(result.baseline.revenue, currency)}</strong>
              </div>
              <div className="bar-track">
                <i
                  style={{
                    width: `${(result.baseline.revenue / result.optimized.revenue) * 100}%`,
                  }}
                />
              </div>
              <div>
                <span>Modeled revenue</span>
                <strong>{money(result.optimized.revenue, currency)}</strong>
              </div>
              <div className="bar-track bar-orange">
                <i style={{ width: '100%' }} />
              </div>
            </div>
            <div className="metric-grid">
              <div>
                <span>Ad-only CAC</span>
                <strong>
                  {result.baseline.cac === null ? 'N/A' : money(result.baseline.cac, currency)}
                </strong>
              </div>
              <div>
                <span>ROAS · current → model</span>
                <strong>
                  {result.baseline.roas.toFixed(2)}× <span>→</span>{' '}
                  {result.optimized.roas.toFixed(2)}×
                </strong>
              </div>
              <div>
                <span>Gross-profit LTV</span>
                <strong>{money(result.ltv, currency)}</strong>
              </div>
              <div>
                <span>MER · all marketing</span>
                <strong>{result.mer?.toFixed(2) ?? 'N/A'}×</strong>
              </div>
            </div>
            {!compact && (
              <>
                <div className="funnel-dropoffs">
                  <h3>Where attention drops off</h3>
                  {(['impressions', 'hooks', 'clicks', 'orders'] as const).map((key, index) => (
                    <div key={key}>
                      <span>{key}</span>
                      <strong>{Math.round(result.baseline[key]).toLocaleString()}</strong>
                      <div className="dropoff-track">
                        <i style={{ width: `${[100, 72, 44, 20][index]}%` }} />
                      </div>
                    </div>
                  ))}
                  <small>Counts are calculated; bar widths are schematic.</small>
                </div>
                <div className="extra-metrics">
                  <p>
                    Equivalent spend gap{' '}
                    <strong>{money(result.equivalentSpendGap, currency)}</strong>
                  </p>
                  <p>
                    Potential gross-profit lift{' '}
                    <strong>{money(result.contributionLift, currency)}</strong>
                  </p>
                  <p>
                    LTV / ad-only CAC <strong>{result.ltvCac?.toFixed(2) ?? 'N/A'}×</strong>
                  </p>
                </div>
              </>
            )}
            <Link href="/audit" className="calculator-cta">
              Find the leaks in my funnel <ArrowUpRight size={17} />
            </Link>
          </>
        ) : (
          <div className="empty-state">Enter valid numbers to calculate your scenario.</div>
        )}
      </div>
    </div>
  );
}
export function FunnelCalculator({ compact = false }: { compact?: boolean }) {
  const { currency } = useCurrency();
  return <CalculatorBody key={currency} currency={currency} compact={compact} />;
}

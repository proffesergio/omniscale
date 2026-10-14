import type { Metadata } from 'next';
import { FunnelCalculator } from '@/components/marketing/funnel-calculator';
export const metadata: Metadata = {
  title: 'Funnel economics calculator',
  description:
    'Explore CAC, LTV, ROAS, MER and potential creative-led revenue lift with a transparent scenario model.',
};
export default function CalculatorPage() {
  return (
    <div className="container page-content">
      <div className="page-intro">
        <div className="eyebrow">THE GROWTH EQUATION</div>
        <h1>
          Put your funnel
          <br />
          under the microscope.
        </h1>
        <p>
          Understand your current economics, explore the drop-offs, and test a better scenario.
          Every assumption is yours to adjust.
        </p>
      </div>
      <FunnelCalculator />
      <details className="formula-details">
        <summary>How the model works — formulas & limitations</summary>
        <dl>
          <dt>Impressions</dt>
          <dd>Monthly ad spend ÷ CPM × 1,000.</dd>
          <dt>Hooked impressions</dt>
          <dd>
            Impressions × hook rate. Use a consistent definition, such as three-second video views
            divided by impressions.
          </dd>
          <dt>Clicks & orders</dt>
          <dd>
            Clicks = impressions × CTR. Orders = clicks × conversion rate. This model assumes clicks
            follow a hook and each order represents one conversion.
          </dd>
          <dt>Ad-only CAC</dt>
          <dd>
            Ad spend ÷ (orders × new customer share). Excludes agency fees and other acquisition
            expenses.
          </dd>
          <dt>Gross-profit LTV</dt>
          <dd>
            AOV × lifetime orders per customer × gross margin. This is an undiscounted estimate
            before retention, service, overhead, and financing costs.
          </dd>
          <dt>ROAS</dt>
          <dd>Attributed order revenue ÷ ad spend.</dd>
          <dt>MER</dt>
          <dd>
            Total business revenue ÷ total marketing spend. Both are independent inputs covering the
            same reporting period.
          </dd>
          <dt>Optimized scenario</dt>
          <dd>
            Hook rate increases by the chosen relative lift, capped at 100%. CTR scales in
            proportion to hook rate. Conversion rate increases by its chosen relative lift, capped
            at 100%. CPM, AOV, and spend remain constant.
          </dd>
          <dt>Equivalent spend gap</dt>
          <dd>
            Current spend − (baseline attributed revenue ÷ modeled ROAS), floored at zero. This is
            hypothetical efficiency headroom, not measured wasted spend.
          </dd>
          <dt>Gross-profit lift</dt>
          <dd>
            Incremental modeled revenue × gross margin. This excludes any additional creative
            production or agency costs.
          </dd>
        </dl>
        <p>
          This model assumes a causal relationship between better hooks and CTR for exploration; it
          does not establish one. It ignores attribution overlap, auction changes, saturation,
          returns, tax, and inventory constraints. Validate assumptions through controlled
          experiments before allocating budget.
        </p>
      </details>
    </div>
  );
}

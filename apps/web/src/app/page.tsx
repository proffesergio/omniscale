import Link from 'next/link';
import {
  ArrowUpRight,
  ArrowDown,
  ChartNoAxesCombined,
  Layers3,
  ScanSearch,
  Crosshair,
  Check,
  Globe2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GrowthVisual } from '@/components/marketing/growth-visual';
import { BlueprintGallery } from '@/components/marketing/blueprint-gallery';
import { FunnelCalculator } from '@/components/marketing/funnel-calculator';
const services = [
  {
    number: '01',
    icon: ChartNoAxesCombined,
    title: 'Funnel economics',
    text: 'Know what growth is worth before you pay for it. We connect acquisition cost, lifetime value, and contribution margin.',
    tags: 'CAC / LTV / MER',
  },
  {
    number: '02',
    icon: Layers3,
    title: 'Creative velocity',
    text: 'Build a testing system that keeps learning. More considered angles, sharper hooks, and faster creative iteration.',
    tags: 'CONCEPT / PRODUCE / ITERATE',
  },
  {
    number: '03',
    icon: ScanSearch,
    title: 'Product research',
    text: 'Find the reason people buy. Customer language, competitor gaps, and product insights become your next winning angle.',
    tags: 'INSIGHT / POSITIONING / OFFERS',
  },
  {
    number: '04',
    icon: Crosshair,
    title: 'Media buying',
    text: 'Put every insight to work. Deliberate testing and disciplined budget allocation across the channels that fit your business.',
    tags: 'META / GOOGLE / TIKTOK / LINKEDIN',
  },
];
export default function HomePage() {
  return (
    <>
      <section className="hero container">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="status-dot" /> PERFORMANCE MARKETING × CREATIVE OPERATIONS
          </div>
          <h1>
            Creative minds.
            <br />
            Commercial
            <br />
            <span className="orange-word">
              instincts.
              <svg viewBox="0 0 360 20" aria-hidden="true">
                <path d="M4 14 Q150 -1 355 9" />
              </svg>
            </span>
          </h1>
          <p>
            We turn better creative into better business economics.
            <br className="desktop-break" /> Research-led. Performance-driven. Built to scale.
          </p>
          <div className="hero-buttons">
            <Button asChild>
              <Link href="/audit">
                Get your growth audit <ArrowUpRight size={18} />
              </Link>
            </Button>
            <Link className="text-link" href="/calculator">
              Run the numbers <ArrowUpRight size={16} />
            </Link>
          </div>
          <div className="hero-proof">
            <span>
              <Check size={14} /> No fluff. Just a clear growth plan.
            </span>
            <span>Independent agency. Global ambition.</span>
          </div>
        </div>
        <GrowthVisual />
      </section>
      <div className="capability-strip">
        <div className="container">
          <span>
            CREATIVE THAT CONNECTS.
            <br />
            <strong>PERFORMANCE THAT COUNTS.</strong>
          </span>
          <span>
            Funnel economics <i>✳</i>
          </span>
          <span>
            Creative velocity <i>✳</i>
          </span>
          <span>
            Product research <i>✳</i>
          </span>
          <span>
            Media buying <i>✳</i>
          </span>
        </div>
      </div>
      <section id="approach" className="section container">
        <div className="section-heading">
          <div>
            <div className="eyebrow">
              <span className="section-index">01 /</span> THE CONNECTED ADVANTAGE
            </div>
            <h2>
              Growth isn’t a channel.
              <br />
              It’s a connected system.
            </h2>
          </div>
          <p>
            Great ads can’t fix broken economics.
            <br />
            Great economics need creative that converts.
            <br />
            We bring both sides of the equation together.
          </p>
        </div>
        <div className="services-grid">
          {services.map((s) => (
            <article className="service" key={s.number}>
              <div className="service-top">
                <s.icon size={27} strokeWidth={1.5} />
                <span>{s.number}</span>
              </div>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
              <div className="service-tags">{s.tags}</div>
            </article>
          ))}
        </div>
      </section>
      <section className="calculator-section section">
        <div className="container">
          <div className="section-heading">
            <div>
              <div className="eyebrow">
                <span className="section-index">02 /</span> THE GROWTH EQUATION
              </div>
              <h2>
                Your next growth opportunity
                <br />
                is hiding in the numbers.
              </h2>
            </div>
            <p>
              A few inputs. A clearer picture.
              <br />
              Explore what better creative and conversion
              <br />
              could mean for your bottom line.
            </p>
          </div>
          <FunnelCalculator compact />
          <div className="section-footnote">
            <span>Transparent inputs. Explicit assumptions. No guaranteed returns.</span>
            <Link href="/calculator">
              Explore the full model <ArrowUpRight size={15} />
            </Link>
          </div>
        </div>
      </section>
      <section className="section container">
        <div className="section-heading">
          <div>
            <div className="eyebrow">
              <span className="section-index">03 /</span> INSIDE THE CREATIVE LAB
            </div>
            <h2>
              Made to stop the scroll.
              <br />
              Designed to move the needle.
            </h2>
          </div>
          <Link className="text-link" href="/case-studies">
            Explore our blueprints <ArrowUpRight size={17} />
          </Link>
        </div>
        <BlueprintGallery limit={3} />
        <p className="gallery-disclaimer">
          Our concept lab shows how we think. Products and performance targets are illustrative, not
          client campaigns or achieved results.
        </p>
      </section>
      <section className="process-section section">
        <div className="container process-layout">
          <div>
            <div className="eyebrow">
              <span className="section-index">04 /</span> FROM INSIGHT TO IMPACT
            </div>
            <h2>
              Less guesswork.
              <br />
              More forward motion.
            </h2>
            <p>
              One connected team. One clear feedback loop.
              <br />
              Every cycle makes the next one smarter.
            </p>
            <Button variant="outline" asChild>
              <Link href="/booking">
                Meet your growth partner <ArrowUpRight size={17} />
              </Link>
            </Button>
          </div>
          <div className="process-steps">
            {[
              [
                'Diagnose the real constraint',
                'We examine your funnel, product, and creative to find what’s actually holding growth back.',
              ],
              [
                'Build the next hypothesis',
                'Customer insight becomes a focused creative brief, an offer, and a measurable testing plan.',
              ],
              [
                'Launch. Learn. Compound.',
                'We connect creative performance to business outcomes and reinvest in what earns its place.',
              ],
            ].map(([title, text], i) => (
              <div key={title}>
                <span className="step-number">0{i + 1}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
                {i < 2 && <ArrowDown className="step-arrow" size={18} />}
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="global-section container">
        <div className="global-symbol">
          <Globe2 size={80} strokeWidth={0.7} />
          <span className="global-pin" />
        </div>
        <div>
          <div className="eyebrow">ROOTED IN DHAKA. CONNECTED TO YOUR WORLD.</div>
          <h2>
            Global thinking.
            <br />
            An unfair execution advantage.
          </h2>
          <p>
            Our Bangladesh base gives us room to invest in what matters: deep research, thoughtful
            creative, and hands-on optimization. Clear communication and discovery calls in your
            timezone keep us close, wherever you are.
          </p>
        </div>
        <div className="global-notes">
          <span>
            <Check size={16} /> Direct access to your team
          </span>
          <span>
            <Check size={16} /> Transparent performance reporting
          </span>
          <span>
            <Check size={16} /> Timezone-aware discovery booking
          </span>
        </div>
      </section>
      <section className="cta-section container">
        <div>
          <div className="eyebrow">YOUR NEXT CHAPTER STARTS WITH A BETTER QUESTION.</div>
          <h2>
            What’s really holding
            <br />
            your growth back?
          </h2>
          <p>Let’s find out. Start with a focused, three-point growth audit.</p>
        </div>
        <div>
          <Button variant="dark" asChild>
            <Link href="/audit">
              Find my growth opportunities <ArrowUpRight size={19} />
            </Link>
          </Button>
          <span>No pitch deck marathon. Just a useful conversation.</span>
        </div>
      </section>
    </>
  );
}

import { ArrowUpRight, Crosshair, MousePointer2, Sparkles, TrendingUp } from 'lucide-react';
export function GrowthVisual() {
  return (
    <div className="growth-visual" aria-label="Illustration of the OmniScale growth system">
      <div className="visual-grid" />
      <div className="orbit orbit-one" />
      <div className="orbit orbit-two" />
      <div className="orbit orbit-three" />
      <div className="visual-topline">
        <span>
          <i /> THE OMNISCALE SYSTEM
        </span>
        <span>01 — 04</span>
      </div>
      <div className="orbital-node node-top">
        <Crosshair size={17} />
        <span>Product insight</span>
      </div>
      <div className="orbital-node node-left">
        <Sparkles size={17} />
        <span>Creative velocity</span>
      </div>
      <div className="orbital-core">
        <span>GOOD CREATIVE.</span>
        <strong>
          Better
          <br />
          economics<span>↗</span>
        </strong>
        <div className="core-rule" />
        <span>ONE CONNECTED GROWTH LOOP</span>
      </div>
      <div className="orbital-node node-right">
        <MousePointer2 size={17} />
        <span>Media buying</span>
      </div>
      <div className="visual-insight">
        <div className="insight-icon">
          <TrendingUp size={21} />
        </div>
        <div>
          <span>THE METRIC THAT MATTERS</span>
          <strong>Contribution margin</strong>
        </div>
        <ArrowUpRight size={20} />
      </div>
      <div className="visual-caption">
        Research. Create. Test. Compound.<span>↻</span>
      </div>
    </div>
  );
}

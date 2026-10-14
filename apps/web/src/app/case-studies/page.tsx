import type { Metadata } from 'next';
import { BlueprintGallery } from '@/components/marketing/blueprint-gallery';
export const metadata: Metadata = { title: 'Inside the creative lab' };
export default function CaseStudies() {
  return (
    <div className="container page-content">
      <div className="page-intro">
        <div className="eyebrow">THE OMNISCALE CREATIVE LAB</div>
        <h1>
          Creative with a thesis.
          <br />
          Testing with a purpose.
        </h1>
        <p>
          Explore our illustrative performance blueprints. Each connects a customer insight to a
          creative hypothesis, a test plan, and measurable targets.
        </p>
      </div>
      <BlueprintGallery />
      <p className="gallery-disclaimer">
        These are original concept studies, not commissioned client work. All metrics are
        experimental targets, not historical results or promised outcomes.
      </p>
    </div>
  );
}

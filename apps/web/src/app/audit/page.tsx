import type { Metadata } from 'next';
import { AuditWizard } from '@/components/marketing/audit-wizard';
export const metadata: Metadata = { title: 'Request your growth audit' };
export default function AuditPage() {
  return (
    <div className="container">
      <div className="page-intro">
        <div className="eyebrow">THE FIRST STEP TO BETTER GROWTH</div>
        <h1>
          Find the friction.
          <br />
          Unlock the opportunity.
        </h1>
        <p>
          Tell us a little about your business. We’ll use three lenses to find the most useful
          starting point for your growth.
        </p>
      </div>
      <div className="wizard-layout">
        <div className="audit-points">
          {[
            [
              'Funnel economics',
              'Where does acquisition make commercial sense, and where might the numbers break down?',
            ],
            [
              'Creative effectiveness',
              'Are your hooks, messaging, and product demonstrations earning qualified attention?',
            ],
            ['Acquisition strategy', 'Do your audience, offer, and channel choices work together?'],
          ].map(([title, text], i) => (
            <div key={title}>
              <span>0{i + 1}</span>
              <div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            </div>
          ))}
          <p className="input-explanation">
            An initial assessment uses your public website and shared context. Deeper account
            analysis happens only with your explicit access approval.
          </p>
        </div>
        <AuditWizard />
      </div>
    </div>
  );
}

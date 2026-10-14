import type { Metadata } from 'next';
import { Clock3, Globe2, Video } from 'lucide-react';
import { BookingCalendar } from '@/components/marketing/booking-calendar';
export const metadata: Metadata = { title: 'Book a growth discovery call' };
export default function BookingPage() {
  return (
    <div className="container">
      <div className="page-intro">
        <div className="eyebrow">A USEFUL CONVERSATION STARTS HERE</div>
        <h1>
          Let’s talk about
          <br />
          your next chapter.
        </h1>
        <p>Bring your growth challenges. We’ll bring a fresh perspective.</p>
      </div>
      <div className="booking-layout">
        <aside className="booking-details">
          <div className="eyebrow">OMNISCALE DISCOVERY</div>
          <h2>
            Your business.
            <br />
            Your bottlenecks.
            <br />A clearer next step.
          </h2>
          <p>
            We’ll discuss your current acquisition approach, your creative process, and the
            economics behind your growth goals. Then we’ll decide whether there’s a useful way to
            work together.
          </p>
          <div className="booking-features">
            <span>
              <Clock3 size={17} /> 30 minutes · No obligation
            </span>
            <span>
              <Video size={17} /> Meeting details shared by our team
            </span>
            <span>
              <Globe2 size={17} /> Automatically matched to your timezone
            </span>
          </div>
        </aside>
        <BookingCalendar />
      </div>
    </div>
  );
}

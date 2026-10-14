import type { Metadata } from 'next';
import { ManageBooking } from '@/components/marketing/manage-booking';
export const metadata: Metadata = {
  title: 'Manage your discovery call',
  robots: { index: false, follow: false },
};
export default function ManagePage() {
  return (
    <div className="container">
      <div className="page-intro">
        <div className="eyebrow">YOUR DISCOVERY CALL</div>
        <h1>Keep your plans in sync.</h1>
        <p>View your appointment, save a calendar event, or release your time.</p>
      </div>
      <ManageBooking />
    </div>
  );
}

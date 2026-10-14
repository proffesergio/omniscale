import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Privacy notice' };
export default function Privacy() {
  const contact = process.env.CONTACT_EMAIL;
  return (
    <div className="container">
      <div className="page-intro">
        <div className="eyebrow">YOUR INFORMATION, HANDLED WITH CARE</div>
        <h1>Privacy notice.</h1>
        <p>How this website handles information you choose to share.</p>
      </div>
      <article className="prose">
        <h2>Audit requests and appointments</h2>
        <p>
          OmniScale uses your name, email, website, LinkedIn profile, competitor details, channel
          information, and appointment notes to assess your request, arrange calls, and respond to
          you. Consent to an audit or booking does not subscribe you to marketing emails.
        </p>
        <h2>Storage and service providers</h2>
        <p>
          When connected, Supabase stores submissions, appointments, and admin authentication data.
          Configured notification providers may process submission details to notify our team or
          send appointment messages. Records remain until the team deletes them; no automatic
          retention period is currently configured.
        </p>
        <h2>Calculator and regional preferences</h2>
        <p>
          Calculator inputs stay in your browser and are not submitted to our server. Your selected
          currency is saved in local storage. We may use a hosting-provided country code or your
          browser timezone to suggest a currency. No precise GPS location is requested, and no
          exchange rate conversion is implied.
        </p>
        <h2>Cookies and security</h2>
        <p>
          Admin authentication uses essential session cookies. Booking management uses a private
          link; anyone with that link can view or cancel the associated booking. Abuse prevention
          stores pseudonymous request identifiers. Hosting infrastructure may keep operational
          access logs.
        </p>
        <h2>Your choices</h2>
        <p>
          You can clear your saved currency through your browser’s site-data controls. To request
          access, correction, or deletion of a submission, contact the OmniScale team through your
          existing correspondence
          {contact ? (
            <>
              {' '}
              or email <a href={`mailto:${contact}`}>{contact}</a>
            </>
          ) : (
            ''
          )}
          . Appointment cancellation releases the time but does not automatically erase the booking
          record.
        </p>
        <h2>Portfolio evidence</h2>
        <p>
          Creative blueprints are illustrative. Client names, testimonials, and measured results are
          published only with approval and supporting evidence.
        </p>
      </article>
    </div>
  );
}

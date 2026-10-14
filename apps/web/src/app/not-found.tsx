import Link from 'next/link';
import { Button } from '@/components/ui/button';
export default function NotFound() {
  return (
    <div className="container page-error">
      <div className="eyebrow">404 / OFF THE MAP</div>
      <h1>This page took a different route.</h1>
      <p>Let’s get you back to the growth conversation.</p>
      <Button asChild>
        <Link href="/">Back to OmniScale</Link>
      </Button>
    </div>
  );
}

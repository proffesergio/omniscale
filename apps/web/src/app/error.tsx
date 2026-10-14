'use client';
import { Button } from '@/components/ui/button';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="container page-error">
      <h1>Something interrupted this page.</h1>
      <p>Please retry. If the issue continues, come back in a moment.</p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}

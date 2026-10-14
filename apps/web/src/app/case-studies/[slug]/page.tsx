import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowUpRight } from 'lucide-react';
import { blueprints } from '@/lib/blueprints';
import { ProductArt } from '@/components/marketing/blueprint-gallery';
import { Button } from '@/components/ui/button';
export const generateStaticParams = () => blueprints.map((b) => ({ slug: b.slug }));
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const b = blueprints.find((b) => b.slug === slug);
  return { title: b?.title ?? 'Blueprint not found', description: b?.description };
}
export default async function BlueprintPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const b = blueprints.find((b) => b.slug === slug);
  if (!b) notFound();
  return (
    <div className="container">
      <div className="page-intro">
        <div className="eyebrow">{b.category.toUpperCase()} · ILLUSTRATIVE BLUEPRINT</div>
        <h1>{b.title}</h1>
        <p>{b.description}</p>
      </div>
      <div className="detail-layout">
        <ProductArt blueprint={b} />
        <div>
          <div className="notice">
            Concept study. All performance figures below are test targets, not achieved results.
          </div>
          <h2>The creative hypothesis</h2>
          <p>{b.hypothesis}</p>
          <div className="blueprint-metrics">
            {b.metrics.map((m) => (
              <div key={m.label}>
                <strong>{m.value}</strong>
                <span>{m.label}</span>
              </div>
            ))}
          </div>
          <h2 style={{ marginTop: 30 }}>The testing blueprint</h2>
          <ul>
            {b.tests.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <p>
            Set a baseline and a predefined decision rule before testing. Keep audience, placement,
            offer, and attribution settings consistent where possible. Evaluate qualified conversion
            and contribution margin alongside attention metrics.
          </p>
          <Button asChild style={{ marginTop: 25 }}>
            <Link href="/audit">
              Find your next creative angle <ArrowUpRight size={17} />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

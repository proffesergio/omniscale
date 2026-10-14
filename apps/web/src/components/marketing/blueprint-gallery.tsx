'use client';
import Link from 'next/link';
import { useState } from 'react';
import { ArrowUpRight, Play, BarChart3, Check } from 'lucide-react';
import { blueprints, testimonials } from '@/lib/blueprints';
import type { Blueprint, BusinessType } from '@/types';
export function ProductArt({ blueprint }: { blueprint: Blueprint }) {
  return (
    <div className={`product-art art-${blueprint.palette}`}>
      <div className="art-top">
        <span>{blueprint.name}</span>
        <span>CONCEPT STUDY</span>
      </div>
      {blueprint.palette === 'violet' ? (
        <div className="software-art">
          <div className="software-top">
            <span className="mini-mark">f.</span>
            <span>Less busywork. More flow.</span>
            <span>•••</span>
          </div>
          <div className="software-chart">
            <BarChart3 size={32} />
            <strong>A little less chaos.</strong>
            <span>A lot more progress.</span>
            <div className="fake-bars">
              {[30, 45, 38, 63, 55, 76, 92].map((h, i) => (
                <i key={i} style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>
          <div className="software-tag">
            <Check size={12} /> Your next move, simplified.
          </div>
        </div>
      ) : (
        <>
          <div className="art-orbit" />
          <div className="product-shadow" />
          <div className={`product-object ${blueprint.palette === 'peach' ? 'product-jar' : ''}`}>
            <div className="product-lid" />
            <div className="product-label">
              <span>{blueprint.palette === 'sage' ? 'LESS, BUT BETTER.' : 'MAKE EVERY DAY A'}</span>
              <strong>
                {blueprint.product.split('\n').map((line, i) => (
                  <span key={i}>{line}</span>
                ))}
              </strong>
              <span>
                {blueprint.palette === 'sage' ? 'THE DAILY ESSENTIAL' : 'BETTER KIND OF RITUAL'}
              </span>
              <div className="product-label-line" />
              <span>DESIGNED TO FEEL DIFFERENT.</span>
            </div>
          </div>
          <span className="art-large-type">
            {blueprint.palette === 'sage' ? 'simply.' : 'feel good.'}
          </span>
        </>
      )}
      <div className="art-bottom">
        <span>PERFORMANCE CREATIVE</span>
        <span className="play-icon">
          <Play size={11} fill="currentColor" />
        </span>
      </div>
    </div>
  );
}
export function BlueprintGallery({ limit }: { limit?: number }) {
  const [filter, setFilter] = useState<'All' | BusinessType>('All');
  const selected = blueprints.filter((b) => filter === 'All' || b.type === filter).slice(0, limit);
  return (
    <>
      <div className="gallery-toolbar">
        <div className="filter-tabs" aria-label="Filter creative blueprints">
          {(['All', 'E-commerce', 'B2B SaaS'] as const).map((f) => (
            <button key={f} aria-pressed={filter === f} onClick={() => setFilter(f)}>
              {f === 'All' ? 'All blueprints' : f}
            </button>
          ))}
        </div>
        <span className="tiny-note">ILLUSTRATIVE CONCEPTS · NOT CLIENT RESULTS</span>
      </div>
      <div className="blueprint-grid">
        {selected.map((b) => (
          <Link className="blueprint-card" href={`/case-studies/${b.slug}`} key={b.slug}>
            <ProductArt blueprint={b} />
            <div className="blueprint-meta">
              <span>{b.category}</span>
              <ArrowUpRight size={20} />
            </div>
            <h3>{b.title}</h3>
            <div className="blueprint-metrics">
              {b.metrics.map((m) => (
                <div key={m.label}>
                  <strong>{m.value}</strong>
                  <span>{m.label}</span>
                </div>
              ))}
            </div>
          </Link>
        ))}
      </div>
      {testimonials.filter((t) => filter === 'All' || t.type === filter).length > 0 && (
        <div className="testimonial-grid">
          {testimonials
            .filter((t) => filter === 'All' || t.type === filter)
            .map((t) => (
              <blockquote key={t.id}>
                <p>{t.quote}</p>
                <cite>
                  {t.name} · {t.role}, {t.company}
                </cite>
              </blockquote>
            ))}
        </div>
      )}
    </>
  );
}

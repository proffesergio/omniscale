import type { Blueprint, Testimonial } from '@/types';
export const blueprints: Blueprint[] = [
  {
    slug: 'the-everyday-essential',
    name: 'FORM / 01',
    type: 'E-commerce',
    category: 'Beauty & personal care',
    title: 'Make the everyday unskippable.',
    description:
      'A product-first concept built around texture, ritual, and one very clear reason to switch.',
    palette: 'sage',
    product: 'daily\nform.',
    hypothesis:
      'A tangible product demonstration can outperform a benefit-only opening when the audience needs proof before purchase.',
    metrics: [
      { label: 'Hook rate target', value: '+20%' },
      { label: 'Hold rate target', value: '+15%' },
      { label: 'CAC target', value: '−12%' },
    ],
    tests: [
      'Texture demonstration vs. founder introduction',
      'Problem-first opening vs. product-first opening',
      '15-second product ritual vs. 30-second explanation',
    ],
  },
  {
    slug: 'a-better-daily-ritual',
    name: 'RITUAL / 02',
    type: 'E-commerce',
    category: 'Lifestyle & wellness',
    title: 'A new angle on a daily habit.',
    description:
      'A research-led concept connecting an overlooked customer objection to a compelling daily ritual.',
    palette: 'peach',
    product: 'good\nhabit',
    hypothesis:
      'Addressing a specific buying objection in the first three seconds can increase qualified attention without relying on discounts.',
    metrics: [
      { label: 'Hook rate target', value: '+25%' },
      { label: 'Hold rate target', value: '+12%' },
      { label: 'CAC target', value: '−15%' },
    ],
    tests: [
      'Objection-led hook vs. aspirational hook',
      'Customer point of view vs. studio demonstration',
      'Value-led offer vs. introductory bundle',
    ],
  },
  {
    slug: 'less-work-more-flow',
    name: 'FLOW / 03',
    type: 'B2B SaaS',
    category: 'Software & productivity',
    title: 'Show the outcome. Skip the feature tour.',
    description:
      'A workflow transformation that makes a complicated product immediately understandable.',
    palette: 'violet',
    product: 'flow',
    hypothesis:
      'A before-and-after workflow can improve demo intent by letting buyers recognize their own operational friction.',
    metrics: [
      { label: 'Hook rate target', value: '+18%' },
      { label: 'Hold rate target', value: '+20%' },
      { label: 'CPL target', value: '−10%' },
    ],
    tests: [
      'Before/after workflow vs. feature overview',
      'Operator voiceover vs. annotated screen recording',
      'Interactive demo CTA vs. discovery call CTA',
    ],
  },
];
// Publish only client-approved quotes with a source and approval date.
export const testimonials: Testimonial[] = [];

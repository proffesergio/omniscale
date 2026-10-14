// OWNER: confirm these engagement models and starting prices before launch.
// They are placeholders for your commercial terms — no result is guaranteed.
export interface Plan {
  id: string;
  name: string;
  price: string;
  cadence: string;
  blurb: string;
  points: string[];
}
export const plans: Plan[] = [
  {
    id: 'audit',
    name: 'Growth Audit',
    price: 'BDT 15,000',
    cadence: 'one-time',
    blurb: 'A full-funnel diagnosis of acquisition, creative, and economics.',
    points: ['CAC / LTV / MER teardown', 'Creative and offer review', 'Prioritized 90-day roadmap'],
  },
  {
    id: 'sprint',
    name: 'Creative Sprint',
    price: 'BDT 60,000',
    cadence: 'per 2-week sprint',
    blurb: 'A testing burst of new angles, hooks, and creative variants.',
    points: ['Research-led concepts', 'Iterative creative production', 'Test readout and next bets'],
  },
  {
    id: 'retainer',
    name: 'Growth Retainer',
    price: 'BDT 120,000',
    cadence: 'per month',
    blurb: 'Ongoing creative operations and media buying, managed end to end.',
    points: ['Always-on creative velocity', 'Disciplined budget allocation', 'Monthly economics review'],
  },
];

'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowUpRight, Menu, X, Globe2 } from 'lucide-react';
import { useState } from 'react';
import { Brand } from '@/components/ui/brand';
import { useCurrency } from '@/hooks/use-currency';
import { currencies, isCurrency } from '@/lib/currency';
export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { currency, setCurrency, source, ready } = useCurrency();
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/" aria-label="OmniScale home">
          <Brand />
        </Link>
        <nav aria-label="Main navigation" className={open ? 'main-nav nav-open' : 'main-nav'}>
          {[
            ['/#approach', 'Our approach'],
            ['/case-studies', 'Creative lab'],
            ['/calculator', 'ROI calculator'],
          ].map(([href, label]) => (
            <Link
              key={href}
              href={href}
              aria-current={pathname === href ? 'page' : undefined}
              onClick={() => setOpen(false)}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="header-actions">
          <label className="currency-select" title={`Currency: ${source}`}>
            <Globe2 size={14} />
            <span className="sr-only">Display currency</span>
            <select
              value={currency}
              disabled={!ready}
              onChange={(e) => {
                if (isCurrency(e.target.value)) setCurrency(e.target.value);
              }}
            >
              {currencies.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <Link className="header-cta" href="/booking">
            Let’s talk <ArrowUpRight size={17} />
          </Link>
          <button
            className="menu-toggle"
            aria-label={open ? 'Close navigation' : 'Open navigation'}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
    </header>
  );
}

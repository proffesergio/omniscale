import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { Brand } from '@/components/ui/brand';
export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-top">
          <div>
            <Brand light />
            <p>
              Built in Bangladesh.
              <br />
              Built for growth, everywhere.
            </p>
          </div>
          <div className="footer-links">
            <Link href="/calculator">Funnel calculator</Link>
            <Link href="/case-studies">Creative blueprints</Link>
            <Link href="/audit">Request an audit</Link>
            <Link href="/booking">
              Book a discovery call <ArrowUpRight size={14} />
            </Link>
          </div>
          <div className="footer-note">
            <span className="status-dot" /> Independent thinking.
            <br />
            <span>Connected execution.</span>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} OmniScale. All rights reserved.</span>
          <div>
            <Link href="/privacy">Privacy</Link>
            <Link href="/admin">Team login</Link>
            <span>Dhaka · Working globally</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

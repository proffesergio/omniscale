import type { Metadata } from 'next';
import '@fontsource-variable/manrope';
import '@fontsource-variable/dm-sans';
import '@/styles/globals.css';
import { CurrencyProvider } from '@/hooks/use-currency';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: {
    default: 'OmniScale — Creative minds. Commercial instincts.',
    template: '%s | OmniScale',
  },
  description:
    'Performance marketing and creative operations built around funnel economics, creative velocity, product research, and media buying. Based in Bangladesh. Built for global growth.',
  openGraph: {
    type: 'website',
    siteName: 'OmniScale',
    title: 'OmniScale — Creative minds. Commercial instincts.',
    description: 'Turn better creative into better business economics.',
  },
  twitter: { card: 'summary_large_image' },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <CurrencyProvider>
          <a className="skip-link" href="#main">
            Skip to content
          </a>
          <SiteHeader />
          <main id="main">{children}</main>
          <SiteFooter />
        </CurrencyProvider>
      </body>
    </html>
  );
}

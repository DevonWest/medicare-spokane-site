import type { Metadata } from 'next';
import './globals.css';
import { UTMTracker } from '@/components/UTMTracker';

export const metadata: Metadata = {
  title: 'Medicare Plans in Spokane, WA | Local Medicare Help',
  description: 'Find the best Medicare Advantage, Supplement, and Part D plans in Spokane, WA. Get free local help from a licensed Medicare advisor.',
  metadataBase: new URL('https://medicare-spokane.com'),
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Medicare Plans in Spokane, WA',
    description: 'Find the best Medicare plans in Spokane. Free local help.',
    url: 'https://medicare-spokane.com',
    siteName: 'Medicare Spokane',
    locale: 'en_US',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <UTMTracker />
        {children}
      </body>
    </html>
  );
}

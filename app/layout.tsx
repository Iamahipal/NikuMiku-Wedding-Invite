import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';

import SmoothScroll from '@/components/SmoothScroll';
import Stage from '@/components/Stage';

import './globals.css';

// Only a UI sans is loaded. The mantra is geometry, not text — so no
// Devanagari webfont ships at all, and the font-loading race that used to gate
// the opening is simply gone.
const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ॐ गं गणपतये नमः',
  description: 'An invocation, in gold.',
};

export const viewport: Viewport = {
  themeColor: '#02040c',
  colorScheme: 'dark',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="relative bg-void">
        {/* The film. One fixed canvas, mounted once, never unmounted. */}
        <div className="pointer-events-none fixed inset-0 z-0">
          <Stage />
        </div>

        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}

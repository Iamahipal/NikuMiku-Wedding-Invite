import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, Inter, Tiro_Devanagari_Hindi } from 'next/font/google';

import SmoothScroll from '@/components/SmoothScroll';
import WebGLBackground from '@/components/webgl/WebGLBackground';
import Atmosphere from '@/components/ui/Atmosphere';
import Overture from '@/components/ui/Overture';
import ScrollProgress from '@/components/ui/ScrollProgress';
import { couple } from '@/lib/wedding';

import './globals.css';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-inter',
  display: 'swap',
});

const tiro = Tiro_Devanagari_Hindi({
  subsets: ['devanagari', 'latin'],
  weight: ['400'],
  variable: '--font-tiro',
  display: 'swap',
});

export const metadata: Metadata = {
  title: `${couple.bride} & ${couple.groom} — ${couple.date}`,
  description: `An invitation to the wedding of ${couple.bride} and ${couple.groom}. ${couple.city}, ${couple.date}.`,
  openGraph: {
    title: `${couple.bride} & ${couple.groom}`,
    description: `${couple.city} · ${couple.date}`,
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#02040c',
  colorScheme: 'dark',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${inter.variable} ${tiro.variable}`}
      suppressHydrationWarning
    >
      <body className="relative bg-void antialiased">
        {/*
          LAYER 0 — the WebGL film. One fixed canvas, mounted once, never
          unmounted, never re-rendered by scroll. Everything else floats above it.
        */}
        <WebGLBackground />

        {/* LAYER 1 — atmospheric CSS grading: vignette, bloom wash, film grain. */}
        <Atmosphere />

        {/* LAYER 2 — the DOM. Lenis wraps it so every scroll has inertia. */}
        <SmoothScroll>{children}</SmoothScroll>

        {/* LAYER 3 — persistent chrome, and the opening title sequence. */}
        <ScrollProgress />
        <Overture />
      </body>
    </html>
  );
}

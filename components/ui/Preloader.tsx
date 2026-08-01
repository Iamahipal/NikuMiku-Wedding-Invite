'use client';

import { useEffect, useRef } from 'react';
import type Lenis from 'lenis';

import { gsap, ScrollTrigger } from '@/lib/gsap';
import { couple } from '@/lib/wedding';

/** Fired once the curtain is out of the way — the hero listens for this. */
export const ENTER_EVENT = 'invitation:enter';

export default function Preloader() {
  const root = useRef<HTMLDivElement>(null);
  const counter = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const lenis = (window as unknown as { lenis?: Lenis }).lenis;

    // Nobody scrolls a film before it starts.
    lenis?.stop();
    window.scrollTo(0, 0);

    const ctx = gsap.context(() => {
      const value = { n: 0 };
      const tl = gsap.timeline({
        onComplete: () => {
          lenis?.start();
          ScrollTrigger.refresh();
          window.dispatchEvent(new CustomEvent(ENTER_EVENT));
          // Remove from the a11y tree and the paint path entirely.
          if (root.current) root.current.style.display = 'none';
        },
      });

      tl.to(value, {
        n: 100,
        duration: 2.1,
        ease: 'power2.inOut',
        onUpdate: () => {
          const n = Math.round(value.n);
          // Direct DOM writes: a 60fps counter must never touch React state.
          if (counter.current) counter.current.textContent = String(n).padStart(3, '0');
          if (bar.current) bar.current.style.transform = `scaleX(${value.n / 100})`;
        },
      })
        .to('[data-preloader-content]', { opacity: 0, y: -18, duration: 0.7 }, '-=0.2')
        // Curtain lifts as two halves, like a proscenium.
        .to(
          '[data-curtain]',
          {
            scaleY: 0,
            duration: 1.15,
            ease: 'power4.inOut',
            stagger: 0.08,
            transformOrigin: 'top center',
          },
          '-=0.35',
        );
    }, root);

    return () => {
      ctx.revert();
      lenis?.start();
    };
  }, []);

  return (
    <div ref={root} className="fixed inset-0 z-[100]">
      <div data-curtain className="absolute inset-0 bg-void" />
      <div data-curtain className="absolute inset-0 bg-midnight" />

      <div
        data-preloader-content
        className="absolute inset-0 flex flex-col items-center justify-center gap-6 px-8"
      >
        <p className="font-body text-[10px] uppercase tracking-[0.55em] text-gold/60">
          {couple.city}
        </p>

        <p className="font-display text-3xl font-light tracking-[0.2em] text-gold-pale sm:text-4xl">
          {couple.bride} <span className="text-gold/70">&</span> {couple.groom}
        </p>

        <div className="mt-2 h-px w-56 overflow-hidden bg-gold/15 sm:w-72">
          <div
            ref={bar}
            className="hairline h-full w-full origin-left"
            style={{ transform: 'scaleX(0)' }}
          />
        </div>

        <span
          ref={counter}
          className="font-body text-[11px] tabular-nums tracking-[0.4em] text-gold/50"
        >
          000
        </span>
      </div>
    </div>
  );
}

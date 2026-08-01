'use client';

import { useEffect, useRef } from 'react';

import { gsap } from '@/lib/gsap';

/**
 * The film's only instruction. Starts hidden in CSS — between first paint and
 * hydration there is no GSAP, and anything animated in from nothing would
 * otherwise flash at full opacity.
 */
export default function ScrollCue() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '[data-cue-fill]',
        { yPercent: -110 },
        { yPercent: 320, duration: 1.9, ease: 'power2.inOut', repeat: -1, repeatDelay: 0.25 },
      );
      // Fades out as soon as the viewer takes the hint.
      gsap.to('[data-cue]', {
        opacity: 0,
        scrollTrigger: { trigger: document.body, start: 'top top', end: '+=300', scrub: true },
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={root}>
      <div
        data-cue
        className="pointer-events-none fixed bottom-12 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-3 opacity-0"
      >
        <span className="font-body text-[9px] uppercase tracking-[0.45em] text-gold/60">
          Scroll
        </span>
        <span className="relative block h-14 w-px overflow-hidden bg-gold/15">
          <span data-cue-fill className="absolute inset-x-0 top-0 h-1/3 bg-gold/80" />
        </span>
      </div>
    </div>
  );
}

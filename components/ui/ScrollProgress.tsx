'use client';

import { useEffect, useRef } from 'react';

import { ScrollTrigger } from '@/lib/gsap';

const CHAPTERS = ['Invocation', 'The Two', 'Celebrations', 'RSVP'];

/**
 * Vertical chapter rail. Updated by writing to `style` directly from a single
 * ScrollTrigger — no state, no re-renders, no work on the React side of the
 * fence while the page is moving.
 */
export default function ScrollProgress() {
  const fill = useRef<HTMLDivElement>(null);
  const labels = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const st = ScrollTrigger.create({
      trigger: document.body,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        if (fill.current) fill.current.style.transform = `scaleY(${self.progress})`;

        const active = Math.min(
          CHAPTERS.length - 1,
          Math.floor(self.progress * CHAPTERS.length),
        );
        const children = labels.current?.children;
        if (!children) return;
        for (let i = 0; i < children.length; i++) {
          const el = children[i] as HTMLElement;
          el.style.opacity = i === active ? '1' : '0.28';
          el.style.letterSpacing = i === active ? '0.42em' : '0.3em';
        }
      },
    });

    return () => st.kill();
  }, []);

  return (
    <div
      aria-hidden
      data-chapter-rail
      className="pointer-events-none fixed right-6 top-1/2 z-40 hidden -translate-y-1/2 items-center gap-5 lg:flex"
    >
      <div
        ref={labels}
        className="flex flex-col items-end gap-6 font-body text-[9px] uppercase tracking-[0.3em] text-gold-pale"
      >
        {CHAPTERS.map((c) => (
          <span
            key={c}
            className="transition-[opacity,letter-spacing] duration-500 ease-out"
            style={{ opacity: 0.28 }}
          >
            {c}
          </span>
        ))}
      </div>

      <div className="relative h-40 w-px bg-gold/15">
        <div
          ref={fill}
          className="absolute inset-x-0 top-0 h-full origin-top bg-gradient-to-b from-gold-pale via-gold to-gold/0"
          style={{ transform: 'scaleY(0)' }}
        />
      </div>
    </div>
  );
}

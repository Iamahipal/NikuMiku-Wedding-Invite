'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';
import type Lenis from 'lenis';

import { gsap, ScrollTrigger } from '@/lib/gsap';
import { timeline } from '@/lib/timeline';
import ScrollCue from '@/components/ui/ScrollCue';

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/**
 * ============================================================================
 * THE SEQUENCE
 * ============================================================================
 * The entire shot list, in order, in one file.
 *
 * Two halves:
 *
 *   AUTOPLAY (~3.4s, scroll locked) — void, ignition, big bang, reveal.
 *     Written straight into `timeline` by a GSAP timeline.
 *
 *   FLY-THROUGH (scroll driven) — the mantra rushes the camera and passes
 *     through it. ScrollTrigger writes `timeline.scroll`; CameraRig damps it.
 *
 * Nothing here calls setState. GSAP writes numbers into the `timeline`
 * singleton and the render loop reads them. React renders this once.
 * ============================================================================
 */
export default function Sequence() {
  const root = useRef<HTMLElement>(null);

  useIsomorphicLayoutEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    timeline.reducedMotion = reduced;

    const lenis = (window as unknown as { lenis?: Lenis }).lenis;

    const ctx = gsap.context(() => {
      /* ============================================================
       * SCROLL — the fly-through
       * ============================================================ */
      ScrollTrigger.create({
        trigger: root.current,
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: (self) => {
          timeline.scroll = self.progress;
        },
      });

      /* ============================================================
       * REDUCED MOTION — skip the explosion, land on the title.
       * ============================================================ */
      if (reduced) {
        timeline.bang = 0;
        timeline.flash = 0;
        timeline.reveal = 1;
        timeline.live = true;
        return;
      }

      /* ============================================================
       * AUTOPLAY
       * ============================================================ */
      lenis?.stop();
      window.scrollTo(0, 0);

      const tl = gsap.timeline({
        paused: true,
        onComplete: () => {
          timeline.live = true;
          lenis?.start();
          ScrollTrigger.refresh();
        },
      });

      tl
        // BEAT 0 · VOID — black. Nothing but the held breath.
        .to({}, { duration: 0.5 })

        // BEAT 1 · IGNITION — a single point of light finds itself.
        // `bang` 0 → 0.45 is the ignition band inside BigBang.
        .to(timeline, { bang: 0.45, duration: 1.0, ease: 'power2.in' })

        // BEAT 2 · BIG BANG — detonation. The core scales past the camera and
        // swallows the frame; the shockwave and embers go out with it.
        .to(timeline, { bang: 1, duration: 1.0, ease: 'power2.out' })

        // BEAT 3 · REVEAL — the mantra materialises out of the residual glow.
        // It overlaps the tail of the explosion on purpose: the title should
        // emerge *from* the light, not appear after it has gone.
        .to(timeline, { reveal: 1, duration: 1.1, ease: 'power2.out' }, '-=0.55')
        // `live` flips in onComplete, which is what releases the mantra from
        // its parked position and unlocks scrolling.
        .to('[data-cue]', { opacity: 1, duration: 0.8 }, '-=0.5');

      // Scrub handle. The opening is a ~3s event; under a software renderer a
      // screenshot costs longer than a beat, so sampling it on a wall clock
      // silently drifts past the explosion. Exposing the master timeline lets
      // it be scrubbed to an exact progress like a video, which is the only
      // way to look at a specific frame of it honestly.
      (window as unknown as { __seq?: unknown }).__seq = { timeline, master: tl };

      // Hold the black frame until fonts and the mantra geometry are ready —
      // silently, with no counter. The race caps the wait so a slow network
      // can never stall the opening indefinitely.
      Promise.race([
        document.fonts?.ready ?? Promise.resolve(),
        new Promise((resolve) => setTimeout(resolve, 2000)),
      ]).then(() => tl.play());
    }, root);

    return () => {
      ctx.revert();
      lenis?.start();
    };
  }, []);

  return (
    <main ref={root} className="relative z-10 h-[420vh] w-full">
      <ScrollCue />
    </main>
  );
}

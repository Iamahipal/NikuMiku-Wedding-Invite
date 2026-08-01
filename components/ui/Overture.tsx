'use client';

import { useEffect, useRef } from 'react';
import type Lenis from 'lenis';

import { gsap, ScrollTrigger } from '@/lib/gsap';
import { scrollState } from '@/lib/scroll-state';

/** Fired when the spark blooms — ScrollJourney flies the mantra in on this. */
export const ENTER_EVENT = 'invitation:enter';

/**
 * THE OVERTURE — the first four seconds.
 *
 * No logo, no names, no percentage counter. The film opens on black, a single
 * golden spark ignites dead centre, breathes, then rushes past the camera in a
 * bloom of light — and the mantra arrives out of that light from deep space.
 *
 * This component owns only the black veil and the spark. The mantra itself
 * lives in the Invocation scene and is animated by ScrollJourney, which is
 * cued by ENTER_EVENT at the moment of the bloom — so the title is already
 * flying toward the viewer while the veil is still clearing. One continuous
 * move, rather than a loader that finishes and hands over.
 *
 * Fonts are awaited silently behind the black frame: Devanagari must never
 * flash in a fallback face before it flies.
 */
export default function Overture() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const lenis = (window as unknown as { lenis?: Lenis }).lenis;
    lenis?.stop();
    window.scrollTo(0, 0);

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        paused: true,
        onComplete: () => {
          lenis?.start();
          ScrollTrigger.refresh();
          if (root.current) root.current.style.display = 'none';
        },
      });

      // ---- 1. IGNITION — a point of light out of nothing.
      tl.fromTo(
        '[data-spark-core]',
        { scale: 0, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.7, ease: 'power2.out' },
      )
        // A candle catching. This must start *after* the ignition fade
        // completes — a yoyo tween returns to whatever value it captured on
        // its first render, so overlapping the fade would strand the spark
        // at partial brightness for the rest of the sequence.
        .to('[data-spark-core]', { opacity: 0.45, duration: 0.08, repeat: 3, yoyo: true }, 0.72)
        // anamorphic flare streaks, the way a real lens blooms on a hot point
        .fromTo(
          '[data-spark-streak-h]',
          { scaleX: 0, opacity: 0 },
          { scaleX: 1, opacity: 0.9, duration: 0.9, ease: 'expo.out' },
          0.3,
        )
        .fromTo(
          '[data-spark-streak-v]',
          { scaleY: 0, opacity: 0 },
          { scaleY: 1, opacity: 0.5, duration: 0.9, ease: 'expo.out' },
          0.36,
        )
        .to('[data-spark-core]', { scale: 1.45, duration: 0.7, ease: 'sine.inOut' }, 0.7)

        // ---- 2. BLOOM — the spark rushes the lens and swallows the frame.
        .to('[data-spark-core]', { scale: 34, opacity: 0, duration: 1.15, ease: 'power3.in' }, 1.35)
        .to(
          '[data-spark-streak-h], [data-spark-streak-v]',
          { opacity: 0, scaleX: 2.4, duration: 0.6, ease: 'power2.in' },
          1.35,
        )
        // shockwave ring
        .fromTo(
          '[data-spark-ring]',
          { scale: 0.15, opacity: 0.85 },
          { scale: 3.6, opacity: 0, duration: 1.4, ease: 'power2.out' },
          1.45,
        )
        // embers thrown outward, each on its own vector
        .fromTo(
          '[data-ember]',
          { opacity: 1, x: 0, y: 0, scale: 1 },
          {
            x: () => gsap.utils.random(-460, 460),
            y: () => gsap.utils.random(-320, 320),
            opacity: 0,
            scale: () => gsap.utils.random(0.3, 1.6),
            duration: 1.8,
            ease: 'power2.out',
            stagger: { amount: 0.25, from: 'random' },
          },
          1.45,
        )

        // The dust field reacts to the bloom: a burst of travel and glow that
        // settles as the mantra lands. CameraRig damps toward these, so
        // tweening the *targets* keeps the motion smooth.
        .add(() => {
          gsap.fromTo(
            scrollState,
            { travelTarget: -190 },
            { travelTarget: 0, duration: 2.6, ease: 'power2.out' },
          );
          gsap.fromTo(
            scrollState,
            { warpTarget: 0.95, intensityTarget: 1.7 },
            { warpTarget: 0, intensityTarget: 0.85, duration: 2.8, ease: 'power2.out' },
          );
        }, 1.5)

        // ---- 3. HANDOVER — the mantra starts its approach mid-bloom.
        .add(() => window.dispatchEvent(new CustomEvent(ENTER_EVENT)), 1.75)
        .to('[data-overture-veil]', { opacity: 0, duration: 1.3, ease: 'power2.inOut' }, 1.9);

      // Hold the black frame until the webfonts are in — silently, with no
      // loading UI. The race caps the wait so a slow CDN can't stall the film.
      Promise.race([
        document.fonts?.ready ?? Promise.resolve(),
        new Promise((resolve) => setTimeout(resolve, 2500)),
      ]).then(() => tl.play());
    }, root);

    return () => {
      ctx.revert();
      lenis?.start();
    };
  }, []);

  return (
    <div ref={root} className="pointer-events-none fixed inset-0 z-[100]">
      <div data-overture-veil className="absolute inset-0 bg-void" />

      <div className="absolute inset-0 flex items-center justify-center">
        {/* Shockwave */}
        <div
          data-spark-ring
          className="absolute h-[36vmin] w-[36vmin] rounded-full border border-gold-pale/40 opacity-0"
        />

        {/* Anamorphic flare */}
        <div
          data-spark-streak-h
          className="absolute h-px w-[70vw] opacity-0"
          style={{
            background:
              'linear-gradient(90deg, transparent, rgba(242,200,119,0.65) 35%, #fff6e2 50%, rgba(242,200,119,0.65) 65%, transparent)',
            filter: 'blur(0.5px)',
          }}
        />
        <div
          data-spark-streak-v
          className="absolute h-[42vh] w-px opacity-0"
          style={{
            background:
              'linear-gradient(180deg, transparent, rgba(242,200,119,0.5) 38%, #fff6e2 50%, rgba(242,200,119,0.5) 62%, transparent)',
          }}
        />

        {/* Embers */}
        {Array.from({ length: 18 }).map((_, i) => (
          <div
            key={i}
            data-ember
            className="absolute h-[3px] w-[3px] rounded-full bg-gold-bright opacity-0"
            style={{ boxShadow: '0 0 6px 1px rgba(242,200,119,0.8)' }}
          />
        ))}

        {/* The spark itself */}
        <div
          data-spark-core
          className="absolute h-[9vmin] w-[9vmin] rounded-full opacity-0"
          style={{
            background:
              'radial-gradient(closest-side, #fffaf0 0%, #f6e3ba 18%, rgba(242,200,119,0.55) 38%, rgba(217,164,65,0.18) 60%, transparent 75%)',
          }}
        />
      </div>
    </div>
  );
}

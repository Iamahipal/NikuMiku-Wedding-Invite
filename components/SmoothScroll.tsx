'use client';

import { useEffect, useRef } from 'react';
import Lenis from 'lenis';

import { gsap, ScrollTrigger } from '@/lib/gsap';
import { scrollState } from '@/lib/scroll-state';

/**
 * Lenis <-> GSAP marriage.
 *
 * The three rules that make this feel like landonorris.com rather than a
 * jittery smooth-scroll plugin:
 *
 *  1. ONE clock. Lenis' RAF is disabled (`autoRaf: false`) and driven from
 *     gsap.ticker instead, so scroll interpolation and every ScrollTrigger
 *     tween are computed in the same frame, in the right order. Two loops =
 *     one frame of lag between the text and the WebGL, which reads as "cheap".
 *
 *  2. lagSmoothing(0). If a heavy frame lands (shader compile, image decode)
 *     GSAP must not silently rewind time — that shows up as a visible scroll
 *     hitch on a pinned section.
 *
 *  3. ScrollTrigger.update on every Lenis scroll event, and `scrollerProxy`
 *     is NOT needed because Lenis moves the real window scroll position.
 */
export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    scrollState.reducedMotion = reduced;

    const lenis = new Lenis({
      // ~1.15s to settle: long enough to feel weighted, short enough to stay
      // responsive to a fast flick.
      duration: reduced ? 0 : 1.15,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: !reduced,
      wheelMultiplier: 1,
      touchMultiplier: 1.6,
      // Touch devices already have native inertia; fighting it feels laggy.
      syncTouch: false,
      autoRaf: false,
      anchors: true,
    });

    lenisRef.current = lenis;
    // Exposed for debugging + for any component that wants lenis.scrollTo().
    (window as unknown as { lenis?: Lenis }).lenis = lenis;

    lenis.on('scroll', ScrollTrigger.update);

    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    // Pointer parallax for the WebGL camera sway — written straight into the
    // imperative store, never into React state.
    const onPointerMove = (e: PointerEvent) => {
      scrollState.pointerX = (e.clientX / window.innerWidth) * 2 - 1;
      scrollState.pointerY = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('pointermove', onPointerMove, { passive: true });

    // Fonts change metrics; pinned sections must be measured after they load.
    document.fonts?.ready.then(() => ScrollTrigger.refresh());

    // Late-loading images (the parallax cutouts) shift layout height.
    const onLoad = () => ScrollTrigger.refresh();
    window.addEventListener('load', onLoad);

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('load', onLoad);
      gsap.ticker.remove(raf);
      lenis.destroy();
      lenisRef.current = null;
      delete (window as unknown as { lenis?: Lenis }).lenis;
    };
  }, []);

  return <>{children}</>;
}

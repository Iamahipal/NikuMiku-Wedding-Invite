'use client';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

// Register once, on the client only. Importing this module from any client
// component guarantees the plugins exist before a timeline is built.
if (typeof window !== 'undefined') {
  // registerPlugin is idempotent, and this module is a singleton — but the
  // guard keeps the config below from running twice under fast refresh.
  gsap.registerPlugin(ScrollTrigger, SplitText);

  // Lenis drives the scroll position; ScrollTrigger must never try to
  // normalise or smooth it itself or the two fight each other.
  ScrollTrigger.config({
    ignoreMobileResize: true,
    autoRefreshEvents: 'visibilitychange,DOMContentLoaded,load',
  });

  gsap.defaults({ ease: 'power3.out', duration: 1 });
}

export { gsap, ScrollTrigger, SplitText };

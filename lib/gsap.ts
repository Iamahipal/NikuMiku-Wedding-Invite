'use client';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
  // A heavy frame (shader compile, geometry build) must not rewind GSAP's
  // clock — that surfaces as a visible hitch on a scrubbed sequence.
  gsap.ticker.lagSmoothing(0);
}

export { gsap, ScrollTrigger };

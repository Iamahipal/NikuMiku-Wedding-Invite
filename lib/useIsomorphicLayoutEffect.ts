import { useEffect, useLayoutEffect } from 'react';

/**
 * GSAP setup must run before paint (so `from` states are applied on the same
 * frame the DOM appears) but useLayoutEffect warns during SSR. This is the
 * standard GSAP/React escape hatch.
 */
export const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

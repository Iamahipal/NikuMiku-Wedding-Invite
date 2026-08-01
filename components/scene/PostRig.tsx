'use client';

import type { RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import type { BloomEffect, ChromaticAberrationEffect } from 'postprocessing';

import { SHINE, shine, timeline } from '@/lib/timeline';

/**
 * Per-frame post-processing modulation.
 *
 * Effect uniforms are mutated directly rather than passed as React props —
 * changing a prop would re-render the composer and rebuild the effect chain
 * every frame, which is both a stutter and a memory churn.
 *
 * Chromatic aberration scales with scroll velocity so the fly-through smears
 * at the edges as it accelerates: cheap, convincing motion blur for a fraction
 * of the cost of a real velocity-buffer pass.
 */
export default function PostRig({
  ca,
  bloom,
}: {
  ca: RefObject<ChromaticAberrationEffect | null>;
  bloom: RefObject<BloomEffect | null>;
}) {
  useFrame(() => {
    const speed = Math.min(1, Math.abs(timeline.velocity) * 0.75);

    if (ca.current) {
      // Zero at rest, on purpose. Even a sub-pixel offset resamples a 1px
      // dust mote across channels and speckles the whole field magenta and
      // green. Aberration is a motion cue here, so it only exists in motion.
      const smear = speed * 0.0009 + timeline.bang * 0.0008;
      ca.current.offset.set(smear, smear * 0.6);
    }

    if (bloom.current) {
      // THE SHINE CURVE (see lib/timeline.ts). Far away the mantra is a
      // distant jewel and heavy bloom is what sells it. Close up the glow has
      // to get out of the way: at readable size, bloom is the enemy of
      // legibility, and blowing the faces to white destroys the very shading
      // that makes the letterforms look solid.
      const n = timeline.nearness;
      bloom.current.intensity =
        shine(SHINE.bloom, n) + timeline.bang * 2.2 + speed * 0.35;

      // Raising the cut-off as it approaches means only true speculars bloom,
      // leaving the mid-tones — the readable part — alone.
      const target = shine(SHINE.threshold, n);
      bloom.current.luminanceMaterial.threshold = target;
    }
  });

  return null;
}

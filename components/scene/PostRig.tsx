'use client';

import type { RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import type { BloomEffect, ChromaticAberrationEffect } from 'postprocessing';

import { timeline } from '@/lib/timeline';

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
      const smear = speed * 0.0018 + timeline.bang * 0.001;
      ca.current.offset.set(smear, smear * 0.6);
    }

    if (bloom.current) {
      // The explosion pushes bloom hard, then it settles back so the mantra
      // stays legible rather than drowning in glow.
      bloom.current.intensity = 0.85 + timeline.bang * 2.2 + speed * 0.5;
    }
  });

  return null;
}

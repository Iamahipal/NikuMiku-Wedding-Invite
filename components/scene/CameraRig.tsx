'use client';

import { useFrame } from '@react-three/fiber';

import { damp, timeline } from '@/lib/timeline';

/**
 * The only place timeline targets become motion.
 *
 * Mounted first inside the Canvas so its useFrame runs before anything reads
 * the damped values in the same frame. All damping is exponential against real
 * delta, so the sequence feels identical on a 60Hz laptop and a 144Hz monitor.
 */
export default function CameraRig() {
  useFrame(({ camera, clock }, delta) => {
    // Clamp dt so a backgrounded tab doesn't teleport everything on resume.
    const dt = Math.min(delta, 1 / 30);
    const t = clock.elapsedTime;

    const previous = timeline.approach;
    timeline.approach = damp(timeline.approach, timeline.scroll, 6, dt);
    timeline.velocity = (timeline.approach - previous) / Math.max(dt, 0.0001);

    // Ambient travel so the dust is alive even at scroll 0.
    timeline.drift += dt * (1.2 + timeline.approach * 9);

    if (timeline.reducedMotion) return;

    // The explosion kicks the camera. Decays as `bang` completes.
    const kick = Math.max(0, Math.sin(timeline.bang * Math.PI)) * (1 - timeline.approach);
    camera.position.x = damp(
      camera.position.x,
      Math.sin(t * 1.7) * 0.5 * kick + Math.sin(t * 0.23) * 0.25,
      8,
      dt,
    );
    camera.position.y = damp(
      camera.position.y,
      Math.cos(t * 2.1) * 0.4 * kick + Math.cos(t * 0.19) * 0.2,
      8,
      dt,
    );

    // A whisper of roll that tightens as you fly in — sells the speed.
    camera.rotation.z = damp(
      camera.rotation.z,
      Math.sin(t * 0.14) * 0.01 + timeline.approach * 0.03,
      2,
      dt,
    );
  });

  return null;
}

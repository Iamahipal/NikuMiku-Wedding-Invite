'use client';

import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import { damp, scrollState } from '@/lib/scroll-state';

const LOOK_TARGET = new THREE.Vector3(0, 0, -60);

/**
 * The single place where scroll targets are integrated into actual motion.
 *
 * Mounted first inside the Canvas so its useFrame runs before the particle
 * layers read the damped values in the same frame. Everything here is
 * frame-rate independent (exponential damping against real delta), so the
 * flight feels identical on a 60Hz laptop and a 144Hz monitor.
 */
export default function CameraRig() {
  useFrame(({ camera, clock }, delta) => {
    // Clamp dt so a stalled tab doesn't teleport the camera on resume.
    const dt = Math.min(delta, 1 / 30);

    scrollState.travel = damp(scrollState.travel, scrollState.travelTarget, 3.2, dt);
    scrollState.warp = damp(scrollState.warp, scrollState.warpTarget, 2.4, dt);
    scrollState.drift = damp(scrollState.drift, scrollState.driftTarget, 2.0, dt);
    scrollState.intensity = damp(
      scrollState.intensity,
      scrollState.intensityTarget,
      2.6,
      dt,
    );

    if (scrollState.reducedMotion) return;

    const t = clock.elapsedTime;

    // Handheld-camera breathing + pointer parallax. Small numbers on purpose:
    // this should be felt, not seen.
    const targetX = scrollState.pointerX * 2.4 + Math.sin(t * 0.21) * 0.5;
    const targetY = -scrollState.pointerY * 1.6 + Math.cos(t * 0.17) * 0.4;

    camera.position.x = damp(camera.position.x, targetX, 1.8, dt);
    camera.position.y = damp(camera.position.y, targetY, 1.8, dt);

    camera.lookAt(LOOK_TARGET);

    // A whisper of roll, leaning into the warp during the horizontal act.
    camera.rotation.z = damp(
      camera.rotation.z,
      Math.sin(t * 0.13) * 0.012 - scrollState.drift * 0.004,
      1.4,
      dt,
    );
  });

  return null;
}

'use client';

import { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';

import { TUBE_DEPTH } from '@/lib/scroll-state';
import CameraRig from './CameraRig';
import Particles from './Particles';

/**
 * The persistent film canvas. Mounted once by the root layout and never
 * unmounted — routes, sections and React updates all happen *above* it in the
 * DOM, so the flight never restarts.
 */
export default function Scene() {
  const [dpr, setDpr] = useState(1.5);

  return (
    <Canvas
      dpr={dpr}
      gl={{
        alpha: true,
        antialias: false, // points don't benefit; costs ~30% fill rate
        stencil: false,
        depth: true,
        powerPreference: 'high-performance',
      }}
      camera={{ fov: 58, near: 0.1, far: TUBE_DEPTH * 1.4, position: [0, 0, 0] }}
      // Never let R3F drop below half speed on a weak GPU; a stuttering
      // background is worse than a slightly lower-resolution one.
      performance={{ min: 0.4 }}
      style={{ pointerEvents: 'none' }}
    >
      <PerformanceMonitor
        onDecline={() => setDpr(1)}
        onIncline={() => setDpr(Math.min(2, window.devicePixelRatio))}
      />

      {/* Runs first: integrates scroll targets into camera + shared state. */}
      <CameraRig />

      {/* Far field — the depth of the frame. Fine, slow, dense. */}
      <Particles
        count={2600}
        radius={54}
        innerRadius={4}
        depth={TUBE_DEPTH}
        size={1.15}
        travelScale={1}
        floatAmount={0.8}
        opacity={0.9}
        seed={3}
      />

      {/* Near field — big soft dust motes drifting past the lens. */}
      <Particles
        count={280}
        radius={26}
        innerRadius={2}
        depth={TUBE_DEPTH * 0.42}
        size={3.4}
        travelScale={1.9}
        floatAmount={2.4}
        opacity={0.55}
        seed={11}
      />
    </Canvas>
  );
}

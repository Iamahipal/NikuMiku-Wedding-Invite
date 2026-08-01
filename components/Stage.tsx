'use client';

import { Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import {
  Bloom,
  ChromaticAberration,
  EffectComposer,
  ToneMapping,
} from '@react-three/postprocessing';
import { BlendFunction, ToneMappingMode } from 'postprocessing';
import type { BloomEffect, ChromaticAberrationEffect } from 'postprocessing';
import * as THREE from 'three';

import Backdrop from '@/components/scene/Backdrop';
import BigBang from '@/components/scene/BigBang';
import CameraRig from '@/components/scene/CameraRig';
import DustField from '@/components/scene/DustField';
import MantraMesh from '@/components/scene/MantraMesh';
import StudioEnv from '@/components/scene/StudioEnv';
import PostRig from '@/components/scene/PostRig';

/**
 * The one and only canvas. Mounted once by the layout, never unmounted, never
 * re-rendered by scroll.
 */
export default function Stage() {

  // Held as refs so PostRig can mutate the effects each frame without
  // re-rendering the composer.
  const ca = useRef<ChromaticAberrationEffect>(null);
  const bloom = useRef<BloomEffect>(null);

  return (
    <Canvas
      // Fixed at mount. Deliberately NOT adaptive: drei's PerformanceMonitor
      // drives dpr through React state, and re-rendering the Canvas subtree
      // mid-mount races the Environment portal and the SVG loader's Suspense
      // boundary — which crashed the whole scene intermittently. A canvas that
      // never re-renders is worth more than adaptive resolution.
      dpr={[1, 1.75]}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
        stencil: false,
      }}
      // Without ACES the gold clips to flat white the moment emissive values
      // go above 1 — you lose the bloom rolloff that makes it look hot.
      onCreated={({ gl, scene }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.08;
        scene.background = new THREE.Color('#060402');
        // Exposed for measurement: triangle and draw-call counts are the only
        // hardware-independent perf numbers available here, since this sandbox
        // renders through SwiftShader rather than a GPU.
        (window as unknown as { __gl?: unknown; __scene?: unknown }).__gl = gl;
        (window as unknown as { __scene?: unknown }).__scene = scene;
      }}
      camera={{ fov: 50, near: 0.1, far: 3000, position: [0, 0, 0] }}
      performance={{ min: 0.4 }}
    >
      {/* Runs first: integrates timeline targets into camera motion. */}
      <CameraRig />

      <Backdrop />

      <Suspense fallback={null}>
        <StudioEnv />
        <MantraMesh />
      </Suspense>

      <DustField />
      <BigBang />

      <EffectComposer multisampling={0} enableNormalPass={false}>
        <Bloom
          ref={bloom}
          mipmapBlur
          // Low threshold on purpose: the gold itself should glow, not only
          // the explosion. This is most of the "shiny".
          // Threshold sits above the dust and the lit gold so only genuinely
          // hot things bloom. Dropping it lower washes every mote to white and
          // the scene stops reading as gold at all.
          luminanceThreshold={0.72}
          luminanceSmoothing={0.3}
          intensity={0.9}
          radius={0.7}
        />
        <ChromaticAberration
          ref={ca}
          blendFunction={BlendFunction.NORMAL}
          // Driven per-frame from scroll velocity by PostRig.
          offset={new THREE.Vector2(0.00008, 0.00008)}
          radialModulation={false}
          modulationOffset={0}
        />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      </EffectComposer>

      {/* Mutates effect uniforms each frame without re-rendering the composer. */}
      <PostRig ca={ca} bloom={bloom} />
    </Canvas>
  );
}

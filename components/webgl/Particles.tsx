'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import { scrollState } from '@/lib/scroll-state';
import { particleFragmentShader, particleVertexShader } from './particleShader';

type ParticlesProps = {
  count: number;
  /** Radius of the tube the dust is scattered in. */
  radius: number;
  /** Hollow core, so the middle of frame stays readable behind typography. */
  innerRadius?: number;
  depth: number;
  size: number;
  /** How much of the global travel this layer receives (parallax). */
  travelScale?: number;
  /** Amplitude of the idle brownian float. */
  floatAmount?: number;
  opacity?: number;
  /** Deterministic per-layer scatter. */
  seed?: number;
};

/**
 * One draw call, one BufferGeometry, zero React work per frame.
 * The component renders exactly once; everything after that is uniforms.
 */
export default function Particles({
  count,
  radius,
  innerRadius = 3,
  depth,
  size,
  travelScale = 1,
  floatAmount = 1,
  opacity = 1,
  seed = 1,
}: ParticlesProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const { positions, scales, seeds, tints } = useMemo(() => {
    // Small deterministic PRNG — identical field on server-less rehydration
    // and between reloads, which keeps the art direction reproducible.
    let s = seed * 9301;
    const rand = () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };

    const positions = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    const seeds = new Float32Array(count);
    const tints = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // sqrt distribution = uniform density across the disc, then pushed out
      // of the centre so the hero type never fights a wall of sparkles.
      const r = innerRadius + Math.sqrt(rand()) * (radius - innerRadius);
      const theta = rand() * Math.PI * 2;

      positions[i * 3] = Math.cos(theta) * r;
      positions[i * 3 + 1] = Math.sin(theta) * r * 0.72; // slightly cinemascope
      positions[i * 3 + 2] = -rand() * depth;

      // A few big hero motes among a lot of fine dust.
      const t = rand();
      scales[i] = t > 0.97 ? 2.6 + rand() * 2.2 : 0.35 + Math.pow(rand(), 2) * 1.5;
      seeds[i] = rand();
      tints[i] = Math.pow(rand(), 1.6); // biased toward the bright gold
    }

    return { positions, scales, seeds, tints };
  }, [count, radius, innerRadius, depth, seed]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uTravel: { value: 0 },
      uTravelScale: { value: travelScale },
      uDepth: { value: depth },
      uSize: { value: size },
      uWarp: { value: 0 },
      uDrift: { value: 0 },
      uFloat: { value: floatAmount },
      uOpacity: { value: opacity },
      uIntensity: { value: 1 },
      uCore: { value: new THREE.Color('#fff6e2') },
      uGlow: { value: new THREE.Color('#f2c877') },
      uDeep: { value: new THREE.Color('#b1762a') },
    }),
    // Uniform objects are created once on purpose; values are mutated in
    // useFrame. Re-creating them would recompile the material.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useFrame((_, delta) => {
    const u = materialRef.current?.uniforms;
    if (!u) return;

    // Idle life even at scroll position 0 — the field is never frozen.
    u.uTime.value += delta;
    u.uTravel.value = scrollState.travel + u.uTime.value * 1.6;
    u.uWarp.value = scrollState.warp;
    u.uDrift.value = scrollState.drift;
    u.uIntensity.value = scrollState.intensity;
  });

  return (
    <points frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aScale" args={[scales, 1]} />
        <bufferAttribute attach="attributes-aSeed" args={[seeds, 1]} />
        <bufferAttribute attach="attributes-aTint" args={[tints, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={particleVertexShader}
        fragmentShader={particleFragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

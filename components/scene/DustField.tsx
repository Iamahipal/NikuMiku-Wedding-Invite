'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import { timeline } from '@/lib/timeline';

const DEPTH = 900;
const COUNT = 2600;

/**
 * Golden dust filling the tunnel the mantra flies down.
 *
 * The whole flight happens on the GPU: every mote is advanced along +Z by
 * `uTravel` and wrapped modulo the tube depth. That makes the field infinite —
 * nothing is ever re-seeded on the CPU, the tunnel never thins out however far
 * you scroll, and the entire thing is one draw call.
 *
 * The alpha fade at both ends of the tube is what makes the modulo wrap
 * invisible; without it you see motes pop in and out at a fixed plane.
 */
const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uTravel;
  uniform float uDepth;
  uniform float uSize;
  uniform float uWarp;

  attribute float aScale;
  attribute float aSeed;

  varying float vAlpha;
  varying float vSpark;

  void main() {
    vec3 p = position;

    // Depth layers: near motes travel faster than far ones. Parallax for free,
    // inside a single draw call.
    float layer = 0.55 + aSeed * 0.9;

    float z = p.z + uTravel * layer;
    z = mod(z, uDepth) - uDepth;

    float t = uTime * (0.12 + aSeed * 0.2);
    p.x += sin(t + aSeed * 31.4) * 1.6;
    p.y += cos(t * 0.85 + aSeed * 17.7) * 1.3;

    vec4 mv = modelViewMatrix * vec4(p.x, p.y, z, 1.0);
    float dist = -mv.z;

    vAlpha =
      smoothstep(0.0, uDepth * 0.06, dist) *
      (1.0 - smoothstep(uDepth * 0.5, uDepth * 0.98, dist));
    vSpark = 0.55 + 0.45 * sin(uTime * (0.9 + aSeed * 2.4) + aSeed * 62.8);

    gl_Position = projectionMatrix * mv;
    gl_PointSize = aScale * uSize * (1.0 + uWarp * 2.0) * (260.0 / max(dist, 1.0));
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;

  uniform vec3 uCore;
  uniform vec3 uGlow;

  varying float vAlpha;
  varying float vSpark;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    if (d > 0.5) discard;

    // Wide soft halo plus a hot core. Additively blended this reads as real
    // bloom on its own, and the Bloom pass then amplifies it.
    float falloff = 1.0 - smoothstep(0.0, 0.5, d);
    float halo = pow(falloff, 2.4);
    float core = pow(falloff, 9.0);

    // The hot white core is kept small and weak on purpose. Additive blending
    // plus ACES tone mapping desaturates bright pixels hard, so a strong white
    // centre turns the whole field into a monochrome starfield.
    vec3 col = mix(uGlow, uCore, core * 0.55);
    gl_FragColor = vec4(col, (halo * 0.5 + core * 0.5) * vAlpha * vSpark);
  }
`;

export default function DustField() {
  const material = useRef<THREE.ShaderMaterial>(null);

  const { positions, scales, seeds } = useMemo(() => {
    // Deterministic PRNG so the field is identical on every load — the art
    // direction of the opening shot shouldn't be a dice roll.
    let s = 20260214;
    const rand = () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };

    const positions = new Float32Array(COUNT * 3);
    const scales = new Float32Array(COUNT);
    const seeds = new Float32Array(COUNT);

    for (let i = 0; i < COUNT; i++) {
      // Hollow core: keeps the centre of frame clear so the mantra always has
      // clean space to arrive into.
      const r = 26 + Math.sqrt(rand()) * 240;
      const theta = rand() * Math.PI * 2;
      positions[i * 3] = Math.cos(theta) * r;
      positions[i * 3 + 1] = Math.sin(theta) * r * 0.8;
      positions[i * 3 + 2] = -rand() * DEPTH;

      const big = rand();
      scales[i] = big > 0.97 ? 2.6 + rand() * 2.2 : 0.95 + Math.pow(rand(), 2) * 1.5;
      seeds[i] = rand();
    }

    return { positions, scales, seeds };
  }, []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uTravel: { value: 0 },
      uDepth: { value: DEPTH },
      uSize: { value: 2.4 },
      uWarp: { value: 0 },
      uCore: { value: new THREE.Color('#ffe3b0') },
      uGlow: { value: new THREE.Color('#e39a2c') },
    }),
    [],
  );

  useFrame((_, delta) => {
    const u = material.current?.uniforms;
    if (!u) return;
    u.uTime.value += delta;
    u.uTravel.value = timeline.drift * 30;
    // Motes stretch as the fly-through accelerates.
    u.uWarp.value = Math.min(1, Math.abs(timeline.velocity) * 0.9);
  });

  return (
    <points frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aScale" args={[scales, 1]} />
        <bufferAttribute attach="attributes-aSeed" args={[seeds, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

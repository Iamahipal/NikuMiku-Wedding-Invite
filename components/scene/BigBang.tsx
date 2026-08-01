'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import { timeline } from '@/lib/timeline';

const BURST = 1800;
const CORE_Z = -70;

/**
 * The big bang: ignition, explosion, shockwave.
 *
 * Everything here is driven by `timeline.bang` (0 → 1), written by the
 * autoplay timeline. Nothing is scroll-linked.
 *
 * The white-out is not a DOM overlay — the core sphere genuinely scales past
 * the camera and swallows it. Its material is unlit, un-tone-mapped and set to
 * colour values far above 1, so the Bloom pass blows it out the way a real
 * over-exposed highlight blooms, instead of just turning the screen flat white.
 */
const burstVertex = /* glsl */ `
  uniform float uProgress;
  uniform float uSize;

  attribute vec3 aDir;
  attribute float aSpeed;
  attribute float aScale;

  varying float vFade;

  void main() {
    // Ease-out radial travel: violent at the instant of detonation, coasting
    // afterwards — the opposite of the linear spray that reads as "particles".
    float e = 1.0 - pow(1.0 - uProgress, 2.6);
    vec3 p = aDir * (e * aSpeed * 420.0);

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    float dist = -mv.z;

    vFade = (1.0 - smoothstep(0.45, 1.0, uProgress)) * smoothstep(0.0, 0.06, uProgress);

    gl_Position = projectionMatrix * mv;
    gl_PointSize = aScale * uSize * (300.0 / max(dist, 1.0));
  }
`;

const burstFragment = /* glsl */ `
  precision highp float;
  varying float vFade;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    if (d > 0.5) discard;
    float falloff = 1.0 - smoothstep(0.0, 0.5, d);
    float core = pow(falloff, 7.0);
    vec3 col = mix(vec3(1.0, 0.62, 0.18), vec3(1.0, 0.92, 0.72), core * 0.6);
    gl_FragColor = vec4(col * 1.25, (pow(falloff, 2.2) * 0.45 + core * 0.8) * vFade);
  }
`;

export default function BigBang() {
  const core = useRef<THREE.Mesh>(null);
  const coreMat = useRef<THREE.MeshBasicMaterial>(null);
  const ring = useRef<THREE.Mesh>(null);
  const ringMat = useRef<THREE.MeshBasicMaterial>(null);
  const burstMat = useRef<THREE.ShaderMaterial>(null);
  const group = useRef<THREE.Group>(null);

  const { dirs, speeds, scales } = useMemo(() => {
    let s = 77771;
    const rand = () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };

    const dirs = new Float32Array(BURST * 3);
    const speeds = new Float32Array(BURST);
    const scales = new Float32Array(BURST);

    for (let i = 0; i < BURST; i++) {
      // Evenly distributed directions on a sphere (naive angle pairs would
      // cluster the particles at the poles).
      const u = rand() * 2 - 1;
      const phi = rand() * Math.PI * 2;
      const r = Math.sqrt(1 - u * u);
      dirs[i * 3] = r * Math.cos(phi);
      dirs[i * 3 + 1] = r * Math.sin(phi);
      dirs[i * 3 + 2] = u * 0.65; // flattened toward the screen plane

      speeds[i] = 0.25 + Math.pow(rand(), 1.7) * 1.0;
      scales[i] = 0.5 + Math.pow(rand(), 2) * 2.6;
    }
    return { dirs, speeds, scales };
  }, []);

  const burstUniforms = useMemo(
    () => ({ uProgress: { value: 0 }, uSize: { value: 2.0 } }),
    [],
  );

  const positions = useMemo(() => new Float32Array(BURST * 3), []);

  useFrame(() => {
    const b = timeline.bang;

    if (burstMat.current) burstMat.current.uniforms.uProgress.value = b;

    // ---- Core: ignition, then detonation.
    if (core.current && coreMat.current) {
      // Ignition (0 → 0.45): a small point brightening.
      // Detonation (0.45 → 1): scales past the camera and engulfs it.
      const ignite = THREE.MathUtils.smoothstep(b, 0.0, 0.45);
      const blow = THREE.MathUtils.smoothstep(b, 0.45, 0.86);

      const scale = 0.6 * ignite + Math.pow(blow, 2.4) * 190;
      core.current.scale.setScalar(Math.max(0.0001, scale));

      // Emissive colour ramps far past 1 so Bloom has something to work with,
      // then falls away to reveal the mantra.
      const heat = (1.0 + ignite * 3.0) * (1 - THREE.MathUtils.smoothstep(b, 0.8, 1.0));
      coreMat.current.color.setRGB(heat * 1.0, heat * 0.86, heat * 0.62);
      core.current.visible = b > 0.001 && b < 0.995;
    }

    // ---- Shockwave ring.
    if (ring.current && ringMat.current) {
      const w = THREE.MathUtils.smoothstep(b, 0.42, 1.0);
      ring.current.scale.setScalar(0.2 + Math.pow(w, 0.7) * 60);
      ringMat.current.opacity = Math.sin(Math.min(1, w) * Math.PI) * 0.8;
      ring.current.visible = w > 0.001 && w < 0.999;
    }

    if (group.current) group.current.visible = b > 0.0005;
  });

  return (
    <group ref={group} visible={false}>
      {/* Core */}
      <mesh ref={core} position={[0, 0, CORE_Z]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          ref={coreMat}
          color="#fff2d2"
          // Unlit and outside tone mapping: this is a light source, not a
          // surface. DoubleSide so that when it engulfs the camera we see its
          // inner wall filling frame rather than nothing at all.
          toneMapped={false}
          side={THREE.DoubleSide}
          transparent={false}
          depthWrite={false}
        />
      </mesh>

      {/* Shockwave */}
      <mesh ref={ring} position={[0, 0, CORE_Z + 8]}>
        <ringGeometry args={[0.86, 1, 96]} />
        <meshBasicMaterial
          ref={ringMat}
          color="#ffe6b0"
          toneMapped={false}
          transparent
          opacity={0}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Ember burst */}
      <points position={[0, 0, CORE_Z]} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-aDir" args={[dirs, 3]} />
          <bufferAttribute attach="attributes-aSpeed" args={[speeds, 1]} />
          <bufferAttribute attach="attributes-aScale" args={[scales, 1]} />
        </bufferGeometry>
        <shaderMaterial
          ref={burstMat}
          uniforms={burstUniforms}
          vertexShader={burstVertex}
          fragmentShader={burstFragment}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}

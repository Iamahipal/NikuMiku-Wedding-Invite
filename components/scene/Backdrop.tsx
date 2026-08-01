'use client';

import { useMemo } from 'react';
import * as THREE from 'three';

/**
 * The black-and-gold void the whole film sits in.
 *
 * Pure flat black would be a mistake: it gives the tone mapper nothing to
 * work with at the edges, and the corners read as dead patches rather than as
 * depth. So this is a *warm* black — a low gold-brown haze pooling behind the
 * mantra and falling away to almost nothing at the extremes, keeping the whole
 * frame in the gold family without ever competing with the metal.
 *
 * An inverted sphere rather than a `scene.background` colour, because this way
 * it can carry that gradient.
 */
export default function Backdrop() {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        depthTest: false,
        toneMapped: false,
        uniforms: {
          uCore: { value: new THREE.Color('#1a1005') },
          uEdge: { value: new THREE.Color('#050302') },
        },
        vertexShader: /* glsl */ `
          varying vec3 vDir;
          void main() {
            vDir = normalize(position);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uCore;
          uniform vec3 uEdge;
          varying vec3 vDir;
          void main() {
            // Brightest straight ahead (-Z), falling off toward the periphery.
            float d = clamp(-vDir.z * 0.5 + 0.5, 0.0, 1.0);
            // Gentle enough that the corners never crush to a hard black edge —
            // four dark patches read as a vignette artefact, not as space.
            float g = pow(d, 2.2);
            gl_FragColor = vec4(mix(uEdge, uCore, g), 1.0);
          }
        `,
      }),
    [],
  );

  return (
    // renderOrder -1 + depthTest false: always painted first, never occludes.
    <mesh material={material} renderOrder={-1} frustumCulled={false} scale={2000}>
      <sphereGeometry args={[1, 32, 32]} />
    </mesh>
  );
}

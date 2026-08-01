'use client';

import { useMemo } from 'react';
import * as THREE from 'three';

/**
 * The royal blue void the whole film sits in.
 *
 * Without this the scene renders against pure black, and gold-on-black loses
 * the colour entirely — every highlight tone-maps toward white and the result
 * reads as a monochrome starfield. A deep blue field gives the gold something
 * to be gold *against*.
 *
 * An inverted sphere rather than a `scene.background` colour, because this way
 * it can carry a gradient: brighter in the centre of frame, falling to near
 * black at the edges, which quietly focuses the eye where the mantra arrives.
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
          uCore: { value: new THREE.Color('#0f2148') },
          uEdge: { value: new THREE.Color('#081128') },
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
            // Gentle enough that the corners never crush to black — four dark
            // patches read as a vignette artefact, not as space — but not so
            // flat that the field becomes a painted blue wall with no depth.
            float g = pow(d, 2.6);
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

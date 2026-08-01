'use client';

import { useMemo, useRef } from 'react';
import { useLoader, useFrame } from '@react-three/fiber';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import * as THREE from 'three';

import { asset } from '@/lib/asset';
import {
  MANTRA_DEPTH,
  MANTRA_WIDTH,
  READ_Z,
  fitScale,
  SHINE,
  START_Z,
  damp,
  mantraZ,
  nearness,
  shine,
  timeline,
} from '@/lib/timeline';

/**
 * ॐ गं गणपतये नमः as genuine 3D geometry.
 *
 * Outlines come from `public/mantra.svg`, shaped once by real HarfBuzz (see
 * scripts/build-mantra.mjs). SVGLoader turns them into filled Shapes and
 * ExtrudeGeometry gives them depth and — crucially — bevels. The bevel is not
 * decoration: it is the only surface angled to catch a moving specular, and
 * that travelling highlight is what makes an object read as polished metal
 * rather than flat yellow plastic.
 */
export default function MantraMesh() {
  const group = useRef<THREE.Group>(null);
  const material = useRef<THREE.MeshPhysicalMaterial>(null);
  const auraMat = useRef<THREE.ShaderMaterial>(null);
  const data = useLoader(SVGLoader, asset('/mantra.svg'));

  const geometry = useMemo(() => {
    const shapes: THREE.Shape[] = [];
    for (const path of data.paths) {
      // `createShapes` resolves counters (the holes inside ग, प, म …) into
      // Shape holes using the path's fill rule. Devanagari has plenty.
      shapes.push(...SVGLoader.createShapes(path));
    }

    const geo = new THREE.ExtrudeGeometry(shapes, {
      depth: MANTRA_DEPTH,
      bevelEnabled: true,
      bevelThickness: 2.4,
      bevelSize: 1.7,
      bevelOffset: 0,
      bevelSegments: 3,
      curveSegments: 8,
    });

    // SVG is Y-down, three is Y-up. Mirroring on Y reverses triangle winding,
    // which would leave every normal pointing into the solid and light the
    // mantra as though it were inside-out — so the index order is flipped back
    // before normals are computed.
    geo.applyMatrix4(new THREE.Matrix4().makeScale(1, -1, 1));
    const index = geo.getIndex();
    if (index) {
      const a = index.array as Uint16Array | Uint32Array;
      for (let i = 0; i < a.length; i += 3) {
        const t = a[i + 1];
        a[i + 1] = a[i + 2];
        a[i + 2] = t;
      }
      index.needsUpdate = true;
    }
    geo.computeVertexNormals();

    geo.computeBoundingBox();
    const bb = geo.boundingBox!;
    const size = new THREE.Vector3();
    bb.getSize(size);
    const centre = new THREE.Vector3();
    bb.getCenter(centre);
    geo.translate(-centre.x, -centre.y, -centre.z);
    geo.scale(MANTRA_WIDTH / size.x, MANTRA_WIDTH / size.x, 1);

    const merged = BufferGeometryUtils.mergeVertices(geo);
    merged.computeVertexNormals();
    merged.computeBoundingSphere();
    return merged;
  }, [data]);

  /** Soft warm halo sitting behind the letterforms — the Darshan glow. */
  const auraUniforms = useMemo(() => ({ uOpacity: { value: 0 } }), []);

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const dt = Math.min(delta, 1 / 30);
    const t = state.clock.elapsedTime;

    const z = timeline.reducedMotion
      ? READ_Z
      : timeline.live
        ? mantraZ(timeline.approach)
        : START_Z;
    g.position.z = damp(g.position.z, z, 14, dt);

    // Normalise size to the viewport so the mantra reads the same on a phone
    // in portrait as on a laptop. Recomputed every frame: it is two trig calls,
    // and it means rotating a device is handled for free.
    const cam = state.camera as THREE.PerspectiveCamera;
    const fit = fitScale(cam.fov, cam.aspect);
    g.scale.setScalar(damp(g.scale.x || fit, fit, 8, dt));

    const n = nearness(g.position.z);

    /* ----------------------------------------------------------------
     * ORIENTATION
     * ----------------------------------------------------------------
     * Angled while it is far away — a turned object announces that it has
     * depth, and the perspective on a yawed run of text is what tells you it
     * is a solid in space rather than a picture of one.
     *
     * But that same yaw is ruinous once it is large: the near end swells and
     * blows out while the far end shrinks into darkness, and the mantra stops
     * being readable. So the yaw is spent entirely on the approach and is gone
     * before the text reaches legible size. From there it is square to camera,
     * and the 3D reads from the bevels, the side walls and the travelling
     * highlights instead.
     * ---------------------------------------------------------------- */
    // Measured, not guessed: the mantra fits the frame and becomes readable
    // at nearness ~0.10-0.15 on any aspect (that is what FIT_Z encodes). The
    // turn therefore has to be fully spent by ~0.11, or it is still yawed 20
    // degrees at exactly the moment the viewer is trying to read it.
    const straighten = THREE.MathUtils.smoothstep(n, 0.012, 0.11);
    const turn = 1 - straighten;

    // A whisper of residual motion so "straight" never means "frozen".
    const breath = timeline.reducedMotion ? 0 : Math.sin(t * 0.4) * 0.012;

    const yaw = timeline.reducedMotion ? 0 : -0.5 * turn + breath;
    const pitch = timeline.reducedMotion ? 0 : 0.09 * turn + Math.cos(t * 0.31) * 0.006;

    g.rotation.y = damp(g.rotation.y, yaw, 5, dt);
    g.rotation.x = damp(g.rotation.x, pitch, 5, dt);

    /* ----------------------------------------------------------------
     * SHINE — see the SHINE plan in lib/timeline.ts.
     * Bright and loose far away; settled and crisp when readable.
     * ---------------------------------------------------------------- */
    if (material.current) {
      material.current.envMapIntensity = damp(
        material.current.envMapIntensity,
        shine(SHINE.envIntensity, n),
        4,
        dt,
      );
    }
    if (auraMat.current) {
      auraMat.current.uniforms.uOpacity.value = damp(
        auraMat.current.uniforms.uOpacity.value,
        shine(SHINE.aura, n) * timeline.reveal,
        4,
        dt,
      );
    }

    timeline.nearness = n;
    g.visible = timeline.reveal > 0.001;
  });

  return (
    <group ref={group} position={[0, 0, START_Z]}>
      {/* Aura: a warm plate behind the text. It gives the dark, unlit parts of
          the letterforms something to be dark *against* — without it, shadowed
          gold on a near-black field simply disappears and the word breaks up. */}
      <mesh position={[0, 0, -MANTRA_DEPTH * 2.5]} scale={[MANTRA_WIDTH * 1.25, MANTRA_WIDTH * 0.4, 1]}>
        <planeGeometry args={[1, 1]} />
        <shaderMaterial
          ref={auraMat}
          uniforms={auraUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          vertexShader={/* glsl */ `
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
          fragmentShader={/* glsl */ `
            uniform float uOpacity;
            varying vec2 vUv;
            void main() {
              vec2 p = (vUv - 0.5) * vec2(2.0, 2.4);
              float d = 1.0 - clamp(length(p), 0.0, 1.0);
              float a = pow(d, 2.6) * uOpacity;
              gl_FragColor = vec4(vec3(1.0, 0.72, 0.32) * a, a);
            }
          `}
        />
      </mesh>

      <mesh geometry={geometry}>
        <meshPhysicalMaterial
          ref={material}
          // A deeper, more saturated gold than a pale yellow: the mid-tones
          // need somewhere to sit between black shadow and cream highlight.
          color="#e6b45c"
          metalness={1}
          // Not mirror-smooth. A little roughness turns point highlights into
          // travelling streaks, which is what reads as polished metal on a
          // curved bevel.
          roughness={0.26}
          clearcoat={1}
          clearcoatRoughness={0.13}
          // The cool blue-steel tint along the edges. This is the detail that
          // separates one letterform from the next on a warm-on-warm field.
          // Enough to tint the silhouette edges cool; more than this and
          // the cool lights take over and the gold reads as blue steel.
          iridescence={0.16}
          iridescenceIOR={1.28}
          envMapIntensity={SHINE.envIntensity.far}
          // The camera flies *through* the letterforms; with front-face culling
          // the interior walls would be invisible at the most dramatic moment.
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

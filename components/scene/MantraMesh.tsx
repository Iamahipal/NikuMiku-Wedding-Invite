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
  START_Z,
  damp,
  mantraZ,
  timeline,
} from '@/lib/timeline';

/**
 * ॐ गं गणपतये नमः as genuine 3D geometry.
 *
 * The outlines come from `public/mantra.svg`, which was shaped once by real
 * HarfBuzz (see scripts/build-mantra.mjs). three's SVGLoader turns those into
 * filled Shapes, and ExtrudeGeometry gives them depth and — crucially —
 * bevels. The bevel is not decoration: it is the only surface angled to catch
 * a moving specular highlight, and that travelling highlight is what makes an
 * object read as polished metal rather than flat yellow plastic.
 */
export default function MantraMesh() {
  const group = useRef<THREE.Group>(null);
  const data = useLoader(SVGLoader, asset('/mantra.svg'));

  const geometry = useMemo(() => {
    const shapes: THREE.Shape[] = [];

    for (const path of data.paths) {
      // `createShapes` resolves counters (the holes inside ग, प, म …) into
      // Shape holes using the path's fill rule. Devanagari has plenty of them,
      // so this must not be replaced with a naive contour-to-shape loop.
      shapes.push(...SVGLoader.createShapes(path));
    }

    const geo = new THREE.ExtrudeGeometry(shapes, {
      depth: MANTRA_DEPTH,
      bevelEnabled: true,
      bevelThickness: 2.2,
      bevelSize: 1.6,
      bevelOffset: 0,
      bevelSegments: 3,
      curveSegments: 8, // enough for smooth strokes without exploding tri count
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
    } else {
      geo.setIndex(null);
    }

    geo.computeVertexNormals();

    // Normalise: centre on the origin and scale so the run is MANTRA_WIDTH
    // wide, so the world layout in lib/timeline.ts holds regardless of what
    // the SVG's own units happen to be.
    geo.computeBoundingBox();
    const bb = geo.boundingBox!;
    const size = new THREE.Vector3();
    bb.getSize(size);
    const centre = new THREE.Vector3();
    bb.getCenter(centre);

    geo.translate(-centre.x, -centre.y, -centre.z);
    geo.scale(MANTRA_WIDTH / size.x, MANTRA_WIDTH / size.x, 1);

    // One buffer, one draw call.
    const merged = BufferGeometryUtils.mergeVertices(geo);
    merged.computeVertexNormals();
    merged.computeBoundingSphere();
    return merged;
  }, [data]);

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const dt = Math.min(delta, 1 / 30);
    const t = state.clock.elapsedTime;

    // Reduced motion gets the title held at a readable distance instead of a
    // fly-through — the point of the scene is the mantra, and leaving it as an
    // unreadable speck in deep space would be an accessibility branch that
    // technically animates less while communicating nothing.
    const z = timeline.reducedMotion
      ? READ_Z
      : timeline.live
        ? mantraZ(timeline.approach)
        : START_Z;
    g.position.z = damp(g.position.z, z, 14, dt);

    // The highlight sweep. A slow yaw across the whole approach drags the
    // specular across every bevel; the tiny idle wobble keeps it alive if the
    // viewer never scrolls at all.
    const yaw = timeline.reducedMotion
      ? 0
      : -0.26 + timeline.approach * 0.4 + Math.sin(t * 0.35) * 0.02;
    const pitch = timeline.reducedMotion
      ? 0
      : 0.05 - timeline.approach * 0.08 + Math.cos(t * 0.28) * 0.015;
    g.rotation.y = damp(g.rotation.y, yaw, 6, dt);
    g.rotation.x = damp(g.rotation.x, pitch, 6, dt);

    g.visible = timeline.reveal > 0.001;
  });

  return (
    <group ref={group} position={[0, 0, START_Z]}>
      <mesh geometry={geometry} castShadow={false} receiveShadow={false}>
        <meshPhysicalMaterial
          color="#ffcf6e"
          metalness={1}
          roughness={0.16}
          clearcoat={0.35}
          clearcoatRoughness={0.22}
          envMapIntensity={1.8}
          // The camera flies *through* the letterforms; with front-face culling
          // the interior walls would be invisible and you would see straight
          // out the back of the mantra at the most dramatic moment.
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

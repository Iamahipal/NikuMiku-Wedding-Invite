'use client';

import { Environment, Lightformer } from '@react-three/drei';

/**
 * The lighting rig.
 *
 * A metal surface has no diffuse response — it shows you nothing but its
 * environment. So the "gold look" is almost entirely this file, not the
 * material file.
 *
 * The environment is built procedurally from Lightformers rather than loaded
 * from an HDRI. That is a deliberate call: drei's HDRI presets fetch several
 * megabytes from a CDN at runtime, which on a static GitHub Pages deploy means
 * a third-party dependency on the critical path of the opening shot. These
 * emissive rectangles cost nothing to download and are baked to a 256px cube
 * exactly once (`frames={1}`).
 */
export default function StudioEnv() {
  return (
    <>
      <Environment resolution={256} frames={1}>
        {/* Deep blue-black surround, so unlit facets read as royal rather than dead. */}
        <mesh scale={100}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshBasicMaterial color="#050b1e" side={1} />
        </mesh>

        {/* Key — broad and soft, from above-front. Fills the faces. */}
        <Lightformer
          form="rect"
          intensity={3.2}
          color="#fff3d6"
          position={[0, 8, 10]}
          rotation={[-Math.PI / 6, 0, 0]}
          scale={[24, 14, 1]}
        />

        {/* Rim — behind the mantra, separates its silhouette from the void. */}
        <Lightformer
          form="ring"
          intensity={5}
          color="#ffd27a"
          position={[0, 0, -18]}
          scale={[14, 14, 1]}
        />

        {/* Two rakers. These are the ones that matter: narrow vertical strips
            whose reflections slide across the bevels as the mantra yaws. */}
        <Lightformer
          form="rect"
          intensity={6}
          color="#ffffff"
          position={[-12, 2, 6]}
          rotation={[0, Math.PI / 2.4, 0]}
          scale={[16, 2.2, 1]}
        />
        <Lightformer
          form="rect"
          intensity={4.5}
          color="#ffdca8"
          position={[12, -2, 6]}
          rotation={[0, -Math.PI / 2.4, 0]}
          scale={[16, 1.6, 1]}
        />
      </Environment>

      {/* Punctual lights on top of the environment: these give the crisp,
          small specular hits that a purely image-based rig renders too soft. */}
      <directionalLight position={[6, 10, 8]} intensity={2.2} color="#fff6e2" />
      <directionalLight position={[-8, -4, 4]} intensity={0.9} color="#e8b24c" />
    </>
  );
}

'use client';

import { useRef } from 'react';
import { Environment, Lightformer } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import { timeline } from '@/lib/timeline';

/**
 * The lighting rig — and therefore about 80% of "does this look like gold".
 *
 * A metal has no diffuse response: it shows you nothing but its environment.
 * So the look is made here, not in the material.
 *
 * THE RULE THAT MATTERS: a metal only reads as metal if large parts of it are
 * DARK. A broad, evenly-bright environment lights every face to roughly the
 * same value, the tone mapper pushes all of it toward white, and the result is
 * a flat glowing blob with no form and no legibility. Reference gold — polished
 * rings, film titles — is roughly half deep shadow, with saturated mid-tones
 * and only narrow bright streaks.
 *
 * So this environment is mostly black, lit by a few very bright, very small
 * shapes. High dynamic range, low coverage.
 *
 * The second ingredient is a COOLER rim. Warm-only lighting gives warm-on-warm
 * mush with no edge separation between letterforms. But on a black-and-gold
 * palette that rim must stay near-neutral: an actually blue rim drags the whole
 * frame back toward navy, which is the one thing this scheme is avoiding. So
 * these are desaturated near-whites — cool *relative to* the gold, and read as
 * specular rather than as colour.
 */
export default function StudioEnv() {
  const key = useRef<THREE.DirectionalLight>(null);
  const rim = useRef<THREE.DirectionalLight>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    // The punctual lights orbit slowly and never stop. This is the single
    // biggest "alive" factor: highlights travel across the bevels continuously,
    // so the mantra breathes even when the viewer isn't scrolling at all.
    // (The Environment itself is baked once and cannot move — hence doing it
    // with punctual lights, which are free.)
    if (key.current) {
      key.current.position.set(
        Math.sin(t * 0.22) * 9 + 3,
        6 + Math.sin(t * 0.17) * 2.5,
        8 + Math.cos(t * 0.19) * 3,
      );
    }
    if (rim.current) {
      rim.current.position.set(
        Math.sin(t * 0.15 + 2.1) * -11,
        -3 + Math.cos(t * 0.21) * 2,
        -6 + Math.sin(t * 0.13) * 3,
      );
    }
  });

  return (
    <>
      <Environment resolution={256} frames={1}>
        {/* Dark *warm* surround, not black. The unlit regions of a gold surface
            are deep brown, not void — a black surround drains the colour out of
            the shadows and the whole thing turns to gunmetal. */}
        <mesh scale={100}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshBasicMaterial color="#1f1509" side={THREE.BackSide} />
        </mesh>

        {/* Broad warm field. The flat faces of the letterforms reflect a wide
            solid angle; this is what they pick up, and it is where the body
            colour of the gold actually comes from. */}
        <Lightformer
          form="rect"
          intensity={2.35}
          color="#ffb85e"
          position={[0, 2, 14]}
          scale={[26, 18, 1]}
        />

        {/* --- WARM: small and very bright. These make the streaks. --- */}
        <Lightformer
          form="rect"
          intensity={16}
          color="#fff0d0"
          position={[-9, 5, 8]}
          rotation={[0, Math.PI / 2.6, 0]}
          scale={[9, 1.1, 1]}
        />
        <Lightformer
          form="rect"
          intensity={10}
          color="#ffd08a"
          position={[10, -3, 6]}
          rotation={[0, -Math.PI / 2.6, 0]}
          scale={[8, 0.8, 1]}
        />
        <Lightformer
          form="circle"
          intensity={7}
          color="#ffe6b8"
          position={[0, 9, 4]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={[4, 4, 1]}
        />

        {/* --- NEUTRAL RIM: the edge separation. Without these the gold is
            warm-on-warm and the letterforms merge into one another. --- */}
        <Lightformer
          form="ring"
          intensity={2.6}
          color="#cfd6e0"
          position={[0, 0, -16]}
          scale={[13, 13, 1]}
        />
        <Lightformer
          form="rect"
          intensity={1.2}
          color="#b9bfc9"
          position={[-6, -7, -3]}
          rotation={[Math.PI / 3, 0, 0]}
          scale={[14, 5, 1]}
        />

        {/* Dim warm floor bounce, so the darks are rich rather than dead. */}
        <Lightformer
          form="rect"
          intensity={0.75}
          color="#8a5e12"
          position={[0, -9, 2]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[18, 10, 1]}
        />
      </Environment>

      {/* Punctual lights give the crisp small speculars that image-based
          lighting renders too soft — and unlike the baked environment, these
          can move. */}
      <directionalLight ref={key} intensity={2.4} color="#fff4dd" />
      <directionalLight ref={rim} intensity={0.6} color="#c8cedb" />
    </>
  );
}

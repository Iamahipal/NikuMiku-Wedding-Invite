/**
 * The bridge between the DOM/GSAP world and the WebGL world.
 *
 * This is deliberately a plain mutable module singleton — NOT React state and
 * NOT a context. ScrollTrigger writes into it 60+ times a second; if any of
 * these values lived in React, every scroll frame would re-render the tree and
 * tear down the canvas' animation loop. Instead:
 *
 *   ScrollTrigger.onUpdate  ->  writes `*Target` values here  (imperative)
 *   useFrame in R3F         ->  reads + damps toward them     (imperative)
 *
 * React only ever mounts the canvas once. Nothing below causes a render.
 */
export type ScrollState = {
  /** 0 -> 1 across the whole document. */
  progress: number;
  /** Distance travelled through the particle tube, in world units. */
  travel: number;
  travelTarget: number;
  /** Raw scroll velocity from ScrollTrigger, smoothed for the shader. */
  velocity: number;
  /** 0 -> 1 "hyperspace" amount, ramped during the horizontal section. */
  warp: number;
  warpTarget: number;
  /** Lateral push, so particles slide against the horizontal cards. */
  drift: number;
  driftTarget: number;
  /** Global glow multiplier — dimmed behind text-heavy scenes. */
  intensity: number;
  intensityTarget: number;
  /** Normalised pointer, for the parallax camera sway. */
  pointerX: number;
  pointerY: number;
  /** Set once from the media query; scenes degrade gracefully when true. */
  reducedMotion: boolean;
};

export const scrollState: ScrollState = {
  progress: 0,
  travel: 0,
  travelTarget: 0,
  velocity: 0,
  warp: 0,
  warpTarget: 0,
  drift: 0,
  driftTarget: 0,
  intensity: 1,
  intensityTarget: 1,
  pointerX: 0,
  pointerY: 0,
  reducedMotion: false,
};

/** How far the camera "flies" through the dust over the full page, in world units. */
export const TRAVEL_DISTANCE = 900;

/** Depth of the particle tube. Particles wrap within this, giving infinite travel. */
export const TUBE_DEPTH = 260;

/** Frame-rate independent damping (the classic exponential lerp). */
export function damp(current: number, target: number, lambda: number, dt: number) {
  return current + (target - current) * (1 - Math.exp(-lambda * dt));
}

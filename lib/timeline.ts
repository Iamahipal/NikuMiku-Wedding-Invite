/**
 * The bridge between GSAP/scroll and the WebGL render loop.
 *
 * A plain mutable singleton — deliberately NOT React state and NOT context.
 * Scroll writes into it dozens of times a second; if any of it lived in React,
 * every scroll frame would re-render the tree and tear down the canvas. So:
 *
 *     GSAP / ScrollTrigger  ──writes──▶  timeline  ──reads──▶  useFrame
 *
 * React renders the scene exactly once. Nothing below ever triggers a render.
 */
export type Timeline = {
  /** 0 → 1 across the autoplay big bang. Drives the spark, ring and burst. */
  bang: number;
  /** 0 → 1 → 0 white-out at the peak of the explosion. */
  flash: number;
  /** 0 → 1 as the mantra materialises out of the residual glow. */
  reveal: number;

  /** Raw scroll progress, 0 → 1 over the fly-through. */
  scroll: number;
  /** Damped `scroll` — the value the camera actually uses. */
  approach: number;
  /** Signed scroll velocity, for motion-blur-ish post effects. */
  velocity: number;

  /** Ambient dust travel, independent of scroll so the field is never frozen. */
  drift: number;

  /** Set once the autoplay finishes and scrolling is unlocked. */
  live: boolean;
  reducedMotion: boolean;
};

export const timeline: Timeline = {
  bang: 0,
  flash: 0,
  reveal: 0,
  scroll: 0,
  approach: 0,
  velocity: 0,
  drift: 0,
  live: false,
  reducedMotion: false,
};

/* ------------------------------------------------------------------ *
 * World layout
 *
 * The camera never moves on Z. The mantra travels toward it and past it,
 * which makes "fly through the letterforms" a single, easily-reasoned-about
 * number, and lets the dust tunnel stay camera-relative.
 * ------------------------------------------------------------------ */

/** Mantra width in world units. Everything else is sized relative to this. */
export const MANTRA_WIDTH = 100;
/** Extrusion depth — thick enough that the pass-through lasts a beat. */
export const MANTRA_DEPTH = 16;
/** Where the mantra is revealed: far enough to be a speck. */
export const START_Z = -1500;
/** Where the approach ends and the pass-through begins. */
export const PASS_Z = -22;
/** Behind the camera. */
export const END_Z = 34;
/** Fraction of scroll spent approaching, before the pass-through. */
export const APPROACH_SPAN = 0.85;
/** Where the mantra sits for reduced-motion viewers: legible, centred, still. */
export const READ_Z = -150;

/**
 * Map scroll progress to the mantra's Z.
 *
 * The approach interpolates in *reciprocal* Z, not linear Z. Apparent size
 * under perspective goes as 1/z, so lerping z directly would leave the mantra
 * looking motionless for the first half of the scroll and then explode in the
 * last few percent. Lerping 1/z instead gives a constant rate of apparent
 * growth — it reads as a steady, controlled approach the whole way in.
 */
export function mantraZ(t: number) {
  if (t <= APPROACH_SPAN) {
    // Reciprocal-Z alone grows apparent size at a constant rate, which spends
    // the first half of the scroll already large. The power curve biases the
    // early scroll toward staying small and far, so the arrival has somewhere
    // to build from and the last stretch genuinely rushes.
    const k = Math.pow(t / APPROACH_SPAN, 2.4);
    const inv = (1 - k) / -START_Z + k / -PASS_Z;
    return -1 / inv;
  }
  // Final beat: straight through the camera, fast.
  const k = (t - APPROACH_SPAN) / (1 - APPROACH_SPAN);
  return PASS_Z + (END_Z - PASS_Z) * k;
}

/** Frame-rate independent exponential damping. */
export function damp(current: number, target: number, lambda: number, dt: number) {
  return current + (target - current) * (1 - Math.exp(-lambda * dt));
}

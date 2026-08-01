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

  /** How large the mantra reads on screen, 0 (speck) → 1 (at the lens).
   *  Written by MantraMesh, read by PostRig to drive the shine curve. */
  nearness: number;

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
  nearness: 0,
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
 * Reference distance and screen coverage used to normalise the mantra's size
 * across viewport shapes.
 *
 * Without this the whole sequence is implicitly art-directed for one aspect
 * ratio. A phone in portrait has a far narrower horizontal field of view than a
 * laptop, so the same world-space geometry overflows the frame long before it
 * becomes readable — the text is cropped to two or three letters exactly when
 * the viewer is meant to be able to read it.
 */
export const FIT_Z = -140;
export const FIT_COVERAGE = 0.78;

/**
 * Scale that makes the mantra occupy the same fraction of the screen on any
 * device. Derived from the camera, so it is correct for every aspect ratio
 * rather than tuned for two breakpoints.
 */
export function fitScale(fovDeg: number, aspect: number) {
  const visibleH = 2 * Math.tan((fovDeg * Math.PI) / 360) * Math.abs(FIT_Z);
  const visibleW = visibleH * aspect;
  return (FIT_COVERAGE * visibleW) / MANTRA_WIDTH;
}

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

/**
 * How large the mantra currently reads on screen: 0 when it is a distant speck,
 * 1 when it is at the pass-through plane.
 *
 * Derived from apparent size (which goes as 1/z), NOT from scroll progress or
 * from z directly — those are dominated by the huge far distances and would
 * report "still tiny" long after it visibly fills half the frame. Every
 * look-development curve in the scene is driven off this.
 */
export function nearness(z: number) {
  const inv = 1 / Math.max(Math.abs(z), 1);
  const invStart = 1 / Math.abs(START_Z);
  const invEnd = 1 / Math.abs(PASS_Z);
  return Math.min(1, Math.max(0, (inv - invStart) / (invEnd - invStart)));
}

/**
 * THE SHINE PLAN
 * --------------
 * Far away the mantra should shine *more*: it is a distant jewel, and heavy
 * bloom is what sells a small bright object at distance. Close up the shine
 * must settle *down*: at readable size, glow is the enemy of legibility, and
 * blowing the faces to white destroys exactly the shading that makes the
 * letterforms look three-dimensional.
 *
 * So: glow high and loose when far, low and crisp when near. Everything below
 * interpolates on that single idea.
 */
export const SHINE = {
  /** Reflection strength — hotter far away, controlled close up. */
  envIntensity: { far: 3.4, near: 1.9 },
  /** Bloom amount. */
  bloom: { far: 1.7, near: 0.42 },
  /** Bloom cut-off: low when far (everything glows), high when near (only
   *  genuine speculars glow, so the mid-tones stay readable). */
  threshold: { far: 0.55, near: 0.9 },
  /** Aura behind the mantra. */
  aura: { far: 0.6, near: 0.05 },
};

export function shine(from: { far: number; near: number }, n: number) {
  return from.far + (from.near - from.far) * n;
}

/** Frame-rate independent exponential damping. */
export function damp(current: number, target: number, lambda: number, dt: number) {
  return current + (target - current) * (1 - Math.exp(-lambda * dt));
}

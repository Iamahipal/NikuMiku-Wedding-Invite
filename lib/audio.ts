/**
 * THE SOUND — a temple bell and a drone, synthesised.
 *
 * Nothing is downloaded. Every sound here is generated with Web Audio from
 * oscillators and a noise burst, which means: no audio asset on the critical
 * path, no licensing question over a recording, and every parameter is
 * tunable in this file rather than baked into a file someone has to re-render.
 *
 * A real recorded chant would carry more feeling than synthesis can. If you
 * have one you have the rights to, drop it in `public/` and see `playSample()`
 * at the bottom — the trigger points stay exactly the same.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * THE AUTOPLAY CONSTRAINT (not a design choice — a browser rule)
 * ─────────────────────────────────────────────────────────────────────────
 * Browsers refuse to start audio until the user has interacted with the page,
 * and a mouse-wheel scroll does NOT count as interaction. So sound can never
 * simply play on load alongside the big bang.
 *
 * Rather than fight that, the unlock *is* the moment: the first time audio is
 * enabled, the bell strikes right then. Enabling sound rings the bell, which
 * makes the restriction feel like an intention.
 */

type Engine = {
  ctx: AudioContext;
  master: GainNode;
  wet: GainNode;
  droneGain: GainNode;
  droneNodes: OscillatorNode[];
};

let engine: Engine | null = null;
let enabled = false;
let listeners: Array<(on: boolean) => void> = [];

/** Sa — the tonic everything is tuned to. D3, a common tanpura root. */
const SA = 146.83;

function build(): Engine | null {
  const Ctor =
    typeof window !== 'undefined'
      ? window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      : undefined;
  if (!Ctor) return null;

  const ctx = new Ctor();

  const master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);

  // A feedback delay standing in for reverb. A convolver would need an impulse
  // response file, which would defeat the point of shipping no audio assets;
  // at these decay times the difference is not audible.
  const wet = ctx.createGain();
  wet.gain.value = 0.32;
  const delay = ctx.createDelay(1.5);
  delay.delayTime.value = 0.26;
  const feedback = ctx.createGain();
  feedback.gain.value = 0.42;
  const damp = ctx.createBiquadFilter();
  damp.type = 'lowpass';
  damp.frequency.value = 2200;

  wet.connect(delay);
  delay.connect(damp);
  damp.connect(feedback);
  feedback.connect(delay);
  damp.connect(master);

  // ---- Drone: the room tone. Sa, its fifth, and an octave, slightly detuned
  // against each other so the sound slowly breathes instead of sitting still.
  const droneGain = ctx.createGain();
  droneGain.gain.value = 0;
  const droneFilter = ctx.createBiquadFilter();
  droneFilter.type = 'lowpass';
  droneFilter.frequency.value = 900;
  droneGain.connect(droneFilter);
  droneFilter.connect(master);
  droneFilter.connect(wet);

  const droneNodes: OscillatorNode[] = [];
  for (const [freq, level, detune] of [
    [SA, 0.5, 0],
    [SA, 0.28, 5],
    [SA * 1.5, 0.22, -4],
    [SA * 2, 0.16, 3],
  ] as const) {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.detune.value = detune;
    const g = ctx.createGain();
    g.gain.value = level;

    // Slow amplitude drift per partial — this is what stops a sustained drone
    // sounding like a test tone.
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.05 + Math.random() * 0.07;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = level * 0.35;
    lfo.connect(lfoGain);
    lfoGain.connect(g.gain);
    lfo.start();

    osc.connect(g);
    g.connect(droneGain);
    osc.start();
    droneNodes.push(osc);
  }

  return { ctx, master, wet, droneGain, droneNodes };
}

/**
 * Strike a bell.
 *
 * Bells are inharmonic — their partials are not integer multiples, which is
 * exactly why a bell sounds like a bell and a stack of harmonics sounds like an
 * organ. These ratios are the classic bell set (hum, prime, tierce, quint,
 * nominal and above), each with its own decay so the high partials die away
 * first and the hum tone rings on underneath.
 */
export function bell(baseFreq = 523.25, level = 0.5, decay = 1) {
  if (!engine || !enabled) return;
  const { ctx, master, wet } = engine;
  const t = ctx.currentTime;

  const partials: Array<[ratio: number, amp: number, dec: number]> = [
    [0.5, 0.55, 5.5],
    [1.0, 1.0, 4.2],
    [1.19, 0.4, 3.0],
    [1.5, 0.32, 2.4],
    [2.0, 0.5, 1.8],
    [2.72, 0.26, 1.2],
    [3.76, 0.16, 0.8],
    [5.07, 0.1, 0.5],
  ];

  for (const [ratio, amp, dec] of partials) {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = baseFreq * ratio;
    // A touch of detune so repeated strikes are never identical.
    osc.detune.value = (Math.random() - 0.5) * 6;

    const g = ctx.createGain();
    const peak = amp * level * 0.22;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dec * decay);

    osc.connect(g);
    g.connect(master);
    g.connect(wet);
    osc.start(t);
    osc.stop(t + dec * decay + 0.1);
  }

  // The strike itself: a very short filtered noise burst. Without it the bell
  // fades in politely instead of being hit.
  const noiseLen = 0.05;
  const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * noiseLen), ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  }
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = baseFreq * 2.2;
  bp.Q.value = 1.1;
  const ng = ctx.createGain();
  ng.gain.value = level * 0.09;
  src.connect(bp);
  bp.connect(ng);
  ng.connect(master);
  ng.connect(wet);
  src.start(t);
}

/** A soft rising shimmer — used as the mantra sweeps past the camera. */
export function swell(level = 0.35) {
  if (!engine || !enabled) return;
  const { ctx, master, wet } = engine;
  const t = ctx.currentTime;

  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(SA * 2, t);
  osc.frequency.exponentialRampToValueAtTime(SA * 4, t + 1.6);

  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(level * 0.12, t + 0.5);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 2.2);

  osc.connect(g);
  g.connect(master);
  g.connect(wet);
  osc.start(t);
  osc.stop(t + 2.3);
}

/** Fade the drone in or out. */
export function drone(on: boolean, level = 0.14) {
  if (!engine) return;
  const { ctx, droneGain } = engine;
  droneGain.gain.cancelScheduledValues(ctx.currentTime);
  droneGain.gain.setTargetAtTime(on ? level : 0, ctx.currentTime, on ? 2.2 : 0.8);
}

export function isEnabled() {
  return enabled;
}

export function onChange(fn: (on: boolean) => void) {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter((l) => l !== fn);
  };
}

/**
 * Turn sound on or off. Must be called from inside a real user gesture the
 * first time — that is the browser's rule, not ours.
 */
export async function setEnabled(on: boolean) {
  if (on) {
    if (!engine) engine = build();
    if (!engine) return;
    // Safari in particular will leave a freshly built context suspended.
    if (engine.ctx.state === 'suspended') await engine.ctx.resume();
    enabled = true;
    engine.master.gain.cancelScheduledValues(engine.ctx.currentTime);
    engine.master.gain.setTargetAtTime(0.9, engine.ctx.currentTime, 0.4);
  } else if (engine) {
    enabled = false;
    engine.master.gain.cancelScheduledValues(engine.ctx.currentTime);
    engine.master.gain.setTargetAtTime(0, engine.ctx.currentTime, 0.25);
  }
  listeners.forEach((l) => l(enabled));
}

/** Suspend while the tab is hidden — nobody wants a drone from a background tab. */
export function bindVisibility() {
  const onVis = () => {
    if (!engine) return;
    if (document.hidden) engine.ctx.suspend();
    else if (enabled) engine.ctx.resume();
  };
  document.addEventListener('visibilitychange', onVis);
  return () => document.removeEventListener('visibilitychange', onVis);
}

/*
 * ── Using a real recording instead ──────────────────────────────────────
 * Put the file in `public/` and swap the calls in Sequence.tsx:
 *
 *   const el = new Audio(asset('/mantra.mp3'));
 *   el.volume = 0.8;
 *   el.play();               // still only after a user gesture
 *
 * Keep the same trigger points and the toggle keeps working unchanged.
 */

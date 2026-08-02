<!--
  A self-contained brief for rebuilding this invitation from zero.

  Paste the whole of this file into a fresh AI coding session, or hand it to a
  developer. It assumes no knowledge of the current repository.

  Part 6 is the part that matters most: every trap listed there was paid for with
  real iteration during the first build. A brief that only described the visuals
  would let the next build rediscover all of them.
-->

# BRIEF: "Panch Mahabhuta" — a cinematic scroll wedding invitation

Build a scroll-driven digital wedding invitation as a **single continuous WebGL
film**. Not a page with animations on it — a film that the viewer scrubs with their
scroll wheel.

Benchmarks for feel: `landonorris.com`, `shopify.com/editions`, Lusion, Locomotive.
Benchmark for *material*: a polished gold ring turning under studio light.

**Build the visuals first.** Real dates, venues, names and RSVP copy arrive later —
put obvious placeholders in one config file and make every scene read from it. Do not
let missing copy block the look.

---

## PART 1 — The concept

The film is structured on the **पञ्च महाभूत (Panch Mahabhuta)** — the five great
elements from which, in Vedic cosmology, all creation is made. A wedding is a
creation. So the invitation *is* a creation myth: the viewer scrolls from nothing,
through the five elements in their traditional order of subtlety, and arrives at a
union.

This is the reason the film is beautiful rather than decorative. Every act has a
different physical element, therefore a different rendering technique, therefore a
completely different image. The scroll never repeats itself.

```
शून्य Shunya      the void            — nothing, then a single point
आकाश  Akasha      ether / space       — cosmos, nakshatras, the muhurat
वायु   Vayu        air                 — silk, breath, petals on wind
अग्नि  Agni        fire                — the sacred fire, the seven steps
जल    Jal         water               — kalash, lotus, stillness
पृथ्वी  Prithvi     earth               — gold made solid, the mandap
गठबंधन Gathbandhan the knot            — two forms interlock. The union.
```

Tone: **Vedic and traditional in substance, royal in material, modern and cinematic
in execution.** The symbols are real and used correctly. The rendering is 2026.
Never kitsch, never a "template wedding site", never clip-art Ganesha.

---

## PART 2 — Art direction

**Palette: black and gold. No navy, no blue cast anywhere.**

- The void is a *warm* black — a low gold-brown haze, never flat #000. Flat black
  gives the tone mapper nothing at the edges and the corners read as dead patches.
- Gold spans the full range: near-black brown in shadow, saturated orange in the
  mid-tones, cream in the highlights. **Roughly half of any gold surface should be
  dark.** That is what makes metal look like metal.
- Rim lights that separate one form from another must be **near-neutral whites**, not
  blue. They read as cool relative to the gold without dragging the frame toward navy.
- Each act may shift *temperature* within the gold family — Vayu warmer and rosier,
  Agni hottest, Jal cooler and calmer. **Jal must get its contrast from value, not
  from hue.** Do not let the water act drift blue; it is the easiest place to lose the
  palette.

**Typography**
- Devanagari for all Sanskrit — this is the voice of the piece.
- An elegant high-contrast serif for English (Cormorant Garamond, Marcellus, or
  similar). A clean sans only for small UI.
- Sanskrit is never decoration. Every shloka used must be correct and correctly
  transliterated. If unsure of a text, use one of the ones given in Part 3.

**Camera**
- Long lenses, slow moves, real weight. The camera has mass.
- Every act should have one held moment where nothing moves but light.

---

## PART 3 — The film, act by act

### Prologue · शून्य Shunya → the invocation

Black. Held longer than is comfortable. A single point of light ignites dead centre,
flickers like a match catching, then **detonates past the camera** and swallows the
frame in white.

Out of the residual glow, in real extruded 3D gold: **ॐ गं गणपतये नमः**

*(Om Gam Ganapataye Namah — invoking Ganesha, remover of obstacles. Every Hindu
ceremony begins here, so the film does too.)*

Scroll then drives the mantra from a distant speck until it fills the frame and the
camera flies **through** the letterforms — gold interior walls whipping past.

Technique: extruded bevelled geometry, high-contrast studio environment, bloom.
See Part 5 for how to get Devanagari into 3D at all — it is not obvious.

### Act I · आकाश Akasha — ether

Through the letterforms and out into deep space. A field of stars resolves into the
**27 nakshatras** (lunar mansions) — constellation lines drawing themselves between
points. Two stars, the couple's birth nakshatras, drift across the sky and align.
The **शुभ मुहूर्त** — the auspicious moment — is an astronomical event, so show it as one.

Technique: GPU particle starfield with real parallax depth; constellation lines drawn
with animated dash offsets; slow camera dolly. Subtle, vast, quiet.

### Act II · वायु Vayu — air

A red-gold **chunni / dupatta** sweeps across the frame, filling it, then lifting
away. Marigold petals ride the same current. This act is about breath and the space
between two people.

Technique: GPU cloth simulation (verlet on a texture) or a vertex-displaced ribbon
driven by **curl noise** — curl noise is what makes wind look like wind instead of
drift. Thousands of instanced petals advected by the same field, so cloth and petals
share one wind.

### Act III · अग्नि Agni — fire  ← the emotional apex

The **sacred fire**. The camera circles it (pradakshina). As it circles, the
**सप्तपदी** — seven steps — resolve one at a time, each vow appearing in Sanskrit as
that step is taken. Seven rotations, seven vows, one fire.

The seven steps, in traditional order. These are the **themes** of the seven vows —
each is the single Sanskrit word the step is named for, which is safe to display:

```
१  अन्न      anna      nourishment and sustenance
२  बल       bala      strength, in body and in spirit
३  धन       dhana     prosperity, honourably earned
४  सुख       sukha     happiness and harmony
५  प्रजा      prajā     family, and its continuation
६  ऋतु       ṛtu       health through every season
७  सख्य      sakhya    friendship — the vow the other six rest on
```

> **Do not invent or paraphrase the full Saptapadi mantras.** The complete verses are
> liturgical text and vary by tradition, region and family. Display the seven words
> above (or English glosses), and if the family wants the full Sanskrit, get the exact
> text from their pandit and paste it in verbatim. Displaying approximated scripture at
> a real wedding is worse than displaying none.

Technique: volumetric flame — raymarched SDF with domain-warped noise, or a stacked
billboard flame if raymarching is too costly on mobile. GPU embers rising on
buoyancy. Heat-shimmer as a screen-space UV distortion post pass. This act carries the
heaviest bloom in the film.

### Act IV · जल Jal — water

Sudden stillness after the fire. A **kalash** (the sacred pot, coconut and mango
leaves at its mouth), a lotus, and a **diya** floating on black water that reflects
the gold above it.

Technique: planar reflection, a transmissive/refractive material for the water
surface, animated ripple normals, caustics on the vessel. Almost no camera movement —
the contrast with Agni *is* the effect.

### Act V · पृथ्वी Prithvi — earth

Gold becomes solid. The **मण्डप** assembles itself out of the dark — four pillars,
the toran across the top. **Mehndi** patterns draw themselves across the floor in a
single continuous line. A rangoli blooms outward in radial symmetry.

The couple's names are revealed here, in the same gold as the mantra — the film's
visual rhyme, opening and closing on the same material.

Technique: instanced architecture; mehndi as animated SVG path draw-on (offset a
dash pattern along the path, or a signed-distance line shader); rangoli generated
procedurally with n-fold radial symmetry.

### Finale · गठबंधन Gathbandhan — the knot

Two golden forms — rings, or two garlands (**वरमाला**) — rotate on independent axes
and **interlock**. Highlights sweep along their curvature as they turn. Hold.

This is where the invitation proper begins: dates, venues, events, RSVP. Build the
layout with placeholder copy from the config file. Simple vertical scroll over the
same gold field. After the film, the information should feel like a calm exhale.

---

## PART 4 — Technical architecture

**Stack**
- Next.js (App Router) + React 19 + TypeScript
- three.js + React Three Fiber + drei
- `@react-three/postprocessing`
- GSAP + ScrollTrigger (SplitText is free in GSAP 3.13+)
- Lenis for inertia scrolling
- Tailwind v4
- Static export (`output: 'export'`) — this is a static film, no server needed

**Renderer decision, and it is deliberate:** build on **WebGL2**. three's
`WebGPURenderer` does auto-fall-back to WebGL2 and TSL compiles to both WGSL and
GLSL, but `@react-three/postprocessing` and much of drei are WebGL-oriented, so going
WebGPU-first means rebuilding the entire post chain on three's node system. Wedding
guests open invitations on old phones. **Keep every shader in a separate module with
its uniforms declared in one place**, so a TSL port later is mechanical rather than
a rewrite.

**The one architectural rule — do not compromise it:**

> **React renders the scene once. Scroll never touches React state.**

```
ScrollTrigger ──writes──▶ a plain mutable singleton ──reads──▶ useFrame
```

Scroll fires dozens of times a second. If any of it lives in React state, every scroll
frame re-renders the tree and the canvas stutters. Put scroll progress, per-act
progress and every derived look value in one mutable module object. GSAP writes it,
`useFrame` reads and damps toward it. No `setState` anywhere in the scroll path.

**Lenis ⇄ GSAP — three details do most of the "feel":**
1. `autoRaf: false`, and tick Lenis from `gsap.ticker`. One clock, so scroll
   interpolation and every ScrollTrigger resolve in the same frame. Two loops gives a
   frame of lag between DOM and WebGL that reads as cheap.
2. `gsap.ticker.lagSmoothing(0)` — a heavy frame must not rewind GSAP's clock; that
   surfaces as a visible hitch on a scrubbed sequence.
3. `lenis.on('scroll', ScrollTrigger.update)` — no `scrollerProxy` needed, Lenis moves
   the real window scroll position.

**Structure**
```
app/layout.tsx          one fixed <canvas>, mounted once, never unmounted
components/
  Stage.tsx             <Canvas> + EffectComposer
  Film.tsx              the whole shot list — every ScrollTrigger, in scene order
  acts/                 one component per act
  scene/                CameraRig, lighting rigs, shared shaders
lib/
  film.ts               the GSAP ⇄ WebGL bridge, world layout, per-act curves
  content.ts            ALL copy — names, dates, venues, shlokas. One file.
```

Author every ScrollTrigger in `Film.tsx` in scene order so the choreography reads
like a shot list. Acts stay dumb: markup and meshes with `data-*` hooks, no timing
logic inside them. Re-time the film without touching the visuals; re-art-direct the
visuals without touching the timing.

**Performance budget**
- One canvas. Never unmount it, never re-render it.
- Cap DPR at mount (~1.75). Do **not** drive DPR from React state (see Part 6).
- Instance everything repeated. Merge static geometry.
- Each act should load and dispose its heavy resources as the film enters and leaves it.
- Target 60fps on a mid-range phone. Measure triangles and draw calls — those numbers
  are hardware-independent; frame timings on a dev machine are not.

---

## PART 5 — Devanagari in 3D (read before writing any text code)

**No off-the-shelf three.js path can render Devanagari.** `TextGeometry` +
`FontLoader` and `troika-three-text` both map characters to glyphs 1:1. Devanagari
requires *complex shaping*: conjunct formation, matra reordering, and the shirorekha
(the headline bar joining letters). Feed either "ॐ गं गणपतये नमः" and you get mangled,
wrong text. This is not a tuning problem — it is structural.

Do this instead:

```
build script, run once, output committed
   an OFL Devanagari font (e.g. Tiro Devanagari Hindi)
        │  harfbuzzjs (WASM HarfBuzz) → correct glyph IDs, offsets, advances
        │  font.glyphToPath()         → outlines  (no second library needed)
        ▼
   public/<name>.svg                   committed vectors
        │  SVGLoader.createShapes()    resolves counters into Shape holes
        ▼
   ExtrudeGeometry with bevels
```

Consequences, both good: **no Devanagari webfont ships at all** (the font-loading race
disappears with it), and the text can never re-shape differently on someone else's
machine.

**Verify before building anything on top of it:** render the same string in a browser
with the real webfont, screenshot it, and compare glyph-for-glyph against a flat
render of the generated SVG. Wrong shaping in a script you cannot proofread is a
silent disaster. Gate the 3D work on this passing.

Two geometry details that will bite:
- SVG is Y-down, three is Y-up. Mirroring on Y **reverses triangle winding** — flip
  the index order back before computing normals, or every normal points into the
  solid and the text lights as though inside-out.
- Use `DoubleSide` on anything the camera flies through, or you will see straight out
  the back of it at the most dramatic moment.

---

## PART 6 — Traps. Every one of these cost real iteration.

**Material and light**

1. **A metal only reads as metal if large parts of it are dark.** A broad,
   evenly-bright environment lights every face to the same value and you get a flat
   glowing blob with no form and no legibility. Build environments from a few *very
   bright, very small* shapes against a dark surround — high dynamic range, low
   coverage.
2. **But the surround must be dark *warm*, not black.** A black surround drains the
   colour out of the shadows and the gold turns to gunmetal.
3. **Use `AgXToneMapping` or `NeutralToneMapping`, not ACES, for gold.** ACES
   desaturates blown highlights hard toward white — gold stops being gold at exactly
   the moment it gets bright. AgX holds hue far better into the highlights. (Both are
   in three ≥ r162.) This single line is worth more than any amount of material tweaking.
4. **Keep the bloom threshold high (~0.7+).** Low thresholds bloom everything and the
   scene becomes a monochrome starfield.
5. Most of "does this look like gold" lives in the **lighting rig**, not the material.
   Metal has no diffuse response — it shows you nothing but its environment.
6. Build environments from `<Lightformer>`s baked once (`frames={1}`), not an HDRI —
   drei's presets fetch megabytes from a CDN onto the critical path of the opening.
7. **Move the punctual lights continuously.** A slow orbit means highlights travel
   across the bevels forever. This is the single biggest "alive" factor, and it is free.

**Motion and framing**

8. **Interpolate depth in reciprocal Z, not linear Z.** Apparent size goes as 1/z, so
   lerping z directly leaves an approaching object apparently motionless for half the
   scroll and then exploding in the last few percent.
9. **Normalise object scale to the camera's FOV and aspect.** Otherwise the film is
   implicitly art-directed for one screen shape: a phone in portrait has a far
   narrower horizontal FOV, and text that fits on a laptop gets cropped to three
   letters on a phone at exactly the moment it should be readable.
10. **Any yaw on approaching text must be fully spent *before* it reaches readable
    size.** A turned object announces depth while distant, but at size the near end
    swells and blows out while the far end shrinks into darkness. Measure where it
    becomes legible; do not guess the threshold.
11. **Plan the shine as an explicit curve.** Far away: bright, loose, heavy bloom — a
    distant object needs it to read as a jewel. Close up: settle it down — at readable
    size glow is the enemy of legibility and destroys the shading that makes a form
    look solid. Drive it from *apparent size*, not scroll progress.
12. **Chromatic aberration must be zero at rest.** Even a sub-pixel offset resamples
    1px particles across channels and speckles the whole field magenta and green. It
    is a motion cue; let it exist only in motion.
13. **No vignette.** It crushes all four corners and reads as four dark patches
    rather than as space. Let the backdrop gradient do it, gently.

**React, and things that crash**

14. **Never re-render the `<Canvas>` subtree.** drei's `PerformanceMonitor` drives DPR
    through React state; re-rendering mid-mount races the `Environment` portal and
    loader Suspense boundaries and crashes the scene *intermittently*. Cap DPR at
    mount instead.
15. **Anything animated in from nothing must start hidden in CSS**, not only in the
    timeline. Between first paint and hydration there is no GSAP, and un-animated
    elements flash at full opacity.
16. **A `yoyo` tween returns to whatever value it captured on its first render.** Start
    yoyo tweens *after* whatever establishes their baseline, or they strand the target
    at a partial value forever.
17. **`background-clip: text` gradients and SplitText are mutually exclusive.**
    Splitting moves glyphs into child spans that own no background, and transparent
    fill over no background renders literally nothing. Reveal gradient-filled text as
    masked whole lines instead.

**Verification — how to not fool yourself**

18. **Expose the master timeline and scrub it.** A 3-second opening cannot be sampled
    on a wall clock: under a software renderer a screenshot costs longer than a beat,
    and you will silently photograph either side of the explosion and conclude it
    never happened. Scrub to exact progress values like a video.
19. **`canvas.toBlob()` on a WebGL canvas returns blank** without
    `preserveDrawingBuffer`. Do not build a pixel-measurement harness on it and then
    trust the zeros it reports.
20. **Test in portrait at ~390px wide from the very first look pass**, not at the end.
    Framing bugs are invisible on a wide desktop viewport.
21. Verify triangle and draw-call counts rather than frame timings when the dev
    environment renders in software.

**Accessibility and delivery**

22. **`prefers-reduced-motion` is a first-class branch, not a switch that freezes
    things.** Skip the camera moves — but still *present* the content. A reduced-motion
    path that leaves the title as an unreadable speck in deep space animates less
    while communicating nothing.
23. **Browsers refuse to start audio until a user gesture, and a wheel scroll does not
    count.** Sound cannot simply play with the opening. Make the unlock *be* the
    moment — striking the bell the instant sound is enabled turns the restriction into
    an intention. Show the control from the first frame: a page that can make noise
    should say so before it makes any.
24. If deploying to a GitHub **project** page, the site is served from `/<repo>/`.
    Next rewrites its own URLs but not yours — route every `public/` asset you fetch
    yourself through a `basePath` helper, or it works locally and 404s in production.

---

## PART 7 — Sound (optional, build last)

A temple bell on the invocation, a low tanpura-style drone underneath, a shimmer as
forms pass the camera. Synthesise it with Web Audio rather than shipping files:
nothing on the critical path and no licensing question. **Bells are inharmonic** —
their partials are not integer multiples, which is exactly why a bell sounds like a
bell and stacked harmonics sound like an organ. Use the classic bell ratios, give each
partial its own decay so the highs die first and the hum rings on underneath, and add
a short filtered noise burst for the strike itself.

If a real recording is available and licensed, prefer it — a human voice carries what
synthesis cannot. Keep the trigger points identical either way.

---

## PART 8 — Order of work

1. Scaffold: canvas, Lenis⇄GSAP, the mutable bridge, static export, deploy pipeline.
   **Get a deployed URL working on day one** — this must be judged on a real phone,
   not a dev machine.
2. The Devanagari pipeline and its verification gate.
3. Prologue and the invocation. Lock the gold look here; every later act inherits it.
4. One act at a time, in film order. Deploy after each.
5. Gathbandhan and the invitation layout with placeholder copy.
6. Sound.
7. Real content into `lib/content.ts`.

**After each act: check it in portrait on a phone, check reduced motion, and confirm
the console is clean.** Do not batch this to the end.

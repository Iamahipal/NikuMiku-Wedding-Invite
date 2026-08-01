# The Overture — ॐ गं गणपतये नमः in 3D gold

A cinematic opening title: a golden spark ignites in the void, detonates past the
camera, and the Ganesh mantra arrives out of the light — as **real extruded gold
geometry** — then rushes forward until the camera flies straight through the
letterforms.

**Live:** https://iamahipal.github.io/NikuMiku-Wedding-Invite/

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # static export -> ./out
npm run preview    # serve the built export
npm run typecheck
```

> This is deliberately the *only* thing the site does right now. The rest of the
> invitation will be rebuilt around this opening once the look is signed off.

---

## The hard part: Devanagari as 3D text

**No off-the-shelf three.js path can render Devanagari.** `TextGeometry` +
`FontLoader` and troika-three-text both map characters to glyphs 1:1, but Devanagari
needs *complex shaping* — conjunct formation, matra reordering, and the shirorekha
headline bar. Feed either "ॐ गं गणपतये नमः" and you get mangled text.

So shaping happens once, offline, with real HarfBuzz:

```
scripts/build-mantra.mjs           # run by hand; output is committed
   Tiro Devanagari Hindi (OFL)
        │  harfbuzzjs (WASM HarfBuzz)  → correct glyph IDs, offsets, advances
        │  font.glyphToPath()          → outlines
        ▼
   public/mantra.svg                   # vectors — no font needed to render
        │  SVGLoader.createShapes()
        ▼
   ExtrudeGeometry (bevelled)          # 24k triangles, one draw call
```

Two consequences worth knowing:

1. **No Devanagari webfont ships at all.** The font-loading race disappears with it.
2. The text can never re-shape differently on someone else's machine. What was
   verified is exactly what ships.

Regenerate with `node scripts/build-mantra.mjs`. **Verify any change to the mantra
by rendering the same string in a browser with the real webfont and comparing
glyph-for-glyph** — wrong shaping is not something you can eyeball from the code.

---

## Architecture

**React renders this page once.** Scroll drives GSAP, GSAP writes numbers into a
mutable singleton, and the render loop reads them in `useFrame`. Nothing in the
scroll path calls `setState`.

```
app/layout.tsx        Stage (fixed canvas, mounted once) + SmoothScroll
components/
  Stage.tsx           <Canvas> + EffectComposer
  Sequence.tsx        the whole shot list: autoplay beats + ScrollTrigger
  scene/
    MantraMesh.tsx    mantra.svg → bevelled gold
    BigBang.tsx       spark, shockwave, ember burst
    DustField.tsx     infinite-wrap golden dust (one draw call)
    Backdrop.tsx      royal blue gradient void
    StudioEnv.tsx     procedural Lightformer rig — no HDRI download
    CameraRig.tsx     the only place targets become motion
    PostRig.tsx       per-frame effect modulation
lib/timeline.ts       the GSAP ⇄ WebGL bridge, and the world layout
```

`lib/timeline.ts` also owns `mantraZ(t)`, which maps scroll to depth. It
interpolates in **reciprocal Z** with a power bias: apparent size under perspective
goes as 1/z, so lerping z directly leaves the mantra apparently motionless for half
the scroll and then exploding in the last few percent.

---

## Beats

| Beat | Driven by | What happens |
| --- | --- | --- |
| Void | autoplay | Black. Fonts/geometry settle behind it, silently — no counter. |
| Ignition | autoplay | A point of light finds itself and flickers, like a match catching. |
| Big bang | autoplay | The core scales *past the camera* and swallows the frame; shockwave and 1800 embers go with it. The white-out is a real over-exposed light source, not a DOM overlay. |
| Reveal | autoplay | The mantra materialises out of the residual glow, far away. Overlaps the explosion's tail on purpose — it should emerge *from* the light. |
| Approach | **scroll** | It grows from a speck. A slow yaw drags specular highlights across every bevel — that travelling highlight is what makes it read as metal instead of flat yellow plastic. |
| Pass-through | **scroll** | The camera flies through the letterforms; gold interior walls whip past. |

---

## The shine plan, and why it goes *down* as it approaches

Codified in `SHINE` (`lib/timeline.ts`) and driven by `nearness()` — a 0→1 measure
of how large the mantra reads on screen, derived from apparent size (which goes as
1/z), not from scroll progress.

**Far away it shines more; close up the shine settles.** A distant speck needs heavy
bloom to read as a jewel. At readable size glow becomes the enemy: it blows the
faces to white and destroys the very shading that makes the letterforms look solid.
So reflections, bloom amount and the bloom cut-off all interpolate on that one idea,
and the aura behind the text fades out as it arrives.

## Orientation: turned when far, square when readable

The mantra is yawed while distant — a turned object announces that it has depth.
But that same yaw is ruinous at size: the near end swells and blows out while the
far end shrinks into darkness, and the word stops being readable. The turn is
therefore fully spent by `nearness ≈ 0.11`, which is where the text becomes legible.
From there it is square to camera and the 3D reads from bevels, side walls and
travelling highlights instead.

## Framing is normalised to the viewport

`fitScale()` sizes the mantra from the camera's own FOV and aspect so it occupies the
same fraction of the screen on any device. Without it the sequence is implicitly
art-directed for one aspect ratio: a phone in portrait has a far narrower horizontal
field of view, so the same geometry overflows the frame long before it is readable —
the text gets cropped to two or three letters at exactly the moment you are meant to
read it.

## Look development notes

Most of the "gold" is `StudioEnv.tsx`, not the material — metal has no diffuse
response, so it shows you nothing but its environment. The rig is built from
`<Lightformer>` rectangles baked once to a 256px cube, rather than an HDRI: drei's
presets fetch megabytes from a CDN, which is a third-party dependency on the
critical path of the opening shot.

**A metal only reads as metal if large parts of it are dark.** A broad, evenly-bright
environment lights every face to the same value, the tone mapper pushes it toward
white, and you get a flat glowing blob. Reference gold is roughly half deep shadow.
But the surround must be dark *warm*, not black — a black surround drains the colour
out of the shadows and the whole thing turns to gunmetal.

**Cool light is what separates the letterforms.** Warm-only lighting gives
warm-on-warm mush. A blue rim behind, a cool side fill, and a little `iridescence`
push the silhouette edges toward steel-blue, which gives the gold something to be
warm against.

Three more settings tuned the hard way, and why:

- **Bloom threshold sits high (0.72).** Lower, and ACES tone mapping desaturates
  every blown pixel toward white — the scene stops reading as gold and becomes a
  monochrome starfield.
- **No vignette.** One was crushing all four corners to near-black, which reads as
  four dark patches rather than as space. The backdrop's own falloff does the job
  more gently — but it must stay gentle, or the corners crush anyway.
- **Chromatic aberration is zero at rest.** Even a sub-pixel offset resamples 1px
  dust motes across channels and speckles the field magenta and green. It is a
  motion cue, so it only exists in motion.
- **The canvas never re-renders.** drei's `PerformanceMonitor` drives DPR through
  React state; re-rendering the Canvas subtree mid-mount races the `Environment`
  portal and the loader's Suspense boundary, and crashed the scene intermittently.
  A canvas that never re-renders is worth more than adaptive resolution.

`window.__seq` exposes the master timeline so the ~3s opening can be scrubbed to an
exact progress. This is not vanity: under a software renderer a screenshot costs
longer than a beat, so sampling the sequence on a wall clock silently drifts past
the explosion entirely. `window.__gl` / `window.__scene` expose renderer stats.

---

## Sound

`lib/audio.ts` synthesises everything with Web Audio — a temple bell, a tanpura-ish
drone and a pass-through shimmer. **No audio file is downloaded**: nothing on the
critical path, no licensing question over a recording, and every parameter is tunable
in that one file.

Bells are *inharmonic* — their partials are not integer multiples, which is precisely
why a bell sounds like a bell and a stack of harmonics sounds like an organ. The
classic bell ratios are used, each partial with its own decay so the highs die away
first and the hum tone rings on underneath, plus a short filtered noise burst for the
strike itself.

**Browsers refuse to start audio until a user gesture, and a mouse-wheel scroll does
not count.** So sound can never simply play on load alongside the big bang. Rather
than fight that, the unlock *is* the moment: switching sound on strikes the bell right
then, which makes the restriction read as intention. The toggle is visible from the
start — a page that can make noise should say so before it makes any.

Triggers: bell on the detonation frame, a higher softer bell as the mantra resolves,
and a shimmer as it sweeps past the lens (latched off *apparent size*, so scrubbing
back and forth across the threshold cannot machine-gun it).

To use a real recorded chant instead, drop the file in `public/` and see the note at
the bottom of `lib/audio.ts` — the trigger points and the toggle stay unchanged.

## Deployment

`.github/workflows/deploy.yml` builds a static export and publishes to GitHub Pages
on every push. A GitHub **project** page serves from `/<repo>/`, so the base path is
baked in at build time via `NEXT_PUBLIC_BASE_PATH`.

**Anything loaded from `public/` by our own code must go through `asset()`**
(`lib/asset.ts`) — including `mantra.svg`. Next rewrites its own URLs but not ours,
so miss this and it works locally and 404s in production.

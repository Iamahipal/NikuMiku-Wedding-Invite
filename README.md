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

## Look development notes

Most of the "gold" is `StudioEnv.tsx`, not the material — metal has no diffuse
response, so it shows you nothing but its environment. The rig is built from
`<Lightformer>` rectangles baked once to a 256px cube, rather than an HDRI: drei's
presets fetch megabytes from a CDN, which is a third-party dependency on the
critical path of the opening shot.

Three settings that were tuned the hard way, and why:

- **Bloom threshold sits high (0.72).** Lower, and ACES tone mapping desaturates
  every blown pixel toward white — the scene stops reading as gold and becomes a
  monochrome starfield.
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

## Deployment

`.github/workflows/deploy.yml` builds a static export and publishes to GitHub Pages
on every push. A GitHub **project** page serves from `/<repo>/`, so the base path is
baked in at build time via `NEXT_PUBLIC_BASE_PATH`.

**Anything loaded from `public/` by our own code must go through `asset()`**
(`lib/asset.ts`) — including `mantra.svg`. Next rewrites its own URLs but not ours,
so miss this and it works locally and 404s in production.

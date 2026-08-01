# Niku &amp; Miku — Cinematic Wedding Invitation

A scroll-driven, single-shot digital wedding invitation. Royal midnight blue, metallic
gold, and one continuous WebGL dust field that the entire page flies through.

Benchmarks for feel: `landonorris.com` (layered cutout parallax, pinned horizontal acts)
and `shopify.com/editions` (weighted inertia, scene-linked background motion).

**Live:** https://iamahipal.github.io/NikuMiku-Wedding-Invite/

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # static export -> ./out
npm run preview    # serve the built export
npm run typecheck  # tsc --noEmit
```

## Deployment

`.github/workflows/deploy.yml` builds and publishes to GitHub Pages on every push to
`claude/wedding-invitation-cinematic-wr6ii7`. The site is a fully pre-rendered static
export (`output: 'export'`), so it needs no server and could equally be dropped on any
CDN or bucket.

One thing to know if you move it: a GitHub **project** page is served from
`https://<user>.github.io/<repo>/`, so the build needs that prefix baked in. The workflow
passes it as `NEXT_PUBLIC_BASE_PATH`. Next rewrites its own URLs automatically, but it
cannot rewrite a hand-written `<img src>` — that is what `lib/asset.ts` is for. **Any
asset loaded from `public/` by raw markup must go through `asset()`**, or it will work
locally and 404 in production. On a user/organisation page (served from the domain root)
or a custom domain, just leave `NEXT_PUBLIC_BASE_PATH` unset.

---

## Architecture

The single most important rule: **React renders this page once.** Scroll drives GSAP,
GSAP writes to the DOM or to an imperative store, and the WebGL loop reads that store in
`useFrame`. Nothing in the scroll path calls `setState`, so a re-render can never
interrupt the flight or drop a frame on a pinned section.

```
<body>
 ├── WebGLBackground      z-0    fixed <canvas>, mounted once by the layout
 ├── Atmosphere           z-1    CSS grade: bloom, vignette, film grain, letterbox
 ├── SmoothScroll         ——     Lenis, driven off the GSAP ticker
 │    └── <main>          z-10   ScrollJourney: all five scenes
 ├── ScrollProgress       z-40   chapter rail
 └── Preloader            z-100  curtain; hands over via the `invitation:enter` event
</body>
```

### The DOM ⇄ WebGL bridge

`lib/scroll-state.ts` is a plain mutable singleton — deliberately not context, not state:

| field | written by | read by |
| --- | --- | --- |
| `travelTarget` | master ScrollTrigger | `CameraRig` → damped into `travel` |
| `warpTarget` | horizontal section | particle shader (`uWarp`) |
| `driftTarget` | horizontal section | particle shader (`uDrift`) |
| `intensityTarget` | per-scene `onToggle` | particle shader (`uIntensity`) |
| `pointerX/Y` | `pointermove` | camera sway + parallax layer sway |

`CameraRig` mounts first inside the `<Canvas>` and is the only place targets are
integrated into motion, using frame-rate independent exponential damping — the flight
feels identical at 60Hz and 144Hz.

### Lenis ⇄ GSAP

Three details do most of the work (see `components/SmoothScroll.tsx`):

1. `autoRaf: false` — Lenis is ticked from `gsap.ticker`, so scroll interpolation and
   every ScrollTrigger run in the same frame. Two loops = one frame of lag between the
   type and the WebGL, which reads as cheap.
2. `gsap.ticker.lagSmoothing(0)` — a heavy frame must not rewind GSAP's clock; that shows
   up as a visible hitch on a pinned section.
3. `lenis.on('scroll', ScrollTrigger.update)` — no `scrollerProxy` needed, because Lenis
   moves the real window scroll position.

### The particle flight

The camera never actually moves forward. `components/webgl/particleShader.ts` advances
every particle along +Z by `uTravel` and wraps it modulo the tube depth, so the flight is
infinite, nothing is re-seeded on the CPU, and the field never thins out. Each particle
carries a depth-derived `layer` so near motes travel faster than far ones — parallax
inside a single draw call. Two `<Particles>` layers (far field + near dust) = two draw
calls total.

Bloom is faked in the fragment shader (wide halo + hot core, additively blended) rather
than paid for with a post-processing pass.

---

## The five scenes

All GSAP lives in `components/ScrollJourney.tsx`, authored in scene order so the
choreography reads like a shot list. Scenes are dumb markup with `data-*` hooks — you can
re-time the film without touching markup, or re-art-direct the markup without touching
the timeline. Everything is wrapped in one `gsap.matchMedia()` scoped to `<main>`, so
breakpoint variants are declarative and `mm.revert()` cleans up every trigger, pin-spacer
and split in one call.

| # | Scene | Motion |
| --- | --- | --- |
| 01 | **The Hook** | Masked line reveal on the names; on scroll the hero recedes — scale down, blur up, fade — rather than scrolling away. |
| 02 | **The Invocation** | `ॐ गं गणपतये नमः` in a sticky frame: arrives huge/blurred/unlit, resolves to centre, then shrinks and lifts away. Dust dims to 55% so the Devanagari reads. |
| 03 | **Parallax Cutout** | Three layers, differential `yPercent` (16 / 28 / 104 units) + per-layer pointer sway at different amplitudes. |
| 04 | **Celebrations** | Pinned section, track translated on X by vertical progress; per-card entrance driven by `containerAnimation`; dust drifts sideways and warps. |
| 05 | **RSVP** | Vertical scroll resumes, dust warms to 125%, form staggers in over the same continuous field. |

### Reduced motion

`prefers-reduced-motion: reduce` is a first-class branch: everything is revealed, no
triggers are wired, Lenis smoothing is off. Verified — no element is left invisible.

---

## Swapping in the real content

**Copy, names, dates, events** — all of it is in `lib/wedding.ts`. Adding a fifth event
needs no CSS change; the pinned section measures its own track.

**Photography** — replace the three placeholders in `public/images/`:

| file | what it should be |
| --- | --- |
| `layer-1-palace.svg` | Wide, dark, slightly de-focused venue shot. Subject low in frame, edges dark so it dissolves into the dust. |
| `layer-2-couple.svg` | Background-removed cutout of the couple. Transparency is essential — this layer floats between the venue and the foreground. |
| `layer-3-foreground.svg` | Heavily out-of-focus marigold garlands / gold arch details. Always blurred, always fastest. |

Then switch the `<img>` tags in `components/scenes/ParallaxCutout.tsx` to `next/image`
(`priority` on layer 2). They are plain `<img>` today only because the placeholders are
SVG.

**RSVP submissions** currently `console.info` the payload — wire `handleSubmit` in
`components/scenes/Rsvp.tsx` to a route handler at `app/api/rsvp/route.ts` or a form
service.

---

## Gotcha worth knowing

The gold-foil headings use `background-clip: text` with a transparent fill. **Do not run
SplitText (or any per-letter wrapper) on them** — splitting moves the glyphs into child
spans that own no background, and transparent fill over no background renders literally
nothing. That is why the hero names are revealed as masked whole words, while the
flat-coloured parallax caption is the element that gets the SplitText line treatment
(with `autoSplit: true`, so it re-splits when the webfont loads or the wrap changes).

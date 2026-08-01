import { couple } from '@/lib/wedding';

/**
 * SCENE 03 — The 3D Parallax Cutout.
 *
 * Three stacked layers inside one sticky frame. Depth is faked entirely with
 * differential scroll speed (the Lando Norris trick):
 *
 *   Layer 1 · venue      — slow   (far away, barely moves)
 *   Layer 2 · couple     — medium (the subject, moves "at camera speed")
 *   Layer 3 · foreground — fast   (in front of the lens, blurred, races past)
 *
 * Every layer is over-scaled so its edges stay outside the frame across the
 * full travel of the parallax — otherwise you see the seams at the extremes.
 *
 * Plain <img> rather than next/image: these are SVG placeholders. When the real
 * photography lands, swap to next/image with `priority` on layer 2 and
 * width/height matching the intrinsic asset size.
 */
export default function ParallaxCutout() {
  return (
    <section data-scene="parallax" className="relative h-[240vh] w-full">
      <div
        data-parallax-frame
        className="sticky top-0 h-svh w-full overflow-hidden"
      >
        {/* ---------- Layer 1 · background venue (slowest) ---------- */}
        <div
          data-parallax-layer="bg"
          className="absolute inset-0 will-change-transform"
        >
          <img
            src="/images/layer-1-palace.svg"
            alt=""
            aria-hidden
            className="h-full w-full object-cover object-bottom opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-void/60 via-transparent to-void/85" />
        </div>

        {/* ---------- Layer 2 · the couple, cut out (mid) ---------- */}
        <div
          data-parallax-layer="mid"
          className="absolute inset-0 flex items-end justify-center will-change-transform"
        >
          {/* Light pool so the cutout sits *in* the scene rather than on it. */}
          <div
            className="absolute bottom-0 h-[70vh] w-[80vh] rounded-full"
            style={{
              background:
                'radial-gradient(closest-side, rgba(217,164,65,0.20), transparent 72%)',
            }}
          />
          <img
            src="/images/layer-2-couple.svg"
            alt={`${couple.bride} and ${couple.groom}`}
            className="relative h-[78vh] w-auto max-w-none object-contain drop-shadow-[0_40px_60px_rgba(0,0,0,0.8)]"
          />
        </div>

        {/* ---------- Layer 3 · foreground bokeh (fastest) ---------- */}
        <div
          data-parallax-layer="fg"
          className="pointer-events-none absolute inset-0 will-change-transform"
        >
          <img
            src="/images/layer-3-foreground.svg"
            alt=""
            aria-hidden
            className="h-full w-full object-cover opacity-[0.62]"
          />
        </div>

        {/* ---------- Typography, sitting between mid and foreground ---------- */}
        <div
          data-parallax-caption
          className="absolute inset-x-0 bottom-[12vh] flex flex-col items-center px-6 text-center"
        >
          <p
            data-parallax-eyebrow
            className="anim-hidden font-body text-[10px] uppercase tracking-[0.5em] text-gold/70"
          >
            {couple.hashtag}
          </p>
          {/* Split into masked lines by GSAP — flat colour, so unlike the
              gold-foil headings it survives being broken into child spans. */}
          <p
            data-parallax-headline
            className="mt-5 max-w-xl font-display text-2xl font-light leading-snug text-gold-pale opacity-0 sm:text-4xl"
          >
            Two families, one very long guest list,
            <span className="block italic text-gold/80">
              and a lake that agreed to hold the light.
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}

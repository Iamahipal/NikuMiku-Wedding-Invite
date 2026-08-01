import { couple } from '@/lib/wedding';

/**
 * SCENE 01 — The Hook.
 *
 * Pure markup. Every hook GSAP needs is a `data-*` attribute; no animation
 * logic lives here, so the scene can be re-art-directed without touching the
 * timeline, and the timeline can be re-timed without touching the markup.
 */
export default function Hero() {
  return (
    <section
      data-scene="hero"
      className="relative flex h-svh w-full flex-col items-center justify-center px-6 text-center"
    >
      <div data-hero-content className="relative flex flex-col items-center">
        <p
          data-hero-eyebrow
          className="anim-hidden font-body text-[10px] uppercase tracking-[0.6em] text-gold/70 sm:text-[11px]"
        >
          Together with their families
        </p>

        {/*
          Each name is masked by its own overflow box and revealed as one solid
          block rather than character-by-character. That is deliberate: the
          gold-foil gradient is painted with `background-clip: text`, so the
          text node must stay in the element that owns the gradient. Splitting
          it (SplitText chars, or any per-letter wrapper) moves the glyphs into
          child spans that have no background of their own — and transparent
          fill on a background-less span renders nothing at all.
        */}
        <h1 className="mt-8 flex flex-col items-center leading-[0.86]">
          <span className="block overflow-hidden pb-[0.06em]">
            <span
              data-hero-line
              className="text-gold-foil block font-display text-[19vw] font-light tracking-[0.02em] sm:text-[13vw] lg:text-[11rem]"
            >
              {couple.bride}
            </span>
          </span>

          <span
            data-hero-amp
            className="anim-hidden my-1 font-display text-2xl font-light italic text-gold/80 sm:text-3xl"
          >
            &amp;
          </span>

          <span className="block overflow-hidden pb-[0.06em]">
            <span
              data-hero-line
              className="text-gold-foil block font-display text-[19vw] font-light tracking-[0.02em] sm:text-[13vw] lg:text-[11rem]"
            >
              {couple.groom}
            </span>
          </span>
        </h1>

        <div data-hero-rule className="hairline mt-10 h-px w-0 sm:mt-12" />

        <p
          data-hero-meta
          className="anim-hidden mt-8 font-body text-[10px] uppercase tracking-[0.45em] text-gold-pale/70 sm:text-xs"
        >
          {couple.date}
          <span className="mx-3 text-gold/40">·</span>
          {couple.city}
        </p>
      </div>

      {/* Scroll invitation — the only instruction the film ever gives. */}
      <div
        data-hero-cue
        className="anim-hidden absolute bottom-14 flex flex-col items-center gap-3"
      >
        <span className="font-body text-[9px] uppercase tracking-[0.4em] text-gold/50">
          Scroll
        </span>
        <span className="relative block h-14 w-px overflow-hidden bg-gold/15">
          <span data-hero-cue-fill className="absolute inset-x-0 top-0 h-1/3 bg-gold/80" />
        </span>
      </div>
    </section>
  );
}

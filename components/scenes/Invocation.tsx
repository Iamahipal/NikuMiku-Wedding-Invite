/**
 * SCENE 01 — The Invocation. The film's title card.
 *
 * This is the first thing on screen. The mantra does not fade in on scroll —
 * it arrives out of the Overture's spark bloom, rushing from deep space to
 * fill the frame (that timeline lives in ScrollJourney, cued by ENTER_EVENT).
 * Scrolling only takes it *away*.
 *
 * Sticky rather than pinned: there is no pin-spacer to measure, so this scene
 * can never shift layout when fonts or images settle underneath it.
 */
export default function Invocation() {
  return (
    <section data-scene="invocation" className="relative h-[170vh] w-full">
      <div className="sticky top-0 flex h-svh w-full flex-col items-center justify-center px-6">
        {/* Aura the mantra lands inside of. */}
        <div
          data-invocation-glow
          className="absolute h-[58vmin] w-[58vmin] rounded-full opacity-0"
          style={{
            background:
              'radial-gradient(closest-side, rgba(242,200,119,0.26), rgba(217,164,65,0.09) 45%, transparent 72%)',
            filter: 'blur(14px)',
          }}
        />

        <p
          data-invocation-mantra
          className="relative text-center font-deva font-normal leading-[1.35] text-gold-pale opacity-0 text-[10vw] sm:text-[7vw] lg:text-[6.5rem]"
          lang="sa"
          style={{
            textShadow:
              '0 0 28px rgba(242,200,119,0.35), 0 0 80px rgba(217,164,65,0.18)',
          }}
        >
          ॐ गं गणपतये नमः
        </p>

        <p
          data-invocation-sub
          className="relative mt-10 max-w-md text-center font-display text-base font-light italic tracking-wide text-gold/60 opacity-0 sm:text-lg"
        >
          We begin, as everything in our families begins, by asking Shree Ganesh
          to remove every obstacle from the road ahead.
        </p>

        {/* The film's only instruction, and it waits until the title has landed. */}
        <div
          data-invocation-cue
          className="absolute bottom-14 flex flex-col items-center gap-3 opacity-0"
        >
          <span className="font-body text-[9px] uppercase tracking-[0.4em] text-gold/50">
            Scroll
          </span>
          <span className="relative block h-14 w-px overflow-hidden bg-gold/15">
            <span data-invocation-cue-fill className="absolute inset-x-0 top-0 h-1/3 bg-gold/80" />
          </span>
        </div>
      </div>
    </section>
  );
}

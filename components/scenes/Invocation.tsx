/**
 * SCENE 02 — The Invocation.
 *
 * A sticky viewport inside a tall section: the mantra holds centre frame while
 * ~180vh of scroll drives its scale, glow and dissolve. Sticky (not pinned) on
 * purpose — there is no pin-spacer to measure, so this scene can never shift
 * layout when fonts or images settle.
 */
export default function Invocation() {
  return (
    <section data-scene="invocation" className="relative h-[180vh] w-full">
      <div className="sticky top-0 flex h-svh w-full flex-col items-center justify-center px-6">
        {/* Aura behind the mantra. Scaled and faded by the same scrubbed
            timeline, so the light "arrives" with the words. */}
        <div
          data-invocation-glow
          className="absolute h-[46vmin] w-[46vmin] rounded-full"
          style={{
            background:
              'radial-gradient(closest-side, rgba(242,200,119,0.22), rgba(217,164,65,0.08) 45%, transparent 72%)',
            filter: 'blur(12px)',
          }}
        />

        <p
          data-invocation-mantra
          className="relative text-center font-deva text-[9vw] font-normal leading-[1.35] text-gold-pale sm:text-[6vw] lg:text-[4.6rem]"
          lang="sa"
        >
          ॐ गं गणपतये नमः
        </p>

        <p
          data-invocation-sub
          className="relative mt-10 max-w-md text-center font-display text-base font-light italic tracking-wide text-gold/60 sm:text-lg"
        >
          We begin, as everything in our families begins, by asking for the
          removal of obstacles.
        </p>
      </div>
    </section>
  );
}

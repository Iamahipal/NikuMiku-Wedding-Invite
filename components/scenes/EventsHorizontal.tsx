import { events } from '@/lib/wedding';

/**
 * SCENE 04 — Horizontal Celebrations.
 *
 * The section is pinned and the track is translated on X by vertical scroll
 * progress. Note there is no hard-coded section height: ScrollTrigger's pin
 * spacer generates the scroll distance from the measured track width, so
 * adding a fifth event needs no CSS change at all.
 */
export default function EventsHorizontal() {
  return (
    <section data-scene="events" className="relative w-full">
      <div
        data-events-viewport
        className="relative flex h-svh w-full items-center overflow-hidden"
      >
        {/* Section title, parked on the left edge of the pinned frame. */}
        <div className="pointer-events-none absolute left-6 top-[12vh] z-0 sm:left-12">
          <p
            data-events-eyebrow
            className="font-body text-[10px] uppercase tracking-[0.5em] text-gold/60"
          >
            Four days
          </p>
          <h2
            data-events-title
            className="mt-3 font-display text-5xl font-light italic text-gold-pale sm:text-7xl"
          >
            Celebrations
          </h2>
        </div>

        <div
          data-events-track
          className="relative z-10 flex items-center gap-6 pl-[8vw] pr-[30vw] will-change-transform sm:gap-10 sm:pl-[14vw]"
        >
          {events.map((event) => (
            <article
              key={event.id}
              data-event-card
              className="glass-card group relative z-10 flex h-[62vh] w-[78vw] shrink-0 flex-col justify-between rounded-[2px] p-8 sm:h-[58vh] sm:w-[380px] sm:p-10 lg:h-[60vh] lg:w-[420px]"
            >
              {/* Per-card gold bleed, tinted from the event's accent. */}
              <div
                data-card-glow
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-700"
                style={{
                  background: `radial-gradient(90% 60% at 50% 0%, ${event.accent}22, transparent 70%)`,
                }}
              />

              <header className="relative">
                <div className="flex items-baseline justify-between">
                  <span className="font-body text-[10px] tracking-[0.4em] text-gold/50">
                    {event.index}
                  </span>
                  <span className="font-deva text-lg text-gold/70" lang="hi">
                    {event.script}
                  </span>
                </div>

                <div className="hairline mt-6 h-px w-full opacity-60" />

                <h3
                  data-card-name
                  className="mt-7 font-display text-4xl font-light leading-none text-gold-pale sm:text-5xl"
                >
                  {event.name}
                </h3>

                <p className="mt-5 max-w-[28ch] font-display text-lg font-light italic leading-snug text-gold/70">
                  {event.blurb}
                </p>
              </header>

              <dl className="relative mt-8 grid grid-cols-1 gap-3 font-body text-[11px] tracking-[0.14em] text-gold-pale/75">
                <div className="flex justify-between gap-6 border-t border-gold/10 pt-3">
                  <dt className="uppercase text-gold/45">Date</dt>
                  <dd className="text-right">{event.date}</dd>
                </div>
                <div className="flex justify-between gap-6 border-t border-gold/10 pt-3">
                  <dt className="uppercase text-gold/45">Time</dt>
                  <dd className="text-right">{event.time}</dd>
                </div>
                <div className="flex justify-between gap-6 border-t border-gold/10 pt-3">
                  <dt className="uppercase text-gold/45">Venue</dt>
                  <dd className="max-w-[18ch] text-right">{event.venue}</dd>
                </div>
                <div className="flex justify-between gap-6 border-t border-gold/10 pt-3">
                  <dt className="uppercase text-gold/45">Dress</dt>
                  <dd className="max-w-[18ch] text-right">{event.dress}</dd>
                </div>
              </dl>
            </article>
          ))}

          {/* Closing plate, so the track doesn't end on a hard edge. */}
          <div className="flex h-[62vh] w-[60vw] shrink-0 items-center sm:w-[36vw]">
            <p className="font-display text-3xl font-light italic leading-snug text-gold/50 sm:text-4xl">
              …and then,
              <br />
              a lifetime.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

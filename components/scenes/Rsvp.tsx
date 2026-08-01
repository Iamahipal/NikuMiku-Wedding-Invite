'use client';

import { useState } from 'react';

import { couple, events } from '@/lib/wedding';

type Status = 'idle' | 'sending' | 'done';

/**
 * SCENE 05 — RSVP.
 *
 * Back to ordinary vertical scrolling, floating over the same continuous
 * particle field. Local state lives here and nowhere else: this component is a
 * leaf, so typing in the form re-renders a form — never the canvas, which is
 * mounted far above in the root layout.
 */
export default function Rsvp() {
  const [status, setStatus] = useState<Status>('idle');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('sending');

    // TODO: wire to a route handler (app/api/rsvp/route.ts) or a form service.
    const data = Object.fromEntries(new FormData(e.currentTarget));
    console.info('RSVP', data);

    await new Promise((r) => setTimeout(r, 900));
    setStatus('done');
  }

  return (
    <section
      data-scene="rsvp"
      className="relative flex min-h-svh w-full flex-col items-center justify-center px-6 py-32"
    >
      <div className="w-full max-w-2xl">
        <div className="text-center">
          <p
            data-rsvp-eyebrow
            className="anim-hidden font-body text-[10px] uppercase tracking-[0.55em] text-gold/60"
          >
            Kindly respond by 20 December 2026
          </p>
          <h2
            data-rsvp-title
            className="text-gold-foil anim-hidden mt-6 font-display text-6xl font-light sm:text-8xl"
          >
            RSVP
          </h2>
          <div data-rsvp-rule className="hairline mx-auto mt-8 h-px w-0" />
        </div>

        <form
          onSubmit={handleSubmit}
          className="glass-card mt-14 rounded-[2px] p-8 sm:p-12"
        >
          <div className="grid gap-8 sm:grid-cols-2">
            <Field name="name" label="Full name" required />
            <Field name="email" label="Email" type="email" required />

            <label data-rsvp-field className="anim-hidden group block">
              <span className="font-body text-[10px] uppercase tracking-[0.35em] text-gold/50">
                Attending
              </span>
              <select
                name="attending"
                defaultValue="yes"
                className="mt-3 w-full appearance-none border-b border-gold/25 bg-transparent pb-3 font-display text-lg font-light text-gold-pale outline-none transition-colors focus:border-gold"
              >
                <option value="yes" className="bg-midnight">
                  Joyfully accepts
                </option>
                <option value="no" className="bg-midnight">
                  Regretfully declines
                </option>
              </select>
            </label>

            <Field
              name="guests"
              label="Guests"
              type="number"
              min={0}
              max={6}
              defaultValue={1}
            />
          </div>

          <fieldset data-rsvp-field className="anim-hidden mt-10">
            <legend className="font-body text-[10px] uppercase tracking-[0.35em] text-gold/50">
              Events you&apos;ll join
            </legend>
            <div className="mt-5 flex flex-wrap gap-3">
              {events.map((event) => (
                <label
                  key={event.id}
                  className="cursor-pointer select-none border border-gold/20 px-4 py-2 font-body text-[11px] uppercase tracking-[0.2em] text-gold-pale/70 transition-colors hover:border-gold/60 hover:text-gold-pale has-checked:border-gold has-checked:bg-gold/10 has-checked:text-gold-pale"
                >
                  <input
                    type="checkbox"
                    name="events"
                    value={event.id}
                    className="sr-only"
                    defaultChecked
                  />
                  {event.name}
                </label>
              ))}
            </div>
          </fieldset>

          <label data-rsvp-field className="anim-hidden mt-10 block">
            <span className="font-body text-[10px] uppercase tracking-[0.35em] text-gold/50">
              A note for the couple
            </span>
            <textarea
              name="note"
              rows={3}
              placeholder="Optional, but we will read it twice."
              className="mt-3 w-full resize-none border-b border-gold/25 bg-transparent pb-3 font-display text-lg font-light text-gold-pale outline-none transition-colors placeholder:text-gold/25 focus:border-gold"
            />
          </label>

          <button
            data-rsvp-field
            type="submit"
            disabled={status !== 'idle'}
            className="anim-hidden group relative mt-12 w-full overflow-hidden border border-gold/40 px-8 py-5 font-body text-[11px] uppercase tracking-[0.45em] text-gold-pale transition-colors duration-500 hover:text-void disabled:opacity-70"
          >
            <span className="absolute inset-0 -translate-y-full bg-gradient-to-b from-gold-bright to-gold transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-y-0 group-disabled:translate-y-0" />
            <span className="relative">
              {status === 'idle' && 'Send our reply'}
              {status === 'sending' && 'Sending…'}
              {status === 'done' && 'Thank you — see you there'}
            </span>
          </button>
        </form>

        <footer className="mt-24 flex flex-col items-center gap-4 text-center">
          <p className="font-display text-3xl font-light italic text-gold/70">
            {couple.bride} &amp; {couple.groom}
          </p>
          <p className="font-body text-[10px] uppercase tracking-[0.45em] text-gold/40">
            {couple.date} · {couple.city}
          </p>
          <p className="mt-6 font-body text-[10px] uppercase tracking-[0.35em] text-gold/25">
            {couple.hashtag}
          </p>
        </footer>
      </div>
    </section>
  );
}

function Field({
  name,
  label,
  type = 'text',
  ...rest
}: {
  name: string;
  label: string;
  type?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label data-rsvp-field className="anim-hidden block">
      <span className="font-body text-[10px] uppercase tracking-[0.35em] text-gold/50">
        {label}
      </span>
      <input
        name={name}
        type={type}
        className="mt-3 w-full border-b border-gold/25 bg-transparent pb-3 font-display text-lg font-light text-gold-pale outline-none transition-colors placeholder:text-gold/25 focus:border-gold"
        {...rest}
      />
    </label>
  );
}

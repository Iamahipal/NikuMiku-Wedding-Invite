'use client';

import { useEffect, useState } from 'react';

import * as audio from '@/lib/audio';
import { timeline } from '@/lib/timeline';

/**
 * The sound control.
 *
 * Deliberately visible from the first frame rather than hidden behind a menu:
 * a page that can make noise should say so before it makes any, and the viewer
 * should never have to hunt for the way to stop it.
 *
 * Enabling is also the cue. Because browsers will not let audio start until a
 * user gesture, the bell is struck at the moment sound is switched on — so the
 * restriction reads as intention rather than as a missed cue.
 */
export default function SoundToggle() {
  const [on, setOn] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const unbind = audio.onChange(setOn);
    const unbindVis = audio.bindVisibility();
    // Slight delay so the control fades in after the opening has begun, rather
    // than sitting on the black frame.
    const t = setTimeout(() => setReady(true), 1400);
    return () => {
      unbind();
      unbindVis();
      clearTimeout(t);
    };
  }, []);

  async function toggle() {
    const next = !audio.isEnabled();
    await audio.setEnabled(next);

    if (next) {
      audio.drone(true);
      // Ring on unlock. If the mantra has already arrived, this lands as its
      // note; if it hasn't, it reads as the invocation starting.
      audio.bell(523.25, timeline.reveal > 0.5 ? 0.55 : 0.4, 1);
    } else {
      audio.drone(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={on}
      aria-label={on ? 'Turn sound off' : 'Turn sound on'}
      className={`fixed bottom-7 right-6 z-30 flex items-center gap-2.5 rounded-full border border-gold/25 bg-void/40 px-4 py-2.5 backdrop-blur-sm transition-all duration-700 hover:border-gold/60 ${
        ready ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
    >
      {/* Three bars that animate only while sound is on. */}
      <span className="flex h-3 items-end gap-[2px]" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-[2px] bg-gold-bright"
            style={
              on
                ? { animation: `sound-bar 900ms ease-in-out ${i * 140}ms infinite`, height: '100%' }
                : { height: '3px', opacity: 0.5 }
            }
          />
        ))}
      </span>
      <span className="font-body text-[9px] uppercase tracking-[0.3em] text-gold-pale/80">
        {on ? 'Sound on' : 'Sound'}
      </span>

      <style>{`
        @keyframes sound-bar {
          0%, 100% { height: 25%; }
          50% { height: 100%; }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="sound-bar"] { animation: none !important; height: 60% !important; }
        }
      `}</style>
    </button>
  );
}

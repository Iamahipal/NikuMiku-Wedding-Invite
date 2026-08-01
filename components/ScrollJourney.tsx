'use client';

import { useRef } from 'react';

import { gsap, ScrollTrigger, SplitText } from '@/lib/gsap';
import { scrollState, TRAVEL_DISTANCE } from '@/lib/scroll-state';
import { useIsomorphicLayoutEffect } from '@/lib/useIsomorphicLayoutEffect';
import { ENTER_EVENT } from '@/components/ui/Preloader';

import Hero from '@/components/scenes/Hero';
import Invocation from '@/components/scenes/Invocation';
import ParallaxCutout from '@/components/scenes/ParallaxCutout';
import EventsHorizontal from '@/components/scenes/EventsHorizontal';
import Rsvp from '@/components/scenes/Rsvp';

/**
 * ============================================================================
 * THE SCROLL JOURNEY
 * ============================================================================
 * Every ScrollTrigger in the film is authored here, in scene order, so the
 * choreography can be read top-to-bottom like a shot list. The scenes
 * themselves are dumb markup with `data-*` hooks.
 *
 * Two rules hold the whole thing together:
 *
 *   1. Everything runs inside a single `gsap.matchMedia()` scoped to <main>.
 *      Selectors can't leak, breakpoint variants are declarative, and
 *      `mm.revert()` on unmount kills every trigger, tween, pin-spacer and
 *      SplitText in one call — no leaks between fast refreshes or routes.
 *
 *   2. Nothing here ever calls setState. Scroll drives GSAP, and GSAP writes
 *      either to the DOM or to the imperative `scrollState` bridge that the
 *      WebGL layer reads in useFrame. React renders this tree once.
 * ============================================================================
 */
export default function ScrollJourney() {
  const root = useRef<HTMLElement>(null);

  useIsomorphicLayoutEffect(() => {
    const mm = gsap.matchMedia(root);

    mm.add(
      {
        isDesktop: '(min-width: 768px)',
        isMobile: '(max-width: 767px)',
        motionOK: '(prefers-reduced-motion: no-preference)',
      },
      (context) => {
        const { isDesktop, motionOK } = context.conditions as {
          isDesktop: boolean;
          isMobile: boolean;
          motionOK: boolean;
        };

        // --------------------------------------------------------------
        // Reduced motion: reveal everything, wire nothing.
        // --------------------------------------------------------------
        if (!motionOK) {
          gsap.set('.anim-hidden', { opacity: 1, y: 0 });
          gsap.set('[data-hero-rule], [data-rsvp-rule]', { width: '12rem' });
          // This one starts at opacity 0 in CSS because its reveal normally
          // comes from SplitText's onSplit — which never runs on this branch.
          gsap.set('[data-parallax-headline]', { opacity: 1 });
          return;
        }

        // Common start state for anything the entrances bring in.
        gsap.set('.anim-hidden', { y: 26 });

        // depth multiplier — parallax travel is halved on phones, where the
        // viewport is tall and layers would otherwise fly off frame.
        const depth = isDesktop ? 1 : 0.55;

        /* ==============================================================
         * MASTER — scroll position -> WebGL flight
         * ==============================================================
         * One trigger spanning the document writes the camera's travel
         * target. The velocity kick is what makes a fast flick feel like an
         * acceleration through the dust instead of a linear pan.
         */
        ScrollTrigger.create({
          trigger: root.current,
          start: 'top top',
          end: 'bottom bottom',
          onUpdate: (self) => {
            scrollState.progress = self.progress;
            scrollState.velocity = self.getVelocity();
            scrollState.travelTarget =
              self.progress * TRAVEL_DISTANCE +
              gsap.utils.clamp(-70, 70, self.getVelocity() * 0.035);
          },
        });

        /* ==============================================================
         * SCENE 01 — THE HOOK
         * ============================================================== */

        // Masked line reveal. The names rise out of their overflow boxes as
        // whole words — see the note in Hero.tsx for why they must not be
        // split into per-character spans.
        const intro = gsap
          .timeline({ paused: true, defaults: { ease: 'expo.out' } })
          .from('[data-hero-line]', {
            yPercent: 115,
            duration: 1.7,
            stagger: 0.14,
          })
          .to('[data-hero-eyebrow]', { opacity: 1, y: 0, duration: 1.2 }, 0.15)
          .to('[data-hero-amp]', { opacity: 1, y: 0, duration: 1 }, 0.75)
          .to('[data-hero-rule]', { width: '14rem', duration: 1.6 }, 0.9)
          .to('[data-hero-meta]', { opacity: 1, y: 0, duration: 1.2 }, 1.05)
          .to('[data-hero-cue]', { opacity: 1, y: 0, duration: 1 }, 1.3);

        // The preloader hands over when its curtain clears; the delayed call
        // is a safety net in case the event never fires.
        const playIntro = () => intro.play();
        window.addEventListener(ENTER_EVENT, playIntro, { once: true });
        const introFallback = gsap.delayedCall(4.5, playIntro);

        // Looping scroll cue.
        gsap.fromTo(
          '[data-hero-cue-fill]',
          { yPercent: -110 },
          {
            yPercent: 320,
            duration: 1.9,
            ease: 'power2.inOut',
            repeat: -1,
            repeatDelay: 0.25,
          },
        );

        // Exit: the hero doesn't scroll away, it recedes into the dust.
        gsap
          .timeline({
            scrollTrigger: {
              trigger: '[data-scene="hero"]',
              start: 'top top',
              end: 'bottom top',
              scrub: 0.6,
            },
          })
          .to(
            '[data-hero-content]',
            {
              yPercent: -14,
              scale: 0.92,
              opacity: 0,
              filter: 'blur(7px)',
              ease: 'power1.in',
            },
            0,
          )
          .to('[data-hero-cue]', { opacity: 0, y: 20, ease: 'none', duration: 0.35 }, 0);

        /* ==============================================================
         * SCENE 02 — THE INVOCATION
         * ==============================================================
         * One scrubbed timeline across the full 180vh section: the mantra
         * arrives huge, blurred and unlit, resolves to centre frame, then
         * shrinks and lifts away as the flight continues past it.
         */
        gsap
          .timeline({
            scrollTrigger: {
              trigger: '[data-scene="invocation"]',
              start: 'top bottom',
              end: 'bottom top',
              scrub: 0.8,
            },
            defaults: { ease: 'none' },
          })
          // ---- arrival (first half of the section)
          .fromTo(
            '[data-invocation-mantra]',
            { scale: 1.45 * (isDesktop ? 1 : 0.9), opacity: 0, y: 70, filter: 'blur(16px)' },
            { scale: 1, opacity: 1, y: 0, filter: 'blur(0px)', duration: 1 },
            0,
          )
          .fromTo(
            '[data-invocation-glow]',
            { scale: 0.4, opacity: 0 },
            { scale: 1, opacity: 1, duration: 1 },
            0,
          )
          .fromTo(
            '[data-invocation-sub]',
            { opacity: 0, y: 40 },
            { opacity: 1, y: 0, duration: 0.55 },
            0.45,
          )
          // ---- departure (second half)
          .to(
            '[data-invocation-mantra]',
            { scale: 0.6, opacity: 0, y: -160, filter: 'blur(9px)', duration: 1 },
            1,
          )
          .to('[data-invocation-glow]', { scale: 0.3, opacity: 0, duration: 0.8 }, 1)
          .to('[data-invocation-sub]', { opacity: 0, y: -90, duration: 0.7 }, 1);

        // Dim the dust so the Devanagari reads cleanly, then bring it back.
        ScrollTrigger.create({
          trigger: '[data-scene="invocation"]',
          start: 'top 60%',
          end: 'bottom 40%',
          onToggle: (self) => {
            scrollState.intensityTarget = self.isActive ? 0.55 : 1;
          },
        });

        /* ==============================================================
         * SCENE 03 — THE 3D PARALLAX CUTOUT
         * ==============================================================
         * Fake depth from differential speed. The layers are over-scaled so
         * their edges never enter frame across the full travel, and each one
         * gets a different yPercent delta:
         *
         *   background  16 units  (slow — far away)
         *   midground   36 units  (normal — the subject)
         *   fg bokeh   110 units  (fast — in front of the lens)
         */
        gsap.set('[data-parallax-layer="bg"]', { scale: 1.16 });
        gsap.set('[data-parallax-layer="fg"]', { scale: 1.3 });

        gsap
          .timeline({
            scrollTrigger: {
              trigger: '[data-scene="parallax"]',
              start: 'top bottom',
              end: 'bottom top',
              scrub: 0.9,
            },
            defaults: { ease: 'none' },
          })
          .fromTo(
            '[data-parallax-layer="bg"]',
            { yPercent: 8 * depth, scale: 1.22 },
            { yPercent: -8 * depth, scale: 1.12 },
            0,
          )
          .fromTo(
            '[data-parallax-layer="mid"]',
            { yPercent: 14 * depth, scale: 1.06 },
            { yPercent: -14 * depth, scale: 1 },
            0,
          )
          .fromTo(
            '[data-parallax-layer="fg"]',
            { yPercent: 52 * depth, scale: 1.24 },
            { yPercent: -52 * depth, scale: 1.4 },
            0,
          );

        // Pointer sway on the cutout stack — the layers must react to the
        // mouse at different amplitudes or the illusion collapses. quickTo
        // keeps this at one interpolated write per element per frame.
        let sway: (() => void) | null = null;

        if (isDesktop) {
          const swayers = [
            { sel: '[data-parallax-layer="bg"]', amp: 10 },
            { sel: '[data-parallax-layer="mid"]', amp: 26 },
            { sel: '[data-parallax-layer="fg"]', amp: 62 },
          ].map(({ sel, amp }) => ({
            amp,
            setX: gsap.quickTo(sel, 'x', { duration: 0.9, ease: 'power3.out' }),
            setY: gsap.quickTo(sel, 'y', { duration: 0.9, ease: 'power3.out' }),
          }));

          sway = () => {
            for (const s of swayers) {
              s.setX(scrollState.pointerX * s.amp);
              s.setY(scrollState.pointerY * s.amp * 0.4);
            }
          };
          gsap.ticker.add(sway);
        }

        gsap.to('[data-parallax-eyebrow]', {
          opacity: 1,
          y: 0,
          duration: 1.4,
          ease: 'expo.out',
          scrollTrigger: { trigger: '[data-scene="parallax"]', start: 'top 35%', once: true },
        });

        // `autoSplit` re-splits (and rebuilds this animation) whenever the
        // webfont finishes loading or the line-wrap changes on resize — the
        // fix for the classic "lines split against the fallback font" bug.
        const captionSplit = SplitText.create('[data-parallax-headline]', {
          type: 'lines',
          mask: 'lines',
          autoSplit: true,
          onSplit: (self) => {
            gsap.set('[data-parallax-headline]', { opacity: 1 });
            return gsap.from(self.lines, {
              yPercent: 110,
              duration: 1.4,
              stagger: 0.14,
              ease: 'expo.out',
              scrollTrigger: {
                trigger: '[data-scene="parallax"]',
                start: 'top 35%',
                once: true,
              },
            });
          },
        });

        /* ==============================================================
         * SCENE 04 — HORIZONTAL CELEBRATIONS
         * ==============================================================
         * The pinned section. Distance is measured in a function so
         * `invalidateOnRefresh` recomputes it on resize instead of baking in
         * the width at build time.
         */
        const track = root.current?.querySelector<HTMLElement>('[data-events-track]');
        const viewport = root.current?.querySelector<HTMLElement>('[data-events-viewport]');
        const rail = document.querySelector<HTMLElement>('[data-chapter-rail]');

        if (track && viewport) {
          const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);

          const horizontal = gsap.to(track, {
            x: () => -distance(),
            ease: 'none',
            scrollTrigger: {
              trigger: '[data-scene="events"]',
              start: 'top top',
              // A little tail past the last card so the exit isn't abrupt.
              end: () => `+=${distance() + window.innerHeight * 0.4}`,
              pin: viewport,
              pinSpacing: true,
              anticipatePin: 1,
              scrub: 0.8,
              invalidateOnRefresh: true,
              onUpdate: (self) => {
                // The dust slides against the cards and speeds up: the
                // background sells the sideways move the DOM is making.
                scrollState.driftTarget = -self.progress * 26;
                scrollState.warpTarget = 0.35 + self.progress * 0.45;
              },
              onToggle: (self) => {
                scrollState.intensityTarget = self.isActive ? 1.15 : 1;
                if (!self.isActive) {
                  scrollState.warpTarget = 0;
                  scrollState.driftTarget = 0;
                }
                // The vertical chapter rail is meaningless (and collides with
                // the cards) while the page is moving sideways. It lives in
                // the layout, outside this matchMedia scope, so it has to be
                // resolved against the document rather than by selector.
                if (!rail) return;
                gsap.to(rail, {
                  opacity: self.isActive ? 0 : 1,
                  x: self.isActive ? 20 : 0,
                  duration: 0.6,
                  ease: 'power2.out',
                  overwrite: true,
                });
              },
            },
          });

          // Per-card entrance, driven by horizontal position inside the
          // container animation rather than by page scroll.
          gsap.set('[data-event-card]', { transformPerspective: 1000 });

          gsap.utils.toArray<HTMLElement>('[data-event-card]').forEach((card) => {
            gsap.from(card, {
              yPercent: 10,
              scale: 0.93,
              rotateY: 9,
              opacity: 0.15,
              ease: 'none',
              scrollTrigger: {
                trigger: card,
                containerAnimation: horizontal,
                start: 'left 95%',
                end: 'left 45%',
                scrub: true,
              },
            });

            // Gold bleed lights up while the card owns the frame.
            gsap.to(card.querySelector('[data-card-glow]'), {
              opacity: 1,
              ease: 'none',
              scrollTrigger: {
                trigger: card,
                containerAnimation: horizontal,
                start: 'left 70%',
                end: 'right 30%',
                scrub: true,
              },
            });
          });

          // Title drifts against the track — a second parallax plane inside
          // the horizontal one.
          gsap.to('[data-events-title]', {
            x: isDesktop ? -120 : -40,
            opacity: 0.35,
            ease: 'none',
            scrollTrigger: {
              trigger: '[data-scene="events"]',
              start: 'top top',
              end: () => `+=${distance()}`,
              scrub: 0.8,
              invalidateOnRefresh: true,
            },
          });
        }

        /* ==============================================================
         * SCENE 05 — RSVP
         * ==============================================================
         * Vertical scrolling resumes; the flight settles and the dust warms
         * back up behind the form.
         */
        ScrollTrigger.create({
          trigger: '[data-scene="rsvp"]',
          start: 'top 80%',
          end: 'bottom bottom',
          onToggle: (self) => {
            if (self.isActive) {
              scrollState.warpTarget = 0;
              scrollState.driftTarget = 0;
              scrollState.intensityTarget = 1.25;
            } else {
              scrollState.intensityTarget = 1;
            }
          },
        });

        gsap
          .timeline({
            scrollTrigger: { trigger: '[data-scene="rsvp"]', start: 'top 72%', once: true },
            defaults: { ease: 'expo.out' },
          })
          .to('[data-rsvp-eyebrow]', { opacity: 1, y: 0, duration: 1.1 })
          .to('[data-rsvp-title]', { opacity: 1, y: 0, duration: 1.4 }, '-=0.85')
          .to('[data-rsvp-rule]', { width: '12rem', duration: 1.5 }, '-=1.1')
          .to(
            '[data-rsvp-field]',
            { opacity: 1, y: 0, duration: 1, stagger: 0.075 },
            '-=1.15',
          );

        /* ==============================================================
         * GLOBAL — the gold foil never stops moving.
         * ============================================================== */
        gsap.to('.text-gold-foil', {
          backgroundPosition: '-220% 0%',
          duration: 9,
          ease: 'none',
          repeat: -1,
        });

        // matchMedia cleanup: everything created above is reverted for us;
        // these are the few things GSAP can't know about.
        return () => {
          window.removeEventListener(ENTER_EVENT, playIntro);
          introFallback.kill();
          if (sway) gsap.ticker.remove(sway);
          captionSplit.revert();
        };
      },
    );

    return () => mm.revert();
  }, []);

  return (
    <main ref={root} className="relative z-10 w-full">
      <Hero />
      <Invocation />
      <ParallaxCutout />
      <EventsHorizontal />
      <Rsvp />
    </main>
  );
}

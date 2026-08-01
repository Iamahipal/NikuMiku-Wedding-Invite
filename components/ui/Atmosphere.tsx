/**
 * Colour grading, applied as compositor-only CSS on top of the WebGL canvas:
 * a lens vignette, a warm bloom wash, and animated film grain.
 *
 * Doing this in CSS instead of a post-processing pass keeps the render loop at
 * one draw call per particle layer while still landing the cinematic look.
 */
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E\")";

export default function Atmosphere() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[1]">
      {/* Warm bloom pooling in the centre of frame. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(60% 45% at 50% 40%, rgba(217,164,65,0.10) 0%, rgba(217,164,65,0.03) 40%, transparent 70%)',
          mixBlendMode: 'screen',
        }}
      />

      {/* Anamorphic vignette — heavier at the corners, soft at the sides. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(130% 110% at 50% 50%, transparent 42%, rgba(2,4,12,0.55) 78%, rgba(2,4,12,0.92) 100%)',
        }}
      />

      {/* Film grain. */}
      <div
        className="absolute -inset-[50px] opacity-[0.055]"
        style={{
          backgroundImage: GRAIN,
          backgroundSize: '160px 160px',
          mixBlendMode: 'overlay',
          animation: 'grain-shift 700ms steps(4) infinite',
        }}
      />

      {/* Letterbox rails — the frame reads as film, not as a web page. */}
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-void/85 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-void/90 to-transparent" />

      <style>{`
        @keyframes grain-shift {
          0%   { transform: translate3d(0,0,0); }
          25%  { transform: translate3d(-12px,6px,0); }
          50%  { transform: translate3d(8px,-10px,0); }
          75%  { transform: translate3d(-6px,-4px,0); }
          100% { transform: translate3d(0,0,0); }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="grain-shift"] { animation: none !important; }
        }
      `}</style>
    </div>
  );
}

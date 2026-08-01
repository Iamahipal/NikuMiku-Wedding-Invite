'use client';

import dynamic from 'next/dynamic';

// The canvas is client-only: three.js has no business in the server bundle,
// and an SSR'd <canvas> would only cause a hydration mismatch. The gradient
// underneath is real CSS, so the first paint is already art-directed —
// the WebGL simply lights up on top of it a few hundred ms later.
const Scene = dynamic(() => import('./Scene'), { ssr: false });

export default function WebGLBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0"
      style={{
        // Base grade: royal blue core falling off to void at the edges.
        background:
          'radial-gradient(120% 90% at 50% 42%, #0b1c4d 0%, #071133 34%, #050b1e 62%, #02040c 100%)',
      }}
    >
      <Scene />
    </div>
  );
}

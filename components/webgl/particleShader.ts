/**
 * Golden dust shader.
 *
 * The whole "flying through space" illusion happens on the GPU: the camera
 * never actually moves forward. Instead every particle is advanced along +Z by
 * `uTravel` and wrapped modulo the tube depth, which means the flight is
 * infinite, nothing ever needs re-seeding on the CPU, and the scroll can run
 * for 20 pages without the field thinning out.
 *
 * Each particle carries a `layer` derived from its seed so near motes travel
 * faster than far ones — parallax for free, inside a single draw call.
 */
export const particleVertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uTravel;
  uniform float uTravelScale;
  uniform float uDepth;
  uniform float uSize;
  uniform float uWarp;
  uniform float uDrift;
  uniform float uFloat;

  attribute float aScale;
  attribute float aSeed;
  attribute float aTint;

  varying float vAlpha;
  varying float vTint;
  varying float vSpark;

  void main() {
    vec3 p = position;

    // Depth layer: 0.55 (far, slow) -> 1.45 (near, fast).
    float layer = 0.55 + aSeed * 0.9;

    // Advance and wrap. GLSL mod() is floor-based, so this stays in
    // [-uDepth, 0) for any travel value, positive or negative.
    float z = p.z + uTravel * uTravelScale * layer;
    z = mod(z, uDepth) - uDepth;

    // Organic drift so nothing ever looks like a static point cloud.
    float t = uTime * (0.14 + aSeed * 0.22);
    p.x += sin(t + aSeed * 31.4) * uFloat * (1.0 + aSeed * 1.6);
    p.y += cos(t * 0.86 + aSeed * 17.7) * uFloat * (0.8 + aSeed * 1.4);

    // Lateral push, driven by the horizontal-scroll section.
    p.x += uDrift * layer;

    vec4 mv = modelViewMatrix * vec4(p.x, p.y, z, 1.0);
    float dist = -mv.z;

    // Fade in at the far plane and out as they pass the lens, so the modulo
    // wrap is completely invisible. This is the single most important line
    // for making an infinite tunnel look continuous.
    vAlpha =
      smoothstep(0.0, uDepth * 0.10, dist) *
      (1.0 - smoothstep(uDepth * 0.55, uDepth * 0.98, dist));

    // Slow twinkle — dust catching a candle.
    vSpark = 0.55 + 0.45 * sin(uTime * (0.8 + aSeed * 2.4) + aSeed * 62.8);
    vTint = aTint;

    gl_Position = projectionMatrix * mv;

    // Perspective attenuation + warp stretch during the fast section.
    float stretch = 1.0 + uWarp * 1.8;
    gl_PointSize = aScale * uSize * stretch * (140.0 / max(dist, 1.0));
  }
`;

export const particleFragmentShader = /* glsl */ `
  precision highp float;

  uniform vec3 uCore;
  uniform vec3 uGlow;
  uniform vec3 uDeep;
  uniform float uIntensity;
  uniform float uOpacity;

  varying float vAlpha;
  varying float vTint;
  varying float vSpark;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    if (d > 0.5) discard;

    // Two-term falloff: a wide soft halo plus a hot core. Additively blended
    // this reads as real bloom without paying for a post-processing pass.
    float falloff = 1.0 - smoothstep(0.0, 0.5, d);
    float halo = pow(falloff, 2.4);
    float core = pow(falloff, 9.0);

    vec3 col = mix(uGlow, uDeep, vTint);
    col = mix(col, uCore, core);

    float alpha = (halo * 0.5 + core * 0.95) * vAlpha * vSpark * uIntensity * uOpacity;

    gl_FragColor = vec4(col * (0.65 + core * 0.75), alpha);
  }
`;

/**
 * The invitation is one static route, so it ships as a fully pre-rendered
 * export — no server, deployable to GitHub Pages (or any bucket/CDN).
 *
 * On a GitHub *project* page the site is served from
 * `https://<user>.github.io/<repo>/`, so everything needs a base path. The CI
 * workflow sets NEXT_PUBLIC_BASE_PATH; locally it is empty and the site runs
 * at the root exactly as before.
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath,
  assetPrefix: basePath || undefined,
  // Pages serves directories, not extensionless files.
  trailingSlash: true,
  reactStrictMode: true,
  images: {
    // No Next image server exists in a static export.
    unoptimized: true,
  },
  // three ships untranspiled ESM examples; Next handles this natively but we
  // keep the package hint so the WebGL chunk is optimised, not duplicated.
  transpilePackages: ['three'],
  experimental: {
    optimizePackageImports: ['@react-three/drei'],
  },
};

export default nextConfig;

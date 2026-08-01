/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // three ships untranspiled ESM examples; Next handles this natively but we
  // keep the package hint so the WebGL chunk is optimised, not duplicated.
  transpilePackages: ['three'],
  experimental: {
    optimizePackageImports: ['@react-three/drei'],
  },
};

export default nextConfig;

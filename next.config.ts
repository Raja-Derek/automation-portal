import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Hasil build minimal untuk image Docker (lihat Dockerfile).
  output: "standalone",
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

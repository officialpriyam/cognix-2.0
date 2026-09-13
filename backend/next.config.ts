import type { NextConfig } from "next";
import path from "path";

const BUILD_OUTPUT = process.env.NEXT_STANDALONE_OUTPUT
  ? "standalone"
  : undefined;

export default (): NextConfig => {
  return {
    output: BUILD_OUTPUT,
    cleanDistDir: true,
    // The repo root contains sibling lockfiles (frontend/, root); pin Turbopack's
    // workspace root to this backend dir so it doesn't guess (and warn).
    turbopack: {
      root: path.join(import.meta.dirname),
    },
    // API server doesn't need these
    experimental: {
      taint: true,
      // Serialize static prerendering: Render's many-core CI machines spawn 40+
      // build workers, which trips a Next.js 16 prerender crash on /_global-error.
      cpus: 1,
    },
  };
};

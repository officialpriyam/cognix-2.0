import type { NextConfig } from "next";

const BUILD_OUTPUT = process.env.NEXT_STANDALONE_OUTPUT
  ? "standalone"
  : undefined;

export default (): NextConfig => {
  return {
    output: BUILD_OUTPUT,
    cleanDistDir: true,
    // API server doesn't need these
    experimental: {
      taint: true,
    },
  };
};

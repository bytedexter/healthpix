import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  experimental: {
    disableOptimizedLoading: true
  }
};

export default nextConfig;

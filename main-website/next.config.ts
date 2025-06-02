import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  experimental: {
    disableOptimizedLoading: true
  }
};

export default nextConfig;

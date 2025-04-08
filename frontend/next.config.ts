import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb', // or go full giga-chad with '100mb'
    },
  },
};

export default nextConfig;

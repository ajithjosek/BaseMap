import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  assetPrefix: process.env.CDN_URL || undefined,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:4001/:path*',
      },
    ];
  },
};

export default nextConfig;

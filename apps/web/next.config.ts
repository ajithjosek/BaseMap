import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

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

export default withNextIntl(nextConfig);
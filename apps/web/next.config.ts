import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

// The browser reaches the API through this rewrite. In local dev the API runs
// on localhost:4001; in Docker it is reachable at http://api:4000. Set
// API_INTERNAL_URL to override.
const apiInternalUrl = process.env.API_INTERNAL_URL || 'http://localhost:4001';

const nextConfig: NextConfig = {
  assetPrefix: process.env.CDN_URL || undefined,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${apiInternalUrl}/:path*`,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
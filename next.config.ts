import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverActions: {
      bodySizeLimit: "30mb",
    },
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
          { key: 'Access-Control-Allow-Origin', value: 'https://gcsufutkzbkjfygxvcpr.supabase.co' }, // For Supabase storage
          { key: 'Access-Control-Allow-Origin', value: 'https://assets.streampot.io' }, // For Streampot assets
        ],
      },
    ];
  },
};

export default nextConfig;

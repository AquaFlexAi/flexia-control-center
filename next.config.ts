import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:8000';

const nextConfig: NextConfig = {
  serverExternalPackages: ['dockerode', 'ssh2'],
  async rewrites() {
    return [
      {
        source: '/api/supabase/:path*',
        destination: `${supabaseUrl}/:path*`, // Proxy to Supabase
      },
    ];
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:8000';
const rpcUrl = process.env.NEXT_PUBLIC_BLOCKCHAIN_RPC_URL || 'http://localhost:8545';

const nextConfig: NextConfig = {
  serverExternalPackages: ['dockerode', 'ssh2'],

  turbopack: {
    // Add custom turbo options here if needed
  },

  async rewrites() {
    return [
      {
        source: '/api/supabase/:path*',
        destination: `${supabaseUrl}/:path*`, // Proxy to Supabase
      },
      {
        source: '/api/rpc/:path*',
        destination: rpcUrl, // Proxy to Hardhat Node
      },
    ];
  },
};

export default nextConfig;

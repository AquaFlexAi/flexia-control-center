import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  serverExternalPackages: ['dockerode', 'ssh2'],
  // @ts-ignore - Next.js 16+ config
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;

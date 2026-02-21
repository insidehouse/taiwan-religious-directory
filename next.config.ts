import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/taiwan-religious-directory',
  images: { unoptimized: true },
};

export default nextConfig;

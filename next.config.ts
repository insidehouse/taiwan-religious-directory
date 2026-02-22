import type { NextConfig } from "next";

const isStaticExport = process.env.STATIC_EXPORT === 'true'
const isGitHubPages = process.env.GITHUB_PAGES === 'true'

const nextConfig: NextConfig = {
  ...((isStaticExport || isGitHubPages) && { output: 'export' }),
  ...(isGitHubPages && { basePath: '/taiwan-religious-directory' }),
  images: { unoptimized: true },
};

export default nextConfig;

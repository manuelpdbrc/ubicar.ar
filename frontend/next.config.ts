import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  // trailingSlash: true is sometimes recommended for static exports to avoid 404s on refresh
  trailingSlash: true,
  // Disable image optimization because static exports do not support it natively
  images: {
    unoptimized: true,
  }
};

export default nextConfig;

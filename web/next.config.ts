import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // Static design mockups in public/mockups/: serve its index at the folder URL.
  async rewrites() {
    return [{ source: "/mockups", destination: "/mockups/index.html" }];
  },
};

export default nextConfig;

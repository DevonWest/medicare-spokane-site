import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Enable static export of known paths at build time
  // Additional paths are handled at request time
};

export default nextConfig;

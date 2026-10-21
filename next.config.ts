import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // "Users" was renamed to "Customers"; keep old links and bookmarks working.
  async redirects() {
    return [{ source: "/users", destination: "/customers", permanent: true }];
  },
};

export default nextConfig;

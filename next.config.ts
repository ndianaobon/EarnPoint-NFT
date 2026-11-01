import type { NextConfig } from "next";

const backendUrl = process.env.BACKEND_URL ?? "http://localhost:4000";

const nextConfig: NextConfig = {
  // The browser only ever talks to this site, so the login cookie stays first-party.
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${backendUrl}/api/:path*` }];
  },
};

export default nextConfig;

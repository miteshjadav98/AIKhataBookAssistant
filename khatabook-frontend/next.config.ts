import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:3000/:path*", // Proxy backend API requests
      },
      {
        source: "/ai-api/:path*",
        destination: "http://localhost:8000/:path*", // Proxy assistant requests
      },
    ];
  },
};

export default nextConfig;

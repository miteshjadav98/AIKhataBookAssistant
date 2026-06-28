import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow ngrok domains to connect to the dev server
  allowedDevOrigins: [
    "*.ngrok-free.app", 
    "*.ngrok-free.dev", 
    "*.ngrok.app", 
    "*.ngrok.io"
  ],
  experimental: {
    proxyTimeout: 300000, // 5 minutes (prevents socket hang up when AI takes too long)
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:3001/:path*", // Proxy backend API requests
      },
      {
        source: "/ai-api/:path*",
        destination: "http://localhost:8002/:path*", // Proxy assistant requests
      },
    ];
  },
};

export default nextConfig;

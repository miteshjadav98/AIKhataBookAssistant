import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow ngrok domains to connect to the dev server
  allowedDevOrigins: [
    "*.ngrok-free.app", 
    "*.ngrok-free.dev", 
    "*.ngrok.app", 
    "*.ngrok.io"
  ],
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:3000/:path*", // Proxy backend API requests
      },
      {
        source: "/ai-api/:path*",
        destination: "http://localhost:8002/:path*", // Proxy assistant requests
      },
    ];
  },
};

export default nextConfig;

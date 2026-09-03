import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "192.168.1.142",
    "192.168.1.142:3000",
    "192.168.1.36",
    "192.168.1.36:3000",
    "192.168.1.38",
    "192.168.1.38:3000",
    "localhost",
    "127.0.0.1",
  ],
  turbopack: {
    root: __dirname,
  },
  async rewrites() {
    return [
      {
        source: "/storage/:path*",
        destination: "http://localhost:5000/storage/:path*",
      },
    ];
  },
};

export default nextConfig;

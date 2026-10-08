import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server output for the production Docker image.
  // Vercel ignores this and uses its own build output.
  output: process.env.NEXT_OUTPUT === "standalone" ? "standalone" : undefined,
  poweredByHeader: false,
  images: {
    // Exercise demo photos come from the public-domain free-exercise-db dataset.
    remotePatterns: [
      { protocol: "https", hostname: "raw.githubusercontent.com", pathname: "/yuhonas/free-exercise-db/**" },
      { protocol: "https", hostname: "cdn.jsdelivr.net", pathname: "/gh/yuhonas/free-exercise-db@**" },
    ],
  },
  experimental: {
    // Food photos (Phase 2) are validated server-side; keep the action body limit explicit.
    serverActions: { bodySizeLimit: "8mb" },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;

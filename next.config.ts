import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  outputFileTracingIncludes: {
    "/api/parse-recipe": [
      "./runtime-tools/yt-dlp",
      "./runtime-tools/ffmpeg",
    ],
  },
};

export default nextConfig;

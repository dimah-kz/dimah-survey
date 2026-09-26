import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@dimah-survey/core",
    "@dimah-survey/react",
    "@dimah-survey/server",
  ],
  serverExternalPackages: ["@dimah-survey/db", "drizzle-orm", "fumadb"],
};

export default nextConfig;

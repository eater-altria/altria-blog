import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  transpilePackages: ["@opennextjs/cloudflare"],
  // Pin Turbopack to this project: a stray `package-lock.json` in $HOME otherwise makes
  // Next infer the wrong workspace root and resolve modules from /Users/<you>/node_modules.
  turbopack: {
    root: import.meta.dirname,
  },
};

export default nextConfig;

initOpenNextCloudflareForDev();

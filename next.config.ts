import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  transpilePackages: ["@opennextjs/cloudflare"],
};

export default nextConfig;

initOpenNextCloudflareForDev();

import type { NextConfig } from "next";

const config: NextConfig = {
  serverExternalPackages: [],
  experimental: { serverActions: { bodySizeLimit: "6mb" } },
};

export default config;

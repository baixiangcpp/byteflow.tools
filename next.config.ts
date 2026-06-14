import bundleAnalyzer from "@next/bundle-analyzer";
import path from "node:path";
import type { NextConfig } from "next";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  turbopack: {
    resolveAlias: {
      fs: "./src/lib/shims/empty-node-module.ts",
    },
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve = config.resolve || {};
      config.resolve.alias = {
        ...(config.resolve.alias || {}),
        fs: path.resolve("./src/lib/shims/empty-node-module.ts"),
      };
    }

    return config;
  },
};

export default withBundleAnalyzer(nextConfig);

const webpack = require("webpack");

module.exports = async () => {
  /** @type {import('next').NextConfig} */
  const nextConfig = {
    reactStrictMode: true
  }

  const { needleNext } = await import("@needle-tools/engine/plugins/webpack/index.js");
  const finalConfig = Object.assign(nextConfig,
    needleNext(nextConfig, {
      modules: {
        webpack
      }
    })
  );
  return finalConfig;
}


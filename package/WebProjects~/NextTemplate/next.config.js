const webpack = require("webpack");


/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["three", "peerjs", "@needle-tools/engine", "three-mesh-ui"],
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    config.plugins.push(definePlugin);
    return config;
  }
}


const definePlugin = new webpack.DefinePlugin({
  NEEDLE_ENGINE_META: {},
  NEEDLE_USE_RAPIER: true,
  parcelRequire: undefined,
});


module.exports = nextConfig;
const webpack = require("webpack");

module.exports = async () => {
  const { needleNext } = await import("@needle-tools/engine/plugins/next/index.js");
  return needleNext({}, { modules: { webpack } });
}


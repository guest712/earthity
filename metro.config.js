/**
 * Metro discovers `metro.config.js` before `.cjs`. Expo CLI watches this path.
 * Loading must stay `require`-friendly on Windows (no failed require → ESM import(E:\…)).
 */
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

/** `require.resolve('three/package.json')` throws: `package.json` is not in `exports`. */
let threeRoot = path.dirname(require.resolve('three'));
if (path.basename(threeRoot) === 'build') {
  threeRoot = path.dirname(threeRoot);
}
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules ?? {}),
  three: threeRoot,
};

const exts = new Set(config.resolver.assetExts);
['glb', 'gltf', 'bin', 'hdr', 'obj', 'mtl', 'fbx'].forEach((ext) => exts.add(ext));
config.resolver.assetExts = Array.from(exts);

module.exports = config;

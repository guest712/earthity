// Learn more: https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Register 3D asset extensions so Metro treats them as binary assets
// (required by @react-three/drei/native + @react-three/fiber/native loaders).
const exts = new Set(config.resolver.assetExts);
['glb', 'gltf', 'bin', 'hdr', 'obj', 'mtl', 'fbx'].forEach((ext) => exts.add(ext));
config.resolver.assetExts = Array.from(exts);

module.exports = config;

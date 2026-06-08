const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  resolver: {
    // Force Metro to use 'react-native' > 'browser' > 'main' fields in package.json
    // instead of the 'exports' field. This fixes axios v1.x which has an 'exports'
    // field that resolves to its Node.js dist (requires crypto/url/http built-ins
    // that don't exist in React Native's JS environment).
    unstable_enablePackageExports: false,
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);

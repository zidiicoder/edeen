const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  resolver: {
    resolveRequest: (context, moduleName, platform) => {
      // axios v1.x resolves to its Node.js dist (dist/node/axios.cjs) which
      // requires Node built-ins (crypto, url, http) not available in React Native.
      // Intercept and force the browser-safe build instead.
      if (moduleName === 'axios') {
        return {
          filePath: path.resolve(
            __dirname,
            'node_modules/axios/dist/browser/axios.cjs'
          ),
          type: 'sourceFile',
        };
      }
      // Default resolution for everything else
      return context.resolveRequest(context, moduleName, platform);
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);

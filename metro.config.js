const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

const customConfig = {
  projectRoot: path.resolve(__dirname),
  watchFolders: [path.resolve(__dirname, 'src')],
  resolver: {
    sourceExts: ['js', 'jsx', 'ts', 'tsx', 'json'],
  },
};

module.exports = mergeConfig(defaultConfig, customConfig);

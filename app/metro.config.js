const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add .cjs extension support for Firebase
config.resolver.sourceExts = [...config.resolver.sourceExts, 'cjs'];

module.exports = config;

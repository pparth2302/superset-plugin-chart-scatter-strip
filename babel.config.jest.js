const { getConfig } = require('@airbnb/config-babel');

const config = getConfig({
  library: true,
  react: true,
  next: true,
  node: true,
  typescript: true,
  env: {
    targets: { node: 'current' },
  },
});

config.ignore = [];
config.plugins = [
  ['babel-plugin-transform-dev', { evaluate: false }],
  ['babel-plugin-typescript-to-proptypes', { loose: true }],
  ['@babel/plugin-proposal-class-properties', { loose: true }],
];

module.exports = config;

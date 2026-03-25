module.exports = {
  moduleFileExtensions: ['mock.js', 'ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleNameMapper: {
    '^@superset-ui/core$': '<rootDir>/test/__mocks__/supersetCore.ts',
    '^@superset-ui/chart-controls$':
      '<rootDir>/test/__mocks__/supersetChartControls.ts',
    '\\.(gif|ttf|eot|png|jpg)$': '<rootDir>/test/__mocks__/mockExportString.js',
  },
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.[jt]sx?$': ['babel-jest', { configFile: './babel.config.jest.js' }],
  },
};

module.exports = {
  testEnvironment: 'node',
  testRunner: require('path').join(__dirname, 'scripts', 'jest-runner.js'),
  transform: {
    '^.+\\.[jt]sx?$': ['babel-jest', { presets: ['@babel/preset-env', '@babel/preset-react'] }],
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: ['node_modules/(?!(uuid|node-fetch|data-uri-to-buffer|fetch-blob|formdata-polyfill)/)'],
  moduleFileExtensions: ['js', 'jsx'],
  testMatch: [
    '<rootDir>/src/**/*.test.js',
    '<rootDir>/src/**/*.test.jsx',
    '<rootDir>/src/__tests__/**/*.js',
  ],
};

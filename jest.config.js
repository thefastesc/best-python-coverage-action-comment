module.exports = {
  clearMocks: true,
  moduleFileExtensions: ['js', 'ts'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', {tsconfig: 'tsconfig.test.json'}],
    '^.+\\.js$': ['ts-jest', {useESM: true, tsconfig: 'tsconfig.test.json'}]
  },
  transformIgnorePatterns: ['node_modules/(?!(markdown-table)/)'],
  verbose: true
}

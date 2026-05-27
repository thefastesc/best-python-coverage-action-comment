module.exports = {
  clearMocks: true,
  moduleFileExtensions: ['js', 'ts'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
    '^.+\\.js$': ['ts-jest', {useESM: true}]
  },
  transformIgnorePatterns: ['node_modules/(?!(markdown-table)/)'],
  verbose: true
}

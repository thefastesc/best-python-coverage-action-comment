// @ts-check
const tsPlugin = require('@typescript-eslint/eslint-plugin')
const tsParser = require('@typescript-eslint/parser')
const githubPlugin = require('eslint-plugin-github').default
const jestPlugin = require('eslint-plugin-jest')

const githubFlatConfigs = githubPlugin.getFlatConfigs()
const githubTypescriptConfigs = githubFlatConfigs.typescript

module.exports = [
  // Replaces .eslintignore
  {
    ignores: ['dist/**', 'lib/**', 'node_modules/**', 'jest.config.js'],
  },

  // GitHub recommended base rules + plugins (prettier, eslint-comments, import, etc.)
  githubFlatConfigs.recommended,

  // GitHub TypeScript config (sets up @typescript-eslint parser + recommended TS rules)
  ...githubTypescriptConfigs,

  // Jest globals and recommended rules for test files.
  // No parserOptions.project — test files are excluded from tsconfig.json.
  {
    files: ['src/**/*.test.ts'],
    ...jestPlugin.configs['flat/recommended'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 9,
        sourceType: 'module',
      },
    },
    rules: {
      ...jestPlugin.configs['flat/recommended'].rules,
      'i18n-text/no-en': 'off',
      'import/no-namespace': 'off',
      'import/no-commonjs': 'off',
    },
  },

  // Project-specific TypeScript rules for non-test source files
  {
    files: ['src/**/*.ts'],
    ignores: ['src/**/*.test.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 9,
        sourceType: 'module',
        project: './tsconfig.json',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      // Override/disable rules from github/recommended that don't apply here
      'eslint-comments/no-use': 'off',
      'i18n-text/no-en': 'off',
      'import/no-namespace': 'off',
      'import/no-commonjs': 'off',

      // TypeScript-specific rules
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/explicit-member-accessibility': ['error', {accessibility: 'no-public'}],
      '@typescript-eslint/no-require-imports': 'error',
      '@typescript-eslint/array-type': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/ban-ts-comment': 'error',
      camelcase: 'off',
      '@typescript-eslint/consistent-type-assertions': 'error',
      '@typescript-eslint/explicit-function-return-type': ['error', {allowExpressions: true}],
      '@typescript-eslint/no-array-constructor': 'error',
      '@typescript-eslint/no-empty-interface': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-extraneous-class': 'error',
      '@typescript-eslint/no-for-in-array': 'error',
      '@typescript-eslint/no-inferrable-types': 'error',
      '@typescript-eslint/no-misused-new': 'error',
      '@typescript-eslint/no-namespace': 'error',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/no-unnecessary-qualifier': 'error',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/no-useless-constructor': 'error',
      '@typescript-eslint/prefer-for-of': 'warn',
      '@typescript-eslint/prefer-function-type': 'warn',
      '@typescript-eslint/prefer-includes': 'error',
      '@typescript-eslint/prefer-string-starts-ends-with': 'error',
      '@typescript-eslint/promise-function-async': 'error',
      '@typescript-eslint/require-array-sort-compare': 'error',
      '@typescript-eslint/restrict-plus-operands': 'error',
      // type-annotation-spacing, func-call-spacing and semi were removed from
      // @typescript-eslint v8 (moved to @stylistic). Prettier covers these instead.
      '@typescript-eslint/unbound-method': 'error',
    },
  },

  // scorePr.test.ts uses camelCase — exempt it from the kebab-case filename rule
  {
    files: ['src/scorePr.test.ts'],
    rules: {'github/filenames-match-regex': 'off'},
  },
]

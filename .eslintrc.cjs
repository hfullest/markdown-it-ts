/** @type {import('eslint').ESLint.ConfigData} */
module.exports = {
  root: true,
  env: { browser: false, es2020: true },
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  ignorePatterns: ['dist', '.eslintrc.js', 'example'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 2021,
  },
  rules: {
    'no-unused-vars': 'error',
    '@typescript-eslint/no-namespace': 'off',
  },
};

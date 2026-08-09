import eslint from '@eslint/js';

export default [
  {
    ignores: ['**/*.ts', '.output/**', '.wxt/**', 'coverage/**', 'node_modules/**'],
  },
  eslint.configs.recommended,
  {
    files: ['scripts/**/*.mjs'],
    languageOptions: {
      globals: {
        console: 'readonly',
        process: 'readonly',
        URL: 'readonly',
      },
    },
  },
  {
    files: ['docs/**/*.js'],
    languageOptions: {
      globals: {
        document: 'readonly',
      },
    },
  },
];

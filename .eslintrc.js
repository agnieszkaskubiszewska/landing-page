module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['playwright', 'prettier'],
  extends: ['plugin:playwright/recommended', 'plugin:prettier/recommended'],
  rules: {
    'playwright/expect-expect': [
      'error',
      {
        assertFunctionNames: ['expect', 'expect*', 'page.waitForURL'],
      },
    ],
    'playwright/no-force-option': 'warn',
    'playwright/no-wait-for-timeout': 'warn',
    'playwright/no-conditional-in-test': 'warn',
    'playwright/no-networkidle': 'warn',
    'prettier/prettier': 'error',
  },
};

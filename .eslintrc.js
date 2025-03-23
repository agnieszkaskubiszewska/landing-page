module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['playwright'],
  extends: ['plugin:playwright/recommended'],
  rules: {
    'playwright/expect-expect': ['error', {
      assertFunctionNames: ['expect', 'expect*', 'page.waitForURL']
    }],
    'playwright/no-force-option': 'warn',
    'playwright/no-wait-for-timeout': 'warn',
    'playwright/no-conditional-in-test': 'warn',
    'playwright/no-networkidle': 'warn'
  }
}; 
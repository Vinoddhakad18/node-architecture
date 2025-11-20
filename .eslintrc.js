module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
    ecmaVersion: 2022,
  },
  plugins: ['@typescript-eslint', 'import', 'prettier'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/typescript',
    'plugin:prettier/recommended',
  ],
  env: {
    node: true,
    jest: true,
    es2022: true,
  },
  ignorePatterns: ['dist', 'node_modules', 'coverage', '*.js', '!.eslintrc.js'],
  rules: {
    // TypeScript specific rules
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/no-misused-promises': 'off', // Disabled
    '@typescript-eslint/await-thenable': 'error',
    '@typescript-eslint/require-await': 'off',
    '@typescript-eslint/no-unnecessary-type-assertion': 'off',
    '@typescript-eslint/prefer-nullish-coalescing': 'off',
    '@typescript-eslint/prefer-optional-chain': 'off',
    '@typescript-eslint/strict-boolean-expressions': 'off',
    '@typescript-eslint/no-unsafe-member-access': 'off',
    '@typescript-eslint/no-unsafe-assignment': 'off',
    '@typescript-eslint/no-unsafe-call': 'off',
    '@typescript-eslint/no-unsafe-return': 'off',
    '@typescript-eslint/no-unsafe-argument': 'off',
    '@typescript-eslint/naming-convention': 'off', // Disabled for flexibility
    '@typescript-eslint/restrict-template-expressions': 'off', // Allow more flexible template expressions
    '@typescript-eslint/unbound-method': 'off', // Disabled for Jest compatibility
    '@typescript-eslint/no-var-requires': 'off', // Allow require in config files
    '@typescript-eslint/no-non-null-assertion': 'off', // Allow non-null assertions

    // Import rules
    'import/order': 'off', // Disabled
    'import/no-unresolved': 'off', // Disabled due to resolver compatibility issues
    'import/no-cycle': 'off',      // Disabled due to resolver compatibility issues
    'import/no-duplicates': 'off', // Disabled
    'import/export': 'off', // Disabled
    'import/no-named-as-default': 'off', // Disabled
    'import/no-named-as-default-member': 'off', // Disabled

    // General rules
    'no-console': 'off',
    'no-debugger': 'error',
    'no-duplicate-imports': 'off', // Disabled
    'no-unused-expressions': 'error',
    'prefer-const': 'error',
    'no-var': 'error',
    eqeqeq: ['error', 'always'],
    curly: ['error', 'all'],
    '@typescript-eslint/no-namespace': 'off', // Allow namespaces
    '@typescript-eslint/restrict-plus-operands': 'off', // More lenient

    // Prettier integration
    'prettier/prettier': 'error',
  },
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.ts', '.json'],
        moduleDirectory: ['node_modules', 'src'],
      },
    },
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts'],
    },
    'import/extensions': ['.js', '.ts'],
  },
};

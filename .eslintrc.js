module.exports = {
  parser: '@typescript-eslint/parser', // Specifies the ESLint parser
  parserOptions: {
    ecmaVersion: 2021, // Allows for the parsing of modern ECMAScript features
    sourceType: 'module', // Allows for the use of imports
    project: './tsconfig.json', // Important for rules that require type information
  },
  extends: [
    'plugin:@typescript-eslint/recommended', // Uses the recommended rules from @typescript-eslint/eslint-plugin
    'plugin:prettier/recommended', // Enables eslint-plugin-prettier and displays prettier errors as ESLint errors. Make sure this is always the last configuration in the extends array.
  ],
  plugins: [
    '@typescript-eslint',
    // 'prettier' is included by 'plugin:prettier/recommended'
  ],
  env: {
    browser: true, // Browser global variables.
    es2021: true,
    jest: true, // Jest global variables.
    node: true, // Node.js global variables and Node.js scoping (for config files etc).
  },
  rules: {
    // Place to specify ESLint rules. Can be used to overwrite rules specified from the extended configs.
    // e.g., "@typescript-eslint/explicit-function-return-type": "warn",
    "@typescript-eslint/no-explicit-any": "error", // Ensure no 'any' types are used
    "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
    // Add other custom rules here
  },
  ignorePatterns: [
     "dist/**/*.js", // Ignore compiled JS in dist
     "node_modules/",
     "coverage/",
     "jest.config.js", // Often not linted
     ".eslintrc.js",   // This file itself
     // other dotfiles or generated files
  ]
};

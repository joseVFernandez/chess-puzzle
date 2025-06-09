/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom', // Use jsdom to simulate browser environment for DOM testing
  setupFilesAfterEnv: ['@testing-library/jest-dom'], // Extends Jest with DOM-specific matchers
  moduleNameMapper: {
    // If you have module aliases in tsconfig.json, map them here
    // Example: '^@components/(.*)$': '<rootDir>/src/components/$1'
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.json', // Ensure ts-jest uses your tsconfig
    }],
  },
  // Optional: Collect coverage
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageProvider: 'v8', // or 'babel'
  collectCoverageFrom: [
    'js/**/*.ts', // Files to include in coverage
    '!js/**/*.d.ts', // Exclude declaration files
  ],
  testMatch: [ // Pattern to find test files
     "**/tests/**/*.ts", // Look for .ts files in any subdirectory of tests/
     "!**/tests/old_tests.ts" // Example: Exclude a specific old test file if needed
  ]
};

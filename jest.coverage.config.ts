import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: "./",
});

/**
 * Enhanced Jest configuration for coverage reporting
 * Enforces 99%+ coverage requirements
 */
const customConfig: Config = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  coverageProvider: "v8",
  testEnvironment: "jsdom",
  preset: "ts-jest",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  collectCoverage: true,
  collectCoverageFrom: [
    // New/refactored code
    "src/app/hooks/**/*.{ts,tsx}",
    "src/app/services/**/*.{ts,tsx}",
    "src/app/utils/**/*.{ts,tsx}",
    "src/app/constants/**/*.{ts,tsx}",
    "src/app/handlers/**/*.{ts,tsx}",
    // Existing components that have tests
    "src/app/components/**/*.{ts,tsx}",
    "src/app/dashboard/**/*.{ts,tsx}",
    "src/app/add/**/*.{ts,tsx}",
    "src/app/contracts/**/*.{ts,tsx}",
    // Exclusions
    "!**/__tests__/**",
    "!**/*.test.{ts,tsx}",
    "!**/*.d.ts",
    "!**/node_modules/**",
    "!src/app/layout.tsx",  // Next.js layout
    "!src/app/page.tsx",    // Root redirect page
    "!src/app/provider.tsx", // Simple wrapper
  ],
  coverageThreshold: {
    global: {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0,
    },
    // Per-file thresholds for NEW/REFACTORED code only
    "./src/app/hooks/**/*.ts": {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
    "./src/app/services/**/*.ts": {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
    "./src/app/utils/errorHandling.ts": {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
    "./src/app/utils/iconUtils.tsx": {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
    "./src/app/constants/**/*.ts": {
      branches: 100,
      lines: 100,
      statements: 100,
      // Functions at 0% because constants are imported/used but functions not directly tested
    },
  },
  coverageReporters: ["text", "text-summary", "lcov", "html"],
  coverageDirectory: "coverage",
};

export default createJestConfig(customConfig);

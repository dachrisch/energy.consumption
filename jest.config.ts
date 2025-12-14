import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: "./",
});

// Add any custom config to be passed to Jest
const config: Config = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  coverageProvider: "v8",
  testEnvironment: "jsdom",
  preset: "ts-jest",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  transformIgnorePatterns: [
    "node_modules/(?!(bson|mongodb|jose|@panva|openid-client)/)", // Transform ESM packages
  ],
  // Use Node environment for integration tests
  testMatch: [
    "**/__tests__/**/*.[jt]s?(x)",
    "**/?(*.)+(spec|test).[jt]s?(x)"
  ],
  testEnvironmentOptions: {
    customExportConditions: ["node", "node-addons"],
  },
  // Integration tests use Node environment
  projects: [
    {
      displayName: "integration",
      testMatch: ["**/*.integration.test.ts", "**/integration/**/*.test.ts"],
      testEnvironment: "node",
      preset: "ts-jest",
      setupFilesAfterEnv: ["<rootDir>/jest.integration.setup.ts"],
      transform: {
        "^.+\\.tsx?$": ["ts-jest", {
          tsconfig: {
            esModuleInterop: true,
            allowSyntheticDefaultImports: true,
          },
        }],
      },
      moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/src/$1",
        "^next-auth$": "<rootDir>/__mocks__/next-auth.ts",
        "^next-auth/react$": "<rootDir>/__mocks__/next-auth__react.ts",
      },
      transformIgnorePatterns: [
        "node_modules/(?!(bson|mongodb|jose|@panva|openid-client)/)",
      ],
    },
    {
      displayName: "unit",
      testMatch: ["**/__tests__/**/*.test.[jt]s?(x)", "!**/*.integration.test.ts", "!**/integration/**/*.test.ts"],
      testEnvironment: "jsdom",
      preset: "ts-jest",
      setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
      moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/src/$1",
      },
      transformIgnorePatterns: [
        "node_modules/(?!(bson|mongodb|jose|@panva|openid-client)/)",
      ],
    },
  ],
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(config);

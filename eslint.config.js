import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import js from "@eslint/js";
import globals from "globals";

export default [
  js.configs.recommended,
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "dist-server/**",
      "coverage/**",
      ".next/**",
      "scripts/**",
      "healthcheck.js"
    ],
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
        "Show": "readonly",
        "For": "readonly",
        "Switch": "readonly",
        "Match": "readonly",
        "Portal": "readonly",
        "Dynamic": "readonly",
        "Component": "readonly",
        "ParentComponent": "readonly",
        "VoidComponent": "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      "complexity": ["error", { "max": 10 }],
      "max-lines-per-function": ["warn", { "max": 100, "skipBlankLines": true, "skipComments": true }],
      "max-depth": ["error", { "max": 3 }],
      "max-params": ["warn", { "max": 4 }],
      "no-console": ["warn", { "allow": ["warn", "error"] }],
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": ["error", {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
        "caughtErrorsIgnorePattern": "^_"
      }],
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/no-explicit-any": "error",
      "prefer-const": "error",
      "no-var": "error",
      "eqeqeq": ["error", "always"],
      "curly": ["error", "all"]
    },
  },
  {
    files: ["src/**/*.test.{ts,tsx}", "src/**/__tests__/**"],
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
];
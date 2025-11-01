import { dirname } from "path";
import { fileURLToPath } from "url";
import { globalIgnores } from "eslint/config";

import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const __filename = fileURLToPath(import.meta.url);
const _dirname = dirname(__filename);

const eslintConfig = [...nextCoreWebVitals, ...nextTypescript, globalIgnores([
      "src/lib/pond/*", // ignore its content
  ]), {
  ignores: ["node_modules/**", ".next/**", "out/**", "build/**", "next-env.d.ts", "coverage/**", "scripts/**"]
}, {
  rules: {
    "@typescript-eslint/no-unused-vars": ["error", {
      "argsIgnorePattern": "^_",
      "varsIgnorePattern": "^_",
      "caughtErrorsIgnorePattern": "^_"
    }],
    "react-hooks/set-state-in-effect": "off"
  }
}];

export default eslintConfig;

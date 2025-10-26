import { dirname } from "path";
import { fileURLToPath } from "url";
import { globalIgnores } from "eslint/config";

import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const __filename = fileURLToPath(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const __dirname = dirname(__filename);

const eslintConfig = [...nextCoreWebVitals, ...nextTypescript, globalIgnores([
      "src/lib/pond/*", // ignore its content
  ]), {
  ignores: ["node_modules/**", ".next/**", "out/**", "build/**", "next-env.d.ts"]
}];

export default eslintConfig;

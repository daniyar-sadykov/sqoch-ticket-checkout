import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Сквозные тесты это не React. Фикстура Playwright отдаёт значение тесту
  // вызовом `use()`, и правило хуков принимает его за хук React: имя то же,
  // а проверить, что это за `use`, правило не умеет. В `e2e/` React нет вовсе,
  // поэтому правило там просто выключено.
  {
    files: ["e2e/**/*.ts"],
    rules: { "react-hooks/rules-of-hooks": "off" },
  },
  // Умолчания eslint-config-next по пропускаемым путям переопределяются здесь.
  globalIgnores([
    // Что пропускает eslint-config-next по умолчанию:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;

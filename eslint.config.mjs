import js from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import prettier from "eslint-config-prettier";

export default [
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "build/**",
      ".expo/**",
      "android/**",
      "ios/**",
      "commitlint.config.cjs",
      "babel.config.js",
      "nativewind-env.d.ts",
      "metro.config.js",
      "tailwind.config.js",
      "src/api/generated/**",
    ],
  },
  js.configs.recommended,
  prettier,
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    languageOptions: {
      globals: {
        require: "readonly",
        process: "readonly",
        fetch: "readonly",
        clearTimeout: "readonly",
        setTimeout: "readonly",
        FormData: "readonly",
        console: "readonly",
        Blob: "readonly",
      },
      parser: tsParser,
      ecmaVersion: "latest",
      sourceType: "module",
    },
    plugins: {
      "@typescript-eslint": tseslint,
    },
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "warn",
      "no-console": "off",
    },
  },
];

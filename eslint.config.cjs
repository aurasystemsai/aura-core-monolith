/**
 * Minimal ESLint flat config for the monolith (backend + tests).
 */

module.exports = [
  {
    ignores: [
      "node_modules",
      "aura-console/**",
      "dist/**",
      "build/**",
      "coverage/**",
      // Known legacy routers with placeholder code; excluded from lint for now.
      "src/tools/ab-testing-suite/router.js",
      "src/tools/internal-linking-suggestions/router.js",
      "src/tools/link-intersect-outreach/router.js",
      "src/tools/local-seo-toolkit/router.js",
      "src/tools/personalization-recommendation-engine/router.js",
      "src/tools/returns-rma-automation/reporting-alerts/router.js",
    ]
  },
  {
    files: ["src/**/*.js", "src/**/*.jsx"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        console: "readonly",
        module: "readonly",
        require: "readonly",
        __dirname: "readonly",
        process: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        describe: "readonly",
        test: "readonly",
        it: "readonly",
        expect: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
      },
    },
    rules: {},
  },
];

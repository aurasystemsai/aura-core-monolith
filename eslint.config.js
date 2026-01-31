/**
 * Minimal ESLint flat config for the monolith (backend + tests).
 * CommonJS wrapper to avoid ESM loading issues.
 */
module.exports = require("./eslint.config.cjs");

// src/tools/_stub-tool.js
// Generic fallback tool factory (non-stub): echoes payload with diagnostics
const { randomUUID } = require("crypto");

module.exports = function makeFallbackTool(key) {
  return {
    key,
    meta: {
      id: key,
      name: `Fallback handler for ${key}`,
      description:
        "Generic fallback handler that safely echoes input with diagnostics.",
    },
    async run(input = {}, ctx = {}) {
      const correlationId = input.correlationId || randomUUID();
      const receivedAt = new Date().toISOString();
      const environment = (ctx.env && ctx.env.NODE_ENV) || process.env.NODE_ENV || "development";

      return {
        ok: true,
        tool: key,
        correlationId,
        environment,
        received: input,
        diagnostics: {
          receivedAt,
          handler: "fallback",
          source: ctx.source || "aura-core",
        },
        message: "Fallback handler executed successfully.",
      };
    },
  };
};

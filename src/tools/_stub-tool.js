// src/tools/_stub-tool.js
// Factory for placeholder tools so routes don't 404

module.exports = function makeStubTool(key) {
  return {
    key,
    /**
     * Generic stub handler.
     * Later we can replace with a real implementation per tool.
     */
    async run(input = {}, ctx = {}) {
      return {
        ok: true,
        tool: key,
        mode: "stub",
        received: input,
        context: {
          source: "AURA Core API",
          env: process.env.NODE_ENV || "dev",
        },
        message: `Stub implementation for "${key}". Endpoint is wired and working, but business logic is not built yet.`,
      };
    },
  };
};

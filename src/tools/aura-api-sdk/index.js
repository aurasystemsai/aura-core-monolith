// src/tools/aura-api-sdk/index.js
// ===============================================
// AURA • API SDK helper (rule-based)
// ===============================================

const key = "aura-api-sdk";

async function run(input = {}, ctx = {}) {
  const env = ctx.environment || process.env.NODE_ENV || "development";
  const now = new Date().toISOString();

  const baseUrl =
    input.baseUrl ||
    ctx.coreBaseUrl ||
    process.env.AURA_CORE_BASE_URL ||
    "http://localhost:4999";

  return {
    ok: true,
    tool: key,
    environment: env,
    message: "SDK configuration snippet generated.",
    input,
    output: {
      baseUrl,
      exampleNodeSnippet: `const axios = require("axios");
async function runTool(toolId, payload) {
  const res = await axios.post("${baseUrl}/run/" + toolId, payload);
  return res.data;
}`,
    },
    meta: {
      engine: "internal-rule-engine-v1",
      generatedAt: now,
    },
  };
}

module.exports = { key, run };

// src/test-all-tools.js
// ===============================================
// Quick health-check runner for ALL AURA tools.
// - Reads tool IDs from core/tools-registry
// - Calls Core API /run/:toolId for each tool
// - Prints per-tool status and a summary at the end
// ===============================================

const axios = require("axios");
const toolsRegistry = require("./core/tools-registry");

// Base URL for Core API (same one the console uses)
const CORE_BASE_URL = (
  process.env.AURA_CORE_BASE_URL ||
  process.env.CORE_API_BASE_URL ||
  "http://localhost:4999"
).replace(/\/+$/, "");

// ---- single tool tester ----
async function testTool(toolId) {
  const url = `${CORE_BASE_URL}/run/${toolId}`;

  // If a tool module exports exampleInput we’ll use it, otherwise `{}`.
  const mod = toolsRegistry[toolId] || {};
  const payload = mod.exampleInput || {};

  try {
    const start = Date.now();
    const res = await axios.post(url, payload, { timeout: 15000 });
    const ms = Date.now() - start;

    if (!res.data || res.data.ok === false) {
      console.log(`❌ ${toolId}  (${ms} ms)`);
      console.log("    ->", res.data);
      return { id: toolId, ok: false, ms, data: res.data };
    }

    console.log(`✅ ${toolId}  ${ms} ms`);
    return { id: toolId, ok: true, ms, data: res.data };
  } catch (err) {
    console.log(`❌ ${toolId}  ERROR`);
    console.log("    ->", err.message);
    return { id: toolId, ok: false, error: err };
  }
}

// ---- main runner ----
async function main() {
  console.log("");
  console.log("========================================");
  console.log(" AURA Core API – test all tools");
  console.log(" Base URL:", CORE_BASE_URL);
  console.log("========================================");

  const toolIds = Object.keys(toolsRegistry || {});
  if (!toolIds.length) {
    console.log("No tools found in tools-registry.");
    process.exit(1);
  }

  const results = [];
  for (const id of toolIds) {
    // run sequentially so logs are readable
    // eslint-disable-next-line no-await-in-loop
    const r = await testTool(id);
    results.push(r);
  }

  const passed = results.filter((r) => r.ok).length;
  const failed = results.length - passed;

  console.log("");
  console.log("========================================");
  console.log(`Tools tested : ${results.length}`);
  console.log(`Passed       : ${passed}`);
  console.log(`Failed       : ${failed}`);
  console.log("========================================");

  process.exit(failed === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error("Unexpected error in test-all-tools:", err);
  process.exit(1);
});

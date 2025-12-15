// src/core/tools-registry.cjs
// ----------------------------------------
// Central registry for all AURA Core tools
// ----------------------------------------

// Each require pulls in a tool folder that exports { meta, run }
const productSeo = require("../tools/product-seo");
const blogSeo = require("../tools/blog-seo");

// Later we can add more tools here in exactly the same way:
// const someOtherTool = require("../tools/some-other-tool");

const allTools = [
  productSeo,
  blogSeo,
];

// Build a lookup map by tool meta.id
const toolsById = {};

for (const tool of allTools) {
  if (!tool || !tool.meta || !tool.meta.id || typeof tool.run !== "function") {
    console.warn("[ToolsRegistry] Skipping invalid tool export");
    continue;
  }

  if (toolsById[tool.meta.id]) {
    console.warn(
      `[ToolsRegistry] Duplicate tool id '${tool.meta.id}' – keeping the first registration`
    );
    continue;
  }

  toolsById[tool.meta.id] = tool;
}

console.log("[ToolsRegistry] Registered tools:", Object.keys(toolsById));

/**
 * Lookup a tool by ID.
 * Throws if the tool is not registered.
 */
function getTool(toolId) {
  const tool = toolsById[toolId];

  if (!tool) {
    throw new Error(`Unknown tool: ${toolId}`);
  }

  return tool;
}

/**
 * Optional helper if we ever want to show a tool list in the console.
 */
function listTools() {
  return Object.values(toolsById).map((tool) => ({
    id: tool.meta.id,
    name: tool.meta.name,
    category: tool.meta.category,
    description: tool.meta.description,
    version: tool.meta.version,
  }));
}

module.exports = {
  toolsById,
  getTool,
  listTools,
};

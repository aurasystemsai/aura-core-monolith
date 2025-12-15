// src/core/tools-registry.cjs
// ----------------------------------------
// Central registry for all AURA tools
// ----------------------------------------

const productSeo = require("../tools/product-seo");
const blogSeo = require("../tools/blog-seo"); // NEW
// Register tools by ID (tool.meta.id)
const toolsById = {
  [productSeo.meta.id]: productSeo,
// src/core/tools-registry.cjs
// ----------------------------------------
// Central registry for all AURA Core tools
// ----------------------------------------

// Import each tool module here.
// Each tool should export at least:
//   - meta: { id, name, category, description, ... }
//   - run: async (input, ctx) => { ... }

const productSeo = require("../tools/product-seo");
const blogSeo = require("../tools/blog-seo");

// If/when you add more tools later, require them like this:
// const someOtherTool = require("../tools/some-other-tool");

// ----------------------------------------
// Build the registry
// ----------------------------------------

const tools = [
  productSeo,
  blogSeo,
  // someOtherTool,
];

const toolsById = Object.create(null);

for (const tool of tools) {
  if (!tool || !tool.meta || !tool.meta.id || typeof tool.run !== "function") {
    console.warn(
      "[ToolsRegistry] Skipping invalid tool definition:",
      tool && tool.meta ? tool.meta.id : tool
    );
    continue;
  }

  const id = tool.meta.id;

  if (toolsById[id]) {
    console.warn(
      `[ToolsRegistry] Duplicate tool id detected: "${id}". Skipping later definition.`
    );
    continue;
  }

  toolsById[id] = tool;
}

console.log(
  "[ToolsRegistry] Registered tools:",
  Object.keys(toolsById).join(", ") || "(none)"
);

// ----------------------------------------
// Public API
// ----------------------------------------

/**
 * Lookup a tool by ID.
 * Throws if the tool is not registered.
 *
 * Used by: /run/:toolId in src/server.js
 */
function getTool(toolId) {
  const tool = toolsById[toolId];

  if (!tool) {
    throw new Error(`Unknown tool: ${toolId}`);
  }

  return tool;
}

/**
 * Optional helper: return a light list of tools
 * (handy for showing a UI list in the console later).
 */
function listTools() {
  return Object.keys(toolsById).map((id) => {
    const t = toolsById[id];
    const meta = t.meta || {};
    return {
      id,
      name: meta.name || id,
      category: meta.category || "Uncategorised",
      description: meta.description || "",
      version: meta.version || "1.0.0",
    };
  });
}

module.exports = {
  toolsById,
  getTool,
  listTools,
};


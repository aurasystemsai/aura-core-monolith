// src/core/tools-registry.cjs
// ----------------------------------------
// Central registry for all AURA tools
// ----------------------------------------

const productSeo = require("../tools/product-seo");

// Register tools by ID (tool.meta.id)
const toolsById = {
  [productSeo.meta.id]: productSeo,
};

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

module.exports = {
  toolsById,
  getTool,
};

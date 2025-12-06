// src/tools/aura-api-sdk/index.js
// ------------------------------------------
// Returns SDK-style helper docs for the Core API
// ------------------------------------------

module.exports = {
  key: "aura-api-sdk",
  name: "AURA API SDK Helper",

  async run(input = {}, ctx = {}) {
    const baseUrl = input.base_url || "http://localhost:4999";

    return {
      ok: true,
      tool: "aura-api-sdk",
      base_url: baseUrl,
      examples: {
        node: `// npm install axios
const axios = require("axios");

async function runTool(toolKey, payload) {
  const res = await axios.post("${baseUrl}/run/" + toolKey, payload, {
    timeout: 20000,
  });
  return res.data;
}

// Example:
runTool("product-seo", {
  product_name: "18K Gold Waterproof Necklace",
});`,
        curl: `curl -X POST "${baseUrl}/run/product-seo" \\
  -H "Content-Type: application/json" \\
  -d '{ "product_name": "18K Gold Waterproof Necklace" }'`,
      },
      note:
        "This is a helper tool that just returns code snippets for calling the AURA Core API.",
    };
  },
};

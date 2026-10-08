// Image Alt Text: scans real product images, writes alt text with AI on request, applies it to Shopify.
// The work happens in router.js; run() is the registry entry point.
const key = "image-alt-media-seo";

async function run() {
  return { ok: true, tool: key, message: "Use the /api/image-alt-media-seo endpoints: GET /images, POST /generate, POST /apply." };
}

module.exports = { key, run };

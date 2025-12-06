// src/tools/image-alt-media-seo/index.js
// --------------------------------------
// Generates SEO hints for images and media
// --------------------------------------

function safe(v) {
  if (v === undefined || v === null) return "";
  return String(v).trim();
}

module.exports = {
  key: "image-alt-media-seo",
  name: "Image & Media SEO Helper",

  async run(input = {}, ctx = {}) {
    const pageUrl = safe(input.page_url || "");
    const topic = safe(input.topic || input.product_name || "product");
    const primaryKeyword = safe(input.keyword || "");

    const fileNameSuggestion = topic
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const suggestions = [
      "Avoid generic filenames like IMG_1234.jpg.",
      "Compress images before uploading to keep pages fast.",
      "Set descriptive alt text that matches the page topic.",
    ];

    if (primaryKeyword) {
      suggestions.push(
        `Use the primary keyword "${primaryKeyword}" in 1–2 image filenames and alts where natural.`
      );
    }

    return {
      ok: true,
      tool: "image-alt-media-seo",
      page_url: pageUrl || null,
      topic,
      primary_keyword: primaryKeyword || null,
      file_name_example: `${fileNameSuggestion || "product"}-1.jpg`,
      suggestions,
    };
  },
};

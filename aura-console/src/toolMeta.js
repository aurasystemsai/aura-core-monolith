// aura-console/src/toolMeta.js
// Default export for all Automation Console tools

const toolsMeta = [
  {
    id: "product-seo",
    name: "Product SEO Engine",
    category: "SEO",
    tag: "SEO",
    description:
      "Generate SEO titles, descriptions, slugs and keywords for products.",
    exampleInputJson: `{
  "productTitle": "Waterproof gold huggie earrings",
  "productDescription": "Demi-fine waterproof huggie hoops in gold, safe for daily wear and shower-friendly.",
  "brand": "DTP Jewellry",
  "tone": "elevated, modern, UK English"
}`,
  },
  {
    id: "ai-alt-text-engine",
    name: "AI Alt-Text Engine",
    category: "SEO",
    tag: "SEO",
    description:
      "Create descriptive, keyword-aware image alt text at scale for every product asset.",
    exampleInputJson: `{
  "productTitle": "Waterproof layered necklace",
  "imageContext": "Close-up lifestyle shot on model wearing the necklace.",
  "brand": "DTP Jewellry",
  "tone": "concise, descriptive, UK English"
}`,
  },
  {
    id: "internal-link-optimizer",
    name: "Internal Link Optimiser",
    category: "SEO",
    tag: "SEO",
    description:
      "Suggest internal links between products, collections, articles and content.",
    exampleInputJson: `{
  "sourceUrl": "https://dtpjewellry.com/products/waterproof-gold-huggie-earrings",
  "sourceTitle": "Waterproof Gold Huggie Earrings",
  "brand": "DTP Jewellry",
  "tone": "helpful, natural"
}`,
  },
];

// VERY IMPORTANT: use *default* export
export default toolsMeta;

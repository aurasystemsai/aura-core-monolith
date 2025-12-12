// aura-console/src/toolMeta.js

// This file defines the metadata for each tool shown in the Automation Console UI.
// It is consumed as a *default export array* by App.jsx.

const toolsMeta = [
  {
    id: "product-seo",
    name: "Product SEO Engine",
    category: "SEO",
    tag: "SEO",
    description:
      "Generate SEO titles, descriptions, slugs and keywords for products.",
    longDescription:
      "Use this tool to turn product details into search-optimised metadata, including page titles, meta descriptions, slugs and keyword suggestions.",
    badges: ["SEO", "Products"],
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
    longDescription:
      "Feed this tool basic context about the product and image, and it will generate accessible and SEO-friendly alt text.",
    badges: ["SEO", "Accessibility"],
    exampleInputJson: `{
  "productTitle": "Waterproof layered necklace",
  "imageContext": "Close-up lifestyle shot on model wearing the necklace over a black top.",
  "brand": "DTP Jewellry",
  "tone": "concise, descriptive, UK English"
}`,
  },

  {
    id: "image-alt-media-seo",
    name: "Image Alt / Media SEO",
    category: "SEO",
    tag: "SEO",
    description:
      "Bulk optimise image metadata for SEO and accessibility across the store.",
    longDescription:
      "Use this to generate alt text, captions and basic SEO metadata for batches of media assets.",
    badges: ["SEO", "Bulk"],
    exampleInputJson: `{
  "collectionName": "Waterproof Essentials",
  "imageBatch": [
    {
      "filename": "dtp-waterproof-necklace-01.jpg",
      "productTitle": "Waterproof layered necklace",
      "context": "flat lay on marble with jewellery box"
    },
    {
      "filename": "dtp-waterproof-hoops-01.jpg",
      "productTitle": "Waterproof gold huggie earrings",
      "context": "model shot, close-up, smiling"
    }
  ],
  "brand": "DTP Jewellry",
  "tone": "natural, on-brand, UK English"
}`,
  },

  {
    id: "internal-link-optimizer",
    name: "Internal Link Optimiser",
    category: "SEO",
    tag: "SEO",
    description:
      "Suggest internal links between products, collections, articles and content.",
    longDescription:
      "Give this tool a source URL or product and it will return suggested internal links with anchor text ideas.",
    badges: ["SEO", "Growth"],
    exampleInputJson: `{
  "sourceUrl": "https://dtpjewellry.com/products/waterproof-gold-huggie-earrings",
  "sourceTitle": "Waterproof Gold Huggie Earrings",
  "siteSection": "products",
  "brand": "DTP Jewellry",
  "tone": "helpful, natural, non-spammy"
}`,
  },
];

export default toolsMeta;

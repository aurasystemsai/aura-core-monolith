// src/toolMeta.js

const toolsMeta = [
  {
    id: "product-seo",
    name: "Product SEO Engine",
    shortTag: "SEO",
    category: "SEO",
    description:
      "Generate SEO titles, descriptions, slugs and keyword sets for products.",
    meta: {
      id: "product-seo",
      group: "SEO"
    },
    exampleInput: JSON.stringify(
      {
        productTitle: "Waterproof gold huggie earrings",
        productDescription:
          "Demi-fine hypoallergenic waterproof huggie hoops in 18K gold plating.",
        brand: "DTP Jewellry",
        tone: "elevated, modern, UK English"
      },
      null,
      2
    )
  },
  {
    id: "ai-alt-text-engine",
    name: "AI Alt-Text Engine",
    shortTag: "SEO",
    category: "SEO",
    description:
      "Create descriptive, keyword-aware image alt text at scale for every asset.",
    meta: {
      id: "ai-alt-text-engine",
      group: "SEO"
    },
    exampleInput: JSON.stringify(
      {
        imageContext: "Close-up of a woman's ear wearing small gold huggie earrings.",
        productTitle: "Waterproof gold huggie earrings",
        brand: "DTP Jewellry",
        primaryKeyword: "waterproof gold earrings",
        tone: "clear, natural, UK English",
        count: 3
      },
      null,
      2
    )
  },
  {
    id: "internal-link-optimizer",
    name: "Internal Link Optimiser",
    shortTag: "SEO",
    category: "SEO",
    description:
      "Suggest internal links between products, collections, articles and content.",
    meta: {
      id: "internal-link-optimizer",
      group: "SEO"
    },
    exampleInput: JSON.stringify(
      {
        pageType: "product",
        pageTitle: "Waterproof gold huggie earrings",
        pageHandle: "waterproof-gold-huggie-earrings",
        brand: "DTP Jewellry",
        context: "New-in waterproof demi-fine earrings launch.",
        maxSuggestions: 8
      },
      null,
      2
    )
  }
];

export default toolsMeta;

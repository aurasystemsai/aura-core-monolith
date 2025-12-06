// src/tools/schema-rich-results-engine/index.js
// ===============================================
// AURA • Schema Rich Results Engine (dummy implementation)
// - Builds JSON-LD for Product pages (and simple FAQ)
// - No OpenAI required
// ===============================================

function clean(str) {
  if (!str) return undefined;
  return String(str).trim();
}

function toNumber(val) {
  if (val === undefined || val === null || val === "") return undefined;
  const num = Number(val);
  return Number.isNaN(num) ? undefined : num;
}

function buildProductSchema(input) {
  const url = clean(input.url);
  const name = clean(input.product_name || input.name);
  const description = clean(input.description);
  const sku = clean(input.sku);
  const mpn = clean(input.mpn);
  const gtin = clean(input.gtin) || clean(input.gtin13) || clean(input.gtin14);

  const currency = clean(input.currency || "GBP");
  const price = toNumber(input.price);
  const brandName = clean(input.brand || input.brand_name || "DTP Jewellry");

  const availability =
    clean(input.availability) ||
    "https://schema.org/InStock";

  const image = clean(input.image) || clean(input.image_url);

  const offers = {
    "@type": "Offer",
    priceCurrency: currency,
    price,
    availability,
    url,
  };

  if (!price) delete offers.price;
  if (!url) delete offers.url;

  const product = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description,
    sku,
    mpn,
    image,
    brand: {
      "@type": "Brand",
      name: brandName,
    },
    offers,
  };

  if (!sku) delete product.sku;
  if (!mpn) delete product.mpn;
  if (!image) delete product.image;
  if (!gtin) {
    // nothing
  } else if (gtin.length === 13) {
    product.gtin13 = gtin;
  } else if (gtin.length === 14) {
    product.gtin14 = gtin;
  } else {
    product.gtin = gtin;
  }

  if (!offers.price && !offers.url && !offers.availability) {
    delete product.offers;
  }

  return product;
}

function buildFaqSchema(input) {
  const faqs = input.faqs || input.faq || input.questions || [];

  if (!Array.isArray(faqs) || faqs.length === 0) return null;

  const mainEntity = faqs
    .map((item) => {
      if (!item) return null;
      const q = clean(item.q || item.question);
      const a = clean(item.a || item.answer);
      if (!q || !a) return null;

      return {
        "@type": "Question",
        name: q,
        acceptedAnswer: {
          "@type": "Answer",
          text: a,
        },
      };
    })
    .filter(Boolean);

  if (mainEntity.length === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity,
  };
}

module.exports = {
  key: "schema-rich-results-engine",
  name: "AURA • Schema Rich Results Engine",

  /**
   * run(input, ctx)
   *
   * Expected input (all optional, we just use what we get):
   * {
   *   url,
   *   product_name,
   *   description,
   *   sku,
   *   mpn,
   *   gtin / gtin13 / gtin14,
   *   price,
   *   currency,
   *   brand,
   *   availability,
   *   image,
   *   faqs: [{ q, a }]
   * }
   */
  async run(input = {}, ctx = {}) {
    const product = buildProductSchema(input);
    const faq = buildFaqSchema(input);

    const graphs = faq ? [product, faq] : [product];

    const jsonldObject =
      graphs.length === 1
        ? graphs[0]
        : {
            "@context": "https://schema.org",
            "@graph": graphs,
          };

    const jsonld = JSON.stringify(jsonldObject, null, 2);

    return {
      ok: true,
      engine: "schema-rich-results-engine",
      url: input.url || null,
      type: "product+faq",
      jsonld,
      parsed: jsonldObject,
      raw_input: input,
    };
  },
};

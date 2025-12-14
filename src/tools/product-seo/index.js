// src/tools/product-seo/index.js
// ----------------------------------------
// Product SEO Engine tool for AURA Core
// Auto-retry version – ensures 100/100 band before returning
// ----------------------------------------

const OpenAI = require("openai");

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

exports.meta = {
  id: "product-seo",
  name: "Product SEO Engine",
  category: "SEO",
  description:
    "Generate SEO titles, meta descriptions, slugs and keyword sets for products.",
  version: "1.3.0",
};

exports.run = async function run(input, ctx = {}) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY in environment.");
  }

  const { productTitle = "", productDescription = "", brand = "", tone = "", useCases = [] } =
    input || {};
  if (!productTitle || !productDescription) {
    throw new Error("productTitle and productDescription are required");
  }

  const useCasesText = Array.isArray(useCases) ? useCases.join(", ") : String(useCases || "");

  async function generateSEO(prompt) {
    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
      temperature: 0.15,
    });
    const text = response.output_text?.trim();
    if (!text) throw new Error("OpenAI response missing text payload");
    let jsonText = text;
    if (!jsonText.startsWith("{")) {
      const f = jsonText.indexOf("{");
      const l = jsonText.lastIndexOf("}");
      if (f !== -1 && l !== -1 && l > f) jsonText = jsonText.slice(f, l + 1);
    }
    return JSON.parse(jsonText);
  }

  async function getPerfectSEO() {
    let attempt = 0;
    while (attempt < 4) {
      attempt++;
      const prompt = `
You are an ecommerce SEO specialist for a modern jewellery brand.
Write optimised SEO that hits exact scoring bands.

REQUIREMENTS:
- TITLE: 52–58 characters (hard limit 45–60)
- META DESCRIPTION: 140–150 characters (hard limit 130–155)
If your output is out of range, rewrite internally and output the corrected one.

Input:
Product title: ${productTitle}
Description: ${productDescription}
Brand: ${brand || "N/A"}
Tone: ${tone || "modern, confident, UK English"}
Use cases: ${useCasesText || "N/A"}

Return JSON only:
{
 "title": "SEO product title",
 "metaDescription": "Meta description",
 "slug": "url-slug-here",
 "keywords": ["kw1","kw2"]
}
      `.trim();

      const data = await generateSEO(prompt);
      const tLen = (data.title || "").length;
      const mLen = (data.metaDescription || "").length;
      if (tLen >= 45 && tLen <= 60 && mLen >= 130 && mLen <= 155) {
        return data; // perfect band
      }
      console.log(
        `Attempt ${attempt} missed range (Title ${tLen} / Meta ${mLen}) – retrying...`
      );
    }
    throw new Error("Failed to get perfect-length SEO after 3 retries.");
  }

  let parsed;
  try {
    parsed = await getPerfectSEO();
  } catch (err) {
    console.error("SEO generation failed:", err);
    throw new Error("Failed to generate perfect-length SEO output");
  }

  return {
    input,
    output: {
      title: parsed.title,
      metaDescription: parsed.metaDescription,
      description: parsed.metaDescription,
      slug: parsed.slug,
      keywords: parsed.keywords || [],
    },
    model: "gpt-4.1-mini",
    environment: ctx.environment || "unknown",
  };
};

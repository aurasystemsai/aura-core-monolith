// src/tools/product-seo/index.js
// CommonJS version with global OpenAI client and no project context

let cachedClient = null;

async function getOpenAIClient() {
  if (cachedClient) return cachedClient;

  const OpenAI = (await import("openai")).default;

  cachedClient = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    // Force to global endpoint (avoids proj_ scoping issues)
    baseURL: "https://api.openai.com/v1",
    defaultHeaders: {
      "OpenAI-Beta": "",
    },
  });

  return cachedClient;
}

async function run(input = {}) {
  const {
    productTitle = "",
    productDescription = "",
    brand = "",
    tone = "elevated, modern, UK English",
  } = input;

  const openai = await getOpenAIClient();

  const prompt = `
Generate SEO metadata for the following Shopify product.

Product: ${productTitle}
Description: ${productDescription}
Brand: ${brand}
Tone: ${tone}

Return ONLY valid JSON with these keys:
- title
- description
- slug
- keywords (array)
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: "You are an expert Shopify SEO assistant." },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 400,
    });

    const raw = completion.choices[0]?.message?.content?.trim() || "{}";

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      parsed = { raw, parseError: err.message };
    }

    return { ok: true, input, output: parsed };
  } catch (err) {
    return {
      ok: false,
      error: err.message || "OpenAI request failed",
    };
  }
}

module.exports = { run };

const { Configuration, OpenAIApi } = require("openai");
const config = new Configuration({ apiKey: process.env.OPENAI_API_KEY });
const openai = new OpenAIApi(config);

async function analyzeBacklinks(domain) {
  // In production, connect to backlink DB/API, analyze anchor text, toxicity, etc.
  // Here, we use OpenAI to simulate a smart backlink analysis assistant.
  const prompt = `You are a backlink analysis assistant. Analyze the backlinks for the following domain, including referring domains, anchor text, and toxic links.\nDomain: ${domain}`;
  const completion = await openai.createChatCompletion({
    model: "gpt-4",
    messages: [
      { role: "system", content: "You are an expert backlink analysis assistant." },
      { role: "user", content: prompt }
    ],
    max_tokens: 600
  });
  return completion.data.choices[0].message.content;
}

module.exports = { analyzeBacklinks };

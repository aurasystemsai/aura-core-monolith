const { Configuration, OpenAIApi } = require("openai");
const config = new Configuration({ apiKey: process.env.OPENAI_API_KEY });
const openai = new OpenAIApi(config);

async function analyzeCompetition(query) {
  // In production, connect to competitor APIs, keyword/content/backlink gap, etc.
  // Here, we use OpenAI to simulate a smart competitive analysis assistant.
  const prompt = `You are a competitive analysis assistant. Analyze the following query for domain vs. domain, keyword gap, backlink gap, and content gap.\nQuery: ${query}`;
  const completion = await openai.createChatCompletion({
    model: "gpt-4",
    messages: [
      { role: "system", content: "You are an expert competitive analysis assistant." },
      { role: "user", content: prompt }
    ],
    max_tokens: 600
  });
  return completion.data.choices[0].message.content;
}

module.exports = { analyzeCompetition };

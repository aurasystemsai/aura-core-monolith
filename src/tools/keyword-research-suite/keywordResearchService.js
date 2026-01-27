const { getOpenAIClient } = require("../../core/openaiClient");
const openai = getOpenAIClient();

async function analyzeKeywords(query) {
  // In production, connect to keyword DB/API, analyze volume, difficulty, trends, etc.
  // Here, we use OpenAI to simulate a smart keyword research assistant.
  const prompt = `You are a keyword research assistant. Analyze the following query for keyword volume, difficulty, trends, gap, and competitor keywords.\nQuery: ${query}`;
  const completion = await openai.createChatCompletion({
    model: "gpt-4",
    messages: [
      { role: "system", content: "You are an expert keyword research assistant." },
      { role: "user", content: prompt }
    ],
    max_tokens: 600
  });
  return completion.data.choices[0].message.content;
}

module.exports = { analyzeKeywords };

const { Configuration, OpenAIApi } = require("openai");
const config = new Configuration({ apiKey: process.env.OPENAI_API_KEY });
const openai = new OpenAIApi(config);

async function analyzeSocialMedia(query) {
  // In production, connect to social APIs, sentiment, etc.
  // Here, we use OpenAI to simulate a smart social analytics assistant.
  const prompt = `You are a social media analytics and listening assistant. Analyze the following query and return brand sentiment, trends, and actionable insights.\nQuery: ${query}`;
  const completion = await openai.createChatCompletion({
    model: "gpt-4",
    messages: [
      { role: "system", content: "You are an expert social media analytics assistant." },
      { role: "user", content: prompt }
    ],
    max_tokens: 600
  });
  return completion.data.choices[0].message.content;
}

module.exports = { analyzeSocialMedia };

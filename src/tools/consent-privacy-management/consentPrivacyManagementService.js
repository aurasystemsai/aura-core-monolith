const { Configuration, OpenAIApi } = require("openai");
const config = new Configuration({ apiKey: process.env.OPENAI_API_KEY });
const openai = new OpenAIApi(config);

async function handleConsentQuery(query) {
  // In production, connect to consent management, privacy APIs, etc.
  // Here, we use OpenAI to simulate a smart privacy assistant.
  const prompt = `You are a consent & privacy management assistant. Help with GDPR/CCPA compliance, consent tracking, and audit logs for the following query.\nQuery: ${query}`;
  const completion = await openai.createChatCompletion({
    model: "gpt-4",
    messages: [
      { role: "system", content: "You are an expert consent & privacy management assistant." },
      { role: "user", content: prompt }
    ],
    max_tokens: 600
  });
  return completion.data.choices[0].message.content;
}

module.exports = { handleConsentQuery };

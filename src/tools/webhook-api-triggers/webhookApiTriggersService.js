const { Configuration, OpenAIApi } = require("openai");
const config = new Configuration({ apiKey: process.env.OPENAI_API_KEY });
const openai = new OpenAIApi(config);

async function handleWebhookApiQuery(query) {
  // In production, connect to webhook listeners, API integrations, etc.
  // Here, we use OpenAI to simulate a smart webhook/API trigger assistant.
  const prompt = `You are a webhook & API triggers assistant. Help with webhook listeners, API integrations, and event triggers for the following query.\nQuery: ${query}`;
  const completion = await openai.createChatCompletion({
    model: "gpt-4",
    messages: [
      { role: "system", content: "You are an expert webhook & API triggers assistant." },
      { role: "user", content: prompt }
    ],
    max_tokens: 600
  });
  return completion.data.choices[0].message.content;
}

module.exports = { handleWebhookApiQuery };

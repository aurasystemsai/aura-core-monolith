const { Configuration, OpenAIApi } = require("openai");
const config = new Configuration({ apiKey: process.env.OPENAI_API_KEY });
const openai = new OpenAIApi(config);

async function queryCustomerData(query) {
  // In production, connect to your CDP DB, segment engine, etc.
  // Here, we use OpenAI to simulate a smart CDP assistant.
  const prompt = `You are a customer data platform assistant. Analyze the following query and return unified customer insights, segments, and recommendations.\nQuery: ${query}`;
  const completion = await openai.createChatCompletion({
    model: "gpt-4",
    messages: [
      { role: "system", content: "You are an expert customer data platform assistant." },
      { role: "user", content: prompt }
    ],
    max_tokens: 600
  });
  return completion.data.choices[0].message.content;
}

module.exports = { queryCustomerData };

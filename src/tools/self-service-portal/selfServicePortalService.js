const { Configuration, OpenAIApi } = require("openai");
const config = new Configuration({ apiKey: process.env.OPENAI_API_KEY });
const openai = new OpenAIApi(config);

async function handlePortalQuery(query) {
  // In production, connect to integrations, billing, and support APIs.
  // Here, we use OpenAI to simulate a smart portal assistant.
  const prompt = `You are a self-service portal assistant. Help with integrations, billing, and support for the following query.\nQuery: ${query}`;
  const completion = await openai.createChatCompletion({
    model: "gpt-4",
    messages: [
      { role: "system", content: "You are an expert self-service portal assistant." },
      { role: "user", content: prompt }
    ],
    max_tokens: 600
  });
  return completion.data.choices[0].message.content;
}

module.exports = { handlePortalQuery };

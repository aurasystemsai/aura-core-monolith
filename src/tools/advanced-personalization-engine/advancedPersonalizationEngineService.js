const { Configuration, OpenAIApi } = require("openai");
const config = new Configuration({ apiKey: process.env.OPENAI_API_KEY });
const openai = new OpenAIApi(config);

async function handlePersonalizationQuery(query) {
  // In production, connect to personalization APIs, rules engines, etc.
  // Here, we use OpenAI to simulate a smart personalization assistant.
  const prompt = `You are an advanced personalization engine assistant. Help with real-time content/product personalization for the following query.\nQuery: ${query}`;
  const completion = await openai.createChatCompletion({
    model: "gpt-4",
    messages: [
      { role: "system", content: "You are an expert personalization engine assistant." },
      { role: "user", content: prompt }
    ],
    max_tokens: 600
  });
  return completion.data.choices[0].message.content;
}

module.exports = { handlePersonalizationQuery };

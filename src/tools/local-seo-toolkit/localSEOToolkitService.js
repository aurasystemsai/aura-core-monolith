const { Configuration, OpenAIApi } = require("openai");
const config = new Configuration({ apiKey: process.env.OPENAI_API_KEY });
const openai = new OpenAIApi(config);

async function handleLocalSEOQuery(query) {
  // In production, connect to GMB, citation, review, and local rank APIs.
  // Here, we use OpenAI to simulate a smart local SEO toolkit assistant.
  const prompt = `You are a local SEO toolkit assistant. Help with GMB sync, citation tracking, review monitoring, and local rank tracking for the following query.\nQuery: ${query}`;
  const completion = await openai.createChatCompletion({
    model: "gpt-4",
    messages: [
      { role: "system", content: "You are an expert local SEO toolkit assistant." },
      { role: "user", content: prompt }
    ],
    max_tokens: 600
  });
  return completion.data.choices[0].message.content;
}

module.exports = { handleLocalSEOQuery };

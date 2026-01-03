const { Configuration, OpenAIApi } = require("openai");
const config = new Configuration({ apiKey: process.env.OPENAI_API_KEY });
const openai = new OpenAIApi(config);

async function handleContentBriefQuery(query) {
  // In production, connect to content research, SEO APIs, etc.
  // Here, we use OpenAI to simulate a smart content brief assistant.
  const prompt = `You are an AI content brief generator assistant. Help with topic research, outline creation, and SEO recommendations for the following query.\nQuery: ${query}`;
  const completion = await openai.createChatCompletion({
    model: "gpt-4",
    messages: [
      { role: "system", content: "You are an expert content brief generator assistant." },
      { role: "user", content: prompt }
    ],
    max_tokens: 600
  });
  return completion.data.choices[0].message.content;
}

module.exports = { handleContentBriefQuery };

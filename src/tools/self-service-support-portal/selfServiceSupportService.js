const { Configuration, OpenAIApi } = require("openai");
const config = new Configuration({ apiKey: process.env.OPENAI_API_KEY });
const openai = new OpenAIApi(config);

async function querySupport(query) {
  // In production, connect to your support KB, ticketing, etc.
  // Here, we use OpenAI to simulate a smart support assistant.
  const prompt = `You are a self-service support portal assistant. Answer the following support question, provide troubleshooting steps, and suggest next actions.\nQuery: ${query}`;
  const completion = await openai.createChatCompletion({
    model: "gpt-4",
    messages: [
      { role: "system", content: "You are an expert self-service support assistant." },
      { role: "user", content: prompt }
    ],
    max_tokens: 600
  });
  return completion.data.choices[0].message.content;
}

module.exports = { querySupport };

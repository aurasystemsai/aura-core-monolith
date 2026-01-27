const { getOpenAIClient } = require("../../core/openaiClient");
const openai = getOpenAIClient();

async function handleBrandMentionQuery(query) {
  // In production, connect to web/social monitoring APIs for brand mentions and sentiment.
  // Here, we use OpenAI to simulate a smart brand mention tracker assistant.
  const prompt = `You are a brand mention tracker assistant. Help with real-time monitoring, sentiment analysis, and alerts for the following query.\nQuery: ${query}`;
  const completion = await openai.createChatCompletion({
    model: "gpt-4",
    messages: [
      { role: "system", content: "You are an expert brand mention tracker assistant." },
      { role: "user", content: prompt }
    ],
    max_tokens: 600
  });
  return completion.data.choices[0].message.content;
}

module.exports = { handleBrandMentionQuery };

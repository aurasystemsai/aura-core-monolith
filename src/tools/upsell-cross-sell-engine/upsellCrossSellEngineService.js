const { getOpenAIClient } = require("../../core/openaiClient");
const openai = getOpenAIClient();

async function handleUpsellCrossSellQuery(query) {
  // In production, connect to product recommendation, offer automation APIs, etc.
  // Here, we use OpenAI to simulate a smart upsell/cross-sell assistant.
  const prompt = `You are an upsell/cross-sell engine assistant. Help with product recommendations, offer automation, and analytics for the following query.\nQuery: ${query}`;
  const completion = await openai.createChatCompletion({
    model: "gpt-4",
    messages: [
      { role: "system", content: "You are an expert upsell/cross-sell engine assistant." },
      { role: "user", content: prompt }
    ],
    max_tokens: 600
  });
  return completion.data.choices[0].message.content;
}

module.exports = { handleUpsellCrossSellQuery };

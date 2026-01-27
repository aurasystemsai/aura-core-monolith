const { getOpenAIClient } = require("../../core/openaiClient");
const openai = getOpenAIClient();

async function handleInventoryForecastingQuery(query) {
  // In production, connect to demand forecasting, supply chain APIs, etc.
  // Here, we use OpenAI to simulate a smart inventory forecasting assistant.
  const prompt = `You are an inventory forecasting assistant. Help with demand forecasting, reorder automation, and supply chain analytics for the following query.\nQuery: ${query}`;
  const completion = await openai.createChatCompletion({
    model: "gpt-4",
    messages: [
      { role: "system", content: "You are an expert inventory forecasting assistant." },
      { role: "user", content: prompt }
    ],
    max_tokens: 600
  });
  return completion.data.choices[0].message.content;
}

module.exports = { handleInventoryForecastingQuery };

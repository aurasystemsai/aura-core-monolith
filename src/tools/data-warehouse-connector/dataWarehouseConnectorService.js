const { getOpenAIClient } = require("../../core/openaiClient");
const openai = getOpenAIClient();

async function handleWarehouseQuery(query) {
  // In production, connect to data warehouse, BI APIs, etc.
  // Here, we use OpenAI to simulate a smart data connector assistant.
  const prompt = `You are a data warehouse/BI connector assistant. Help with integration, sync, and analytics for the following query.\nQuery: ${query}`;
  const completion = await openai.createChatCompletion({
    model: "gpt-4",
    messages: [
      { role: "system", content: "You are an expert data warehouse/BI connector assistant." },
      { role: "user", content: prompt }
    ],
    max_tokens: 600
  });
  return completion.data.choices[0].message.content;
}

module.exports = { handleWarehouseQuery };

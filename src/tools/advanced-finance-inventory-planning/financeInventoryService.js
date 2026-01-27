const { getOpenAIClient } = require("../../core/openaiClient");
const openai = getOpenAIClient();

async function analyzeFinanceInventory(query) {
  // In production, connect to finance/inventory DB, forecasting, etc.
  // Here, we use OpenAI to simulate a smart finance/inventory assistant.
  const prompt = `You are a finance and inventory planning assistant. Analyze the following query and return forecasts, budgets, and actionable recommendations.\nQuery: ${query}`;
  const completion = await openai.createChatCompletion({
    model: "gpt-4",
    messages: [
      { role: "system", content: "You are an expert finance and inventory planning assistant." },
      { role: "user", content: prompt }
    ],
    max_tokens: 600
  });
  return completion.data.choices[0].message.content;
}

module.exports = { analyzeFinanceInventory };

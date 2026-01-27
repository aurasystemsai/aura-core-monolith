const { getOpenAIClient } = require("../../core/openaiClient");
const openai = getOpenAIClient();

async function handleDashboardBuilderQuery(query) {
  // In production, connect to dashboard builder, widget APIs, etc.
  // Here, we use OpenAI to simulate a smart dashboard builder assistant.
  const prompt = `You are a custom dashboard builder assistant. Help with widget library, layout, and data source integration for the following query.\nQuery: ${query}`;
  const completion = await openai.createChatCompletion({
    model: "gpt-4",
    messages: [
      { role: "system", content: "You are an expert custom dashboard builder assistant." },
      { role: "user", content: prompt }
    ],
    max_tokens: 600
  });
  return completion.data.choices[0].message.content;
}

module.exports = { handleDashboardBuilderQuery };

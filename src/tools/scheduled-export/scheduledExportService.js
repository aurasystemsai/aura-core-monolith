const { getOpenAIClient } = require("../../core/openaiClient");
const openai = getOpenAIClient();

async function handleScheduledExportQuery(query) {
  // In production, connect to export scheduler, PDF/CSV generator APIs, etc.
  // Here, we use OpenAI to simulate a smart export assistant.
  const prompt = `You are a scheduled export assistant. Help with export scheduling, format selection, and delivery options for the following query.\nQuery: ${query}`;
  const completion = await openai.createChatCompletion({
    model: "gpt-4",
    messages: [
      { role: "system", content: "You are an expert scheduled export assistant." },
      { role: "user", content: prompt }
    ],
    max_tokens: 600
  });
  return completion.data.choices[0].message.content;
}

module.exports = { handleScheduledExportQuery };

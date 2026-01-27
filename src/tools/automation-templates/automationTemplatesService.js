const { getOpenAIClient } = require("../../core/openaiClient");
const openai = getOpenAIClient();

async function handleTemplateQuery(query) {
  // In production, connect to workflow template APIs, gallery, etc.
  // Here, we use OpenAI to simulate a smart automation template assistant.
  const prompt = `You are an automation template assistant. Help with template gallery, install, and customization for the following query.\nQuery: ${query}`;
  const completion = await openai.createChatCompletion({
    model: "gpt-4",
    messages: [
      { role: "system", content: "You are an expert automation template assistant." },
      { role: "user", content: prompt }
    ],
    max_tokens: 600
  });
  return completion.data.choices[0].message.content;
}

module.exports = { handleTemplateQuery };

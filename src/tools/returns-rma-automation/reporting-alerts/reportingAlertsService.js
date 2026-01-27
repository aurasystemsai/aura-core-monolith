const { getOpenAIClient } = require("../../../core/openaiClient");
const openai = getOpenAIClient();

async function reportAndAlert(query) {
  // In production, connect to reporting/alerting APIs, schedule jobs, etc.
  // Here, we use OpenAI to simulate a smart reporting and alerting assistant.
  const prompt = `You are a reporting and alerts assistant. Schedule reports, detect anomalies, and send change alerts for the following query.\nQuery: ${query}`;
  const completion = await openai.createChatCompletion({
    model: "gpt-4",
    messages: [
      { role: "system", content: "You are an expert reporting and alerts assistant." },
      { role: "user", content: prompt }
    ],
    max_tokens: 600
  });
  return completion.data.choices[0].message.content;
}

module.exports = { reportAndAlert };

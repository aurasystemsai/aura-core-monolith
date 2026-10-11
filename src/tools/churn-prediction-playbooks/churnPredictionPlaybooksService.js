const { getOpenAIClient } = require("../../core/openaiClient");
const openai = getOpenAIClient();

async function handleChurnPredictionQuery(query) {
  // In production, connect to churn scoring, retention workflow APIs, etc.
  // Here, we use OpenAI to simulate a smart churn prediction assistant.
  const prompt = `You are a churn prediction & retention playbooks assistant. Help with churn scoring, retention workflows, and playbook automation for the following query.\nQuery: ${query}`;
  const completion = await openai.createChatCompletion({
    model: "gpt-4",
    messages: [
      { role: "system", content: "You are an expert churn prediction & retention playbooks assistant." },
      { role: "user", content: prompt }
    ],
    max_tokens: 600
  });
  return completion.data.choices[0].message.content;
}

module.exports = { handleChurnPredictionQuery };

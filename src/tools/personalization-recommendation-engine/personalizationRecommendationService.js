const { getOpenAIClient } = require("../../core/openaiClient");
const openai = getOpenAIClient();

async function queryPersonalization(query) {
  // In production, connect to rec engine, segment, A/B, etc.
  // Here, we use OpenAI to simulate a smart personalization assistant.
  const prompt = `You are a personalization and recommendation engine assistant. Analyze the following query and return personalized recommendations, segments, and A/B test ideas.\nQuery: ${query}`;
  const completion = await openai.createChatCompletion({
    model: "gpt-4",
    messages: [
      { role: "system", content: "You are an expert personalization and recommendation assistant." },
      { role: "user", content: prompt }
    ],
    max_tokens: 600
  });
  return completion.data.choices[0].message.content;
}

module.exports = { queryPersonalization };

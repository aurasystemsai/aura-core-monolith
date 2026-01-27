const { getOpenAIClient } = require("../../core/openaiClient");
const openai = getOpenAIClient();

async function handleEntityTopicQuery(query) {
  // In production, connect to NLP/SEO APIs for entity extraction and topic clustering.
  // Here, we use OpenAI to simulate a smart entity/topic explorer assistant.
  const prompt = `You are an entity/topic explorer assistant. Help with semantic SEO, entity extraction, and topic clustering for the following query.\nQuery: ${query}`;
  const completion = await openai.createChatCompletion({
    model: "gpt-4",
    messages: [
      { role: "system", content: "You are an expert entity/topic explorer assistant." },
      { role: "user", content: prompt }
    ],
    max_tokens: 600
  });
  return completion.data.choices[0].message.content;
}

module.exports = { handleEntityTopicQuery };

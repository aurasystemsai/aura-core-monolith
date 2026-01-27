const { getOpenAIClient } = require("../../core/openaiClient");
const openai = getOpenAIClient();

async function auditSite(url) {
  // In production, connect to audit APIs, check web vitals, mobile, security, etc.
  // Here, we use OpenAI to simulate a smart site audit assistant.
  const prompt = `You are a site audit and health assistant. Audit the following site for web vitals, mobile, security, structured data, and duplicate content.\nURL: ${url}`;
  const completion = await openai.createChatCompletion({
    model: "gpt-4",
    messages: [
      { role: "system", content: "You are an expert site audit and health assistant." },
      { role: "user", content: prompt }
    ],
    max_tokens: 600
  });
  return completion.data.choices[0].message.content;
}

module.exports = { auditSite };

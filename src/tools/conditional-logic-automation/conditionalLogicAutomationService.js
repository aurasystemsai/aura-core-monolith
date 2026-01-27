const OpenAI = require("openai");
let openaiClient = null;
try {
  if (process.env.OPENAI_API_KEY) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
} catch (e) {
  console.warn("[Conditional Logic] OpenAI init skipped", e.message);
}

async function handleConditionalLogicQuery(query) {
  // In production, connect to workflow engine for logic/branching.
  // Here, we use OpenAI to simulate a smart conditional logic assistant.
  if (!openaiClient) {
    return "(demo) Branch on event, customer segment, and threshold; then route to email/SMS/flows.";
  }
  const prompt = `You are a conditional logic automation assistant. Help with if/then logic, multi-path workflows, and advanced triggers for the following query.\nQuery: ${query}`;
  const completion = await openaiClient.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You are an expert conditional logic automation assistant." },
      { role: "user", content: prompt }
    ],
    max_tokens: 400
  });
  return completion.choices?.[0]?.message?.content || "(demo) Use IF/ELSE with triggers + thresholds.";
}

module.exports = { handleConditionalLogicQuery };

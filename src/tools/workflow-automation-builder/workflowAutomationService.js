const { Configuration, OpenAIApi } = require("openai");
const config = new Configuration({ apiKey: process.env.OPENAI_API_KEY });
const openai = new OpenAIApi(config);

async function buildWorkflow(workflow) {
  // In production, parse workflow, generate automation, connect to integrations, etc.
  // Here, we use OpenAI to simulate a smart workflow builder.
  const prompt = `You are a workflow automation builder. Given the following workflow description, generate a step-by-step automation plan, including triggers, actions, and integrations.\nWorkflow: ${workflow}`;
  const completion = await openai.createChatCompletion({
    model: "gpt-4",
    messages: [
      { role: "system", content: "You are an expert workflow automation builder." },
      { role: "user", content: prompt }
    ],
    max_tokens: 600
  });
  return completion.data.choices[0].message.content;
}

module.exports = { buildWorkflow };

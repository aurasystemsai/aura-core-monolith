// OpenAI integration for Returns/RMA Automation
const { Configuration, OpenAIApi } = require('openai');
const configuration = new Configuration({ apiKey: process.env.OPENAI_API_KEY });
const openai = new OpenAIApi(configuration);

async function generateRmaMessage({ customerName, orderItems, reason, brand, tone, prompt, language }) {
  // Compose prompt for OpenAI
  const systemPrompt = `You are an expert e-commerce support agent. Write a returns/RMA message for a customer. Brand: ${brand || 'N/A'}. Tone: ${tone || 'friendly'}. Language: ${language || 'English'}.`;
  const userPrompt = prompt || `Customer: ${customerName}\nOrder Items: ${JSON.stringify(orderItems)}\nReason: ${reason}`;
  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];
  const response = await openai.createChatCompletion({
    model: 'gpt-4',
    messages,
    max_tokens: 300,
    temperature: 0.7,
  });
  return response.data.choices[0].message.content;
}

module.exports = { generateRmaMessage };

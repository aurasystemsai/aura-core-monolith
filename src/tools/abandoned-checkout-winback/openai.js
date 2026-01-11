// OpenAI integration for winback message generation
const { Configuration, OpenAIApi } = require('openai');

const configuration = new Configuration({ apiKey: process.env.OPENAI_API_KEY });
const openai = new OpenAIApi(configuration);

async function generateWinbackMessage({ customerName, cartItems, discountCode, brand, tone, prompt, language }) {
  // Compose a prompt for OpenAI
  const items = cartItems.map(item => `${item.quantity}x ${item.name}`).join(', ');
  const basePrompt = prompt || `Write a persuasive email to win back ${customerName} who abandoned a cart with: ${items}. Brand: ${brand || 'N/A'}. Tone: ${tone || 'friendly'}. Language: ${language || 'en'}.`;
  const fullPrompt = discountCode ? `${basePrompt} Offer discount code: ${discountCode}.` : basePrompt;
  const response = await openai.createCompletion({
    model: 'text-davinci-003',
    prompt: fullPrompt,
    max_tokens: 200,
    temperature: 0.7
  });
  return response.data.choices[0].text.trim();
}

module.exports = { generateWinbackMessage };

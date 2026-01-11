// OpenAI integration for winback message generation

const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generateWinbackMessage({ customerName, cartItems, discountCode, brand, tone, prompt, language }) {
  // Compose a prompt for OpenAI
  const items = cartItems.map(item => `${item.quantity || 1}x ${item.name || item.title}`).join(', ');
  const basePrompt = prompt || `Write a persuasive email to win back ${customerName} who abandoned a cart with: ${items}. Brand: ${brand || 'N/A'}. Tone: ${tone || 'friendly'}. Language: ${language || 'en'}.`;
  const fullPrompt = discountCode ? `${basePrompt} Offer discount code: ${discountCode}.` : basePrompt;
  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: fullPrompt }],
    max_tokens: 200,
    temperature: 0.7
  });
  return response.choices[0].message.content.trim();
}

module.exports = { generateWinbackMessage };

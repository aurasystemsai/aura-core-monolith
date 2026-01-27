// OpenAI integration for Abandoned Checkout Winback message generation
const { getOpenAIClient } = require("../../core/openaiClient");
const openai = getOpenAIClient();

async function generateWinbackMessage({ customerName, cartItems, discount, brand, tone, channel, language, customPrompt }) {
  let prompt = customPrompt || `Write a persuasive, friendly ${channel} message in ${language || 'English'} to win back a customer who abandoned their cart. Personalize with their name (${customerName}), cart items (${cartItems.map(i => i.title).join(', ')}), and offer a discount (${discount || 'none'}). Brand: ${brand || 'our store'}. Tone: ${tone || 'friendly, helpful'}.`;
  if (!openai) {
    return "OpenAI not configured";
  }

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: 'You are an expert ecommerce copywriter.' },
      { role: 'user', content: prompt }
    ],
    max_tokens: 300,
    temperature: 0.8
  });
  return response.choices[0].message.content;
}

module.exports = { generateWinbackMessage };

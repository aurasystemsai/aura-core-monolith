// OpenAI integration for Abandoned Checkout Winback message generation
const { Configuration, OpenAIApi } = require('openai');

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

async function generateWinbackMessage({ customerName, cartItems, discount, brand, tone, channel, language, customPrompt }) {
  let prompt = customPrompt || `Write a persuasive, friendly ${channel} message in ${language || 'English'} to win back a customer who abandoned their cart. Personalize with their name (${customerName}), cart items (${cartItems.map(i => i.title).join(', ')}), and offer a discount (${discount || 'none'}). Brand: ${brand || 'our store'}. Tone: ${tone || 'friendly, helpful'}.`;
  const response = await openai.createChatCompletion({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: 'You are an expert ecommerce copywriter.' },
      { role: 'user', content: prompt }
    ],
    max_tokens: 300,
    temperature: 0.8
  });
  return response.data.choices[0].message.content;
}

module.exports = { generateWinbackMessage };

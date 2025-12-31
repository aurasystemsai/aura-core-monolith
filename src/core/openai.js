// OpenAI integration for alt text generation
const { Configuration, OpenAIApi } = require('openai');
const config = new Configuration({ apiKey: process.env.OPENAI_API_KEY });
const openai = new OpenAIApi(config);

async function openaiGenerateAltText(image_url) {
  // Use GPT-4 to generate alt text for the image
  const prompt = `Generate a descriptive alt text for this image: ${image_url}`;
  const response = await openai.createChatCompletion({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 60
  });
  return response.data.choices[0].message.content.trim();
}

module.exports = { openaiGenerateAltText };

// OpenAI integration for alt text generation (compatible with OpenAI v4 client)
const { getOpenAIClient } = require("./openaiClient");
const openai = getOpenAIClient();

async function openaiGenerateAltText(image_url) {
  // Use GPT-4 to generate alt text for the image
  const prompt = `Generate a descriptive alt text for this image: ${image_url}`;
  if (!openai) {
    return "Alt text generation unavailable (missing OPENAI_API_KEY).";
  }

  const response = await openai.createChatCompletion({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 60
  });
  return response.data.choices[0].message.content.trim();
}

module.exports = { openaiGenerateAltText };

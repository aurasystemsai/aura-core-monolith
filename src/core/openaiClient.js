const OpenAI = require("openai");

let cachedClient = null;

function getOpenAIClient() {
  if (cachedClient) return cachedClient;

  const apiKey = process.env.OPENAI_API_KEY;
  const isTest = process.env.NODE_ENV === 'test';

  if (isTest) {
    cachedClient = {
      chat: {
        completions: {
          create: async () => ({
            choices: [
              {
                message: { content: 'test-mode stub' },
              },
            ],
          }),
        },
      },
      async createChatCompletion() {
        return {
          data: {
            choices: [
              {
                message: { content: 'test-mode stub' },
              },
            ],
          },
        };
      },
    };
    return cachedClient;
  }

  if (!apiKey) {
    throw new Error('[OpenAI] OPENAI_API_KEY is required in production');
  }

  const client = new OpenAI({ apiKey });

  // Backward compatibility for legacy OpenAI v3-style helpers used across the codebase
  if (typeof client.createChatCompletion !== "function") {
    client.createChatCompletion = async (options) => {
      const response = await client.chat.completions.create(options);
      return { data: { choices: response.choices } };
    };
  }

  cachedClient = client;
  return cachedClient;
}

module.exports = { getOpenAIClient };

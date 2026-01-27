const OpenAI = require("openai");

let cachedClient = null;

function getOpenAIClient() {
  if (cachedClient) return cachedClient;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn("[OpenAI] OPENAI_API_KEY not set; using stubbed client");
    cachedClient = {
      chat: {
        completions: {
          create: async () => ({
            choices: [
              {
                message: {
                  content: "OpenAI is not configured. Set OPENAI_API_KEY to enable AI responses.",
                },
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
                message: {
                  content: "OpenAI is not configured. Set OPENAI_API_KEY to enable AI responses.",
                },
              },
            ],
          },
        };
      },
    };
    return cachedClient;
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

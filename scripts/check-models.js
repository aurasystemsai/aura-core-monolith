// scripts/check-models.js
require("dotenv").config();
const OpenAI = require("openai");

async function main() {
  // 1) Show that Node really sees your env var
  console.log("OPENAI_API_KEY (first 12 chars):", process.env.OPENAI_API_KEY?.slice(0, 12));
  console.log("OPENAI_ORG_ID:", process.env.OPENAI_ORG_ID || "(not set)");

  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is missing – check your .env file");
  }

  // 2) Create client – organization is optional
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    organization: process.env.OPENAI_ORG_ID, // you can delete this line if you want
  });

  // 3) Call the API
  const list = await client.models.list();

  const ids = [];
  for await (const m of list) {
    ids.push(m.id);
  }

  console.log("Models available in this project:");
  console.log(ids);
}

main().catch((err) => {
  console.error("Error listing models:");
  // pretty-print HTTP error info if present
  if (err.response && err.response.status) {
    console.error("Status:", err.response.status);
    console.error("Data:", err.response.data);
  } else {
    console.error(err);
  }
  process.exit(1);
});

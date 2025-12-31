// AI-powered analytics and insights for winback
const openai = require('./openai');

async function generateInsights(campaignData) {
  const prompt = `Analyze this winback campaign data and provide actionable insights, anomalies, and recommendations:\n${JSON.stringify(campaignData)}`;
  return openai.generateWinbackMessage({ prompt, tone: 'analytical' });
}

module.exports = { generateInsights };

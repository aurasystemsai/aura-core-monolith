const express = require('express');
const OpenAI = require('openai');
const db = require('./db');
const router = express.Router();

let _openai;
function getOpenAI() {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _openai;
}

// POST /ai/generate — generate business insights from data
router.post('/ai/generate', async (req, res) => {
  try {
    const { data, prompt, messages } = req.body || {};
    const model = 'gpt-4o-mini';
    const chatMessages = messages || [
      { role: 'system', content: 'You are a business analytics expert. Analyze the provided data and generate actionable insights with trends, anomalies, and recommendations.' },
      { role: 'user', content: prompt || `Generate business insights for: ${typeof data === 'string' ? data : JSON.stringify(data || 'e-commerce store')}` }
    ];
    const completion = await getOpenAI().chat.completions.create({
      model,
      messages: chatMessages,
      max_tokens: 600,
      temperature: 0.7
    });
    const reply = completion.choices[0]?.message?.content?.trim() || '';
    if (req.deductCredits) req.deductCredits({ model });
    await db.addInsight({ prompt: prompt || data, reply });
    res.json({ ok: true, result: reply });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

// GET /insights — list stored insights
router.get('/insights', async (req, res) => {
  try { res.json({ ok: true, insights: await db.listInsights() }); }
  catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

router.get('/health', (req, res) => {
  res.json({ ok: true, tool: 'auto-insights', ts: new Date().toISOString() });
});

module.exports = router;
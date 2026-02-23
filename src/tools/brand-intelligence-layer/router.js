const express = require('express');
const OpenAI = require('openai');
const db = require('./db');
const router = express.Router();

let _openai;
function getOpenAI() {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _openai;
}

// POST /dashboard — AI-powered brand dashboard analysis
router.post('/dashboard', async (req, res) => {
  try {
    const { input } = req.body || {};
    const model = 'gpt-4o-mini';
    const completion = await getOpenAI().chat.completions.create({
      model,
      messages: [
        { role: 'system', content: 'You are a brand intelligence expert. Analyze the brand data and return a JSON array of dashboard items. Each item: {"metric":"...","value":"...","trend":"up|down|stable","insight":"..."}. Return 5-8 items.' },
        { role: 'user', content: `Analyze this brand: ${typeof input === 'string' ? input : JSON.stringify(input || 'Generic e-commerce brand')}` }
      ],
      max_tokens: 600,
      temperature: 0.6
    });
    let dashboard;
    try { dashboard = JSON.parse(completion.choices[0]?.message?.content?.trim() || '[]'); }
    catch { dashboard = [{ metric: 'Brand Health', value: 'Analyzed', insight: completion.choices[0]?.message?.content?.trim() }]; }
    if (req.deductCredits) req.deductCredits({ model });
    await db.recordEvent({ type: 'dashboard', input });
    res.json({ ok: true, dashboard });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

// POST /insights — AI-powered brand insights
router.post('/insights', async (req, res) => {
  try {
    const { input } = req.body || {};
    const model = 'gpt-4o-mini';
    const completion = await getOpenAI().chat.completions.create({
      model,
      messages: [
        { role: 'system', content: 'You are a brand strategist. Generate actionable brand insights. Return a JSON array: [{"title":"...","description":"...","priority":"high|medium|low","category":"positioning|messaging|audience|competitor"}]. Return 4-6 insights.' },
        { role: 'user', content: `Generate insights for: ${typeof input === 'string' ? input : JSON.stringify(input || 'E-commerce brand')}` }
      ],
      max_tokens: 600,
      temperature: 0.7
    });
    let insights;
    try { insights = JSON.parse(completion.choices[0]?.message?.content?.trim() || '[]'); }
    catch { insights = [{ title: 'Brand Insight', description: completion.choices[0]?.message?.content?.trim() }]; }
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, insights });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

// POST /feedback
router.post('/feedback', async (req, res) => {
  try {
    await db.saveFeedback(req.body || {});
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

router.get('/health', (req, res) => {
  res.json({ ok: true, tool: 'brand-intelligence-layer', ts: new Date().toISOString() });
});

module.exports = router;

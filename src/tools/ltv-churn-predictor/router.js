const express = require('express');
const OpenAI = require('openai');
const db = require('./db');
const router = express.Router();

let _openai;
function getOpenAI() {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _openai;
}

// ── LTV Prediction — main endpoint ──────────────────────────────────────────
// POST /api/ltv-churn-predictor/ltv
// Frontend sends { input }, expects { ok, ltv: [...] }
router.post('/ltv', async (req, res) => {
  try {
    const { input } = req.body || {};
    if (!input) return res.status(400).json({ ok: false, error: 'input is required' });

    const model = 'gpt-4o-mini';
    const completion = await getOpenAI().chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: `You are a customer analytics expert for Shopify e-commerce stores. Analyze the customer data and predict Lifetime Value (LTV).

Return a JSON array of customer segments with predicted LTV. Each item should have:
- name: segment label (e.g. "High-Value Repeat Buyers", "At-Risk Churners")
- ltv: estimated dollar value
- confidence: percentage (0-100)
- recommendation: one-sentence action item

Return ONLY valid JSON array, no markdown, no explanation outside the array.
Example: [{"name":"High-Value Repeat","ltv":450,"confidence":85,"recommendation":"Offer VIP loyalty perks"}]`
        },
        { role: 'user', content: `Analyze this customer data for LTV prediction:\n${input}` }
      ],
      max_tokens: 800,
      temperature: 0.5
    });

    let ltv = [];
    const raw = completion.choices[0]?.message?.content?.trim() || '[]';
    try {
      ltv = JSON.parse(raw);
      if (!Array.isArray(ltv)) ltv = [ltv];
    } catch {
      ltv = [{ name: 'AI Analysis', ltv: 0, confidence: 0, recommendation: raw }];
    }

    if (req.deductCredits) req.deductCredits({ model });
    await db.savePrediction({ type: 'ltv', input: input.slice(0, 200), result: ltv });

    res.json({ ok: true, ltv });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ── Churn Prediction ─────────────────────────────────────────────────────────
// POST /api/ltv-churn-predictor/churn
// Frontend sends { input }, expects { ok, churn: [...] }
router.post('/churn', async (req, res) => {
  try {
    const { input } = req.body || {};
    if (!input) return res.status(400).json({ ok: false, error: 'input is required' });

    const model = 'gpt-4o-mini';
    const completion = await getOpenAI().chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: `You are a customer retention expert for Shopify e-commerce stores. Analyze the customer data and predict churn risk.

Return a JSON array of customer risk segments. Each item should have:
- name: risk segment label (e.g. "High Churn Risk - Inactive 90+ Days")
- risk: percentage 0-100
- signals: key churn signals detected
- recommendation: one-sentence retention action

Return ONLY valid JSON array, no markdown, no explanation outside the array.
Example: [{"name":"High Risk - No Purchase 90d","risk":85,"signals":"No orders in 90 days, low email engagement","recommendation":"Send win-back campaign with 20% discount"}]`
        },
        { role: 'user', content: `Analyze this customer data for churn prediction:\n${input}` }
      ],
      max_tokens: 800,
      temperature: 0.5
    });

    let churn = [];
    const raw = completion.choices[0]?.message?.content?.trim() || '[]';
    try {
      churn = JSON.parse(raw);
      if (!Array.isArray(churn)) churn = [churn];
    } catch {
      churn = [{ name: 'AI Analysis', risk: 0, signals: raw, recommendation: '' }];
    }

    if (req.deductCredits) req.deductCredits({ model });
    await db.savePrediction({ type: 'churn', input: input.slice(0, 200), result: churn });

    res.json({ ok: true, churn });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ── AI General ───────────────────────────────────────────────────────────────
router.post('/ai/generate', async (req, res) => {
  try {
    const { messages, prompt } = req.body || {};
    if (!messages && !prompt) return res.status(400).json({ ok: false, error: 'messages or prompt required' });

    const model = 'gpt-4o-mini';
    const chatMessages = messages || [
      { role: 'system', content: 'You are a customer analytics expert specializing in LTV prediction and churn prevention for Shopify e-commerce stores.' },
      { role: 'user', content: prompt }
    ];

    const completion = await getOpenAI().chat.completions.create({
      model,
      messages: chatMessages,
      max_tokens: 1024,
      temperature: 0.7
    });

    const reply = completion.choices[0]?.message?.content?.trim() || '';
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, reply });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ── Feedback ─────────────────────────────────────────────────────────────────
router.post('/feedback', async (req, res) => {
  try {
    const { feedback } = req.body || {};
    if (!feedback) return res.status(400).json({ ok: false, error: 'feedback is required' });
    res.json({ ok: true, entry: await db.saveFeedback({ feedback }) });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

// ── Health ───────────────────────────────────────────────────────────────────
router.get('/health', (req, res) => {
  res.json({ ok: true, tool: 'ltv-churn-predictor', ts: new Date().toISOString() });
});

module.exports = router;
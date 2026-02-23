const express = require('express');
const OpenAI = require('openai');
const db = require('./db');
const router = express.Router();

let _openai;
function getOpenAI() {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _openai;
}

// ── AI Track — main endpoint the frontend calls ──────────────────────────────
// POST /api/rank-visibility-tracker/ai/track
router.post('/ai/track', async (req, res) => {
  try {
    const { keyword, channels, aiModel } = req.body || {};
    if (!keyword) return res.status(400).json({ ok: false, error: 'keyword is required' });

    const model = 'gpt-4o-mini';
    const activeChannels = channels
      ? Object.keys(channels).filter(k => channels[k]).join(', ')
      : 'Google';

    const completion = await getOpenAI().chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: `You are an expert SEO rank analyst for Shopify e-commerce stores. The user wants to track keyword rankings and visibility.

Provide a comprehensive Rank & Visibility Report with these sections:
1. **Keyword Overview** — Search intent, difficulty estimate (1-100), monthly search volume estimate
2. **Current Ranking Assessment** — Estimated position range for this keyword on ${activeChannels}
3. **Visibility Score** — A 0-100 score estimating how visible the store is for this term
4. **Competitor Landscape** — 3-5 likely competitors ranking for this keyword
5. **Optimization Recommendations** — 3-5 specific, actionable steps to improve ranking
6. **Tracking Strategy** — How to monitor progress over time

Be specific with numbers and actionable recommendations. This is for a Shopify store.`
        },
        { role: 'user', content: `Analyze ranking potential and visibility for: "${keyword}"\nChannels: ${activeChannels}` }
      ],
      max_tokens: 1200,
      temperature: 0.7
    });

    const rankReport = completion.choices[0]?.message?.content?.trim() || '';

    // Generate structured analytics alongside the report
    const analytics = {
      keyword,
      channels: activeChannels,
      estimatedDifficulty: Math.floor(Math.random() * 40) + 30, // Placeholder until real API
      timestamp: new Date().toISOString(),
    };

    // Persist to history
    await db.create({
      keyword,
      channels: activeChannels,
      rankReport,
      analytics,
      model,
    });

    // Deduct credits
    if (req.deductCredits) req.deductCredits({ model });

    // Record analytics event
    await db.recordEvent({ type: 'ai-track', keyword, model });

    res.json({ ok: true, rankReport, analytics });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ── AI Generate — general AI assistant ───────────────────────────────────────
router.post('/ai/generate', async (req, res) => {
  try {
    const { messages, prompt } = req.body || {};
    if (!messages && !prompt) return res.status(400).json({ ok: false, error: 'messages or prompt required' });

    const model = 'gpt-4o-mini';
    const chatMessages = messages || [
      { role: 'system', content: 'You are an expert SEO rank tracking consultant for Shopify stores. Give actionable advice about keyword rankings, search visibility, and competitive positioning.' },
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
    const entry = await db.saveFeedback({ feedback });
    res.json({ ok: true, entry });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ── CRUD for tracked keywords ────────────────────────────────────────────────
router.get('/items', async (req, res) => {
  try { res.json({ ok: true, items: await db.list() }); }
  catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});
router.get('/items/:id', async (req, res) => {
  try {
    const item = await db.get(req.params.id);
    if (!item) return res.status(404).json({ ok: false, error: 'Not found' });
    res.json({ ok: true, item });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});
router.post('/items', async (req, res) => {
  try { res.json({ ok: true, item: await db.create(req.body || {}) }); }
  catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});
router.put('/items/:id', async (req, res) => {
  try {
    const item = await db.update(req.params.id, req.body || {});
    if (!item) return res.status(404).json({ ok: false, error: 'Not found' });
    res.json({ ok: true, item });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});
router.delete('/items/:id', async (req, res) => {
  try {
    const ok = await db.delete(req.params.id);
    if (!ok) return res.status(404).json({ ok: false, error: 'Not found' });
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

// ── Analytics ────────────────────────────────────────────────────────────────
router.get('/analytics', async (req, res) => {
  try { res.json({ ok: true, events: await db.listEvents() }); }
  catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});
router.post('/analytics', async (req, res) => {
  try { res.json({ ok: true, event: await db.recordEvent(req.body || {}) }); }
  catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

// ── Import / Export ──────────────────────────────────────────────────────────
router.post('/import', async (req, res) => {
  try {
    const { items } = req.body || {};
    if (!Array.isArray(items)) return res.status(400).json({ ok: false, error: 'items[] required' });
    const created = [];
    for (const item of items) created.push(await db.create(item));
    res.json({ ok: true, imported: created.length });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});
router.get('/export', async (req, res) => {
  try { res.json({ ok: true, items: await db.list() }); }
  catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

// ── Health ───────────────────────────────────────────────────────────────────
router.get('/health', (req, res) => {
  res.json({ ok: true, tool: 'rank-visibility-tracker', ts: new Date().toISOString() });
});

module.exports = router;
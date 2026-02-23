const express = require('express');
const OpenAI = require('openai');
const db = require('./db');
const router = express.Router();

let _openai;
function getOpenAI() {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _openai;
}

// GET /history — list scheduled posts
router.get('/history', async (req, res) => {
  try { res.json({ ok: true, history: await db.listHistory() }); }
  catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

// POST /history — save a scheduled post
router.post('/history', async (req, res) => {
  try {
    const item = await db.addHistory(req.body || {});
    res.json({ ok: true, item });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

// GET /analytics
router.get('/analytics', async (req, res) => {
  try { res.json({ ok: true, analytics: await db.listAnalytics() }); }
  catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

// POST /ai/schedule — AI-powered content scheduling
router.post('/ai/schedule', async (req, res) => {
  try {
    const { content } = req.body || {};
    if (!content) return res.status(400).json({ ok: false, error: 'content required' });

    const model = 'gpt-4o-mini';
    const completion = await getOpenAI().chat.completions.create({
      model,
      messages: [
        { role: 'system', content: 'You are a social media content strategist. Given content, generate an optimized social media post with: the refined post text, best posting times for each platform (Instagram, Facebook, Twitter, LinkedIn, TikTok), relevant hashtags, and a content calendar suggestion. Format as structured output.' },
        { role: 'user', content }
      ],
      max_tokens: 600,
      temperature: 0.7
    });
    const scheduledContent = completion.choices[0]?.message?.content?.trim() || '';
    if (req.deductCredits) req.deductCredits({ model });
    await db.addHistory({ content, scheduledContent, type: 'ai-generated' });
    await db.recordEvent({ type: 'ai-schedule', content: content.substring(0, 100) });
    res.json({ ok: true, scheduledContent });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

// POST /import
router.post('/import', async (req, res) => {
  try {
    const { data } = req.body || {};
    if (!data) return res.status(400).json({ ok: false, error: 'data required' });
    await db.importData(Array.isArray(data) ? data : [data]);
    res.json({ ok: true });
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
  res.json({ ok: true, tool: 'social-scheduler-content-engine', ts: new Date().toISOString() });
});

module.exports = router;
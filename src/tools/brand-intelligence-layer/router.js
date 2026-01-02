const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// POST /analyze - Brand Intelligence main endpoint
router.post('/analyze', async (req, res) => {
  try {
    const { messages, prompt, context } = req.body || {};
    if (!messages && !prompt) {
      return res.status(400).json({ ok: false, error: 'Missing messages or prompt' });
    }
    const chatMessages = messages || [
      { role: 'system', content: 'You are an expert AI for brand intelligence and market analysis.' },
      { role: 'user', content: prompt }
    ];
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: chatMessages,
      max_tokens: 512,
      temperature: 0.7
    });
    const reply = completion.choices[0]?.message?.content?.trim() || '';
    res.json({ ok: true, reply });
  } catch (err) {
    console.error('[Brand Intelligence Layer] Error:', err);
    res.status(500).json({ ok: false, error: err.message || 'AI error' });
  }
});

// GET /docs - API documentation
router.get('/docs', (req, res) => {
  res.json({
    ok: true,
    docs: 'POST /api/brand-intelligence-layer/analyze { messages: [...], prompt: string } => { ok, reply }'
  });
});

// GET /i18n - i18n strings
router.get('/i18n', (req, res) => {
  res.json({ ok: true, i18n: { title: 'Brand Intelligence Layer', input: 'Input', run: 'Analyze' } });
});

module.exports = router;

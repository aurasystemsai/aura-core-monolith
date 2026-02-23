const express = require('express');
const OpenAI = require('openai');
const db = require('./db');
const router = express.Router();

let _openai;
function getOpenAI() {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _openai;
}

// POST /ai/reply — AI-powered inbox reply generation
router.post('/ai/reply', async (req, res) => {
  try {
    const { message, channels, aiModel, bulkUpload } = req.body || {};
    if (!message && !bulkUpload) return res.status(400).json({ ok: false, error: 'message required' });

    const model = 'gpt-4o-mini';
    const channelList = Array.isArray(channels) ? channels.join(', ') : 'email';
    const completion = await getOpenAI().chat.completions.create({
      model,
      messages: [
        { role: 'system', content: `You are an expert customer support assistant for a Shopify store. Generate a professional, empathetic reply suitable for these channels: ${channelList}. Be concise but thorough.` },
        { role: 'user', content: bulkUpload || message }
      ],
      max_tokens: 512,
      temperature: 0.7
    });
    const reply = completion.choices[0]?.message?.content?.trim() || '';
    if (req.deductCredits) req.deductCredits({ model });
    await db.addConversation({ message, reply, channels });
    const analytics = { responseTime: '< 1s', channel: channelList, model };
    res.json({ ok: true, reply, analytics });
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
  res.json({ ok: true, tool: 'inbox-assistant', ts: new Date().toISOString() });
});

module.exports = router;

module.exports = router;
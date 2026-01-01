// Product SEO Engine: Express Router
const express = require('express');
const router = express.Router();
const model = require('./model');
const { OpenAI } = require('openai');

// LLM-powered SEO generation endpoint
router.post('/generate', async (req, res) => {
  try {
    const { productName, productDescription } = req.body;
    if (!productName || !productDescription) {
      return res.status(400).json({ ok: false, error: 'Missing productName or productDescription' });
    }
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const prompt = `Generate an SEO title, meta description, slug, and keyword set for the following product.\nProduct Name: ${productName}\nProduct Description: ${productDescription}`;
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are an expert e-commerce SEO assistant.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 512,
      temperature: 0.7
    });
    const reply = completion.choices[0]?.message?.content?.trim() || '';
    res.json({ ok: true, result: reply });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message || 'AI error' });
  }
});

// CRUD endpoints
router.get('/', async (req, res) => {
  res.json({ ok: true, data: await model.getAll() });
});

router.get('/:id', async (req, res) => {
  const data = await model.getById(req.params.id);
  if (!data) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true, data });
});

router.post('/', async (req, res) => {
  const created = await model.create(req.body);
  res.json({ ok: true, data: created });
});

router.put('/:id', async (req, res) => {
  const updated = await model.update(req.params.id, req.body);
  res.json({ ok: true, data: updated });
});

router.delete('/:id', async (req, res) => {
  await model.remove(req.params.id);
  res.json({ ok: true });
});

module.exports = router;

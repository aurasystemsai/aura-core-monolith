const express = require('express');
const OpenAI = require('openai');
const db = require('./db');
const router = express.Router();

let _openai;
function getOpenAI() {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _openai;
}

// POST /ai/suggest - AI inventory optimization suggestions
router.post('/ai/suggest', async (req, res) => {
  try {
    const { supplierData } = req.body || {};
    if (!supplierData) return res.status(400).json({ ok: false, error: 'supplierData required' });
    const model = 'gpt-4o-mini';
    const completion = await getOpenAI().chat.completions.create({
      model,
      messages: [
        { role: 'system', content: 'You are a supply chain and inventory optimization expert for e-commerce. Analyze the supplier/inventory data and provide actionable suggestions for reorder points, safety stock levels, supplier diversification, and cost optimization.' },
        { role: 'user', content: typeof supplierData === 'string' ? supplierData : JSON.stringify(supplierData) }
      ],
      max_tokens: 600,
      temperature: 0.6
    });
    const suggestion = completion.choices[0]?.message?.content?.trim() || '';
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, suggestion });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

// POST /ai/sync - AI-powered inventory sync analysis
router.post('/ai/sync', async (req, res) => {
  try {
    const { supplierData } = req.body || {};
    if (!supplierData) return res.status(400).json({ ok: false, error: 'supplierData required' });
    const model = 'gpt-4o-mini';
    const completion = await getOpenAI().chat.completions.create({
      model,
      messages: [
        { role: 'system', content: 'You are an inventory sync analyst. Analyze the supplier data and produce a sync summary. Include: total SKUs analyzed, sync status for each supplier, discrepancies found, recommended actions, and a risk assessment. Return as structured text with clear sections.' },
        { role: 'user', content: typeof supplierData === 'string' ? supplierData : JSON.stringify(supplierData) }
      ],
      max_tokens: 600,
      temperature: 0.5
    });
    const summary = completion.choices[0]?.message?.content?.trim() || '';
    if (req.deductCredits) req.deductCredits({ model });
    await db.addSync({ supplierData: typeof supplierData === 'string' ? supplierData.substring(0, 200) : 'structured-data', summary: summary.substring(0, 200) });
    const analytics = { summary, syncedAt: new Date().toISOString() };
    res.json({ ok: true, analytics });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

router.get('/health', (req, res) => {
  res.json({ ok: true, tool: 'inventory-supplier-sync', ts: new Date().toISOString() });
});

module.exports = router;

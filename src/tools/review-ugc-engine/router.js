const express = require('express');
const OpenAI = require('openai');
const db = require('./db');
const router = express.Router();

let _openai;
function getOpenAI() {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _openai;
}

// ═══════════════════ REVIEWS ═══════════════════════════════════════════════
router.post('/reviews/search', async (req, res) => {
  try {
    const all = await db.reviews.list();
    const { productId, status, rating } = req.body || {};
    let filtered = all;
    if (productId) filtered = filtered.filter(r => r.productId === productId);
    if (status) filtered = filtered.filter(r => r.status === status);
    if (rating) filtered = filtered.filter(r => r.rating === Number(rating));
    res.json({ ok: true, reviews: filtered });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

router.get('/reviews/statistics', async (req, res) => {
  try {
    const all = await db.reviews.list();
    const total = all.length;
    const avgRating = total ? (all.reduce((s, r) => s + (r.rating || 0), 0) / total).toFixed(1) : 0;
    const byRating = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    all.forEach(r => { if (r.rating >= 1 && r.rating <= 5) byRating[r.rating]++; });
    const pending = all.filter(r => r.status === 'pending').length;
    const approved = all.filter(r => r.status === 'approved').length;
    res.json({ ok: true, total, avgRating: Number(avgRating), byRating, pending, approved });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

router.post('/reviews', async (req, res) => {
  try {
    const review = await db.reviews.create({ ...req.body, status: 'pending', responses: [] });
    res.status(201).json({ ok: true, review });
  } catch (err) { res.status(400).json({ ok: false, error: err.message }); }
});

router.get('/reviews/:id', async (req, res) => {
  try {
    const review = await db.reviews.get(req.params.id);
    if (!review) return res.status(404).json({ ok: false, error: 'Not found' });
    res.json({ ok: true, review });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

router.delete('/reviews/:id', async (req, res) => {
  try {
    const ok = await db.reviews.delete(req.params.id);
    if (!ok) return res.status(404).json({ ok: false, error: 'Not found' });
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

router.post('/reviews/:id/moderate', async (req, res) => {
  try {
    const { action } = req.body || {};
    const status = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'pending';
    const review = await db.reviews.update(req.params.id, { status, moderatedAt: new Date().toISOString() });
    if (!review) return res.status(404).json({ ok: false, error: 'Not found' });
    res.json({ ok: true, review });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

router.post('/reviews/:id/responses', async (req, res) => {
  try {
    const review = await db.reviews.get(req.params.id);
    if (!review) return res.status(404).json({ ok: false, error: 'Not found' });
    const responses = review.responses || [];
    responses.push({ text: req.body.response, createdAt: new Date().toISOString() });
    const updated = await db.reviews.update(req.params.id, { responses });
    res.json({ ok: true, review: updated });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

// ═══════════════════ CAMPAIGNS ═════════════════════════════════════════════
router.get('/campaigns', async (req, res) => {
  try { res.json({ ok: true, campaigns: await db.campaigns.list() }); }
  catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});
router.post('/campaigns', async (req, res) => {
  try { res.json({ ok: true, campaign: await db.campaigns.create(req.body || {}) }); }
  catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});
router.delete('/campaigns/:id', async (req, res) => {
  try {
    const ok = await db.campaigns.delete(req.params.id);
    if (!ok) return res.status(404).json({ ok: false, error: 'Not found' });
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});
router.post('/campaigns/send-request', async (req, res) => {
  try {
    // Record the send request
    await db.recordEvent({ type: 'review-request-sent', ...req.body });
    res.json({ ok: true, sent: true, message: 'Review request queued' });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

// ═══════════════════ EMAIL TEMPLATES ═══════════════════════════════════════
router.get('/email-templates', async (req, res) => {
  try { res.json({ ok: true, templates: await db.templates.list() }); }
  catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});
router.post('/email-templates', async (req, res) => {
  try { res.json({ ok: true, template: await db.templates.create(req.body || {}) }); }
  catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});
router.delete('/email-templates/:id', async (req, res) => {
  try {
    const ok = await db.templates.delete(req.params.id);
    if (!ok) return res.status(404).json({ ok: false, error: 'Not found' });
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

// ═══════════════════ COLLECTION WIDGETS ════════════════════════════════════
router.get('/collection-widgets', async (req, res) => {
  try { res.json({ ok: true, widgets: await db.widgets.list() }); }
  catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});
router.post('/collection-widgets', async (req, res) => {
  try { res.json({ ok: true, widget: await db.widgets.create(req.body || {}) }); }
  catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});
router.get('/collection/statistics', async (req, res) => {
  try {
    const reviews = await db.reviews.list();
    const campaigns = await db.campaigns.list();
    res.json({ ok: true, totalReviews: reviews.length, totalCampaigns: campaigns.length });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

// ═══════════════════ MODERATION ════════════════════════════════════════════
router.get('/moderation/queue', async (req, res) => {
  try {
    const all = await db.reviews.list();
    res.json({ ok: true, queue: all.filter(r => r.status === 'pending') });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});
router.post('/moderation/queue/:id/review', async (req, res) => {
  try {
    const { action } = req.body || {};
    const status = action === 'approve' ? 'approved' : 'rejected';
    const review = await db.reviews.update(req.params.id, { status });
    if (!review) return res.status(404).json({ ok: false, error: 'Not found' });
    res.json({ ok: true, review });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});
router.get('/moderation/rules', async (req, res) => {
  try { res.json({ ok: true, rules: await db.moderationRules.list() }); }
  catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});
router.post('/moderation/rules', async (req, res) => {
  try { res.json({ ok: true, rule: await db.moderationRules.create(req.body || {}) }); }
  catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});
router.delete('/moderation/rules/:id', async (req, res) => {
  try {
    const ok = await db.moderationRules.delete(req.params.id);
    if (!ok) return res.status(404).json({ ok: false, error: 'Not found' });
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});
router.post('/moderation/moderate', async (req, res) => {
  try {
    const { content } = req.body || {};
    const blockedWords = await db.getBlockedWords();
    const flagged = blockedWords.some(w => (content || '').toLowerCase().includes(w.toLowerCase()));
    res.json({ ok: true, flagged, reason: flagged ? 'Contains blocked word' : null });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});
router.get('/moderation/blocked-words', async (req, res) => {
  try { res.json({ ok: true, words: await db.getBlockedWords() }); }
  catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});
router.post('/moderation/blocked-words', async (req, res) => {
  try {
    const { word } = req.body || {};
    if (!word) return res.status(400).json({ ok: false, error: 'word required' });
    await db.addBlockedWord(word);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});
router.delete('/moderation/blocked-words/:word', async (req, res) => {
  try {
    await db.removeBlockedWord(decodeURIComponent(req.params.word));
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});
router.get('/moderation/blocked-emails', async (req, res) => {
  try { res.json({ ok: true, emails: await db.getBlockedEmails() }); }
  catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});
router.post('/moderation/blocked-emails', async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ ok: false, error: 'email required' });
    await db.addBlockedEmail(email);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});
router.delete('/moderation/blocked-emails/:email', async (req, res) => {
  try {
    await db.removeBlockedEmail(decodeURIComponent(req.params.email));
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});
router.get('/moderation/statistics', async (req, res) => {
  try {
    const all = await db.reviews.list();
    res.json({
      ok: true,
      total: all.length,
      pending: all.filter(r => r.status === 'pending').length,
      approved: all.filter(r => r.status === 'approved').length,
      rejected: all.filter(r => r.status === 'rejected').length,
    });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

// ═══════════════════ SENTIMENT AI ══════════════════════════════════════════
router.post('/sentiment/analyze', async (req, res) => {
  try {
    const { content } = req.body || {};
    if (!content) return res.status(400).json({ ok: false, error: 'content required' });

    const model = 'gpt-4o-mini';
    const completion = await getOpenAI().chat.completions.create({
      model,
      messages: [
        { role: 'system', content: 'Analyze sentiment. Return JSON: {"sentiment":"positive"|"negative"|"neutral","score":0-100,"keywords":["..."],"summary":"..."}' },
        { role: 'user', content }
      ],
      max_tokens: 300,
      temperature: 0.3
    });

    let result;
    try { result = JSON.parse(completion.choices[0]?.message?.content?.trim() || '{}'); }
    catch { result = { sentiment: 'neutral', score: 50, summary: completion.choices[0]?.message?.content?.trim() }; }

    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, ...result });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

router.post('/sentiment/batch-analyze', async (req, res) => {
  try {
    const { items } = req.body || {};
    if (!Array.isArray(items)) return res.status(400).json({ ok: false, error: 'items[] required' });

    const model = 'gpt-4o-mini';
    const completion = await getOpenAI().chat.completions.create({
      model,
      messages: [
        { role: 'system', content: 'Analyze sentiment of each review. Return JSON array: [{"index":0,"sentiment":"positive"|"negative"|"neutral","score":0-100}]' },
        { role: 'user', content: items.map((t, i) => `${i}: ${typeof t === 'string' ? t : t.content || t.text || ''}`).join('\n') }
      ],
      max_tokens: 600,
      temperature: 0.3
    });

    let results;
    try { results = JSON.parse(completion.choices[0]?.message?.content?.trim() || '[]'); }
    catch { results = []; }

    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, results });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

router.post('/sentiment/insights', async (req, res) => {
  try {
    const reviews = await db.reviews.list();
    const recentReviews = reviews.slice(0, 20);
    res.json({
      ok: true,
      totalAnalyzed: recentReviews.length,
      avgSentiment: recentReviews.length ? (recentReviews.reduce((s, r) => s + (r.rating || 3), 0) / recentReviews.length * 20).toFixed(0) : 50,
      topKeywords: [],
    });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

router.post('/sentiment/trends', async (req, res) => {
  try {
    res.json({ ok: true, trends: [], period: 'last-30-days' });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

router.get('/sentiment/statistics', async (req, res) => {
  try {
    const reviews = await db.reviews.list();
    res.json({ ok: true, total: reviews.length, analyzed: reviews.filter(r => r.sentiment).length });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

router.post('/sentiment/summary', async (req, res) => {
  try {
    const reviews = await db.reviews.list();
    const total = reviews.length;
    const avgRating = total ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / total).toFixed(1) : 0;
    res.json({ ok: true, total, avgRating: Number(avgRating), summary: `${total} reviews with average rating ${avgRating}` });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

// ═══════════════════ SOCIAL PROOF ══════════════════════════════════════════
router.get('/social-proof/display-rules', async (req, res) => {
  try { res.json({ ok: true, rules: await db.socialProofRules.list() }); }
  catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});
router.post('/social-proof/display-rules', async (req, res) => {
  try { res.json({ ok: true, rule: await db.socialProofRules.create(req.body || {}) }); }
  catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});
router.delete('/social-proof/display-rules/:id', async (req, res) => {
  try {
    const ok = await db.socialProofRules.delete(req.params.id);
    if (!ok) return res.status(404).json({ ok: false, error: 'Not found' });
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});
router.get('/social-proof/trust-badges', async (req, res) => {
  try { res.json({ ok: true, badges: await db.trustBadges.list() }); }
  catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});
router.post('/social-proof/trust-badges', async (req, res) => {
  try { res.json({ ok: true, badge: await db.trustBadges.create(req.body || {}) }); }
  catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});
router.delete('/social-proof/trust-badges/:id', async (req, res) => {
  try {
    const ok = await db.trustBadges.delete(req.params.id);
    if (!ok) return res.status(404).json({ ok: false, error: 'Not found' });
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});
router.post('/social-proof/elements/get', async (req, res) => {
  try { res.json({ ok: true, elements: await db.socialProofElements.list() }); }
  catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});
router.post('/social-proof/elements', async (req, res) => {
  try { res.json({ ok: true, element: await db.socialProofElements.create(req.body || {}) }); }
  catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});
router.get('/social-proof/ab-tests', async (req, res) => {
  try { res.json({ ok: true, tests: await db.abTests.list() }); }
  catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});
router.post('/social-proof/conversion-insights', async (req, res) => {
  try { res.json({ ok: true, conversionRate: 0, totalImpressions: 0, totalClicks: 0 }); }
  catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});
router.get('/social-proof/statistics', async (req, res) => {
  try {
    const rules = await db.socialProofRules.list();
    const badges = await db.trustBadges.list();
    res.json({ ok: true, totalRules: rules.length, totalBadges: badges.length });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

// ═══════════════════ AI GENERATE ═══════════════════════════════════════════
router.post('/ai/generate', async (req, res) => {
  try {
    const { product, sentiment, messages, prompt } = req.body || {};
    const model = 'gpt-4o-mini';
    const chatMessages = messages || [
      { role: 'system', content: 'You are a review and UGC expert for Shopify stores. Generate realistic, helpful content.' },
      { role: 'user', content: prompt || `Write a ${sentiment || 'positive'} review for ${product || 'this product'}` }
    ];
    const completion = await getOpenAI().chat.completions.create({
      model,
      messages: chatMessages,
      max_tokens: 512,
      temperature: 0.7
    });
    const reply = completion.choices[0]?.message?.content?.trim() || '';
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, reply, review: reply });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

// ═══════════════════ ANALYTICS ═════════════════════════════════════════════
router.get('/analytics', async (req, res) => {
  try { res.json({ ok: true, analytics: await db.listEvents() }); }
  catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

// ═══════════════════ HEALTH ════════════════════════════════════════════════
router.get('/health', (req, res) => {
  res.json({ ok: true, tool: 'review-ugc-engine', ts: new Date().toISOString() });
});

module.exports = router;
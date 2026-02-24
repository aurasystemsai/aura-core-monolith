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

/* ==========================================================================
   FEATURE 71: SERP Feature Tracker
   POST /api/rank-visibility-tracker/serp-features
   Analyzes which SERP features appear for given keywords
   ========================================================================== */
router.post('/serp-features', async (req, res) => {
  try {
    const { keywords, domain, model = 'gpt-4o-mini' } = req.body || {};
    if (!Array.isArray(keywords) || keywords.length === 0) return res.status(400).json({ ok: false, error: 'keywords[] required' });

    const completion = await getOpenAI().chat.completions.create({
      model,
      messages: [{
        role: 'user',
        content: `You are a Google SERP analysis expert. For each keyword, analyze what SERP features are likely to appear and which a Shopify e-commerce store could realistically win.

Domain: ${domain || 'Not specified'}
Keywords: ${keywords.slice(0, 10).join(', ')}

For each keyword, analyze:
- Featured Snippet: probability 0-100, content type needed (definition|list|table|how-to)
- People Also Ask: how many PAA boxes likely, sample questions
- AI Overview: likely present or not, type
- Image Pack: probability 0-100
- Video Carousel: probability 0-100
- Shopping Ads: probability (high for commercial keywords)
- Knowledge Panel: probability
- Local Pack: probability (for local queries)

Which features is this store most likely to WIN and HOW?

Respond as JSON:
{
  "keywords": [
    {
      "keyword": "string",
      "featuredSnippet": { "probability": 65, "type": "list", "howToWin": "Create a numbered list answering the query directly in first 100 words" },
      "peopleAlsoAsk": { "probability": 85, "sampleQuestions": ["q1","q2","q3"] },
      "aiOverview": { "present": true, "type": "informational" },
      "imagePack": { "probability": 40 },
      "videoCarousel": { "probability": 20 },
      "shoppingAds": { "probability": 80 },
      "topOpportunity": "Featured Snippet",
      "quickWin": "What to change on the page to win this feature"
    }
  ],
  "bestOpportunities": ["top 3 keyword+feature combinations to target first"]
}`
      }],
      response_format: { type: 'json_object' },
      max_tokens: 1500,
    });

    const result = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    await db.recordEvent({ type: 'serp-features', keywordCount: keywords.length });
    res.json({ ok: true, domain, ...result });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* ==========================================================================
   FEATURE 72: CTR Estimator
   POST /api/rank-visibility-tracker/ctr-estimate
   Models expected organic CTR considering AI Overviews and ads
   ========================================================================== */
router.post('/ctr-estimate', async (req, res) => {
  try {
    const { keywords, currentPositions, model = 'gpt-4o-mini' } = req.body || {};
    if (!Array.isArray(keywords) || keywords.length === 0) return res.status(400).json({ ok: false, error: 'keywords[] required' });

    // Standard CTR curve (based on Sistrix/Backlinko 2024-2025 data)
    const baseCTR = [28.5, 15.7, 11.0, 8.1, 6.1, 4.9, 3.9, 3.3, 2.7, 2.4];

    const completion = await getOpenAI().chat.completions.create({
      model,
      messages: [{
        role: 'user',
        content: `You are a CTR (Click-Through Rate) modeling expert for organic search in 2026. Model the expected CTR for these keywords, considering:
- AI Overview presence (reduces CTR by ~30-60% for informational queries)
- Shopping ads (reduce CTR for commercial/product queries)
- Featured snippets (can reduce clicks or increase them depending on type)
- Current ranking position

Keywords and current positions: ${JSON.stringify(keywords.slice(0, 10).map((k, i) => ({ keyword: k, position: currentPositions?.[i] || 5 })))}

For each keyword, provide:
- estimatedBaseCTR: CTR without SERP features (based on position)
- aiOverviewPresent: true/false
- aiOverviewCTRImpact: percentage reduction from AI Overview (-30 to 0)
- adsCTRImpact: percentage reduction from ads (-20 to 0)
- adjustedCTR: final estimated CTR after all adjustments
- monthlyClickEstimate: if search volume is 1000/month, estimated clicks
- recommendation: how to improve CTR for this keyword

Respond as JSON:
{
  "keywords": [
    {
      "keyword": "string",
      "position": 5,
      "estimatedBaseCTR": 6.1,
      "aiOverviewPresent": true,
      "aiOverviewCTRImpact": -35,
      "adsCTRImpact": -15,
      "adjustedCTR": 3.2,
      "monthlyClickEstimate": 32,
      "titleTagImpact": "How a better title tag could improve CTR",
      "recommendation": "string"
    }
  ],
  "totalAdjustedTraffic": "Estimated total monthly clicks across all keywords (per 1000 search volume each)",
  "ctrInsight": "Key insight about CTR in this keyword set"
}`
      }],
      response_format: { type: 'json_object' },
      max_tokens: 1200,
    });

    const result = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    await db.recordEvent({ type: 'ctr-estimate' });
    res.json({ ok: true, baseCTRCurve: baseCTR, ...result });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* ==========================================================================
   FEATURE 73: Content Decay Monitor
   POST /api/rank-visibility-tracker/decay-check
   Detects content losing rankings and suggests refresh priorities
   ========================================================================== */
router.post('/decay-check', async (req, res) => {
  try {
    const { pages, model = 'gpt-4o-mini' } = req.body || {};
    if (!Array.isArray(pages) || pages.length === 0) return res.status(400).json({ ok: false, error: 'pages[] required (each: { url, title, publishDate, currentPosition, previousPosition, traffic })' });

    const completion = await getOpenAI().chat.completions.create({
      model,
      messages: [{
        role: 'user',
        content: `You are an SEO content decay specialist. Analyze these pages for content decay signals and prioritize which ones need immediate refreshing.

Pages data: ${JSON.stringify(pages.slice(0, 20))}

For each page, assess:
1. Decay severity: none | mild | moderate | severe | critical
2. Root cause: outdated-content | competitor-surge | algorithm-update | thin-content | technical-issue | ai-overview-cannibalization
3. Refresh priority: 1-10 (10 = immediate action needed)
4. Estimated traffic lost
5. Specific refresh actions needed
6. Expected timeline to recover ranking after refresh

Consider:
- Position drops > 10 places = severe decay
- Position drops 5-10 = moderate
- Pages published > 12 months ago with declining positions
- High-traffic pages losing position are highest priority

Respond as JSON:
{
  "pages": [
    {
      "url": "string",
      "title": "string",
      "decaySeverity": "moderate",
      "rootCause": "outdated-content",
      "refreshPriority": 8,
      "estimatedTrafficLost": "35%",
      "refreshActions": ["Update statistics to 2026 data", "Add FAQ section targeting PAA"],
      "recoveryTimeline": "4-8 weeks after refresh",
      "urgency": "Act within 2 weeks"
    }
  ],
  "topPriorityPages": ["URLs of top 3 pages to refresh first"],
  "quickWins": ["Pages that need minimal work for maximum recovery"]
}`
      }],
      response_format: { type: 'json_object' },
      max_tokens: 1500,
    });

    const result = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    await db.recordEvent({ type: 'decay-check', pageCount: pages.length });
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* ==========================================================================
   FEATURE 74: Rank Drop Root Cause Analyzer
   POST /api/rank-visibility-tracker/drop-analysis
   Correlates ranking drops with algo updates and competitor changes
   ========================================================================== */
router.post('/drop-analysis', async (req, res) => {
  try {
    const { url, keyword, dropDate, previousPosition, currentPosition, model = 'gpt-4o-mini' } = req.body || {};
    if (!url || !keyword) return res.status(400).json({ ok: false, error: 'url and keyword required' });

    // Known major Google algo updates reference (simplified)
    const algoUpdates = [
      { name: 'Google Helpful Content System (rolling)', date: '2023-09', type: 'content-quality' },
      { name: 'Google Core Update March 2024', date: '2024-03', type: 'core' },
      { name: 'Google Spam Update June 2024', date: '2024-06', type: 'spam' },
      { name: 'Google August 2024 Core Update', date: '2024-08', type: 'core' },
      { name: 'Google AI Overview Expansion', date: '2024-05', type: 'ai-overview' },
      { name: 'Google Core Update December 2024', date: '2024-12', type: 'core' },
      { name: 'Google Core Update February 2025', date: '2025-02', type: 'core' },
      { name: 'Google AI Overviews Global Expansion', date: '2025-03', type: 'ai-overview' },
      { name: 'Google Core Update Summer 2025', date: '2025-07', type: 'core' },
      { name: 'Google Helpful Content Update 2026', date: '2026-01', type: 'content-quality' },
    ];

    const completion = await getOpenAI().chat.completions.create({
      model,
      messages: [{
        role: 'user',
        content: `You are a Google ranking expert performing root cause analysis on a ranking drop.

Page: ${url}
Keyword: "${keyword}"
Drop detected: ${dropDate || 'recently'}
Position change: Position ${previousPosition || '?'} → Position ${currentPosition || '?'}

Known Google Algorithm Updates (for correlation): ${JSON.stringify(algoUpdates)}

Perform comprehensive root cause analysis:

1. Check if drop aligns with any known algorithm update
2. Assess likely root cause categories:
   - E-E-A-T signals weakened (author expertise, experience signals)
   - Helpful Content system (thin, AI-generated, unhelpful content)
   - Core ranking signals (backlinks, authority, relevance)  
   - AI Overview launched for this query (zero-click cannibalization)
   - Competitor content improvement
   - Technical issues (Core Web Vitals, crawlability)
   - Content freshness/staleness

3. Provide specific recovery recommendations in priority order

Respond as JSON:
{
  "likelyRootCauses": [
    { "cause": "string", "probability": 0-100, "explanation": "string" }
  ],
  "algoUpdateCorrelation": { "updateName": "string or null", "correlationStrength": "strong|possible|unlikely", "explanation": "string" },
  "recoveryPlan": [
    { "action": "string", "priority": 1-5, "effort": "low|medium|high", "expectedImpact": "string", "timeline": "string" }
  ],
  "urgencyLevel": "immediate|soon|monitor",
  "estimatedRecoveryTime": "string",
  "verdict": "One paragraph summary of what happened and what to do"
}`
      }],
      response_format: { type: 'json_object' },
      max_tokens: 1200,
    });

    const result = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    await db.recordEvent({ type: 'drop-analysis', url, keyword });
    res.json({ ok: true, url, keyword, previousPosition, currentPosition, algoUpdates, ...result });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* ==========================================================================
   FEATURE 75 & 76: Share of Voice + SERP Volatility
   POST /api/rank-visibility-tracker/sov-volatility
   ========================================================================== */
router.post('/sov-volatility', async (req, res) => {
  try {
    const { domain, competitors, keywords, model = 'gpt-4o-mini' } = req.body || {};
    if (!domain) return res.status(400).json({ ok: false, error: 'domain required' });
    if (!Array.isArray(keywords) || keywords.length === 0) return res.status(400).json({ ok: false, error: 'keywords[] required' });

    const completion = await getOpenAI().chat.completions.create({
      model,
      messages: [{
        role: 'user',
        content: `You are an SEO analyst measuring Share of Voice and SERP volatility for a Shopify store.

Domain: ${domain}
Competitors: ${Array.isArray(competitors) ? competitors.join(', ') : 'not specified'}
Tracked keywords: ${keywords.slice(0, 15).join(', ')}

Analyze:

1. SHARE OF VOICE (SoV): Estimate what % of total organic search impressions for this keyword set the given domain captures vs. competitors. Consider:
   - Estimated ranking positions (based on content quality signals)
   - CTR at those positions
   - Keyword search volumes (relative)

2. SERP VOLATILITY: For each keyword, assess current SERP stability:
   - Volatility score 0-100 (100 = highly volatile/changing)
   - Reason for volatility (algorithm test, AI Overview expansion, fierce competition, trending topic)
   - Recommended action (hold current strategy | urgent optimization | monitor weekly)

Respond as JSON:
{
  "shareOfVoice": {
    "domain": "${domain}",
    "estimatedSoV": 0-100,
    "sivLabel": "Dominant|Strong|Moderate|Weak|Minimal",
    "keyInsight": "string",
    "competitorComparison": [
      { "domain": "competitor.com", "estimatedSoV": 0-100, "relativeStrength": "stronger|similar|weaker" }
    ]
  },
  "volatility": {
    "overallVolatilityScore": 0-100,
    "assessment": "Stable|Moderately Volatile|Highly Volatile",
    "likelyCause": "string",
    "keywords": [
      { "keyword": "string", "volatilityScore": 0-100, "reason": "string", "action": "string" }
    ],
    "alertLevel": "normal|watch|urgent"
  },
  "recommendations": ["top 3 strategic recommendations"]
}`
      }],
      response_format: { type: 'json_object' },
      max_tokens: 1200,
    });

    const result = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    await db.recordEvent({ type: 'sov-volatility', domain });
    res.json({ ok: true, domain, ...result });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
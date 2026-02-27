
const express = require("express");
const OpenAI = require("openai");
const db = require("./db");
const analyticsModel = require("./analyticsModel");
const notificationModel = require("./notificationModel");
const rbac = require("./rbac");
const i18n = require("./i18n");
const webhookModel = require("./webhookModel");
const complianceModel = require("./complianceModel");
const pluginSystem = require("./pluginSystem");
const { analyzeLinkIntersect } = require("./linkIntersectOutreachService");
const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// CRUD endpoints
router.get('/campaigns', (req, res) => {
  res.json({ ok: true, campaigns: db.list() });
});
router.get('/campaigns/:id', (req, res) => {
  const campaign = db.get(req.params.id);
  if (!campaign) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true, campaign });
});
router.post('/campaigns', (req, res) => {
  const campaign = db.create(req.body || {});
  res.json({ ok: true, campaign });
});
router.put('/campaigns/:id', (req, res) => {
  const campaign = db.update(req.params.id, req.body || {});
  if (!campaign) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true, campaign });
});
router.delete('/campaigns/:id', (req, res) => {
  const ok = db.delete(req.params.id);
  if (!ok) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true });
});

// AI endpoint: analyze link intersect
router.post('/ai/analyze', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ ok: false, error: 'Query required' });
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are a link intersect outreach expert.' },
        { role: 'user', content: query }
      ],
      max_tokens: 512
    });
    const analysis = completion.choices[0]?.message?.content?.trim() || '';
    res.json({ ok: true, analysis });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Legacy analyze endpoint
router.post("/analyze", async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== "string") {
      return res.json({ ok: false, error: "Missing or invalid query" });
    }
    const result = await analyzeLinkIntersect(query);
    res.json({ ok: true, result });
  } catch (err) {
    res.json({ ok: false, error: err.message });
  }
});

// Analytics endpoints
router.post('/analytics', (req, res) => {
  const event = analyticsModel.recordEvent(req.body || {});
  res.json({ ok: true, event });
});
router.get('/analytics', (req, res) => {
  res.json({ ok: true, analytics: analyticsModel.list() });
});

router.get('/export', (req, res) => {
  // Placeholder: implement export logic
  res.json({ ok: true, data: db.list() });
});

// Import/export endpoints (persistent)
router.post('/import', (req, res) => {
  const { items } = req.body || {};
  if (!Array.isArray(items)) return res.status(400).json({ ok: false, error: 'items[] required' });
  db.import(items);
  res.json({ ok: true, count: db.list().length });
});
router.get('/export', (req, res) => {
  res.json({ ok: true, items: db.list() });
});

// Notifications
router.post('/notify', (req, res) => {
  notificationModel.send(req.body || {});
  res.json({ ok: true });
});

// RBAC example
router.post('/rbac/check', (req, res) => {
  const allowed = rbac.check(req.body.user, req.body.action);
  res.json({ ok: true, allowed });
});

// i18n example
router.get('/i18n/:lang', (req, res) => {
  res.json({ ok: true, strings: i18n.getStrings(req.params.lang) });
});

// Compliance
router.get('/compliance', (req, res) => {
  res.json({ ok: true, compliance: complianceModel.get() });
});

// Plugins
router.post('/plugin', (req, res) => {
  pluginSystem.run(req.body || {});
  res.json({ ok: true });
});

// Webhooks
router.post('/webhook', (req, res) => {
  webhookModel.trigger(req.body || {});
  res.json({ ok: true });
});

/* ==========================================================================
   FEATURE 63: Unlinked Brand Mention Finder
   POST /api/link-intersect-outreach/unlinked-mentions
   Finds pages that mention your brand/site but don't link to it
   ========================================================================== */
router.post('/unlinked-mentions', async (req, res) => {
  try {
    const { brand, domain, competitors = [], model = 'gpt-4o-mini' } = req.body || {};
    if (!brand) return res.status(400).json({ ok: false, error: 'brand required' });
    const completion = await openai.chat.completions.create({
      model,
      messages: [{
        role: 'user',
        content: `You are a link building specialist. Generate an actionable unlinked brand mention strategy for "${brand}" (domain: ${domain || 'not specified'}).

Competitors for comparison: ${competitors.length ? competitors.join(', ') : 'none'}

Return JSON:
{
  "brandMentionStrategy": {
    "searchQueries": ["Google search queries to find unlinked mentions (use intext: operator)"],
    "platforms": ["Reddit|Quora|Industry blogs|News sites|Review sites"],
    "monitoringTools": ["tool recommendations"],
    "automationTips": ["how to set up alerts"]
  },
  "outreachEmailTemplate": {
    "subject": "...",
    "body": "polite email asking for a link attribution",
    "followUpSubject": "...",
    "followUpBody": "..."
  },
  "prioritizationCriteria": ["how to prioritize which mentions to chase"],
  "estimatedMonthlyMentions": "estimate for a brand this size",
  "conversionRate": "typical conversion rate for unlinked mention outreach"
}`
      }],
      response_format: { type: 'json_object' },
      max_tokens: 1200,
    });
    const result = JSON.parse(completion.choices[0].message.content);
    res.json({ ok: true, brand, domain, ...result });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* ==========================================================================
   FEATURE 64: AI Citation Outreach Tool
   POST /api/link-intersect-outreach/citation-outreach
   Generates personalized outreach for citation link building
   ========================================================================== */
router.post('/citation-outreach', async (req, res) => {
  try {
    const { targetSite, yourSite, yourContent, angle = '', model = 'gpt-4o-mini' } = req.body || {};
    if (!targetSite || !yourSite) return res.status(400).json({ ok: false, error: 'targetSite and yourSite required' });
    const completion = await openai.chat.completions.create({
      model,
      messages: [{
        role: 'user',
        content: `You are a link building outreach expert. Write personalized citation outreach for:

Target site: ${targetSite}
Your site: ${yourSite}
Your content to get cited: ${yourContent || '(not specified)'}
Unique angle: ${angle || 'general link request'}

Return JSON:
{
  "outreachSequence": [
    {
      "step": 1,
      "type": "Initial|Follow-up 1|Follow-up 2|Break-up",
      "subject": "...",
      "body": "full personalized email body",
      "sendTiming": "immediately|3 days|7 days|14 days"
    }
  ],
  "personalizationTips": ["specific things to research about target before sending"],
  "valuePropositions": ["why linking to your content benefits the target site"],
  "linkableAssets": ["types of content that earn citations easily"],
  "subjectLineVariants": ["A/B test these subject lines"],
  "doNotDo": ["common outreach mistakes to avoid"]
}`
      }],
      response_format: { type: 'json_object' },
      max_tokens: 1500,
    });
    const result = JSON.parse(completion.choices[0].message.content);
    res.json({ ok: true, targetSite, yourSite, ...result });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* ==========================================================================
   FEATURE 65: Digital PR Story Finder
   POST /api/link-intersect-outreach/pr-stories
   Finds linkable digital PR story angles for your brand
   ========================================================================== */
router.post('/pr-stories', async (req, res) => {
  try {
    const { brand, niche, products = [], model = 'gpt-4o-mini' } = req.body || {};
    if (!brand || !niche) return res.status(400).json({ ok: false, error: 'brand and niche required' });
    const completion = await openai.chat.completions.create({
      model,
      messages: [{
        role: 'user',
        content: `You are a digital PR strategist. Find newsworthy story angles that could earn natural backlinks for:

Brand: ${brand}
Niche: ${niche}
Products/services: ${products.join(', ') || 'e-commerce store'}

Return JSON:
{
  "prStoryAngles": [
    {
      "headline": "catchy news headline",
      "angle": "data-driven|trend|survey|expert opinion|human interest|product innovation",
      "pitch": "2-3 sentence pitch to journalists",
      "targetPublications": ["type of publication that would cover this"],
      "linkPotential": "high|medium|low",
      "effortToCreate": "high|medium|low",
      "dataNeeded": "what data or research would make this story"
    }
  ],
  "dataStudyIdeas": ["original research you could conduct cheaply"],
  "trendNewsjacking": ["current trends in ${niche} to attach your story to"],
  "journalistSearchQueries": ["Twitter/LinkedIn searches to find relevant journalists"],
  "pressReleaseOutline": "brief outline for the strongest story angle"
}`
      }],
      response_format: { type: 'json_object' },
      max_tokens: 1500,
    });
    const result = JSON.parse(completion.choices[0].message.content);
    res.json({ ok: true, brand, niche, ...result });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* ==========================================================================
   FEATURE 66: Link Gap Analyzer
   POST /api/link-intersect-outreach/link-gap
   Identifies linking opportunities by comparing your backlinks to competitors
   ========================================================================== */
router.post('/link-gap', async (req, res) => {
  try {
    const { yourDomain, competitors, niche = '', model = 'gpt-4o-mini' } = req.body || {};
    if (!yourDomain || !Array.isArray(competitors) || !competitors.length) {
      return res.status(400).json({ ok: false, error: 'yourDomain and competitors[] required' });
    }
    const completion = await openai.chat.completions.create({
      model,
      messages: [{
        role: 'user',
        content: `You are a competitive link building analyst. Identify link gap opportunities.

Your domain: ${yourDomain}
Competitor domains: ${competitors.join(', ')}
Niche: ${niche}

Return JSON:
{
  "linkGapAnalysis": {
    "estimatedDomainGap": "number of referring domains you may be behind by",
    "typeGaps": ["types of sites competitors have links from that you likely don't"],
    "topOpportunities": [
      {
        "siteType": "Industry Directory|Resource Page|Forum|News Site|Blog|Association",
        "domainAuthorityEstimate": "high (70+)|medium (40-70)|low (<40)",
        "howToGet": "specific tactic to get this link",
        "priority": "high|medium|low"
      }
    ]
  },
  "intersectTargets": ["sites that link to multiple competitors — highest priority"],
  "quickWinTactics": ["low-effort link opportunities for ${yourDomain}"],
  "outreachPrioritization": ["how to prioritize outreach list"],
  "monthlyLinkPlan": { "target": "X new links per month", "tactics": ["tactic 1", "tactic 2"] }
}`
      }],
      response_format: { type: 'json_object' },
      max_tokens: 1200,
    });
    const result = JSON.parse(completion.choices[0].message.content);
    res.json({ ok: true, yourDomain, competitors, ...result });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* ==========================================================================
   FEATURE 67: Guest Post Finder
   POST /api/link-intersect-outreach/guest-post-finder
   Identifies guest posting opportunities in your niche
   ========================================================================== */
router.post('/guest-post-finder', async (req, res) => {
  try {
    const { niche, yourExpertise, previousPublications = [], model = 'gpt-4o-mini' } = req.body || {};
    if (!niche) return res.status(400).json({ ok: false, error: 'niche required' });
    const completion = await openai.chat.completions.create({
      model,
      messages: [{
        role: 'user',
        content: `You are a guest posting specialist. Find high-value guest posting opportunities for:

Niche: ${niche}
Your expertise: ${yourExpertise || niche}
Previous publications: ${previousPublications.join(', ') || 'none'}

Return JSON:
{
  "searchQueries": [
    "\"write for us\" + ${niche}",
    "\"guest post\" + ${niche}",
    "\"submit article\" + ${niche}",
    "\"contribute\" + ${niche} + inurl:blog"
  ],
  "prospectingTips": ["advanced Google search tips to find guest post opportunities"],
  "pitchTemplate": {
    "subject": "...",
    "body": "personalized guest post pitch template",
    "topicIdeas": ["3 specific article ideas to pitch"]
  },
  "evaluationCriteria": ["how to assess if a site is worth guest posting on"],
  "niches": ["sub-niches within ${niche} with good guest post acceptance rates"],
  "linkBuildingByProxy": ["build relationships first by doing these before pitching"],
  "commonMistakes": ["guest posting mistakes that get you rejected"]
}`
      }],
      response_format: { type: 'json_object' },
      max_tokens: 1200,
    });
    const result = JSON.parse(completion.choices[0].message.content);
    res.json({ ok: true, niche, ...result });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* ==========================================================================
   FEATURE 68: Reddit & Community Monitor
   POST /api/link-intersect-outreach/community-monitor
   Finds relevant subreddits and community discussions for brand building
   ========================================================================== */
router.post('/community-monitor', async (req, res) => {
  try {
    const { brand, niche, keywords = [], model = 'gpt-4o-mini' } = req.body || {};
    if (!niche) return res.status(400).json({ ok: false, error: 'niche required' });
    const completion = await openai.chat.completions.create({
      model,
      messages: [{
        role: 'user',
        content: `You are a community marketing and brand monitoring expert. Create a community engagement strategy for:

Brand: ${brand || '(your brand)'}
Niche: ${niche}
Target keywords: ${keywords.join(', ') || niche}

Return JSON:
{
  "subreddits": [
    { "name": "r/...", "estimatedSize": "X members", "engagement": "high|medium|low", "linkFriendly": true|false, "strategy": "how to add value there" }
  ],
  "otherCommunities": [
    { "platform": "Quora|Facebook Groups|Discord|Slack|IndieHackers|ProductHunt", "community": "name", "opportunity": "how to engage" }
  ],
  "monitoringKeywords": ["exact search terms to monitor on Reddit/Quora"],
  "engagementRules": ["community rules to know before posting"],
  "valueAddApproach": ["how to contribute value before promoting your brand"],
  "redditSearchUrls": ["reddit.com/search?q=... URLs to monitor"],
  "contentThatPerformsWell": ["types of posts that get upvoted in ${niche} communities"]
}`
      }],
      response_format: { type: 'json_object' },
      max_tokens: 1200,
    });
    const result = JSON.parse(completion.choices[0].message.content);
    res.json({ ok: true, brand, niche, ...result });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* ==========================================================================
   FEATURE 69: Broken Link Prospector
   POST /api/link-intersect-outreach/broken-link-prospect
   Finds broken link building opportunities in your niche
   ========================================================================== */
router.post('/broken-link-prospect', async (req, res) => {
  try {
    const { niche, yourDomain, existingContent = [], model = 'gpt-4o-mini' } = req.body || {};
    if (!niche) return res.status(400).json({ ok: false, error: 'niche required' });
    const completion = await openai.chat.completions.create({
      model,
      messages: [{
        role: 'user',
        content: `You are a broken link building expert. Create a broken link prospecting strategy for:

Niche: ${niche}
Your domain: ${yourDomain || '(your site)'}
Existing content: ${existingContent.join(', ') || 'general niche content'}

Return JSON:
{
  "prospectingSearchQueries": [
    "\"resources\" + ${niche} + \"404\"",
    "\"link:\" + ${niche} + site:edu",
    "inUrl:resources ${niche}",
    "\"best resources\" + ${niche}"
  ],
  "toolsToUse": [
    { "tool": "...", "purpose": "...", "free": true|false }
  ],
  "targetPageTypes": ["resource pages|link roundups|tool collections|reading lists"],
  "outreachTemplate": {
    "subject": "...",
    "body": "broken link outreach email — polite, helpful, mentions the dead link AND your replacement",
    "keyElements": ["what makes broken link outreach convert"]
  },
  "contentToCreate": ["types of content that commonly replace broken links in ${niche}"],
  "estimatedSuccessRate": "X% of broken link outreach converts",
  "scalingTips": ["how to scale broken link building with minimal time"]
}`
      }],
      response_format: { type: 'json_object' },
      max_tokens: 1200,
    });
    const result = JSON.parse(completion.choices[0].message.content);
    res.json({ ok: true, niche, ...result });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Health check
router.get('/health', (req, res) => {
  res.json({ ok: true, status: 'Link Intersect Outreach API running', ts: new Date().toISOString() });
});

// Onboarding/help
router.get('/onboarding', (req, res) => {
  res.json({ ok: true, steps: [
    'Connect your outreach data',
    'Configure link intersect settings',
    'Run your first campaign',
    'Analyze results',
    'Export or share campaigns',
    'Set up notifications and compliance',
    'Integrate plugins and webhooks'
  ] });
});

module.exports = router;

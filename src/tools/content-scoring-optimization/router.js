const express = require('express');
const router = express.Router();
let _openai = null;
function getOpenAI() {
  if (!_openai) {
    const OpenAI = require('openai');
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

/* ═══════════════════════════════════════════════════════════════════
   FEATURE 14: Real-Time Content Scorer
   POST /api/content-scoring-optimization/score
   Scores content across 8 dimensions and returns a 0-100 grade
   ═══════════════════════════════════════════════════════════════════ */
router.post('/score', async (req, res) => {
  try {
    const { content, keyword = '', model = 'gpt-4o-mini' } = req.body || {};
    if (!content) return res.status(400).json({ ok: false, error: 'content required' });
    const completion = await getOpenAI().chat.completions.create({
      model,
      messages: [{
        role: 'user',
        content: `You are an expert content quality analyst. Score this content for SEO and quality.

Target keyword: "${keyword || '(not specified)'}"

Content:
"""
${content.slice(0, 4000)}
"""

Return JSON:
{
  "overallScore": 0-100,
  "grade": "A+|A|B+|B|C+|C|D|F",
  "dimensions": {
    "readability": { "score": 0-100, "details": "...", "feedback": "..." },
    "keywordOptimization": { "score": 0-100, "details": "...", "feedback": "..." },
    "depth": { "score": 0-100, "details": "...", "feedback": "..." },
    "structure": { "score": 0-100, "details": "...", "feedback": "..." },
    "eeat": { "score": 0-100, "details": "...", "feedback": "..." },
    "uniqueness": { "score": 0-100, "details": "...", "feedback": "..." },
    "entityCoverage": { "score": 0-100, "details": "...", "feedback": "..." },
    "intentAlignment": { "score": 0-100, "details": "...", "feedback": "..." }
  },
  "wordCount": 0,
  "readingLevel": "Elementary|Middle School|High School|College|Graduate",
  "topIssues": ["issue1", "issue2", "issue3"],
  "quickWins": ["win1", "win2", "win3"]
}`
      }],
      response_format: { type: 'json_object' },
      max_tokens: 1000,
    });
    const result = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* ═══════════════════════════════════════════════════════════════════
   FEATURE 15: Entity Auto-Optimizer
   POST /api/content-scoring-optimization/entity-optimize
   Identifies and optimizes named entities in content
   ═══════════════════════════════════════════════════════════════════ */
router.post('/entity-optimize', async (req, res) => {
  try {
    const { content, keyword = '', model = 'gpt-4o-mini' } = req.body || {};
    if (!content) return res.status(400).json({ ok: false, error: 'content required' });
    const completion = await getOpenAI().chat.completions.create({
      model,
      messages: [{
        role: 'user',
        content: `You are an entity SEO specialist. Analyze entities in this content and suggest optimizations.

Topic/keyword: "${keyword}"
Content: """${content.slice(0, 3000)}"""

Return JSON:
{
  "entitiesFound": [{ "name": "...", "type": "Person|Organization|Product|Place|Concept|Event", "mentions": 0, "prominent": true|false }],
  "missingKeyEntities": ["entity that should be mentioned but isn't"],
  "underOptimizedEntities": [{ "entity": "...", "suggestion": "how to use it better" }],
  "entityDensityScore": 0-100,
  "optimizedExcerpts": [{ "original": "...", "improved": "...", "reason": "..." }],
  "topicAuthority": { "score": 0-100, "gaps": ["missing subtopic"], "strengths": ["covered well"] }
}`
      }],
      response_format: { type: 'json_object' },
      max_tokens: 1000,
    });
    const result = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* ═══════════════════════════════════════════════════════════════════
   FEATURE 16: AI Facts Inserter
   POST /api/content-scoring-optimization/insert-facts
   Suggests factual additions to improve content authority
   ═══════════════════════════════════════════════════════════════════ */
router.post('/insert-facts', async (req, res) => {
  try {
    const { content, topic = '', model = 'gpt-4o-mini' } = req.body || {};
    if (!content) return res.status(400).json({ ok: false, error: 'content required' });
    const completion = await getOpenAI().chat.completions.create({
      model,
      messages: [{
        role: 'user',
        content: `You are an expert fact-checker and content enricher. Suggest facts, statistics, and data points to add to this content.

Topic: "${topic}"
Content: """${content.slice(0, 3000)}"""

Return JSON:
{
  "factSuggestions": [
    {
      "fact": "The exact fact or statistic to add",
      "source": "Type of source (industry report, research study, etc.)",
      "insertionPoint": "suggested place in content to add it",
      "impact": "Why this fact improves SEO/authority",
      "urgency": "high|medium|low"
    }
  ],
  "claimsToVerify": ["claim in the content that needs a source"],
  "outdatedClaims": ["claim that may be outdated with suggested update"],
  "eeatBoostTips": ["specific tips to improve E-E-A-T signals in this content"],
  "authorityScore": 0-100
}`
      }],
      response_format: { type: 'json_object' },
      max_tokens: 1200,
    });
    const result = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* ═══════════════════════════════════════════════════════════════════
   FEATURE 17: NLP Term Suggester
   POST /api/content-scoring-optimization/nlp-terms
   Suggests semantically related NLP terms to add
   ═══════════════════════════════════════════════════════════════════ */
router.post('/nlp-terms', async (req, res) => {
  try {
    const { content, keyword, model = 'gpt-4o-mini' } = req.body || {};
    if (!content || !keyword) return res.status(400).json({ ok: false, error: 'content and keyword required' });
    const completion = await getOpenAI().chat.completions.create({
      model,
      messages: [{
        role: 'user',
        content: `You are an NLP/LSI keyword expert. Analyze this content against top-ranking content for "${keyword}".

Content: """${content.slice(0, 2500)}"""

Return JSON:
{
  "primaryKeyword": "${keyword}",
  "termsFound": ["NLP terms already in the content"],
  "termsMissing": [
    { "term": "...", "importance": "high|medium|low", "suggestedUsage": "how/where to use it", "frequency": "n times" }
  ],
  "semanticClusters": [
    { "cluster": "cluster name", "terms": ["term1", "term2"], "covered": true|false }
  ],
  "nlpScore": 0-100,
  "topicCompleteness": 0-100,
  "recommendation": "summary of what NLP terms to prioritize adding"
}`
      }],
      response_format: { type: 'json_object' },
      max_tokens: 1000,
    });
    const result = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* ═══════════════════════════════════════════════════════════════════
   FEATURE 18: Topical Coverage Gap Analyzer
   POST /api/content-scoring-optimization/topical-gap
   Finds what subtopics are missing from the content
   ═══════════════════════════════════════════════════════════════════ */
router.post('/topical-gap', async (req, res) => {
  try {
    const { content, keyword, model = 'gpt-4o-mini' } = req.body || {};
    if (!content || !keyword) return res.status(400).json({ ok: false, error: 'content and keyword required' });
    const completion = await getOpenAI().chat.completions.create({
      model,
      messages: [{
        role: 'user',
        content: `You are a topical authority expert. Identify coverage gaps in this content for the keyword "${keyword}".

Content: """${content.slice(0, 3000)}"""

Analyze what a comprehensive piece about "${keyword}" should cover, then identify what is missing.

Return JSON:
{
  "keyword": "${keyword}",
  "topicsExpected": ["subtopic that top-ranking content covers"],
  "topicsCovered": ["subtopic this content covers"],
  "topicsGap": [
    { "topic": "missing subtopic", "importance": "high|medium|low", "why": "why top content covers this", "wordEstimate": 100 }
  ],
  "coverageScore": 0-100,
  "topicalAuthorityPotential": 0-100,
  "contentBriefAdditions": ["sections to add with brief description"],
  "pillarPageOpportunity": true|false,
  "pillarPageTopics": ["subtopics for supporting content"]
}`
      }],
      response_format: { type: 'json_object' },
      max_tokens: 1000,
    });
    const result = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* ═══════════════════════════════════════════════════════════════════
   FEATURE 19 & 20: Search Intent Classifier + Long-Tail Mapper
   POST /api/content-scoring-optimization/intent-longtail
   ═══════════════════════════════════════════════════════════════════ */
router.post('/intent-longtail', async (req, res) => {
  try {
    const { keyword, content = '', niche = '', model = 'gpt-4o-mini' } = req.body || {};
    if (!keyword) return res.status(400).json({ ok: false, error: 'keyword required' });
    const completion = await getOpenAI().chat.completions.create({
      model,
      messages: [{
        role: 'user',
        content: `You are a search intent and keyword research expert.

Primary keyword: "${keyword}"
Niche: "${niche}"
${content ? `Content excerpt: """${content.slice(0, 1000)}"""` : ''}

Return JSON:
{
  "searchIntent": {
    "primary": "Informational|Navigational|Transactional|Commercial",
    "secondary": "...",
    "confidence": 0-100,
    "explanation": "...",
    "contentTypeMatch": "Is the content format correct for this intent?"
  },
  "intentMismatch": true|false,
  "intentMismatchFix": "How to better align content with intent",
  "longTailKeywords": [
    { "keyword": "...", "intent": "Informational|Transactional|Commercial", "difficulty": "low|medium|high", "estimatedVolume": "...", "contentAngle": "..." }
  ],
  "questionKeywords": ["What ...", "How ...", "Why ..."],
  "modifierKeywords": ["best ...", "cheap ...", "near me"],
  "programmaticTemplates": ["[city] + keyword", "keyword + [year]"]
}`
      }],
      response_format: { type: 'json_object' },
      max_tokens: 1000,
    });
    const result = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* ═══════════════════════════════════════════════════════════════════
   FEATURE 21 & 22: Content Depth Scorer + E-E-A-T Checklist
   POST /api/content-scoring-optimization/depth-eeat
   ═══════════════════════════════════════════════════════════════════ */
router.post('/depth-eeat', async (req, res) => {
  try {
    const { content, keyword = '', model = 'gpt-4o-mini' } = req.body || {};
    if (!content) return res.status(400).json({ ok: false, error: 'content required' });
    const completion = await getOpenAI().chat.completions.create({
      model,
      messages: [{
        role: 'user',
        content: `You are a Google E-E-A-T quality assessment expert. Analyze content depth and E-E-A-T signals.

Keyword: "${keyword}"
Content: """${content.slice(0, 3500)}"""

Return JSON:
{
  "contentDepth": {
    "score": 0-100,
    "wordCount": 0,
    "hasIntro": true|false,
    "hasConclusion": true|false,
    "headingCount": 0,
    "avgSectionLength": 0,
    "usesLists": true|false,
    "usesExamples": true|false,
    "usesDataOrStats": true|false,
    "depthGrade": "Thin|Basic|Good|Comprehensive|Expert"
  },
  "eeat": {
    "experience": { "score": 0-100, "signals": ["signal found"], "missing": ["signal to add"] },
    "expertise": { "score": 0-100, "signals": ["signal found"], "missing": ["signal to add"] },
    "authoritativeness": { "score": 0-100, "signals": ["signal found"], "missing": ["signal to add"] },
    "trustworthiness": { "score": 0-100, "signals": ["signal found"], "missing": ["signal to add"] },
    "overallEeat": 0-100
  },
  "topPriorityFixes": [
    { "area": "Experience|Expertise|Authoritativeness|Trustworthiness|Depth", "fix": "...", "impact": "high|medium|low" }
  ]
}`
      }],
      response_format: { type: 'json_object' },
      max_tokens: 1200,
    });
    const result = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* ═══════════════════════════════════════════════════════════════════
   FEATURE 23: Table & Visual Content Suggester
   POST /api/content-scoring-optimization/suggest-tables
   ═══════════════════════════════════════════════════════════════════ */
router.post('/suggest-tables', async (req, res) => {
  try {
    const { content, keyword = '', model = 'gpt-4o-mini' } = req.body || {};
    if (!content) return res.status(400).json({ ok: false, error: 'content required' });
    const completion = await getOpenAI().chat.completions.create({
      model,
      messages: [{
        role: 'user',
        content: `You are a content structure expert. Suggest tables, comparison charts, and visual elements for this content.

Keyword: "${keyword}"
Content: """${content.slice(0, 3000)}"""

Return JSON:
{
  "tableSuggestions": [
    { "title": "table name", "purpose": "why this helps SEO", "columns": ["col1","col2"], "sampleRows": [["val1","val2"]], "schemaType": "Table|ItemList|HowTo|FAQPage", "placement": "where in content" }
  ],
  "comparisonCharts": [
    { "title": "chart name", "items": ["item1","item2"], "attributes": ["attr1","attr2"] }
  ],
  "infographicIdeas": ["idea for visual that earns backlinks"],
  "featuredSnippetOpportunities": [
    { "targetQuery": "query this could rank for", "snippetType": "table|list|paragraph|video", "contentToAdd": "..." }
  ]
}`
      }],
      response_format: { type: 'json_object' },
      max_tokens: 1000,
    });
    const result = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* ═══════════════════════════════════════════════════════════════════
   FEATURE 24: Key Takeaways Generator
   POST /api/content-scoring-optimization/key-takeaways
   ═══════════════════════════════════════════════════════════════════ */
router.post('/key-takeaways', async (req, res) => {
  try {
    const { content, format = 'bullets', model = 'gpt-4o-mini' } = req.body || {};
    if (!content) return res.status(400).json({ ok: false, error: 'content required' });
    const completion = await getOpenAI().chat.completions.create({
      model,
      messages: [{
        role: 'user',
        content: `Extract key takeaways from this content in ${format} format for SEO and reader value.

Content: """${content.slice(0, 3000)}"""

Return JSON:
{
  "keyTakeaways": ["concise takeaway 1", "concise takeaway 2"],
  "tldr": "One-sentence summary of the whole piece",
  "twitterThread": ["tweet 1 (max 280 chars)", "tweet 2"],
  "metaDescriptionSuggestion": "compelling meta description using key takeaways",
  "seoTitleOptions": ["title option 1", "title option 2", "title option 3"],
  "summaryBoxHtml": "<div class='key-takeaways'>...</div> HTML for adding to content",
  "faqFromContent": [{ "q": "question derived from content", "a": "answer from content" }]
}`
      }],
      response_format: { type: 'json_object' },
      max_tokens: 1000,
    });
    const result = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* ═══════════════════════════════════════════════════════════════════
   FEATURE 25: Competitor Outline Viewer
   POST /api/content-scoring-optimization/competitor-outline
   ═══════════════════════════════════════════════════════════════════ */
router.post('/competitor-outline', async (req, res) => {
  try {
    const { keyword, numCompetitors = 5, model = 'gpt-4o-mini' } = req.body || {};
    if (!keyword) return res.status(400).json({ ok: false, error: 'keyword required' });
    const completion = await getOpenAI().chat.completions.create({
      model,
      messages: [{
        role: 'user',
        content: `You are an SEO content strategist. Generate what the top ${numCompetitors} ranking articles for "${keyword}" typically cover, based on your knowledge.

Return JSON:
{
  "keyword": "${keyword}",
  "competitorOutlines": [
    {
      "position": 1,
      "titlePattern": "typical title format",
      "estimatedWordCount": 0,
      "contentType": "Guide|Listicle|Review|How-To|Comparison",
      "outline": ["H1: ...", "H2: ...", "H3: ...", "H2: ..."],
      "uniqueAngle": "what makes this article stand out",
      "keywordDensity": "approx %"
    }
  ],
  "commonH2s": ["heading that appears in most top results"],
  "uniqueOpportunities": ["angle or heading not covered by most competitors"],
  "recommendedOutline": ["H1: ...", "H2: ...", "H3: ..."],
  "recommendedWordCount": 0,
  "contentGapsVsCompetitors": ["gap to exploit"]
}`
      }],
      response_format: { type: 'json_object' },
      max_tokens: 1500,
    });
    const result = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* ═══════════════════════════════════════════════════════════════════
   FEATURE 26: FAQ Schema Generator
   POST /api/content-scoring-optimization/faq-schema
   ═══════════════════════════════════════════════════════════════════ */
router.post('/faq-schema', async (req, res) => {
  try {
    const { content, keyword = '', count = 8, model = 'gpt-4o-mini' } = req.body || {};
    if (!content) return res.status(400).json({ ok: false, error: 'content required' });
    const completion = await getOpenAI().chat.completions.create({
      model,
      messages: [{
        role: 'user',
        content: `Generate ${count} FAQ pairs from this content, then produce JSON-LD FAQ schema.

Keyword context: "${keyword}"
Content: """${content.slice(0, 3000)}"""

Return JSON:
{
  "faqs": [{ "question": "...", "answer": "concise 1-2 sentence answer for schema", "fullAnswer": "longer answer for page content" }],
  "jsonLdSchema": { "@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [] },
  "htmlMarkup": "<div itemscope itemtype='https://schema.org/FAQPage'>...</div>",
  "paaTargets": ["People Also Ask questions this could rank for"],
  "estimatedSnippetCount": 0
}`
      }],
      response_format: { type: 'json_object' },
      max_tokens: 1500,
    });
    const result = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ── Health ────────────────────────────────────────────────────────────────────
router.get('/health', (req, res) => {
  res.json({ ok: true, tool: 'content-scoring-optimization', ts: new Date().toISOString() });
});

module.exports = router;

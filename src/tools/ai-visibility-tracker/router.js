/**
 * AI Visibility Tracker — Router
 * Features 1-13: GEO / AI Visibility monitoring, citability scoring,
 * prompt coverage, SoV for AI, llms.txt generation, AI crawler audit,
 * competitor citation analysis, LLM seeding recommendations.
 */
const express = require('express');
const cheerio = require('cheerio');
const db = require('./db');
const router = express.Router();

let _openai;
function getOpenAI() {
  if (!_openai) {
    const OpenAI = require('openai');
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

async function fetchHTML(url, timeout = 12000) {
  const fetchMod = (await import('node-fetch')).default;
  const r = await fetchMod(url.startsWith('http') ? url : `https://${url}`, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AuraSEO/1.0; +https://aurasystemsai.com)' },
    timeout,
  });
  return { html: await r.text(), status: r.status, finalUrl: r.url };
}

/* ======================================================================
   FEATURE 6: AI-Citability Score
   POST /api/ai-visibility-tracker/citability-score
   Analyzes a page URL and scores how likely it is to be cited by AI
   ====================================================================== */
router.post('/citability-score', async (req, res) => {
  try {
    const { url, model = 'gpt-4o-mini' } = req.body || {};
    if (!url) return res.status(400).json({ ok: false, error: 'url required' });

    let html = '', fetchError = null;
    try { ({ html } = await fetchHTML(url)); } catch (e) { fetchError = e.message; }

    if (!html) return res.status(502).json({ ok: false, error: `Could not fetch URL: ${fetchError}` });

    const $ = cheerio.load(html);

    // Structural signals
    const title = $('title').text().trim();
    const h1 = $('h1').first().text().trim();
    const metaDesc = $('meta[name="description"]').attr('content') || '';
    const bodyText = $('body').text().replace(/\s+/g, ' ');
    const wordCount = bodyText.split(/\s+/).filter(Boolean).length;

    // Heading hierarchy
    const h2s = $('h2').map((_, el) => $(el).text().trim()).get();
    const h3s = $('h3').map((_, el) => $(el).text().trim()).get();

    // Tables and lists (LLMs extract these well)
    const tableCount = $('table').length;
    const olCount = $('ol').length;
    const ulCount = $('ul').length;

    // Schema
    let hasArticleSchema = false, hasFaqSchema = false, schemaCounts = 0;
    $('script[type="application/ld+json"]').each((_, el) => {
      schemaCounts++;
      try {
        const d = JSON.parse($(el).html());
        const arr = Array.isArray(d['@graph']) ? d['@graph'] : [d];
        arr.forEach(n => {
          if (['Article','BlogPosting','NewsArticle'].includes(n['@type'])) hasArticleSchema = true;
          if (n['@type'] === 'FAQPage') hasFaqSchema = true;
        });
      } catch {}
    });

    // External citations / sources
    const externalLinks = $('a[href]').filter((_, el) => {
      const href = $(el).attr('href') || '';
      return href.startsWith('http') && !href.includes(new URL(url.startsWith('http') ? url : `https://${url}`).hostname);
    }).length;

    // Definition-style content (good for AI)
    const hasDefinitions = /is defined as|refers to|means that|is the process of|is a type of/i.test(bodyText);
    const hasStepsList = /step \d|^\d+\./im.test(bodyText);
    const hasStatistics = /\d+%|\d+ percent|\d+ million|\d+ billion/i.test(bodyText);
    const hasCitations = /according to|source:|cited by|published by|study by|research from/i.test(bodyText);
    const hasFirstPerson = /\bi (tested|tried|found|discovered|used|recommend|prefer)\b/i.test(bodyText);
    const hasConclusion = /in conclusion|in summary|to summarize|key takeaway/i.test(bodyText);

    // Quote / direct answer density
    const paragraph = $('p');
    const shortParas = paragraph.filter((_, el) => $(el).text().trim().split(/\s+/).length < 40).length;
    const directAnswerParas = shortParas;

    // Build scoring signals
    const signals = [
      { name: 'Word count ≥600 words', pass: wordCount >= 600, weight: 8, value: `${wordCount} words` },
      { name: 'Clear H1 heading', pass: h1.length > 5, weight: 5, value: h1.slice(0, 60) || 'Missing' },
      { name: '≥3 H2 subheadings', pass: h2s.length >= 3, weight: 6, value: `${h2s.length} H2s` },
      { name: 'H3 subheadings present', pass: h3s.length >= 2, weight: 4, value: `${h3s.length} H3s` },
      { name: 'Article/BlogPosting schema', pass: hasArticleSchema, weight: 8, value: hasArticleSchema ? 'Present' : 'Missing' },
      { name: 'FAQPage schema', pass: hasFaqSchema, weight: 6, value: hasFaqSchema ? 'Present' : 'Missing' },
      { name: '≥2 authoritative external citations', pass: externalLinks >= 2, weight: 8, value: `${externalLinks} external links` },
      { name: 'Tables or structured data', pass: tableCount > 0 || olCount > 0, weight: 7, value: `${tableCount} tables, ${olCount} ordered lists` },
      { name: 'Statistics / data points', pass: hasStatistics, weight: 7, value: hasStatistics ? 'Found' : 'Not found' },
      { name: 'Definition-style language', pass: hasDefinitions, weight: 6, value: hasDefinitions ? 'Found' : 'Not found' },
      { name: 'Step-by-step structure', pass: hasStepsList, weight: 5, value: hasStepsList ? 'Found' : 'Not found' },
      { name: 'First-person expertise signals', pass: hasFirstPerson, weight: 7, value: hasFirstPerson ? 'Found' : 'Not found' },
      { name: 'Sources/citations mentioned', pass: hasCitations, weight: 7, value: hasCitations ? 'Found' : 'Not found' },
      { name: 'Summary/conclusion section', pass: hasConclusion, weight: 5, value: hasConclusion ? 'Found' : 'Not found' },
      { name: 'Direct-answer short paragraphs', pass: directAnswerParas >= 3, weight: 5, value: `${directAnswerParas} short paragraphs` },
      { name: 'Meta description present', pass: metaDesc.length > 50, weight: 4, value: metaDesc ? `${metaDesc.length} chars` : 'Missing' },
    ];

    const totalWeight = signals.reduce((s, x) => s + x.weight, 0);
    const earnedWeight = signals.filter(x => x.pass).reduce((s, x) => s + x.weight, 0);
    const score = Math.round((earnedWeight / totalWeight) * 100);
    const grade = score >= 90 ? 'A+' : score >= 80 ? 'A' : score >= 70 ? 'B' : score >= 60 ? 'C' : score >= 50 ? 'D' : 'F';

    const issues = signals.filter(s => !s.pass).map(s => ({ signal: s.name, tip: `Improve: ${s.name}` }));
    const strengths = signals.filter(s => s.pass).map(s => s.name);

    const result = { url, score, grade, wordCount, h2Count: h2s.length, h3Count: h3s.length, externalLinks, tableCount, olCount, hasArticleSchema, hasFaqSchema, signals, issues, strengths };
    db.saveAudit({ type: 'citability', url, score, grade });
    db.recordEvent({ type: 'citability-score', url, score });
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* ======================================================================
   FEATURE 11: Robots.txt / AI Crawler Audit
   POST /api/ai-visibility-tracker/crawler-audit
   Checks if AI crawlers (GPTBot, PerplexityBot, ClaudeBot, etc.) are blocked
   ====================================================================== */
router.post('/crawler-audit', async (req, res) => {
  try {
    const { domain } = req.body || {};
    if (!domain) return res.status(400).json({ ok: false, error: 'domain required' });

    const base = domain.startsWith('http') ? domain.replace(/\/?$/, '') : `https://${domain}`;
    const robotsUrl = `${base}/robots.txt`;

    let robotsTxt = '';
    let robotsStatus = 0;
    try {
      const fetchMod = (await import('node-fetch')).default;
      const r = await fetchMod(robotsUrl, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 10000 });
      robotsStatus = r.status;
      if (r.ok) robotsTxt = await r.text();
    } catch (e) {
      return res.status(502).json({ ok: false, error: `Could not fetch robots.txt: ${e.message}` });
    }

    // Known AI crawlers to check
    const crawlers = [
      { name: 'GPTBot', agent: 'GPTBot', company: 'OpenAI (ChatGPT)', importance: 'critical' },
      { name: 'ChatGPT-User', agent: 'ChatGPT-User', company: 'OpenAI (ChatGPT browsing)', importance: 'critical' },
      { name: 'PerplexityBot', agent: 'PerplexityBot', company: 'Perplexity AI', importance: 'critical' },
      { name: 'ClaudeBot', agent: 'ClaudeBot', company: 'Anthropic (Claude)', importance: 'critical' },
      { name: 'Google-Extended', agent: 'Google-Extended', company: 'Google (Gemini/AI Overviews training)', importance: 'high' },
      { name: 'Googlebot', agent: 'Googlebot', company: 'Google (Search + AI Overviews)', importance: 'critical' },
      { name: 'anthropic-ai', agent: 'anthropic-ai', company: 'Anthropic general crawler', importance: 'high' },
      { name: 'cohere-ai', agent: 'cohere-ai', company: 'Cohere AI', importance: 'medium' },
      { name: 'Meta-ExternalAgent', agent: 'Meta-ExternalAgent', company: 'Meta AI', importance: 'medium' },
      { name: 'Applebot-Extended', agent: 'Applebot-Extended', company: 'Apple AI (Siri/Apple Intelligence)', importance: 'medium' },
      { name: 'Bytespider', agent: 'Bytespider', company: 'ByteDance (TikTok AI)', importance: 'low' },
    ];

    // Parse robots.txt rules
    function isBlocked(agent) {
      const lines = robotsTxt.split('\n').map(l => l.trim());
      let currentUAMatch = false;
      let globalMatch = false;
      let blocked = false;
      let globalBlocked = false;

      for (const line of lines) {
        if (/^user-agent:/i.test(line)) {
          const ua = line.replace(/^user-agent:\s*/i, '').trim();
          currentUAMatch = ua.toLowerCase() === agent.toLowerCase() || ua === '*';
          if (ua === '*') globalMatch = true;
        }
        if (/^disallow:/i.test(line) && currentUAMatch) {
          const path = line.replace(/^disallow:\s*/i, '').trim();
          if (path === '/' || path === '') { // empty disallow = allow all
            if (path === '/') {
              if (ua === agent) blocked = true;
              if (globalMatch && ua === '*') globalBlocked = true;
            }
          }
        }
      }

      // More accurate check
      let agentBlocked = false;
      let inAgentBlock = false;
      let inGlobalBlock = false;
      let agentBlockedAll = false;
      let globalBlockedAll = false;

      for (const line of lines) {
        if (/^user-agent:/i.test(line)) {
          const ua = line.replace(/^user-agent:\s*/i, '').trim().toLowerCase();
          inAgentBlock = ua === agent.toLowerCase();
          inGlobalBlock = ua === '*';
        }
        if (/^disallow:\s*\//i.test(line)) {
          const path = line.replace(/^disallow:\s*/i, '').trim();
          if (path === '/') {
            if (inAgentBlock) agentBlockedAll = true;
            if (inGlobalBlock) globalBlockedAll = true;
          }
        }
      }

      // Agent-specific block takes precedence
      if (agentBlockedAll) return 'blocked';

      // Check for any disallow rules for this agent
      let hasAnyAgentRule = false;
      inAgentBlock = false;
      for (const line of lines) {
        if (/^user-agent:/i.test(line)) {
          const ua = line.replace(/^user-agent:\s*/i, '').trim().toLowerCase();
          inAgentBlock = ua === agent.toLowerCase();
        }
        if (/^disallow:/i.test(line) && inAgentBlock) hasAnyAgentRule = true;
      }
      if (hasAnyAgentRule && !agentBlockedAll) return 'partial';
      if (globalBlockedAll) return 'blocked-by-wildcard';
      if (!hasAnyAgentRule && !globalBlockedAll) return 'allowed';
      return 'allowed';
    }

    const results = crawlers.map(c => {
      const status = isBlocked(c.agent);
      return {
        ...c,
        status,
        pass: status === 'allowed',
        statusLabel: status === 'allowed' ? '✅ Allowed' : status === 'partial' ? '⚠️ Partial restrictions' : status === 'blocked-by-wildcard' ? '🚫 Blocked (wildcard)' : '🚫 Blocked',
      };
    });

    // Check for llms.txt
    let hasLlmsTxt = false;
    try {
      const fetchMod = (await import('node-fetch')).default;
      const r = await fetchMod(`${base}/llms.txt`, { timeout: 8000 });
      hasLlmsTxt = r.ok && r.status === 200;
    } catch {}

    // Check sitemap
    let hasSitemap = /sitemap:/i.test(robotsTxt);

    const blocked = results.filter(r => r.status !== 'allowed');
    const score = Math.round((results.filter(r => r.pass).length / results.length) * 100);

    const auditResult = {
      domain,
      robotsTxtFound: robotsStatus === 200,
      robotsUrl,
      hasLlmsTxt,
      hasSitemap,
      score,
      totalCrawlers: results.length,
      blockedCount: blocked.length,
      results,
      recommendations: [
        ...(!hasLlmsTxt ? ['Create /llms.txt — a machine-readable summary of your site structure to help AI models index your content correctly (Vercel/llmstxt.org standard).'] : []),
        ...(blocked.filter(b => b.importance === 'critical').length > 0 ? [`CRITICAL: You are blocking ${blocked.filter(b => b.importance === 'critical').map(b => b.name).join(', ')} — these AI crawlers power ChatGPT, Perplexity, and Claude citations. Remove these blocks to be eligible for AI citations.`] : []),
        ...(!hasSitemap ? ['No sitemap found in robots.txt — add "Sitemap: https://yourdomain.com/sitemap.xml" to help all crawlers discover your pages.'] : []),
      ],
    };

    db.saveAudit({ type: 'crawler-audit', domain, score, blockedCount: blocked.length });
    res.json({ ok: true, ...auditResult });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* ======================================================================
   FEATURE 12: llms.txt Generator
   POST /api/ai-visibility-tracker/generate-llms-txt
   Auto-generates a /llms.txt file content for a Shopify store
   ====================================================================== */
router.post('/generate-llms-txt', async (req, res) => {
  try {
    const { domain, storeName, description, topPages = [], model = 'gpt-4o-mini' } = req.body || {};
    if (!domain) return res.status(400).json({ ok: false, error: 'domain required' });

    const openai = getOpenAI();
    const base = domain.startsWith('http') ? domain : `https://${domain}`;

    // Try to crawl homepage for context
    let siteContext = '';
    try {
      const { html } = await fetchHTML(base);
      const $ = cheerio.load(html);
      const pageTitle = $('title').text().trim();
      const metaDesc = $('meta[name="description"]').attr('content') || '';
      siteContext = `Homepage title: ${pageTitle}\nMeta description: ${metaDesc}`;
    } catch {}

    const prompt = `You are an SEO expert generating an llms.txt file for a Shopify e-commerce store.

llms.txt is a plain-text file at the root of a website that gives AI language models a structured, machine-readable overview of the site. It helps models understand what a site does, its key pages, and how to reference it in AI-generated responses.

Store details:
- Domain: ${domain}
- Store name: ${storeName || 'Not specified'}
- Description: ${description || 'Not specified'}
- Key pages: ${topPages.length > 0 ? topPages.join(', ') : 'Homepage, blog, products, collections'}
${siteContext ? `- Site context: ${siteContext}` : ''}

Generate a well-structured llms.txt following this format:
1. # [Store Name] — a one-line descriptor
2. > A 1-2 sentence summary of what the store sells and who it serves
3. Blank line
4. ## Key Pages — list of key URLs with brief descriptions
5. ## About — 2-3 sentences describing the brand, values, and specialty
6. ## Products — 2-3 sentences about product categories
7. ## Contact — suggest adding contact info
8. ## Topic Authority — what topics this site is authoritative on (for AI citation decisions)

Write the actual file content (not instructions to write it). Make it factual, clear, and optimised for AI parsing.

Also output a separate "instructions" field explaining where to place this file (root of domain, publicly accessible at /llms.txt).`;

    const resp = await openai.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1000,
      temperature: 0.4,
    });

    const raw = resp.choices[0].message.content.trim();

    // Extract just the file content (everything before "instructions")
    const parts = raw.split(/\n\n---\n|instructions:|INSTRUCTIONS:/i);
    const llmsTxtContent = parts[0].trim();
    const instructions = parts[1] ? parts[1].trim() : `Place this file at ${base}/llms.txt — it must be publicly accessible with no authentication. Add it to your Shopify theme's /public/ directory or use a redirect in your web server config.`;

    if (req.deductCredits) req.deductCredits({ model });
    db.recordEvent({ type: 'generate-llms-txt', domain });
    res.json({ ok: true, domain, llmsTxtContent, instructions, charCount: llmsTxtContent.length });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* ======================================================================
   FEATURE 1 & 5: AI Visibility Check (Simulated prompt testing)
   POST /api/ai-visibility-tracker/prompt-test
   Simulate how AI models respond to prompts related to your brand
   ====================================================================== */
router.post('/prompt-test', async (req, res) => {
  try {
    const { prompts, domain, brand, competitors = [], model = 'gpt-4o-mini' } = req.body || {};
    if (!prompts || !Array.isArray(prompts) || prompts.length === 0) {
      return res.status(400).json({ ok: false, error: 'prompts array required' });
    }
    if (!brand && !domain) return res.status(400).json({ ok: false, error: 'brand or domain required' });

    const openai = getOpenAI();
    const brandName = brand || domain;

    const results = [];
    for (const prompt of prompts.slice(0, 5)) { // max 5 prompts per call
      const testPrompt = `Imagine you are a helpful AI assistant (like ChatGPT or Perplexity). A user asks: "${prompt}"

Given this question, would the brand "${brandName}" likely be mentioned in a well-researched AI response?

Analyze this from the perspective of an AI model that:
1. Has been trained on web data
2. Prioritises brands with strong content authority, clear expertise signals, and high citation rates in web content
3. Tends to cite brands mentioned on authoritative third-party sources (review sites, news, forums, Wikipedia)

Competitors in this space: ${competitors.length > 0 ? competitors.join(', ') : 'not specified'}

Respond as JSON:
{
  "prompt": "${prompt}",
  "likelyCited": true or false,
  "confidenceScore": 0-100,
  "reasoning": "2-3 sentence explanation",
  "competitorsThatWouldBeCited": ["brand1", "brand2"],
  "gapAnalysis": "What ${brandName} needs to do to appear in AI answers for this prompt",
  "suggestedContent": "Type of content that would improve AI citation probability for this prompt"
}`;

      try {
        const resp = await openai.chat.completions.create({
          model,
          messages: [{ role: 'user', content: testPrompt }],
          response_format: { type: 'json_object' },
          max_tokens: 500,
        });
        const parsed = JSON.parse(resp.choices[0].message.content);
        results.push({ ...parsed, prompt });
      } catch (e) {
        results.push({ prompt, likelyCited: false, confidenceScore: 0, error: e.message });
      }
    }

    const avgScore = Math.round(results.reduce((s, r) => s + (r.confidenceScore || 0), 0) / results.length);
    const citedCount = results.filter(r => r.likelyCited).length;

    // Save to DB
    const promptRecord = {
      brand: brandName,
      prompts,
      results,
      avgScore,
      citedCount,
      ts: new Date().toISOString(),
    };
    db.saveCitation(promptRecord);
    db.recordEvent({ type: 'prompt-test', brand: brandName, promptCount: prompts.length });
    if (req.deductCredits) req.deductCredits({ model });

    res.json({ ok: true, brand: brandName, avgScore, citedCount, total: results.length, results });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* ======================================================================
   FEATURE 3 & 4: AI Share of Voice + Competitor Citation Analysis
   POST /api/ai-visibility-tracker/ai-sov
   Compares brand vs. competitors across AI responses for given prompts
   ====================================================================== */
router.post('/ai-sov', async (req, res) => {
  try {
    const { brand, competitors, prompts, model = 'gpt-4o-mini' } = req.body || {};
    if (!brand) return res.status(400).json({ ok: false, error: 'brand required' });
    if (!Array.isArray(prompts) || prompts.length === 0) return res.status(400).json({ ok: false, error: 'prompts[] required' });
    if (!Array.isArray(competitors) || competitors.length === 0) return res.status(400).json({ ok: false, error: 'competitors[] required (2-5 brands)' });

    const openai = getOpenAI();
    const allBrands = [brand, ...competitors.slice(0, 4)];

    const promptResults = [];
    for (const prompt of prompts.slice(0, 3)) {
      const resp = await openai.chat.completions.create({
        model,
        messages: [{
          role: 'user',
          content: `You are simulating AI search results analysis. For the user query: "${prompt}"

Analyze which of these brands would most likely appear in AI-generated responses (ChatGPT, Perplexity, Google AI Overviews):
Brands: ${allBrands.join(', ')}

For EACH brand, estimate:
- citationProbability: 0-100 (chance of being cited in AI response)
- mentionFrequency: "always" | "often" | "sometimes" | "rarely" | "never"  
- reason: why this brand would or wouldn't be cited for this query
- contentStrengths: what content signals help them
- contentWeaknesses: where they're vulnerable

Respond as JSON:
{
  "prompt": "${prompt}",
  "brands": [
    { "brand": "name", "citationProbability": 75, "mentionFrequency": "often", "reason": "...", "contentStrengths": "...", "contentWeaknesses": "..." }
  ],
  "winnerBrand": "name of brand most likely to be cited",
  "insight": "One key strategic insight about this prompt's AI competitive landscape"
}`,
        }],
        response_format: { type: 'json_object' },
        max_tokens: 800,
      });
      try {
        promptResults.push(JSON.parse(resp.choices[0].message.content));
      } catch { promptResults.push({ prompt, error: 'parse error' }); }
    }

    // Aggregate SoV scores
    const sovMap = {};
    allBrands.forEach(b => sovMap[b] = []);
    promptResults.forEach(pr => {
      if (pr.brands) {
        pr.brands.forEach(b => { if (sovMap[b.brand]) sovMap[b.brand].push(b.citationProbability || 0); });
      }
    });
    const sovScores = allBrands.map(b => ({
      brand: b,
      avgCitationProbability: Math.round((sovMap[b].reduce((s, x) => s + x, 0) / Math.max(sovMap[b].length, 1))),
      isYou: b === brand,
    })).sort((a, b) => b.avgCitationProbability - a.avgCitationProbability);

    const yourScore = sovScores.find(s => s.isYou);
    const yourRank = sovScores.findIndex(s => s.isYou) + 1;
    const totalScore = sovScores.reduce((s, x) => s + x.avgCitationProbability, 0);
    const yourSoV = totalScore > 0 ? Math.round((yourScore?.avgCitationProbability / totalScore) * 100) : 0;

    if (req.deductCredits) req.deductCredits({ model });
    db.recordEvent({ type: 'ai-sov', brand, competitorCount: competitors.length });

    res.json({ ok: true, brand, yourSoV, yourRank, totalBrands: allBrands.length, sovScores, promptResults });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* ======================================================================
   FEATURE 7: LLM Seeding Recommendations
   POST /api/ai-visibility-tracker/seeding-plan
   Generates a plan for where to post content to boost LLM training signal
   ====================================================================== */
router.post('/seeding-plan', async (req, res) => {
  try {
    const { brand, niche, targetPrompts = [], currentContent = '', model = 'gpt-4o-mini' } = req.body || {};
    if (!brand || !niche) return res.status(400).json({ ok: false, error: 'brand and niche required' });

    const openai = getOpenAI();
    const resp = await openai.chat.completions.create({
      model,
      messages: [{
        role: 'user',
        content: `You are a GEO (Generative Engine Optimization) strategist. AI models like ChatGPT, Perplexity, and Gemini are trained on web data — including Reddit, GitHub, forums, news, and authoritative publications. 

Brand: ${brand}
Niche: ${niche}
Target prompts they want to appear in: ${targetPrompts.length > 0 ? targetPrompts.join(', ') : 'general niche queries'}
Current content: ${currentContent || 'Not specified'}

Generate a comprehensive LLM Seeding Plan — specific platforms and types of content that, if executed well, would increase the probability that this brand appears in AI-generated responses:

For each platform, provide:
1. Platform name
2. Content type (comment, thread, article, etc.)
3. Specific strategy
4. Priority (high/medium/low)
5. Why this platform influences AI models
6. Estimated time to impact

Cover: Reddit, Quora, GitHub discussions, Medium, niche forums, Wikipedia-adjacent sources, podcast/transcript platforms, data journalism sites, industry publications that LLMs cite heavily.

Respond as JSON:
{
  "platforms": [
    {
      "platform": "Reddit",
      "contentType": "Comment + Thread",
      "strategy": "...",
      "priority": "high",
      "whyItMatters": "...",
      "timeToImpact": "3-6 months",
      "subreddits": ["r/example1", "r/example2"]
    }
  ],
  "quickWins": ["3-5 immediate actions that take < 1 week"],
  "longTermStrategy": "One paragraph on the overall seeding approach",
  "contentPillars": ["Topic 1", "Topic 2", "Topic 3"]
}`,
      }],
      response_format: { type: 'json_object' },
      max_tokens: 1200,
    });

    const plan = JSON.parse(resp.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    db.recordEvent({ type: 'seeding-plan', brand, niche });

    res.json({ ok: true, brand, niche, ...plan });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* ======================================================================
   FEATURE 9: AI Term Presence Analysis
   POST /api/ai-visibility-tracker/term-analysis
   Find which terms AI models use for your topic and compare against your content
   ====================================================================== */
router.post('/term-analysis', async (req, res) => {
  try {
    const { url, keyword, model = 'gpt-4o-mini' } = req.body || {};
    if (!keyword) return res.status(400).json({ ok: false, error: 'keyword required' });

    let pageContent = '';
    if (url) {
      try {
        const { html } = await fetchHTML(url);
        const $ = cheerio.load(html);
        pageContent = $('body').text().replace(/\s+/g, ' ').slice(0, 2000);
      } catch {}
    }

    const openai = getOpenAI();
    const resp = await openai.chat.completions.create({
      model,
      messages: [{
        role: 'user',
        content: `You are simulating an AI language model's internal semantic analysis. When AI models (Gemini, ChatGPT, Perplexity) answer questions about "${keyword}", they rely on specific vocabulary, entities, and concepts.

Analyze the vocabulary gap between what AI models use and what this page contains:

Query/Keyword: "${keyword}"
Page content: ${pageContent || '(no page provided — analyze in general)'}

Identify:
1. Terms AI models ALWAYS use when answering this query (must-haves)
2. Terms AI models OFTEN use (important)
3. Terms AI models SOMETIMES use (supplementary) 
4. For each term, indicate if it appears in the provided page content
5. The overall "AI vocabulary alignment score" (0-100)

Respond as JSON:
{
  "keyword": "${keyword}",
  "alignmentScore": 72,
  "alwaysUsedTerms": [
    { "term": "example term", "presentInContent": true, "category": "concept|entity|action|metric" }
  ],
  "oftenUsedTerms": [...],
  "sometimesUsedTerms": [...],
  "missingCriticalTerms": ["list of always/often terms NOT in the page content"],
  "termRecommendations": "Brief paragraph on which terms to add and where",
  "entityGaps": ["Named entities AI models expect but page doesn't mention"]
}`,
      }],
      response_format: { type: 'json_object' },
      max_tokens: 1000,
    });

    const analysis = JSON.parse(resp.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    db.recordEvent({ type: 'term-analysis', keyword, url });

    res.json({ ok: true, keyword, url, ...analysis });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* ======================================================================
   FEATURE 13: GEO Content Optimizer
   POST /api/ai-visibility-tracker/geo-optimize
   Suggests rewrites to make content more AI-parseable
   ====================================================================== */
router.post('/geo-optimize', async (req, res) => {
  try {
    const { url, content, keyword, model = 'gpt-4o-mini' } = req.body || {};
    if (!url && !content) return res.status(400).json({ ok: false, error: 'url or content required' });

    let pageText = content || '';
    if (url && !content) {
      try {
        const { html } = await fetchHTML(url);
        const $ = cheerio.load(html);
        pageText = $('article, main, .content, body').first().text().replace(/\s+/g, ' ').slice(0, 3000);
      } catch {}
    }

    const openai = getOpenAI();
    const resp = await openai.chat.completions.create({
      model,
      messages: [{
        role: 'user',
        content: `You are a GEO (Generative Engine Optimization) expert. Analyze this content and suggest specific structural rewrites to make it more likely to be cited by AI models (ChatGPT, Perplexity, Google AI Overviews, Gemini).

${keyword ? `Target keyword: ${keyword}` : ''}
Content:
${pageText.slice(0, 2500)}

AI models prefer content that:
- Opens with a clear, direct definition or answer (not a question or teaser)
- Uses numbered steps for processes
- Includes "definition boxes" (bolded term followed by definition)
- Has short, direct paragraphs (< 40 words) that can be extracted as quotes
- References specific statistics with sources
- Has a "Key Takeaways" or "Summary" section
- Uses tables for comparisons
- Answers who/what/when/where/why structure

Provide specific, actionable rewrite suggestions:

Respond as JSON:
{
  "geoScore": 0-100,
  "topIssues": ["top 3 structural problems"],
  "rewrites": [
    {
      "type": "opening | heading | paragraph | add-section | add-table | add-definition",
      "original": "original text (or null if adding new)",
      "improved": "recommended replacement or new content",
      "reason": "why this improves AI citability"
    }
  ],
  "addSections": [
    { "sectionType": "Key Takeaways | FAQ | Definition Box | Comparison Table | Step-by-Step", "suggestedContent": "..." }
  ],
  "quickWins": ["3 changes that would have the biggest GEO impact"]
}`,
      }],
      response_format: { type: 'json_object' },
      max_tokens: 1200,
    });

    const optimization = JSON.parse(resp.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    db.recordEvent({ type: 'geo-optimize', url, keyword });

    res.json({ ok: true, url, keyword, ...optimization });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* ======================================================================
   FEATURE 2: Prompt Coverage Mapping
   POST /api/ai-visibility-tracker/prompt-coverage
   Maps which user prompts your content covers vs. gaps
   ====================================================================== */
router.post('/prompt-coverage', async (req, res) => {
  try {
    const { domain, niche, blogPosts = [], model = 'gpt-4o-mini' } = req.body || {};
    if (!niche) return res.status(400).json({ ok: false, error: 'niche required' });

    const openai = getOpenAI();
    const resp = await openai.chat.completions.create({
      model,
      messages: [{
        role: 'user',
        content: `You are a GEO strategist. Map the prompt coverage for a ${niche} Shopify store.

Domain: ${domain || 'Not specified'}
Existing content/blog posts: ${blogPosts.length > 0 ? blogPosts.join('\n') : 'Not specified'}

Generate a Prompt Coverage Map — the 20-30 most common questions and prompts users ask AI models in the ${niche} space, and assess whether typical content from such a store would cover them.

For each prompt, categorize it:
- Phase: awareness | consideration | decision | support
- ContentType: how-to | comparison | definition | review | list | troubleshoot  
- Covered: true/false (based on the blog posts listed, if provided)
- Priority: high | medium | low (based on search/AI query volume estimate)

Respond as JSON:
{
  "niche": "${niche}",
  "totalPrompts": 25,
  "coveredCount": 0,
  "coveragePercent": 0,
  "prompts": [
    {
      "prompt": "How do I...",
      "phase": "awareness",
      "contentType": "how-to", 
      "covered": false,
      "priority": "high",
      "contentGapAction": "Write a blog post titled '...'"
    }
  ],
  "topGaps": ["The 5 most valuable uncovered prompt areas"],
  "contentCalendarSuggestion": "3-month plan to close the top gaps"
}`,
      }],
      response_format: { type: 'json_object' },
      max_tokens: 1500,
    });

    const coverage = JSON.parse(resp.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    db.recordEvent({ type: 'prompt-coverage', domain, niche });

    res.json({ ok: true, domain, niche, ...coverage });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* ======================================================================
   FEATURE 10: AI Overview Ranking Checker (simulated via SERP analysis)
   POST /api/ai-visibility-tracker/ao-check
   Checks AI Overview presence for keywords and estimates citation status
   ====================================================================== */
router.post('/ao-check', async (req, res) => {
  try {
    const { keywords, domain, model = 'gpt-4o-mini' } = req.body || {};
    if (!Array.isArray(keywords) || keywords.length === 0) return res.status(400).json({ ok: false, error: 'keywords[] required' });

    const openai = getOpenAI();
    const resp = await openai.chat.completions.create({
      model,
      messages: [{
        role: 'user',
        content: `You are an expert in Google AI Overviews (AIO) and how they affect Shopify store SEO.

Domain: ${domain || 'Not specified'}
Keywords to analyze: ${keywords.slice(0, 10).join(', ')}

For each keyword, analyze:
1. Whether Google likely shows an AI Overview (AIO) for this query
2. The type of content Google's AIO would feature
3. Whether a Shopify store targeting this keyword would likely be cited in the AIO
4. The "AI Overview difficulty" (how hard it is to appear in AIO for this query)
5. Recommended content type to maximize AIO citation chance

Respond as JSON:
{
  "keywords": [
    {
      "keyword": "string",
      "likelyHasAIO": true,
      "aioDifficulty": 0-100,
      "aioContentType": "definition | how-to | comparison | list | local",
      "shopifyStoreLikelyCited": true,
      "citationProbability": 0-100,
      "whyOrWhyNot": "explanation",
      "recommendedContentAction": "Specific action to improve AIO citation chances",
      "zeroClickRisk": true
    }
  ],
  "summary": "Overall AI Overview strategy recommendation for this keyword set",
  "highOpportunityKeywords": ["keywords with high citation probability"],
  "avoidKeywords": ["keywords where AIO kills all organic traffic"]
}`,
      }],
      response_format: { type: 'json_object' },
      max_tokens: 1000,
    });

    const result = JSON.parse(resp.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    db.recordEvent({ type: 'ao-check', domain, keywordCount: keywords.length });

    res.json({ ok: true, domain, ...result });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* ======================================================================
   CRUD for tracked prompts
   ====================================================================== */
router.get('/prompts', (req, res) => {
  try { res.json({ ok: true, prompts: db.listPrompts() }); }
  catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});
router.post('/prompts', (req, res) => {
  try { res.json({ ok: true, prompt: db.savePrompt(req.body || {}) }); }
  catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});
router.delete('/prompts/:id', (req, res) => {
  try {
    const ok = db.deletePrompt(req.params.id);
    res.json({ ok });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

router.get('/audits', (req, res) => {
  try { res.json({ ok: true, audits: db.listAudits() }); }
  catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

router.get('/history', (req, res) => {
  try { res.json({ ok: true, citations: db.listCitations() }); }
  catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

router.get('/analytics', (req, res) => {
  try { res.json({ ok: true, events: db.listEvents() }); }
  catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

router.get('/health', (req, res) => {
  res.json({ ok: true, tool: 'ai-visibility-tracker', ts: new Date().toISOString() });
});

module.exports = router;

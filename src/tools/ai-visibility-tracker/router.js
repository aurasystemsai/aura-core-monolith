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

let _shopTokens;
function getShopTokens() {
  if (!_shopTokens) _shopTokens = require('../../core/shopTokens');
  return _shopTokens;
}

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

    const parsedUrl = new URL(url.startsWith('http') ? url : `https://${url}`);
    const hostname = parsedUrl.hostname;

    // --- Resolve connected shop token for this URL ---
    const shopTokens = getShopTokens();
    const allTokens = shopTokens.loadAll ? shopTokens.loadAll() : {};
    let shop = null, token = null;
    for (const [s, data] of Object.entries(allTokens)) {
      if (hostname === s || hostname.replace('www.', '') === s.replace('www.', '') ||
          hostname.includes(s.replace('.myshopify.com', ''))) {
        shop = s; token = data?.token || data; break;
      }
    }
    // Single-store fallback — if only one store connected, always use it
    if (!shop && Object.keys(allTokens).length === 1) {
      shop = Object.keys(allTokens)[0];
      token = Object.values(allTokens)[0]?.token || Object.values(allTokens)[0];
    }

    let html = '';

    if (shop && token) {
      // ── SHOPIFY ADMIN API PATH — never hits the public web ──────────────
      const apiVersion = '2023-10';
      const fetchFn = global.fetch || require('node-fetch');
      const apiHeaders = { 'X-Shopify-Access-Token': token, 'Content-Type': 'application/json' };

      const blogArticleMatch = parsedUrl.pathname.match(/^\/blogs\/([^/]+)\/([^/?#]+)/);
      const productMatch = parsedUrl.pathname.match(/^\/products\/([^/?#]+)/);
      const pageMatch = parsedUrl.pathname.match(/^\/pages\/([^/?#]+)/);

      if (blogArticleMatch) {
        const [, blogHandle, articleHandle] = blogArticleMatch;
        const blogsRes = await fetchFn(
          `https://${shop}/admin/api/${apiVersion}/blogs.json?handle=${blogHandle}`,
          { headers: apiHeaders }
        );
        const blog = blogsRes.ok ? ((await blogsRes.json()).blogs || [])[0] : null;
        if (!blog) return res.status(404).json({ ok: false, error: `Blog "${blogHandle}" not found in your store` });

        const articlesRes = await fetchFn(
          `https://${shop}/admin/api/${apiVersion}/articles.json?blog_id=${blog.id}&handle=${articleHandle}`,
          { headers: apiHeaders }
        );
        const article = articlesRes.ok ? ((await articlesRes.json()).articles || [])[0] : null;
        if (!article) return res.status(404).json({ ok: false, error: `Article "${articleHandle}" not found` });

        const metaDesc = article.summary_html ? article.summary_html.replace(/<[^>]*>/g, '').slice(0, 250) : '';
        // Auto-inject Article/BlogPosting schema — Shopify strips <script> from body_html so we
        // synthesise it here from the fields we already have. This is correct — it IS an article.
        const articleSchema = JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: article.title || '',
          description: metaDesc,
          datePublished: article.published_at || '',
          dateModified: article.updated_at || article.published_at || '',
          author: { '@type': 'Person', name: article.author || 'Author' },
          image: article.image?.src || '',
          keywords: article.tags || '',
        });
        // Detect FAQ structure in body and auto-inject FAQPage schema
        let faqSchemaTag = '';
        const bodyForFaq = article.body_html || '';
        const faqPairs = [];
        const cheerioFaq = cheerio.load(bodyForFaq);
        // Handle <dl><dt><dd> pattern
        cheerioFaq('dt').each((_, el) => {
          const q = cheerioFaq(el).text().trim();
          const a = cheerioFaq(el).next('dd').text().trim();
          if (q && a) faqPairs.push({ q, a });
        });
        // Handle <h3><p> pattern inside FAQ section
        if (!faqPairs.length) {
          cheerioFaq('h3').each((_, el) => {
            const q = cheerioFaq(el).text().trim();
            const a = cheerioFaq(el).next('p').text().trim();
            if (q && a && q.endsWith('?')) faqPairs.push({ q, a });
          });
        }
        if (faqPairs.length >= 2) {
          const faqSchema = JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faqPairs.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
          });
          faqSchemaTag = `<script type="application/ld+json">${faqSchema}</script>`;
        }
        html = `<!DOCTYPE html><html><head><title>${article.title || ''}</title><meta name="description" content="${metaDesc}"><script type="application/ld+json">${articleSchema}</script>${faqSchemaTag}</head><body><h1>${article.title || ''}</h1>${article.body_html || ''}</body></html>`;

      } else if (productMatch) {
        const [, productHandle] = productMatch;
        const productRes = await fetchFn(
          `https://${shop}/admin/api/${apiVersion}/products.json?handle=${productHandle}&fields=title,body_html,product_type,tags`,
          { headers: apiHeaders }
        );
        const product = productRes.ok ? ((await productRes.json()).products || [])[0] : null;
        if (!product) return res.status(404).json({ ok: false, error: `Product "${productHandle}" not found` });

        html = `<!DOCTYPE html><html><head><title>${product.title || ''}</title></head><body><h1>${product.title || ''}</h1>${product.body_html || ''}</body></html>`;

      } else if (pageMatch) {
        const [, pageHandle] = pageMatch;
        const pageRes = await fetchFn(
          `https://${shop}/admin/api/${apiVersion}/pages.json?handle=${pageHandle}&fields=title,body_html,meta_description`,
          { headers: apiHeaders }
        );
        const page = pageRes.ok ? ((await pageRes.json()).pages || [])[0] : null;
        if (!page) return res.status(404).json({ ok: false, error: `Page "${pageHandle}" not found` });

        const metaDesc = page.meta_description || '';
        html = `<!DOCTYPE html><html><head><title>${page.title || ''}</title><meta name="description" content="${metaDesc}"></head><body><h1>${page.title || ''}</h1>${page.body_html || ''}</body></html>`;

      } else {
        return res.status(400).json({ ok: false, error: 'URL must be a /blogs/..., /products/..., or /pages/... path from your store' });
      }

    } else {
      // ── EXTERNAL URL — public web fetch ─────────────────────────────────
      let fetchError = null;
      try { ({ html } = await fetchHTML(url)); } catch (e) { fetchError = e.message; }
      if (!html) return res.status(502).json({ ok: false, error: `Could not fetch URL: ${fetchError}` });
    }

    const $ = cheerio.load(html);

    // Remove boilerplate elements — but KEEP JSON-LD scripts for schema detection
    $('nav, header, footer, noscript, [class*="cookie"], [class*="popup"], [id*="cookie"], [id*="popup"]').remove();
    $('script:not([type="application/ld+json"]), style').remove();

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
    const hasDefinitions = /is defined as|refers to|means that|is the process of|is a type of|is known as|can be described as|is used to|is considered|is essentially|is simply|is broadly defined|which means|defined as/i.test(bodyText);
    // Step-by-step: detect <ol> lists, or "Step N" text, or numbered headings
    const hasStepsList = /step\s*\d|^\d+\./im.test(bodyText) || $('ol li').length >= 3;
    const hasStatistics = /\d+%|\d+ percent|\d+ million|\d+ billion/i.test(bodyText);
    // Citations: "according to", any "source" heading, "cited by", "further reading", external links with anchor context
    const hasCitations = /according to|sources?[:\s&]|cited by|published by|study by|research from|further reading/i.test(bodyText);
    const hasFirstPerson = /\bi (tested|tried|found|discovered|used|recommend|prefer|recommend|noticed|saw|checked)\b/i.test(bodyText);
    // Conclusion: both spellings + more patterns
    const hasConclusion = /in conclusion|in summary|to summarize|to summarise|key takeaway|to wrap up|final thoughts/i.test(bodyText);

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
    // Skip credit deduction for free re-checks (post-fix verification)
    if (req.deductCredits && !req.body?.free) req.deductCredits({ model });
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* ======================================================================
   FEATURE: AI Citability Fix Plan
   POST /api/ai-visibility-tracker/citability-fix-plan
   Takes the failed signals and returns specific actionable fixes with
   code examples for each one, sorted by weight (highest priority first).
   ====================================================================== */
router.post('/citability-fix-plan', async (req, res) => {
  try {
    const { url, score, grade, signals = [], model = 'gpt-4o-mini' } = req.body || {};
    const failedSignals = (signals || []).filter(s => !s.pass).sort((a, b) => b.weight - a.weight).slice(0, 8);
    if (!failedSignals.length) return res.json({ ok: true, fixes: {} });

    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model,
      response_format: { type: 'json_object' },
      max_tokens: 1600,
      messages: [
        {
          role: 'system',
          content: 'You are an expert in Generative Engine Optimization (GEO) — making web pages more likely to be cited by ChatGPT, Perplexity, and Google AI Overviews. You give concrete, specific, copy-paste-ready advice.',
        },
        {
          role: 'user',
          content: `URL: ${url || 'unknown'}\nCurrent score: ${score}/100 (Grade ${grade})\n\nThe following signals FAILED on this page. For EACH one, provide a specific 2-4 sentence actionable fix. Include exact HTML, JSON-LD schema snippets, or example sentences where relevant.\n\nFailed signals:\n${failedSignals.map(s => `- "${s.name}" (weight: ${s.weight}) — detected: ${s.value}`).join('\n')}\n\nRespond as JSON where each key is the EXACT signal name and the value is the actionable fix text with any code examples inline.\n{\n  "Signal name here": "Specific fix instructions with example..."\n}`,
        },
      ],
    });

    const fixes = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, fixes });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* ======================================================================
   FEATURE: AI Citability Auto-Fix (Beginner Mode)
   POST /api/ai-visibility-tracker/citability-auto-fix
   Uses GPT to generate the fix content for a single failed signal, then
   writes it directly back to the Shopify article/page via Admin API.
   ====================================================================== */
router.post('/citability-auto-fix', async (req, res) => {
  try {
    const { url, signalName, model = 'gpt-4o-mini' } = req.body || {};
    if (!url || !signalName) return res.status(400).json({ ok: false, error: 'url and signalName required' });

    const parsedUrl = new URL(url.startsWith('http') ? url : `https://${url}`);
    const hostname = parsedUrl.hostname;

    // Resolve shop token
    const shopTokens = getShopTokens();
    const allTokens = shopTokens.loadAll ? shopTokens.loadAll() : {};
    let shop = null, token = null;
    for (const [s, data] of Object.entries(allTokens)) {
      if (hostname === s || hostname.replace('www.','') === s.replace('www.','') ||
          hostname.includes(s.replace('.myshopify.com',''))) {
        shop = s; token = data?.token || data; break;
      }
    }
    if (!shop && Object.keys(allTokens).length === 1) {
      shop = Object.keys(allTokens)[0];
      token = Object.values(allTokens)[0]?.token || Object.values(allTokens)[0];
    }
    if (!shop || !token) return res.status(400).json({ ok: false, error: 'No connected Shopify store found. Connect your store in Settings first.' });

    const ver = process.env.SHOPIFY_API_VERSION || '2023-10';
    const fetchFn = global.fetch || require('node-fetch');
    const apiHeaders = { 'X-Shopify-Access-Token': token, 'Content-Type': 'application/json' };

    // Fetch the resource
    const blogMatch = parsedUrl.pathname.match(/^\/blogs\/([^/]+)\/([^/?#]+)/);
    const productMatch = parsedUrl.pathname.match(/^\/products\/([^/?#]+)/);
    const pageMatch = parsedUrl.pathname.match(/^\/pages\/([^/?#]+)/);

    let resourceType = null, resourceId = null, blogId = null, currentBodyHtml = '', currentSummary = '', title = '', author = '';

    if (blogMatch) {
      const [, blogHandle, articleHandle] = blogMatch;
      const blogsRes = await fetchFn(`https://${shop}/admin/api/${ver}/blogs.json?handle=${blogHandle}`, { headers: apiHeaders });
      const blog = blogsRes.ok ? ((await blogsRes.json()).blogs || [])[0] : null;
      if (!blog) return res.status(404).json({ ok: false, error: `Blog "${blogHandle}" not found` });
      blogId = blog.id;
      const artRes = await fetchFn(`https://${shop}/admin/api/${ver}/articles.json?blog_id=${blog.id}&handle=${articleHandle}`, { headers: apiHeaders });
      const article = artRes.ok ? ((await artRes.json()).articles || [])[0] : null;
      if (!article) return res.status(404).json({ ok: false, error: `Article not found` });
      resourceType = 'article'; resourceId = article.id;
      currentBodyHtml = article.body_html || ''; currentSummary = article.summary_html || '';
      title = article.title || ''; author = article.author || '';
    } else if (productMatch) {
      const [, productHandle] = productMatch;
      const pRes = await fetchFn(`https://${shop}/admin/api/${ver}/products.json?handle=${productHandle}`, { headers: apiHeaders });
      const product = pRes.ok ? ((await pRes.json()).products || [])[0] : null;
      if (!product) return res.status(404).json({ ok: false, error: `Product not found` });
      resourceType = 'product'; resourceId = product.id;
      currentBodyHtml = product.body_html || ''; title = product.title || '';
    } else if (pageMatch) {
      const [, pageHandle] = pageMatch;
      const pgRes = await fetchFn(`https://${shop}/admin/api/${ver}/pages.json?handle=${pageHandle}`, { headers: apiHeaders });
      const page = pgRes.ok ? ((await pgRes.json()).pages || [])[0] : null;
      if (!page) return res.status(404).json({ ok: false, error: `Page not found` });
      resourceType = 'page'; resourceId = page.id;
      currentBodyHtml = page.body_html || ''; title = page.title || '';
    } else {
      return res.status(400).json({ ok: false, error: 'URL must point to a /blogs/..., /products/..., or /pages/... path' });
    }

    const { dryRun = false, content: providedContent = null } = req.body || {};
    const openai = getOpenAI();

    // Signal-specific prompts — what to generate and where to put it
    const SIGNAL_PROMPTS = {
      'Meta description present': {
        field: 'summary',
        prompt: `Write a compelling 150-160 character meta description for this page. Title: "${title}". Return ONLY the plain text summary, no quotes, no HTML.`,
      },
      'Article/BlogPosting schema': {
        field: 'prepend',
        prompt: `Generate a JSON-LD Article/BlogPosting schema script tag (including <script type="application/ld+json">...</script>) for a blog post titled "${title}" by author "${author || 'Author'}". Include @context, @type BlogPosting, headline, datePublished (today), author with @type Person. Use placeholder values where you don't have real data. Return ONLY the raw script HTML tag.`,
      },
      'FAQPage schema': {
        field: 'append',
        prompt: `Based on the following article content, generate 3-5 relevant FAQ questions and answers. Return BOTH:
1. An HTML section: <section class="faq"><h2>Frequently Asked Questions</h2>...(dl with dt/dd pairs)</section>
2. A JSON-LD script tag: <script type="application/ld+json">{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[...]}</script>
Return ONLY the raw HTML (section + script tag), no explanation.
Article: ${currentBodyHtml.replace(/<[^>]+>/g,'').slice(0,1500)}`,
      },
      '≥3 H2 subheadings': {
        field: 'rewrite_structure',
        prompt: `The following article body lacks enough H2 subheadings. Insert at least 3 meaningful H2 headings at appropriate points in the content to break it into sections. Do NOT change the existing text — only add <h2>...</h2> tags. Return the COMPLETE updated body HTML.
Current body:
${currentBodyHtml.slice(0,3000)}`,
      },
      'H3 subheadings present': {
        field: 'rewrite_structure',
        prompt: `The following article body lacks H3 subheadings. Insert at least 2 meaningful H3 subheadings within existing sections. Do NOT change the existing text — only add <h3>...</h3> tags. Return the COMPLETE updated body HTML.
Current body:
${currentBodyHtml.slice(0,3000)}`,
      },
      'Tables or structured data': {
        field: 'append',
        prompt: `Based on the following article about "${title}", create ONE useful HTML comparison table or structured data table that would add value for readers. Return ONLY the raw <table> HTML with thead and tbody. 
Article summary: ${currentBodyHtml.replace(/<[^>]+>/g,'').slice(0,800)}`,
      },
      'Statistics / data points': {
        field: 'append',
        prompt: `Based on the topic of this article titled "${title}", generate a short HTML paragraph (2-3 sentences) that includes 2-3 relevant statistics or data points with citations from well-known sources. Use format: "According to [Source], X% of...". Return ONLY the raw <p> HTML tag.`,
      },
      'Definition-style language': {
        field: 'prepend',
        prompt: `Write a short HTML paragraph (1-2 sentences) that opens an article about "${title}" with a clear, encyclopaedia-style definition. You MUST use one of these exact phrases in the sentence: "is defined as", "refers to", "is known as", "can be described as", or "means that". Example: "${title} is defined as...". Return ONLY the raw <p> HTML tag, no explanation.`,
      },
      'Step-by-step structure': {
        field: 'append',
        prompt: `Based on the article "${title}", create a short numbered step-by-step HTML section (3-5 steps) that guides the reader on the key process. Return ONLY raw HTML: <h2>Step-by-Step Guide</h2><ol><li>...</li>...</ol>.`,
      },
      'First-person expertise signals': {
        field: 'append',
        prompt: `Write a short first-person HTML paragraph (2-3 sentences) expressing personal expertise or experience related to "${title}". Use phrases like "I tested...", "I found...", "In my experience...". Return ONLY the raw <p> HTML tag.`,
      },
      'Sources/citations mentioned': {
        field: 'append',
        prompt: `Generate a "Sources & References" HTML section for an article about "${title}". Include 3 real, authoritative external links (Wikipedia, government sites, well-known publications). Format: <h2>Sources &amp; References</h2><ul><li><a href="..." target="_blank">...</a></li>...</ul>. Return ONLY the raw HTML.`,
      },
      'Summary/conclusion section': {
        field: 'append',
        prompt: `Write a conclusion section for an article titled "${title}". Return ONLY raw HTML: <h2>Conclusion</h2><p>...</p> (2-3 sentences summarising key takeaways, starting with "In summary," or "To summarise,").`,
      },
      'Direct-answer short paragraphs': {
        field: 'prepend',
        prompt: `Write a TL;DR / quick-answer section for an article titled "${title}". This should be 1-2 short answer paragraphs (under 40 words each) that directly answer what the article is about. Return ONLY raw HTML: <div class="tldr"><strong>Quick Answer:</strong><p>...</p></div>.`,
      },
      '≥2 authoritative external citations': {
        field: 'append',
        prompt: `Generate a "Further Reading" HTML section for an article about "${title}" with 3 authoritative external links to real websites (Wikipedia, .gov, .edu, well-known industry sites). Format: <h2>Further Reading</h2><ul><li><a href="..." target="_blank" rel="noopener">Anchor text</a> — one sentence description.</li></ul>. Return ONLY the raw HTML.`,
      },
      'Word count ≥600 words': {
        field: 'append',
        prompt: `The article "${title}" is too short. Write 2-3 additional informative HTML paragraphs (totalling ~200 words) that naturally extend the content with useful details, examples, or context. Return ONLY raw <p> HTML tags.`,
      },
    };

    const config = SIGNAL_PROMPTS[signalName];
    if (!config) return res.status(400).json({ ok: false, error: `Signal "${signalName}" cannot be auto-fixed. Please use Advanced mode for manual instructions.` });

    // Generate the fix (or use caller-provided content for Advanced "Apply" step)
    let generated;
    if (providedContent) {
      generated = providedContent;
    } else {
      const completion = await openai.chat.completions.create({
        model,
        max_tokens: 800,
        messages: [
          { role: 'system', content: 'You are an expert in SEO and structured content. You generate clean, minimal HTML snippets. Never add explanatory text — return only what was asked for.' },
          { role: 'user', content: config.prompt },
        ],
      });
      generated = completion.choices[0].message.content.trim();
      if (req.deductCredits) req.deductCredits({ model });
    }

    // dryRun: return generated preview without writing to Shopify (Advanced "Preview" step)
    if (dryRun) {
      return res.json({ ok: true, preview: generated, field: config.field });
    }

    // Apply the fix
    let newBodyHtml = currentBodyHtml;
    let updatePayload = null;

    if (config.field === 'summary') {
      updatePayload = resourceType === 'article'
        ? { article: { id: resourceId, summary_html: `<p>${generated}</p>` } }
        : resourceType === 'page'
          ? { page: { id: resourceId, metafields: [{ namespace: 'global', key: 'description_tag', value: generated, type: 'single_line_text_field' }] } }
          : null;
    } else if (config.field === 'append') {
      newBodyHtml = currentBodyHtml + '\n' + generated;
    } else if (config.field === 'prepend') {
      newBodyHtml = generated + '\n' + currentBodyHtml;
    } else if (config.field === 'rewrite_structure') {
      newBodyHtml = generated;
    }

    if (!updatePayload && newBodyHtml !== currentBodyHtml) {
      // Always publish the article when saving fixes (published_at ensures it goes live)
      if (resourceType === 'article') updatePayload = { article: { id: resourceId, body_html: newBodyHtml, published_at: new Date().toISOString() } };
      else if (resourceType === 'product') updatePayload = { product: { id: resourceId, body_html: newBodyHtml, published: true } };
      else if (resourceType === 'page') updatePayload = { page: { id: resourceId, body_html: newBodyHtml } };
    } else if (updatePayload?.article) {
      // Also publish when updating summary/other article fields
      updatePayload.article.published_at = new Date().toISOString();
    }

    if (!updatePayload) return res.json({ ok: true, message: 'No changes needed — signal already passing.' });

    // Write back to Shopify
    const writeUrl = resourceType === 'article'
      ? `https://${shop}/admin/api/${ver}/blogs/${blogId}/articles/${resourceId}.json`
      : resourceType === 'product'
        ? `https://${shop}/admin/api/${ver}/products/${resourceId}.json`
        : `https://${shop}/admin/api/${ver}/pages/${resourceId}.json`;

    const writeRes = await fetchFn(writeUrl, { method: 'PUT', headers: apiHeaders, body: JSON.stringify(updatePayload) });
    if (!writeRes.ok) {
      const errText = await writeRes.text();
      return res.status(500).json({ ok: false, error: `Shopify API error: ${errText.slice(0,200)}` });
    }

    res.json({ ok: true, message: `✅ Fixed! The "${signalName}" issue has been resolved on your ${resourceType}.`, generated: generated.slice(0, 300) });
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
   Simulate how ChatGPT, Perplexity, and Google AI respond per prompt
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

    // Platform citation bias (based on real research data)
    const platformBias = {
      chatgpt:    'Wikipedia, Forbes, established media, authoritative encyclopedic sources',
      perplexity: 'Reddit, community forums, peer reviews, Yelp, G2, TripAdvisor',
      googleai:   'Reddit, YouTube, LinkedIn, Quora, balanced social-professional mix',
    };

    const results = [];
    for (const prompt of prompts.slice(0, 5)) {
      const testPrompt = `You are simulating how three major AI platforms (ChatGPT, Perplexity, Google AI Overviews) would respond to a user query and whether they would cite a specific brand.

USER QUERY: "${prompt}"
BRAND BEING EVALUATED: "${brandName}"
COMPETITORS: ${competitors.length > 0 ? competitors.join(', ') : 'not specified'}

Platform citation tendencies (based on real research):
- ChatGPT: favours ${platformBias.chatgpt}
- Perplexity: favours ${platformBias.perplexity}  
- Google AI Overviews: favours ${platformBias.googleai}

For each platform, evaluate whether "${brandName}" would realistically appear in a well-researched AI answer for this query. Consider:
1. Brand authority and web presence
2. Whether the brand's content matches what each platform prioritises
3. Competitor strength

Also evaluate the overall brand SENTIMENT if mentioned (how positively AI would describe the brand).

Return ONLY valid JSON:
{
  "prompt": "${prompt}",
  "overallScore": 0-100,
  "platforms": {
    "chatgpt":    { "cited": true/false, "confidence": 0-100, "reasoning": "1 sentence", "narrative": "how ChatGPT would actually describe/mention the brand in 1 sentence if cited" },
    "perplexity": { "cited": true/false, "confidence": 0-100, "reasoning": "1 sentence", "narrative": "how Perplexity would describe the brand" },
    "googleai":   { "cited": true/false, "confidence": 0-100, "reasoning": "1 sentence", "narrative": "how Google AI Overviews would describe the brand" }
  },
  "sentiment": "positive" | "neutral" | "negative",
  "sentimentReason": "Why the brand is described this way across AI platforms",
  "brandNarrative": "Overall 1-2 sentence summary of how AI models collectively portray ${brandName} for this query",
  "competitorsThatWouldBeCited": ["brand1", "brand2"],
  "competitorEdge": "In 1 sentence, why competitors rank higher for this prompt",
  "gapAnalysis": "The single most important missing signal that prevents ${brandName} from being cited",
  "contentAction": "Specific content piece to create (e.g. 'Write a comparison article titled X targeting Y audience')",
  "sourceRecommendations": ["Where to get featured to boost visibility (e.g. 'Get reviewed on Reddit r/snowboarding')", "second recommendation"]
}`;

      try {
        const resp = await openai.chat.completions.create({
          model,
          messages: [{ role: 'user', content: testPrompt }],
          response_format: { type: 'json_object' },
          max_tokens: 700,
        });
        const parsed = JSON.parse(resp.choices[0].message.content);
        results.push({ ...parsed, prompt });
      } catch (e) {
        results.push({ prompt, overallScore: 0, platforms: {}, sentiment: 'neutral', error: e.message });
      }
    }

    const avgScore = Math.round(results.reduce((s, r) => s + (r.overallScore || 0), 0) / results.length);
    const citedCount = results.filter(r =>
      r.platforms && (r.platforms.chatgpt?.cited || r.platforms.perplexity?.cited || r.platforms.googleai?.cited)
    ).length;

    const promptRecord = { brand: brandName, prompts, results, avgScore, citedCount, ts: new Date().toISOString() };
    db.saveCitation(promptRecord);
    db.recordEvent({ type: 'prompt-test', brand: brandName, promptCount: prompts.length });
    if (req.deductCredits) req.deductCredits({ model });

    res.json({ ok: true, brand: brandName, avgScore, citedCount, total: results.length, results });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* ======================================================================
   FEATURE: AI Prompt Suggestions
   POST /api/ai-visibility-tracker/prompt-suggestions
   Given a brand + niche, suggest the 10 most likely AI search queries
   that real users ask about this product category.
   ====================================================================== */
router.post('/prompt-suggestions', async (req, res) => {
  try {
    const { brand, niche, model = 'gpt-4o-mini' } = req.body || {};
    if (!brand) return res.status(400).json({ ok: false, error: 'brand required' });

    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model,
      response_format: { type: 'json_object' },
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: `Generate the 10 most realistic prompts that real users type into ChatGPT, Perplexity, and Google AI when searching for products or information in the "${niche || brand}" category. These should be natural, conversational queries that someone shopping or researching would actually ask.

Brand: "${brand}"
Niche/Category: "${niche || 'general ecommerce'}"

Return ONLY JSON:
{
  "suggestions": [
    { "prompt": "...", "intent": "informational|commercial|comparison|review", "aiPlatform": "chatgpt|perplexity|google" }
  ]
}`
      }],
    });

    const data = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, suggestions: data.suggestions || [] });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* ======================================================================
   SUGGEST COMPETITORS
   POST /api/ai-visibility-tracker/suggest-competitors
   Given a brand name + optional niche, returns 4-6 real competitor brands
   ====================================================================== */
router.post('/suggest-competitors', async (req, res) => {
  try {
    const { brand, niche = '' } = req.body || {};
    if (!brand) return res.status(400).json({ ok: false, error: 'brand required' });
    const openai = getOpenAI();
    const resp = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.4,
      messages: [{
        role: 'user',
        content: `You are a competitive intelligence analyst. A user runs a brand called "${brand}"${niche ? ` in the niche: ${niche}` : ''}.

List the 5 most relevant REAL competitor brands or companies they should be benchmarking against for AI search visibility.

Rules:
- Only include real, well-known brands/companies
- Include a mix of big players AND niche-relevant ones
- Rank by how much of a direct competitive threat they are
- Do NOT include the user's own brand

Respond with ONLY a JSON object:
{
  "competitors": [
    { "name": "Brand Name", "reason": "One short sentence why they're a direct competitor" },
    ...
  ]
}`
      }],
      response_format: { type: 'json_object' }
    });
    const data = JSON.parse(resp.choices[0].message.content);
    res.json({ ok: true, competitors: (data.competitors || []).slice(0, 5) });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
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
    const { brand, niche, targetPrompts = [], currentContent = '', productContext = [], model = 'gpt-4o-mini' } = req.body || {};
    if (!brand || !niche) return res.status(400).json({ ok: false, error: 'brand and niche required' });

    const openai = getOpenAI();
    const productLine = productContext.length ? `\nTop products: ${productContext.slice(0, 8).join(', ')}` : '';
    const resp = await openai.chat.completions.create({
      model,
      messages: [{
        role: 'user',
        content: `You are a GEO (Generative Engine Optimization) strategist. AI models like ChatGPT, Perplexity, and Gemini are trained on web data — including Reddit, GitHub, forums, news, and authoritative publications. 

Brand: ${brand}
Niche: ${niche}
Target prompts they want to appear in: ${targetPrompts.length > 0 ? targetPrompts.join(', ') : 'general niche queries'}${productLine}
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
      max_tokens: 2000,
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
   FEATURE: Generate Seeding Content
   POST /api/ai-visibility-tracker/generate-seeding-content
   Writes ready-to-post content for a specific platform & strategy
   ====================================================================== */
router.post('/generate-seeding-content', async (req, res) => {
  try {
    const { platform, brand, niche, strategy, contentType, subreddits = [], targetPrompts = [], productContext = [], model = 'gpt-4o-mini' } = req.body || {};
    if (!platform || !brand) return res.status(400).json({ ok: false, error: 'platform and brand required' });

    const openai = getOpenAI();
    const subredditHint = subreddits.length ? ` Target subreddits: ${subreddits.join(', ')}.` : '';
    const promptHint = targetPrompts.length ? ` The brand wants to appear in AI answers for: "${targetPrompts.slice(0,3).join('", "')}".` : '';
    const productHint = productContext.length ? `\nTop products: ${productContext.slice(0,6).join(', ')}.` : '';

    const platformInstructions = {
      Reddit: `Write a genuine, helpful Reddit ${contentType || 'comment'} that subtly positions the brand without being spammy. Sound like a real community member. Include the brand as a natural recommendation, not an ad.${subredditHint}`,
      Quora: `Write a detailed, authoritative Quora answer (400-600 words) that directly answers a relevant question while naturally mentioning the brand as a credible resource. Include a clear structure with paragraphs.`,
      'GitHub Discussions': `Write a GitHub Discussions post that contributes to an open-source or technical conversation, referencing the brand's tools or approach as a practical example.`,
      Medium: `Write an engaging Medium article introduction (300 words) for a story about a topic in the ${niche} space that features the brand's perspective or solution.`,
      default: `Write a genuine, helpful post for ${platform} that naturally positions the brand as a credible resource in the ${niche} space. Content type: ${contentType || 'post'}.`,
    };

    const instruction = platformInstructions[platform] || platformInstructions.default;

    const completion = await openai.chat.completions.create({
      model,
      response_format: { type: 'json_object' },
      max_tokens: 900,
      messages: [{
        role: 'system',
        content: 'You are an expert content writer specialising in GEO (Generative Engine Optimization) — creating authentic content that gets cited by AI models.',
      }, {
        role: 'user',
        content: `Brand: "${brand}"\nNiche: ${niche}\nPlatform: ${platform}\nStrategy context: ${strategy || ''}${promptHint}${productHint}\n\n${instruction}\n\nRespond as JSON:\n{\n  "title": "post/thread title (if applicable, else null)",\n  "content": "the full ready-to-post text",\n  "tip": "one sentence posting tip specific to this platform"\n}`,
      }],
    });

    const data = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, platform, ...data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* ======================================================================
   FEATURE: Shopify Context
   GET /api/ai-visibility-tracker/shopify-context
   Returns shop name, domain, top products & collections to pre-fill Seeding Plan
   ====================================================================== */
router.get('/shopify-context', async (req, res) => {
  try {
    const shopTokens = getShopTokens();
    const allTokens = shopTokens.loadAll ? shopTokens.loadAll() : {};
    let shop = req.headers['x-shopify-shop-domain'] || (req.session && req.session.shop) || process.env.SHOPIFY_STORE_URL;
    if (!shop && Object.keys(allTokens).length === 1) shop = Object.keys(allTokens)[0];

    let token = (shop ? shopTokens.getToken(shop) : null) || (req.session && req.session.shopifyToken);
    if (!token && Object.keys(allTokens).length === 1) token = Object.values(allTokens)[0]?.token || null;

    if (!shop || !token) {
      return res.json({ ok: true, available: false, reason: 'No Shopify connection found' });
    }

    const apiVersion = '2023-10';
    const fetchFn = global.fetch || require('node-fetch');
    const headers = { 'X-Shopify-Access-Token': token, 'Content-Type': 'application/json', 'Accept': 'application/json' };

    const [shopRes, productsRes, collectionsRes, blogsRes] = await Promise.all([
      fetchFn(`https://${shop}/admin/api/${apiVersion}/shop.json`, { headers }),
      fetchFn(`https://${shop}/admin/api/${apiVersion}/products.json?limit=20&fields=title,product_type,tags,vendor`, { headers }),
      fetchFn(`https://${shop}/admin/api/${apiVersion}/custom_collections.json?limit=20&fields=title`, { headers }),
      fetchFn(`https://${shop}/admin/api/${apiVersion}/blogs.json?fields=id,title,handle`, { headers }),
    ]);

    const shopData = shopRes.ok ? (await shopRes.json()).shop : null;
    const productsData = productsRes.ok ? (await productsRes.json()).products || [] : [];
    const collectionsData = collectionsRes.ok ? (await collectionsRes.json()).custom_collections || [] : [];
    const blogsData = blogsRes.ok ? (await blogsRes.json()).blogs || [] : [];

    // Fetch articles for each blog (up to 3 blogs, 20 articles each)
    const articlesByBlog = await Promise.all(
      blogsData.slice(0, 3).map(async blog => {
        try {
          const r = await fetchFn(
            `https://${shop}/admin/api/${apiVersion}/articles.json?blog_id=${blog.id}&limit=30&published_status=published&fields=id,title,handle,published_at`,
            { headers }
          );
          if (!r.ok) return [];
          const { articles = [] } = await r.json();
          const storeDomain = shopData?.domain || shop;
          return articles.map(a => ({
            title: a.title,
            url: `https://${storeDomain}/blogs/${blog.handle}/${a.handle}`,
            blogTitle: blog.title,
            publishedAt: a.published_at,
          }));
        } catch { return []; }
      })
    );
    const allArticles = articlesByBlog.flat().sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

    // Also build product page URLs
    const productPages = productsData.slice(0, 20).map(p => ({
      title: p.title,
      url: `https://${shopData?.domain || shop}/products/${p.handle || p.title.toLowerCase().replace(/\s+/g, '-')}`,
      type: 'product',
    }));

    const productTypes = [...new Set(productsData.map(p => p.product_type).filter(Boolean))];
    const allTags = productsData.flatMap(p => (p.tags || '').split(',').map(t => t.trim()).filter(Boolean));
    const tagFreq = {};
    allTags.forEach(t => { tagFreq[t] = (tagFreq[t] || 0) + 1; });
    const topTags = Object.entries(tagFreq).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([t]) => t);

    let niche = '';
    if (productTypes.length) niche = productTypes.slice(0, 2).join(', ');
    else if (collectionsData.length) niche = collectionsData.slice(0, 2).map(c => c.title).join(', ');
    else if (topTags.length) niche = topTags.slice(0, 2).join(', ');

    res.json({
      ok: true,
      available: true,
      brand: shopData?.name || shop.replace('.myshopify.com', ''),
      domain: shopData?.domain || shop,
      niche,
      productCount: productsData.length,
      articleCount: allArticles.length,
      products: productsData.slice(0, 10).map(p => ({ title: p.title, type: p.product_type, tags: p.tags })),
      collections: collectionsData.slice(0, 8).map(c => c.title),
      topTags,
      articles: allArticles.slice(0, 50),
      productPages: productPages.slice(0, 20),
      blogs: blogsData.map(b => b.title),
    });
  } catch (err) {
    console.error('[AI Visibility] shopify-context error:', err);
    res.json({ ok: true, available: false, reason: err.message });
  }
});

/* ======================================================================
   FEATURE: Term Analysis
   Find which terms AI models use for your topic and compare against your content
   ====================================================================== */
router.post('/term-analysis', async (req, res) => {
  try {
    const { url, keyword, model = 'gpt-4o-mini' } = req.body || {};
    if (!keyword) return res.status(400).json({ ok: false, error: 'keyword required' });

    let pageContent = '';
    if (url) {
      try {
        const { fetchForAnalysis } = require('../../core/shopifyContentFetcher');
        const fetched = await fetchForAnalysis(url.startsWith('http') ? url : `https://${url}`, req);
        const $ = cheerio.load(fetched.html || '');
        pageContent = $('article, main, .content, body').first().text().replace(/\s+/g, ' ').slice(0, 2000);
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
        const { fetchForAnalysis } = require('../../core/shopifyContentFetcher');
        const fetched = await fetchForAnalysis(url.startsWith('http') ? url : `https://${url}`, req);
        const $ = cheerio.load(fetched.html || '');
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

/* ======================================================================
   FEATURE: Seeding Post History
   GET  /api/ai-visibility-tracker/seeding-posts  — list all logged posts
   POST /api/ai-visibility-tracker/seeding-posts  — log a new post
   DELETE /api/ai-visibility-tracker/seeding-posts/:id — remove a record
   ====================================================================== */
router.get('/seeding-posts', (req, res) => {
  try { res.json({ ok: true, posts: db.listSeedingPosts() }); }
  catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

router.post('/seeding-posts', (req, res) => {
  try {
    const { platform, title, contentSnippet, url, brand, niche } = req.body || {};
    if (!platform) return res.status(400).json({ ok: false, error: 'platform required' });
    const entry = db.saveSeedingPost({ platform, title, contentSnippet, url: url || null, brand, niche });
    res.json({ ok: true, post: entry });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

router.delete('/seeding-posts/:id', (req, res) => {
  try { db.deleteSeedingPost(req.params.id); res.json({ ok: true }); }
  catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

router.get('/analytics', (req, res) => {
  try { res.json({ ok: true, events: db.listEvents() }); }
  catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

router.get('/health', (req, res) => {
  res.json({ ok: true, tool: 'ai-visibility-tracker', ts: new Date().toISOString() });
});

/* ======================================================================
   FEATURE: AI Visibility Overview
   POST /api/ai-visibility-tracker/overview
   Full brand AI visibility dashboard — score, platform breakdown, topics,
   performing topics with prompts, topic opportunities, trend data.
   ====================================================================== */
router.post('/overview', async (req, res) => {
  try {
    const { brand, domain, model = 'gpt-4o-mini' } = req.body || {};
    if (!brand && !domain) return res.status(400).json({ ok: false, error: 'brand or domain required' });

    const openai = getOpenAI();
    const brandName = (brand || domain).trim();

    const completion = await openai.chat.completions.create({
      model,
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 4000,
      messages: [
        {
          role: 'system',
          content: 'You are an AI visibility analysis engine. Always respond with valid JSON only — no prose, no markdown fences.',
        },
        {
          role: 'user',
          content: `Analyse the brand "${brandName}" and return an AI Visibility Overview as JSON with EXACTLY these fields:

{
  "score": integer 0-100 (realistic brand AI visibility — large/famous brand = 60-90, niche/small = 5-30, unknown = 2-10),
  "mentions": integer (estimated total monthly AI mentions across all platforms),
  "citedPages": integer (estimated pages cited by AI),
  "monthlyAudience": integer (estimated monthly audience reached via AI answers),
  "chatgpt": integer (monthly ChatGPT mentions),
  "aiOverview": integer (monthly Google AI Overview mentions),
  "aiMode": integer (monthly Google AI Mode mentions),
  "gemini": integer (monthly Gemini mentions),
  "trend": {
    "total": [int,int,int,int,int,int],
    "chatgpt": [int,int,int,int,int,int],
    "aiOverview": [int,int,int,int,int,int],
    "gemini": [int,int,int,int,int,int]
  },
  "trendInsight": "one sentence insight about visibility trend over the last 6 months",
  "performingTopics": [
    {
      "topic": "topic name",
      "visibility": integer 0-100,
      "mentions": integer,
      "aiVolume": integer,
      "sparkline": "0,18 10,14 20,10 30,8 40,4",
      "intent": ["informational"],
      "prompts": [
        { "prompt": "actual user query text", "response": "2-4 sentence realistic AI response mentioning the brand naturally, as a real LLM would answer the question", "source": "chatgpt", "mentioned": true, "brands": 3, "sources": 8 },
        { "prompt": "second user query text", "response": "2-4 sentence realistic AI response for this query", "source": "google", "mentioned": true, "brands": 5, "sources": 12 }
      ]
    }
  ],
  "topicOpportunities": [
    { "topic": "topic name where brand is absent but competitors dominate", "visibility": integer, "aiVolume": integer }
  ]
}

Rules:
- Return exactly 4 performing topics, each with exactly 2 prompts
- Return exactly 4 topic opportunities
- All numbers must be realistic for the brand size/niche
- trend arrays must each contain exactly 6 integers (oldest to newest, monthly)
- sparkline must be a valid SVG polyline points string with 5 x,y pairs like "0,18 10,14 20,10 30,8 40,4"`,
        },
      ],
    });

    let data;
    try {
      data = JSON.parse(completion.choices[0].message.content);
    } catch (parseErr) {
      return res.status(500).json({ ok: false, error: `JSON parse failed: ${parseErr.message}` });
    }

    if (req.deductCredits) req.deductCredits({ model });
    db.recordEvent({ type: 'overview', brand: brandName });
    res.json({ ok: true, ...data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;

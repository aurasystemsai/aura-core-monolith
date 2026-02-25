/**
 * AI Content & Image Gen — router.js
 * 90 endpoints across 18 categories:
 *   A) Product Content (8)
 *   B) Ad & Marketing Copy (6)
 *   C) Social Media (4)
 *   D) Product Images (7)
 *   E) Brand Voice & Style (4)
 *   F) Video & Motion (4)
 *   G) Blog & Long-form (3)
 *   H) Multimodal & Quality (2)
 *   I) Amazon Marketplace (5)
 *   J) Copywriting Frameworks (7)
 *   K) Business Copy (8)
 *   L) Email Marketing (5)
 *   M) Platform Ads Extended (5)
 *   N) YouTube & Video Copy (5)
 *   O) Landing Pages & Conversion (5)
 *   P) Content Utilities (5)
 *   Q) E-commerce Specific Copy (5)
 *   R) Creative Scoring Extended (2)
 */

const express = require('express');
const router = express.Router();
const db = require('./db');

let _openai = null;
function getOpenAI() {
  if (!_openai) { const OpenAI = require('openai'); _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY }); }
  return _openai;
}

// Inject brand voice into system prompt if available
function withBrandVoice(basePrompt) {
  const bv = db.getBrandVoice();
  if (!bv) return basePrompt;
  return `${basePrompt}\n\nBRAND VOICE PROFILE — apply this to all output:\nTone: ${bv.tone || 'not set'}\nPersonality: ${bv.personality || 'not set'}\nVocabulary: ${bv.vocabulary || 'not set'}\nAvoid words: ${(bv.avoidWords || []).join(', ') || 'none'}\nExample phrases: ${(bv.examplePhrases || []).join(' / ') || 'none'}`;
}

async function generateImage(prompt, size = '1024x1024', quality = 'standard') {
  const openai = getOpenAI();
  try {
    const resp = await openai.images.generate({
      model: 'gpt-image-1',
      prompt,
      n: 1,
      size,
    });
    return resp.data[0].url || (resp.data[0].b64_json ? `data:image/png;base64,${resp.data[0].b64_json}` : null);
  } catch {
    // Fallback to dall-e-3
    const resp = await openai.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size,
      quality,
      response_format: 'url',
    });
    return resp.data[0].url;
  }
}

// ═══════════════════════════════════════════════════════════
// CATEGORY A — PRODUCT CONTENT GENERATION
// ═══════════════════════════════════════════════════════════

/* Feature 1: Product Description Writer */
router.post('/product-description', async (req, res) => {
  try {
    const { title, tags = [], category = '', imageUrl = null, tone = 'professional', variants = '', model = 'gpt-4o-mini' } = req.body || {};
    if (!title) return res.status(400).json({ ok: false, error: 'title required' });

    const messages = [
      { role: 'system', content: withBrandVoice(`You are an expert Shopify product copywriter. Write SEO-optimized product descriptions that convert browsers into buyers.`) },
      { role: 'user', content: [
        { type: 'text', text: `Product: "${title}"\nCategory: ${category || 'general'}\nTags: ${tags.join(', ') || 'none'}\nTone: ${tone}\n${variants ? `Variants: ${variants}` : ''}\n\nWrite 3 product descriptions:\n1. SHORT (50-80 words) — punchy, hook-first\n2. MEDIUM (120-160 words) — benefits-led, sensory details\n3. LONG (250-350 words) — SEO-rich, features + benefits + social proof trigger\n\nReturn JSON: { "short": "...", "medium": "...", "long": "...", "bulletPoints": ["up to 6 bullet points"], "seoTitle": "...(<=60 chars)", "metaDescription": "...(<=160 chars)", "tone": "${tone}" }` },
        ...(imageUrl ? [{ type: 'image_url', image_url: { url: imageUrl } }] : [])
      ]}
    ];

    const completion = await getOpenAI().chat.completions.create({ model, messages, response_format: { type: 'json_object' }, max_tokens: 1200 });
    const result = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    db.addHistory({ type: 'product-description', title, result });
    res.json({ ok: true, ...result });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

/* Feature 2: SEO Meta Title & Description Generator */
router.post('/meta-tags', async (req, res) => {
  try {
    const { title, keyword = '', category = '', model = 'gpt-4o-mini' } = req.body || {};
    if (!title) return res.status(400).json({ ok: false, error: 'title required' });

    const completion = await getOpenAI().chat.completions.create({
      model,
      messages: [{
        role: 'user',
        content: withBrandVoice(`Generate SEO meta tags for a Shopify product/page.\n\nProduct/Page: "${title}"\nTarget keyword: "${keyword}"\nCategory: "${category}"\n\nReturn JSON:\n{\n  "metaTitles": ["3 options, each ≤60 chars, keyword near front"],\n  "metaDescriptions": ["3 options, each ≤160 chars, include CTA, include keyword"],\n  "keywordPlacementScore": [100, 85, 70],\n  "estimatedCTRTier": ["high", "medium", "medium"],\n  "openGraphTitle": "...",\n  "openGraphDescription": "...",\n  "twitterCard": "..."\n}`)
      }],
      response_format: { type: 'json_object' }, max_tokens: 600,
    });
    const result = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    db.addHistory({ type: 'meta-tags', title, keyword, result });
    res.json({ ok: true, ...result });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

/* Feature 3: Bulk Product Description Generator */
router.post('/bulk-descriptions', async (req, res) => {
  try {
    const { products, tone = 'professional', model = 'gpt-4o-mini' } = req.body || {};
    if (!Array.isArray(products) || !products.length) return res.status(400).json({ ok: false, error: 'products[] required' });
    if (products.length > 50) return res.status(400).json({ ok: false, error: 'Max 50 products per batch' });

    const results = await Promise.all(products.map(async (p, i) => {
      try {
        const content = `Product ${i + 1}: "${p.title}"\nCategory: ${p.category || ''}\nTags: ${(p.tags || []).join(', ')}\nTone: ${tone}\n\nWrite a concise 80-120 word product description. Return JSON: { "description": "...", "seoTitle": "...", "metaDescription": "..." }`;
        const c = await getOpenAI().chat.completions.create({
          model, messages: [{ role: 'user', content: withBrandVoice(content) }],
          response_format: { type: 'json_object' }, max_tokens: 400,
        });
        return { index: i, title: p.title, ok: true, ...JSON.parse(c.choices[0].message.content) };
      } catch (e) { return { index: i, title: p.title, ok: false, error: e.message }; }
    }));

    if (req.deductCredits) req.deductCredits({ model, multiplier: Math.ceil(products.length / 5) });
    db.addHistory({ type: 'bulk-descriptions', count: products.length });
    res.json({ ok: true, count: results.length, results });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

/* Feature 4: Variant Copy Generator */
router.post('/variant-copy', async (req, res) => {
  try {
    const { baseDescription, productTitle, variants, model = 'gpt-4o-mini' } = req.body || {};
    if (!baseDescription || !Array.isArray(variants)) return res.status(400).json({ ok: false, error: 'baseDescription and variants[] required' });

    const completion = await getOpenAI().chat.completions.create({
      model,
      messages: [{ role: 'user', content: withBrandVoice(`Product: "${productTitle}"\nBase description: "${baseDescription}"\nVariants: ${JSON.stringify(variants)}\n\nGenerate unique short copy (30-60 words) for each variant that highlights what makes that specific variant special without repeating the base description.\n\nReturn JSON: { "variantCopy": [{ "variant": "...", "copy": "...", "keyDifferentiator": "..." }] }`) }],
      response_format: { type: 'json_object' }, max_tokens: 800,
    });
    const result = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    db.addHistory({ type: 'variant-copy', productTitle, result });
    res.json({ ok: true, ...result });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

/* Feature 5: Collection Page Description Writer */
router.post('/collection-description', async (req, res) => {
  try {
    const { collectionTitle, productTitles = [], theme = '', model = 'gpt-4o-mini' } = req.body || {};
    if (!collectionTitle) return res.status(400).json({ ok: false, error: 'collectionTitle required' });

    const completion = await getOpenAI().chat.completions.create({
      model,
      messages: [{ role: 'user', content: withBrandVoice(`Write SEO-rich collection page copy for a Shopify store.\n\nCollection: "${collectionTitle}"\nTheme/niche: "${theme}"\nProducts in this collection: ${productTitles.slice(0, 15).join(', ')}\n\nReturn JSON:\n{\n  "headline": "H1 headline for the collection page",\n  "description": "150-250 word SEO description with keyword-rich intro",\n  "seoTitle": "collection page <title> tag ≤60 chars",\n  "metaDescription": "collection meta description ≤160 chars",\n  "subCategories": ["suggested subcategory filter labels"],\n  "proseIntro": "2-3 sentence intro to show above products"\n}`) }],
      response_format: { type: 'json_object' }, max_tokens: 700,
    });
    const result = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    db.addHistory({ type: 'collection-description', collectionTitle, result });
    res.json({ ok: true, ...result });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

/* Feature 6: FAQ Generator from Product Data */
router.post('/product-faq', async (req, res) => {
  try {
    const { productTitle, description = '', tags = [], imageUrl = null, count = 8, model = 'gpt-4o-mini' } = req.body || {};
    if (!productTitle) return res.status(400).json({ ok: false, error: 'productTitle required' });

    const messages = [{
      role: 'user', content: [
        { type: 'text', text: `Generate ${count} realistic customer FAQs with answers for:\n\nProduct: "${productTitle}"\nDescription: "${description.slice(0, 500)}"\nTags: ${tags.join(', ')}\n\nInclude: dimensions/sizing, materials, care, shipping, compatibility questions.\n\nReturn JSON:\n{\n  "faqs": [{ "question": "...", "answer": "2-3 sentence answer", "schemaAnswer": "concise 1-sentence for schema" }],\n  "jsonLdSchema": { complete FAQPage schema.org JSON-LD object },\n  "supportsCategoryQuestions": ["categorized common questions for support team"]\n}` },
        ...(imageUrl ? [{ type: 'image_url', image_url: { url: imageUrl } }] : [])
      ]
    }];

    const completion = await getOpenAI().chat.completions.create({ model, messages, response_format: { type: 'json_object' }, max_tokens: 1500 });
    const result = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    db.addHistory({ type: 'product-faq', productTitle, result });
    res.json({ ok: true, ...result });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

/* Feature 7: Product Comparison Table */
router.post('/comparison-table', async (req, res) => {
  try {
    const { products, model = 'gpt-4o-mini' } = req.body || {};
    if (!Array.isArray(products) || products.length < 2) return res.status(400).json({ ok: false, error: 'products[] (min 2) required' });

    const completion = await getOpenAI().chat.completions.create({
      model,
      messages: [{ role: 'user', content: `Create a detailed product comparison for these items: ${products.map(p => `"${p.title || p}"`).join(', ')}\n\nReturn JSON:\n{\n  "tableHeaders": ["Feature", ...productNames],\n  "tableRows": [["Feature name", "product1 value", "product2 value"]],\n  "prosCons": [{ "product": "...", "pros": ["..."], "cons": ["..."] }],\n  "verdict": { "best_overall": "...", "best_budget": "...", "best_for": [{ "use_case": "...", "winner": "..." }] },\n  "blogIntro": "intro paragraph for a comparison blog post",\n  "markdownTable": "full markdown table"\n}` }],
      response_format: { type: 'json_object' }, max_tokens: 1200,
    });
    const result = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    db.addHistory({ type: 'comparison-table', products: products.map(p => p.title || p), result });
    res.json({ ok: true, ...result });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

/* Feature 8: Review Response Generator */
router.post('/review-response', async (req, res) => {
  try {
    const { reviewText, starRating, productTitle = '', storeName = '', model = 'gpt-4o-mini' } = req.body || {};
    if (!reviewText || !starRating) return res.status(400).json({ ok: false, error: 'reviewText and starRating required' });

    const completion = await getOpenAI().chat.completions.create({
      model,
      messages: [{ role: 'user', content: withBrandVoice(`You are a customer service expert for "${storeName || 'our store'}". Write professional, brand-authentic responses to this review.\n\nProduct: "${productTitle}"\nRating: ${starRating}/5 stars\nReview: "${reviewText}"\n\nReturn JSON:\n{\n  "responses": [\n    { "tone": "grateful", "text": "..." },\n    { "tone": "professional", "text": "..." },\n    { "tone": "personal", "text": "..." }\n  ],\n  "sentiment": "positive|neutral|negative|mixed",\n  "keyIssue": "main concern raised (if any)",\n  "followUpAction": "internal action to take based on this review",\n  "canBePublishedDirectly": true|false\n}`) }],
      response_format: { type: 'json_object' }, max_tokens: 700,
    });
    const result = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    db.addHistory({ type: 'review-response', starRating, result });
    res.json({ ok: true, ...result });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

// ═══════════════════════════════════════════════════════════
// CATEGORY B — AD & MARKETING COPY
// ═══════════════════════════════════════════════════════════

/* Feature 9: Meta/Instagram Ad Copy Generator */
router.post('/ad-copy/meta', async (req, res) => {
  try {
    const { productTitle, offer = '', audience = '', goal = 'conversions', variants = 5, model = 'gpt-4o-mini' } = req.body || {};
    if (!productTitle) return res.status(400).json({ ok: false, error: 'productTitle required' });

    const completion = await getOpenAI().chat.completions.create({
      model,
      messages: [{ role: 'user', content: withBrandVoice(`Generate ${variants} Meta/Instagram ad copy variants for split testing.\n\nProduct: "${productTitle}"\nOffer: "${offer || 'none'}"\nTarget audience: "${audience || 'general'}"\nGoal: ${goal}\n\nReturn JSON:\n{\n  "variants": [\n    {\n      "primaryText": "...(max 125 chars for mobile)",\n      "headline": "...(max 40 chars)",\n      "description": "...(max 30 chars)",\n      "callToAction": "Shop Now|Learn More|Get Offer|Sign Up",\n      "angle": "social proof|urgency|curiosity|benefit|emotion",\n      "estimatedCTRTier": "high|medium|low"\n    }\n  ],\n  "audienceInsights": "best audience segments for this ad",\n  "creativeDirection": "image/video direction for the creative"\n}`) }],
      response_format: { type: 'json_object' }, max_tokens: 1000,
    });
    const result = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    db.addHistory({ type: 'ad-copy-meta', productTitle, result });
    res.json({ ok: true, ...result });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

/* Feature 10: Google Performance Max Asset Generator */
router.post('/ad-copy/pmax', async (req, res) => {
  try {
    const { productTitle, description = '', url = '', model = 'gpt-4o-mini' } = req.body || {};
    if (!productTitle) return res.status(400).json({ ok: false, error: 'productTitle required' });

    const completion = await getOpenAI().chat.completions.create({
      model,
      messages: [{ role: 'user', content: withBrandVoice(`Generate Google Performance Max assets for:\n\nProduct: "${productTitle}"\nDescription: "${description.slice(0, 300)}"\nFinal URL: "${url}"\n\nReturn JSON (strict character limits):\n{\n  "headlines": ["5 headlines, each ≤30 chars, keyword-front"],\n  "longHeadlines": ["5 long headlines ≤90 chars"],\n  "descriptions": ["5 descriptions ≤90 chars, benefit-focused"],\n  "businessName": "...(≤25 chars)",\n  "callToActions": ["SHOP_NOW","BUY_NOW","LEARN_MORE","GET_OFFER"],\n  "keywordThemes": ["3-5 keyword theme suggestions"],\n  "sitelinks": [{ "text": "≤25 chars", "description1": "≤35 chars", "description2": "≤35 chars", "url": "..." }]\n}`) }],
      response_format: { type: 'json_object' }, max_tokens: 900,
    });
    const result = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    db.addHistory({ type: 'ad-pmax', productTitle, result });
    res.json({ ok: true, ...result });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

/* Feature 11: TikTok/Reels Script Generator */
router.post('/ad-copy/tiktok-script', async (req, res) => {
  try {
    const { productTitle, offer = '', duration = 30, style = 'ugc', model = 'gpt-4o-mini' } = req.body || {};
    if (!productTitle) return res.status(400).json({ ok: false, error: 'productTitle required' });

    const completion = await getOpenAI().chat.completions.create({
      model,
      messages: [{ role: 'user', content: withBrandVoice(`Write a ${duration}-second TikTok/Reels video script for "${productTitle}" in ${style} style.\n\nOffer: ${offer || 'none'}\nStyle notes: ${style === 'ugc' ? 'authentic, first-person, conversational' : style === 'branded' ? 'polished, aspirational, brand-forward' : 'educational, informative'}\n\nReturn JSON:\n{\n  "hook": "First 3-second hook line (must stop the scroll)",\n  "hookVariants": ["3 alternative hooks to A/B test"],\n  "script": [\n    { "timestamp": "0-3s", "onScreen": "what to show", "voiceover": "what to say" }\n  ],\n  "cta": "closing call-to-action line",\n  "textOverlays": ["text to overlay on screen during key moments"],\n  "soundRecommendation": "trending sound style suggestion",\n  "hashtags": ["10 relevant hashtags"],\n  "estimatedEngagementTier": "high|medium|low"\n}`) }],
      response_format: { type: 'json_object' }, max_tokens: 1000,
    });
    const result = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    db.addHistory({ type: 'tiktok-script', productTitle, result });
    res.json({ ok: true, ...result });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

/* Feature 12: Email Subject Line Generator */
router.post('/email-subjects', async (req, res) => {
  try {
    const { campaign, productTitle = '', offer = '', count = 10, model = 'gpt-4o-mini' } = req.body || {};
    if (!campaign) return res.status(400).json({ ok: false, error: 'campaign type required (e.g. promo, abandoned-cart, welcome)' });

    const completion = await getOpenAI().chat.completions.create({
      model,
      messages: [{ role: 'user', content: withBrandVoice(`Generate ${count} email subject lines for a ${campaign} campaign.\n\nProduct/context: "${productTitle}"\nOffer: "${offer || 'none'}"\n\nReturn JSON:\n{\n  "subjectLines": [\n    {\n      "subject": "...",\n      "preheader": "preview text ≤90 chars",\n      "angle": "urgency|curiosity|social_proof|personalization|benefit|humor",\n      "estimatedOpenRate": "high|medium|low",\n      "hasEmoji": true|false,\n      "characterCount": 0\n    }\n  ],\n  "recommendation": "which 2 to A/B test first and why"\n}`) }],
      response_format: { type: 'json_object' }, max_tokens: 900,
    });
    const result = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    db.addHistory({ type: 'email-subjects', campaign, result });
    res.json({ ok: true, ...result });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

/* Feature 13: Push Notification Copy Generator */
router.post('/push-notifications', async (req, res) => {
  try {
    const { eventType, productTitle = '', discount = '', model = 'gpt-4o-mini' } = req.body || {};
    if (!eventType) return res.status(400).json({ ok: false, error: 'eventType required (flash-sale|back-in-stock|price-drop|new-arrival|loyalty)' });

    const completion = await getOpenAI().chat.completions.create({
      model,
      messages: [{ role: 'user', content: withBrandVoice(`Generate 5 push notification variants for a "${eventType}" event.\n\nProduct: "${productTitle}"\nDiscount/offer: "${discount || 'none'}"\n\nReturn JSON:\n{\n  "notifications": [\n    {\n      "title": "≤50 chars",\n      "body": "≤100 chars",\n      "emoji": "leading emoji",\n      "angle": "urgency|exclusivity|curiosity|rewarding",\n      "deepLink": "/suggested-path"\n    }\n  ]\n}`) }],
      response_format: { type: 'json_object' }, max_tokens: 700,
    });
    const result = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    db.addHistory({ type: 'push-notifications', eventType, result });
    res.json({ ok: true, ...result });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

/* Feature 14: Abandoned Cart Recovery Sequence */
router.post('/abandoned-cart-sequence', async (req, res) => {
  try {
    const { productTitle, cartValue = '', discount = '', storeName = '', model = 'gpt-4o-mini' } = req.body || {};
    if (!productTitle) return res.status(400).json({ ok: false, error: 'productTitle required' });

    const completion = await getOpenAI().chat.completions.create({
      model: model === 'gpt-4o-mini' ? 'gpt-4o-mini' : model,
      messages: [{ role: 'user', content: withBrandVoice(`Generate a 3-email abandoned cart recovery sequence for:\n\nProduct: "${productTitle}"\nCart value: $${cartValue || '50+'}\nDiscount available: ${discount || 'none'}\nStore: "${storeName || 'our store'}"\n\nReturn JSON:\n{\n  "sequence": [\n    {\n      "email": 1,\n      "sendDelay": "1 hour after abandonment",\n      "subject": "...",\n      "preheader": "...",\n      "angle": "gentle reminder",\n      "bodyHtml": "full email HTML body (simple, modern dark/light compatible)",\n      "cta": "button text"\n    },\n    {\n      "email": 2,\n      "sendDelay": "24 hours",\n      "angle": "social proof",\n      "subject": "...",\n      "preheader": "...",\n      "bodyHtml": "...",\n      "cta": "..."\n    },\n    {\n      "email": 3,\n      "sendDelay": "72 hours",\n      "angle": "last-chance discount",\n      "subject": "...",\n      "preheader": "...",\n      "bodyHtml": "...",\n      "cta": "..."\n    }\n  ],\n  "expectedRecoveryRate": "industry benchmark for this sequence type"\n}`) }],
      response_format: { type: 'json_object' }, max_tokens: 2000,
    });
    const result = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    db.addHistory({ type: 'abandoned-cart-sequence', productTitle, result });
    res.json({ ok: true, ...result });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

// ═══════════════════════════════════════════════════════════
// CATEGORY C — SOCIAL MEDIA CONTENT
// ═══════════════════════════════════════════════════════════

/* Feature 15: Instagram/Pinterest Caption Generator */
router.post('/social/caption', async (req, res) => {
  try {
    const { productTitle, platform = 'instagram', imageUrl = null, tone = 'casual', includeHashtags = true, model = 'gpt-4o-mini' } = req.body || {};
    if (!productTitle) return res.status(400).json({ ok: false, error: 'productTitle required' });

    const messages = [{
      role: 'user', content: [
        { type: 'text', text: withBrandVoice(`Write 3 ${platform} captions for "${productTitle}" in ${tone} tone.\n\nReturn JSON:\n{\n  "captions": [\n    {\n      "text": "caption text",\n      "angle": "lifestyle|product-feature|social-proof|story",\n      "emojiDensity": "low|medium|high",\n      "characterCount": 0\n    }\n  ],\n  "hashtagSets": {\n    "mega": ["hashtags >1M posts"],\n    "mid": ["hashtags 100K-1M posts"],\n    "niche": ["hashtags <100K posts, highly targeted"]\n  },\n  "bestTimeToPost": "optimal day and time for ${platform}",\n  "contentPillar": "education|entertainment|inspiration|promotion"\n}`) },
        ...(imageUrl ? [{ type: 'image_url', image_url: { url: imageUrl } }] : [])
      ]
    }];

    const completion = await getOpenAI().chat.completions.create({ model, messages, response_format: { type: 'json_object' }, max_tokens: 800 });
    const result = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    db.addHistory({ type: 'social-caption', platform, productTitle, result });
    res.json({ ok: true, platform, ...result });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

/* Feature 16: Social Calendar Planner */
router.post('/social/calendar', async (req, res) => {
  try {
    const { theme, launchDate, days = 30, platforms = ['instagram', 'tiktok'], productTitles = [], model = 'gpt-4o-mini' } = req.body || {};
    if (!theme) return res.status(400).json({ ok: false, error: 'theme required' });

    const completion = await getOpenAI().chat.completions.create({
      model,
      messages: [{ role: 'user', content: withBrandVoice(`Generate a ${days}-day social media content calendar.\n\nTheme/campaign: "${theme}"\nLaunch date: ${launchDate || 'starting today'}\nPlatforms: ${platforms.join(', ')}\nProducts to feature: ${productTitles.slice(0, 10).join(', ') || 'general store content'}\n\nReturn JSON:\n{\n  "calendar": [\n    {\n      "day": 1,\n      "date": "YYYY-MM-DD",\n      "platform": "instagram",\n      "contentPillar": "education|entertainment|promotion|inspiration",\n      "caption": "...",\n      "imageConceptNote": "visual direction for the image/video",\n      "bestTimeToPost": "HH:MM local time",\n      "hashtags": ["5-8 relevant hashtags"]\n    }\n  ],\n  "contentPillarMix": { "education": "30%", "entertainment": "30%", "promotion": "20%", "inspiration": "20%" },\n  "campaignHighlights": ["key promotional days in this period"]\n}`) }],
      response_format: { type: 'json_object' }, max_tokens: 3000,
    });
    const result = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    db.addHistory({ type: 'social-calendar', theme, days, result });
    res.json({ ok: true, ...result });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

/* Feature 17: UGC-Style Caption Rewriter */
router.post('/social/ugc-rewrite', async (req, res) => {
  try {
    const { originalCopy, platform = 'tiktok', persona = 'happy customer', model = 'gpt-4o-mini' } = req.body || {};
    if (!originalCopy) return res.status(400).json({ ok: false, error: 'originalCopy required' });

    const completion = await getOpenAI().chat.completions.create({
      model,
      messages: [{ role: 'user', content: `Rewrite this product copy in authentic UGC style for ${platform}.\n\nOriginal: "${originalCopy}"\nPersona: ${persona}\n\nUGC rules: first-person, conversational, specific details ("I've been using this for 2 weeks and..."), honest-sounding, includes a mini story or scenario, ends with genuine recommendation.\n\nReturn JSON:\n{\n  "ugcVariants": [\n    { "text": "...", "persona": "...", "platform": "${platform}", "hook": "first sentence only" }\n  ],\n  "toneShift": "summary of how the rewrite differs from original",\n  "authenticityScore": 0-100\n}` }],
      response_format: { type: 'json_object' }, max_tokens: 700,
    });
    const result = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    db.addHistory({ type: 'ugc-rewrite', result });
    res.json({ ok: true, ...result });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

/* Feature 18: Hashtag Research & Set Generator */
router.post('/social/hashtags', async (req, res) => {
  try {
    const { niche, productTitle = '', platform = 'instagram', sets = 5, model = 'gpt-4o-mini' } = req.body || {};
    if (!niche) return res.status(400).json({ ok: false, error: 'niche required' });

    const completion = await getOpenAI().chat.completions.create({
      model,
      messages: [{ role: 'user', content: `Generate ${sets} unique hashtag sets for ${platform} in the "${niche}" niche.\nProduct: "${productTitle}"\n\nEach set must have:\n- 3 mega tags (>1M posts)\n- 4 mid-tier tags (100K-1M posts)\n- 3 niche tags (<100K, highly targeted)\n\nReturn JSON:\n{\n  "hashtagSets": [\n    {\n      "setId": 1,\n      "tags": ["#tag1", "#tag2"],\n      "mega": ["#..."],\n      "mid": ["#..."],\n      "niche": ["#..."],\n      "estimatedReach": "description of potential reach"\n    }\n  ],\n  "strategy": "explanation of how to rotate these sets",\n  "platformTips": "${platform}-specific hashtag strategy tips"\n}` }],
      response_format: { type: 'json_object' }, max_tokens: 1000,
    });
    const result = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    db.addHistory({ type: 'hashtags', niche, result });
    res.json({ ok: true, ...result });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

// ═══════════════════════════════════════════════════════════
// CATEGORY D — PRODUCT IMAGE GENERATION
// ═══════════════════════════════════════════════════════════

/* Feature 19: AI Product Photography (Clean Background) */
router.post('/image/product-photo', async (req, res) => {
  try {
    const { productTitle, backgroundStyle = 'clean white studio', productCategory = '', size = '1024x1024' } = req.body || {};
    if (!productTitle) return res.status(400).json({ ok: false, error: 'productTitle required' });

    const prompt = `Professional product photography of "${productTitle}"${productCategory ? `, a ${productCategory}` : ''} on a ${backgroundStyle} background. Studio lighting, sharp focus, commercial quality, no shadows, photorealistic.`;
    const imageUrl = await generateImage(prompt, size, 'hd');
    db.addHistory({ type: 'image-product-photo', productTitle, backgroundStyle, imageUrl });
    if (req.deductCredits) req.deductCredits({ model: 'gpt-image-1' });
    res.json({ ok: true, imageUrl, prompt });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

/* Feature 20: Lifestyle Scene Generator */
router.post('/image/lifestyle', async (req, res) => {
  try {
    const { productTitle, scene, productCategory = '', style = 'photorealistic', size = '1024x1024' } = req.body || {};
    if (!productTitle || !scene) return res.status(400).json({ ok: false, error: 'productTitle and scene required' });

    const prompt = `Professional lifestyle product photography: ${productTitle}${productCategory ? ` (${productCategory})` : ''} ${scene}. ${style === 'photorealistic' ? 'Photorealistic, natural lighting' : style}. High-end commercial photography, editorial quality, aspirational.`;
    const imageUrl = await generateImage(prompt, size, 'hd');
    db.addHistory({ type: 'image-lifestyle', productTitle, scene, imageUrl });
    if (req.deductCredits) req.deductCredits({ model: 'gpt-image-1' });
    res.json({ ok: true, imageUrl, prompt });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

/* Feature 21: Background Replacement (AI) */
router.post('/image/background-replace', async (req, res) => {
  try {
    const { productTitle, newBackground, season = '', mood = 'clean', size = '1024x1024' } = req.body || {};
    if (!productTitle || !newBackground) return res.status(400).json({ ok: false, error: 'productTitle and newBackground required' });

    const prompt = `Product shot of "${productTitle}" with ${newBackground} background. ${season ? season + ' seasonal theme.' : ''} ${mood} mood. Professional e-commerce photography, product is the hero, background enhances without distracting.`;
    const imageUrl = await generateImage(prompt, size);
    db.addHistory({ type: 'image-background', productTitle, newBackground, imageUrl });
    if (req.deductCredits) req.deductCredits({ model: 'gpt-image-1' });
    res.json({ ok: true, imageUrl, prompt });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

/* Feature 22: Ad Creative Generator */
router.post('/image/ad-creative', async (req, res) => {
  try {
    const { productTitle, headline, cta = 'Shop Now', style = 'modern', aspectRatio = '1:1', size = '1024x1024' } = req.body || {};
    if (!productTitle || !headline) return res.status(400).json({ ok: false, error: 'productTitle and headline required' });

    const sizeMap = { '1:1': '1024x1024', '9:16': '1024x1792', '16:9': '1792x1024' };
    const imgSize = sizeMap[aspectRatio] || size;
    const prompt = `${style} e-commerce ad creative for "${productTitle}". Include bold text overlay: "${headline}" and CTA button: "${cta}". Clean design, high contrast, mobile-optimized. Aspect ratio ${aspectRatio}. Brand-safe, conversion-optimized ad design.`;
    const imageUrl = await generateImage(prompt, imgSize, 'hd');
    db.addHistory({ type: 'image-ad-creative', productTitle, headline, imageUrl });
    if (req.deductCredits) req.deductCredits({ model: 'gpt-image-1' });
    res.json({ ok: true, imageUrl, prompt, aspectRatio });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

/* Feature 23: Brand Icon & Logo Generator */
router.post('/image/brand-logo', async (req, res) => {
  try {
    const { brandName, style = 'minimal', colorPalette = 'black and white', industry = '', size = '1024x1024' } = req.body || {};
    if (!brandName) return res.status(400).json({ ok: false, error: 'brandName required' });

    const prompt = `${style} logo design for brand named "${brandName}"${industry ? ` in the ${industry} industry` : ''}. Color palette: ${colorPalette}. Clean vector-style logo mark, professional, scalable, works as favicon. No text unless brand name is integral. White background.`;
    const imageUrl = await generateImage(prompt, size, 'hd');
    db.addHistory({ type: 'image-logo', brandName, style, imageUrl });
    if (req.deductCredits) req.deductCredits({ model: 'gpt-image-1' });
    res.json({ ok: true, imageUrl, prompt });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

/* Feature 24: Product Variant Visual (Color/Pattern) */
router.post('/image/variant-visual', async (req, res) => {
  try {
    const { productTitle, productCategory, originalColor, newColor, style = '', size = '1024x1024' } = req.body || {};
    if (!productTitle || !newColor) return res.status(400).json({ ok: false, error: 'productTitle and newColor required' });

    const prompt = `Professional product photography of a ${productCategory || 'product'} "${productTitle}" in ${newColor} color${style ? `, ${style} style` : ''}. Same product shape as ${originalColor || 'original'} variant but in ${newColor}. Clean white background, studio lighting, e-commerce ready.`;
    const imageUrl = await generateImage(prompt, size);
    db.addHistory({ type: 'image-variant', productTitle, newColor, imageUrl });
    if (req.deductCredits) req.deductCredits({ model: 'gpt-image-1' });
    res.json({ ok: true, imageUrl, prompt });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

/* Feature 25: Product Image Upscaler (via AI enhancement prompt) */
router.post('/image/upscale-prompt', async (req, res) => {
  try {
    const { productTitle, productCategory = '', description = '', size = '1792x1024' } = req.body || {};
    if (!productTitle) return res.status(400).json({ ok: false, error: 'productTitle required' });

    const prompt = `Ultra-high resolution professional product photography of "${productTitle}"${productCategory ? ` (${productCategory})` : ''}. ${description ? description + '.' : ''} 4K quality, fine detail, sharp textures, perfect studio lighting. Suitable for Shopify zoom feature.`;
    const imageUrl = await generateImage(prompt, '1792x1024', 'hd');
    db.addHistory({ type: 'image-upscale', productTitle, imageUrl });
    if (req.deductCredits) req.deductCredits({ model: 'gpt-image-1' });
    res.json({ ok: true, imageUrl, prompt });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

// ═══════════════════════════════════════════════════════════
// CATEGORY E — BRAND VOICE & STYLE
// ═══════════════════════════════════════════════════════════

/* Feature 26: Brand Voice Trainer */
router.post('/brand/voice-train', async (req, res) => {
  try {
    const { sampleTexts, storeName = '', industry = '', model = 'gpt-4o' } = req.body || {};
    if (!Array.isArray(sampleTexts) || sampleTexts.length < 2) return res.status(400).json({ ok: false, error: 'sampleTexts[] (min 2 examples) required' });

    const completion = await getOpenAI().chat.completions.create({
      model,
      messages: [{ role: 'user', content: `Analyze these copy samples from "${storeName}" (${industry}) and extract a detailed brand voice profile:\n\n${sampleTexts.map((t, i) => `SAMPLE ${i + 1}:\n${t}`).join('\n\n')}\n\nReturn JSON:\n{\n  "storeName": "${storeName}",\n  "tone": "e.g. warm and authoritative",\n  "personality": ["3-5 personality traits"],\n  "vocabulary": "accessible|technical|mixed - description",\n  "sentenceStyle": "short+punchy|medium|long+flowing",\n  "emojiUsage": "never|rarely|moderate|frequent",\n  "avoidWords": ["words/phrases that clash with this brand"],\n  "powerWords": ["words that define this brand's voice"],\n  "examplePhrases": ["3 phrases that perfectly capture the voice"],\n  "negativeExamples": ["3 phrases this brand would NEVER say"],\n  "voiceSummary": "2-sentence summary of the brand voice"\n}` }],
      response_format: { type: 'json_object' }, max_tokens: 1000,
    });
    const profile = JSON.parse(completion.choices[0].message.content);
    db.saveBrandVoice(profile);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, profile });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

router.get('/brand/voice', (req, res) => {
  const profile = db.getBrandVoice();
  res.json({ ok: true, profile });
});

router.delete('/brand/voice', (req, res) => {
  db.clearBrandVoice();
  res.json({ ok: true });
});

/* Feature 27: Brand LoRA Info / Style Profile */
router.post('/brand/style-profile', async (req, res) => {
  try {
    const { imageDescriptions, colorKeywords = [], moodKeywords = [], model = 'gpt-4o-mini' } = req.body || {};
    if (!Array.isArray(imageDescriptions) || imageDescriptions.length < 3) return res.status(400).json({ ok: false, error: 'imageDescriptions[] (min 3) required' });

    const completion = await getOpenAI().chat.completions.create({
      model,
      messages: [{ role: 'user', content: `Analyze these visual descriptions and create a brand image style profile for use in AI image generation prompts.\n\nImage descriptions:\n${imageDescriptions.map((d, i) => `${i + 1}. ${d}`).join('\n')}\nColor keywords: ${colorKeywords.join(', ')}\nMood keywords: ${moodKeywords.join(', ')}\n\nReturn JSON:\n{\n  "styleProfile": {\n    "lighting": "...",\n    "colorPalette": ["hex or color names"],\n    "mood": "...",\n    "composition": "...",\n    "texture": "...",\n    "setting": "typical backgrounds/environments"\n  },\n  "masterImagePromptPrefix": "reusable prompt prefix to maintain visual consistency",\n  "negativePromptSuggestions": ["things to avoid in all images"],\n  "consistencyScore": 0-100,\n  "notes": "observations about the visual brand"\n}` }],
      response_format: { type: 'json_object' }, max_tokens: 800,
    });
    const result = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    res.json({ ok: true, ...result });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

/* Feature 28: Competitor Copy Analyzer */
router.post('/brand/competitor-analysis', async (req, res) => {
  try {
    const { competitorUrl, competitorCopy, yourCopy = null, model = 'gpt-4o-mini' } = req.body || {};
    if (!competitorCopy && !competitorUrl) return res.status(400).json({ ok: false, error: 'competitorCopy or competitorUrl required' });

    let copy = competitorCopy;
    if (!copy && competitorUrl) {
      try {
        const fetchMod = (await import('node-fetch')).default;
        const r = await fetchMod(competitorUrl, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 10000 });
        const html = await r.text();
        const cheerio = require('cheerio');
        const $ = cheerio.load(html);
        $('script, style, nav, footer, header').remove();
        copy = $('body').text().replace(/\s+/g, ' ').slice(0, 3000);
      } catch (e) { return res.status(400).json({ ok: false, error: `Could not fetch URL: ${e.message}` }); }
    }

    const completion = await getOpenAI().chat.completions.create({
      model,
      messages: [{ role: 'user', content: `Analyze this competitor's copy and extract strategic insights.\n\nCompetitor URL: ${competitorUrl || '(not provided)'}\nCompetitor copy:\n"${copy}"\n\n${yourCopy ? `Your current copy:\n"${yourCopy}"\n\n` : ''}Return JSON:\n{\n  "readabilityScore": 0-100,\n  "tone": "...",\n  "emotionalTriggers": ["triggers they use"],\n  "topKeywords": ["most-used keywords"],\n  "ctaPatterns": ["call-to-action patterns they use"],\n  "valuePropositions": ["unique claims they make"],\n  "weaknesses": ["copy weaknesses to exploit"],\n  "strengths": ["copy strengths to learn from"],\n  "wordCount": 0,\n  "uniquenessScore": 0-100,\n  ${yourCopy ? '"vsYourCopy": { "gaps": ["things they do well that you dont"], "yourAdvantages": ["things you do better"], "keyDifferences": ["main differences"] },' : ''}\n  "recommendations": ["actionable improvements for your copy based on this analysis"]\n}` }],
      response_format: { type: 'json_object' }, max_tokens: 1000,
    });
    const result = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    db.addHistory({ type: 'competitor-analysis', competitorUrl, result });
    res.json({ ok: true, ...result });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

/* Feature 29: Legal Copy Generator */
router.post('/brand/legal-copy', async (req, res) => {
  try {
    const { policyType, storeName, country = 'United States', productCategory = 'general e-commerce', returnWindow = '30 days', model = 'gpt-4o-mini' } = req.body || {};
    if (!policyType || !storeName) return res.status(400).json({ ok: false, error: 'policyType and storeName required (policyType: returns|privacy|terms|shipping)' });

    const completion = await getOpenAI().chat.completions.create({
      model,
      messages: [{ role: 'user', content: `Generate a ${policyType} policy for a Shopify store.\n\nStore name: "${storeName}"\nCountry/Jurisdiction: ${country}\nProduct category: ${productCategory}\nReturn window: ${returnWindow}\n\nImportant: Include a disclaimer that this is AI-generated and should be reviewed by legal counsel.\n\nReturn JSON:\n{\n  "policyTitle": "...",\n  "lastUpdated": "${new Date().toISOString().split('T')[0]}",\n  "policyHtml": "full HTML policy content with proper headings",\n  "policyMarkdown": "same content in markdown",\n  "keyPoints": ["5-7 bullet points summarizing the policy"],\n  "disclaimer": "legal review disclaimer text",\n  "shopifySection": "which Shopify settings page to paste this"\n}` }],
      response_format: { type: 'json_object' }, max_tokens: 2000,
    });
    const result = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    db.addHistory({ type: 'legal-copy', policyType, storeName, result });
    res.json({ ok: true, ...result });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

// ═══════════════════════════════════════════════════════════
// CATEGORY F — VIDEO & MOTION
// ═══════════════════════════════════════════════════════════

/* Feature 30: Product Video Ad Generator (storyboard + prompt) */
router.post('/video/product-ad', async (req, res) => {
  try {
    const { productTitle, offer = '', duration = 15, platform = 'tiktok', style = 'dynamic', model = 'gpt-4o-mini' } = req.body || {};
    if (!productTitle) return res.status(400).json({ ok: false, error: 'productTitle required' });

    const completion = await getOpenAI().chat.completions.create({
      model,
      messages: [{ role: 'user', content: withBrandVoice(`Create a ${duration}-second product video ad storyboard for "${productTitle}" for ${platform}.\n\nOffer: ${offer || 'none'}\nStyle: ${style}\n\nReturn JSON:\n{\n  "storyboard": [\n    { "second": "0-3", "visual": "what's on screen", "audio": "voiceover or music note", "textOverlay": "on-screen text if any" }\n  ],\n  "videoPrompt": "AI video generation prompt for tools like Kling/Sora",\n  "imagePrompts": ["3 still image prompts for key frames"],\n  "voiceoverScript": "full read-aloud script",\n  "music": "music style/mood recommendation",\n  "aspectRatio": "${platform === 'tiktok' || platform === 'reels' ? '9:16' : '1:1'}",\n  "falApiPrompt": { "model": "fal-ai/kling-video/v3/pro", "prompt": "...", "duration": ${duration} }\n}`) }],
      response_format: { type: 'json_object' }, max_tokens: 1200,
    });
    const result = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    db.addHistory({ type: 'video-product-ad', productTitle, result });
    res.json({ ok: true, ...result });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

/* Feature 31: Talking Spokesperson Script + Prompt */
router.post('/video/spokesperson', async (req, res) => {
  try {
    const { productTitle, scriptLength = 30, persona = 'friendly expert', offer = '', model = 'gpt-4o-mini' } = req.body || {};
    if (!productTitle) return res.status(400).json({ ok: false, error: 'productTitle required' });

    const completion = await getOpenAI().chat.completions.create({
      model,
      messages: [{ role: 'user', content: withBrandVoice(`Write a ${scriptLength}-second spokesperson lipsync video script for "${productTitle}".\n\nPersona: ${persona}\nOffer: ${offer || 'none'}\n\nReturn JSON:\n{\n  "script": "full spoken script (natural, conversational, fits ${scriptLength}s at speaking pace)",\n  "wordCount": 0,\n  "speakingPace": "words per minute",\n  "personaDescription": "visual description of the spokesperson to use for avatar generation",\n  "avatarImagePrompt": "AI image prompt to generate the spokesperson avatar",\n  "lipSyncApiPayload": { "model": "fal-ai/creatify/aurora", "script": "...", "notes": "configure with your avatar image" },\n  "tones": ["confident|warm|excited"],\n  "gestureCues": ["gesture notes for key moments in script"]\n}`) }],
      response_format: { type: 'json_object' }, max_tokens: 900,
    });
    const result = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    db.addHistory({ type: 'video-spokesperson', productTitle, result });
    res.json({ ok: true, ...result });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

/* Feature 32: Seasonal Video Template Planner */
router.post('/video/seasonal', async (req, res) => {
  try {
    const { productTitle, season, discount = '', model = 'gpt-4o-mini' } = req.body || {};
    if (!productTitle || !season) return res.status(400).json({ ok: false, error: 'productTitle and season required' });

    const completion = await getOpenAI().chat.completions.create({
      model,
      messages: [{ role: 'user', content: withBrandVoice(`Create a seasonal promotional video plan for "${productTitle}" during ${season}.\n\nDiscount/offer: ${discount || 'none'}\n\nReturn JSON:\n{\n  "videoTitle": "...",\n  "themeColors": ["hex or color names for this season"],\n  "storyboard": [\n    { "scene": 1, "visual": "...", "textOverlay": "...", "duration": "3s" }\n  ],\n  "voiceoverScript": "...",\n  "musicMood": "festive|upbeat|emotional|epic",\n  "imagePrompts": ["3 seasonal AI image prompts to use as video frames"],\n  "videoPrompt": "text prompt for video generation AI",\n  "urgencyElements": ["seasonal urgency triggers to include"],\n  "platformVersions": { "tiktok_9x16": "prompt variation", "instagram_1x1": "prompt variation" }\n}`) }],
      response_format: { type: 'json_object' }, max_tokens: 1000,
    });
    const result = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    db.addHistory({ type: 'video-seasonal', productTitle, season, result });
    res.json({ ok: true, ...result });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

/* Feature 33: Product Demo GIF Script */
router.post('/video/gif-cinemagraph', async (req, res) => {
  try {
    const { productTitle, motionStyle = 'subtle loop', productCategory = '', size = '1024x1024' } = req.body || {};
    if (!productTitle) return res.status(400).json({ ok: false, error: 'productTitle required' });

    const imagePrompt = `Professional product shot of "${productTitle}"${productCategory ? ` (${productCategory})` : ''} with subtle motion elements (${motionStyle}). Perfect still frame for an animated GIF/cinemagraph. Studio lighting, clean background.`;
    const imageUrl = await generateImage(imagePrompt, size);

    const motionGuide = {
      imageUrl,
      imagePrompt,
      motionStyle,
      gifPrompt: `Convert this image to a subtle looping cinemagraph with ${motionStyle}. Use fal-ai/ltx-2 image-to-video with duration=2.5s, then loop.`,
      falApiPayload: {
        model: 'fal-ai/ltx-video-v0-9-7/image-to-video',
        image_url: '(use the generated imageUrl)',
        prompt: `${productTitle} subtle animated ${motionStyle}`,
        duration: 3,
        aspect_ratio: '1:1',
      },
      emailNote: 'Export as GIF (≤2MB) and WebM for email/listing use.',
    };

    db.addHistory({ type: 'gif-cinemagraph', productTitle, imageUrl });
    if (req.deductCredits) req.deductCredits({ model: 'gpt-image-1' });
    res.json({ ok: true, ...motionGuide });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

// ═══════════════════════════════════════════════════════════
// CATEGORY G — BLOG & LONG-FORM
// ═══════════════════════════════════════════════════════════

/* Feature 34: SEO Blog Post Generator */
router.post('/blog/generate', async (req, res) => {
  try {
    const { keyword, productCategory = '', wordCount = 1200, model = 'gpt-4o' } = req.body || {};
    if (!keyword) return res.status(400).json({ ok: false, error: 'keyword required' });

    const completion = await getOpenAI().chat.completions.create({
      model,
      messages: [{ role: 'user', content: withBrandVoice(`Write a ~${wordCount} word SEO blog post targeting the keyword "${keyword}" for a ${productCategory || 'e-commerce'} Shopify store.\n\nRequirements:\n- Compelling H1 with keyword\n- 4-6 H2 sections with H3 subsections\n- Intro with hook\n- Include data points and statistics (real or estimated)\n- Natural keyword usage (2-3% density)\n- FAQ section at end (3-5 Q&A)\n- CTA to store\n\nReturn JSON:\n{\n  "title": "H1 heading",\n  "seoTitle": "meta title ≤60 chars",\n  "metaDescription": "≤160 chars",\n  "slug": "url-friendly-slug",\n  "outline": [{ "h2": "...", "h3s": ["..."] }],\n  "fullPost": "complete markdown content",\n  "wordCountActual": 0,\n  "internalLinkSuggestions": ["where to add internal links"],\n  "featuredImagePrompt": "AI image generation prompt for the hero image",\n  "schema": { FAQ schema JSON-LD for the FAQ section }\n}`) }],
      response_format: { type: 'json_object' }, max_tokens: 3000,
    });
    const result = JSON.parse(completion.choices[0].message.content);

    // Generate featured image
    if (result.featuredImagePrompt) {
      try { result.featuredImageUrl = await generateImage(result.featuredImagePrompt, '1792x1024', 'hd'); } catch {}
    }

    if (req.deductCredits) req.deductCredits({ model });
    db.addHistory({ type: 'blog-post', keyword, wordCount, result: { title: result.title, wordCountActual: result.wordCountActual } });
    res.json({ ok: true, ...result });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

/* Feature 35: Blog Post Image Pack */
router.post('/blog/image-pack', async (req, res) => {
  try {
    const { blogTitle, sections = [], style = 'editorial photography', count = 3 } = req.body || {};
    if (!blogTitle) return res.status(400).json({ ok: false, error: 'blogTitle required' });

    const imageJobs = (sections.length ? sections : Array(count).fill(blogTitle)).slice(0, count);
    const images = await Promise.all(imageJobs.map(async (section) => {
      const prompt = `${style} image for a blog post section about "${section}" in context of "${blogTitle}". Editorial quality, informative, visually engaging, suitable as blog article image.`;
      try {
        const url = await generateImage(prompt, '1792x1024', 'hd');
        return { section: typeof section === 'string' ? section : blogTitle, url, prompt };
      } catch (e) { return { section, url: null, error: e.message, prompt }; }
    }));

    if (req.deductCredits) req.deductCredits({ model: 'gpt-image-1', multiplier: images.length });
    db.addHistory({ type: 'blog-image-pack', blogTitle, count: images.length });
    res.json({ ok: true, blogTitle, images });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

/* Feature 36: Content Repurposer */
router.post('/blog/repurpose', async (req, res) => {
  try {
    const { content, sourceUrl = null, storeName = '', model = 'gpt-4o-mini' } = req.body || {};
    let text = content;
    if (!text && sourceUrl) {
      try {
        const fetchMod = (await import('node-fetch')).default;
        const r = await fetchMod(sourceUrl, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 10000 });
        const html = await r.text();
        const cheerio = require('cheerio');
        const $ = cheerio.load(html);
        $('script, style, nav, footer').remove();
        text = $('article, main, body').text().replace(/\s+/g, ' ').slice(0, 4000);
      } catch (e) { return res.status(400).json({ ok: false, error: `Could not fetch URL: ${e.message}` }); }
    }
    if (!text) return res.status(400).json({ ok: false, error: 'content or sourceUrl required' });

    const completion = await getOpenAI().chat.completions.create({
      model,
      messages: [{ role: 'user', content: withBrandVoice(`Repurpose this blog/article content into multiple formats for ${storeName || 'an e-commerce brand'}.\n\nContent:\n"${text.slice(0, 3500)}"\n\nReturn JSON:\n{\n  "instagram": { "caption": "...", "hashtags": ["10 hashtags"] },\n  "tiktok": { "hook": "...", "script": "30-sec script", "hashtags": ["8 hashtags"] },\n  "linkedin": { "post": "professional angle, 150-200 words" },\n  "pinterest": { "title": "keyword-rich ≤100 chars", "description": "≤500 chars" },\n  "twitter": { "thread": ["tweet 1", "tweet 2", "tweet 3"] },\n  "email": { "subject": "...", "preheader": "...", "summary": "2-paragraph email newsletter version with CTA" },\n  "smsOrPush": "60-char push/SMS version",\n  "keyMessages": ["3 core messages extracted from the content"]\n}`) }],
      response_format: { type: 'json_object' }, max_tokens: 2000,
    });
    const result = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    db.addHistory({ type: 'content-repurpose', sourceUrl, result });
    res.json({ ok: true, ...result });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

// ═══════════════════════════════════════════════════════════
// CATEGORY H — MULTIMODAL & QUALITY
// ═══════════════════════════════════════════════════════════

/* Feature 37: Visual Product Analyzer */
router.post('/analyze/product-image', async (req, res) => {
  try {
    const { imageUrl, model = 'gpt-4o-mini' } = req.body || {};
    if (!imageUrl) return res.status(400).json({ ok: false, error: 'imageUrl required' });

    const completion = await getOpenAI().chat.completions.create({
      model,
      messages: [{ role: 'user', content: [
        { type: 'text', text: 'Analyze this product image and extract all useful information for SEO and marketing copy. Return JSON:\n{\n  "productCategory": "...",\n  "productType": "...",\n  "colors": ["hex-ish descriptions"],\n  "colorHex": ["estimated hex codes"],\n  "materials": ["visible materials/textures"],\n  "styleKeywords": ["mood/style tags"],\n  "targetAudience": "demographic description",\n  "suggestedKeywords": ["10 SEO keywords"],\n  "productTitle": "suggested product title",\n  "shortDescription": "60-word description from visual cues only",\n  "altText": "SEO-optimized image alt text",\n  "priceTier": "budget|mid-range|premium|luxury",\n  "useCases": ["3 use cases for this product"],\n  "season": "seasonal relevance"\n}' },
        { type: 'image_url', image_url: { url: imageUrl } }
      ]}],
      response_format: { type: 'json_object' }, max_tokens: 700,
    });
    const result = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    db.addHistory({ type: 'product-image-analyze', imageUrl, result });
    res.json({ ok: true, ...result });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

/* Feature 38: Content Quality Scorer & Improver */
router.post('/analyze/content-quality', async (req, res) => {
  try {
    const { content, contentType = 'product-description', keyword = '', model = 'gpt-4o-mini' } = req.body || {};
    if (!content) return res.status(400).json({ ok: false, error: 'content required' });

    const brandVoice = db.getBrandVoice();
    const completion = await getOpenAI().chat.completions.create({
      model,
      messages: [{ role: 'user', content: `Score and improve this ${contentType} for an e-commerce store.\n\nTarget keyword: "${keyword}"\n${brandVoice ? `Brand voice: ${brandVoice.voiceSummary || ''}` : ''}\n\nContent:\n"${content.slice(0, 2000)}"\n\nReturn JSON:\n{\n  "scores": {\n    "readability": 0-100,\n    "seoOptimization": 0-100,\n    "emotionalAppeal": 0-100,\n    "brandVoiceMatch": ${brandVoice ? '0-100' : 'null'},\n    "uniqueness": 0-100,\n    "conversionPotential": 0-100,\n    "overall": 0-100\n  },\n  "grade": "A+|A|B+|B|C|D|F",\n  "readingLevel": "Elementary|Middle|High School|College",\n  "wordCount": 0,\n  "keyIssues": [{ "issue": "...", "severity": "high|medium|low", "fix": "..." }],\n  "improvedVersion": "full rewritten version incorporating all fixes",\n  "quickWins": ["3 fastest improvements to make"],\n  "strengths": ["2-3 things done well"]\n}` }],
      response_format: { type: 'json_object' }, max_tokens: 1500,
    });
    const result = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    db.addHistory({ type: 'content-quality', contentType, result: { scores: result.scores, grade: result.grade } });
    res.json({ ok: true, ...result });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

// ═══════════════════════════════════════════════════════════
// CATEGORY I — AMAZON MARKETPLACE COPY (5)
// ═══════════════════════════════════════════════════════════

/* Feature 39: Amazon Product Description */
router.post('/amazon/product-description', async (req, res) => {
  try {
    const { title, features = [], category = '', brand = '', model = 'gpt-4o-mini' } = req.body || {};
    if (!title) return res.status(400).json({ ok: false, error: 'title required' });
    const completion = await getOpenAI().chat.completions.create({
      model, messages: [{ role: 'user', content: withBrandVoice(`Write an Amazon product description for: "${title}"\nBrand: ${brand || 'Generic'}\nCategory: ${category}\nKey features: ${features.join(', ') || 'N/A'}\n\nReturn JSON: { "title": "...(<=200 chars, keyword-rich)", "bulletPoints": ["exactly 5 benefit-focused bullets, each starting with ALL CAPS keyword"], "description": "...(150-350 word HTML-friendly paragraph)", "backendKeywords": "space-separated keywords for backend search terms (<=250 bytes)" }`) }],
      response_format: { type: 'json_object' }, max_tokens: 900,
    });
    const result = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    db.addHistory({ type: 'amazon-product-description', title, result });
    res.json({ ok: true, ...result });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

/* Feature 40: Amazon Bullet Points */
router.post('/amazon/bullet-points', async (req, res) => {
  try {
    const { title, features = [], targetAudience = '', model = 'gpt-4o-mini' } = req.body || {};
    if (!title) return res.status(400).json({ ok: false, error: 'title required' });
    const completion = await getOpenAI().chat.completions.create({
      model, messages: [{ role: 'user', content: `Write 5 Amazon bullet points for: "${title}"\nTarget audience: ${targetAudience || 'general'}\nFeatures: ${features.join(', ') || 'N/A'}\n\nRules: Each starts with 2-3 ALL CAPS keyword phrase, then benefit explanation. Max 200 chars each. Focus on benefits, not just features.\n\nReturn JSON: { "bullets": ["bullet 1", "bullet 2", "bullet 3", "bullet 4", "bullet 5"], "tip": "one optimization tip" }` }],
      response_format: { type: 'json_object' }, max_tokens: 600,
    });
    const result = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    db.addHistory({ type: 'amazon-bullets', title, result });
    res.json({ ok: true, ...result });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

/* Feature 41: Amazon Product Title */
router.post('/amazon/title', async (req, res) => {
  try {
    const { productName, brand = '', material = '', size = '', color = '', model = 'gpt-4o-mini' } = req.body || {};
    if (!productName) return res.status(400).json({ ok: false, error: 'productName required' });
    const completion = await getOpenAI().chat.completions.create({
      model, messages: [{ role: 'user', content: `Create Amazon product titles for: "${productName}"\nBrand: ${brand}\nMaterial: ${material}\nSize: ${size}\nColor: ${color}\n\nReturn JSON: { "titles": ["title variant 1 (<=200 chars)", "title variant 2", "title variant 3"], "recommended": 0, "keywordsUsed": ["list of primary keywords embedded"] }` }],
      response_format: { type: 'json_object' }, max_tokens: 400,
    });
    const result = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    db.addHistory({ type: 'amazon-title', productName, result });
    res.json({ ok: true, ...result });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

/* Feature 42: Amazon Backend Keywords */
router.post('/amazon/backend-keywords', async (req, res) => {
  try {
    const { productName, category = '', competitors = '', model = 'gpt-4o-mini' } = req.body || {};
    if (!productName) return res.status(400).json({ ok: false, error: 'productName required' });
    const completion = await getOpenAI().chat.completions.create({
      model, messages: [{ role: 'user', content: `Generate Amazon backend search term keywords for: "${productName}"\nCategory: ${category}\nCompetitors/alternatives: ${competitors || 'N/A'}\n\nReturn JSON: { "backendKeywords": "space-separated string <=249 chars", "keywordGroups": { "synonyms": [], "useCases": [], "audience": [], "misspellings": [] }, "notToInclude": ["words already in title/bullets"] }` }],
      response_format: { type: 'json_object' }, max_tokens: 500,
    });
    const result = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    db.addHistory({ type: 'amazon-keywords', productName, result });
    res.json({ ok: true, ...result });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

/* Feature 43: Amazon Sponsored Brand Headline */
router.post('/amazon/brand-headline', async (req, res) => {
  try {
    const { brand, productLine = '', tagline = '', model = 'gpt-4o-mini' } = req.body || {};
    if (!brand) return res.status(400).json({ ok: false, error: 'brand required' });
    const completion = await getOpenAI().chat.completions.create({
      model, messages: [{ role: 'user', content: `Write Amazon Sponsored Brand ad headlines for brand: "${brand}"\nProduct line: ${productLine}\nCore tagline/value prop: ${tagline || 'N/A'}\n\nReturn JSON: { "headlines": ["headline 1 (<=50 chars)", "headline 2", "headline 3", "headline 4", "headline 5"], "callouts": ["short callout 1 (<=30 chars)", "callout 2", "callout 3"] }` }],
      response_format: { type: 'json_object' }, max_tokens: 400,
    });
    const result = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    db.addHistory({ type: 'amazon-brand-headline', brand, result });
    res.json({ ok: true, ...result });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

// ═══════════════════════════════════════════════════════════
// CATEGORY J — COPYWRITING FRAMEWORKS (7)
// ═══════════════════════════════════════════════════════════

/* Feature 44: AIDA Framework */
router.post('/copy/aida', async (req, res) => {
  try {
    const { product, audience = '', benefit = '', model = 'gpt-4o-mini' } = req.body || {};
    if (!product) return res.status(400).json({ ok: false, error: 'product required' });
    const completion = await getOpenAI().chat.completions.create({
      model, messages: [{ role: 'user', content: withBrandVoice(`Write AIDA framework copy for: "${product}"\nTarget audience: ${audience || 'general'}\nKey benefit: ${benefit || 'not specified'}\n\nReturn JSON: { "attention": "hook sentence (1-2 sentences that grab attention)", "interest": "build curiosity paragraph (2-3 sentences)", "desire": "create desire paragraph (2-4 sentences — benefits, social proof, transformation)", "action": "CTA (1-2 sentences with clear next step)", "combined": "full AIDA copy as one flowing piece", "headline": "punchy headline for this copy" }`) }],
      response_format: { type: 'json_object' }, max_tokens: 700,
    });
    const result = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    db.addHistory({ type: 'copy-aida', product, result });
    res.json({ ok: true, ...result });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

/* Feature 45: PAS Framework */
router.post('/copy/pas', async (req, res) => {
  try {
    const { product, painPoint = '', solution = '', model = 'gpt-4o-mini' } = req.body || {};
    if (!product) return res.status(400).json({ ok: false, error: 'product required' });
    const completion = await getOpenAI().chat.completions.create({
      model, messages: [{ role: 'user', content: withBrandVoice(`Write Pain-Agitate-Solution (PAS) copy for: "${product}"\nMain pain point: ${painPoint || 'derive from product'}\nSolution it provides: ${solution || 'derive from product'}\n\nReturn JSON: { "pain": "...(identify the pain clearly, 1-3 sentences)", "agitate": "...(twist the knife — make pain feel urgent, 2-4 sentences)", "solution": "...(present product as the relief, 2-4 sentences)", "combined": "full PAS piece as flowing copy", "headline": "headline that leads with the pain" }`) }],
      response_format: { type: 'json_object' }, max_tokens: 700,
    });
    const result = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    db.addHistory({ type: 'copy-pas', product, result });
    res.json({ ok: true, ...result });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

/* Feature 46: BAB Framework (Before-After-Bridge) */
router.post('/copy/bab', async (req, res) => {
  try {
    const { product, transformation = '', model = 'gpt-4o-mini' } = req.body || {};
    if (!product) return res.status(400).json({ ok: false, error: 'product required' });
    const completion = await getOpenAI().chat.completions.create({
      model, messages: [{ role: 'user', content: withBrandVoice(`Write Before-After-Bridge (BAB) copy for: "${product}"\nTransformation it delivers: ${transformation || 'derive from product'}\n\nReturn JSON: { "before": "...(paint the painful before state, 2-3 sentences)", "after": "...(paint the desired after state vividly, 2-3 sentences)", "bridge": "...(present the product as the bridge, 2-3 sentences)", "combined": "full BAB copy", "headline": "headline using this framework" }`) }],
      response_format: { type: 'json_object' }, max_tokens: 600,
    });
    const result = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    db.addHistory({ type: 'copy-bab', product, result });
    res.json({ ok: true, ...result });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

/* Feature 47: Feature-to-Benefit Converter */
router.post('/copy/feature-to-benefit', async (req, res) => {
  try {
    const { features = [], productName = '', audience = '', model = 'gpt-4o-mini' } = req.body || {};
    if (!features.length) return res.status(400).json({ ok: false, error: 'features array required' });
    const completion = await getOpenAI().chat.completions.create({
      model, messages: [{ role: 'user', content: `Convert product features into customer benefits for: "${productName}"\nTarget audience: ${audience || 'general consumer'}\n\nFeatures:\n${features.map((f, i) => `${i + 1}. ${f}`).join('\n')}\n\nReturn JSON: { "conversions": [{ "feature": "...", "benefit": "...", "emotionalBenefit": "...", "copySnippet": "one sentence combining both" }], "heroStatement": "single most powerful benefit statement combining top 1-2 benefits" }` }],
      response_format: { type: 'json_object' }, max_tokens: 800,
    });
    const result = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    db.addHistory({ type: 'copy-feature-to-benefit', productName, result });
    res.json({ ok: true, ...result });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

/* Feature 48: Sentence Expander */
router.post('/copy/sentence-expander', async (req, res) => {
  try {
    const { text, targetLength = 'paragraph', tone = 'professional', model = 'gpt-4o-mini' } = req.body || {};
    if (!text) return res.status(400).json({ ok: false, error: 'text required' });
    const completion = await getOpenAI().chat.completions.create({
      model, messages: [{ role: 'user', content: withBrandVoice(`Expand the following short copy into ${targetLength} form.\nTone: ${tone}\nOriginal: "${text}"\n\nReturn JSON: { "expanded": "...(full expanded version)", "wordCount": 0, "alternativeVersions": ["alt version 1 (different angle)", "alt version 2 (different angle)"] }`) }],
      response_format: { type: 'json_object' }, max_tokens: 700,
    });
    const result = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    db.addHistory({ type: 'copy-expander', text: text.slice(0, 60), result });
    res.json({ ok: true, ...result });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

/* Feature 49: Content Shortener */
router.post('/copy/content-shortener', async (req, res) => {
  try {
    const { content, targetWords = 50, model = 'gpt-4o-mini' } = req.body || {};
    if (!content) return res.status(400).json({ ok: false, error: 'content required' });
    const completion = await getOpenAI().chat.completions.create({
      model, messages: [{ role: 'user', content: `Condense the following content to approximately ${targetWords} words while preserving the key message and call to action.\n\nContent:\n"${content.slice(0, 2000)}"\n\nReturn JSON: { "condensed": "...(~${targetWords} words)", "wordCount": 0, "keyPointsKept": ["point 1", "point 2"], "whatWasCut": "brief note on what was removed" }` }],
      response_format: { type: 'json_object' }, max_tokens: 500,
    });
    const result = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    db.addHistory({ type: 'copy-shortener', result });
    res.json({ ok: true, ...result });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

/* Feature 50: Paraphrase & Tone Rewriter */
router.post('/copy/paraphrase', async (req, res) => {
  try {
    const { content, targetTone = 'professional', numberOfVersions = 3, model = 'gpt-4o-mini' } = req.body || {};
    if (!content) return res.status(400).json({ ok: false, error: 'content required' });
    const completion = await getOpenAI().chat.completions.create({
      model, messages: [{ role: 'user', content: `Rewrite/paraphrase the following content in ${numberOfVersions} different ways.\nTarget tone: ${targetTone}\n\nOriginal:\n"${content.slice(0, 1500)}"\n\nReturn JSON: { "versions": [{ "version": 1, "tone": "...", "rewrite": "..." }], "toneBreakdown": { "original": "detected tone", "target": "${targetTone}" } }` }],
      response_format: { type: 'json_object' }, max_tokens: 900,
    });
    const result = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    db.addHistory({ type: 'copy-paraphrase', result });
    res.json({ ok: true, ...result });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

// ═══════════════════════════════════════════════════════════
// CATEGORY K — BUSINESS COPY (8)
// ═══════════════════════════════════════════════════════════

/* Feature 51: Product Name Generator */
router.post('/business/product-name', async (req, res) => {
  try {
    const { description, industry = '', style = 'modern', model = 'gpt-4o-mini' } = req.body || {};
    if (!description) return res.status(400).json({ ok: false, error: 'description required' });
    const completion = await getOpenAI().chat.completions.create({
      model, messages: [{ role: 'user', content: `Generate product/brand names for: "${description}"\nIndustry: ${industry || 'general'}\nNaming style: ${style} (e.g. modern, playful, premium, minimal, descriptive)\n\nReturn JSON: { "names": [{ "name": "...", "rationale": "why this works", "availability": "likely available / check trademark", "category": "invented|descriptive|metaphorical|compound" }], "topPick": 0, "domainSuggestions": [".com domain ideas"] }` }],
      response_format: { type: 'json_object' }, max_tokens: 700,
    });
    const result = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    db.addHistory({ type: 'business-product-name', description: description.slice(0, 60), result });
    res.json({ ok: true, ...result });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

/* Feature 52: Tagline & Slogan Generator */
router.post('/business/tagline', async (req, res) => {
  try {
    const { brandName, valueProposition = '', audience = '', model = 'gpt-4o-mini' } = req.body || {};
    if (!brandName) return res.status(400).json({ ok: false, error: 'brandName required' });
    const completion = await getOpenAI().chat.completions.create({
      model, messages: [{ role: 'user', content: `Generate taglines and slogans for brand: "${brandName}"\nValue proposition: ${valueProposition || 'N/A'}\nTarget audience: ${audience || 'general'}\n\nReturn JSON: { "taglines": [{ "tagline": "...(3-8 words)", "style": "aspirational|functional|emotional|humorous|premium", "explanation": "why it works" }], "slogans": ["longer slogan 1", "longer slogan 2"], "topPick": 0 }` }],
      response_format: { type: 'json_object' }, max_tokens: 600,
    });
    const result = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    db.addHistory({ type: 'business-tagline', brandName, result });
    res.json({ ok: true, ...result });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

/* Feature 53: Press Release Generator */
router.post('/business/press-release', async (req, res) => {
  try {
    const { headline, summary, companyName = '', date = '', quote = '', model = 'gpt-4o' } = req.body || {};
    if (!headline || !summary) return res.status(400).json({ ok: false, error: 'headline and summary required' });
    const completion = await getOpenAI().chat.completions.create({
      model, messages: [{ role: 'user', content: `Write a professional press release.\nHeadline: "${headline}"\nSummary: "${summary}"\nCompany: ${companyName}\nDate: ${date || new Date().toLocaleDateString()}\nKey quote to include: "${quote || 'generate an appropriate quote'}"\n\nReturn JSON: { "pressRelease": "full formatted press release (600-800 words) with FOR IMMEDIATE RELEASE header, dateline, intro para, body, quote section, boilerplate, contact section", "subject": "email subject line for sending to media", "tweetThread": ["tweet 1 (280 chars)", "tweet 2", "tweet 3"] }` }],
      response_format: { type: 'json_object' }, max_tokens: 1200,
    });
    const result = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    db.addHistory({ type: 'business-press-release', headline, result });
    res.json({ ok: true, ...result });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

/* Feature 54: Mission & Vision Statement */
router.post('/business/mission-vision', async (req, res) => {
  try {
    const { companyName, industry = '', values = [], whatYouDo = '', model = 'gpt-4o-mini' } = req.body || {};
    if (!companyName) return res.status(400).json({ ok: false, error: 'companyName required' });
    const completion = await getOpenAI().chat.completions.create({
      model, messages: [{ role: 'user', content: `Write mission and vision statements for: "${companyName}"\nIndustry: ${industry}\nCore values: ${values.join(', ') || 'N/A'}\nWhat you do: ${whatYouDo || 'N/A'}\n\nReturn JSON: { "mission": { "statement": "...(1-2 sentences, present tense, what you do and why)", "variants": ["shorter version", "longer version"] }, "vision": { "statement": "...(1-2 sentences, future tense, where you're going)", "variants": ["shorter version", "more inspiring version"] }, "valuesStatements": [{ "value": "...", "statement": "1 sentence for this value" }] }` }],
      response_format: { type: 'json_object' }, max_tokens: 700,
    });
    const result = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    db.addHistory({ type: 'business-mission-vision', companyName, result });
    res.json({ ok: true, ...result });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

/* Feature 55: About Page Writer */
router.post('/business/about-page', async (req, res) => {
  try {
    const { companyName, story = '', mission = '', team = '', tone = 'authentic', model = 'gpt-4o' } = req.body || {};
    if (!companyName) return res.status(400).json({ ok: false, error: 'companyName required' });
    const completion = await getOpenAI().chat.completions.create({
      model, messages: [{ role: 'user', content: withBrandVoice(`Write an About Page for: "${companyName}"\nBrand story/origin: ${story || 'N/A'}\nMission: ${mission || 'N/A'}\nTeam info: ${team || 'N/A'}\nTone: ${tone}\n\nReturn JSON: { "headline": "About page headline (punchy, 5-10 words)", "subheadline": "subheadline sentence", "storySection": "origin story paragraph (100-180 words)", "missionSection": "mission paragraph (60-100 words)", "whyUsSection": "why choose us bullet list as text (3-5 points)", "ctaSection": "closing CTA paragraph (30-60 words)", "fullPage": "complete About page copy combined" }`) }],
      response_format: { type: 'json_object' }, max_tokens: 1000,
    });
    const result = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    db.addHistory({ type: 'business-about-page', companyName, result });
    res.json({ ok: true, ...result });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

/* Feature 56: Bio Generator */
router.post('/business/bio', async (req, res) => {
  try {
    const { name, role = '', achievements = [], company = '', platform = 'general', model = 'gpt-4o-mini' } = req.body || {};
    if (!name) return res.status(400).json({ ok: false, error: 'name required' });
    const completion = await getOpenAI().chat.completions.create({
      model, messages: [{ role: 'user', content: `Write professional bios for: "${name}"\nRole: ${role}\nCompany: ${company}\nKey achievements: ${achievements.join(', ') || 'N/A'}\nPlatform: ${platform} (general / LinkedIn / Twitter / speaker intro)\n\nReturn JSON: { "short": "...(1-2 sentences, <=150 chars for social)", "medium": "...(50-80 words, 3rd person)", "long": "...(150-250 words, 3rd person, full bio)", "firstPerson": "...(medium length, 1st person I-voice)", "speakerIntro": "spoken intro someone reads aloud (60-90 words)" }` }],
      response_format: { type: 'json_object' }, max_tokens: 800,
    });
    const result = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    db.addHistory({ type: 'business-bio', name, result });
    res.json({ ok: true, ...result });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

/* Feature 57: Value Proposition Builder */
router.post('/business/value-proposition', async (req, res) => {
  try {
    const { product, audience = '', competitors = '', painPoints = [], model = 'gpt-4o-mini' } = req.body || {};
    if (!product) return res.status(400).json({ ok: false, error: 'product required' });
    const completion = await getOpenAI().chat.completions.create({
      model, messages: [{ role: 'user', content: `Build a compelling value proposition for: "${product}"\nTarget audience: ${audience}\nMain competitors: ${competitors || 'N/A'}\nCustomer pain points: ${painPoints.join(', ') || 'N/A'}\n\nReturn JSON: { "headline": "main value prop headline (clear benefit in <=12 words)", "subheadline": "2-3 sentence explanation of value", "bulletPoints": ["3 key differentiating benefits"], "genieStatement": "complete as a one-sentence formula: We help [audience] to [achieve outcome] by [unique mechanism]", "positioning": "1-line positioning statement for internal use" }` }],
      response_format: { type: 'json_object' }, max_tokens: 600,
    });
    const result = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    db.addHistory({ type: 'business-value-prop', product, result });
    res.json({ ok: true, ...result });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

/* Feature 58: Return & Shipping Policy Generator */
router.post('/business/policy-copy', async (req, res) => {
  try {
    const { policyType = 'return', storeName = '', terms = {}, model = 'gpt-4o-mini' } = req.body || {};
    const completion = await getOpenAI().chat.completions.create({
      model, messages: [{ role: 'user', content: `Write a customer-friendly ${policyType} policy for store: "${storeName || 'our store'}"\nKey terms: ${JSON.stringify(terms)}\n\nMake it clear, friendly, and trustworthy (not just legal boilerplate).\n\nReturn JSON: { "headline": "policy page headline", "intro": "friendly intro paragraph (2-3 sentences)", "policyText": "full policy text with sections and clear plain English", "tldr": "3-bullet plain-English summary", "faqItems": [{ "q": "common customer question", "a": "answer" }] }` }],
      response_format: { type: 'json_object' }, max_tokens: 900,
    });
    const result = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    db.addHistory({ type: 'business-policy', policyType, result });
    res.json({ ok: true, ...result });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

// ═══════════════════════════════════════════════════════════
// CATEGORY L — EMAIL MARKETING (5)
// ═══════════════════════════════════════════════════════════

/* Feature 59: Cold Email Outreach Generator */
router.post('/email/cold-outreach', async (req, res) => {
  try {
    const { recipientRole = '', product, painPoint = '', cta = '', sequences = 3, model = 'gpt-4o-mini' } = req.body || {};
    if (!product) return res.status(400).json({ ok: false, error: 'product required' });
    const completion = await getOpenAI().chat.completions.create({
      model, messages: [{ role: 'user', content: withBrandVoice(`Write a ${sequences}-email cold outreach sequence.\nProduct/offer: "${product}"\nRecipient role: ${recipientRole}\nKey pain point to address: ${painPoint}\nCTA: ${cta || 'book a 15-min call'}\n\nReturn JSON: { "sequence": [{ "email": 1, "subjectLine": "...", "preview": "...(40 chars)", "body": "...(100-200 word email, personalizable with [FIRST_NAME] etc.)", "sendTiming": "Day X" }] }`) }],
      response_format: { type: 'json_object' }, max_tokens: 1200,
    });
    const result = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    db.addHistory({ type: 'email-cold-outreach', product, result });
    res.json({ ok: true, ...result });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

/* Feature 60: Welcome Email Series */
router.post('/email/welcome-series', async (req, res) => {
  try {
    const { brandName, product = '', audience = '', emails = 3, model = 'gpt-4o-mini' } = req.body || {};
    if (!brandName) return res.status(400).json({ ok: false, error: 'brandName required' });
    const completion = await getOpenAI().chat.completions.create({
      model, messages: [{ role: 'user', content: withBrandVoice(`Write a ${emails}-email welcome series for: "${brandName}"\nProduct/service: ${product}\nAudience: ${audience || 'new subscribers'}\n\nReturn JSON: { "series": [{ "email": 1, "purpose": "...", "subjectLine": "...", "previewText": "...", "body": "...(150-250 words)", "sendTiming": "Immediately / Day 2 / etc", "cta": "..." }] }`) }],
      response_format: { type: 'json_object' }, max_tokens: 1500,
    });
    const result = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    db.addHistory({ type: 'email-welcome-series', brandName, result });
    res.json({ ok: true, ...result });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

/* Feature 61: Post-Purchase Email */
router.post('/email/post-purchase', async (req, res) => {
  try {
    const { brandName, productPurchased = '', crossSellProducts = [], model = 'gpt-4o-mini' } = req.body || {};
    if (!brandName) return res.status(400).json({ ok: false, error: 'brandName required' });
    const completion = await getOpenAI().chat.completions.create({
      model, messages: [{ role: 'user', content: withBrandVoice(`Write a post-purchase thank you email for: "${brandName}"\nProduct purchased: ${productPurchased}\nCross-sell products: ${crossSellProducts.join(', ') || 'none'}\n\nReturn JSON: { "subjectLine": "...", "previewText": "...", "body": "...(150-200 word warm, genuine thank-you email with cross-sell if applicable)", "reviewRequest": "optional 2-sentence review request section", "socialShareAsk": "1 sentence asking to share on social" }`) }],
      response_format: { type: 'json_object' }, max_tokens: 700,
    });
    const result = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    db.addHistory({ type: 'email-post-purchase', brandName, result });
    res.json({ ok: true, ...result });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

/* Feature 62: Newsletter Generator */
router.post('/email/newsletter', async (req, res) => {
  try {
    const { brandName, topic = '', audience = '', sections = ['update', 'tip', 'cta'], model = 'gpt-4o-mini' } = req.body || {};
    if (!brandName) return res.status(400).json({ ok: false, error: 'brandName required' });
    const completion = await getOpenAI().chat.completions.create({
      model, messages: [{ role: 'user', content: withBrandVoice(`Write a newsletter for: "${brandName}"\nTopic/theme: ${topic || 'brand update / product news'}\nAudience: ${audience}\nSections to include: ${sections.join(', ')}\n\nReturn JSON: { "subjectLine": "...(curiosity-driven, <=50 chars)", "previewText": "...", "sections": [{ "type": "...", "headline": "...", "content": "...(80-150 words per section)" }], "cta": { "text": "...", "button": "...(button label)" }, "ps": "PS line (optional playful/personal note)" }`) }],
      response_format: { type: 'json_object' }, max_tokens: 1200,
    });
    const result = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    db.addHistory({ type: 'email-newsletter', brandName, topic, result });
    res.json({ ok: true, ...result });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

/* Feature 63: Win-Back Campaign */
router.post('/email/winback', async (req, res) => {
  try {
    const { brandName, inactiveDays = 90, incentive = '10% discount', model = 'gpt-4o-mini' } = req.body || {};
    if (!brandName) return res.status(400).json({ ok: false, error: 'brandName required' });
    const completion = await getOpenAI().chat.completions.create({
      model, messages: [{ role: 'user', content: withBrandVoice(`Write a 3-email win-back campaign for: "${brandName}"\nInactive for: ${inactiveDays} days\nIncentive offered: ${incentive}\n\nReturn JSON: { "emails": [{ "email": 1, "angle": "...", "subjectLine": "...", "previewText": "...", "body": "...(100-150 words)", "cta": "..." }] }`) }],
      response_format: { type: 'json_object' }, max_tokens: 1000,
    });
    const result = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    db.addHistory({ type: 'email-winback', brandName, result });
    res.json({ ok: true, ...result });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

// ═══════════════════════════════════════════════════════════
// CATEGORY M — PLATFORM ADS EXTENDED (5)
// ═══════════════════════════════════════════════════════════

/* Feature 64: LinkedIn Ad Generator */
router.post('/ads/linkedin', async (req, res) => {
  try {
    const { product, audience = '', goal = 'leads', model = 'gpt-4o-mini' } = req.body || {};
    if (!product) return res.status(400).json({ ok: false, error: 'product required' });
    const completion = await getOpenAI().chat.completions.create({
      model, messages: [{ role: 'user', content: withBrandVoice(`Write LinkedIn ad copy for: "${product}"\nTarget audience (job title/industry): ${audience}\nCampaign goal: ${goal}\n\nReturn JSON: { "singleImage": { "headline": "...(<=70 chars)", "introText": "...(<=600 chars, shown above image)", "cta": "Learn More|Sign Up|Get Quote|Download|Register|Contact Us" }, "textAd": { "headline": "...(<=25 chars)", "description": "...(<=75 chars)" }, "messageAd": { "subject": "...", "body": "...(150-250 word InMail message, personalized)", "cta": "...", "footer": "legal/unsubscribe line" }, "carouselCards": [{ "headline": "...", "description": "..." }] }`) }],
      response_format: { type: 'json_object' }, max_tokens: 800,
    });
    const result = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    db.addHistory({ type: 'ads-linkedin', product, result });
    res.json({ ok: true, ...result });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

/* Feature 65: Pinterest Ad Copy */
router.post('/ads/pinterest', async (req, res) => {
  try {
    const { product, targetAudience = '', visual = '', model = 'gpt-4o-mini' } = req.body || {};
    if (!product) return res.status(400).json({ ok: false, error: 'product required' });
    const completion = await getOpenAI().chat.completions.create({
      model, messages: [{ role: 'user', content: withBrandVoice(`Write Pinterest ad copy for: "${product}"\nTarget audience: ${targetAudience || 'women 25-44 interested in home/fashion/beauty'}\nVisual description: ${visual || 'N/A'}\n\nReturn JSON: { "pinTitle": "...(<=100 chars, keyword-rich)", "pinDescription": "...(<=500 chars, keyword-rich, includes a discovery keyword like 'ideas for...')", "boardName": "ideal board name", "hashtags": ["5-10 relevant hashtags"], "imagePrompt": "ideal image description for this pin" }`) }],
      response_format: { type: 'json_object' }, max_tokens: 500,
    });
    const result = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    db.addHistory({ type: 'ads-pinterest', product, result });
    res.json({ ok: true, ...result });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

/* Feature 66: Google Display Ad Copy */
router.post('/ads/google-display', async (req, res) => {
  try {
    const { product, landingPageUrl = '', audience = '', model = 'gpt-4o-mini' } = req.body || {};
    if (!product) return res.status(400).json({ ok: false, error: 'product required' });
    const completion = await getOpenAI().chat.completions.create({
      model, messages: [{ role: 'user', content: withBrandVoice(`Write Google Display / Responsive Display Ad copy for: "${product}"\nLanding page URL: ${landingPageUrl}\nAudience: ${audience || 'general'}\n\nReturn JSON: { "headlines": ["headline 1 (<=30 chars)", "headline 2", "headline 3", "headline 4", "headline 5"], "longHeadlines": ["long headline 1 (<=90 chars)", "long headline 2"], "descriptions": ["description 1 (<=90 chars)", "description 2", "description 3"], "callToAction": "...", "businessName": "...(brand/store name)" }`) }],
      response_format: { type: 'json_object' }, max_tokens: 500,
    });
    const result = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    db.addHistory({ type: 'ads-google-display', product, result });
    res.json({ ok: true, ...result });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

/* Feature 67: Twitter/X Ad Copy */
router.post('/ads/twitter', async (req, res) => {
  try {
    const { product, audience = '', goal = 'awareness', model = 'gpt-4o-mini' } = req.body || {};
    if (!product) return res.status(400).json({ ok: false, error: 'product required' });
    const completion = await getOpenAI().chat.completions.create({
      model, messages: [{ role: 'user', content: withBrandVoice(`Write Twitter/X ad copy for: "${product}"\nTargeting: ${audience || 'general'}\nGoal: ${goal}\n\nReturn JSON: { "promotedTweets": ["tweet 1 (<=280 chars, no hashtag spam)", "tweet 2", "tweet 3"], "imageAdCopy": { "headline": "...(<=70 chars)", "cta": "..." }, "trendingAngle": "a topical/trending angle for this product", "hooks": ["attention hook 1 (<=15 words)", "hook 2", "hook 3"] }`) }],
      response_format: { type: 'json_object' }, max_tokens: 600,
    });
    const result = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    db.addHistory({ type: 'ads-twitter', product, result });
    res.json({ ok: true, ...result });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

/* Feature 68: Spotify / Audio Ad Script */
router.post('/ads/audio-script', async (req, res) => {
  try {
    const { product, duration = 30, tone = 'upbeat', cta = '', model = 'gpt-4o-mini' } = req.body || {};
    if (!product) return res.status(400).json({ ok: false, error: 'product required' });
    const completion = await getOpenAI().chat.completions.create({
      model, messages: [{ role: 'user', content: withBrandVoice(`Write a ${duration}-second audio ad script for: "${product}"\nTone: ${tone}\nCTA: ${cta || 'visit our website'}\n\nNotes: At ~150 words/minute, ${duration}s = ~${Math.round(duration * 150 / 60)} words.\n\nReturn JSON: { "script": "full spoken script (~${Math.round(duration * 150 / 60)} words)", "wordCount": 0, "voiceDirection": "acting/tone notes for voice artist", "soundNotes": "suggested background music/sound effects", "productionNotes": "pacing, emphasis notes" }`) }],
      response_format: { type: 'json_object' }, max_tokens: 600,
    });
    const result = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    db.addHistory({ type: 'ads-audio-script', product, result });
    res.json({ ok: true, ...result });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

// ═══════════════════════════════════════════════════════════
// CATEGORY N — YOUTUBE & VIDEO COPY (5)
// ═══════════════════════════════════════════════════════════

/* Feature 69: YouTube Video Title Generator */
router.post('/youtube/title', async (req, res) => {
  try {
    const { topic, keyword = '', style = 'educational', model = 'gpt-4o-mini' } = req.body || {};
    if (!topic) return res.status(400).json({ ok: false, error: 'topic required' });
    const completion = await getOpenAI().chat.completions.create({
      model, messages: [{ role: 'user', content: `Generate YouTube video titles for: "${topic}"\nTarget keyword: ${keyword || 'N/A'}\nVideo style: ${style} (educational/review/tutorial/vlog/entertainment)\n\nReturn JSON: { "titles": [{ "title": "...", "style": "curiosity|how-to|listicle|challenge|story|question", "estimatedCTR": "high|medium" }], "topPick": 0, "avoidWords": ["click-bait phrases to avoid for this niche"] }` }],
      response_format: { type: 'json_object' }, max_tokens: 600,
    });
    const result = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    db.addHistory({ type: 'youtube-title', topic, result });
    res.json({ ok: true, ...result });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

/* Feature 70: YouTube Description Generator */
router.post('/youtube/description', async (req, res) => {
  try {
    const { videoTitle, summary = '', keywords = [], channelName = '', model = 'gpt-4o-mini' } = req.body || {};
    if (!videoTitle) return res.status(400).json({ ok: false, error: 'videoTitle required' });
    const completion = await getOpenAI().chat.completions.create({
      model, messages: [{ role: 'user', content: `Write a YouTube video description for: "${videoTitle}"\nChannel: ${channelName || 'N/A'}\nVideo summary: ${summary || 'N/A'}\nTarget keywords: ${keywords.join(', ') || 'N/A'}\n\nReturn JSON: { "description": "full YouTube description (300-500 words) with: hook paragraph, timestamps placeholder section, about section, links section, hashtags (3-5)", "firstLine": "first 100 chars shown in search (hook)", "tags": ["15-20 YouTube tags"], "chapters": [{ "time": "0:00", "title": "Chapter title" }] }` }],
      response_format: { type: 'json_object' }, max_tokens: 900,
    });
    const result = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    db.addHistory({ type: 'youtube-description', videoTitle, result });
    res.json({ ok: true, ...result });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

/* Feature 71: YouTube Long-form Script */
router.post('/youtube/script', async (req, res) => {
  try {
    const { title, keyPoints = [], duration = 10, style = 'educational', model = 'gpt-4o' } = req.body || {};
    if (!title) return res.status(400).json({ ok: false, error: 'title required' });
    const completion = await getOpenAI().chat.completions.create({
      model, messages: [{ role: 'user', content: withBrandVoice(`Write a YouTube video script for: "${title}"\nKey points to cover: ${keyPoints.join(', ') || 'derive from title'}\nTarget duration: ${duration} minutes (~${duration * 130} words)\nStyle: ${style}\n\nReturn JSON: { "hook": "opening hook (first 30 seconds, very compelling)", "intro": "brief intro (60 seconds)", "sections": [{ "title": "section name", "content": "section script", "duration": "approx X mins" }], "outro": "outro and CTA (30-60 seconds)", "bRollNotes": "visual/B-roll suggestions per section", "fullScript": "complete script" }`) }],
      response_format: { type: 'json_object' }, max_tokens: 2000,
    });
    const result = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    db.addHistory({ type: 'youtube-script', title, result });
    res.json({ ok: true, ...result });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

/* Feature 72: YouTube Shorts / Reels Script */
router.post('/youtube/shorts-script', async (req, res) => {
  try {
    const { topic, hook = '', platform = 'YouTube Shorts', model = 'gpt-4o-mini' } = req.body || {};
    if (!topic) return res.status(400).json({ ok: false, error: 'topic required' });
    const completion = await getOpenAI().chat.completions.create({
      model, messages: [{ role: 'user', content: `Write a ${platform} short-form script (~60 seconds, ~130 words) for: "${topic}"\nHook idea: ${hook || 'generate a compelling hook'}\n\nReturn JSON: { "hook": "first 3 seconds — must grab attention immediately", "phases": [{ "phase": "Hook|Context|Value|CTA", "script": "...", "seconds": 0 }], "fullScript": "complete script", "visualNotes": "what to show on screen during each phase", "textOverlays": ["key text to overlay on screen"], "cta": "end call to action" }` }],
      response_format: { type: 'json_object' }, max_tokens: 700,
    });
    const result = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    db.addHistory({ type: 'youtube-shorts-script', topic, result });
    res.json({ ok: true, ...result });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

/* Feature 73: Video Hook Generator */
router.post('/youtube/video-hooks', async (req, res) => {
  try {
    const { topic, audience = '', videoType = 'product review', model = 'gpt-4o-mini' } = req.body || {};
    if (!topic) return res.status(400).json({ ok: false, error: 'topic required' });
    const completion = await getOpenAI().chat.completions.create({
      model, messages: [{ role: 'user', content: `Generate video hooks (first 5-10 seconds) for topic: "${topic}"\nAudience: ${audience || 'general'}\nVideo type: ${videoType}\n\nReturn JSON: { "hooks": [{ "hook": "...(1-2 sentences max, spoken)", "type": "question|statistic|bold-claim|story|controversy|curiosity-gap", "whyItWorks": "brief explanation" }], "thumbnailText": ["3-5 words for thumbnail overlay options"] }` }],
      response_format: { type: 'json_object' }, max_tokens: 600,
    });
    const result = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    db.addHistory({ type: 'youtube-hooks', topic, result });
    res.json({ ok: true, ...result });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

// ═══════════════════════════════════════════════════════════
// CATEGORY O — LANDING PAGES & CONVERSION COPY (5)
// ═══════════════════════════════════════════════════════════

/* Feature 74: Landing Page Headline Generator */
router.post('/landing/headline', async (req, res) => {
  try {
    const { product, audience = '', benefit = '', model = 'gpt-4o-mini' } = req.body || {};
    if (!product) return res.status(400).json({ ok: false, error: 'product required' });
    const completion = await getOpenAI().chat.completions.create({
      model, messages: [{ role: 'user', content: withBrandVoice(`Generate landing page headlines for: "${product}"\nTarget audience: ${audience}\nKey benefit: ${benefit || 'derive from product'}\n\nReturn JSON: { "headlines": [{ "headline": "...", "subheadline": "...(supporting sentence)", "type": "benefit|problem-solution|how-to|question|number", "framework": "AIDA|PAS|BAB" }], "abTestPairs": [{ "control": "...", "variant": "..." }] }`) }],
      response_format: { type: 'json_object' }, max_tokens: 700,
    });
    const result = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    db.addHistory({ type: 'landing-headline', product, result });
    res.json({ ok: true, ...result });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

/* Feature 75: Full Landing Page Copy */
router.post('/landing/full-page', async (req, res) => {
  try {
    const { product, audience = '', offer = '', testimonials = [], model = 'gpt-4o' } = req.body || {};
    if (!product) return res.status(400).json({ ok: false, error: 'product required' });
    const completion = await getOpenAI().chat.completions.create({
      model, messages: [{ role: 'user', content: withBrandVoice(`Write a complete landing page copy for: "${product}"\nTarget audience: ${audience}\nSpecial offer/CTA: ${offer || 'free trial / buy now'}\nTestimonials to weave in: ${testimonials.join('; ') || 'generate placeholder testimonials'}\n\nReturn JSON: { "sections": [{ "section": "HERO|PROBLEM|SOLUTION|FEATURES|SOCIAL_PROOF|OFFER|FAQ|CTA", "headline": "...", "copy": "...(full copy for section)" }], "primaryCTA": { "button": "...", "urgencyLine": "...(scarcity/urgency element)" }, "seoTitle": "...", "metaDescription": "..." }`) }],
      response_format: { type: 'json_object' }, max_tokens: 2500,
    });
    const result = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    db.addHistory({ type: 'landing-full-page', product, result });
    res.json({ ok: true, ...result });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

/* Feature 76: CTA Button Copy */
router.post('/landing/cta-copy', async (req, res) => {
  try {
    const { context, goal = 'signup', tone = 'direct', model = 'gpt-4o-mini' } = req.body || {};
    if (!context) return res.status(400).json({ ok: false, error: 'context required' });
    const completion = await getOpenAI().chat.completions.create({
      model, messages: [{ role: 'user', content: `Generate CTA button copy for context: "${context}"\nGoal: ${goal}\nTone: ${tone}\n\nReturn JSON: { "buttons": [{ "text": "...(2-5 words max)", "style": "action|benefit|curiosity|urgency", "subtext": "optional supporting text below button" }], "urgencyLines": ["urgency/scarcity line 1", "line 2"], "guarantee": "optional trust/guarantee micro-copy" }` }],
      response_format: { type: 'json_object' }, max_tokens: 500,
    });
    const result = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    db.addHistory({ type: 'landing-cta', context: context.slice(0, 60), result });
    res.json({ ok: true, ...result });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

/* Feature 77: Pricing Page Copy */
router.post('/landing/pricing-page', async (req, res) => {
  try {
    const { productName, tiers = [], model = 'gpt-4o-mini' } = req.body || {};
    if (!productName) return res.status(400).json({ ok: false, error: 'productName required' });
    const completion = await getOpenAI().chat.completions.create({
      model, messages: [{ role: 'user', content: `Write pricing page copy for: "${productName}"\nTiers: ${JSON.stringify(tiers) || '[{ "name": "Basic", "price": "$29" }, { "name": "Pro", "price": "$79" }, { "name": "Enterprise", "price": "Custom" }]'}\n\nReturn JSON: { "pageHeadline": "...", "pageSubheadline": "...", "tiers": [{ "tierName": "...", "tagline": "...(who this is for)", "cta": "...", "mostPopularBadge": true|false }], "faq": [{ "q": "common pricing question", "a": "answer" }], "trustStatement": "money-back guarantee / no contract / cancel anytime copy" }` }],
      response_format: { type: 'json_object' }, max_tokens: 800,
    });
    const result = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    db.addHistory({ type: 'landing-pricing', productName, result });
    res.json({ ok: true, ...result });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

/* Feature 78: A/B Headline Test Variants */
router.post('/landing/ab-headlines', async (req, res) => {
  try {
    const { originalHeadline, product = '', audience = '', model = 'gpt-4o-mini' } = req.body || {};
    if (!originalHeadline) return res.status(400).json({ ok: false, error: 'originalHeadline required' });
    const completion = await getOpenAI().chat.completions.create({
      model, messages: [{ role: 'user', content: `Generate A/B test variants for headline: "${originalHeadline}"\nProduct context: ${product}\nAudience: ${audience || 'general'}\n\nReturn JSON: { "original": { "headline": "${originalHeadline}", "type": "..." }, "variants": [{ "headline": "...", "changeType": "benefit-focused|shorter|question|number|emotional", "hypothesis": "why this might outperform", "subheadline": "..." }], "winnerPrediction": { "predicted": 0, "reasoning": "..." }, "testingTip": "how to properly run this A/B test" }` }],
      response_format: { type: 'json_object' }, max_tokens: 700,
    });
    const result = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    db.addHistory({ type: 'landing-ab-headline', originalHeadline, result });
    res.json({ ok: true, ...result });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

// ═══════════════════════════════════════════════════════════
// CATEGORY P — CONTENT UTILITIES (5)
// ═══════════════════════════════════════════════════════════

/* Feature 79: Keyword Extractor */
router.post('/util/keyword-extractor', async (req, res) => {
  try {
    const { content, maxKeywords = 20, model = 'gpt-4o-mini' } = req.body || {};
    if (!content) return res.status(400).json({ ok: false, error: 'content required' });
    const completion = await getOpenAI().chat.completions.create({
      model, messages: [{ role: 'user', content: `Extract top keywords and phrases from this content.\n\nContent:\n"${content.slice(0, 3000)}"\n\nReturn JSON: { "primaryKeywords": ["top ${Math.min(maxKeywords, 10)} single-word keywords by importance"], "longTailPhrases": ["up to 10 long-tail keyword phrases"], "topicClusters": [{ "cluster": "...", "keywords": [] }], "missingKeywords": ["important related keywords NOT in the content"], "densities": [{ "keyword": "...", "count": 0, "density": "0.0%" }] }` }],
      response_format: { type: 'json_object' }, max_tokens: 700,
    });
    const result = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    db.addHistory({ type: 'util-keyword-extractor', result });
    res.json({ ok: true, ...result });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

/* Feature 80: Article Summarizer */
router.post('/util/article-summarizer', async (req, res) => {
  try {
    const { content, url = '', summaryLength = 'medium', model = 'gpt-4o-mini' } = req.body || {};
    if (!content && !url) return res.status(400).json({ ok: false, error: 'content or url required' });
    const completion = await getOpenAI().chat.completions.create({
      model, messages: [{ role: 'user', content: `Summarize the following content.\nTarget summary length: ${summaryLength} (short=50-80 words / medium=150-200 words / long=300-400 words)\n\nContent:\n"${(content || url).slice(0, 4000)}"\n\nReturn JSON: { "summary": "...(${summaryLength} summary)", "tldr": "1-sentence TL;DR", "keyPoints": ["up to 7 bullet point takeaways"], "headline": "article title if not obvious", "tags": ["5 topic tags"] }` }],
      response_format: { type: 'json_object' }, max_tokens: 700,
    });
    const result = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    db.addHistory({ type: 'util-summarizer', result });
    res.json({ ok: true, ...result });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

/* Feature 81: Content Repurposer */
router.post('/util/content-repurposer', async (req, res) => {
  try {
    const { content, sourceType = 'blog-post', targetFormats = ['twitter-thread', 'linkedin-post', 'instagram-caption'], model = 'gpt-4o-mini' } = req.body || {};
    if (!content) return res.status(400).json({ ok: false, error: 'content required' });
    const completion = await getOpenAI().chat.completions.create({
      model, messages: [{ role: 'user', content: withBrandVoice(`Repurpose this ${sourceType} into multiple formats.\nSource content:\n"${content.slice(0, 2000)}"\n\nFormats needed: ${targetFormats.join(', ')}\n\nReturn JSON: { "repurposed": [{ "format": "...", "content": "...", "notes": "how to use this" }], "keyMessages": ["3-5 core messages extracted from source"] }`) }],
      response_format: { type: 'json_object' }, max_tokens: 1500,
    });
    const result = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    db.addHistory({ type: 'util-repurposer', sourceType, result });
    res.json({ ok: true, ...result });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

/* Feature 82: Listicle Ideas */
router.post('/util/listicle-ideas', async (req, res) => {
  try {
    const { topic, audience = '', count = 10, model = 'gpt-4o-mini' } = req.body || {};
    if (!topic) return res.status(400).json({ ok: false, error: 'topic required' });
    const completion = await getOpenAI().chat.completions.create({
      model, messages: [{ role: 'user', content: `Generate ${count} listicle article ideas for: "${topic}"\nTarget audience: ${audience || 'general'}\n\nReturn JSON: { "ideas": [{ "title": "...(The X Best/Ways/Tips...)", "angle": "unique angle", "estimatedEngagement": "high|medium", "cta": "what to include at end" }] }` }],
      response_format: { type: 'json_object' }, max_tokens: 700,
    });
    const result = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    db.addHistory({ type: 'util-listicle', topic, result });
    res.json({ ok: true, ...result });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

/* Feature 83: Content Translator */
router.post('/util/translate', async (req, res) => {
  try {
    const { content, targetLanguage, adaptCulture = true, contentType = 'product-copy', model = 'gpt-4o' } = req.body || {};
    if (!content || !targetLanguage) return res.status(400).json({ ok: false, error: 'content and targetLanguage required' });
    const completion = await getOpenAI().chat.completions.create({
      model, messages: [{ role: 'user', content: `Translate this ${contentType} to ${targetLanguage}.\n${adaptCulture ? 'Adapt idioms, references, and cultural nuances for native speakers — not just literal translation.' : 'Literal translation only.'}\n\nOriginal content:\n"${content.slice(0, 2000)}"\n\nReturn JSON: { "translated": "...(full translated content)", "language": "${targetLanguage}", "adaptations": ["cultural adaptations made if any"], "backTranslation": "...(translated back to English for QA)", "qualityNotes": "any translation challenges or recommendations" }` }],
      response_format: { type: 'json_object' }, max_tokens: 1000,
    });
    const result = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    db.addHistory({ type: 'util-translate', targetLanguage, result });
    res.json({ ok: true, ...result });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

// ═══════════════════════════════════════════════════════════
// CATEGORY Q — E-COMMERCE SPECIFIC COPY (5)
// ═══════════════════════════════════════════════════════════

/* Feature 84: Flash Sale / Urgency Copy */
router.post('/ecom/flash-sale', async (req, res) => {
  try {
    const { product, discount = '20% off', deadline = '24 hours', model = 'gpt-4o-mini' } = req.body || {};
    if (!product) return res.status(400).json({ ok: false, error: 'product required' });
    const completion = await getOpenAI().chat.completions.create({
      model, messages: [{ role: 'user', content: withBrandVoice(`Write flash sale / urgency copy for: "${product}"\nDiscount: ${discount}\nDeadline: ${deadline}\n\nReturn JSON: { "bannerHeadline": "...(short punchy banner text, caps ok)", "emailSubject": "...", "popupHeadline": "...", "popupBody": "...(2-3 sentences)", "smsText": "...(<=160 chars)", "countdown": "copy around the countdown timer", "socialPost": "...(organic post announcing the sale)", "pdpBadge": "...(product page badge text like FLASH SALE - 24HRS ONLY)" }`) }],
      response_format: { type: 'json_object' }, max_tokens: 700,
    });
    const result = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    db.addHistory({ type: 'ecom-flash-sale', product, result });
    res.json({ ok: true, ...result });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

/* Feature 85: Bundle & Kit Description */
router.post('/ecom/bundle-description', async (req, res) => {
  try {
    const { bundleName, products = [], saving = '', audience = '', model = 'gpt-4o-mini' } = req.body || {};
    if (!bundleName) return res.status(400).json({ ok: false, error: 'bundleName required' });
    const completion = await getOpenAI().chat.completions.create({
      model, messages: [{ role: 'user', content: withBrandVoice(`Write product bundle copy for: "${bundleName}"\nIncluded products: ${products.join(', ') || 'N/A'}\nCustomer saving: ${saving || 'N/A'}\nTarget audience: ${audience}\n\nReturn JSON: { "headline": "...", "description": "...(120-200 word bundle description emphasizing value and synergy)", "bulletPoints": ["4-5 bundle benefits"], "valueStack": "total value listed vs bundle price copy", "giftingAngle": "how to position this as a gift" }`) }],
      response_format: { type: 'json_object' }, max_tokens: 700,
    });
    const result = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    db.addHistory({ type: 'ecom-bundle', bundleName, result });
    res.json({ ok: true, ...result });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

/* Feature 86: Loyalty Program Copy */
router.post('/ecom/loyalty-program', async (req, res) => {
  try {
    const { brandName, programName = '', tiers = [], model = 'gpt-4o-mini' } = req.body || {};
    if (!brandName) return res.status(400).json({ ok: false, error: 'brandName required' });
    const completion = await getOpenAI().chat.completions.create({
      model, messages: [{ role: 'user', content: withBrandVoice(`Write loyalty program copy for: "${brandName}"\nProgram name: ${programName || brandName + ' Rewards'}\nTiers: ${tiers.join(', ') || 'Bronze, Silver, Gold'}\n\nReturn JSON: { "programName": "...", "tagline": "...(short, memorable)", "headline": "...", "howItWorks": "3-step explanation", "benefits": [{ "tier": "...", "perks": "..." }], "joinCTA": "...", "emailAnnouncementSubject": "...", "socialPost": "...(announce program launch)" }`) }],
      response_format: { type: 'json_object' }, max_tokens: 700,
    });
    const result = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    db.addHistory({ type: 'ecom-loyalty', brandName, result });
    res.json({ ok: true, ...result });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

/* Feature 87: Seasonal Sale Campaign Copy */
router.post('/ecom/seasonal-sale', async (req, res) => {
  try {
    const { season = 'Black Friday', brandName, discount = '30% off everything', model = 'gpt-4o-mini' } = req.body || {};
    if (!brandName) return res.status(400).json({ ok: false, error: 'brandName required' });
    const completion = await getOpenAI().chat.completions.create({
      model, messages: [{ role: 'user', content: withBrandVoice(`Write a complete ${season} sale campaign for: "${brandName}"\nDiscount: ${discount}\n\nReturn JSON: { "heroHeadline": "...", "subheadline": "...", "emailSubjects": ["subject line 1 (teaser)", "subject line 2 (launch day)", "subject line 3 (last chance)"], "socialPosts": [{ "platform": "Instagram", "copy": "..." }, { "platform": "Facebook", "copy": "..." }], "smsMessages": ["SMS 1 (announcement)", "SMS 2 (reminder)"], "bannerCopy": "short banner ad text", "pdpBadge": "product page sale badge" }`) }],
      response_format: { type: 'json_object' }, max_tokens: 900,
    });
    const result = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    db.addHistory({ type: 'ecom-seasonal', season, brandName, result });
    res.json({ ok: true, ...result });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

/* Feature 88: Gift Guide Copy */
router.post('/ecom/gift-guide', async (req, res) => {
  try {
    const { theme = 'gifts for her', products = [], priceRange = '', model = 'gpt-4o-mini' } = req.body || {};
    const completion = await getOpenAI().chat.completions.create({
      model, messages: [{ role: 'user', content: withBrandVoice(`Write a gift guide for: "${theme}"\nProducts to feature: ${products.join(', ') || 'our store bestsellers'}\nPrice range: ${priceRange || 'all budgets'}\n\nReturn JSON: { "guideTitle": "...", "intro": "...(60-100 word intro)", "sections": [{ "sectionTitle": "...(e.g. Under $50)", "picks": [{ "product": "...", "copySnippet": "1-2 sentences why it makes a great gift" }] }], "seoMetaTitle": "...", "seoMetaDescription": "..." }`) }],
      response_format: { type: 'json_object' }, max_tokens: 900,
    });
    const result = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    db.addHistory({ type: 'ecom-gift-guide', theme, result });
    res.json({ ok: true, ...result });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

// ═══════════════════════════════════════════════════════════
// CATEGORY R — CREATIVE SCORING EXTENDED (2)
// ═══════════════════════════════════════════════════════════

/* Feature 89: Ad Creative Pre-Launch Scorer */
router.post('/analyze/ad-creative-score', async (req, res) => {
  try {
    const { headline, description = '', imageDescription = '', platform = 'Facebook', model = 'gpt-4o-mini' } = req.body || {};
    if (!headline) return res.status(400).json({ ok: false, error: 'headline required' });
    const completion = await getOpenAI().chat.completions.create({
      model, messages: [{ role: 'user', content: `Score this ad creative before launch on ${platform}.\nHeadline: "${headline}"\nDescription: "${description}"\nImage/visual description: "${imageDescription}"\n\nReturn JSON: { "overallScore": 0-100, "grade": "A|B|C|D|F", "dimensions": { "clarity": 0-100, "relevance": 0-100, "emotionalAppeal": 0-100, "benefitFocus": 0-100, "cta": 0-100, "compliance": 0-100 }, "estimatedCTR": "low|medium|high", "topIssues": ["issue 1", "issue 2"], "improvements": ["specific improvement 1", "specific improvement 2"], "improvedHeadline": "...", "improvedDescription": "..." }` }],
      response_format: { type: 'json_object' }, max_tokens: 700,
    });
    const result = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    db.addHistory({ type: 'analyze-ad-score', headline, result });
    res.json({ ok: true, ...result });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

/* Feature 90: Tone of Voice Analyzer */
router.post('/analyze/tone-of-voice', async (req, res) => {
  try {
    const { content, targetTone = '', model = 'gpt-4o-mini' } = req.body || {};
    if (!content) return res.status(400).json({ ok: false, error: 'content required' });
    const completion = await getOpenAI().chat.completions.create({
      model, messages: [{ role: 'user', content: `Analyze the tone of voice in this content.\nContent: "${content.slice(0, 2000)}"\nTarget tone (if applicable): ${targetTone || 'N/A'}\n\nReturn JSON: { "detectedTone": "...(primary tone descriptors)", "toneProfile": { "formal": 0-100, "friendly": 0-100, "authoritative": 0-100, "playful": 0-100, "urgent": 0-100, "empathetic": 0-100 }, "sentimentScore": -100 to 100, "readingAge": 0, "brandPersonality": ["3 brand personality words matching this tone"], "toneGapAnalysis": "${targetTone ? 'gap analysis vs target tone' : 'no target provided'}", "rewriteSuggestion": "rewrite 1-2 weak sentences to better match target tone" }` }],
      response_format: { type: 'json_object' }, max_tokens: 600,
    });
    const result = JSON.parse(completion.choices[0].message.content);
    if (req.deductCredits) req.deductCredits({ model });
    db.addHistory({ type: 'analyze-tone', result });
    res.json({ ok: true, ...result });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

// ═══════════════════════════════════════════════════════════
// UTILITY ROUTES
// ═══════════════════════════════════════════════════════════

router.get('/history', (req, res) => {
  const { type, limit = 50 } = req.query;
  res.json({ ok: true, history: db.listHistory(type, parseInt(limit)) });
});
router.delete('/history/:id', (req, res) => {
  db.deleteHistory(req.params.id);
  res.json({ ok: true });
});
router.post('/saved', (req, res) => {
  const entry = db.saveOutput(req.body || {});
  res.json({ ok: true, entry });
});
router.get('/saved', (req, res) => {
  res.json({ ok: true, saved: db.listSaved() });
});
router.delete('/saved/:id', (req, res) => {
  db.deleteSaved(req.params.id);
  res.json({ ok: true });
});

router.get('/health', (req, res) => {
  const bv = db.getBrandVoice();
  res.json({ ok: true, tool: 'ai-content-image-gen', brandVoiceActive: !!bv, ts: new Date().toISOString() });
});

module.exports = router;

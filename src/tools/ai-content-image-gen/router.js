/**
 * AI Content & Image Gen — router.js
 * 38 endpoints across 8 categories:
 *   A) Product Content (8)
 *   B) Ad & Marketing Copy (6)
 *   C) Social Media (4)
 *   D) Product Images (7)
 *   E) Brand Voice & Style (4)
 *   F) Video & Motion (4)
 *   G) Blog & Long-form (3)
 *   H) Multimodal & Quality (2)
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

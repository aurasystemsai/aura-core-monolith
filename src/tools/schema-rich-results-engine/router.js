const express = require('express');
const { getShopContext } = require('../../core/shopContext');
const { gql, loadStoreEntities } = require('../../core/seoStoreData');
const { getOpenAIClient } = require('../../core/openaiClient');
const sb = require('../../core/schemaBuilder');

const router = express.Router();

const PRODUCT_Q = `query($id:ID!){ shop{ name currencyCode primaryDomain{url} } product(id:$id){
  title handle description vendor featuredImage{url} images(first:5){nodes{url}}
  variants(first:1){nodes{sku barcode price availableForSale}} } }`;
const ARTICLE_Q = `query($id:ID!){ shop{ name primaryDomain{url} } article(id:$id){
  title handle body summary publishedAt updatedAt author{name} image{url} blog{handle} } }`;
const SHOP_Q = `{ shop{ name primaryDomain{url} } }`;

const GID = { Product: /^gid:\/\/shopify\/Product\/\d+$/, Article: /^gid:\/\/shopify\/Article\/\d+$/ };

function withShop(handler) {
  return async (req, res) => {
    const ctx = getShopContext(req);
    if (ctx.error) return res.status(ctx.status).json({ ok: false, error: ctx.error });
    try {
      await handler(req, res, ctx);
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  };
}

const bad = (res, msg) => res.status(400).json({ ok: false, error: msg });

router.get('/items', withShop(async (req, res, { shop, token }) => {
  const kind = req.query.kind === 'article' ? 'articles' : 'products';
  const { entities } = await loadStoreEntities(shop, token, { max: 100, types: [kind] });
  res.json({ ok: true, items: entities.map(e => ({ id: e.id, title: e.title, url: e.url })) });
}));

router.post('/generate', withShop(async (req, res, { shop, token }) => {
  const { type, id, items, questions, sameAs, logo } = req.body || {};
  let schema;

  if (type === 'Product') {
    if (!GID.Product.test(String(id))) return bad(res, 'Choose a product.');
    const d = await gql(shop, token, PRODUCT_Q, { id });
    if (!d.product) return res.status(404).json({ ok: false, error: 'Product not found' });
    const base = (d.shop.primaryDomain.url || `https://${shop}`).replace(/\/$/, '');
    schema = sb.buildProductSchema(d.product, { currency: d.shop.currencyCode, url: `${base}/products/${d.product.handle}` });
  } else if (type === 'Article') {
    if (!GID.Article.test(String(id))) return bad(res, 'Choose an article.');
    const d = await gql(shop, token, ARTICLE_Q, { id });
    if (!d.article) return res.status(404).json({ ok: false, error: 'Article not found' });
    const base = (d.shop.primaryDomain.url || `https://${shop}`).replace(/\/$/, '');
    schema = sb.buildArticleSchema(d.article, { url: `${base}/blogs/${d.article.blog && d.article.blog.handle || 'news'}/${d.article.handle}`, publisherName: d.shop.name, publisherLogo: logo });
  } else if (type === 'Organization') {
    const d = await gql(shop, token, SHOP_Q);
    const sameAsList = Array.isArray(sameAs) ? sameAs.filter(u => /^https?:\/\//i.test(String(u))).slice(0, 10) : [];
    schema = sb.buildOrganizationSchema({ name: d.shop.name, url: d.shop.primaryDomain.url, logo: /^https?:\/\//i.test(String(logo || '')) ? logo : undefined, sameAs: sameAsList });
  } else if (type === 'BreadcrumbList') {
    if (!Array.isArray(items) || !items.length || items.length > 10 || items.some(i => !i || !i.name)) return bad(res, 'Provide 1-10 breadcrumb items with a name.');
    schema = sb.buildBreadcrumbSchema(items.map(i => ({ name: String(i.name).slice(0, 100), url: i.url })));
  } else if (type === 'FAQPage') {
    if (!Array.isArray(questions) || !questions.length || questions.length > 15 || questions.some(q => !q || !String(q.question || '').trim() || !String(q.answer || '').trim())) {
      return bad(res, 'Provide 1-15 questions, each with an answer.');
    }
    schema = sb.buildFaqSchema(questions);
  } else {
    return bad(res, 'type must be Product, Article, Organization, BreadcrumbList or FAQPage.');
  }

  if (req.deductCredits) await req.deductCredits({ action: 'schema-gen' });
  res.json({ ok: true, schema, snippet: sb.toScriptTag(schema), validation: sb.validateSchema(schema) });
}));

router.post('/validate', withShop(async (req, res) => {
  const { schema } = req.body || {};
  if (!schema || (typeof schema === 'string' && schema.length > 100000)) return bad(res, 'Paste JSON-LD to validate (max 100 KB).');
  res.json({ ok: true, validation: sb.validateSchema(schema) });
}));

// AI drafts FAQ answers from the real product description; the merchant edits before generating schema.
router.post('/ai/faq', withShop(async (req, res, { shop, token }) => {
  const { id } = req.body || {};
  if (!GID.Product.test(String(id))) return bad(res, 'Choose a product.');
  const openai = getOpenAIClient();
  if (!openai) return res.status(503).json({ ok: false, error: 'AI is not configured on the server.' });
  const d = await gql(shop, token, PRODUCT_Q, { id });
  if (!d.product) return res.status(404).json({ ok: false, error: 'Product not found' });
  const description = String(d.product.description || '').slice(0, 1500);
  if (description.length < 40) return bad(res, 'This product needs a longer description before FAQs can be written from it.');

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.4,
    max_tokens: 700,
    response_format: { type: 'json_object' },
    messages: [{
      role: 'user',
      content: `Write 4 customer FAQs for this product. Only use facts stated below; do not invent specifications, prices or policies. Return JSON {"questions":[{"question":"","answer":""}]}.\nProduct: ${d.product.title}\nDescription: ${description}`,
    }],
  });
  let questions = [];
  try { questions = JSON.parse(completion.choices[0].message.content).questions || []; } catch { /* handled below */ }
  questions = questions.filter(q => q && q.question && q.answer).slice(0, 6);
  if (!questions.length) return res.status(502).json({ ok: false, error: 'The AI did not return usable FAQs. Try again.' });
  if (req.deductCredits) await req.deductCredits({ model: 'gpt-4o-mini', action: 'schema-gen' });
  res.json({ ok: true, questions });
}));

module.exports = router;

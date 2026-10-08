// AI Content & Image Gen: generates a product image with OpenAI and, only when the merchant confirms, attaches it
// to the chosen product. Generated results are previews until applied. Prompts are built from the real product.
const express = require('express');
const { getShopContext } = require('../../core/shopContext');
const { getOpenAIClient } = require('../../core/openaiClient');
const { loadStoreEntities, gql } = require('../../core/seoStoreData');

const router = express.Router();
const crypto = require('crypto');
const IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1-mini';
// Generated images wait here (per shop, 15 minutes) until the merchant adds one to a product.
const pending = new Map();
function remember(shop, b64) {
  const now = Date.now();
  for (const [k, v] of pending) if (now - v.at > 900000) pending.delete(k);
  const id = crypto.randomUUID();
  pending.set(id, { shop, b64, at: now });
  return id;
}
const STYLES = { studio: 'clean white studio photo, soft light', lifestyle: 'natural lifestyle photo in a real home setting', flatlay: 'top-down flat lay on a neutral surface', minimal: 'minimalist product shot, plain pastel background' };

function withShop(handler) {
  return async (req, res) => {
    const ctx = getShopContext(req);
    if (ctx.error) return res.status(ctx.status).json({ ok: false, error: ctx.error });
    try { await handler(req, res, ctx); } catch (err) { res.status(err.status || 500).json({ ok: false, error: err.message }); }
  };
}
const clean = (v, n) => String(v == null ? '' : v).trim().slice(0, n);

router.get('/status', withShop(async (req, res) => res.json({ ok: true, ai: !!getOpenAIClient(), styles: Object.keys(STYLES), creditsPerImage: 10 })));

router.get('/products', withShop(async (req, res, { shop, token }) => {
  const { entities } = await loadStoreEntities(shop, token, { max: 100, types: ['products'] });
  res.json({ ok: true, products: entities.map((e) => ({ id: e.id, title: e.title, images: (e.images || []).length })) });
}));

router.post('/generate', withShop(async (req, res, { shop, token }) => {
  const openai = getOpenAIClient();
  if (!openai) return res.status(503).json({ ok: false, error: 'AI is not configured on the server.' });
  const b = req.body || {};
  const style = STYLES[b.style] ? b.style : 'studio';
  let subject = clean(b.subject, 200);
  if (b.productId) {
    const { entities } = await loadStoreEntities(shop, token, { max: 100, types: ['products'] });
    const p = entities.find((e) => e.id === b.productId);
    if (!p) return res.status(404).json({ ok: false, error: 'Product not found in your store.' });
    subject = subject || `${p.title}. ${p.text.slice(0, 200)}`;
  }
  if (!subject) return res.status(400).json({ ok: false, error: 'Choose a product or describe what to picture.' });
  const extra = clean(b.details, 200);
  const prompt = `${subject}. ${STYLES[style]}. ${extra} No text, no logos, no watermarks.`.slice(0, 900);
  const r = await openai.images.generate({ model: IMAGE_MODEL, prompt, n: 1, size: '1024x1024' });
  const b64 = r && r.data && r.data[0] && r.data[0].b64_json;
  if (!b64) return res.status(502).json({ ok: false, error: 'The image service returned no image. Try again.' });
  if (req.deductCredits) await req.deductCredits({ model: 'gpt-4o-mini', action: 'image-gen' });
  res.json({ ok: true, imageId: remember(shop, b64), preview: `data:image/png;base64,${b64}`, prompt, style });
}));

// Upload the pending image to Shopify and attach it to the product as new media (existing images are kept).
router.post('/apply', withShop(async (req, res, { shop, token }) => {
  const b = req.body || {};
  const img = pending.get(clean(b.imageId, 60));
  if (!img || img.shop !== shop) return res.status(404).json({ ok: false, error: 'That image has expired. Generate it again.' });
  if (!/^gid:\/\/shopify\/Product\/\d+$/.test(clean(b.productId, 80))) return res.status(400).json({ ok: false, error: 'A valid product is required.' });
  const bytes = Buffer.from(img.b64, 'base64');
  const staged = await gql(shop, token,
    'mutation($input: [StagedUploadInput!]!) { stagedUploadsCreate(input: $input) { stagedTargets { url resourceUrl parameters { name value } } userErrors { message } } }',
    { input: [{ resource: 'IMAGE', filename: 'aura-generated.png', mimeType: 'image/png', httpMethod: 'POST', fileSize: String(bytes.length) }] });
  const target = staged.stagedUploadsCreate && staged.stagedUploadsCreate.stagedTargets && staged.stagedUploadsCreate.stagedTargets[0];
  if (!target) return res.status(502).json({ ok: false, error: 'Shopify would not accept the upload.' });
  const form = new FormData();
  target.parameters.forEach((p) => form.append(p.name, p.value));
  form.append('file', new Blob([bytes], { type: 'image/png' }), 'aura-generated.png');
  const up = await fetch(target.url, { method: 'POST', body: form });
  if (!up.ok) return res.status(502).json({ ok: false, error: `Upload to Shopify failed (${up.status}).` });
  const data = await gql(shop, token,
    'mutation($pid: ID!, $media: [CreateMediaInput!]) { productUpdate(product: { id: $pid }, media: $media) { product { id } userErrors { message } } }',
    { pid: b.productId, media: [{ originalSource: target.resourceUrl, mediaContentType: 'IMAGE', alt: clean(b.alt, 250) }] });
  const errs = data.productUpdate && data.productUpdate.userErrors;
  if (errs && errs.length) return res.status(422).json({ ok: false, error: errs.map((e) => e.message).join('; ') });
  pending.delete(clean(b.imageId, 60));
  res.json({ ok: true });
}));
module.exports = router;

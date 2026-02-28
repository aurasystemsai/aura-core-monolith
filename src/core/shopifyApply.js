/**
 * shopifyApply.js — central module for writing AI-generated content back to Shopify.
 * Used by: ProductSEO, BlogDraftEngine, WeeklyBlogContentEngine, SchemaRichResultsEngine, and any future tool.
 */

const shopTokens = require('./shopTokens');
const API_VERSION = process.env.SHOPIFY_API_VERSION || '2023-10';

function headers(token) {
  return { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': token };
}

function getToken(shop) {
  const token = shopTokens.getToken(shop);
  if (!token) throw new Error(`No Shopify token for shop: ${shop}`);
  return token;
}

/**
 * Apply fields to a Shopify product.
 * fields: { title, body_html, handle, tags, metaDescription, seoTitle }
 */
async function applyProductFields(shop, productId, fields = {}) {
  const token = getToken(shop);
  const base = `https://${shop}/admin/api/${API_VERSION}/products/${productId}`;
  const h = headers(token);

  const productPayload = { product: { id: productId } };
  if (fields.title)     productPayload.product.title = fields.title;
  if (fields.body_html) productPayload.product.body_html = fields.body_html;
  if (fields.tags)      productPayload.product.tags = fields.tags;
  if (fields.handle) {
    productPayload.product.handle = fields.handle
      .toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  }

  // Only PUT if there's something to change
  if (Object.keys(productPayload.product).length > 1) {
    const r = await fetch(`${base}.json`, { method: 'PUT', headers: h, body: JSON.stringify(productPayload) });
    if (!r.ok) throw new Error(`Product update failed (${r.status}): ${(await r.text()).slice(0, 300)}`);
  }

  // Meta description via metafield
  if (fields.metaDescription) {
    const mf = await fetch(`${base}/metafields.json`, {
      method: 'POST', headers: h,
      body: JSON.stringify({ metafield: { namespace: 'global', key: 'description_tag', value: fields.metaDescription, type: 'single_line_text_field' } }),
    });
    if (!mf.ok) console.error('Metafield (metaDescription) update failed:', await mf.text());
  }

  // SEO title via metafield
  if (fields.seoTitle) {
    const mf = await fetch(`${base}/metafields.json`, {
      method: 'POST', headers: h,
      body: JSON.stringify({ metafield: { namespace: 'global', key: 'title_tag', value: fields.seoTitle, type: 'single_line_text_field' } }),
    });
    if (!mf.ok) console.error('Metafield (seoTitle) update failed:', await mf.text());
  }

  return { ok: true, message: 'Product updated on Shopify' };
}

/**
 * Publish a new article to Shopify blog.
 * opts: { title, bodyHtml, metaDescription, tags, blogId, asDraft }
 */
async function publishArticle(shop, opts = {}) {
  const { title, bodyHtml, metaDescription, tags, blogId: explicitBlogId, asDraft = false } = opts;
  if (!title) throw new Error('title is required');
  const token = getToken(shop);
  const h = headers(token);

  let blogId = explicitBlogId;
  if (!blogId) {
    const blogsRes = await fetch(`https://${shop}/admin/api/${API_VERSION}/blogs.json?limit=1`, { headers: { 'X-Shopify-Access-Token': token } });
    if (!blogsRes.ok) throw new Error(`Could not fetch blogs (${blogsRes.status})`);
    const { blogs } = await blogsRes.json();
    if (!blogs?.length) throw new Error('No blogs found — create a blog in your Shopify store first.');
    blogId = blogs[0].id;
  }

  const payload = {
    article: {
      title,
      body_html: bodyHtml || `<h1>${title}</h1>`,
      published: !asDraft,
      ...(tags ? { tags } : {}),
      ...(metaDescription ? { summary_html: `<p>${metaDescription}</p>` } : {}),
    },
  };

  const r = await fetch(`https://${shop}/admin/api/${API_VERSION}/blogs/${blogId}/articles.json`, {
    method: 'POST', headers: h, body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error(`Article publish failed (${r.status}): ${(await r.text()).slice(0, 300)}`);
  const { article } = await r.json();
  return { ok: true, articleId: article.id, blogId, handle: article.handle, message: `Published as ${asDraft ? 'draft' : 'live'} post` };
}

/**
 * Inject a JSON-LD <script> block into an article or product body_html.
 * opts: { type: 'article'|'product', entityId, blogId (for article), schema }
 */
async function applySchemaToEntity(shop, opts = {}) {
  const { type, entityId, blogId, schema } = opts;
  if (!type || !entityId || !schema) throw new Error('type, entityId and schema are required');
  const token = getToken(shop);
  const h = headers(token);

  let getUrl, putUrl, bodyKey;
  if (type === 'article') {
    if (!blogId) throw new Error('blogId required for article schema injection');
    const base = `https://${shop}/admin/api/${API_VERSION}/blogs/${blogId}/articles/${entityId}`;
    getUrl = putUrl = `${base}.json`;
    bodyKey = 'article';
  } else if (type === 'product') {
    const base = `https://${shop}/admin/api/${API_VERSION}/products/${entityId}`;
    getUrl = putUrl = `${base}.json`;
    bodyKey = 'product';
  } else {
    throw new Error(`Unsupported entity type: ${type}`);
  }

  const getRes = await fetch(getUrl, { headers: { 'X-Shopify-Access-Token': token } });
  if (!getRes.ok) throw new Error(`Could not fetch ${type} (${getRes.status})`);
  const entity = (await getRes.json())[bodyKey];

  // Remove any existing LD+JSON block and inject fresh one
  let body = entity.body_html || '';
  body = body.replace(/<script[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi, '').trim();
  body = body + '\n' + schema;

  const putRes = await fetch(putUrl, { method: 'PUT', headers: h, body: JSON.stringify({ [bodyKey]: { id: entityId, body_html: body } }) });
  if (!putRes.ok) throw new Error(`Body update failed (${putRes.status}): ${(await putRes.text()).slice(0, 300)}`);
  return { ok: true, message: `Schema injected into ${type} #${entityId}` };
}

module.exports = { applyProductFields, publishArticle, applySchemaToEntity };

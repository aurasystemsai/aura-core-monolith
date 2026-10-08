'use strict';

const API_VERSION = process.env.SHOPIFY_API_VERSION || '2025-10';

async function gql(shop, token, query, variables) {
  const fetchFn = global.fetch || require('node-fetch');
  const res = await fetchFn(`https://${shop}/admin/api/${API_VERSION}/graphql.json`, {
    method: 'POST',
    headers: { 'X-Shopify-Access-Token': token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`Shopify API error ${res.status}`);
  const json = await res.json();
  if (json.errors && json.errors.length) throw new Error(json.errors.map(e => e.message).join('; '));
  return json.data;
}

const QUERIES = {
  products: `query($first:Int!,$after:String){ products(first:$first, after:$after){ pageInfo{hasNextPage endCursor} nodes{
    id handle title descriptionHtml status seo{title description} featuredImage{altText}
    media(first:20){ nodes{ ... on MediaImage{ id alt } } } } } }`,
  pages: `query($first:Int!,$after:String){ pages(first:$first, after:$after){ pageInfo{hasNextPage endCursor} nodes{
    id handle title body mfTitle: metafield(namespace:"global", key:"title_tag"){ value } mfDesc: metafield(namespace:"global", key:"description_tag"){ value } } } }`,
  collections: `query($first:Int!,$after:String){ collections(first:$first, after:$after){ pageInfo{hasNextPage endCursor} nodes{
    id handle title descriptionHtml seo{title description} } } }`,
  articles: `query($first:Int!,$after:String){ articles(first:$first, after:$after){ pageInfo{hasNextPage endCursor} nodes{
    id handle title body summary tags blog{ handle } mfTitle: metafield(namespace:"global", key:"title_tag"){ value } mfDesc: metafield(namespace:"global", key:"description_tag"){ value } } } }`,
};

const PAGE_SIZE = 50;

async function fetchAll(shop, token, kind, max) {
  const out = [];
  let after = null;
  while (out.length < max) {
    const data = await gql(shop, token, QUERIES[kind], { first: Math.min(PAGE_SIZE, max - out.length), after });
    const conn = data[kind];
    out.push(...conn.nodes);
    if (!conn.pageInfo.hasNextPage) break;
    after = conn.pageInfo.endCursor;
  }
  return out;
}

const stripHtml = (h) => String(h || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

/**
 * Load the store's indexable content as normalized entities:
 * { type, id, handle, url, title, seoTitle, seoDescription, html, text, images }
 */
async function loadStoreEntities(shop, token, { max = 100, types = ['products', 'pages', 'collections', 'articles'] } = {}) {
  const entities = [];
  const warnings = [];
  for (const kind of types) {
    try {
      const nodes = await fetchAll(shop, token, kind, max);
      for (const n of nodes) {
        if (kind === 'products') {
          if (n.status && n.status !== 'ACTIVE') continue;
          const imgs = (n.media && n.media.nodes || []).filter(m => m && m.id);
          entities.push({
            type: 'product', id: n.id, handle: n.handle, url: `https://${shop}/products/${n.handle}`,
            title: n.title, seoTitle: n.seo && n.seo.title || '', seoDescription: n.seo && n.seo.description || '',
            html: n.descriptionHtml || '', text: stripHtml(n.descriptionHtml),
            images: imgs.map(m => ({ id: m.id, alt: m.alt || '' })),
          });
        } else if (kind === 'pages') {
          entities.push({
            type: 'page', id: n.id, handle: n.handle, url: `https://${shop}/pages/${n.handle}`,
            title: n.title, seoTitle: n.mfTitle && n.mfTitle.value || '', seoDescription: n.mfDesc && n.mfDesc.value || '', html: n.body || '', text: stripHtml(n.body), images: [],
          });
        } else if (kind === 'collections') {
          entities.push({
            type: 'collection', id: n.id, handle: n.handle, url: `https://${shop}/collections/${n.handle}`,
            title: n.title, seoTitle: n.seo && n.seo.title || '', seoDescription: n.seo && n.seo.description || '',
            html: n.descriptionHtml || '', text: stripHtml(n.descriptionHtml), images: [],
          });
        } else {
          const blog = n.blog && n.blog.handle || 'news';
          entities.push({
            type: 'article', id: n.id, handle: n.handle, url: `https://${shop}/blogs/${blog}/${n.handle}`,
            title: n.title, seoTitle: n.mfTitle && n.mfTitle.value || '', seoDescription: n.mfDesc && n.mfDesc.value || '', html: n.body || '', text: stripHtml(n.body),
            images: [], tags: n.tags || [],
          });
        }
      }
    } catch (e) {
      warnings.push(`${kind}: ${e.message}`);
    }
  }
  if (!entities.length && warnings.length) throw new Error(`Could not read store data (${warnings.join('; ')})`);
  return { entities, warnings };
}

module.exports = { gql, loadStoreEntities, stripHtml };

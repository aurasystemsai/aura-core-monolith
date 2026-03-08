/**
 * shopifyContentFetcher.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Central helper used by every SEO tool that needs to "fetch" a page for
 * analysis.  If the URL belongs to a connected Shopify store we bypass the
 * password-protected storefront and pull the real content directly from the
 * Shopify Admin REST API.  This guarantees that dev stores, stores with a
 * storefront password, and any store where the crawler would otherwise get a
 * login page all return accurate content.
 *
 * Handles:
 *   /blogs/{blog-handle}/{article-handle}  → Admin articles API
 *   /products/{product-handle}             → Admin products API
 *   /pages/{page-handle}                   → Admin pages API
 *
 * Falls back to a normal HTTP fetch for any non-Shopify or unrecognised URL.
 *
 * Usage (same everywhere):
 *   const { fetchForAnalysis } = require('../../core/shopifyContentFetcher');
 *   const { html, fromAdminApi, warning } = await fetchForAnalysis(url, req);
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use strict';

/** Parse a Shopify storefront URL into its type + handles. */
function parseShopifyUrl(url) {
  try {
    const u = new URL(url);
    const blog = u.pathname.match(/^\/blogs\/([^/]+)\/([^/?#]+)/);
    if (blog) return { type: 'article', host: u.hostname, blogHandle: blog[1], articleHandle: blog[2] };
    const product = u.pathname.match(/^\/products\/([^/?#]+)/);
    if (product) return { type: 'product', host: u.hostname, productHandle: product[1] };
    const page = u.pathname.match(/^\/pages\/([^/?#]+)/);
    if (page) return { type: 'page', host: u.hostname, pageHandle: page[1] };
    return null;
  } catch {
    return null;
  }
}

// Keep backward-compat alias used elsewhere
function parseShopifyBlogUrl(url) {
  const r = parseShopifyUrl(url);
  if (!r || r.type !== 'article') return null;
  return { host: r.host, shopifyHost: r.host.endsWith('.myshopify.com') ? r.host : null, blogHandle: r.blogHandle, articleHandle: r.articleHandle };
}

/**
 * Resolve shop domain + access token.
 * Checks session → header → URL hostname match → single-store fallback → env.
 */
function resolveShopToken(req, urlHostname) {
  try {
    const shopTokens = require('./shopTokens');
    const all = shopTokens.loadAll ? shopTokens.loadAll() : {};

    // Prefer explicit session/header shop
    let shop =
      req?.session?.shop ||
      req?.headers?.['x-shopify-shop-domain'] ||
      null;

    // Try matching the URL hostname against stored shop domains
    if (!shop && urlHostname) {
      for (const s of Object.keys(all)) {
        const sClean = s.replace('www.', '').toLowerCase();
        const hClean = urlHostname.replace('www.', '').toLowerCase();
        if (hClean === sClean || hClean.includes(sClean.replace('.myshopify.com', ''))) {
          shop = s; break;
        }
      }
    }

    // Single-store fallback
    if (!shop) {
      const keys = Object.keys(all);
      if (keys.length === 1) shop = keys[0];
    }

    if (!shop) shop = process.env.SHOPIFY_STORE_URL || null;
    if (!shop) return { shop: null, token: null };

    const token = (shopTokens.getToken ? shopTokens.getToken(shop) : null)
      || all[shop]?.token
      || process.env.SHOPIFY_ACCESS_TOKEN
      || process.env.SHOPIFY_ADMIN_API_TOKEN
      || null;

    return { shop, token };
  } catch {
    return { shop: null, token: null };
  }
}

/** Build HTML from a Shopify article so every SEO analyser works on it. */
function buildHtmlFromArticle(article, url) {
  const esc = (s) => (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  const summary = (article.summary_html || '').replace(/<[^>]+>/g, '').trim();
  return (
    `<!DOCTYPE html><html lang="en"><head>` +
    `<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">` +
    `<title>${esc(article.title)}</title>` +
    (summary ? `<meta name="description" content="${esc(summary.slice(0, 320))}">` : '') +
    (article.author ? `<meta name="author" content="${esc(article.author)}">` : '') +
    (article.published_at ? `<meta property="article:published_time" content="${article.published_at}">` : '') +
    (article.updated_at ? `<meta property="article:modified_time" content="${article.updated_at}">` : '') +
    `<meta property="og:type" content="article">` +
    `<link rel="canonical" href="${esc(url)}">` +
    (article.tags ? `<meta name="keywords" content="${esc(article.tags)}">` : '') +
    `</head><body><article>` +
    `<h1>${esc(article.title)}</h1>` +
    (article.author ? `<div class="author byline">${esc(article.author)}</div>` : '') +
    (article.published_at ? `<time datetime="${article.published_at}">${article.published_at}</time>` : '') +
    (article.tags ? `<div class="tags">${esc(article.tags)}</div>` : '') +
    (article.summary_html ? `<div class="excerpt">${article.summary_html}</div>` : '') +
    (article.body_html || '') +
    `</article></body></html>`
  );
}

/** Build HTML from a Shopify product. */
function buildHtmlFromProduct(product, url) {
  const esc = (s) => (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  const price = product.variants?.[0]?.price || '';
  const currency = 'USD';
  const availability = product.variants?.[0]?.inventory_quantity > 0 ? 'InStock' : 'OutOfStock';
  const schema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.body_html ? product.body_html.replace(/<[^>]+>/g, '') : '',
    brand: { '@type': 'Brand', name: product.vendor || '' },
    offers: { '@type': 'Offer', price, priceCurrency: currency, availability: `https://schema.org/${availability}` },
  });
  return (
    `<!DOCTYPE html><html lang="en"><head>` +
    `<meta charset="utf-8"><title>${esc(product.title)}</title>` +
    (product.body_html ? `<meta name="description" content="${esc(product.body_html.replace(/<[^>]+>/g, '').slice(0, 320))}">` : '') +
    `<link rel="canonical" href="${esc(url)}">` +
    `<script type="application/ld+json">${schema}</script>` +
    `</head><body>` +
    `<h1>${esc(product.title)}</h1>` +
    (product.vendor ? `<p class="vendor">${esc(product.vendor)}</p>` : '') +
    (product.product_type ? `<p class="product-type">${esc(product.product_type)}</p>` : '') +
    (product.tags ? `<p class="tags">${esc(product.tags)}</p>` : '') +
    (product.body_html || '') +
    `</body></html>`
  );
}

/** Build HTML from a Shopify page. */
function buildHtmlFromPage(page, url) {
  const esc = (s) => (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  return (
    `<!DOCTYPE html><html lang="en"><head>` +
    `<meta charset="utf-8"><title>${esc(page.title)}</title>` +
    (page.meta_description ? `<meta name="description" content="${esc(page.meta_description)}">` : '') +
    `<link rel="canonical" href="${esc(url)}">` +
    `</head><body>` +
    `<h1>${esc(page.title)}</h1>` +
    (page.body_html || '') +
    `</body></html>`
  );
}

/**
 * Try to fetch content via Shopify Admin API.
 * Returns { html, fromAdminApi: true } on success, null on failure.
 */
async function tryAdminApiFetch(url, req) {
  const parsed = parseShopifyUrl(url);
  if (!parsed) return null;

  const { shop, token } = resolveShopToken(req, parsed.host);
  if (!shop || !token) return null;

  const ver = process.env.SHOPIFY_API_VERSION || '2023-10';
  const headers = { 'X-Shopify-Access-Token': token, 'Content-Type': 'application/json' };

  try {
    if (parsed.type === 'article') {
      const blogsRes = await fetch(`https://${shop}/admin/api/${ver}/blogs.json?limit=25`, { headers });
      if (!blogsRes.ok) return null;
      const blog = ((await blogsRes.json()).blogs || []).find(b => b.handle === parsed.blogHandle);
      if (!blog) return null;
      const artRes = await fetch(
        `https://${shop}/admin/api/${ver}/blogs/${blog.id}/articles.json?handle=${encodeURIComponent(parsed.articleHandle)}&limit=1&fields=id,title,body_html,summary_html,tags,author,published_at,updated_at,handle,image`,
        { headers }
      );
      if (!artRes.ok) return null;
      const article = ((await artRes.json()).articles || [])[0];
      if (!article) return null;
      return { html: buildHtmlFromArticle(article, url), fromAdminApi: true, shop, type: 'article' };
    }

    if (parsed.type === 'product') {
      const r = await fetch(
        `https://${shop}/admin/api/${ver}/products.json?handle=${encodeURIComponent(parsed.productHandle)}&limit=1&fields=id,title,body_html,vendor,product_type,tags,variants,images`,
        { headers }
      );
      if (!r.ok) return null;
      const product = ((await r.json()).products || [])[0];
      if (!product) return null;
      return { html: buildHtmlFromProduct(product, url), fromAdminApi: true, shop, type: 'product' };
    }

    if (parsed.type === 'page') {
      const r = await fetch(
        `https://${shop}/admin/api/${ver}/pages.json?handle=${encodeURIComponent(parsed.pageHandle)}&limit=1&fields=id,title,body_html,meta_description`,
        { headers }
      );
      if (!r.ok) return null;
      const page = ((await r.json()).pages || [])[0];
      if (!page) return null;
      return { html: buildHtmlFromPage(page, url), fromAdminApi: true, shop, type: 'page' };
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Main export — use this everywhere instead of bare fetch/node-fetch for HTML.
 *
 * @param {string} url      The page URL to analyse
 * @param {object} [req]    Express request (for session/header token resolution)
 * @returns {{ html: string, fromAdminApi: boolean, warning?: string }}
 */
async function fetchForAnalysis(url, req) {
  // 1. Always try Admin API first for any Shopify storefront URL
  const adminResult = await tryAdminApiFetch(url, req);
  if (adminResult) return adminResult;

  // 2. Fall back to public HTTP fetch for external/non-Shopify URLs
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'AURA SEO Auditor (+https://aurasystemsai.com)', Accept: 'text/html,application/xhtml+xml' },
      redirect: 'follow',
    });
    clearTimeout(timeout);
    if (!response.ok) throw new Error(`HTTP ${response.status} from ${url}`);
    const html = await response.text();
    const isPasswordPage = html.includes('password_page') || (html.includes('Shopify') && html.includes('Enter store password'));
    return {
      html,
      fromAdminApi: false,
      responseUrl: response.url,
      warning: isPasswordPage
        ? 'Store appears to be password-protected. Results may be inaccurate. Connect your store in Settings to enable Admin API access.'
        : undefined,
    };
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

module.exports = { fetchForAnalysis, parseShopifyBlogUrl, parseShopifyUrl, resolveShopToken };

 * ─────────────────────────────────────────────────────────────────────────────
 */

'use strict';

/**
 * Detect whether a URL is a Shopify blog-article URL.
 * Pattern:  https://{shop}.myshopify.com/blogs/{blog-handle}/{article-handle}
 *           https://{custom-domain}/blogs/{blog-handle}/{article-handle}
 * Returns { shop, blogHandle, articleHandle } or null.
 */
function parseShopifyBlogUrl(url) {
  try {
    const u = new URL(url);
    // Must be /blogs/{x}/{y}
    const m = u.pathname.match(/^\/blogs\/([^/]+)\/([^/?#]+)/);
    if (!m) return null;
    return {
      host: u.hostname,                // may be custom domain or .myshopify.com
      shopifyHost: u.hostname.endsWith('.myshopify.com') ? u.hostname : null,
      blogHandle: m[1],
      articleHandle: m[2],
    };
  } catch {
    return null;
  }
}

/**
 * Resolve shop domain + access token from an incoming request.
 * Checks session → header → persisted tokens (single-store) → env.
 */
function resolveShopToken(req) {
  try {
    const shopTokens = require('./shopTokens');
    const shop =
      req?.session?.shop ||
      req?.headers?.['x-shopify-shop-domain'] ||
      (shopTokens.loadAll
        ? (() => {
            const all = shopTokens.loadAll();
            const keys = Object.keys(all || {});
            return keys.length === 1 ? keys[0] : null;
          })()
        : null) ||
      process.env.SHOPIFY_STORE_URL ||
      null;
    if (!shop) return { shop: null, token: null };
    const token = shopTokens.getToken
      ? shopTokens.getToken(shop)
      : process.env.SHOPIFY_ACCESS_TOKEN || process.env.SHOPIFY_ADMIN_API_TOKEN || null;
    return { shop, token };
  } catch {
    return { shop: null, token: null };
  }
}

/**
 * Build a well-formed HTML document from Shopify article fields so every
 * SEO analyser (cheerio, regex-based, readability) works normally on it.
 */
function buildHtmlFromArticle(article, url, blog) {
  const esc = (s) => (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  const summary = (article.summary_html || '').replace(/<[^>]+>/g, '').trim();

  return (
    `<!DOCTYPE html><html lang="en"><head>` +
    `<meta charset="utf-8">` +
    `<meta name="viewport" content="width=device-width, initial-scale=1">` +
    `<title>${esc(article.title)}</title>` +
    (summary
      ? `<meta name="description" content="${esc(summary.slice(0, 320))}">`
      : '') +
    (article.author
      ? `<meta name="author" content="${esc(article.author)}">`
      : '') +
    (article.published_at
      ? `<meta property="article:published_time" content="${article.published_at}">`
      : '') +
    (article.updated_at
      ? `<meta property="article:modified_time" content="${article.updated_at}">`
      : '') +
    `<meta property="og:title" content="${esc(article.title)}">` +
    (summary
      ? `<meta property="og:description" content="${esc(summary.slice(0, 320))}">`
      : '') +
    (article.image?.src
      ? `<meta property="og:image" content="${esc(article.image.src)}">`
      : '') +
    `<meta property="og:type" content="article">` +
    `<link rel="canonical" href="${esc(url)}">` +
    (article.tags
      ? `<meta name="keywords" content="${esc(article.tags)}">`
      : '') +
    `</head><body>` +
    `<article>` +
    `<h1>${esc(article.title)}</h1>` +
    (article.author ? `<div class="author byline post-author">${esc(article.author)}</div>` : '') +
    (article.published_at
      ? `<time datetime="${article.published_at}" itemprop="datePublished">${article.published_at}</time>`
      : '') +
    (article.tags ? `<div class="tags">${esc(article.tags)}</div>` : '') +
    (article.summary_html
      ? `<div class="excerpt summary">${article.summary_html}</div>`
      : '') +
    (article.body_html || '') +
    `</article>` +
    `</body></html>`
  );
}

/**
 * Try to fetch article content via Shopify Admin API.
 * Returns { html, fromAdminApi: true } on success, null on failure.
 */
async function tryAdminApiFetch(url, req) {
  const parsed = parseShopifyBlogUrl(url);
  if (!parsed) return null;

  const { shop, token } = resolveShopToken(req);
  if (!shop || !token) return null;

  const ver = process.env.SHOPIFY_API_VERSION || '2023-10';
  const headers = { 'X-Shopify-Access-Token': token, 'Content-Type': 'application/json' };

  try {
    // 1. Find the blog by handle
    const blogsRes = await fetch(
      `https://${shop}/admin/api/${ver}/blogs.json?limit=25`,
      { headers }
    );
    if (!blogsRes.ok) return null;
    const blogsJson = await blogsRes.json();
    const blog = (blogsJson.blogs || []).find(
      (b) => b.handle === parsed.blogHandle
    );
    if (!blog) return null;

    // 2. Find the article by handle within that blog
    const artRes = await fetch(
      `https://${shop}/admin/api/${ver}/blogs/${blog.id}/articles.json` +
        `?handle=${encodeURIComponent(parsed.articleHandle)}&limit=1` +
        `&fields=id,title,body_html,summary_html,tags,author,published_at,updated_at,handle,image`,
      { headers }
    );
    if (!artRes.ok) return null;
    const artJson = await artRes.json();
    const article = (artJson.articles || [])[0];
    if (!article) return null;

    const html = buildHtmlFromArticle(article, url, blog);
    return { html, fromAdminApi: true, shop, articleId: article.id, blogId: blog.id };
  } catch {
    return null;
  }
}

/**
 * Main export — use this everywhere instead of bare `fetch(url)` for HTML.
 *
 * @param {string} url  The page URL to analyse
 * @param {object} [req]  Express request (for session/header token resolution)
 * @returns {{ html: string, fromAdminApi: boolean, warning?: string }}
 */
async function fetchForAnalysis(url, req) {
  // 1. Try Admin API first for Shopify blog URLs
  const adminResult = await tryAdminApiFetch(url, req);
  if (adminResult) return adminResult;

  // 2. Fall back to public HTTP fetch
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'AURA SEO Auditor (+https://aurasystemsai.com)',
        Accept: 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
    });
    clearTimeout(timeout);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} from ${url}`);
    }
    const html = await response.text();
    // Warn if we got a Shopify password page
    const isPasswordPage =
      html.includes('password_page') ||
      (html.includes('Shopify') && html.includes('Enter store password'));
    return {
      html,
      fromAdminApi: false,
      responseUrl: response.url,
      warning: isPasswordPage
        ? 'Store appears to be password-protected. Results may be inaccurate. Connect your store in Settings to enable Admin API access.'
        : undefined,
    };
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

module.exports = { fetchForAnalysis, parseShopifyBlogUrl, resolveShopToken };

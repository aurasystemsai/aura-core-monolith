// src/api.js
// Simple OAuth-friendly fetch helper (no App Bridge)
import { setApiError } from './globalApiError';
import { setCreditError } from './globalCreditError';

const MAX_RETRIES = 3;
const BASE_RETRY_MS = 750;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function getSessionToken() {
 try {
  if (window.shopify && typeof window.shopify.idToken === 'function') return await window.shopify.idToken();
 } catch { /* not embedded, or App Bridge unavailable */ }
 return null;
}

// Many tool screens call fetch() directly. This adds the session token and shop header to their
// same-origin /api calls so the server can verify who is asking.
export function installAuthFetch() {
 if (window.__auraAuthFetch) return;
 window.__auraAuthFetch = true;
 const nativeFetch = window.fetch.bind(window);
 window.fetch = async (input, init = {}) => {
  try {
   const raw = typeof input === 'string' ? input : (input && input.url) || '';
   const url = new URL(raw, window.location.origin);
   if (url.origin === window.location.origin && url.pathname.startsWith('/api/')) {
    const headers = new Headers(init.headers || (typeof input !== 'string' && input.headers) || {});
    if (!headers.has('Authorization')) {
     const token = await getSessionToken() || localStorage.getItem('accessToken') || localStorage.getItem('shopToken');
     if (token) headers.set('Authorization', 'Bearer ' + token);
    }
    const shop = new URLSearchParams(window.location.search).get('shop') || localStorage.getItem('auraShop');
    if (shop && !headers.has('x-shopify-shop-domain')) headers.set('x-shopify-shop-domain', shop);
    if (typeof init.body === 'string' && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
    return nativeFetch(input, { ...init, headers, credentials: init.credentials || 'include' });
   }
  } catch { /* fall through to the untouched request */ }
  return nativeFetch(input, init);
 };
}

export async function apiFetch(url, options = {}) {
 const headers = options.headers ? { ...options.headers } : {};

 // Auth header
 // Embedded in Shopify: App Bridge issues a short-lived signed session token. Otherwise fall back to stored tokens.
 const idToken = await getSessionToken();
 const bearer = idToken || localStorage.getItem('accessToken') || localStorage.getItem('shopToken');
 if (bearer && !headers['Authorization']) {
 headers['Authorization'] = 'Bearer ' + bearer;
 }

 // Preserve shop domain header for backend multi-tenant logic
 const shopDomain = new URLSearchParams(window.location.search).get('shop')
 || localStorage.getItem('auraShop');
 if (shopDomain) {
 // Persist for future requests when the URL param may not be present (embedded)
 localStorage.setItem('auraShop', shopDomain);
 if (!headers['x-shopify-shop-domain']) {
 headers['x-shopify-shop-domain'] = shopDomain;
 }
 }

 // JSON string bodies need this or Express leaves req.body empty
 const hasContentType = Object.keys(headers).some((k) => k.toLowerCase() === 'content-type');
 if (typeof options.body === 'string' && !hasContentType) {
 headers['Content-Type'] = 'application/json';
 }

 const opts = {
 credentials: options.credentials || 'include',
 ...options,
 headers,
 };

 let attempt = 0;
 while (attempt <= MAX_RETRIES) {
 try {
 const resp = await fetch(url, opts);

 // Handle rate limits with backoff using Retry-After or exponential fallback
 if (resp.status === 429 && attempt < MAX_RETRIES) {
 const retryAfterHeader = resp.headers.get('Retry-After');
 const retryMs = retryAfterHeader ? parseFloat(retryAfterHeader) * 1000 : BASE_RETRY_MS * Math.pow(2, attempt);
 setApiError('Rate limited — retrying…');
 attempt += 1;
 await sleep(retryMs);
 continue;
 }

 if (!resp.ok) {
 const clone = resp.clone();
 let msg = `API error: ${resp.status} ${resp.statusText}`;
 try {
 const data = await clone.json();
 if (data && data.error) msg += ` - ${data.error}`;
 if (resp.status === 403 && data?.error?.toLowerCase().includes('scope')) {
 msg = 'Missing Shopify scope — please re-authenticate to continue.';
 }
 } catch {}
 setApiError(msg);
 }
 return resp;
 } catch (err) {
 if (attempt < MAX_RETRIES) {
 await sleep(BASE_RETRY_MS * Math.pow(2, attempt));
 attempt += 1;
 continue;
 }
 setApiError(err.message || 'Network error');
 throw err;
 }
 }
}

/**
 * Like apiFetch but automatically parses the JSON body and returns a plain object.
 * Use this in components where the response body is always JSON and you access r.property directly.
 * Returns: { ok: boolean, status: number, ...bodyFields }
 */
export async function apiFetchJSON(url, options = {}) {
 const resp = await apiFetch(url, options);
 let data = {};
 try { data = await resp.json(); } catch {}
 // Intercept credit errors so every component gets a modal automatically
 if (resp.status === 402 && data.credit_error) {
 setCreditError(data);
 }
 return { ...data, ok: resp.ok, status: resp.status };
}

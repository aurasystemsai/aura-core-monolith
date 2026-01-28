// src/api.js
// Simple OAuth-friendly fetch helper (no App Bridge)
import { setApiError } from './globalApiError';

const MAX_RETRIES = 3;
const BASE_RETRY_MS = 750;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export async function apiFetch(url, options = {}) {
  const headers = options.headers ? { ...options.headers } : {};

  // Prefer OAuth/token auth (localStorage) and fall back to cookies
  const bearer = localStorage.getItem('accessToken') || localStorage.getItem('shopToken');
  if (bearer && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${bearer}`;
  }

  // Preserve shop domain header for backend multi-tenant logic
  const shopDomain = new URLSearchParams(window.location.search).get('shop');
  if (shopDomain && !headers['x-shopify-shop-domain']) {
    headers['x-shopify-shop-domain'] = shopDomain;
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

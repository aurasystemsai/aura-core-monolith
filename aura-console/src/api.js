// src/api.js
// Global API utility for Shopify App Bridge authenticatedFetch

import createApp from '@shopify/app-bridge';
import { authenticatedFetch } from '@shopify/app-bridge-utils';
import { setApiError } from './globalApiError';

const apiKey = import.meta.env.VITE_SHOPIFY_API_KEY;
const host = new URLSearchParams(window.location.search).get('host');
const app = createApp({
  apiKey,
  host,
  forceRedirect: true
});

const fetchFunction = authenticatedFetch(app);

export async function apiFetch(url, options = {}) {
  options.headers = options.headers || {};
  // Always send shop domain for backend multi-tenant support
  const shopDomain = new URLSearchParams(window.location.search).get('shop');
  if (shopDomain) {
    options.headers['x-shopify-shop-domain'] = shopDomain;
  }
  // authenticatedFetch automatically attaches the session token
  try {
    const resp = await fetchFunction(url, options);
    if (!resp.ok) {
      let msg = `API error: ${resp.status} ${resp.statusText}`;
      try {
        const data = await resp.json();
        if (data && data.error) msg += ` - ${data.error}`;
      } catch {}
      setApiError(msg);
    }
    return resp;
  } catch (err) {
    setApiError(err.message || 'Network error');
    throw err;
  }
}

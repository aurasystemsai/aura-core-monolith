// src/api.js
// Simple OAuth-friendly fetch helper (no App Bridge)
import { setApiError } from './globalApiError';

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

  try {
    const resp = await fetch(url, opts);
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

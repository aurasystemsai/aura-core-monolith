// src/api.js
// Global API utility for Shopify App Bridge authenticatedFetch

import createApp from '@shopify/app-bridge';
import { authenticatedFetch } from '@shopify/app-bridge-utils';

const app = createApp({
  apiKey: window.shopifyApiKey || process.env.SHOPIFY_API_KEY,
  host: new URLSearchParams(window.location.search).get('host'),
});

const fetchFunction = authenticatedFetch(app);

export async function apiFetch(url, options = {}) {
  options.headers = options.headers || {};
  // authenticatedFetch automatically attaches the session token
  return fetchFunction(url, options);
}

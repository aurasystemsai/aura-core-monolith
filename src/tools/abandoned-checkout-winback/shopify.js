// Shopify integration for fetching abandoned checkouts
let fetchFn;
if (typeof fetch !== 'undefined') {
  fetchFn = fetch;
} else {
  try {
    fetchFn = require('undici').fetch;
  } catch (e) {
    throw new Error('No fetch implementation found. Please use Node 18+ or install undici.');
  }
}

async function fetchAbandonedCheckouts({ shop, token, apiVersion }) {
  if (!shop || !token) throw new Error('Missing shop or token');
  apiVersion = apiVersion || process.env.SHOPIFY_API_VERSION || '2023-10';
  const url = `https://${shop}/admin/api/${apiVersion}/checkouts.json?status=abandoned`;
  const resp = await fetchFn(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': token,
    },
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Shopify fetch failed: ${text}`);
  }
  const data = await resp.json();
  return data.checkouts || [];
}

module.exports = {
  fetchAbandonedCheckouts,
};

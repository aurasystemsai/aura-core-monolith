'use strict';

const { assertPublicUrl } = require('./shopifyContentFetcher');

const MAX_REDIRECTS = 5;

/**
 * Fetch a public URL with SSRF checks on every redirect hop, a timeout and a body size cap.
 * Returns { status, headers, text, finalUrl, redirects, ms }.
 */
async function safeFetchText(url, { timeoutMs = 15000, maxBytes = 2 * 1024 * 1024, headers = {} } = {}) {
  const fetchFn = global.fetch || require('node-fetch');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const started = Date.now();
  try {
    let current = url;
    const redirects = [];
    for (let i = 0; ; i++) {
      await assertPublicUrl(current);
      const res = await fetchFn(current, {
        signal: controller.signal,
        redirect: 'manual',
        headers: { 'User-Agent': 'AURA SEO Auditor (+https://aurasystemsai.com)', Accept: 'text/html,application/xhtml+xml,text/plain,application/xml', ...headers },
      });
      const loc = res.status >= 300 && res.status < 400 && res.headers && res.headers.get && res.headers.get('location');
      if (loc) {
        if (i >= MAX_REDIRECTS) throw new Error('Too many redirects');
        const next = new URL(loc, current).toString();
        redirects.push({ from: current, to: next, status: res.status });
        current = next;
        continue;
      }
      let text = await res.text();
      if (text.length > maxBytes) text = text.slice(0, maxBytes);
      const hdrs = {};
      if (res.headers && res.headers.forEach) res.headers.forEach((v, k) => { hdrs[k.toLowerCase()] = v; });
      return { status: res.status, headers: hdrs, text, finalUrl: current, redirects, ms: Date.now() - started };
    }
  } finally {
    clearTimeout(timer);
  }
}

module.exports = { safeFetchText };

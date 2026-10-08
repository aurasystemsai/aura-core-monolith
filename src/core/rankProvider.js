'use strict';

const PROVIDER = 'serpapi';
const COUNTRIES = ['us', 'gb', 'ca', 'au', 'de', 'fr', 'es', 'it', 'nl', 'ie', 'nz', 'in'];

const isConfigured = () => !!process.env.SERPAPI_KEY;

const bareHost = (h) => String(h || '').toLowerCase().replace(/^www\./, '');

function hostMatches(link, domain) {
  try {
    const h = bareHost(new URL(link).hostname);
    const d = bareHost(domain);
    return h === d || h.endsWith(`.${d}`);
  } catch { return false; }
}

/** Real Google organic position for a domain (top 100). position is null when not found. */
async function checkRank(keyword, domain, country = 'us') {
  if (!isConfigured()) throw new Error('No rank data provider is connected.');
  const gl = COUNTRIES.includes(country) ? country : 'us';
  const qs = new URLSearchParams({ engine: 'google', q: keyword, num: '100', gl, api_key: process.env.SERPAPI_KEY });
  const res = await fetch(`https://serpapi.com/search.json?${qs}`, { signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(`Rank provider error (${res.status})`);
  const body = await res.json();
  if (body.error) throw new Error(`Rank provider: ${String(body.error).slice(0, 120)}`);
  const organic = Array.isArray(body.organic_results) ? body.organic_results : [];
  const hit = organic.find(r => r && r.link && hostMatches(r.link, domain));
  return { position: hit ? hit.position : null, url: hit ? hit.link : null, checkedResults: organic.length };
}

module.exports = { PROVIDER, COUNTRIES, isConfigured, checkRank, hostMatches };

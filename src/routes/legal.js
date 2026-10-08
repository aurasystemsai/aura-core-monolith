/**
 * Public legal pages: GET /privacy and GET /terms.
 * Required by Shopify, Google, Meta and TikTok app review. No auth.
 * Set LEGAL_NAME, APP_URL and PRIVACY_CONTACT_EMAIL in the environment before going live.
 */
const express = require('express');

const LEGAL_NAME = process.env.LEGAL_NAME || 'Darren Prince, trading as Aura Systems AI';
const APP_NAME = 'AURA';
const APP_URL = process.env.APP_URL || 'https://aura-core-monolith.onrender.com';
const CONTACT = process.env.PRIVACY_CONTACT_EMAIL || 'privacy@aurasystems.ai';
const UPDATED = '8 October 2026';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function page(title, body) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)} - ${esc(APP_NAME)}</title>
<style>
*,*::before,*::after{box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:820px;margin:0 auto;padding:40px 24px 80px;color:#1a1a1a;line-height:1.7}
h1{font-size:2rem;margin-bottom:8px}h2{font-size:1.2rem;margin-top:34px}p,li{font-size:.97rem;color:#333}a{color:#4f46e5}
.meta{color:#777;font-size:.9rem;margin-bottom:34px}table{width:100%;border-collapse:collapse;margin:16px 0;font-size:.9rem}
th,td{text-align:left;padding:9px 12px;border:1px solid #ddd;vertical-align:top}th{background:#f5f5f5}
</style></head><body>
<h1>${esc(title)}</h1>
<p class="meta">${esc(APP_NAME)} by ${esc(LEGAL_NAME)} &nbsp;|&nbsp; Last updated ${UPDATED}</p>
${body}
<p class="meta" style="margin-top:50px">Contact: <a href="mailto:${esc(CONTACT)}">${esc(CONTACT)}</a> &nbsp;|&nbsp; <a href="/privacy">Privacy Policy</a> &nbsp;|&nbsp; <a href="/terms">Terms of Service</a></p>
</body></html>`;
}

const PRIVACY = `
<h2>1. Who we are</h2>
<p>${esc(LEGAL_NAME)} ("we", "us") runs ${esc(APP_NAME)}, an app that helps online stores with SEO, content, marketing and operations (${esc(APP_URL)}). For the store data you connect to AURA, you (the merchant) are the controller and we are your processor. For merchant account and billing data, we are the controller.</p>

<h2>2. Data we process</h2>
<table>
<tr><th>Data</th><th>Why</th><th>Kept</th></tr>
<tr><td>Shop domain and access token</td><td>Identify your store and call the Shopify API for you</td><td>While installed</td></tr>
<tr><td>Products, collections, pages, blog posts, images</td><td>SEO, content, feed and image tools</td><td>Read live; results of our own scans and edit history are stored per shop</td></tr>
<tr><td>Orders, inventory and customer records (name, email, phone, address, order history)</td><td>Insights, forecasting, returns, retention emails and texts, loyalty</td><td>Read live from Shopify; derived summaries and campaign records are stored per shop</td></tr>
<tr><td>Ad account data (campaign names, spend, results) if you connect Google, Meta or TikTok ads</td><td>Show performance and suggest changes</td><td>While connected; connection tokens deleted when you disconnect</td></tr>
<tr><td>Usage, credit balance and billing records</td><td>Run and bill the service, prevent abuse</td><td>While installed and as required by law</td></tr>
</table>
<p>We do not sell personal data. We do not use store or customer data to train AI models.</p>

<h2>3. Service providers (sub-processors)</h2>
<ul>
<li><strong>Shopify</strong> - source of store data and billing.</li>
<li><strong>OpenAI</strong> - receives the text, product details and store summaries needed for an AI action you request. We avoid sending customer names, emails or phone numbers to OpenAI. OpenAI does not train on API data by default.</li>
<li><strong>Hosting provider</strong> - runs our servers and databases (currently Render).</li>
<li><strong>Email and SMS delivery providers</strong> (our own SMTP service and Twilio) - receive recipient contact details and message text only when you send a campaign.</li>
<li><strong>Google, Meta and TikTok</strong> - only if you connect their ad or search services, under the permissions you grant.</li>
</ul>

<h2>4. Retention and deletion</h2>
<ul>
<li>When you uninstall, Shopify notifies us and we delete your shop's stored data and tokens.</li>
<li>Customer data requests and erasure requests from Shopify (GDPR webhooks) are handled automatically.</li>
<li>You can ask us to delete or export data at any time by emailing ${esc(CONTACT)}.</li>
</ul>

<h2>5. Security</h2>
<p>Requests are authenticated with Shopify session tokens, every record is scoped to its shop, traffic is encrypted in transit, and access to stored tokens is restricted. No system is perfectly secure; we will notify affected merchants of a breach as the law requires.</p>

<h2>6. Your rights</h2>
<p>Depending on where you live (including the UK and EU GDPR and California CCPA) you can access, correct, export or delete your personal data, and object to or restrict processing. Customers of a store should contact that store first; we help the store respond. You can also complain to your data protection authority.</p>

<h2>7. International transfers</h2>
<p>Our providers may process data outside your country. Where required we rely on standard contractual clauses or equivalent safeguards.</p>

<h2>8. Children</h2>
<p>The service is for businesses and is not directed at children.</p>

<h2>9. Changes</h2>
<p>We will update this page and its date when this policy changes, and tell merchants about material changes.</p>
`;

const TERMS = `
<h2>1. Agreement</h2>
<p>By installing or using ${esc(APP_NAME)} you agree to these terms on behalf of your business. If you do not agree, do not use the service.</p>

<h2>2. The service</h2>
<p>${esc(APP_NAME)} provides tools for stores, including AI-assisted SEO, content, marketing and operations features. Some features change store content (for example product text or image alt text) only when you approve and apply them, and we keep a log so changes can be undone where possible.</p>

<h2>3. Credits and billing</h2>
<ul>
<li>AI actions, text messages and similar usage cost credits. The cost of an action is shown before you confirm it.</li>
<li>Plans are billed through Shopify. Free-plan credits are a one-time allowance. Paid-plan credits renew each billing period; top-up credits do not expire while your subscription is active.</li>
<li>Fees are non-refundable except where the law requires or Shopify's billing terms apply.</li>
</ul>

<h2>4. Your responsibilities</h2>
<ul>
<li>You are responsible for your store, your content and the messages you send. You must have a lawful basis, and any consent the law requires, before sending marketing emails or texts, and you must honour unsubscribes.</li>
<li>Review AI output before publishing. AI can be wrong, and you are responsible for what you publish.</li>
<li>Do not misuse the service: no illegal, deceptive or infringing content, no spam, no attempts to break, overload or reverse engineer the service.</li>
</ul>

<h2>5. Third-party services</h2>
<p>Connections to Shopify, Google, Meta, TikTok and others are governed by those companies' own terms, which you must follow. We are not responsible for their availability or decisions.</p>

<h2>6. No guarantee of results</h2>
<p>We do not promise any ranking, traffic, sales or ad performance. Forecasts and suggestions are estimates.</p>

<h2>7. Availability and changes</h2>
<p>We aim for a reliable service but do not guarantee uninterrupted operation. We may change or remove features, with notice for material changes.</p>

<h2>8. Liability</h2>
<p>To the extent the law allows, the service is provided "as is", and our total liability for any claim is limited to the fees you paid us in the 12 months before the claim. We are not liable for indirect or lost-profit losses. Nothing here limits liability that cannot be limited by law.</p>

<h2>9. Ending the agreement</h2>
<p>You can stop at any time by uninstalling. We may suspend or end access for breach of these terms or abuse. Data is deleted as described in the Privacy Policy.</p>

<h2>10. Governing law</h2>
<p>These terms are governed by the laws of England and Wales, and the courts of England and Wales have jurisdiction, unless mandatory local consumer law says otherwise.</p>
`;

const privacy = express.Router();
privacy.get('/', (req, res) => res.type('html').send(page('Privacy Policy', PRIVACY)));
const terms = express.Router();
terms.get('/', (req, res) => res.type('html').send(page('Terms of Service', TERMS)));

module.exports = { privacy, terms };
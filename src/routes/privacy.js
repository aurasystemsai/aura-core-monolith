/**
 * Privacy Policy — publicly accessible at GET /privacy
 * Required by Shopify App Store.
 * URL must be entered in the Shopify Partners dashboard under App setup → Privacy policy URL.
 */

const express = require('express');
const router  = express.Router();

const APP_NAME    = 'AURA Systems – Blog SEO Engine';
const APP_URL     = process.env.APP_URL || 'https://aura-core-monolith.onrender.com';
const CONTACT     = process.env.PRIVACY_CONTACT_EMAIL || 'privacy@aurasystems.ai';
const UPDATED     = 'March 1, 2026';

router.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Privacy Policy – ${APP_NAME}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 820px; margin: 0 auto; padding: 40px 24px 80px; color: #1a1a1a; line-height: 1.7; }
    h1 { font-size: 2rem; margin-bottom: 8px; }
    h2 { font-size: 1.2rem; margin-top: 36px; color: #111; }
    p, li { font-size: 0.97rem; color: #333; }
    a { color: #4f46e5; }
    .meta { color: #888; font-size: 0.9rem; margin-bottom: 40px; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 0.9rem; }
    th, td { text-align: left; padding: 10px 14px; border: 1px solid #ddd; }
    th { background: #f5f5f5; }
  </style>
</head>
<body>
  <h1>Privacy Policy</h1>
  <p class="meta">App: <strong>${APP_NAME}</strong> &nbsp;|&nbsp; Last updated: <strong>${UPDATED}</strong></p>

  <h2>1. Who We Are</h2>
  <p>AURA Systems ("we", "our", "us") operates the Shopify embedded app <strong>${APP_NAME}</strong>,
  accessible at <a href="${APP_URL}">${APP_URL}</a>. We are the data controller for the information
  processed through this app.</p>
  <p>Contact: <a href="mailto:${CONTACT}">${CONTACT}</a></p>

  <h2>2. What Data We Collect</h2>
  <table>
    <tr><th>Data</th><th>Why</th><th>Stored?</th></tr>
    <tr><td>Shopify shop domain</td><td>Identify your store, scope all data to your shop</td><td>Yes — server-side, keyed by shop domain</td></tr>
    <tr><td>Shopify OAuth access token</td><td>Make Shopify Admin API calls on your behalf</td><td>Yes — encrypted at rest on our server</td></tr>
    <tr><td>Blog post content (title, body HTML, meta description, URL, author)</td><td>SEO analysis and AI-powered improvements</td><td>Temporarily — processed and discarded; scan results stored per shop</td></tr>
    <tr><td>Product titles / tags</td><td>Keyword suggestions relevant to your store</td><td>No — used in-request only</td></tr>
    <tr><td>Keyword research inputs</td><td>Generate keyword clusters and content briefs</td><td>Yes — stored per shop for your reference</td></tr>
    <tr><td>AI generation history</td><td>Show you what was generated previously</td><td>Yes — stored per shop, deletable on request</td></tr>
  </table>
  <p><strong>We do not collect, store, or process data belonging to your store's customers or end users.</strong>
  All data is scoped to the merchant (shop domain) level.</p>

  <h2>3. How We Use Your Data</h2>
  <ul>
    <li>Providing and improving the SEO analysis, AI rewriting, and schema generation features</li>
    <li>Authenticating requests to the Shopify Admin API to read and update your blog posts</li>
    <li>Storing your scan history, keyword research, and content briefs so you can access them later</li>
    <li>Billing and subscription management via Shopify's native billing system</li>
  </ul>

  <h2>4. Third-Party AI Processing (OpenAI)</h2>
  <p>When you use AI features (content generation, title rewriting, meta descriptions, schema markup, etc.),
  your blog post content and keywords are sent to <strong>OpenAI</strong> for processing. This is required
  to provide the AI functionality.</p>
  <ul>
    <li>OpenAI's Privacy Policy: <a href="https://openai.com/privacy" target="_blank">openai.com/privacy</a></li>
    <li>We use OpenAI's API under a data processing agreement (DPA) — OpenAI does not train on API data by default</li>
    <li>No customer PII or financial data is ever sent to OpenAI</li>
  </ul>

  <h2>5. Data Retention</h2>
  <ul>
    <li><strong>OAuth tokens:</strong> Retained while the app is installed. Deleted on uninstall (shop/redact webhook).</li>
    <li><strong>Scan history, keyword research, content briefs:</strong> Retained while the app is installed. Deleted on uninstall.</li>
    <li><strong>AI generation inputs/outputs:</strong> Not retained beyond the immediate request unless saved to your history.</li>
  </ul>

  <h2>6. Data Sharing</h2>
  <p>We do not sell, rent, or share your data with third parties except:</p>
  <ul>
    <li><strong>OpenAI</strong> — for AI feature processing (see Section 4)</li>
    <li><strong>Shopify</strong> — billing and subscription data is managed through Shopify's native billing</li>
    <li><strong>Render.com</strong> — our cloud hosting provider, where data is stored and processed</li>
    <li>Legal obligation — if required by law or to protect our rights</li>
  </ul>

  <h2>7. Your Rights (GDPR / CCPA)</h2>
  <p>If you are in the EEA, UK, or California, you have the right to:</p>
  <ul>
    <li>Access the data we hold about your shop</li>
    <li>Request correction of inaccurate data</li>
    <li>Request deletion of your data (uninstalling the app triggers automatic deletion)</li>
    <li>Object to or restrict processing</li>
    <li>Data portability</li>
  </ul>
  <p>To exercise these rights, email <a href="mailto:${CONTACT}">${CONTACT}</a>.</p>

  <h2>8. GDPR Compliance (Shopify Mandatory Webhooks)</h2>
  <p>This app implements all three Shopify mandatory GDPR webhook endpoints:</p>
  <ul>
    <li><code>customers/data_request</code> — we confirm we hold no customer PII</li>
    <li><code>customers/redact</code> — acknowledged (no customer data held)</li>
    <li><code>shop/redact</code> — deletes all shop data on uninstall</li>
  </ul>

  <h2>9. Security</h2>
  <ul>
    <li>All data is transmitted over HTTPS (TLS 1.2+)</li>
    <li>Shopify session tokens are verified on every API request using Shopify's HMAC verification</li>
    <li>OAuth tokens are stored server-side and never exposed to the browser</li>
    <li>All API endpoints require a valid Shopify session — no public data access</li>
  </ul>

  <h2>10. Changes to This Policy</h2>
  <p>We may update this policy. Significant changes will be communicated via the Shopify app listing.
  Continued use of the app after changes constitutes acceptance.</p>

  <h2>11. Contact</h2>
  <p>For privacy-related questions or data requests:<br/>
  Email: <a href="mailto:${CONTACT}">${CONTACT}</a></p>
</body>
</html>`);
});

module.exports = router;

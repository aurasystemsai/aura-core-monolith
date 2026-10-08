// Per-shop data privacy helpers used by Shopify's mandatory GDPR webhooks. Per-shop data lives in JSON files named
// <tool>-<shop>.json (see shopStore), so a shop's data is every file whose name ends with its safe shop name.
const fs = require('fs');
const path = require('path');

const dir = () => process.env.AURA_DATA_DIR || path.join(__dirname, '..', '..', 'data');
const safe = (shop) => String(shop).toLowerCase().replace(/[^a-z0-9.-]/g, '_');

function shopFiles(shop) {
  const s = safe(shop);
  if (!s || s === 'unknown') return [];
  let names = [];
  try { names = fs.readdirSync(dir()); } catch { return []; }
  return names.filter((n) => n.toLowerCase().endsWith(`-${s}.json`) || n.toLowerCase().endsWith(`-${s.replace(/\./g, '_')}.json`)).map((n) => path.join(dir(), n));
}

function deleteShopData(shop) {
  const files = shopFiles(shop);
  files.forEach((f) => { try { fs.unlinkSync(f); } catch { /* already gone */ } });
  return files.length;
}

const mentions = (item, needles) => { const t = JSON.stringify(item).toLowerCase(); return needles.some((n) => t.includes(n)); };
const needlesFor = (c) => [c && c.email, c && c.id && `gid://shopify/customer/${c.id}`, c && c.phone].filter(Boolean).map((v) => String(v).toLowerCase());

// Walks stored JSON; array items that mention the customer are collected (export) or dropped (redact).
function walk(node, needles, redact, found) {
  if (Array.isArray(node)) {
    const keep = [];
    node.forEach((item) => {
      if (item && typeof item === 'object' && mentions(item, needles)) { found.count++; if (!redact) keep.push(item); } else keep.push(walk(item, needles, redact, found));
    });
    return keep;
  }
  if (node && typeof node === 'object') { Object.keys(node).forEach((k) => { node[k] = walk(node[k], needles, redact, found); }); }
  return node;
}

function scan(shop, customer, redact) {
  const needles = needlesFor(customer); const out = []; if (!needles.length) return out;
  shopFiles(shop).forEach((f) => {
    let data; try { data = JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return; }
    const found = { count: 0 };
    const next = walk(data, needles, redact, found);
    if (found.count) {
      out.push({ file: path.basename(f), records: found.count });
      if (redact) fs.writeFileSync(f, JSON.stringify(next));
    }
  });
  return out;
}

module.exports = { shopFiles, deleteShopData, exportCustomer: (shop, c) => scan(shop, c, false), redactCustomer: (shop, c) => scan(shop, c, true) };
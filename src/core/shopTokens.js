// src/core/shopTokens.js
// Simple storage for Shopify admin tokens (SQLite)
const db = require("./db");

db.prepare(`
  CREATE TABLE IF NOT EXISTS shop_tokens (
    shop TEXT PRIMARY KEY,
    token TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )
`).run();

function now() {
  return new Date().toISOString();
}

function upsertToken(shop, token) {
  const s = String(shop || "").trim();
  if (!s) throw new Error("shop is required");
  const t = String(token || "").trim();
  if (!t) throw new Error("token is required");

  const existing = db
    .prepare(`SELECT shop FROM shop_tokens WHERE shop = ?`)
    .get(s);

  if (existing) {
    db.prepare(`UPDATE shop_tokens SET token = @token, updated_at = @updated_at WHERE shop = @shop`).run({
      token: t,
      updated_at: now(),
      shop: s,
    });
  } else {
    db.prepare(`INSERT INTO shop_tokens (shop, token, created_at, updated_at) VALUES (@shop, @token, @created_at, @updated_at)`).run({
      shop: s,
      token: t,
      created_at: now(),
      updated_at: now(),
    });
  }
  return { shop: s, token: t };
}

function getToken(shop) {
  const s = String(shop || "").trim();
  if (!s) return null;
  const row = db.prepare(`SELECT shop, token, created_at, updated_at FROM shop_tokens WHERE shop = ?`).get(s);
  return row || null;
}

module.exports = {
  upsertToken,
  getToken,
};

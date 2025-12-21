// src/core/shopTokens.js
// Storage for Shopify admin tokens (SQLite) with optional encryption at rest.
const db = require("./db");
const crypto = require("crypto");

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

const ENCRYPTION_KEY = process.env.SHOP_TOKEN_ENCRYPTION_KEY || null; // 32-byte key recommended
const ALGORITHM = "aes-256-gcm";

function encrypt(plaintext) {
  if (!ENCRYPTION_KEY) return plaintext;
  const iv = crypto.randomBytes(12);
  const key = Buffer.from(ENCRYPTION_KEY, "hex");
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}.${tag.toString("hex")}.${encrypted.toString("hex")}`;
}

function decrypt(ciphertext) {
  if (!ENCRYPTION_KEY) return ciphertext;
  if (!ciphertext) return ciphertext;
  try {
    const [ivHex, tagHex, encHex] = String(ciphertext).split(".");
    const iv = Buffer.from(ivHex, "hex");
    const tag = Buffer.from(tagHex, "hex");
    const encrypted = Buffer.from(encHex, "hex");
    const key = Buffer.from(ENCRYPTION_KEY, "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString("utf8");
  } catch (err) {
    console.error("Failed to decrypt shop token", err);
    // If decryption fails, return raw value so caller can see it (but log error)
    return ciphertext;
  }
}

function upsertToken(shop, token) {
  const s = String(shop || "").trim();
  if (!s) throw new Error("shop is required");
  const t = String(token || "").trim();
  if (!t) throw new Error("token is required");

  const stored = encrypt(t);

  const existing = db
    .prepare(`SELECT shop FROM shop_tokens WHERE shop = ?`)
    .get(s);

  if (existing) {
    db.prepare(`UPDATE shop_tokens SET token = @token, updated_at = @updated_at WHERE shop = @shop`).run({
      token: stored,
      updated_at: now(),
      shop: s,
    });
  } else {
    db.prepare(`INSERT INTO shop_tokens (shop, token, created_at, updated_at) VALUES (@shop, @token, @created_at, @updated_at)`).run({
      shop: s,
      token: stored,
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
  if (!row) return null;
  return {
    shop: row.shop,
    token: decrypt(row.token),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function listTokens() {
  const rows = db.prepare(`SELECT shop, token, created_at, updated_at FROM shop_tokens ORDER BY created_at DESC`).all();
  return rows.map((r) => ({
    shop: r.shop,
    tokenEncrypted: Boolean(ENCRYPTION_KEY) ? true : false,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

module.exports = {
  upsertToken,
  getToken,
  listTokens,
};

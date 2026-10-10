'use strict';

// One API key per shop for the read-only public API. The key is shown once when it is made; only a SHA-256 hash is
// stored, so a leaked data file cannot be used to call the API. Uninstalling removes the shop's token, which also
// stops its key working.
const crypto = require('crypto');
const store = require('./shopStore');
const shopTokens = require('./shopTokens');

const TOOL = 'api-keys';
const INDEX = 'api-key-index';
const INDEX_OWNER = 'all';
const PREFIX = 'aura_live_';

const hashOf = (key) => crypto.createHash('sha256').update(String(key)).digest('hex');
const index = () => store.read(INDEX, INDEX_OWNER, {});

function status(shop) {
  const rec = store.read(TOOL, shop, null);
  return rec ? { exists: true, hint: rec.hint, createdAt: rec.createdAt, lastUsedAt: rec.lastUsedAt || null } : { exists: false };
}

// Makes a new key, replacing any old one. The plain key is returned here and never stored.
function regenerate(shop) {
  const key = PREFIX + crypto.randomBytes(24).toString('base64url');
  const idx = index();
  const old = store.read(TOOL, shop, null);
  if (old) delete idx[old.secretHash];
  const hash = hashOf(key);
  idx[hash] = shop;
  store.write(INDEX, INDEX_OWNER, idx);
  store.write(TOOL, shop, { secretHash: hash, hint: key.slice(-4), createdAt: new Date().toISOString(), lastUsedAt: null });
  return key;
}

function revoke(shop) {
  const old = store.read(TOOL, shop, null);
  if (!old) return false;
  const idx = index();
  delete idx[old.secretHash];
  store.write(INDEX, INDEX_OWNER, idx);
  store.write(TOOL, shop, null);
  return true;
}

// Returns the shop a key belongs to, or null when the key is unknown, replaced or the app was uninstalled.
function verify(key) {
  if (typeof key !== 'string' || !key.startsWith(PREFIX) || key.length > 100) return null;
  const hash = hashOf(key);
  const shop = index()[hash];
  if (!shop) return null;
  const rec = store.read(TOOL, shop, null);
  if (!rec || rec.secretHash !== hash || !shopTokens.getToken(shop)) return null;
  return shop;
}

function touch(shop) {
  const rec = store.read(TOOL, shop, null);
  if (!rec) return;
  const now = Date.now();
  if (rec.lastUsedAt && now - new Date(rec.lastUsedAt).getTime() < 60000) return;
  rec.lastUsedAt = new Date(now).toISOString();
  store.write(TOOL, shop, rec);
}

module.exports = { status, regenerate, revoke, verify, touch };

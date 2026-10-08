'use strict';

const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.AURA_DATA_DIR || path.join(__dirname, '..', '..', 'data');

function fileFor(tool, shop) {
  const safeShop = String(shop).toLowerCase().replace(/[^a-z0-9.-]/g, '_');
  return path.join(DATA_DIR, `${tool}-${safeShop}.json`);
}

function read(tool, shop, fallback) {
  try {
    return JSON.parse(fs.readFileSync(fileFor(tool, shop), 'utf8'));
  } catch {
    return fallback;
  }
}

function write(tool, shop, value) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const target = fileFor(tool, shop);
  const tmp = `${target}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(value));
  fs.renameSync(tmp, target);
}

/** Prepend an entry to a capped list stored for the shop. */
function pushCapped(tool, shop, entry, cap = 50) {
  const list = read(tool, shop, []);
  list.unshift(entry);
  write(tool, shop, list.slice(0, cap));
  return list[0];
}

module.exports = { read, write, pushCapped };

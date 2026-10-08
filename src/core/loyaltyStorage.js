'use strict';

const fs = require('fs');
const path = require('path');

function safeSegment(value, label) {
  const segment = String(value || '').toLowerCase().replace(/[^a-z0-9.-]/g, '_').replace(/^\.+|\.+$/g, '');
  if (!segment) throw new Error(`${label} is required`);
  return segment;
}

function createLoyaltyStorage(baseDir = path.join(__dirname, '../../data/loyalty-referral')) {
  function fileFor(key, shopId) {
    const safeKey = safeSegment(key, 'storage key');
    const safeShop = safeSegment(shopId, 'shop id');
    return path.join(baseDir, safeShop, `${safeKey}.json`);
  }

  return {
    get(key, shopId, fallback = null) {
      try {
        return JSON.parse(fs.readFileSync(fileFor(key, shopId), 'utf8'));
      } catch (err) {
        if (err.code === 'ENOENT') return fallback;
        throw err;
      }
    },
    set(key, value, shopId) {
      const filePath = fileFor(key, shopId);
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      const temporaryPath = `${filePath}.${process.pid}.tmp`;
      fs.writeFileSync(temporaryPath, JSON.stringify(value, null, 2), 'utf8');
      fs.renameSync(temporaryPath, filePath);
      return true;
    },
  };
}

module.exports = { createLoyaltyStorage };
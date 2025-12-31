// Self-serve API key management for winback
let apiKeys = [];
function createKey(userId) {
  const key = require('crypto').randomBytes(32).toString('hex');
  apiKeys.push({ userId, key, created: new Date() });
  return key;
}
function revokeKey(key) {
  apiKeys = apiKeys.filter(k => k.key !== key);
}
function listKeys(userId) {
  return apiKeys.filter(k => k.userId === userId);
}
function validateKey(key) {
  return apiKeys.some(k => k.key === key);
}
module.exports = { createKey, revokeKey, listKeys, validateKey };

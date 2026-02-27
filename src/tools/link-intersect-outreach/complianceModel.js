module.exports = {
  get: () => ({ gdpr: true, ccpa: true, updatedAt: new Date().toISOString() }),
};

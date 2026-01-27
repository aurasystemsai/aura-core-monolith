// Compliance model for Klaviyo Flow Automation
module.exports = {
  get: () => ({
    gdpr: true,
    ccpa: true,
    auditLog: true,
    retentionDays: 365,
  })
};

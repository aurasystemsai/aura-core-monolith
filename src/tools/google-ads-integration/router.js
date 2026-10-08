const { connectRouter } = require('../../core/connectStub');
module.exports = connectRouter({ name: 'Google Ads', description: 'Connect your Google Ads account so AURA can read campaign spend and results and suggest changes.', needs: ['A Google Ads account', 'A Google Ads developer token', 'Google OAuth consent for the Ads API'] });

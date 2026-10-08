const { connectRouter } = require('../../core/connectStub');
module.exports = connectRouter({ name: 'Ads Anomaly Guard', description: 'Watches ad spend for sudden jumps. It needs at least one ad account connected first (Google, Meta or TikTok).', needs: ['At least one connected ad platform'] });

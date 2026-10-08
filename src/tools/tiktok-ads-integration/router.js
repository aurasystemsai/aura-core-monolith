const { connectRouter } = require('../../core/connectStub');
module.exports = connectRouter({ name: 'TikTok Ads', description: 'Connect your TikTok ad account so AURA can read campaign spend and results and suggest changes.', needs: ['A TikTok Ads Manager account', 'A TikTok Marketing API app'] });

const { connectRouter } = require('../../core/connectStub');
module.exports = connectRouter({ name: 'Ad Creative Optimizer', description: 'Compares ad creatives by real results. It needs at least one ad account connected first (Google, Meta or TikTok).', needs: ['At least one connected ad platform'] });

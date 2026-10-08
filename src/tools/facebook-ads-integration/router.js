const { connectRouter } = require('../../core/connectStub');
module.exports = connectRouter({ name: 'Facebook & Instagram Ads', description: 'Connect your Meta ad account so AURA can read campaign spend and results and suggest changes.', needs: ['A Meta Business ad account', 'A Meta app with the ads_read permission'] });

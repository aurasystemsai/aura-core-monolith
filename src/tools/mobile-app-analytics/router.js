const { connectRouter } = require('../../core/connectStub');
module.exports = connectRouter({ name: 'Mobile App Analytics', description: 'Shows retention, screens and crashes for your mobile app. It needs an app analytics source (for example Firebase) connected first.', needs: ['A mobile app', 'An analytics source such as Firebase'] });

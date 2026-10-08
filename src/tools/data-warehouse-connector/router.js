const { connectRouter } = require('../../core/connectStub');
module.exports = connectRouter({ name: 'Data Warehouse Connector', description: 'Send your store data to Snowflake, BigQuery or Redshift. It needs your warehouse credentials and a hosted server that can run scheduled syncs.', needs: ['Warehouse account and credentials', 'A hosted server that runs scheduled jobs'] });

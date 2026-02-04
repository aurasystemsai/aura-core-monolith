const db = require('./db');

module.exports = {
  list: async () => db.listRuns(),
  add: async run => db.addRun(run)
};

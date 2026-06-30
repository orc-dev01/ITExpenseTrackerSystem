require('../config/env');

const dummyStore = require('./dummy-store');

const useSqlServer =
  String(process.env.DATA_STORE || '').toLowerCase() === 'sqlserver' ||
  Boolean(process.env.DB_SERVER && process.env.DB_USER && process.env.DB_PASSWORD);

module.exports = useSqlServer ? require('./sql-store') : dummyStore;

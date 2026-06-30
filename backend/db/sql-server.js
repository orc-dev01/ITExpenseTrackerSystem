require('../config/env');

const sql = require('mssql');
const { boolEnv } = require('../config/env');

let poolPromise;

function parseServer(value) {
  const server = String(value || 'localhost');
  const [host, instanceName] = server.split('\\');
  return {
    host,
    instanceName
  };
}

function sqlConfig() {
  const { host, instanceName } = parseServer(process.env.DB_SERVER);
  const options = {
    encrypt: boolEnv('DB_ENCRYPT', false),
    trustServerCertificate: boolEnv('DB_TRUST_SERVER_CERTIFICATE', true),
    enableArithAbort: true
  };

  if (instanceName) {
    options.instanceName = instanceName;
  }

  const config = {
    server: host,
    database: process.env.DB_NAME || 'ITExpense',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    options,
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000
    }
  };

  if (!instanceName && process.env.DB_PORT) {
    config.port = Number(process.env.DB_PORT);
  }

  return config;
}

function getPool() {
  if (!poolPromise) {
    poolPromise = sql.connect(sqlConfig());
  }

  return poolPromise;
}

async function query(text, inputs = {}) {
  const pool = await getPool();
  const request = pool.request();

  for (const [name, input] of Object.entries(inputs)) {
    if (Array.isArray(input)) {
      request.input(name, input[0], input[1]);
    } else {
      request.input(name, input);
    }
  }

  return request.query(text);
}

async function transaction(work) {
  const pool = await getPool();
  const tx = new sql.Transaction(pool);
  await tx.begin();

  try {
    const result = await work(tx);
    await tx.commit();
    return result;
  } catch (error) {
    await tx.rollback();
    throw error;
  }
}

function txRequest(tx) {
  return new sql.Request(tx);
}

module.exports = {
  sql,
  getPool,
  query,
  transaction,
  txRequest
};

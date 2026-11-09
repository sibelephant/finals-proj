require('dotenv').config({ quiet: true });

const base = {
  username: process.env.DB_USER || process.env.POSTGRES_USER || 'postgres',
  password: process.env.DB_PASSWORD || process.env.POSTGRES_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'etax_filing',
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 5432),
  dialect: 'postgres',
  logging: false,
};

// Render (and most managed Postgres providers) require SSL.
// Activate automatically when DATABASE_URL is present or DB_SSL=true.
const needsSSL = process.env.DB_SSL === 'true' || !!process.env.DATABASE_URL;
const sslOptions = needsSSL
  ? { ssl: { require: true, rejectUnauthorized: false } }
  : {};

module.exports = {
  development: base,
  test: {
    ...base,
    database: process.env.DB_TEST_NAME || 'etax_filing_test',
    logging: false,
  },
  production: {
    ...base,
    use_env_variable: process.env.DATABASE_URL ? 'DATABASE_URL' : undefined,
    dialectOptions: sslOptions,
  },
};

import app from './app.js';
import { sequelize } from './models/index.js';

const port = Number(process.env.PORT || 4000);

// Validate required environment variables at startup
const jwtSecret = process.env.JWT_SECRET || '';
if (!jwtSecret) {
  console.error('ERROR: JWT_SECRET environment variable is required but not set.');
  console.error('Please set JWT_SECRET before starting the server.');
  process.exit(1);
}

// Refuse a weak or placeholder secret, because anyone who knows it can mint an
// admin token. Tracked in .env.example, so it has to be detected explicitly.
const INSECURE_SECRETS = new Set([
  'replace-with-a-long-random-secret',
  'replace-with-a-long-random-secret ',
  'changeme',
  'secret',
  'your-secret-here',
]);
if (jwtSecret.length < 32 || INSECURE_SECRETS.has(jwtSecret.toLowerCase())) {
  console.error('ERROR: JWT_SECRET must be at least 32 characters and not a placeholder value.');
  console.error('Generate one with: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"');
  process.exit(1);
}

try {
  await sequelize.authenticate();
  app.listen(port, () => {
    console.log(`E-Tax API listening on http://localhost:${port}`);
  });
} catch (error) {
  console.error('Failed to start API server:', error.message);
  process.exit(1);
}

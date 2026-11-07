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

// --- Graceful shutdown & crash safety ---
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

let server;

function gracefulShutdown(signal) {
  console.log(`\n${signal} received — shutting down gracefully…`);
  if (server) {
    server.close(() => {
      sequelize.close().then(() => {
        console.log('Database connections closed.');
        process.exit(0);
      });
    });
    // Force exit after 10 s if connections are not drained
    setTimeout(() => {
      console.error('Could not close connections in time — forcing exit.');
      process.exit(1);
    }, 10_000);
  } else {
    process.exit(0);
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

try {
  await sequelize.authenticate();
  server = app.listen(port, () => {
    console.log(`E-Tax API listening on http://localhost:${port}`);
  });
} catch (error) {
  console.error('Failed to start API server:', error.message);
  process.exit(1);
}

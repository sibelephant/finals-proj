import app from './app.js';
import { sequelize } from './models/index.js';

const port = Number(process.env.PORT || 4000);

// Validate required environment variables at startup
if (!process.env.JWT_SECRET) {
  console.error('ERROR: JWT_SECRET environment variable is required but not set.');
  console.error('Please set JWT_SECRET before starting the server.');
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

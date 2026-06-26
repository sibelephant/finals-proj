import app from './app.js';
import { sequelize } from './models/index.js';

const port = Number(process.env.PORT || 4000);

try {
  await sequelize.authenticate();
  app.listen(port, () => {
    console.log(`E-Tax API listening on http://localhost:${port}`);
  });
} catch (error) {
  console.error('Failed to start API server:', error.message);
  process.exit(1);
}

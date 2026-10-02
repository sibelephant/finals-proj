import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import adminRoutes from './routes/admin.js';
import authRoutes from './routes/auth.js';
import bankStatementRoutes from './routes/bank-statements.js';
import documentRoutes from './routes/documents.js';
import paymentRoutes from './routes/payments.js';
import returnRoutes from './routes/returns.js';
import userRoutes from './routes/users.js';

dotenv.config({ quiet: true });

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '64kb' }));

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.use('/api/auth', authRoutes);
app.use('/api/returns', returnRoutes);
app.use('/api/users', userRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/bank-statements', bankStatementRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Resource not found.' });
});

// Translate database errors into honest status codes instead of a blanket 500,
// so a duplicate filing or an out of range amount is a client mistake.
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);

  if (err.status) {
    return res.status(err.status).json({ message: err.message });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({ message: 'That record already exists.' });
  }
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({ message: 'The submitted data is not valid.' });
  }
  if (err.name === 'RangeError' || err.name === 'SequelizeDatabaseError') {
    return res.status(400).json({ message: 'The submitted data is out of range.' });
  }

  console.error(err);
  return res.status(500).json({ message: 'Unexpected server error.' });
});

export default app;

import { Router } from 'express';
import multer from 'multer';
import { Op } from 'sequelize';
import models, { sequelize } from '../models/index.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { parseBankStatementCSV } from '../logic/bankStatementParser.js';
import { serializeTransaction } from '../utils/serialize.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are accepted.'));
    }
  },
});

router.post('/upload', requireAuth, requireRole('taxpayer'), (req, res, next) => {
  upload.single('file')(req, res, async (err) => {
    if (err) return res.status(400).json({ message: err.message });

    if (!req.file) return res.status(400).json({ message: 'No CSV file provided.' });

    try {
      const csvText = req.file.buffer.toString('utf-8');
      const result = parseBankStatementCSV(csvText);

      if (result.error) {
        return res.status(422).json({ message: result.error, errors: [] });
      }

      if (!result.transactions.length) {
        return res.status(422).json({ message: 'No transactions could be parsed from the file.', errors: result.errors ?? [] });
      }

      // Re-uploading the same statement must not double the user's income.
      // ponytail: source_file plus row number is the natural key. Add a
      // fingerprint column if statements ever need importing twice on purpose.
      const rows = result.transactions.map((t, index) => ({
        userId: req.auth.sub,
        ...t,
        sourceFile: req.file.originalname,
        sourceRow: index + 1,
      }));

      const created = await sequelize.transaction(async (transaction) => {
        const names = [...new Set(rows.map((r) => r.sourceFile))];
        const previous = await models.BankTransaction.findAll({
          where: { userId: req.auth.sub, sourceFile: { [Op.in]: names } },
          attributes: ['sourceFile', 'sourceRow'],
          transaction,
        });
        const seen = new Set(previous.map((t) => `${t.sourceFile}#${t.sourceRow}`));

        const fresh = rows.filter((r) => {
          const key = `${r.sourceFile}#${r.sourceRow}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        if (!fresh.length) return [];

        await models.BankTransaction.bulkCreate(fresh, { transaction });
        return models.BankTransaction.findAll({
          where: { userId: req.auth.sub, sourceFile: { [Op.in]: names } },
          order: [['transactionDate', 'DESC']],
          transaction,
        });
      });

      return res.status(201).json({
        transactions: created.map(serializeTransaction),
        summary: result.summary,
        errors: result.errors ?? [],
      });
    } catch (error) {
      return next(error);
    }
  });
});

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const where = req.auth.role === 'admin' ? {} : { userId: req.auth.sub };
    const transactions = await models.BankTransaction.findAll({
      where,
      order: [['transactionDate', 'DESC']],
    });
    return res.json({ transactions: transactions.map(serializeTransaction) });
  } catch (error) {
    return next(error);
  }
});

router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const transaction = await models.BankTransaction.findByPk(req.params.id);
    if (!transaction) return res.status(404).json({ message: 'Transaction not found.' });
    if (req.auth.role !== 'admin' && transaction.userId !== req.auth.sub) {
      return res.status(403).json({ message: 'You are not allowed to delete this transaction.' });
    }
    await transaction.destroy();
    return res.json({ message: 'Transaction deleted.' });
  } catch (error) {
    return next(error);
  }
});

export default router;

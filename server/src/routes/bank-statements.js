import { Router } from 'express';
import multer from 'multer';
import models from '../models/index.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { parseBankStatementCSV } from '../logic/bankStatementParser.js';

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

      if (!result.transactions.length) {
        return res.status(422).json({ message: 'No transactions could be parsed from the file.', errors: result.errors });
      }

      const created = await models.BankTransaction.bulkCreate(
        result.transactions.map((t) => ({
          userId: req.auth.sub,
          ...t,
          sourceFile: req.file.originalname,
        })),
      );

      return res.status(201).json({
        transactions: created.map(serializeTransaction),
        summary: result.summary,
        errors: result.errors,
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

function serializeTransaction(t) {
  return {
    id: t.id,
    transactionDate: t.transactionDate,
    narration: t.narration,
    debit: Number(t.debit),
    credit: Number(t.credit),
    balance: t.balance !== null ? Number(t.balance) : null,
    category: t.category,
    sourceFile: t.sourceFile,
    createdAt: t.createdAt,
  };
}

export default router;

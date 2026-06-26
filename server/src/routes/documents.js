import { Router } from 'express';
import models from '../models/index.js';
import { buildReceiptData, buildTCCData } from '../logic/documents.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { streamPdf } from '../utils/pdf.js';

const router = Router();

router.get('/:returnId/receipt', requireAuth, requireRole('taxpayer'), async (req, res, next) => {
  try {
    const data = await loadPaidReturn(req.params.returnId, req.auth.sub);
    if (!data) return res.status(404).json({ message: 'Paid tax return not found.' });
    const receipt = buildReceiptData(data.taxReturn, data.payment);
    return streamPdf(res, 'Tax Payment Receipt', Object.entries(receipt));
  } catch (error) {
    return next(error);
  }
});

router.get('/:returnId/tcc', requireAuth, requireRole('taxpayer'), async (req, res, next) => {
  try {
    const data = await loadPaidReturn(req.params.returnId, req.auth.sub);
    if (!data) return res.status(404).json({ message: 'Paid tax return not found.' });
    const tcc = buildTCCData(data.taxReturn, data.payment);
    return streamPdf(res, 'Tax Clearance Certificate', Object.entries(tcc));
  } catch (error) {
    return next(error);
  }
});

async function loadPaidReturn(returnId, userId) {
  const record = await models.TaxReturn.findOne({
    where: { id: returnId, userId },
    include: [
      { model: models.User, as: 'user' },
      { model: models.Payment, as: 'payment' },
    ],
  });
  if (!record?.payment) return null;
  return {
    taxReturn: {
      id: record.id,
      taxpayerName: record.user.fullName,
      tin: record.user.tin,
      filingYear: record.filingYear,
    },
    payment: {
      amount: Number(record.payment.amount),
      paymentReference: record.payment.paymentReference,
      paymentStatus: record.payment.paymentStatus,
      paidAt: record.payment.paidAt,
    },
  };
}

export default router;

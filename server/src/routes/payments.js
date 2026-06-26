import { Router } from 'express';
import models, { sequelize } from '../models/index.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { serializePayment, serializeTaxReturn } from '../utils/serialize.js';

const router = Router();

router.post('/', requireAuth, requireRole('taxpayer'), async (req, res, next) => {
  try {
    const taxReturn = await models.TaxReturn.findByPk(req.body.taxReturnId);
    if (!taxReturn) return res.status(404).json({ message: 'Tax return not found.' });
    if (taxReturn.userId !== req.auth.sub) return res.status(403).json({ message: 'You cannot pay for another taxpayer return.' });

    const paidAt = new Date();
    const payment = await sequelize.transaction(async (transaction) => {
      const created = await models.Payment.create(
        {
          taxReturnId: taxReturn.id,
          amount: taxReturn.taxPayable,
          paymentReference: `PAY-ETAX-${Date.now()}`,
          paymentStatus: 'successful',
          paidAt,
        },
        { transaction },
      );
      await taxReturn.update({ filingStatus: 'paid', paidAt }, { transaction });
      await models.User.update({ complianceStatus: 'compliant' }, { where: { id: taxReturn.userId }, transaction });
      return created;
    });

    return res.status(201).json({ payment: serializePayment(payment), taxReturn: serializeTaxReturn(await taxReturn.reload()) });
  } catch (error) {
    return next(error);
  }
});

export default router;

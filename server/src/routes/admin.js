import { Router } from 'express';
import { Op } from 'sequelize';
import models from '../models/index.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { serializeTaxReturn, serializeUser } from '../utils/serialize.js';

const router = Router();

router.use(requireAuth, requireRole('admin'));

router.get('/taxpayers', async (req, res, next) => {
  try {
    const taxpayers = await models.User.findAll({
      where: { role: 'taxpayer' },
      order: [['createdAt', 'DESC']],
    });
    return res.json({ taxpayers: taxpayers.map(serializeUser) });
  } catch (error) {
    return next(error);
  }
});

router.get('/taxpayers/:id', async (req, res, next) => {
  try {
    const user = await models.User.findByPk(req.params.id, {
      include: [{ model: models.TaxReturn, as: 'taxReturns' }],
    });
    if (!user || user.role !== 'taxpayer') return res.status(404).json({ message: 'Taxpayer not found.' });
    return res.json({ user: serializeUser(user), returns: user.taxReturns.map(serializeTaxReturn) });
  } catch (error) {
    return next(error);
  }
});

router.get('/reports', async (req, res, next) => {
  try {
    const [totalTaxpayers, paidReturns, pendingReturns, payments] = await Promise.all([
      models.User.count({ where: { role: 'taxpayer' } }),
      models.TaxReturn.count({ where: { filingStatus: 'paid' } }),
      models.TaxReturn.count({ where: { filingStatus: { [Op.ne]: 'paid' } } }),
      models.Payment.findAll(),
    ]);
    const totalRevenue = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
    const revenueByPeriod = buildRevenueByPeriod(payments);
    const complianceRate = totalTaxpayers === 0 ? 0 : Math.round((paidReturns / totalTaxpayers) * 100);
    return res.json({ totalTaxpayers, totalRevenue, complianceRate, pendingReturns, paidReturns, revenueByPeriod });
  } catch (error) {
    return next(error);
  }
});

function buildRevenueByPeriod(payments) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const totals = months.map((period) => ({ period, amount: 0 }));
  payments.forEach((payment) => {
    const index = new Date(payment.paidAt).getMonth();
    totals[index].amount += Number(payment.amount);
  });
  return totals.slice(0, 6);
}

export default router;

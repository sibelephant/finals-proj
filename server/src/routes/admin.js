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
    return res.json({ user: await serializeUser(user), returns: user.taxReturns.map(serializeTaxReturn) });
  } catch (error) {
    return next(error);
  }
});

router.get('/reports', async (req, res, next) => {
  try {
    const [totalTaxpayers, distinctCompliantTaxpayers, pendingReturns, payments] = await Promise.all([
      models.User.count({ where: { role: 'taxpayer' } }),
      models.TaxReturn.count({
        distinct: true,
        col: 'user_id',
        where: { filingStatus: 'paid' }
      }),
      models.TaxReturn.count({ where: { filingStatus: { [Op.ne]: 'paid' } } }),
      models.Payment.findAll(),
    ]);
    
    // Count total paid returns for backward compatibility
    const paidReturns = await models.TaxReturn.count({ where: { filingStatus: 'paid' } });
    
    const totalRevenue = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
    const revenueByPeriod = buildRevenueByPeriod(payments);
    const complianceRate = totalTaxpayers === 0 ? 0 : Math.round((distinctCompliantTaxpayers / totalTaxpayers) * 100);
    
    return res.json({ totalTaxpayers, totalRevenue, complianceRate, pendingReturns, paidReturns, revenueByPeriod });
  } catch (error) {
    return next(error);
  }
});

function buildRevenueByPeriod(payments) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date();
  const currentMonth = now.getMonth();
  
  // Create rolling 6-month window ending at current month
  const revenueByMonth = {};
  
  // Initialize last 6 months (including current)
  for (let i = 5; i >= 0; i--) {
    const monthIndex = (currentMonth - i + 12) % 12;
    const year = now.getFullYear() - (currentMonth - i < 0 ? 1 : 0);
    const key = `${year}-${monthIndex}`;
    revenueByMonth[key] = { period: months[monthIndex], amount: 0 };
  }
  
  payments.forEach((payment) => {
    const paymentDate = new Date(payment.paidAt);
    const paymentMonth = paymentDate.getMonth();
    const paymentYear = paymentDate.getFullYear();
    const key = `${paymentYear}-${paymentMonth}`;
    
    if (revenueByMonth[key]) {
      revenueByMonth[key].amount += Number(payment.amount);
    }
  });
  
  return Object.values(revenueByMonth);
}

export default router;

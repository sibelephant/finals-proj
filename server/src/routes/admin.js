import { Router } from 'express';
import { Op, fn, col, literal } from 'sequelize';
import models, { sequelize } from '../models/index.js';
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
    await models.AdminLog.create({ userId: req.auth.sub, action: 'LIST_TAXPAYERS', metadata: { count: taxpayers.length } });
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
    await models.AdminLog.create({ userId: req.auth.sub, action: 'VIEW_TAXPAYER', metadata: { targetUserId: req.params.id } });
    return res.json({ user: await serializeUser(user), returns: user.taxReturns.map(serializeTaxReturn) });
  } catch (error) {
    return next(error);
  }
});

router.get('/reports', async (req, res, next) => {
  try {
    // Compute a 6-month window at the DB level
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const [totalTaxpayers, distinctCompliantTaxpayers, pendingReturns, paidReturns, totalRevenue, revenueByPeriod] =
      await Promise.all([
        models.User.count({ where: { role: 'taxpayer' } }),
        models.TaxReturn.count({
          distinct: true,
          col: 'user_id',
          where: { filingStatus: 'paid' },
        }),
        models.TaxReturn.count({ where: { filingStatus: { [Op.ne]: 'paid' } } }),
        models.TaxReturn.count({ where: { filingStatus: 'paid' } }),
        models.Payment.sum('amount'),
        // Aggregate payments by month directly in the database
        models.Payment.findAll({
          attributes: [
            [fn('DATE_TRUNC', 'month', col('paid_at')), 'month'],
            [fn('SUM', col('amount')), 'total'],
          ],
          where: { paid_at: { [Op.gte]: sixMonthsAgo } },
          group: [fn('DATE_TRUNC', 'month', col('paid_at'))],
          order: [[fn('DATE_TRUNC', 'month', col('paid_at')), 'ASC']],
          raw: true,
        }),
      ]);

    const complianceRate =
      totalTaxpayers === 0 ? 0 : Math.round((distinctCompliantTaxpayers / totalTaxpayers) * 100);

    await models.AdminLog.create({ userId: req.auth.sub, action: 'VIEW_REPORTS', metadata: {} });
    return res.json({
      totalRevenue: Number(totalRevenue || 0),
      complianceRate,
      pendingReturns,
      paidReturns,
      revenueByPeriod: buildRevenueByPeriod(revenueByPeriod, now),
    });
  } catch (error) {
    return next(error);
  }
});

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function buildRevenueByPeriod(rows, now = new Date()) {
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Build ordered 6-month slots
  const slots = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date(currentYear, currentMonth - i, 1);
    slots.push({
      year: date.getFullYear(),
      month: date.getMonth(),
      period: MONTH_NAMES[date.getMonth()],
      amount: 0,
    });
  }

  // Fill in the DB-aggregated amounts
  for (const row of rows) {
    const d = new Date(row.month);
    const slot = slots.find((s) => s.year === d.getFullYear() && s.month === d.getMonth());
    if (slot) slot.amount = Number(row.total);
  }

  return slots.map(({ period, amount }) => ({ period, amount }));
}

export default router;

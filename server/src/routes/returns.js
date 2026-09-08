import { Router } from 'express';
import models, { sequelize } from '../models/index.js';
import { computeTax } from '../logic/tax.js';
import { validateIncomeDeclaration } from '../logic/validation.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { serializeDeclaration, serializePayment, serializeTaxReturn } from '../utils/serialize.js';

const router = Router();

router.post('/', requireAuth, requireRole('taxpayer'), async (req, res, next) => {
  const validation = validateIncomeDeclaration(req.body);
  if (!validation.valid) return res.status(400).json(validation);

  try {
    const result = computeTax(req.body);
    const payload = {
      grossIncome: req.body.grossIncome,
      employmentIncome: req.body.employmentIncome || 0,
      businessIncome: req.body.businessIncome || 0,
      pensionContribution: req.body.pensionContribution || 0,
      lifeAssurance: req.body.lifeAssurance || 0,
      nhfContribution: req.body.nhfContribution || 0,
      rentPaidAnnual: req.body.rentPaidAnnual || 0,
      nhisContribution: req.body.nhisContribution || 0,
      housingLoanInterest: req.body.housingLoanInterest || 0,
    };

    const created = await sequelize.transaction(async (transaction) => {
      const taxReturn = await models.TaxReturn.create(
        {
          userId: req.auth.sub,
          filingYear: req.body.filingYear || new Date().getFullYear(),
          filingStatus: 'submitted',
          grossIncome: payload.grossIncome,
          reliefAmount: result.reliefAmount,
          reliefBasis: result.reliefBasis,
          totalDeductions: result.totalDeductions,
          taxableIncome: result.taxableIncome,
          bandBreakdown: result.bandBreakdown,
          taxPayable: result.taxPayable,
          effectiveRate: result.effectiveRate,
          submittedAt: new Date(),
        },
        { transaction },
      );
      const declaration = await models.IncomeDeclaration.create({ taxReturnId: taxReturn.id, ...payload }, { transaction });
      return { taxReturn, declaration };
    });

    return res.status(201).json({
      taxReturn: serializeTaxReturn(created.taxReturn),
      declaration: serializeDeclaration(created.declaration),
      computedResult: result,
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const taxReturn = await models.TaxReturn.findByPk(req.params.id, {
      include: [
        { model: models.IncomeDeclaration, as: 'incomeDeclaration' },
        { model: models.Payment, as: 'payment' },
      ],
    });
    if (!taxReturn) return res.status(404).json({ message: 'Tax return not found.' });
    if (req.auth.role !== 'admin' && taxReturn.userId !== req.auth.sub) {
      return res.status(403).json({ message: 'You are not allowed to access this tax return.' });
    }
    return res.json({
      taxReturn: serializeTaxReturn(taxReturn),
      declaration: serializeDeclaration(taxReturn.incomeDeclaration),
      payment: serializePayment(taxReturn.payment),
      computedResult: {
        reliefAmount: Number(taxReturn.reliefAmount),
        reliefBasis: taxReturn.reliefBasis,
        totalDeductions: Number(taxReturn.totalDeductions),
        taxableIncome: Number(taxReturn.taxableIncome),
        bandBreakdown: taxReturn.bandBreakdown,
        taxPayable: Number(taxReturn.taxPayable),
        effectiveRate: Number(taxReturn.effectiveRate),
      },
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/user/:userId/list', requireAuth, async (req, res, next) => {
  try {
    if (req.auth.role !== 'admin' && req.params.userId !== req.auth.sub) {
      return res.status(403).json({ message: 'You are not allowed to access these tax returns.' });
    }
    const returns = await models.TaxReturn.findAll({
      where: { userId: req.params.userId },
      order: [['createdAt', 'DESC']],
    });
    return res.json({ returns: returns.map(serializeTaxReturn) });
  } catch (error) {
    return next(error);
  }
});

export default router;

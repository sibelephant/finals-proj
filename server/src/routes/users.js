import { Router } from 'express';
import models from '../models/index.js';
import { requireAuth } from '../middleware/auth.js';
import { serializeTaxReturn } from '../utils/serialize.js';

const router = Router();

router.get('/:id/returns', requireAuth, async (req, res, next) => {
  try {
    if (req.auth.role !== 'admin' && req.params.id !== req.auth.sub) {
      return res.status(403).json({ message: 'You are not allowed to access these tax returns.' });
    }
    const returns = await models.TaxReturn.findAll({ where: { userId: req.params.id }, order: [['createdAt', 'DESC']] });
    return res.json({ returns: returns.map(serializeTaxReturn) });
  } catch (error) {
    return next(error);
  }
});

export default router;

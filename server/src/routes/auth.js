import { Router } from 'express';
import models from '../models/index.js';
import { generateTIN, hashPassword, signToken, verifyPassword } from '../logic/auth.js';
import { validateRegistration } from '../logic/validation.js';
import { serializeUser } from '../utils/serialize.js';

const router = Router();

router.post('/register', async (req, res, next) => {
  try {
    const validation = validateRegistration(req.body);
    if (!validation.valid) return res.status(400).json(validation);

    const existing = await models.User.findOne({ where: { email: req.body.email } });
    if (existing) return res.status(409).json({ message: 'Email address is already registered.' });

    const user = await models.User.create({
      fullName: req.body.fullName,
      email: req.body.email,
      passwordHash: await hashPassword(req.body.password),
      phone: req.body.phone,
      address: req.body.address,
      tin: generateTIN(),
      role: 'taxpayer',
      complianceStatus: 'pending',
    });
    const token = signToken({ sub: user.id, role: user.role });
    return res.status(201).json({ user: serializeUser(user), token });
  } catch (error) {
    return next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required.' });

    const user = await models.User.findOne({ where: { email } });
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }
    const token = signToken({ sub: user.id, role: user.role });
    return res.json({ user: serializeUser(user), token });
  } catch (error) {
    return next(error);
  }
});

export default router;
